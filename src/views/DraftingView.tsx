import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Download, Eye, History, ListTree, PenLine, Printer, SearchCheck, Sparkles, TableProperties } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { callAi, download, today, wordCount } from '../lib/api';
import type { SectionValidationStep } from '../types/sam';
import { Badge, Button, Markdown, PageHeader, Panel, Progress, Segmented, Sheet, TextArea, Thinking, cx } from '../components/ui';

const STEPS: { step: SectionValidationStep; label: string }[] = [
  { step: 1, label: 'Consignes et sources' },
  { step: 2, label: 'Plan' },
  { step: 3, label: 'Données manquantes' },
  { step: 4, label: 'Premier jet' },
  { step: 5, label: 'Références' },
  { step: 6, label: 'Relecture critique' },
  { step: 7, label: 'Tes retouches' },
  { step: 8, label: 'Validée' },
];

export const DraftingView: React.FC = () => {
  const { data, updateSection } = useSam();
  const { toast, ask, confirm } = useUi();
  const [selId, setSelId] = useState(data.sections[0]?.id || '');
  const [busy, setBusy] = useState<number | null>(null);
  const [instructions, setInstructions] = useState('');
  const [preview, setPreview] = useState<'edit' | 'read'>('edit');
  const [history, setHistory] = useState(false);
  const s = data.sections.find((x) => x.id === selId) || data.sections[0];
  if (!s) return null;
  const words = wordCount(s.draftContent);

  const run = async (step: SectionValidationStep) => {
    setBusy(step);
    try {
      const r = await callAi<{ result: string }>('draft', {
        sectionTitle: s.title,
        stepNumber: step,
        currentOutline: s.outline,
        existingDraft: s.draftContent,
        instructions: instructions || `Contexte : ${data.profile.topic}. Veiller à la précision bioclimatique.`,
      });
      if (step === 2) updateSection(s.id, { outline: r.result, currentStep: 3 });
      else if (step === 3) updateSection(s.id, { missingData: [r.result], currentStep: 4 });
      else if (step === 4) {
        const versions = s.draftContent
          ? [...s.versions, { version: s.versions.length + 1, timestamp: new Date().toISOString(), content: s.draftContent, notes: 'Avant un nouveau jet de SAM' }]
          : s.versions;
        updateSection(s.id, { draftContent: r.result, versions, currentStep: 5 });
      } else if (step === 6) updateSection(s.id, { verificationPoints: [r.result], currentStep: 7 });
      setInstructions('');
      toast(step === 4 ? 'Premier jet prêt. Relis-le et reprends-le à ta façon.' : 'C’est fait.');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const validate = () => {
    updateSection(s.id, {
      currentStep: 8,
      isValidatedByDonald: true,
      versions: [...s.versions, { version: s.versions.length + 1, timestamp: new Date().toISOString(), content: s.draftContent, notes: 'Version validée' }],
    });
    toast(`« ${s.title} » validée.`);
  };

  const exportWord = () => {
    const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${esc(s.title)}</title>
<style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;margin:2.5cm}h1{font-size:18pt}p{text-align:justify;text-indent:1.25cm;margin:0 0 8pt}.meta{font-size:10pt;color:#555;margin-bottom:24pt}</style></head>
<body><div class='meta'><b>Auteur :</b> ${esc(data.profile.name)} — ${esc(data.profile.degree)}<br><b>Sujet :</b> ${esc(data.profile.topic)}<br><b>Établissement :</b> ${esc(data.profile.university)}<br><b>Export :</b> ${new Date().toLocaleDateString('fr-FR')}</div>
<h1>${esc(s.title)}</h1>${s.draftContent.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}</body></html>`;
    download(`Memoire_${s.code}_${today()}.doc`, html, 'application/msword;charset=utf-8');
  };

  const actions: { step: SectionValidationStep; label: string; icon: React.ReactNode; primary?: boolean }[] = [
    { step: 2, label: 'Proposer un plan', icon: <ListTree className="h-4 w-4" /> },
    { step: 3, label: 'Lister les données manquantes', icon: <TableProperties className="h-4 w-4" /> },
    { step: 4, label: 'Rédiger un premier jet', icon: <PenLine className="h-4 w-4" />, primary: true },
    { step: 6, label: 'Faire une relecture critique', icon: <SearchCheck className="h-4 w-4" /> },
  ];

  return (
    <div>
      <PageHeader
        title="Atelier d’écriture"
        description="Section par section, en huit étapes. SAM propose, tu décides de chaque mot."
        actions={
          <>
            <Button size="sm" variant="ghost" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Imprimer</Button>
            <Button size="sm" icon={<Download className="h-4 w-4" />} onClick={exportWord}>Word</Button>
          </>
        }
      />

      <div className="scrollbar-none -mx-5 mb-6 flex gap-5 overflow-x-auto border-b border-line px-5 md:mx-0 md:px-0">
        {data.sections.map((x) => (
          <button
            key={x.id}
            onClick={() => setSelId(x.id)}
            className={cx(
              'flex shrink-0 items-center gap-2 border-b-2 px-1 pb-2 text-[0.92rem] transition',
              x.id === s.id ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-3 hover:text-ink',
            )}
          >
            {x.isValidatedByDonald && <CheckCircle2 className="h-4 w-4 text-feuille" />}
            {x.title}
          </button>
        ))}
      </div>

      {/* Les 8 étapes */}
      <Panel tone="plain" className="no-print mb-6 py-1">
        <div className="scrollbar-none overflow-x-auto">
          <ol className="flex min-w-[640px] items-start">
            {STEPS.map((st, i) => {
              const done = s.isValidatedByDonald || s.currentStep > st.step;
              const cur = !s.isValidatedByDonald && s.currentStep === st.step;
              return (
                <li key={st.step} className="relative flex flex-1 flex-col items-center text-center">
                  {i > 0 && (
                    <span className={cx('absolute top-[15px] right-1/2 h-0.5 w-full', done || cur ? 'bg-feuille' : 'bg-line')} aria-hidden />
                  )}
                  <button
                    onClick={() => updateSection(s.id, { currentStep: st.step })}
                    className={cx(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full font-display text-[0.8rem] font-semibold transition',
                      done && 'bg-ink text-paper',
                      cur && 'bg-soleil text-[#1a1b25] ring-4 ring-soleil/25',
                      !done && !cur && 'border border-line bg-sheet text-ink-3',
                    )}
                    aria-current={cur ? 'step' : undefined}
                  >
                    {st.step}
                  </button>
                  <span className={cx('mt-1.5 px-1 text-[0.78rem] leading-tight', cur ? 'font-semibold text-ink' : 'text-ink-3')}>{st.label}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented size="sm" value={preview} onChange={setPreview} options={[{ value: 'edit', label: 'Écrire' }, { value: 'read', label: <><Eye className="h-3.5 w-3.5" /> Lire</> }]} />
            <div className="flex min-w-[180px] flex-1 items-center gap-3">
              <Progress value={(words / (s.targetWordCount || 1)) * 100} tone="adire" className="flex-1" />
              <span className="text-sm text-ink-2 tabular-nums">{words.toLocaleString('fr-FR')} / {s.targetWordCount.toLocaleString('fr-FR')} mots</span>
            </div>
            <Button size="sm" variant="ghost" icon={<History className="h-4 w-4" />} onClick={() => setHistory(true)}>
              {s.versions.length} version{s.versions.length > 1 ? 's' : ''}
            </Button>
          </div>

          <div className="rounded-[var(--radius-panel)] border border-line bg-sheet">
            <div className="px-5 pt-6 pb-2 md:px-14 md:pt-12">
              <p className="text-sm text-ink-3">{s.chapter}</p>
              <h2 className="manuscript mt-1 text-[1.5rem] font-semibold leading-tight md:text-[1.8rem]">{s.title}</h2>
            </div>
            {busy === 4 ? (
              <div className="px-5 pb-8 md:px-14"><Thinking label="SAM rédige un premier jet…" detail="Style académique, transitions, chiffres à compléter entre crochets." /></div>
            ) : preview === 'read' ? (
              <div className="manuscript max-w-[68ch] px-5 pb-10 whitespace-pre-wrap md:px-14 md:pb-14">
                {s.draftContent || <span className="text-ink-3 italic">Page encore blanche.</span>}
              </div>
            ) : (
              <textarea
                value={s.draftContent}
                onChange={(e) => updateSection(s.id, { draftContent: e.target.value })}
                placeholder="Écris ici, ou demande un premier jet à SAM à partir de ton plan…"
                className="manuscript block min-h-[52dvh] w-full resize-y bg-transparent px-5 pb-10 placeholder:text-ink-3 focus:outline-none md:px-14 md:pb-14"
              />
            )}
          </div>

          <Panel tone={s.isValidatedByDonald ? 'plain' : 'sheet'} className={cx('flex flex-wrap items-center justify-between gap-3 p-4 md:px-6', s.isValidatedByDonald && 'bg-feuille-soft border border-feuille/30')}>
            <p className="text-[0.95rem] text-ink">
              {s.isValidatedByDonald ? 'Section validée : elle rejoint ton manuscrit final.' : 'Quand le texte te ressemble, valide la section.'}
            </p>
            <Button variant="success" size="sm" icon={<CheckCircle2 className="h-4 w-4" />} onClick={validate} disabled={!s.draftContent.trim()}>
              {s.isValidatedByDonald ? 'Valider à nouveau' : 'Valider cette version'}
            </Button>
          </Panel>
        </div>

        {/* Copilote */}
        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <Panel tone="sam" className="p-5">
            <p className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-adire" /> SAM t’aide sur cette section</p>
            <TextArea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Une consigne ? Ex. insiste sur la critique du béton armé à Cotonou…"
              className="mt-3 bg-sheet"
            />
            <div className="mt-3 space-y-2">
              {actions.map((a) => (
                <Button
                  key={a.step}
                  variant={a.primary ? 'sam' : 'secondary'}
                  className="w-full justify-start"
                  icon={a.icon}
                  loading={busy === a.step}
                  disabled={busy !== null}
                  onClick={() => run(a.step)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">Plan de la section</p>
              <button
                className="text-sm font-semibold text-adire"
                onClick={async () => {
                  const p = await ask({ title: 'Modifier le plan', label: 'Plan', defaultValue: s.outline, multiline: true });
                  if (p !== null) updateSection(s.id, { outline: p });
                }}
              >
                Modifier
              </button>
            </div>
            {busy === 2 ? <Thinking label="SAM construit le plan…" /> : s.outline ? <Markdown className="text-[0.92rem]">{s.outline}</Markdown> : <p className="text-sm text-ink-3">Pas encore de plan. Demande-en un à SAM.</p>}
          </Panel>

          {(s.missingData.length > 0 || s.verificationPoints.length > 0 || busy === 3 || busy === 6) && (
            <Panel className="p-5">
              <p className="mb-2 font-semibold">À vérifier avant de valider</p>
              {(busy === 3 || busy === 6) && <Thinking label="SAM vérifie…" />}
              {s.missingData.map((m, i) => (
                <div key={`m${i}`} className="mb-3">
                  <Badge tone="soleil" className="mb-1.5">Données à réunir</Badge>
                  <Markdown className="text-[0.92rem]">{m}</Markdown>
                </div>
              ))}
              {s.verificationPoints.map((m, i) => (
                <div key={`v${i}`} className="mb-3">
                  <Badge tone="laterite" className="mb-1.5">Relecture critique</Badge>
                  <Markdown className="text-[0.92rem]">{m}</Markdown>
                </div>
              ))}
            </Panel>
          )}
        </aside>
      </div>

      <Sheet open={history} onClose={() => setHistory(false)} title="Versions précédentes" description={s.title}>
        {s.versions.length === 0 ? (
          <p className="pb-6 text-ink-2">Aucune version enregistrée. Une copie est faite à chaque nouveau jet et à chaque validation.</p>
        ) : (
          <ul className="space-y-2 pb-4">
            {[...s.versions].reverse().map((v) => (
              <motion.li key={v.version} layout className="flex items-center gap-3 rounded-[var(--radius-inner)] bg-sheet-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Version {v.version}</p>
                  <p className="text-sm text-ink-3">{new Date(v.timestamp).toLocaleString('fr-FR')} · {v.notes} · {wordCount(v.content)} mots</p>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (await confirm({ title: `Restaurer la version ${v.version} ?`, description: 'Le texte actuel sera remplacé.', confirmLabel: 'Restaurer' })) {
                      updateSection(s.id, { draftContent: v.content });
                      setHistory(false);
                      toast(`Version ${v.version} restaurée.`);
                    }
                  }}
                >
                  Restaurer
                </Button>
              </motion.li>
            ))}
          </ul>
        )}
      </Sheet>
    </div>
  );
};

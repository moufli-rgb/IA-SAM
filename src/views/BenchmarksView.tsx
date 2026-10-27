import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Check, Sparkles, TriangleAlert } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { callAi } from '../lib/api';
import { Badge, Button, Empty, Field, Input, Markdown, PageHeader, Panel, Sheet, TextArea, Thinking, cx } from '../components/ui';

const JURY = [
  { k: 'Problématique', bad: 'Un simple constat, sans tension.', good: 'Une tension concrète : modernité formelle contre vulnérabilité thermique.' },
  { k: 'Lien mémoire – projet', bad: 'Une théorie détachée du dessin.', good: 'Chaque concept se lit dans une coupe ou un détail au 1/20.' },
  { k: 'Écriture', bad: 'Phrases à rallonge, « De tout temps… ».', good: 'Phrases sobres, verbes d’action, preuves chiffrées et sourcées.' },
  { k: 'Revue de littérature', bad: 'Des résumés empilés.', good: 'Confronter Givoni, CRAterre et Frampton sur un même problème.' },
];

export const BenchmarksView: React.FC = () => {
  const { data, addBenchmark } = useSam();
  const { toast } = useUi();
  const [sel, setSel] = useState(data.benchmarks[0]?.id || '');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', author: '', university: '', grade: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const name = data.profile.name;
  const thesis = data.benchmarks.find((b) => b.id === sel) || data.benchmarks[0];

  const analyze = async () => {
    if (!f.text.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await callAi<{ analysis: any }>('analyze-thesis', {
        thesisTitle: f.title,
        author: f.author,
        university: f.university,
        grade: f.grade,
        thesisText: f.text,
      });
      const a = r.analysis || {};
      const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
      const id = addBenchmark({
        title: f.title.trim() || 'Mémoire de référence',
        author: f.author.trim() || 'Auteur inconnu',
        university: f.university.trim() || 'Établissement non précisé',
        year: String(new Date().getFullYear()),
        gradeOrMention: f.grade.trim(),
        generalPlan: a.generalPlan || '',
        problemStatementMethod: a.problemStatementMethod || '',
        theoreticalFramework: a.theoreticalFramework || '',
        architecturalIntegration: a.architecturalIntegration || '',
        strengths: arr(a.strengths),
        weaknesses: arr(a.weaknesses),
        lessonsForDonald: arr(a.lessonsForDonald),
        report: a.report || '',
      });
      setSel(id);
      setOpen(false);
      setF({ title: '', author: '', university: '', grade: '', text: '' });
      toast('Analyse terminée.');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mémoires modèles"
        description="Décortique les mémoires qui ont réussi pour comprendre ce qui convainc un jury, sans jamais les copier."
        actions={<Button variant="sam" size="sm" icon={<Sparkles className="h-4 w-4" />} onClick={() => setOpen(true)}>Analyser un mémoire</Button>}
      />

      {data.benchmarks.length === 0 ? (
        <Empty
          icon={<Award className="h-8 w-8" />}
          title="Aucun mémoire analysé."
          body="Colle le sommaire ou l’introduction d’un mémoire bien noté : SAM en extrait la structure et les leçons."
          action={<Button variant="primary" size="sm" onClick={() => setOpen(true)}>Analyser un mémoire</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {data.benchmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => setSel(b.id)}
                className={cx(
                  'w-[240px] shrink-0 rounded-[var(--radius-inner)] border px-4 py-3 text-left transition lg:w-auto',
                  thesis?.id === b.id ? 'border-adire bg-adire-soft' : 'border-line/70 bg-sheet hover:border-ink-3',
                )}
              >
                <span className="line-clamp-2 font-semibold leading-snug text-ink">{b.title}</span>
                <span className="mt-1 block text-sm text-ink-3">{b.gradeOrMention || b.author}</span>
              </button>
            ))}
          </div>

          {thesis && (
            <motion.div key={thesis.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <Panel className="p-5 md:p-7">
                {thesis.gradeOrMention && <Badge tone="soleil">{thesis.gradeOrMention}</Badge>}
                <h2 className="mt-2 text-[1.25rem] leading-snug font-semibold tracking-[-0.01em] md:text-[1.4rem]">{thesis.title}</h2>
                <p className="mt-1 text-ink-2">
                  {thesis.author}, {thesis.university} ({thesis.year})
                </p>
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {thesis.generalPlan && <Part title="Le plan">{thesis.generalPlan}</Part>}
                  {thesis.problemStatementMethod && <Part title="La problématique et la méthode">{thesis.problemStatementMethod}</Part>}
                  {thesis.theoreticalFramework && <Part title="Le cadre théorique">{thesis.theoreticalFramework}</Part>}
                  {thesis.architecturalIntegration && <Part title="Du mémoire au projet">{thesis.architecturalIntegration}</Part>}
                </div>
              </Panel>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Panel className="p-5">
                  <p className="mb-2 font-semibold text-ink">Ce qui marche</p>
                  <ul className="space-y-2">
                    {thesis.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2.5 text-[0.95rem]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-feuille" />{s}</li>
                    ))}
                  </ul>
                  {thesis.weaknesses.length > 0 && (
                    <>
                      <p className="mt-5 mb-2 font-semibold text-ink">Ce qui aurait pu aller plus loin</p>
                      <ul className="space-y-2">
                        {thesis.weaknesses.map((s, i) => (
                          <li key={i} className="flex gap-2.5 text-[0.95rem] text-ink-2"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-laterite" />{s}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </Panel>
                <Panel tone="soleil" className="p-5">
                  <p className="mb-3 font-semibold text-ink">Ce que tu peux en retenir, {name}</p>
                  <ol className="space-y-3">
                    {thesis.lessonsForDonald.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[0.8rem] font-semibold text-paper">{i + 1}</span>
                        <span className="pt-0.5 font-medium text-ink">{s}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              </div>

              {thesis.report && (
                <Panel className="p-5 md:p-7">
                  <p className="mb-3 font-semibold text-ink">Rapport complet de SAM</p>
                  <Markdown>{thesis.report}</Markdown>
                </Panel>
              )}
            </motion.div>
          )}
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-1 text-[1.15rem] font-semibold">Ce que le jury regarde en premier</h2>
        <p className="mb-4 text-ink-2">Les quatre critères qui séparent un bon mémoire d’un mémoire félicité.</p>
        <div className="overflow-hidden rounded-[var(--radius-panel)] border border-line/70 bg-sheet">
          {JURY.map((j, i) => (
            <div key={j.k} className={cx('grid gap-2 p-4 md:grid-cols-[180px_1fr_1fr] md:gap-6 md:px-6', i > 0 && 'border-t border-line/70')}>
              <p className="font-semibold text-ink">{j.k}</p>
              <p className="text-[0.95rem] text-ink-3 line-through decoration-laterite/50">{j.bad}</p>
              <p className="text-[0.95rem] text-ink">{j.good}</p>
            </div>
          ))}
        </div>
      </section>

      <Sheet
        open={open}
        onClose={() => !busy && setOpen(false)}
        width="lg"
        title="Analyser un mémoire"
        description="Colle le sommaire, l’introduction ou la problématique d’un mémoire bien noté."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Annuler</Button>
            <Button variant="sam" onClick={analyze} loading={busy} disabled={!f.text.trim()}>Lancer l’analyse</Button>
          </>
        }
      >
        {busy ? (
          <div className="py-6"><Thinking label="SAM décortique le mémoire…" detail="Plan, problématique, méthode, écriture." /></div>
        ) : (
          <div className="grid gap-4 pb-3 sm:grid-cols-2">
            <Field label="Titre" className="sm:col-span-2"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Habiter l’air et la terre…" /></Field>
            <Field label="Auteur"><Input value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} /></Field>
            <Field label="Note ou mention"><Input value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} placeholder="18/20, félicitations" /></Field>
            <Field label="Établissement" className="sm:col-span-2"><Input value={f.university} onChange={(e) => setF({ ...f, university: e.target.value })} /></Field>
            <Field label="Texte du mémoire" className="sm:col-span-2">
              <TextArea rows={8} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Colle ici le texte ou le plan…" />
            </Field>
            {err && <p className="rounded-2xl bg-laterite-soft px-4 py-3 text-sm text-laterite sm:col-span-2">{err}</p>}
          </div>
        )}
      </Sheet>
    </div>
  );
};

const Part: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <p className="mb-1 text-sm font-semibold text-ink-3">{title}</p>
    <p className="whitespace-pre-wrap text-ink">{children}</p>
  </div>
);

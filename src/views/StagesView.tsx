import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, MessageCircle, Pencil, Plus, Sparkles } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { callAi, today } from '../lib/api';
import type { MemoirStage, StageStatus } from '../types/sam';
import { labelFor } from '../components/BuildingSection';
import { Badge, Button, Markdown, PageHeader, Progress, Segmented, TextArea, Thinking, cx, type Tone } from '../components/ui';
import type { Nav } from '../App';

const CATS = ['Cadrage', 'Théorie & Méthode', 'Diagnostic & Site', 'Projet TPFE', 'Finalisation'] as const;
const STATUS: { value: StageStatus; label: string }[] = [
  { value: 'not_started', label: 'À venir' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'needs_revision', label: 'À revoir' },
  { value: 'donald_validated', label: 'Validée' },
];
const tone = (s: StageStatus): Tone =>
  s === 'donald_validated' ? 'neutral' : s === 'in_progress' ? 'soleil' : s === 'needs_revision' ? 'laterite' : 'neutral';

export const StagesView: React.FC<{ focusId?: number; nav: Nav }> = ({ focusId, nav }) => {
  const { data } = useSam();
  const [cat, setCat] = useState<string>('Tous');
  const [open, setOpen] = useState<number | null>(
    focusId ?? (data.stages.find((s) => s.status === 'in_progress')?.id || null),
  );
  const refs = useRef<Record<number, HTMLLIElement | null>>({});

  useEffect(() => {
    if (focusId) setTimeout(() => refs.current[focusId]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
  }, [focusId]);

  const done = data.stages.filter((s) => s.status === 'donald_validated').length;
  const list = cat === 'Tous' ? data.stages : data.stages.filter((s) => s.category === cat);

  return (
    <div>
      <PageHeader
        title="Le parcours"
        description={`Vingt étapes, de la première intuition à la soutenance. ${done} validée${done > 1 ? 's' : ''} pour l’instant.`}
      />
      <Progress value={(done / data.stages.length) * 100} tone="feuille" className="mb-5" />

      <Segmented
        value={cat}
        onChange={setCat}
        className="mb-6"
        options={[
          { value: 'Tous', label: 'Tout', count: data.stages.length },
          ...CATS.map((c) => ({ value: c, label: c, count: data.stages.filter((s) => s.category === c).length })),
        ]}
      />

      <ol className="relative">
        {list.map((s, i) => {
          const showCat = cat === 'Tous' && (i === 0 || list[i - 1].category !== s.category);
          return (
            <React.Fragment key={s.id}>
              {showCat && (
                <li className={cx('pb-2 pl-[60px] text-sm font-semibold text-ink-3', i > 0 && 'pt-5')}>{s.category}</li>
              )}
              <li ref={(el) => { refs.current[s.id] = el; }} className="relative scroll-mt-20 pb-2.5">
                {i < list.length - 1 && <span className="absolute top-12 bottom-0 left-[21px] w-px bg-line" aria-hidden />}
                <StageRow stage={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} nav={nav} />
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </div>
  );
};

const StageRow: React.FC<{ stage: MemoirStage; open: boolean; onToggle: () => void; nav: Nav }> = ({ stage, open, onToggle, nav }) => {
  const { data, updateStage, addValidatedDecision } = useSam();
  const { ask, toast } = useUi();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [buf, setBuf] = useState({ objective: '', completedWork: '', neededInfo: '' });
  const st = stage.status;
  const title = stage.title.replace(/^\d+\.\s*/, '');

  const getAdvice = async () => {
    setLoading(true);
    try {
      const r = await callAi<{ reply: string }>('chat', {
        message: `Je travaille sur l’étape ${stage.id} : « ${stage.title} ».
Objectif : ${stage.objective}
Ce que j’ai fait : ${stage.completedWork || 'pas encore commencé'}
Difficultés : ${stage.difficulties.join(', ') || 'aucune renseignée'}

Analyse mon avancement et donne-moi 3 recommandations méthodologiques concrètes pour franchir cette étape et préparer la suivante.`,
        stageId: stage.id,
        conciseness: 'balanced',
        context: { topic: data.profile.topic, subTopic: data.profile.subTopic, decisions: data.decisions },
      });
      setAdvice(r.reply);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addDecision = async () => {
    const dec = await ask({ title: 'Nouvelle décision', description: `Pour l’étape ${stage.id}. SAM la respectera ensuite.`, label: 'Décision' });
    if (!dec) return;
    updateStage(stage.id, { validatedDecisions: [...stage.validatedDecisions, dec] });
    addValidatedDecision({
      date: today(),
      stageName: stage.title,
      decisionText: dec,
      justification: 'Validée pendant l’étude de l’étape',
      impactOnProject: 'Intégrée au mémoire et au TPFE',
    });
    toast('Décision ajoutée.');
  };

  const addTo = async (key: 'openQuestions' | 'nextActions' | 'difficulties', label: string) => {
    const v = await ask({ title: label, label });
    if (v) updateStage(stage.id, { [key]: [...stage[key], v] } as Partial<MemoirStage>);
  };

  return (
    <div className={cx('rounded-[var(--radius-panel)] transition-colors', open ? 'bg-sheet border border-line' : 'hover:bg-sheet-2/60')}>
      <button onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3.5 p-2.5 pr-4 text-left md:gap-4">
        <span
          className={cx(
            'relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] font-display text-[0.95rem] font-semibold',
            st === 'donald_validated' && 'bg-ink text-paper',
            st === 'in_progress' && 'bg-soleil text-[#1a1b25]',
            st === 'needs_revision' && 'border-2 border-laterite bg-laterite-soft text-laterite',
            st === 'not_started' && 'border border-dashed border-ink-3 bg-paper text-ink-3',
          )}
        >
          {stage.id}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cx('block font-semibold leading-snug', st === 'not_started' ? 'text-ink-2' : 'text-ink')}>{title}</span>
          {!open && <span className="mt-0.5 line-clamp-1 block text-sm text-ink-3">{stage.objective}</span>}
        </span>
        <Badge tone={tone(st)} className="hidden sm:inline-flex">{labelFor(st)}</Badge>
        <ChevronDown className={cx('h-5 w-5 shrink-0 text-ink-3 transition-transform duration-300', open && 'rotate-180')} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-5 px-4 pt-1 pb-5 md:pl-[70px] md:pr-6">
              <Segmented
                size="sm"
                value={st}
                onChange={(v) => {
                  updateStage(stage.id, { status: v });
                  if (v === 'donald_validated') toast(`Brique ${stage.id} posée.`);
                }}
                options={STATUS}
              />

              {editing ? (
                <div className="space-y-3">
                  <Editable label="Objectif" value={buf.objective} onChange={(v) => setBuf({ ...buf, objective: v })} />
                  <Editable label="Ce que j’ai fait" value={buf.completedWork} onChange={(v) => setBuf({ ...buf, completedWork: v })} rows={5} />
                  <Editable label="Ce dont j’ai besoin" value={buf.neededInfo} onChange={(v) => setBuf({ ...buf, neededInfo: v })} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => { updateStage(stage.id, buf); setEditing(false); toast('Étape mise à jour.'); }}>
                      Enregistrer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Block title="Objectif">{stage.objective}</Block>
                  <Block title="Ce dont j’ai besoin">{stage.neededInfo}</Block>
                  <Block title="Ce que j’ai fait" className="md:col-span-2">
                    {stage.completedWork || <span className="text-ink-3">Rien de consigné pour l’instant.</span>}
                  </Block>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ListBlock title="Décisions validées" items={stage.validatedDecisions} onAdd={addDecision} empty="Aucune décision ferme." />
                <ListBlock title="Prochaines actions" items={stage.nextActions} onAdd={() => addTo('nextActions', 'Prochaine action')} empty="Rien de prévu." />
                <ListBlock title="Questions ouvertes" items={stage.openQuestions} onAdd={() => addTo('openQuestions', 'Question ouverte')} empty="Aucune question en suspens." />
                <ListBlock title="Difficultés" items={stage.difficulties} onAdd={() => addTo('difficulties', 'Difficulté')} empty="Pas d’obstacle signalé." />
              </div>

              {loading && <Thinking label="SAM étudie cette étape…" />}
              {advice && !loading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[var(--radius-inner)] bg-adire-soft/60 p-4 md:p-5">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                    <Sparkles className="h-4 w-4" /> Le conseil de SAM
                  </p>
                  <Markdown>{advice}</Markdown>
                </motion.div>
              )}

              <div className="flex flex-wrap gap-2 border-t border-line/70 pt-4">
                <Button size="sm" variant="sam" icon={<Sparkles className="h-4 w-4" />} onClick={getAdvice} loading={loading}>
                  {advice ? 'Nouveau conseil' : 'Demander conseil à SAM'}
                </Button>
                <Button
                  size="sm"
                  icon={<MessageCircle className="h-4 w-4" />}
                  onClick={() => nav('chat', { stageId: stage.id, prompt: `Travaillons l’étape ${stage.id} : « ${stage.title} ». Par quoi je commence ?` })}
                >
                  En discuter
                </Button>
                {!editing && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => {
                      setBuf({ objective: stage.objective, completedWork: stage.completedWork, neededInfo: stage.neededInfo });
                      setEditing(true);
                    }}
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Block: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
  <div className={className}>
    <p className="mb-1 text-sm font-semibold text-ink-3">{title}</p>
    <div className="whitespace-pre-wrap text-ink">{children}</div>
  </div>
);

const ListBlock: React.FC<{ title: string; items: string[]; onAdd: () => void; empty: string }> = ({ title, items, onAdd, empty }) => (
  <div className="rounded-[var(--radius-inner)] bg-sheet-2/70 p-3.5">
    <div className="mb-1.5 flex items-center justify-between">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <button onClick={onAdd} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.82rem] font-semibold text-adire hover:bg-adire-soft">
        <Plus className="h-3.5 w-3.5" /> Ajouter
      </button>
    </div>
    {items.length === 0 ? (
      <p className="text-sm text-ink-3">{empty}</p>
    ) : (
      <ul className="space-y-1.5 text-[0.93rem]">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" />
            {x}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const Editable: React.FC<{ label: string; value: string; onChange: (v: string) => void; rows?: number }> = ({ label, value, onChange, rows = 3 }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-semibold text-ink-3">{label}</span>
    <TextArea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
  </label>
);

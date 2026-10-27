import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { callAi, daysUntil, formatDate, today } from '../lib/api';
import type { ProjectTask } from '../types/sam';
import { Badge, Button, Empty, Field, IconButton, Input, Markdown, PageHeader, Panel, Segmented, Select, Sheet, TextArea, Thinking, cx, type Tone } from '../components/ui';

const PRIO: Record<ProjectTask['priority'], { label: string; tone: Tone }> = {
  urgente: { label: 'Urgente', tone: 'laterite' },
  haute: { label: 'Haute', tone: 'soleil' },
  moyenne: { label: 'Moyenne', tone: 'adire' },
  basse: { label: 'Basse', tone: 'neutral' },
};

export const TasksView: React.FC = () => {
  const { data, addTask, updateTask, deleteTask } = useSam();
  const { toast, confirm } = useUi();
  const [filter, setFilter] = useState<'all' | 'a_faire' | 'en_cours' | 'termine'>('all');
  const [adding, setAdding] = useState(false);
  const active = data.stages.find((s) => s.status === 'in_progress')?.id || 1;
  const blank = { title: '', description: '', priority: 'haute' as ProjectTask['priority'], dueDate: today(), estimatedHours: 3, stageId: active };
  const [f, setF] = useState(blank);
  const [advice, setAdvice] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);

  const open = data.tasks.filter((t) => t.status !== 'termine');
  const hours = open.reduce((n, t) => n + (t.estimatedHours || 0), 0);
  const weeks = hours / (data.profile.availableHoursPerWeek || 1);
  const list = data.tasks
    .filter((t) => filter === 'all' || t.status === filter)
    .sort((a, b) => Number(a.status === 'termine') - Number(b.status === 'termine') || +new Date(a.dueDate) - +new Date(b.dueDate));

  const plan = async () => {
    setPlanning(true);
    try {
      const r = await callAi<{ scheduleAdvice: string }>('plan', {
        defenseDate: data.profile.defenseDate,
        availableHoursPerWeek: data.profile.availableHoursPerWeek,
        stages: data.stages.map((s) => ({ id: s.id, title: s.title, status: s.status })),
        tasks: data.tasks,
      });
      setAdvice(r.scheduleAdvice);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Tâches"
        description={`Organisées autour de ta soutenance${data.profile.defenseDate ? ` du ${formatDate(data.profile.defenseDate, { day: 'numeric', month: 'long' })}` : ''} et de tes ${data.profile.availableHoursPerWeek} h par semaine.`}
        actions={
          <>
            <Button size="sm" variant="sam" icon={<Sparkles className="h-4 w-4" />} onClick={plan} loading={planning}>Rééquilibrer avec SAM</Button>
            <Button size="sm" variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Nouvelle tâche</Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-3 divide-x divide-line/70 rounded-[var(--radius-panel)] border border-line/70 bg-sheet">
        <Kpi v={`${hours} h`} l="de travail restant" />
        <Kpi v={weeks < 10 ? weeks.toFixed(1).replace('.', ',') : String(Math.round(weeks))} l={`semaine${weeks >= 2 ? 's' : ''} à ton rythme`} />
        <Kpi v={String(data.tasks.length - open.length)} l={`terminée${data.tasks.length - open.length > 1 ? 's' : ''}`} />
      </div>

      {planning && <div className="mb-6"><Thinking label="SAM recalcule ton planning…" /></div>}
      <AnimatePresence>
        {advice && !planning && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <Panel tone="sam" className="relative p-5 md:p-7">
              <IconButton label="Fermer" className="absolute top-3 right-3" onClick={() => setAdvice(null)}><X className="h-4 w-4" /></IconButton>
              <p className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-adire" /> Le planning vu par SAM</p>
              <Markdown>{advice}</Markdown>
            </Panel>
          </motion.div>
        )}
      </AnimatePresence>

      <Segmented
        value={filter}
        onChange={setFilter}
        className="mb-4"
        options={[
          { value: 'all', label: 'Toutes', count: data.tasks.length },
          { value: 'a_faire', label: 'À faire', count: data.tasks.filter((t) => t.status === 'a_faire').length },
          { value: 'en_cours', label: 'En cours', count: data.tasks.filter((t) => t.status === 'en_cours').length },
          { value: 'termine', label: 'Terminées', count: data.tasks.filter((t) => t.status === 'termine').length },
        ]}
      />

      {list.length === 0 ? (
        <Empty title="Rien ici." body="Ajoute une tâche ou change de filtre." action={<Button size="sm" variant="primary" onClick={() => setAdding(true)}>Nouvelle tâche</Button>} />
      ) : (
        <motion.ul layout className="overflow-hidden rounded-[var(--radius-panel)] border border-line/70 bg-sheet">
          <AnimatePresence initial={false}>
            {list.map((t, i) => {
              const done = t.status === 'termine';
              const d = daysUntil(t.dueDate);
              const late = !done && d !== null && d < 0;
              return (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cx('flex items-start gap-3 px-4 py-4 md:px-5', i > 0 && 'border-t border-line/70')}
                >
                  <button
                    onClick={() => {
                      updateTask(t.id, { status: done ? 'a_faire' : 'termine' });
                      if (!done) toast('Tâche terminée. Bien joué.');
                    }}
                    aria-label={done ? 'Marquer à faire' : 'Marquer terminée'}
                    className={cx(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition',
                      done ? 'border-feuille bg-feuille text-white' : 'border-ink-3 hover:border-feuille',
                    )}
                  >
                    <AnimatePresence>
                      {done && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 22 }}>
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cx('font-semibold leading-snug', done ? 'text-ink-3 line-through' : 'text-ink')}>{t.title}</p>
                    {t.description && !done && <p className="mt-0.5 line-clamp-2 text-sm text-ink-2">{t.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      {!done && <Badge tone={PRIO[t.priority].tone}>{PRIO[t.priority].label}</Badge>}
                      <span className={cx(late ? 'font-semibold text-laterite' : 'text-ink-3')}>
                        {late ? `En retard · ${formatDate(t.dueDate)}` : formatDate(t.dueDate, { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-ink-3">· {t.estimatedHours} h</span>
                      {t.stageId && <span className="text-ink-3">· étape {t.stageId}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      value={t.status}
                      onChange={(e) => updateTask(t.id, { status: e.target.value as ProjectTask['status'] })}
                      aria-label="Statut"
                      className="hidden rounded-full border border-line bg-sheet px-3 py-1.5 text-sm sm:block"
                    >
                      <option value="a_faire">À faire</option>
                      <option value="en_cours">En cours</option>
                      <option value="termine">Terminée</option>
                      <option value="en_retard">En retard</option>
                    </select>
                    <IconButton
                      label="Supprimer"
                      tone="danger"
                      onClick={async () => {
                        if (await confirm({ title: 'Supprimer cette tâche ?', description: t.title, confirmLabel: 'Supprimer', danger: true })) deleteTask(t.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}

      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Nouvelle tâche"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>Annuler</Button>
            <Button variant="primary" type="submit" form="task-form" disabled={!f.title.trim()}>Créer la tâche</Button>
          </>
        }
      >
        <form
          id="task-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.title.trim()) return;
            addTask({ ...f, title: f.title.trim(), description: f.description.trim(), status: 'a_faire', reminders: [f.dueDate] });
            setF(blank);
            setAdding(false);
            toast('Tâche créée.');
          }}
          className="grid grid-cols-2 gap-4 pb-3"
        >
          <Field label="Intitulé" className="col-span-2">
            <Input autoFocus required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Rédiger la sous-partie sur l’inertie de la terre" />
          </Field>
          <Field label="Priorité">
            <Select value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as any })}>
              {Object.entries(PRIO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
          <Field label="Échéance">
            <Input type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
          </Field>
          <Field label="Durée estimée (h)">
            <Input type="number" min={0.5} step={0.5} value={f.estimatedHours} onChange={(e) => setF({ ...f, estimatedHours: Number(e.target.value) })} />
          </Field>
          <Field label="Étape">
            <Select value={f.stageId} onChange={(e) => setF({ ...f, stageId: Number(e.target.value) })}>
              {data.stages.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.title.replace(/^\d+\.\s*/, '').slice(0, 34)}</option>)}
            </Select>
          </Field>
          <Field label="Détails" className="col-span-2">
            <TextArea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Documents à consulter, livrable attendu…" />
          </Field>
        </form>
      </Sheet>
    </div>
  );
};

const Kpi: React.FC<{ v: string; l: string }> = ({ v, l }) => (
  <div className="px-3 py-4 text-center md:px-6 md:py-5 md:text-left">
    <p className="text-[1.35rem] font-semibold leading-tight text-ink tabular-nums md:text-[1.8rem]">{v}</p>
    <p className="mt-0.5 text-[0.8rem] leading-tight text-ink-2 md:text-sm">{l}</p>
  </div>
);

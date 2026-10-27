import React, { useMemo } from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { daysUntil, formatDate, wordCount } from '../lib/api';
import { BuildingSection, BrickLegend } from '../components/BuildingSection';
import { Button, PageHeader, cx } from '../components/ui';
import type { Nav } from '../App';

export const DashboardView: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { data } = useSam();
  const days = daysUntil(data.profile.defenseDate);
  const done = data.stages.filter((s) => s.status === 'donald_validated').length;
  const current =
    data.stages.find((s) => s.status === 'in_progress') ||
    data.stages.find((s) => s.status === 'needs_revision') ||
    data.stages.find((s) => s.status === 'not_started') ||
    data.stages[data.stages.length - 1];

  const upcoming = useMemo(
    () =>
      data.tasks
        .filter((t) => t.status !== 'termine')
        .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
        .slice(0, 4),
    [data.tasks],
  );
  const words = data.sections.reduce((n, s) => n + wordCount(s.draftContent), 0);
  const minutes = data.sessions.reduce((n, s) => n + (s.durationMinutes || 0), 0);

  const openQs = data.stages.flatMap((s) => s.openQuestions.map((q) => ({ q, stage: s })));
  const qod = openQs.length ? openQs[Math.floor(Date.now() / 86400000) % openQs.length] : null;

  return (
    <div>
      <PageHeader
        title="Vue d’ensemble"
        description={`${done} étape${done > 1 ? 's' : ''} sur ${data.stages.length} validée${done > 1 ? 's' : ''}${days !== null && days > 0 ? `, soutenance dans ${days} jours` : ''}.`}
      />

      {/* La coupe : chaque étape est une brique */}
      <section className="rounded-[var(--radius-panel)] bg-sheet-2/60 px-2 pt-4 pb-3 sm:px-6">
        <BuildingSection stages={data.stages} daysLeft={days} onBrickClick={(id) => nav('stages', { stageId: id })} className="mx-auto w-full max-w-[640px]" />
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-2 pt-1">
          <BrickLegend />
        </div>
      </section>

      {/* Chiffres clés, sur une seule ligne */}
      <dl className="mt-8 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
        {[
          ['Mots rédigés', words.toLocaleString('fr-FR')],
          ['Heures de travail', `${Math.round(minutes / 60)} h`],
          ['Sources', String(data.sources.length)],
          ['Décisions', String(data.decisions.length)],
        ].map(([l, v]) => (
          <div key={l}>
            <dt className="text-[0.84rem] text-ink-3">{l}</dt>
            <dd className="mt-0.5 text-[1.5rem] font-semibold tracking-[-0.01em] tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 [&>*]:min-w-0">
        {/* Étape en cours */}
        <section>
          <h2 className="text-[0.84rem] font-medium text-ink-3">Étape en cours</h2>
          <p className="mt-2 text-[1.15rem] leading-snug font-semibold">
            {current.id}. {current.title.replace(/^\d+\.\s*/, '')}
          </p>
          <p className="mt-1.5 text-ink-2">{current.objective}</p>
          {current.nextActions.length > 0 && (
            <ul className="mt-4 space-y-2">
              {current.nextActions.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-[0.95rem]">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-soleil" />
                  {a}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                nav('chat', {
                  stageId: current.id,
                  prompt: `On avance sur l’étape ${current.id} (« ${current.title} »). Où j’en suis : ${current.completedWork || 'pas encore commencé'}. Quelle est la prochaine chose concrète à faire ?`,
                })
              }
            >
              Avancer avec SAM
            </Button>
            <Button size="sm" variant="ghost" onClick={() => nav('stages', { stageId: current.id })}>
              Ouvrir l’étape
            </Button>
          </div>
        </section>

        {/* Échéances */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-[0.84rem] font-medium text-ink-3">Prochaines échéances</h2>
            <button onClick={() => nav('tasks')} className="inline-flex items-center gap-1 text-[0.84rem] text-ink-2 hover:text-ink">
              Toutes <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-ink-2">Rien d’urgent. Tu es à jour.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {upcoming.map((t) => {
                const d = daysUntil(t.dueDate);
                const late = d !== null && d < 0;
                return (
                  <li key={t.id} className="flex items-baseline gap-4 py-3">
                    <span className={cx('w-14 shrink-0 text-[0.84rem] tabular-nums', late ? 'font-medium text-laterite' : 'text-ink-3')}>
                      {formatDate(t.dueDate)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {qod && (
        <button
          onClick={() =>
            nav('chat', {
              stageId: qod.stage.id,
              prompt: `Aide-moi à répondre à cette question ouverte de mon mémoire, sans me donner la réponse toute faite : guide-moi par des questions. « ${qod.q} »`,
            })
          }
          className="mt-10 flex w-full items-start gap-3 rounded-[var(--radius-panel)] bg-soleil-soft px-5 py-4 text-left transition hover:brightness-[0.98]"
        >
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-ink-2" />
          <span>
            <span className="block text-[0.84rem] text-ink-2">Question du jour · étape {qod.stage.id}</span>
            <span className="mt-0.5 block font-serif text-[1.1rem] leading-snug">« {qod.q} »</span>
            <span className="mt-1.5 inline-flex items-center gap-1 text-[0.88rem] font-medium">
              Y réfléchir avec SAM <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
};

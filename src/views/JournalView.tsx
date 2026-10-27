import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Download, Pause, Play, Plus, Radio, Smartphone, Video } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { download, formatDate, today } from '../lib/api';
import type { SocialScript } from '../types/sam';
import { Badge, Button, Empty, PageHeader, Panel, Segmented, cx } from '../components/ui';

type Fmt = 'tiktok' | 'vlog' | 'podcast';

export const JournalView: React.FC<{ focusId?: string; onNewSession: () => void }> = ({ focusId, onNewSession }) => {
  const { data } = useSam();
  const { toast } = useUi();
  const [sel, setSel] = useState(focusId || data.sessions[0]?.id || '');
  const [fmt, setFmt] = useState<Fmt>('tiktok');
  const [copied, setCopied] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => { if (focusId) setSel(focusId); }, [focusId]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const s = data.sessions.find((x) => x.id === sel) || data.sessions[0];
  const stage = s && data.stages.find((x) => x.id === s.relatedStageId);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast('Copie impossible sur ce navigateur.', 'error');
    }
  };

  const speak = (text: string) => {
    const synth = window.speechSynthesis;
    if (!synth) return toast('La lecture audio n’est pas disponible ici.', 'error');
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    u.rate = 0.98;
    u.onend = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  };

  const exportAll = () =>
    download(
      `Journal_${data.profile.name}_${today()}.md`,
      data.sessions
        .map((x) => {
          const j = x.academicJournal;
          return `## Séance du ${x.date} (${x.durationMinutes} min)\n\n**Contexte** : ${j.context}\n\n**Objectifs** : ${j.objectives}\n\n**Actions** : ${j.actionsDone}\n\n**Résultats** : ${j.resultsAchieved}\n\n**Décisions** : ${j.validatedDecisions}\n\n**Difficultés** : ${j.difficultiesAndLimits}\n\n**Suite** : ${j.nextSteps}`;
        })
        .join('\n\n---\n\n'),
      'text/markdown',
    );

  if (!s)
    return (
      <div>
        <PageHeader title="Journal & vidéos" />
        <Empty
          icon={<Video className="h-8 w-8" />}
          title="Aucune séance racontée pour l’instant."
          body="Raconte ce que tu as fait aujourd’hui : SAM en tire ton journal de bord et trois scripts pour documenter ton parcours."
          action={<Button variant="sam" icon={<Plus className="h-4 w-4" />} onClick={onNewSession}>Raconter ma séance</Button>}
        />
      </div>
    );

  const j = s.academicJournal;
  const sc: SocialScript = fmt === 'tiktok' ? s.socialScripts.tiktok30s : fmt === 'vlog' ? s.socialScripts.vlog60s : s.socialScripts.podcastEpisode;
  const fullScript = `${sc.hook}\n\n${sc.script}${sc.hashtags?.length ? `\n\n${sc.hashtags.join(' ')}` : ''}`;

  return (
    <div>
      <PageHeader
        title="Journal & vidéos"
        description="Chaque séance devient un compte rendu pour ton encadrant et des scripts pour raconter ton aventure d’architecte."
        actions={
          <>
            <Button size="sm" variant="ghost" icon={<Download className="h-4 w-4" />} onClick={exportAll}>Exporter le journal</Button>
            <Button size="sm" variant="sam" icon={<Plus className="h-4 w-4" />} onClick={onNewSession}>Nouvelle séance</Button>
          </>
        }
      />

      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {data.sessions.map((x) => (
          <button
            key={x.id}
            onClick={() => setSel(x.id)}
            className={cx(
              'shrink-0 rounded-[var(--radius-inner)] border px-4 py-2.5 text-left transition',
              x.id === s.id ? 'border-ink bg-ink text-paper' : 'border-line/70 bg-sheet hover:border-ink-3',
            )}
          >
            <span className="block text-sm font-semibold">{formatDate(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className={cx('block text-[0.8rem]', x.id === s.id ? 'opacity-75' : 'text-ink-3')}>
              {x.durationMinutes} min{x.relatedStageId ? ` · étape ${x.relatedStageId}` : ''}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Journal académique */}
        <Panel className="p-5 md:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[1.15rem] font-semibold">Journal de bord</h2>
              <p className="text-sm text-ink-3">
                {formatDate(s.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {stage ? ` · ${stage.title}` : ''}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              icon={copied === 'j' ? <Check className="h-4 w-4 text-feuille" /> : <Copy className="h-4 w-4" />}
              onClick={() => copy('j', Object.values(j).filter(Boolean).join('\n\n'))}
            >
              {copied === 'j' ? 'Copié' : 'Copier'}
            </Button>
          </div>
          <dl className="space-y-4">
            <Entry t="Contexte et objectifs">{j.context}{j.objectives && <span className="mt-1 block text-ink-2">{j.objectives}</span>}</Entry>
            <Entry t="Ce que j’ai fait">{j.actionsDone}</Entry>
            <Entry t="Résultats">{j.resultsAchieved}</Entry>
            <div className="rounded-[var(--radius-inner)] bg-feuille-soft/70 p-4">
              <dt className="text-sm font-semibold text-feuille">Décisions prises</dt>
              <dd className="mt-1 font-medium text-ink">{j.validatedDecisions}</dd>
            </div>
            <Entry t="Difficultés et limites">{j.difficultiesAndLimits}</Entry>
            <Entry t="La suite">{j.nextSteps}</Entry>
          </dl>
        </Panel>

        {/* Scripts */}
        <div>
          <Segmented
            value={fmt}
            onChange={setFmt}
            className="mb-4"
            options={[
              { value: 'tiktok', label: <><Smartphone className="h-4 w-4" /> TikTok</> },
              { value: 'vlog', label: <><Video className="h-4 w-4" /> Vlog</> },
              { value: 'podcast', label: <><Radio className="h-4 w-4" /> Podcast</> },
            ]}
          />

          <motion.div key={`${s.id}-${fmt}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {fmt === 'tiktok' ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start lg:flex-col lg:items-center 2xl:flex-row 2xl:items-start">
                {/* Téléphone */}
                <div className="relative w-[250px] shrink-0 rounded-[38px] bg-[#1a1b25] p-2.5 shadow-[0_24px_50px_-28px_rgba(0,0,0,0.55)]">
                  <div className="relative flex aspect-[9/17] flex-col overflow-hidden rounded-[30px] bg-gradient-to-b from-[#2c2e3d] to-[#111217] p-5 text-white">
                    <span className="absolute top-2.5 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/40" />
                    <Badge className="mt-4 self-start bg-white/15 text-white">{sc.estimatedDuration}</Badge>
                    <p className="mt-auto text-[1.15rem] leading-[1.25] font-semibold">{sc.hook}</p>
                    <p className="mt-3 text-[0.8rem] text-white/70">{sc.hashtags?.slice(0, 4).join(' ')}</p>
                  </div>
                </div>
                <ScriptText sc={sc} copied={copied === fmt} onCopy={() => copy(fmt, fullScript)} />
              </div>
            ) : (
              <Panel className="p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[1.08rem] font-semibold leading-snug">{sc.title}</h3>
                  <Badge>{sc.estimatedDuration}</Badge>
                </div>
                <p className="mt-3 font-serif text-[1.1rem] italic leading-snug text-ink">« {sc.hook} »</p>
                {sc.visualNotes && (
                  <div className="mt-4 rounded-[var(--radius-inner)] bg-adire-soft/70 p-4">
                    <p className="text-sm font-semibold text-adire">Plans à tourner</p>
                    <p className="mt-1 text-[0.95rem] text-ink">{sc.visualNotes}</p>
                  </div>
                )}
                <p className={cx('mt-4 whitespace-pre-wrap text-ink', fmt === 'podcast' && 'manuscript text-[1rem]')}>{sc.script}</p>
                <p className="mt-4 border-t border-line/70 pt-3 text-sm text-ink-2"><span className="font-semibold text-ink">À retenir : </span>{sc.keyTakeaway}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" icon={copied === fmt ? <Check className="h-4 w-4 text-feuille" /> : <Copy className="h-4 w-4" />} onClick={() => copy(fmt, fullScript)}>
                    {copied === fmt ? 'Copié' : 'Copier le script'}
                  </Button>
                  {fmt === 'podcast' && (
                    <Button size="sm" variant="ghost" icon={speaking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} onClick={() => speak(`${sc.hook}. ${sc.script}`)}>
                      {speaking ? 'Arrêter' : 'Écouter un essai'}
                    </Button>
                  )}
                </div>
              </Panel>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const Entry: React.FC<{ t: string; children: React.ReactNode }> = ({ t, children }) => (
  <div>
    <dt className="text-sm font-semibold text-ink-3">{t}</dt>
    <dd className="mt-0.5 text-ink">{children}</dd>
  </div>
);

const ScriptText: React.FC<{ sc: SocialScript; copied: boolean; onCopy: () => void }> = ({ sc, copied, onCopy }) => (
  <Panel className="w-full p-5">
    <h3 className="font-semibold leading-snug">{sc.title}</h3>
    <p className="mt-3 text-sm font-semibold text-ink-3">Face caméra</p>
    <p className="mt-1 whitespace-pre-wrap text-ink">{sc.script}</p>
    <p className="mt-4 border-t border-line/70 pt-3 text-sm text-ink-2"><span className="font-semibold text-ink">À retenir : </span>{sc.keyTakeaway}</p>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {sc.hashtags?.map((h) => <span key={h} className="text-sm font-medium text-adire">{h}</span>)}
    </div>
    <Button size="sm" className="mt-4" icon={copied ? <Check className="h-4 w-4 text-feuille" /> : <Copy className="h-4 w-4" />} onClick={onCopy}>
      {copied ? 'Copié' : 'Copier le script'}
    </Button>
  </Panel>
);

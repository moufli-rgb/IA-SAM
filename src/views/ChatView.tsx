import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp,
  BookmarkPlus,
  Check,
  ChevronDown,
  Copy,
  Download,
  Lightbulb,
  ListChecks,
  Mic,
  MoreHorizontal,
  Search,
  Square,
  Target,
  Trash2,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { callAi, daysUntil, download, today } from '../lib/api';
import { useDictation } from '../lib/useDictation';
import { IconButton, Markdown, SamMark, cx } from '../components/ui';
import type { Nav } from '../App';

type Concision = 'concise' | 'balanced' | 'detailed';
const CONCISION: Record<Concision, string> = { concise: 'Courtes', balanced: 'Équilibrées', detailed: 'Détaillées' };

const greeting = () => {
  const h = new Date().getHours();
  return h < 5 || h >= 18 ? 'Bonsoir' : 'Bonjour';
};

export const ChatView: React.FC<{ initialPrompt?: string; initialStageId?: number; onConsumed: () => void; nav: Nav }> = ({
  initialPrompt,
  initialStageId,
  onConsumed,
  nav,
}) => {
  const { data, addChatMessage, clearChatHistory, addValidatedDecision } = useSam();
  const { ask, confirm, toast } = useUi();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [stageId, setStageId] = useState<number | undefined>(initialStageId);
  const [concision, setConcision] = useState<Concision>('balanced');
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const initialCount = useRef(data.chatHistory.length);
  const fired = useRef(false);
  const name = data.profile.name;
  const messages = data.chatHistory;
  const empty = !messages.some((m) => m.sender !== 'SAM');

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: initialCount.current === messages.length ? 'auto' : 'smooth' });
  }, [messages.length, sending]);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || sending) return;
    const history = data.chatHistory;
    addChatMessage({ sender: 'Donald', content: msg, stageReferenceId: stageId });
    setInput('');
    setSending(true);
    try {
      const r = await callAi<{ reply: string }>('chat', {
        message: msg,
        history,
        stageId,
        conciseness: concision,
        context: {
          topic: data.profile.topic,
          subTopic: data.profile.subTopic,
          contextLocation: data.profile.contextLocation,
          defenseDate: data.profile.defenseDate,
          decisions: data.decisions,
          stages: data.stages,
        },
      });
      addChatMessage({ sender: 'SAM', content: r.reply, stageReferenceId: stageId });
    } catch (e: any) {
      addChatMessage({ sender: 'SAM', content: `Je n’ai pas pu répondre : ${e.message}` });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && !fired.current) {
      fired.current = true;
      send(initialPrompt);
      onConsumed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDecision = async (content: string) => {
    const text = await ask({
      title: 'Enregistrer comme décision',
      description: 'SAM la respectera dans toutes vos prochaines discussions.',
      label: 'La décision, en une phrase',
      defaultValue: content.replace(/[#*_>`]/g, '').slice(0, 180),
      multiline: true,
    });
    if (!text) return;
    addValidatedDecision({
      date: today(),
      stageName: stageId ? `Étape ${stageId}` : 'Discussion avec SAM',
      decisionText: text,
      justification: 'Validée lors d’un échange avec SAM',
      impactOnProject: 'Oriente les choix de conception et de rédaction',
    });
    toast('Décision enregistrée.');
  };

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      toast('Copie impossible sur ce navigateur.', 'error');
    }
  };

  const current = data.stages.find((s) => s.status === 'in_progress') || data.stages.find((s) => s.status !== 'donald_validated') || data.stages[0];
  const done = data.stages.filter((s) => s.status === 'donald_validated').length;
  const days = daysUntil(data.profile.defenseDate);

  const suggestions = [
    { icon: Target, text: `Que faire aujourd’hui pour l’étape ${current.id} ?`, prompt: `On avance sur l’étape ${current.id} (« ${current.title} »). Où j’en suis : ${current.completedWork || 'pas encore commencé'}. Quelle est la prochaine chose concrète à faire ?` },
    { icon: Lightbulb, text: 'Éprouve mon hypothèse avec 3 questions', prompt: 'Pose-moi 3 questions critiques pour éprouver mon hypothèse de recherche, une par une.' },
    { icon: Search, text: 'Explique-moi le diagramme de Givoni', prompt: 'Explique-moi le diagramme bioclimatique de Givoni simplement, puis comment je peux l’utiliser dans mon diagnostic de site.' },
    { icon: ListChecks, text: 'Résume mes décisions validées', prompt: 'Résume les décisions que nous avons déjà validées et dis-moi s’il y a des contradictions.' },
  ];

  const composer = (
    <Composer
      value={input}
      onChange={setInput}
      onSend={() => send(input)}
      sending={sending}
      big={empty}
      stageLabel={stageId ? `Étape ${stageId}` : 'Tout le mémoire'}
      stages={data.stages.map((s) => ({ id: s.id, title: s.title }))}
      stageId={stageId}
      onStage={setStageId}
      concision={concision}
      onConcision={setConcision}
    />
  );

  if (empty) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[720px]"
          >
            <div className="mb-7 flex flex-col items-center text-center">
              <SamMark size={44} />
              <h1 className="mt-4 text-[1.4rem] leading-snug font-semibold tracking-[-0.02em] md:text-[2rem]">
                {greeting()} {name}, on avance sur quoi ?
              </h1>
            </div>
            {composer}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {suggestions.map((s, i) => (
                <button
                  key={s.text}
                  onClick={() => send(s.prompt)}
                  className={cx('items-center gap-2.5 rounded-xl border border-line px-3.5 py-2.5 text-left text-[0.9rem] text-ink-2 transition hover:bg-sheet-2 hover:text-ink', i > 1 ? 'hidden sm:flex' : 'flex')}
                >
                  <s.icon className="h-4 w-4 shrink-0 text-ink-3" />
                  {s.text}
                </button>
              ))}
            </div>
            <button
              onClick={() => nav('dashboard')}
              className="mx-auto mt-8 flex flex-col items-center gap-2 text-[0.82rem] text-ink-3 hover:text-ink-2"
            >
              <span className="flex gap-[3px]" aria-hidden>
                {data.stages.map((s) => (
                  <span
                    key={s.id}
                    className={cx(
                      'h-1.5 w-3.5 rounded-full',
                      s.status === 'donald_validated' ? 'bg-ink' : s.status === 'in_progress' ? 'bg-soleil' : s.status === 'needs_revision' ? 'bg-laterite' : 'bg-line',
                    )}
                  />
                ))}
              </span>
              <span>
                {done} étape{done > 1 ? 's' : ''} sur {data.stages.length} validée{done > 1 ? 's' : ''}
                {days !== null && days > 0 ? ` · soutenance dans ${days} jours` : ''}
              </span>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute top-2 right-3 z-10 hidden md:block">
        <IconButton label="Options" onClick={() => setMenu((m) => !m)}>
          <MoreHorizontal className="h-5 w-5" />
        </IconButton>
        <AnimatePresence>
          {menu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-sheet p-1 shadow-xl"
              >
                <MenuItem
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => {
                    download(
                      `SAM_discussion_${today()}.md`,
                      messages.map((m) => `**${m.sender === 'SAM' ? 'SAM' : name}**\n\n${m.content}`).join('\n\n---\n\n'),
                      'text/markdown',
                    );
                    setMenu(false);
                  }}
                >
                  Exporter la discussion
                </MenuItem>
                <MenuItem
                  danger
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={async () => {
                    setMenu(false);
                    if (await confirm({ title: 'Effacer cette discussion ?', description: 'Les décisions enregistrées sont conservées.', confirmLabel: 'Effacer', danger: true })) clearChatHistory();
                  }}
                >
                  Effacer
                </MenuItem>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <div className="mx-auto max-w-[720px] space-y-7">
          {messages.map((m, i) => {
            const isSam = m.sender === 'SAM';
            const isNew = i >= initialCount.current;
            return (
              <motion.div
                key={m.id}
                initial={isNew ? { opacity: 0, y: 8 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={cx('flex gap-3', !isSam && 'justify-end')}
              >
                {isSam ? (
                  <>
                    <SamMark size={28} className="mt-0.5" />
                    <div className="group min-w-0 flex-1">
                      <Markdown>{m.content}</Markdown>
                      <div className="mt-1.5 flex gap-0.5 text-ink-3 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                        <IconButton label={copied === m.id ? 'Copié' : 'Copier'} className="h-8 w-8" onClick={() => copy(m.id, m.content)}>
                          {copied === m.id ? <Check className="h-4 w-4 text-feuille" /> : <Copy className="h-4 w-4" />}
                        </IconButton>
                        <IconButton label="En faire une décision" className="h-8 w-8" onClick={() => saveDecision(m.content)}>
                          <BookmarkPlus className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="max-w-[85%] rounded-[20px] bg-sheet-2 px-4 py-2.5 text-[1rem] leading-relaxed whitespace-pre-wrap">{m.content}</div>
                )}
              </motion.div>
            );
          })}
          <AnimatePresence>
            {sending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                <SamMark size={28} thinking />
                <span className="text-[0.92rem] text-ink-3">SAM réfléchit…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="pb-safe shrink-0 bg-paper px-3 pt-1 pb-2 md:px-4">
        <div className="mx-auto max-w-[720px]">
          {composer}
          <p className="mt-1.5 text-center text-[0.75rem] text-ink-3">SAM peut se tromper. Vérifie les chiffres et les références importantes.</p>
        </div>
      </div>
    </div>
  );
};

const MenuItem: React.FC<{ icon: React.ReactNode; onClick: () => void; children: React.ReactNode; danger?: boolean }> = ({ icon, onClick, children, danger }) => (
  <button onClick={onClick} className={cx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[0.9rem] hover:bg-sheet-2', danger ? 'text-laterite' : 'text-ink')}>
    {icon}
    {children}
  </button>
);

/* ---------------------------------------------------------------- Zone de saisie */
const Composer: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  big: boolean;
  stageLabel: string;
  stages: { id: number; title: string }[];
  stageId?: number;
  onStage: (v?: number) => void;
  concision: Concision;
  onConcision: (c: Concision) => void;
}> = ({ value, onChange, onSend, sending, big, stageLabel, stages, stageId, onStage, concision, onConcision }) => {
  const ta = useRef<HTMLTextAreaElement>(null);
  const dict = useDictation((t) => onChange(value ? `${value} ${t}` : t));

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 220) + 'px';
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="rounded-[22px] border border-line bg-sheet shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] transition focus-within:border-ink-3"
    >
      <textarea
        ref={ta}
        rows={big ? 2 : 1}
        value={value}
        autoFocus={big && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={dict.listening ? 'Je t’écoute…' : 'Écris à SAM…'}
        className="block max-h-[220px] w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[1rem] leading-relaxed placeholder:text-ink-3 focus:outline-none"
      />
      <div className="flex items-center gap-1 px-2 pb-2">
        <Chip label={stageLabel}>
          <select
            value={stageId ?? ''}
            onChange={(e) => onStage(e.target.value ? Number(e.target.value) : undefined)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Centrer sur une étape"
          >
            <option value="">Tout le mémoire</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </Chip>
        <Chip label={CONCISION[concision]} className="hidden sm:inline-flex">
          <select value={concision} onChange={(e) => onConcision(e.target.value as Concision)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Longueur des réponses">
            {Object.entries(CONCISION).map(([k, v]) => (
              <option key={k} value={k}>Réponses {v.toLowerCase()}</option>
            ))}
          </select>
        </Chip>
        <span className="flex-1" />
        {dict.supported && (
          <button
            type="button"
            onClick={dict.toggle}
            aria-label={dict.listening ? 'Arrêter la dictée' : 'Dicter'}
            className={cx('flex h-9 w-9 items-center justify-center rounded-full transition', dict.listening ? 'bg-laterite text-white' : 'text-ink-2 hover:bg-sheet-2')}
          >
            {dict.listening ? <Square className="h-3.5 w-3.5" fill="currentColor" /> : <Mic className="h-[18px] w-[18px]" />}
          </button>
        )}
        <button
          type="submit"
          disabled={!value.trim() || sending}
          aria-label="Envoyer"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition active:scale-95 disabled:bg-line disabled:text-ink-3"
        >
          <ArrowUp className="h-[18px] w-[18px]" />
        </button>
      </div>
    </form>
  );
};

const Chip: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <span className={cx('relative inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[0.82rem] text-ink-2 hover:bg-sheet-2', className)}>
    <span className="max-w-[9rem] truncate">{label}</span>
    <ChevronDown className="h-3.5 w-3.5 text-ink-3" />
    {children}
  </span>
);

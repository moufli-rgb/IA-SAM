import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowUp,
  BookmarkPlus,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Paperclip,
  X,
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
import { chatStream, daysUntil, download, today } from '../lib/api';
import { ACCEPT, MAX_TOTAL_BYTES, prepareFile, toHistory, toPayload, totalSize, type PreparedFile } from '../lib/attachments';
import type { MessageAttachment } from '../types/sam';
import { useDictation } from '../lib/useDictation';
import { IconButton, Markdown, SamMark, cx } from '../components/ui';
import { InstallBanner } from '../components/Install';
import type { Nav } from '../App';

type Concision = 'concise' | 'balanced' | 'detailed';

/** Résumé compact des discussions et séances passées, envoyé à SAM pour qu'elle s'en souvienne. */
function buildMemory(data: ReturnType<typeof useSam>['data']) {
  const clean = (t: string) => t.replace(/[#*_>`]/g, '').replace(/\s+/g, ' ').trim();
  const chats = (data.archivedChats || []).slice(0, 8).map((c) => {
    const asked = c.messages.filter((m) => m.sender !== 'SAM').slice(0, 3).map((m) => clean(m.content).slice(0, 120));
    const lastReply = [...c.messages].reverse().find((m) => m.sender === 'SAM' && !m.content.startsWith('Je n’ai pas pu répondre'));
    return {
      date: c.updatedAt.slice(0, 10),
      title: c.title,
      summary: `questions : ${asked.join(' / ')}${lastReply ? ` — dernière réponse de SAM : ${clean(lastReply.content).slice(0, 260)}` : ''}`,
    };
  });
  const sessions = data.sessions.slice(0, 5).map((x) => ({
    date: x.date,
    results: clean(x.academicJournal.resultsAchieved || ''),
    next: clean(x.academicJournal.nextSteps || ''),
  }));
  return { chats, sessions };
}
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
  const { data, addChatMessage, clearChatHistory, addValidatedDecision, openChat } = useSam();
  const { ask, confirm, toast } = useUi();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [stageId, setStageId] = useState<number | undefined>(initialStageId);
  const [concision, setConcision] = useState<Concision>('balanced');
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [files, setFiles] = useState<PreparedFile[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [streamText, setStreamText] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const initialCount = useRef(data.chatHistory.length);
  const fired = useRef(false);
  const name = data.profile.name;
  const messages = data.chatHistory;
  const empty = !messages.some((m) => m.sender !== 'SAM');

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: initialCount.current === messages.length ? 'auto' : 'smooth' });
  }, [messages.length, sending]);

  // Suit le texte pendant qu'il arrive, sans brusquer si l'utilisateur remonte lire.
  useEffect(() => {
    const el = listRef.current;
    if (!el || streamText === null) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight;
  }, [streamText]);

  const addFiles = async (list: FileList | File[]) => {
    const incoming = Array.from(list).slice(0, 6);
    if (!incoming.length) return;
    setPreparing(true);
    const ready: PreparedFile[] = [];
    for (const f of incoming) {
      try {
        ready.push(await prepareFile(f));
      } catch (e: any) {
        toast(e.message, 'error');
      }
    }
    setPreparing(false);
    setFiles((prev) => {
      const next = [...prev, ...ready].slice(0, 6);
      if (totalSize(next) > MAX_TOTAL_BYTES) {
        toast('Trop lourd pour un seul message (3 Mo maximum). Envoie les fichiers en plusieurs fois.', 'error');
        return prev;
      }
      return next;
    });
  };

  const send = async (text: string) => {
    const msg = text.trim();
    const attached = files;
    if ((!msg && !attached.length) || sending || preparing) return;
    // L'historique envoyé à SAM mentionne les pièces jointes passées (sans les renvoyer).
    const history = data.chatHistory.map((m) =>
      m.attachments?.length ? { ...m, content: `${m.content}\n[Pièces jointes : ${m.attachments.map((a) => a.name).join(', ')}]` } : m,
    );
    addChatMessage({
      sender: 'Donald',
      content: msg,
      stageReferenceId: stageId,
      ...(attached.length ? { attachments: attached.map(toHistory) } : {}),
    });
    setInput('');
    setFiles([]);
    setSending(true);
    setStreamText('');
    try {
      const reply = await chatStream(
        {
          message: msg || 'Voici des pièces jointes : analyse-les pour mon mémoire.',
          attachments: attached.map(toPayload),
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
            memory: buildMemory(data),
          },
        },
        (t) => setStreamText(t),
      );
      addChatMessage({ sender: 'SAM', content: reply || 'Je n’ai pas pu formuler de réponse. Peux-tu reformuler ?', stageReferenceId: stageId });
    } catch (e: any) {
      addChatMessage({ sender: 'SAM', content: `Je n’ai pas pu répondre : ${e.message}` });
    } finally {
      setStreamText(null);
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
      files={files}
      preparing={preparing}
      onAddFiles={addFiles}
      onRemoveFile={(id) => setFiles((f) => f.filter((x) => x.id !== id))}
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
                {greeting()} {name}, on avance sur quoi ?
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
            <InstallBanner className="mt-5" />
            {(data.archivedChats || []).length > 0 && (
              <div className="mt-6">
                <p className="mb-1.5 px-1 text-[0.82rem] font-medium text-ink-3">Reprendre une discussion</p>
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                  {(data.archivedChats || []).slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => openChat(c.id)}
                        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[0.9rem] hover:bg-sheet-2"
                      >
                        <span className="truncate text-ink">{c.title}</span>
                        <span className="shrink-0 text-[0.78rem] text-ink-3">
                          {new Date(c.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
                  <div className="flex max-w-[85%] flex-col items-end gap-1.5">
                    {m.attachments?.length ? <SentAttachments items={m.attachments} /> : null}
                    {m.content && (
                      <div className="rounded-[20px] bg-sheet-2 px-4 py-2.5 text-[1rem] leading-relaxed whitespace-pre-wrap">{m.content}</div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
          <AnimatePresence>
            {sending && (
              streamText ? (
                <div className="flex gap-3">
                  <SamMark size={28} thinking className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <Markdown>{streamText}</Markdown>
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                  <SamMark size={28} thinking />
                  <span className="text-[0.92rem] text-ink-3">SAM réfléchit…</span>
                </motion.div>
              )
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
  files: PreparedFile[];
  preparing: boolean;
  onAddFiles: (f: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  big: boolean;
  stageLabel: string;
  stages: { id: number; title: string }[];
  stageId?: number;
  onStage: (v?: number) => void;
  concision: Concision;
  onConcision: (c: Concision) => void;
}> = ({ value, onChange, onSend, sending, files, preparing, onAddFiles, onRemoveFile, big, stageLabel, stages, stageId, onStage, concision, onConcision }) => {
  const ta = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const canSend = (!!value.trim() || files.length > 0) && !sending && !preparing;
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
        if (canSend) onSend();
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragging(false);
        onAddFiles(e.dataTransfer.files);
      }}
      className={cx(
        'rounded-[22px] border bg-sheet shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] transition focus-within:border-ink-3',
        dragging ? 'border-adire ring-4 ring-adire/15' : 'border-line',
      )}
    >
      {(files.length > 0 || preparing) && (
        <div className="scrollbar-none flex gap-2 overflow-x-auto px-3 pt-3">
          {files.map((f) => (
            <div key={f.id} className="group relative shrink-0">
              {f.thumb ? (
                <img src={f.thumb} alt={f.name} className="h-16 w-16 rounded-xl border border-line object-cover" />
              ) : (
                <div className="flex h-16 w-44 items-center gap-2 rounded-xl border border-line bg-sheet-2 px-3">
                  <FileText className="h-5 w-5 shrink-0 text-ink-2" />
                  <span className="min-w-0">
                    <span className="block truncate text-[0.82rem] font-medium text-ink">{f.name}</span>
                    <span className="block text-[0.74rem] text-ink-3">{f.kind === 'pdf' ? 'PDF' : f.kind === 'doc' ? 'Word' : 'Texte'}</span>
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemoveFile(f.id)}
                aria-label={`Retirer ${f.name}`}
                className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-paper shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {preparing && <div className="flex h-16 w-16 shrink-0 animate-pulse items-center justify-center rounded-xl bg-sheet-2 text-[0.72rem] text-ink-3">…</div>}
        </div>
      )}
      <textarea
        ref={ta}
        rows={big ? 2 : 1}
        value={value}
        autoFocus={big && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          const pasted = Array.from(e.clipboardData.files || []);
          if (pasted.length) {
            e.preventDefault();
            onAddFiles(pasted);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder={dict.listening ? 'Je t’écoute…' : 'Écris à SAM…'}
        className="block max-h-[220px] w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[1rem] leading-relaxed placeholder:text-ink-3 focus:outline-none"
      />
      <div className="flex items-center gap-1 px-2 pb-2">
        <input
          ref={picker}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onAddFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => picker.current?.click()}
          aria-label="Ajouter une image ou un fichier"
          title="Ajouter une image ou un fichier (PDF, Word, texte)"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 transition hover:bg-sheet-2"
        >
          <Paperclip className="h-[18px] w-[18px]" />
        </button>
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
        <span className="hidden sm:block">
          <Chip label={CONCISION[concision]}>
            <select value={concision} onChange={(e) => onConcision(e.target.value as Concision)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Longueur des réponses">
              {Object.entries(CONCISION).map(([k, v]) => (
                <option key={k} value={k}>Réponses {v.toLowerCase()}</option>
              ))}
            </select>
          </Chip>
        </span>
        <span className="flex-1" />
        {dict.supported && (
          <button
            type="button"
            onClick={dict.toggle}
            aria-label={dict.listening ? 'Arrêter la dictée' : 'Dicter'}
            className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition', dict.listening ? 'bg-laterite text-white' : 'text-ink-2 hover:bg-sheet-2')}
          >
            {dict.listening ? <Square className="h-3.5 w-3.5" fill="currentColor" /> : <Mic className="h-[18px] w-[18px]" />}
          </button>
        )}
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Envoyer"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition active:scale-95 disabled:bg-line disabled:text-ink-3"
        >
          <ArrowUp className="h-[18px] w-[18px]" />
        </button>
      </div>
    </form>
  );
};

const Chip: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <span className={cx('relative inline-flex h-8 min-w-0 items-center gap-1 rounded-full px-2.5 text-[0.82rem] text-ink-2 hover:bg-sheet-2', className)}>
    <span className="max-w-[7.5rem] truncate sm:max-w-[9rem]">{label}</span>
    <ChevronDown className="h-3.5 w-3.5 text-ink-3" />
    {children}
  </span>
);

/* ---------------------------------------------------------------- Pièces jointes déjà envoyées */
const SentAttachments: React.FC<{ items: MessageAttachment[] }> = ({ items }) => (
  <div className="flex flex-wrap justify-end gap-1.5">
    {items.map((a, i) =>
      a.thumb ? (
        <img key={i} src={a.thumb} alt={a.name} className="h-28 max-w-[180px] rounded-2xl border border-line object-cover" />
      ) : (
        <span key={i} className="inline-flex max-w-[220px] items-center gap-2 rounded-xl border border-line bg-sheet px-3 py-2 text-[0.84rem]">
          <FileText className="h-4 w-4 shrink-0 text-ink-2" />
          <span className="truncate">{a.name}</span>
        </span>
      ),
    )}
  </div>
);

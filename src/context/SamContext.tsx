import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  SamProjectData,
  DonaldProfile,
  MemoirStage,
  ChatMessage,
  ReferenceSource,
  BenchmarkThesis,
  MemoirSection,
  WorkSessionLog,
  ProjectTask,
  ValidatedDecision,
} from '../types/sam';
import { defaultProjectData, starterProject } from '../data/initialData';
import { supabase, isCloud } from '../lib/supabase';
import { setStudentName, uid, download, today } from '../lib/api';

export type SyncState = 'idle' | 'saving' | 'saved' | 'error' | 'local';

interface SamContextType {
  data: SamProjectData;
  isLoading: boolean;
  isLocked: boolean;
  session: Session | null;
  needsAuth: boolean;
  /** 'denied' : compte non autorisé ; 'unconfigured' : la liste d'accès n'existe pas encore dans Supabase. */
  access: 'ok' | 'denied' | 'unconfigured';
  sync: SyncState;
  signOut: () => Promise<void>;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  updateProfile: (profile: Partial<DonaldProfile>) => void;
  updateStage: (stageId: number, updates: Partial<MemoirStage>) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
  newChat: () => void;
  openChat: (id: string) => void;
  deleteChat: (id: string) => void;
  addSource: (source: Omit<ReferenceSource, 'id' | 'createdAt'>) => void;
  removeSource: (id: string) => void;
  addBenchmark: (benchmark: Omit<BenchmarkThesis, 'id' | 'addedAt'>) => string;
  updateSection: (sectionId: string, updates: Partial<MemoirSection>) => void;
  addSessionLog: (log: Omit<WorkSessionLog, 'id'>) => string;
  addTask: (task: Omit<ProjectTask, 'id' | 'createdAt'>) => void;
  updateTask: (taskId: string, updates: Partial<ProjectTask>) => void;
  deleteTask: (taskId: string) => void;
  addValidatedDecision: (decision: Omit<ValidatedDecision, 'id'>) => void;
  removeDecision: (id: string) => void;
  exportProjectJson: () => void;
  importProjectJson: (jsonString: string) => boolean;
  resetToDefault: () => void;
}

function archiveOf(messages: ChatMessage[]) {
  const first = messages.find((m) => m.sender !== 'SAM')?.content || 'Discussion';
  return {
    id: uid('chat'),
    title: first.replace(/\s+/g, ' ').slice(0, 60),
    updatedAt: messages[messages.length - 1]?.timestamp || new Date().toISOString(),
    messages,
  };
}

const SamContext = createContext<SamContextType | undefined>(undefined);
const cacheKey = (userId?: string) => `sam_project_v2_${userId || 'local'}`;
const LEGACY_KEY = 'sam_donald_data_v1';

function readCache(userId?: string): SamProjectData | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId)) || (!userId ? localStorage.getItem(LEGACY_KEY) : null);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeCache(d: SamProjectData, userId?: string) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(d));
  } catch {
    /* stockage plein ou bloqué : la base Supabase reste la référence */
  }
}

export const SamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SamProjectData>(defaultProjectData);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isCloud);
  const [sync, setSync] = useState<SyncState>(isCloud ? 'idle' : 'local');
  const [access, setAccess] = useState<'ok' | 'denied' | 'unconfigured'>('ok');
  const hydrated = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const userId = session?.user.id;

  // ---- Auth
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // ---- Chargement du projet
  useEffect(() => {
    if (!authReady) return;
    hydrated.current = false;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      let project: SamProjectData | null = null;

      if (supabase && userId) {
        // Accès réservé : seules les adresses de la liste « allowed_emails » peuvent entrer.
        const { data: allowed, error: accessErr } = await supabase.rpc('is_allowed');
        if (cancelled) return;
        if (accessErr || allowed !== true) {
          setAccess(accessErr ? 'unconfigured' : 'denied');
          setIsLoading(false);
          return;
        }
        setAccess('ok');
        const { data: row, error } = await supabase.from('projects').select('data').eq('user_id', userId).maybeSingle();
        if (!error && row?.data) {
          project = row.data as SamProjectData;
        } else if (!error) {
          // Premier passage pour ce compte : projet vierge à son nom (jamais les données d'une autre personne).
          project = readCache(userId) || starterProject(session?.user.email);
          await supabase.from('projects').upsert({ user_id: userId, data: project });
        } else {
          console.warn('Supabase load error', error);
          project = readCache(userId);
          setSync('error');
        }
      } else if (!supabase) {
        project = readCache();
      }

      if (cancelled) return;
      if (project) {
        setData(project);
        if (project.profile?.isPinLocked && project.profile?.pinCode) setIsLocked(true);
      }
      hydrated.current = true;
      setIsLoading(false);
    }

    if (isCloud && !userId) {
      setIsLoading(false);
      return;
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authReady, userId]);

  useEffect(() => setStudentName(data.profile.name), [data.profile.name]);

  // ---- Sauvegarde : cache local immédiat + Supabase avec un léger délai
  useEffect(() => {
    if (!hydrated.current) return;
    writeCache(data, userId);
    if (!supabase || !userId) return;
    setSync('saving');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const { error } = await supabase!.from('projects').upsert({ user_id: userId, data });
      setSync(error ? 'error' : 'saved');
      if (error) console.warn('Supabase save error', error);
    }, 900);
  }, [data, userId]);

  const mutate = useCallback((fn: (prev: SamProjectData) => SamProjectData) => {
    setData((prev) => ({ ...fn(prev), lastSaved: new Date().toISOString() }));
  }, []);

  const now = () => new Date().toISOString();

  const value: SamContextType = {
    data,
    isLoading: isLoading || !authReady,
    isLocked,
    session,
    needsAuth: isCloud && authReady && !session,
    access,
    sync,
    signOut: async () => {
      hydrated.current = false;
      setAccess('ok');
      await supabase?.auth.signOut();
      setData(defaultProjectData);
    },
    unlockWithPin: (pin) => {
      if (data.profile.pinCode === pin) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    lockApp: () => data.profile.pinCode && setIsLocked(true),
    updateProfile: (p) => mutate((d) => ({ ...d, profile: { ...d.profile, ...p } })),
    updateStage: (id, u) =>
      mutate((d) => ({ ...d, stages: d.stages.map((s) => (s.id === id ? { ...s, ...u, updatedAt: now() } : s)) })),
    addChatMessage: (m) =>
      mutate((d) => ({ ...d, chatHistory: [...d.chatHistory, { ...m, id: uid('msg'), timestamp: now() }] })),
    clearChatHistory: () =>
      mutate((d) => ({
        ...d,
        chatHistory: [],
      })),
    newChat: () =>
      mutate((d) => {
        const hasUser = d.chatHistory.some((m) => m.sender !== 'SAM');
        const archived = d.archivedChats || [];
        return {
          ...d,
          archivedChats: hasUser ? [archiveOf(d.chatHistory), ...archived].slice(0, 50) : archived,
          chatHistory: [],
        };
      }),
    openChat: (id) =>
      mutate((d) => {
        const archived = d.archivedChats || [];
        const target = archived.find((c) => c.id === id);
        if (!target) return d;
        const rest = archived.filter((c) => c.id !== id);
        const hasUser = d.chatHistory.some((m) => m.sender !== 'SAM');
        return { ...d, chatHistory: target.messages, archivedChats: hasUser ? [archiveOf(d.chatHistory), ...rest] : rest };
      }),
    deleteChat: (id) => mutate((d) => ({ ...d, archivedChats: (d.archivedChats || []).filter((c) => c.id !== id) })),
    addSource: (s) => mutate((d) => ({ ...d, sources: [{ ...s, id: uid('src'), createdAt: now() }, ...d.sources] })),
    removeSource: (id) => mutate((d) => ({ ...d, sources: d.sources.filter((s) => s.id !== id) })),
    addBenchmark: (b) => {
      const id = uid('bm');
      mutate((d) => ({ ...d, benchmarks: [{ ...b, id, addedAt: now() }, ...d.benchmarks] }));
      return id;
    },
    updateSection: (id, u) =>
      mutate((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, ...u, updatedAt: now() } : s)) })),
    addSessionLog: (l) => {
      const id = uid('sess');
      mutate((d) => ({ ...d, sessions: [{ ...l, id }, ...d.sessions] }));
      return id;
    },
    addTask: (t) => mutate((d) => ({ ...d, tasks: [{ ...t, id: uid('task'), createdAt: now() }, ...d.tasks] })),
    updateTask: (id, u) => mutate((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...u } : t)) })),
    deleteTask: (id) => mutate((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),
    addValidatedDecision: (dec) => mutate((d) => ({ ...d, decisions: [{ ...dec, id: uid('dec') }, ...d.decisions] })),
    removeDecision: (id) => mutate((d) => ({ ...d, decisions: d.decisions.filter((x) => x.id !== id) })),
    exportProjectJson: () =>
      download(`SAM_sauvegarde_${data.profile.name}_${today()}.json`, JSON.stringify(data, null, 2), 'application/json'),
    importProjectJson: (json) => {
      try {
        const parsed = JSON.parse(json);
        if (parsed.profile && parsed.stages) {
          mutate(() => parsed);
          return true;
        }
      } catch {
        /* fichier invalide */
      }
      return false;
    },
    resetToDefault: () => mutate(() => defaultProjectData),
  };

  return <SamContext.Provider value={value}>{children}</SamContext.Provider>;
};

export const useSam = () => {
  const ctx = useContext(SamContext);
  if (!ctx) throw new Error('useSam must be used within a SamProvider');
  return ctx;
};

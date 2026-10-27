import React, { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  MessageCircle,
  LayoutGrid,
  Layers,
  Search,
  Library,
  Award,
  PenLine,
  Clapperboard,
  ListChecks,
  SquarePen,
  NotebookPen,
  PanelLeft,
  Menu,
  Moon,
  Sun,
  Lock,
  Trash2,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { daysUntil } from '../lib/api';
import { cx, IconButton, SamMark } from './ui';

export type ActiveTab =
  | 'chat'
  | 'dashboard'
  | 'stages'
  | 'research'
  | 'sources'
  | 'benchmarks'
  | 'drafting'
  | 'journal_scripts'
  | 'tasks'
  | 'memory_settings';

type NavItem = { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV: NavItem[][] = [
  [
    { id: 'chat', label: 'Discuter avec SAM', icon: MessageCircle },
    { id: 'dashboard', label: 'Vue d’ensemble', icon: LayoutGrid },
    { id: 'stages', label: 'Parcours', icon: Layers },
  ],
  [
    { id: 'research', label: 'Recherche', icon: Search },
    { id: 'sources', label: 'Bibliothèque', icon: Library },
    { id: 'benchmarks', label: 'Mémoires modèles', icon: Award },
  ],
  [
    { id: 'drafting', label: 'Écriture', icon: PenLine },
    { id: 'journal_scripts', label: 'Journal & vidéos', icon: Clapperboard },
    { id: 'tasks', label: 'Tâches', icon: ListChecks },
  ],
];
const ALL = NAV.flat().concat({ id: 'memory_settings', label: 'Profil & mémoire', icon: LayoutGrid });

/* Navigation par hash : le bouton retour du téléphone fonctionne. */
export function useHashTab(): [ActiveTab, (t: ActiveTab) => void] {
  const read = () => {
    const h = window.location.hash.replace(/^#\/?/, '') as ActiveTab;
    return ALL.some((i) => i.id === h) ? h : 'chat';
  };
  const [tab, setTab] = useState<ActiveTab>(read);
  useEffect(() => {
    const on = () => setTab(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (t: ActiveTab) => {
    if (t !== tab) window.location.hash = `/${t}`;
    window.scrollTo({ top: 0 });
  };
  return [tab, go];
}

function useStored<T extends string>(key: string, fallback: T | null) {
  const [v, setV] = useState<T | null>(() => {
    try {
      return (localStorage.getItem(key) as T) || fallback;
    } catch {
      return fallback;
    }
  });
  const set = (n: T | null) => {
    setV(n);
    try {
      n ? localStorage.setItem(key, n) : localStorage.removeItem(key);
    } catch { /* stockage indisponible */ }
  };
  return [v, set] as const;
}

function useTheme() {
  const [theme, setTheme] = useStored<'light' | 'dark'>('sam_theme', null);
  useEffect(() => {
    const root = document.documentElement;
    theme ? root.setAttribute('data-theme', theme) : root.removeAttribute('data-theme');
  }, [theme]);
  const isDark = theme ? theme === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return { isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') };
}

export const Shell: React.FC<{
  tab: ActiveTab;
  go: (t: ActiveTab) => void;
  onNewSession: () => void;
  children: ReactNode;
}> = ({ tab, go, onNewSession, children }) => {
  const [collapsed, setCollapsed] = useStored<'1'>('sam_sidebar_closed', null);
  const [drawer, setDrawer] = useState(false);
  const { isDark, toggle } = useTheme();
  const { newChat, data } = useSam();
  const { toast } = useUi();
  const isChat = tab === 'chat';

  useEffect(() => setDrawer(false), [tab]);

  const startChat = () => {
    if (data.chatHistory.some((m) => m.sender !== 'SAM')) toast('Discussion précédente rangée dans « Discussions récentes ».', 'info');
    newChat();
    go('chat');
    setDrawer(false);
  };

  const sidebar = (
    <Sidebar
      tab={tab}
      go={(t) => {
        go(t);
        setDrawer(false);
      }}
      onNewChat={startChat}
      onNewSession={() => {
        setDrawer(false);
        onNewSession();
      }}
      onCollapse={() => (drawer ? setDrawer(false) : setCollapsed('1'))}
      isDark={!!isDark}
      toggleTheme={toggle}
    />
  );

  return (
    <div className="flex min-h-dvh">
      {/* Barre latérale ordinateur */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 264, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-0 hidden h-dvh shrink-0 overflow-hidden border-r border-line bg-rail lg:block"
          >
            <div className="h-full w-[264px]">{sidebar}</div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Tiroir mobile */}
      <AnimatePresence>
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
            <motion.aside
              className="absolute inset-y-0 left-0 w-[82vw] max-w-[300px] bg-rail shadow-2xl"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className={cx('flex min-w-0 flex-1 flex-col', isChat && 'h-dvh')}>
        {/* Barre haute : mobile, ou ordinateur quand la barre latérale est repliée */}
        <header className={cx('sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 bg-paper/90 px-2 backdrop-blur', !collapsed && 'lg:hidden', !isChat && 'border-b border-line')}>
          <IconButton label="Menu" className="lg:hidden" onClick={() => setDrawer(true)}>
            <Menu className="h-5 w-5" />
          </IconButton>
          {collapsed && (
            <span className="hidden lg:block">
              <IconButton label="Afficher la barre latérale" onClick={() => setCollapsed(null)}>
                <PanelLeft className="h-5 w-5" />
              </IconButton>
            </span>
          )}
          <span className="flex-1 truncate px-1 text-center text-[0.95rem] font-semibold lg:text-left">
            SAM
          </span>
          <IconButton label="Nouvelle discussion" onClick={startChat}>
            <SquarePen className="h-[18px] w-[18px]" />
          </IconButton>
        </header>

        <main className={cx('min-w-0 flex-1', isChat ? 'min-h-0' : 'px-5 pt-6 pb-20 md:px-10 md:pt-10')}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cx(isChat ? 'h-full' : 'mx-auto w-full max-w-[920px]')}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const Sidebar: React.FC<{
  tab: ActiveTab;
  go: (t: ActiveTab) => void;
  onNewChat: () => void;
  onNewSession: () => void;
  onCollapse: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}> = ({ tab, go, onNewChat, onNewSession, onCollapse, isDark, toggleTheme }) => {
  const { data, openChat, deleteChat, lockApp, sync } = useSam();
  const days = daysUntil(data.profile.defenseDate);
  const recents = data.archivedChats || [];
  const firstUser = data.chatHistory.find((m) => m.sender !== 'SAM');
  const currentTitle = firstUser ? firstUser.content.replace(/\s+/g, ' ').slice(0, 60) : '';
  const name = data.profile.name || 'Toi';

  return (
    <div className="flex h-full flex-col px-3 pt-3 pb-3">
      <div className="flex items-center justify-between px-1">
        <button onClick={() => go('chat')} className="flex items-center gap-2 rounded-lg px-1.5 py-1">
          <SamMark size={28} />
          <span className="text-[1rem] font-semibold tracking-[-0.01em]">SAM</span>
        </button>
        <IconButton label="Replier la barre latérale" tone="on-rail" onClick={onCollapse}>
          <PanelLeft className="h-[18px] w-[18px]" />
        </IconButton>
      </div>

      <div className="mt-3 space-y-0.5">
        <Row icon={SquarePen} label="Nouvelle discussion" onClick={onNewChat} />
        <Row icon={NotebookPen} label="Raconter ma séance" onClick={onNewSession} />
      </div>

      <nav className="scrollbar-none mt-4 flex-1 overflow-y-auto">
        {NAV.map((group, gi) => (
          <ul key={gi} className={cx('space-y-0.5', gi > 0 && 'mt-3 border-t border-line pt-3')}>
            {group.map((it) => (
              <li key={it.id}>
                <Row icon={it.icon} label={it.label} active={tab === it.id} onClick={() => go(it.id)} />
              </li>
            ))}
          </ul>
        ))}

        <div className="mt-5">
          <p className="px-2.5 pb-1 text-[0.78rem] font-medium text-ink-3">Discussions récentes</p>
          {currentTitle || recents.length > 0 ? (
            <ul className="space-y-px">
              {currentTitle && (
                <li>
                  <button
                    onClick={() => go('chat')}
                    className={cx(
                      'block w-full truncate rounded-lg py-1.5 pr-3 pl-2.5 text-left text-[0.88rem]',
                      tab === 'chat' ? 'bg-rail-2 font-medium text-ink' : 'text-ink-2 hover:bg-rail-2 hover:text-ink',
                    )}
                    title={currentTitle}
                  >
                    {currentTitle}
                  </button>
                </li>
              )}
              {recents.slice(0, 20).map((c) => (
                <li key={c.id} className="group relative">
                  <button
                    onClick={() => {
                      openChat(c.id);
                      go('chat');
                    }}
                    className="block w-full truncate rounded-lg py-1.5 pr-8 pl-2.5 text-left text-[0.88rem] text-ink-2 hover:bg-rail-2 hover:text-ink"
                    title={c.title}
                  >
                    {c.title}
                  </button>
                  <button
                    onClick={() => deleteChat(c.id)}
                    aria-label="Supprimer la discussion"
                    className="absolute top-1/2 right-1 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-3 hover:text-laterite lg:hidden lg:group-hover:flex"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2.5 text-[0.84rem] text-ink-3">Tes discussions apparaîtront ici.</p>
          )}
        </div>
      </nav>

      <div className="mt-2 flex items-center gap-1 border-t border-line pt-2">
        <button
          onClick={() => go('memory_settings')}
          className={cx('flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-rail-2', tab === 'memory_settings' && 'bg-rail-2')}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[0.85rem] font-semibold text-paper">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.9rem] font-medium text-ink">{name}</span>
            <span className="block truncate text-[0.76rem] text-ink-3">
              {days !== null ? (days > 0 ? `Soutenance dans ${days} j` : 'Jour de soutenance') : 'Profil & mémoire'}
              {sync === 'error' ? ' · hors ligne' : ''}
            </span>
          </span>
        </button>
        {data.profile.isPinLocked && data.profile.pinCode && (
          <IconButton tone="on-rail" label="Verrouiller" onClick={lockApp}>
            <Lock className="h-4 w-4" />
          </IconButton>
        )}
        <IconButton tone="on-rail" label={isDark ? 'Thème clair' : 'Thème sombre'} onClick={toggleTheme}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </IconButton>
      </div>
    </div>
  );
};

const Row: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; onClick: () => void }> = ({
  icon: Icon,
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={cx(
      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-left text-[0.92rem] transition-colors',
      active ? 'bg-rail-2 font-medium text-ink' : 'text-ink-2 hover:bg-rail-2 hover:text-ink',
    )}
  >
    <Icon className="h-[17px] w-[17px] shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);

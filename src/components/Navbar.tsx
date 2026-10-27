import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Milestone,
  Search,
  BookOpen,
  Award,
  PenTool,
  Video,
  CheckSquare,
  Database,
  Lock,
  Mic,
  Calendar,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { useSam } from '../context/SamContext';

export type ActiveTab =
  | 'dashboard'
  | 'chat'
  | 'stages'
  | 'research'
  | 'sources'
  | 'benchmarks'
  | 'drafting'
  | 'journal_scripts'
  | 'tasks'
  | 'memory_settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickSession: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickSession,
}) => {
  const { data, lockApp } = useSam();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Compute countdown to defense
  const getDaysUntilDefense = () => {
    if (!data.profile.defenseDate) return null;
    const diff = new Date(data.profile.defenseDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysLeft = getDaysUntilDefense();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'chat' as ActiveTab, label: 'Parler à SAM', icon: MessageSquare, badge: 'IA' },
    { id: 'stages' as ActiveTab, label: '20 Étapes Mémoire', icon: Milestone },
    { id: 'research' as ActiveTab, label: 'Recherche Web', icon: Search },
    { id: 'sources' as ActiveTab, label: 'Bibliothèque', icon: BookOpen },
    { id: 'benchmarks' as ActiveTab, label: 'Mémoires Modèles', icon: Award },
    { id: 'drafting' as ActiveTab, label: 'Atelier Rédaction', icon: PenTool },
    { id: 'journal_scripts' as ActiveTab, label: 'Journal & Scripts', icon: Video, highlight: true },
    { id: 'tasks' as ActiveTab, label: 'Tâches & Délais', icon: CheckSquare },
    { id: 'memory_settings' as ActiveTab, label: 'Mémoire & Données', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      {/* Top Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-bold text-lg">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">SAM</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/20">
                Espace Privé
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Assistant de <strong className="text-slate-200">Donald</strong> • Master Architecture
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Days until defense */}
          {daysLeft !== null && (
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              <span>Soutenance : <strong className="text-white">{daysLeft > 0 ? `J-${daysLeft}` : 'Aujourd’hui !'}</strong></span>
            </div>
          )}

          {/* Quick Session button */}
          <button
            onClick={onOpenQuickSession}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:from-amber-400 hover:to-amber-500 transition active:scale-95 cursor-pointer"
            title="Consigner une séance de travail ou dicter à la voix pour générer Journal et Scripts"
          >
            <Mic className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nouvelle Séance / Dictée</span>
            <span className="sm:hidden">Séance</span>
          </button>

          {/* Lock workspace */}
          {data.profile.pinCode && (
            <button
              onClick={lockApp}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              title="Verrouiller l'espace privé de Donald"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden rounded-lg border border-slate-800 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Navigation tabs for Desktop */}
      <nav className="hidden lg:flex mx-auto max-w-7xl items-center gap-1 px-4 sm:px-6 overflow-x-auto py-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-1 rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                  {item.badge}
                </span>
              )}
              {item.highlight && !isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                    Clé
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

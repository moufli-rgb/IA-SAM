import React, { useState } from 'react';
import { SamProvider, useSam } from './context/SamContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ChatView } from './components/ChatView';
import { StagesView } from './components/StagesView';
import { ResearchView } from './components/ResearchView';
import { SourcesView } from './components/SourcesView';
import { BenchmarksView } from './components/BenchmarksView';
import { DraftingView } from './components/DraftingView';
import { JournalScriptsView } from './components/JournalScriptsView';
import { TasksView } from './components/TasksView';
import { MemorySettingsView } from './components/MemorySettingsView';
import { LockModal } from './components/LockModal';
import { QuickSessionModal } from './components/QuickSessionModal';
import { Sparkles } from 'lucide-react';

function MainApp() {
  const { isLoading, isLocked } = useSam();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isQuickSessionOpen, setIsQuickSessionOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mx-auto animate-pulse">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Initialisation de SAM...
          </h2>
          <p className="text-xs text-slate-500">
            Chargement de la mémoire académique de Donald
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Privacy lock overlay if enabled */}
      {isLocked && <LockModal />}

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickSession={() => setIsQuickSessionOpen(true)}
      />

      {/* Active Tab View */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            onOpenQuickSession={() => setIsQuickSessionOpen(true)}
          />
        )}
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'stages' && (
          <StagesView onSwitchToChatWithStage={() => setActiveTab('chat')} />
        )}
        {activeTab === 'research' && <ResearchView />}
        {activeTab === 'sources' && <SourcesView />}
        {activeTab === 'benchmarks' && <BenchmarksView />}
        {activeTab === 'drafting' && <DraftingView />}
        {activeTab === 'journal_scripts' && <JournalScriptsView />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'memory_settings' && <MemorySettingsView />}
      </main>

      {/* Quick Session Dialog */}
      <QuickSessionModal
        isOpen={isQuickSessionOpen}
        onClose={() => setIsQuickSessionOpen(false)}
        onSuccessNavigate={() => setActiveTab('journal_scripts')}
      />

      {/* Footer / Status bar */}
      <footer className="no-print border-t border-slate-900 bg-slate-950/80 py-4 text-center text-[11px] text-slate-500">
        <p>
          SAM • Système d'Accompagnement Méthodologique & Rédactionnel pour Donald • Master en Architecture
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SamProvider>
      <MainApp />
    </SamProvider>
  );
}

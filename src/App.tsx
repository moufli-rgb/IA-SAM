import React, { useState } from 'react';
import { SamProvider, useSam } from './context/SamContext';
import { UiProvider } from './context/UiContext';
import { Shell, useHashTab, type ActiveTab } from './components/Shell';
import { AccessScreen, AuthScreen, LockScreen, Splash } from './components/Gates';
import { SessionSheet } from './components/SessionSheet';
import { InstallHelp } from './components/Install';
import { DashboardView } from './views/DashboardView';
import { ChatView } from './views/ChatView';
import { StagesView } from './views/StagesView';
import { ResearchView } from './views/ResearchView';
import { SourcesView } from './views/SourcesView';
import { BenchmarksView } from './views/BenchmarksView';
import { DraftingView } from './views/DraftingView';
import { JournalView } from './views/JournalView';
import { TasksView } from './views/TasksView';
import { SettingsView } from './views/SettingsView';

/** Intentions passées d'une vue à l'autre (ex. « ouvrir le chat avec cette question »). */
export type Intent = { prompt?: string; stageId?: number; sessionId?: string };
export type Nav = (tab: ActiveTab, intent?: Intent) => void;

function Workspace() {
  const { isLoading, isLocked, needsAuth, access } = useSam();
  const [tab, go] = useHashTab();
  const [intent, setIntent] = useState<Intent>({});
  const [sessionOpen, setSessionOpen] = useState(false);

  if (isLoading) return <Splash />;
  if (needsAuth) return <AuthScreen />;
  if (access !== 'ok') return <AccessScreen reason={access} />;

  const nav: Nav = (t, i = {}) => {
    setIntent(i);
    go(t);
  };
  const consume = () => setIntent({});

  return (
    <>
      {isLocked && <LockScreen />}
      <Shell tab={tab} go={(t) => nav(t)} onNewSession={() => setSessionOpen(true)}>
        {tab === 'dashboard' && <DashboardView nav={nav} />}
        {tab === 'chat' && <ChatView initialPrompt={intent.prompt} initialStageId={intent.stageId} onConsumed={consume} nav={nav} />}
        {tab === 'stages' && <StagesView focusId={intent.stageId} nav={nav} />}
        {tab === 'research' && <ResearchView />}
        {tab === 'sources' && <SourcesView nav={nav} />}
        {tab === 'benchmarks' && <BenchmarksView />}
        {tab === 'drafting' && <DraftingView />}
        {tab === 'journal_scripts' && <JournalView focusId={intent.sessionId} onNewSession={() => setSessionOpen(true)} />}
        {tab === 'tasks' && <TasksView />}
        {tab === 'memory_settings' && <SettingsView />}
      </Shell>
      <InstallHelp />
      <SessionSheet open={sessionOpen} onClose={() => setSessionOpen(false)} onDone={(id) => nav('journal_scripts', { sessionId: id })} />
    </>
  );
}

export default function App() {
  return (
    <SamProvider>
      <UiProvider>
        <Workspace />
      </UiProvider>
    </SamProvider>
  );
}

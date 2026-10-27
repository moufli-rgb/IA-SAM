import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
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
import { defaultProjectData } from '../data/initialData';

interface SamContextType {
  data: SamProjectData;
  isLoading: boolean;
  isLocked: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  updateProfile: (profile: Partial<DonaldProfile>) => void;
  updateStage: (stageId: number, updates: Partial<MemoirStage>) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
  addSource: (source: Omit<ReferenceSource, 'id' | 'createdAt'>) => void;
  removeSource: (id: string) => void;
  addBenchmark: (benchmark: Omit<BenchmarkThesis, 'id' | 'addedAt'>) => void;
  updateSection: (sectionId: string, updates: Partial<MemoirSection>) => void;
  addSessionLog: (log: Omit<WorkSessionLog, 'id'>) => void;
  addTask: (task: Omit<ProjectTask, 'id' | 'createdAt'>) => void;
  updateTask: (taskId: string, updates: Partial<ProjectTask>) => void;
  deleteTask: (taskId: string) => void;
  addValidatedDecision: (decision: Omit<ValidatedDecision, 'id'>) => void;
  removeDecision: (id: string) => void;
  exportProjectJson: () => void;
  importProjectJson: (jsonString: string) => boolean;
  resetToDefault: () => void;
  saveDataToServer: () => Promise<void>;
  notifyUser: (title: string, body: string) => void;
}

const SamContext = createContext<SamContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'sam_donald_data_v1';

export const SamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SamProjectData>(defaultProjectData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Load initial data from server or localStorage
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/project');
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
          if (json.data.profile.isPinLocked && json.data.profile.pinCode) {
            setIsLocked(true);
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend unavailable, checking local storage', err);
      }

      // Fallback to localStorage
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          setData(parsed);
          if (parsed.profile?.isPinLocked && parsed.profile?.pinCode) {
            setIsLocked(true);
          }
        }
      } catch (e) {
        console.error('Error loading local storage', e);
      }
      setIsLoading(false);
    }

    loadData();
  }, []);

  // Sync to local storage on any state change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Local storage save error', e);
      }
    }
  }, [data, isLoading]);

  const saveDataToServer = async () => {
    try {
      await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('Could not sync to server backend', e);
    }
  };

  const notifyUser = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (e) {
        console.log('Notification error', e);
      }
    }
  };

  const unlockWithPin = (pin: string): boolean => {
    if (data.profile.pinCode === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const lockApp = () => {
    if (data.profile.pinCode) {
      setIsLocked(true);
    }
  };

  const updateProfile = (profileUpdates: Partial<DonaldProfile>) => {
    setData((prev) => {
      const updated = {
        ...prev,
        profile: { ...prev.profile, ...profileUpdates },
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const updateStage = (stageId: number, updates: Partial<MemoirStage>) => {
    setData((prev) => {
      const updatedStages = prev.stages.map((st) =>
        st.id === stageId ? { ...st, ...updates, updatedAt: new Date().toISOString() } : st
      );
      const updated = { ...prev, stages: updatedStages, lastSaved: new Date().toISOString() };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    setData((prev) => {
      const updated = {
        ...prev,
        chatHistory: [...prev.chatHistory, newMsg],
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const clearChatHistory = () => {
    setData((prev) => {
      const updated = {
        ...prev,
        chatHistory: [
          {
            id: 'msg-' + Date.now(),
            sender: 'SAM' as const,
            content: "Historique réinitialisé, Donald. Notre binôme est prêt pour une nouvelle séance !",
            timestamp: new Date().toISOString(),
          },
        ],
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const addSource = (source: Omit<ReferenceSource, 'id' | 'createdAt'>) => {
    const newSrc: ReferenceSource = {
      ...source,
      id: 'src-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => {
      const updated = {
        ...prev,
        sources: [newSrc, ...prev.sources],
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const removeSource = (id: string) => {
    setData((prev) => {
      const updated = {
        ...prev,
        sources: prev.sources.filter((s) => s.id !== id),
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const addBenchmark = (bm: Omit<BenchmarkThesis, 'id' | 'addedAt'>) => {
    const newBm: BenchmarkThesis = {
      ...bm,
      id: 'bm-' + Date.now(),
      addedAt: new Date().toISOString(),
    };
    setData((prev) => {
      const updated = {
        ...prev,
        benchmarks: [newBm, ...prev.benchmarks],
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const updateSection = (sectionId: string, updates: Partial<MemoirSection>) => {
    setData((prev) => {
      const updatedSections = prev.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, ...updates, updatedAt: new Date().toISOString() } : sec
      );
      const updated = {
        ...prev,
        sections: updatedSections,
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const addSessionLog = (log: Omit<WorkSessionLog, 'id'>) => {
    const newLog: WorkSessionLog = {
      ...log,
      id: 'sess-' + Date.now(),
    };
    setData((prev) => {
      const updated = {
        ...prev,
        sessions: [newLog, ...prev.sessions],
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const addTask = (task: Omit<ProjectTask, 'id' | 'createdAt'>) => {
    const newTask: ProjectTask = {
      ...task,
      id: 'task-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setData((prev) => {
      const updated = {
        ...prev,
        tasks: [newTask, ...prev.tasks],
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const updateTask = (taskId: string, updates: Partial<ProjectTask>) => {
    setData((prev) => {
      const updatedTasks = prev.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
      const updated = {
        ...prev,
        tasks: updatedTasks,
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const deleteTask = (taskId: string) => {
    setData((prev) => {
      const updated = {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const addValidatedDecision = (decision: Omit<ValidatedDecision, 'id'>) => {
    const newDec: ValidatedDecision = {
      ...decision,
      id: 'dec-' + Date.now(),
    };
    setData((prev) => {
      const updated = {
        ...prev,
        decisions: [newDec, ...prev.decisions],
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const removeDecision = (id: string) => {
    setData((prev) => {
      const updated = {
        ...prev,
        decisions: prev.decisions.filter((d) => d.id !== id),
        lastSaved: new Date().toISOString(),
      };
      fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
      return updated;
    });
  };

  const exportProjectJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAM_Sauvegarde_Donald_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProjectJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile && parsed.stages) {
        setData(parsed);
        fetch('/api/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed),
        }).catch(() => {});
        return true;
      }
    } catch (e) {
      console.error('Import error', e);
    }
    return false;
  };

  const resetToDefault = () => {
    setData(defaultProjectData);
    fetch('/api/project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultProjectData),
    }).catch(() => {});
  };

  return (
    <SamContext.Provider
      value={{
        data,
        isLoading,
        isLocked,
        unlockWithPin,
        lockApp,
        updateProfile,
        updateStage,
        addChatMessage,
        clearChatHistory,
        addSource,
        removeSource,
        addBenchmark,
        updateSection,
        addSessionLog,
        addTask,
        updateTask,
        deleteTask,
        addValidatedDecision,
        removeDecision,
        exportProjectJson,
        importProjectJson,
        resetToDefault,
        saveDataToServer,
        notifyUser,
      }}
    >
      {children}
    </SamContext.Provider>
  );
};

export const useSam = () => {
  const context = useContext(SamContext);
  if (!context) {
    throw new Error('useSam must be used within a SamProvider');
  }
  return context;
};

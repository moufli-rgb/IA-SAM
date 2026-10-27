export type StageStatus = 'not_started' | 'in_progress' | 'donald_validated' | 'needs_revision';

export interface MemoirStage {
  id: number;
  title: string;
  category: 'Cadrage' | 'Théorie & Méthode' | 'Diagnostic & Site' | 'Projet TPFE' | 'Finalisation';
  objective: string;
  neededInfo: string;
  completedWork: string;
  associatedSources: string[];
  validatedDecisions: string[];
  openQuestions: string[];
  difficulties: string[];
  nextActions: string[];
  status: StageStatus;
  updatedAt: string;
}

export interface DonaldProfile {
  name: string;
  degree: string;
  topic: string;
  subTopic: string;
  contextLocation: string; // e.g. Cotonou, Dakar, Abidjan, etc.
  supervisor: string;
  university: string;
  defenseDate: string;
  availableHoursPerWeek: number;
  preferredTone: 'direct_chaleureux' | 'analytique' | 'academique_strict';
  isPinLocked: boolean;
  pinCode?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'SAM' | 'Donald'; // 'Donald' = l'étudiant (nom conservé pour compatibilité des sauvegardes)
  content: string;
  timestamp: string;
  stageReferenceId?: number;
  sourcesGrounding?: { title: string; url: string }[];
}

export interface ReferenceSource {
  id: string;
  title: string;
  authors: string;
  year: string;
  type: 'article' | 'livre' | 'these' | 'norme' | 'rapport' | 'site';
  doiOrUrl?: string;
  summary: string;
  architecturalRelevance: string;
  keyQuotes: string[];
  verified: boolean;
  theme: string;
  createdAt: string;
}

export interface BenchmarkThesis {
  id: string;
  title: string;
  author: string;
  university: string;
  year: string;
  gradeOrMention?: string;
  generalPlan: string;
  problemStatementMethod: string;
  theoreticalFramework: string;
  architecturalIntegration: string;
  strengths: string[];
  weaknesses: string[];
  lessonsForDonald: string[];
  report?: string;
  addedAt: string;
}

export type SectionValidationStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface SectionVersion {
  version: number;
  timestamp: string;
  content: string;
  notes: string;
}

export interface MemoirSection {
  id: string;
  code: string;
  title: string;
  chapter: string;
  targetWordCount: number;
  currentStep: SectionValidationStep;
  outline: string;
  missingData: string[];
  draftContent: string;
  usedReferences: string[];
  verificationPoints: string[];
  donaldValidationNote: string;
  isValidatedByDonald: boolean;
  versions: SectionVersion[];
  updatedAt: string;
}

export interface SocialScript {
  title: string;
  hook: string;
  script: string;
  visualNotes?: string;
  keyTakeaway: string;
  hashtags?: string[];
  estimatedDuration: string;
}

export interface WorkSessionLog {
  id: string;
  date: string;
  rawInput: string;
  durationMinutes: number;
  relatedStageId?: number;
  academicJournal: {
    context: string;
    objectives: string;
    actionsDone: string;
    resultsAchieved: string;
    validatedDecisions: string;
    difficultiesAndLimits: string;
    orientationChanges?: string;
    nextSteps: string;
  };
  socialScripts: {
    tiktok30s: SocialScript;
    vlog60s: SocialScript;
    podcastEpisode: SocialScript;
  };
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  priority: 'basse' | 'moyenne' | 'haute' | 'urgente';
  dueDate: string;
  estimatedHours: number;
  actualHours?: number;
  status: 'a_faire' | 'en_cours' | 'termine' | 'en_retard';
  stageId?: number;
  reminders: string[];
  createdAt: string;
}

export interface ValidatedDecision {
  id: string;
  date: string;
  stageName: string;
  decisionText: string;
  justification: string;
  impactOnProject: string;
}

export interface ArchivedChat {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface SamProjectData {
  profile: DonaldProfile;
  stages: MemoirStage[];
  chatHistory: ChatMessage[];
  archivedChats?: ArchivedChat[];
  sources: ReferenceSource[];
  benchmarks: BenchmarkThesis[];
  sections: MemoirSection[];
  sessions: WorkSessionLog[];
  tasks: ProjectTask[];
  decisions: ValidatedDecision[];
  lastSaved: string;
}

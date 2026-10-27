import React from 'react';
import {
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Video,
  Award,
  AlertCircle,
  FolderSync,
  Compass,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickSession: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenQuickSession,
}) => {
  const { data } = useSam();

  // Progress metrics
  const totalStages = data.stages.length;
  const validatedStages = data.stages.filter((s) => s.status === 'donald_validated').length;
  const inProgressStages = data.stages.filter((s) => s.status === 'in_progress').length;
  const progressPercent = Math.round((validatedStages / totalStages) * 100);

  // Active / next stage
  const currentStage =
    data.stages.find((s) => s.status === 'in_progress') ||
    data.stages.find((s) => s.status === 'not_started') ||
    data.stages[0];

  // Urgent tasks
  const urgentTasks = data.tasks
    .filter((t) => t.status !== 'termine')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Last session
  const lastSession = data.sessions[0];

  // Total words drafted
  const totalWords = data.sections.reduce((acc, sec) => {
    return acc + (sec.draftContent ? sec.draftContent.split(/\s+/).filter(Boolean).length : 0);
  }, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Binôme Actif • Donald & SAM
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Bonjour Donald. Prêt à faire progresser ton mémoire ?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            {data.profile.topic}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Compass className="h-4 w-4 text-amber-400" />
              {data.profile.university}
            </span>
            <span>•</span>
            <span>Encadrant : <strong className="text-slate-200">{data.profile.supervisor}</strong></span>
            <span>•</span>
            <span>Soutenance : <strong className="text-amber-300">{data.profile.defenseDate || 'Non fixée'}</strong></span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpenQuickSession}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 shadow-md hover:bg-amber-400 transition cursor-pointer"
            >
              <TrendingUp className="h-4 w-4" />
              Consigner ma séance du jour
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              Échanger avec SAM
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-8 -bottom-8 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Progression globale</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{progressPercent}%</span>
            <span className="text-xs text-slate-400">{validatedStages}/{totalStages} étapes</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Mots rédigés</span>
            <FileText className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalWords.toLocaleString()}</span>
            <span className="text-xs text-slate-400">mots</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Document structuré et modulaire</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Sources vérifiées</span>
            <BookOpen className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{data.sources.length}</span>
            <span className="text-xs text-slate-400">références</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Articles, normes & ouvrages</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Décisions validées</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{data.decisions.length}</span>
            <span className="text-xs text-slate-400">engagements</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Mémoire inaltérable de Donald</p>
        </div>
      </div>

      {/* Main Row : Current Stage + Urgent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Working Stage */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Étape active en cours
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {currentStage.title}
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('stages')}
              className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1"
            >
              Voir les 20 étapes
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400">Objectif académique :</span>
              <p className="text-slate-200 mt-0.5 leading-relaxed">{currentStage.objective}</p>
            </div>

            {currentStage.completedWork && (
              <div className="rounded-xl bg-slate-800/50 p-3.5 border border-slate-800">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Travaux déjà consignés :
                </span>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                  {currentStage.completedWork}
                </p>
              </div>
            )}

            {currentStage.nextActions.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-400">Prochaine action prioritaire :</span>
                <ul className="mt-1 list-disc list-inside text-xs text-amber-200/90 space-y-1">
                  {currentStage.nextActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className="rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition"
            >
              Faire avancer cette étape avec SAM
            </button>
            <button
              onClick={() => setActiveTab('stages')}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              Mettre à jour l'état
            </button>
          </div>
        </div>

        {/* Urgent Tasks & Deadlines */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Priorités à court terme
            </h3>
            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs text-slate-400 hover:text-amber-300"
            >
              Gérer
            </button>
          </div>

          <div className="space-y-3">
            {urgentTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Aucune tâche urgente en attente. Tu es à jour !
              </p>
            ) : (
              urgentTasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-800/80 bg-slate-800/40 p-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-slate-200 leading-snug">
                      {t.title}
                    </h4>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        t.priority === 'urgente'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : t.priority === 'haute'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      Échéance : {t.dueDate}
                    </span>
                    <span>{t.estimatedHours}h estimées</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setActiveTab('tasks')}
            className="w-full text-center rounded-xl border border-slate-800 bg-slate-800/50 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            Voir le rétroplanning complet
          </button>
        </div>
      </div>

      {/* Secondary Row: Last Journal & Social Script */}
      {lastSession && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Dernier Journal & Script générés
                </h3>
                <p className="text-xs text-slate-400">
                  Séance du {lastSession.date} • Durée : {lastSession.durationMinutes} min
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('journal_scripts')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              Consulter tous les scripts
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic Log snippet */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 space-y-2">
              <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
                Production A • Journal Académique
              </span>
              <h4 className="text-sm font-semibold text-slate-200">
                {lastSession.academicJournal.objectives || 'Objectifs de travail'}
              </h4>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {lastSession.academicJournal.resultsAchieved}
              </p>
              <div className="text-[11px] text-emerald-400 pt-1">
                <strong>Décision validée :</strong> {lastSession.academicJournal.validatedDecisions}
              </div>
            </div>

            {/* Social media script snippet */}
            <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                  Production B • Script Réseaux Sociaux (TikTok / Vlog)
                </span>
                <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {lastSession.socialScripts.tiktok30s.estimatedDuration}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-200">
                "{lastSession.socialScripts.tiktok30s.title}"
              </h4>
              <div className="text-xs italic text-amber-200/80 bg-amber-950/20 p-2.5 rounded-lg border border-amber-500/10">
                "{lastSession.socialScripts.tiktok30s.hook}"
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">
                {lastSession.socialScripts.tiktok30s.script}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

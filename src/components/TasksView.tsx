import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { ProjectTask } from '../types/sam';

export const TasksView: React.FC = () => {
  const { data, addTask, updateTask, deleteTask } = useSam();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectTask['priority']>('haute');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [estimatedHours, setEstimatedHours] = useState(4);
  const [stageId, setStageId] = useState<number>(4);

  // Intelligent schedule advice state
  const [scheduleAdvice, setScheduleAdvice] = useState<string | null>(null);
  const [isAnalyzingSchedule, setIsAnalyzingSchedule] = useState(false);

  const filteredTasks = data.tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'todo') return t.status === 'a_faire';
    if (filterStatus === 'in_progress') return t.status === 'en_cours';
    if (filterStatus === 'done') return t.status === 'termine';
    return true;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate,
      estimatedHours,
      status: 'a_faire',
      stageId,
      reminders: [dueDate],
    });

    setTitle('');
    setDescription('');
    setIsAdding(false);
  };

  const handleRunAiPlanning = async () => {
    setIsAnalyzingSchedule(true);
    try {
      const res = await fetch('/api/plan-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defenseDate: data.profile.defenseDate,
          availableHoursPerWeek: data.profile.availableHoursPerWeek,
          stages: data.stages,
          tasks: data.tasks,
        }),
      });

      const resData = await res.json();
      if (resData.success && resData.scheduleAdvice) {
        setScheduleAdvice(resData.scheduleAdvice);
      }
    } catch (e) {
      alert('Erreur lors du calcul du rétroplanning');
    } finally {
      setIsAnalyzingSchedule(false);
    }
  };

  const totalEstimatedHours = data.tasks
    .filter((t) => t.status !== 'termine')
    .reduce((acc, t) => acc + t.estimatedHours, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-amber-400" />
            Tâches & Rétroplanning du Mémoire
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organisé en fonction de l'échéance de soutenance ({data.profile.defenseDate}) et de tes disponibilités ({data.profile.availableHoursPerWeek}h/semaine).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAiPlanning}
            disabled={isAnalyzingSchedule}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isAnalyzingSchedule ? 'Calcul...' : 'Avis Rétroplanning SAM'}
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Tâche
          </button>
        </div>
      </div>

      {/* Charge métrique */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Charge restante estimée</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalEstimatedHours}h</span>
            <span className="text-xs text-slate-500">
              ≈ {(totalEstimatedHours / data.profile.availableHoursPerWeek).toFixed(1)} semaines de travail
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Tâches actives</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">
              {data.tasks.filter((t) => t.status !== 'termine').length}
            </span>
            <span className="text-xs text-slate-500">en attente ou en cours</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Tâches terminées par Donald</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">
              {data.tasks.filter((t) => t.status === 'termine').length}
            </span>
            <span className="text-xs text-slate-500">validées</span>
          </div>
        </div>
      </div>

      {/* AI Schedule Assessment if requested */}
      {scheduleAdvice && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Diagnostic et Rétroplanning Recommandé par SAM :
            </h3>
            <button
              onClick={() => setScheduleAdvice(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fermer
            </button>
          </div>
          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {scheduleAdvice}
          </div>
        </div>
      )}

      {/* New Task Drawer */}
      {isAdding && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 space-y-4 shadow-2xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-amber-400" />
            Créer une tâche du mémoire
          </h3>

          <form onSubmit={handleAddTask} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Intitulé de la tâche *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Rédiger la sous-partie sur l'inertie thermique de la terre"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Priorité</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                >
                  <option value="urgente">Urgente (Bloquante)</option>
                  <option value="haute">Haute</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="basse">Basse</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Date d'échéance</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Durée estimée (heures)</label>
                <input
                  type="number"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Étape du mémoire liée</label>
                <select
                  value={stageId}
                  onChange={(e) => setStageId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                >
                  {data.stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      Étape {st.id} : {st.title.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Description / Consignes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Détails, documents à consulter ou livrable attendu..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400"
              >
                Créer la tâche
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${
            filterStatus === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          Toutes ({data.tasks.length})
        </button>
        <button
          onClick={() => setFilterStatus('todo')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${
            filterStatus === 'todo'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          À faire ({data.tasks.filter((t) => t.status === 'a_faire').length})
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${
            filterStatus === 'in_progress'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          En cours ({data.tasks.filter((t) => t.status === 'en_cours').length})
        </button>
        <button
          onClick={() => setFilterStatus('done')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${
            filterStatus === 'done'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300'
          }`}
        >
          Terminées ({data.tasks.filter((t) => t.status === 'termine').length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-500">
            Aucune tâche trouvée pour ce filtre.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'termine';
            return (
              <div
                key={task.id}
                className={`rounded-2xl border p-4 sm:p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? 'border-emerald-500/20 bg-slate-900/40 opacity-70'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      const nextStatus = isDone ? 'a_faire' : 'termine';
                      updateTask(task.id, { status: nextStatus });
                    }}
                    className={`mt-0.5 rounded-lg p-1.5 transition cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : 'border border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={isDone ? 'Marquer comme non terminée' : 'Valider comme terminée'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-bold ${
                          isDone ? 'line-through text-slate-500' : 'text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          task.priority === 'urgente'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : task.priority === 'haute'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        Échéance : <strong className="text-slate-300">{task.dueDate}</strong>
                      </span>
                      <span>•</span>
                      <span>{task.estimatedHours}h estimées</span>
                      {task.stageId && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400">Étape #{task.stageId}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={task.status}
                    onChange={(e: any) => updateTask(task.id, { status: e.target.value })}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="a_faire">À faire</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                    <option value="en_retard">En retard</option>
                  </select>

                  <button
                    onClick={() => {
                      if (confirm("Supprimer cette tâche ?")) {
                        deleteTask(task.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-slate-600 hover:text-red-400"
                    title="Supprimer la tâche"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

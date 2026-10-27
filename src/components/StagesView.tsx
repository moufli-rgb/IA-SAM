import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  Plus,
  Trash2,
  BookmarkCheck,
  FolderOpen,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { MemoirStage, StageStatus } from '../types/sam';

export const StagesView: React.FC<{ onSwitchToChatWithStage?: (stageId: number) => void }> = ({
  onSwitchToChatWithStage,
}) => {
  const { data, updateStage, addValidatedDecision } = useSam();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [expandedStageId, setExpandedStageId] = useState<number | null>(4);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);

  // Edit buffer
  const [editBuffer, setEditBuffer] = useState<Partial<MemoirStage>>({});
  const [aiAdvice, setAiAdvice] = useState<Record<number, string>>({});
  const [loadingAdvice, setLoadingAdvice] = useState<number | null>(null);

  const categories = ['Tous', 'Cadrage', 'Théorie & Méthode', 'Diagnostic & Site', 'Projet TPFE', 'Finalisation'];

  const filteredStages =
    selectedCategory === 'Tous'
      ? data.stages
      : data.stages.filter((s) => s.category === selectedCategory);

  const startEditing = (stage: MemoirStage) => {
    setEditingStageId(stage.id);
    setEditBuffer({
      completedWork: stage.completedWork,
      objective: stage.objective,
      neededInfo: stage.neededInfo,
      status: stage.status,
    });
  };

  const saveEditing = (stageId: number) => {
    updateStage(stageId, editBuffer);
    setEditingStageId(null);
  };

  const handleAskSamForStage = async (stage: MemoirStage) => {
    setLoadingAdvice(stage.id);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Je travaille actuellement sur l'Étape ${stage.id} : "${stage.title}".
Objectif : ${stage.objective}
Ce que j'ai fait : ${stage.completedWork || 'Pas encore commencé'}
Difficultés : ${stage.difficulties.join(', ') || 'Aucune renseignée'}

En tant que SAM, analyse mon avancement sur cette étape et donne-moi 3 recommandations méthodologiques très concrètes pour franchir cette étape avec succès et préparer la suivante.`,
          stageId: stage.id,
          tone: 'direct_chaleureux',
          conciseness: 'balanced',
          context: {
            topic: data.profile.topic,
            subTopic: data.profile.subTopic,
            decisions: data.decisions,
          },
        }),
      });
      const resData = await res.json();
      if (resData.success && resData.reply) {
        setAiAdvice((prev) => ({ ...prev, [stage.id]: resData.reply }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdvice(null);
    }
  };

  const getStatusBadge = (status: StageStatus) => {
    switch (status) {
      case 'donald_validated':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Validé par Donald
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
            <Clock className="h-3 w-3" /> En cours
          </span>
        );
      case 'needs_revision':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
            <RotateCcw className="h-3 w-3" /> À réviser
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            Non commencé
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Les 20 Étapes du Mémoire & du TPFE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Parcours complet de Donald, du premier questionnement jusqu'à la soutenance finale.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stages Accordion List */}
      <div className="space-y-3">
        {filteredStages.map((stage) => {
          const isExpanded = expandedStageId === stage.id;
          const isEditing = editingStageId === stage.id;
          const advice = aiAdvice[stage.id];

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border transition overflow-hidden ${
                stage.status === 'donald_validated'
                  ? 'border-emerald-500/20 bg-slate-900/60'
                  : stage.status === 'in_progress'
                  ? 'border-amber-500/30 bg-slate-900/80 shadow-md'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              {/* Header row */}
              <div
                className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none"
                onClick={() => setExpandedStageId(isExpanded ? null : stage.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
                      stage.status === 'donald_validated'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : stage.status === 'in_progress'
                        ? 'bg-amber-500 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {stage.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {stage.title}
                      </h3>
                      <span className="hidden sm:inline text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        {stage.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {stage.objective}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(stage.status)}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-950/40 p-4 sm:p-6 space-y-5">
                  {/* Status switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-medium">Statut de l'étape :</span>
                      <select
                        value={isEditing ? editBuffer.status : stage.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as StageStatus;
                          if (isEditing) {
                            setEditBuffer({ ...editBuffer, status: newStatus });
                          } else {
                            updateStage(stage.id, { status: newStatus });
                          }
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white focus:outline-none"
                      >
                        <option value="not_started">Non commencé</option>
                        <option value="in_progress">En cours</option>
                        <option value="donald_validated">Validé par Donald</option>
                        <option value="needs_revision">À réviser</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <button
                          onClick={() => saveEditing(stage.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Enregistrer
                        </button>
                      ) : (
                        <button
                          onClick={() => startEditing(stage)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Modifier mes notes
                        </button>
                      )}

                      <button
                        onClick={() => handleAskSamForStage(stage)}
                        disabled={loadingAdvice === stage.id}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {loadingAdvice === stage.id ? 'Analyse...' : 'Conseil SAM'}
                      </button>
                    </div>
                  </div>

                  {/* AI Advice block if generated */}
                  {advice && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        Recommandations méthodologiques de SAM pour Donald :
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {advice}
                      </p>
                    </div>
                  )}

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Objectif & Travaux effectués */}
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <h4 className="font-semibold text-amber-400 mb-1">Objectif académique</h4>
                        {isEditing ? (
                          <textarea
                            value={editBuffer.objective || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, objective: e.target.value })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-slate-200"
                            rows={3}
                          />
                        ) : (
                          <p className="text-slate-300 leading-relaxed">{stage.objective}</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <h4 className="font-semibold text-emerald-400 mb-1">
                          Travaux effectués & données réunies
                        </h4>
                        {isEditing ? (
                          <textarea
                            value={editBuffer.completedWork || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, completedWork: e.target.value })}
                            placeholder="Décris ce que tu as accompli, testé ou modélisé pour cette étape..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-slate-200"
                            rows={4}
                          />
                        ) : stage.completedWork ? (
                          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {stage.completedWork}
                          </p>
                        ) : (
                          <p className="text-slate-500 italic">Aucun travail encore consigné.</p>
                        )}
                      </div>
                    </div>

                    {/* Informations nécessaires & Décisions */}
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <h4 className="font-semibold text-sky-400 mb-1">Informations nécessaires</h4>
                        {isEditing ? (
                          <textarea
                            value={editBuffer.neededInfo || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, neededInfo: e.target.value })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-slate-200"
                            rows={3}
                          />
                        ) : (
                          <p className="text-slate-300 leading-relaxed">{stage.neededInfo}</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-indigo-400">Décisions validées</h4>
                          <button
                            onClick={() => {
                              const dec = prompt("Ajouter une décision validée pour cette étape :");
                              if (dec) {
                                const newDecs = [...stage.validatedDecisions, dec];
                                updateStage(stage.id, { validatedDecisions: newDecs });
                                addValidatedDecision({
                                  date: new Date().toISOString().split('T')[0],
                                  stageName: stage.title,
                                  decisionText: dec,
                                  justification: "Validé lors de l'étude de l'étape",
                                  impactOnProject: "Intégré dans le mémoire et le TPFE",
                                });
                              }
                            }}
                            className="text-[10px] text-indigo-300 hover:underline flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" /> Ajouter
                          </button>
                        </div>
                        {stage.validatedDecisions.length === 0 ? (
                          <p className="text-slate-500 italic">Aucune décision fermement validée.</p>
                        ) : (
                          <ul className="list-disc list-inside text-slate-300 space-y-1">
                            {stage.validatedDecisions.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Open Questions & Difficulties */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                      <span className="font-semibold text-slate-400">Questions ouvertes :</span>
                      <p className="text-slate-300 mt-1">
                        {stage.openQuestions.length > 0
                          ? stage.openQuestions.join(' • ')
                          : 'Toutes les interrogations actuelles sont traitées.'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                      <span className="font-semibold text-slate-400">Difficultés & limites :</span>
                      <p className="text-slate-300 mt-1">
                        {stage.difficulties.length > 0
                          ? stage.difficulties.join(' • ')
                          : 'Pas d’obstacles bloquants signalés.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

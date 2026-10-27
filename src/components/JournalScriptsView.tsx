import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Mic,
  MicOff,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Copy,
  Check,
  Download,
  Share2,
  Trash2,
  Plus,
  Radio,
  Tv,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { WorkSessionLog } from '../types/sam';

export const JournalScriptsView: React.FC<{ onNewSessionTriggered?: boolean }> = () => {
  const { data, addSessionLog, addValidatedDecision } = useSam();
  const [isCreating, setIsCreating] = useState(false);

  // Form input
  const [rawNotes, setRawNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [relatedStageId, setRelatedStageId] = useState<number>(4);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Selected session to view
  const [selectedSessionId, setSelectedSessionId] = useState<string>(data.sessions[0]?.id || '');
  const [activeMediaTab, setActiveMediaTab] = useState<'tiktok' | 'vlog' | 'podcast'>('tiktok');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'fr-FR';

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRawNotes((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim() || isGenerating) return;

    setIsGenerating(true);
    const stage = data.stages.find((s) => s.id === relatedStageId);

    try {
      const res = await fetch('/api/generate-journal-and-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes,
          durationMinutes,
          relatedStageTitle: stage?.title || '',
          topic: data.profile.topic,
        }),
      });

      const resData = await res.json();
      if (resData.success && resData.journal && resData.scripts) {
        addSessionLog({
          date: new Date().toISOString().split('T')[0],
          rawInput: rawNotes,
          durationMinutes,
          relatedStageId,
          academicJournal: resData.journal,
          socialScripts: resData.scripts,
        });

        // If a validated decision was mentioned, prompt to store it
        if (resData.journal.validatedDecisions && resData.journal.validatedDecisions !== 'Aucune') {
          addValidatedDecision({
            date: new Date().toISOString().split('T')[0],
            stageName: stage?.title || 'Séance de travail',
            decisionText: resData.journal.validatedDecisions,
            justification: resData.journal.resultsAchieved || 'Issu de la séance de travail de Donald',
            impactOnProject: 'Intégré au carnet de bord et au mémoire',
          });
        }

        setIsCreating(false);
        setRawNotes('');
        alert("Séance enregistrée avec succès ! Le journal académique et les 3 scripts de réseaux sociaux sont prêts.");
      } else {
        alert(resData.error || 'Erreur lors de la génération');
      }
    } catch (e) {
      alert('Erreur réseau');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const selectedSession =
    data.sessions.find((s) => s.id === selectedSessionId) || data.sessions[0];

  const handleExportJournalPdf = () => {
    const text = data.sessions
      .map((s) => {
        return `========================================================
SÉANCE DU ${s.date} (Durée : ${s.durationMinutes} min)
Étape liée : Étape #${s.relatedStageId || 'Générale'}
--------------------------------------------------------
CONTEXTE : ${s.academicJournal.context}
OBJECTIFS : ${s.academicJournal.objectives}
ACTIONS EFFECTUÉES : ${s.academicJournal.actionsDone}
RÉSULTATS OBTENUS : ${s.academicJournal.resultsAchieved}
DÉCISIONS VALIDÉES : ${s.academicJournal.validatedDecisions}
DIFFICULTÉS & LIMITES : ${s.academicJournal.difficultiesAndLimits}
PROCHAINES ACTIONS : ${s.academicJournal.nextSteps}
`;
      })
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Journal_Academique_Donald_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Video className="h-6 w-6 text-amber-400" />
            Journal de Progression & Scripts Narratifs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            À partir de tes notes réelles, SAM génère simultanément ton Journal Académique (rapport officiel) et tes Scripts Réseaux Sociaux (TikTok, Vlog, Podcast).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJournalPdf}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
            title="Exporter tout le journal chronologique"
          >
            <Download className="h-3.5 w-3.5" />
            Export Journal (.txt)
          </button>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {isCreating ? 'Fermer le formulaire' : 'Consigner une séance'}
          </button>
        </div>
      </div>

      {/* Creation Modal / Drawer */}
      {isCreating && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Consignation d'une nouvelle séance de travail
            </h3>
            <button
              onClick={toggleRecording}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Enregistrement en cours...' : 'Dictée vocale'}
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Étape du mémoire concernée</label>
                <select
                  value={relatedStageId}
                  onChange={(e) => setRelatedStageId(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                >
                  {data.stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      Étape {st.id} : {st.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Durée effective (en minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Récit libre de la séance (actions, lectures, découvertes, doutes, choix architecturaux) *
              </label>
              <textarea
                required
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                rows={5}
                placeholder="Ex: Aujourd'hui j'ai passé 2 heures à confronter le diagramme de Givoni avec le relevé des brises de terre à Cotonou. J'ai compris que le patio intérieur créera une dépression suffisante..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isGenerating || !rawNotes.trim()}
                className="rounded-lg bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isGenerating ? 'SAM transforme la séance en Journal & Scripts...' : 'Générer Journal & Scripts'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Session timeline selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {data.sessions.map((sess) => {
          const isSelected = sess.id === selectedSession?.id;
          return (
            <button
              key={sess.id}
              onClick={() => setSelectedSessionId(sess.id)}
              className={`rounded-xl px-4 py-2.5 text-xs text-left transition whitespace-nowrap cursor-pointer border ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/15 text-white font-bold shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold">{sess.date}</div>
              <div className="text-[10px] text-amber-400 font-normal">
                {sess.durationMinutes} min • Étape #{sess.relatedStageId || 'Générale'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Session Display */}
      {selectedSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PRODUCTION A : Academic Journal */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-400" />
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                    Production A
                  </span>
                  <h3 className="text-base font-bold text-white">Journal Académique Officiel</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  const content = JSON.stringify(selectedSession.academicJournal, null, 2);
                  copyToClipboard(content, 'journal-copy');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'journal-copy' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedKey === 'journal-copy' ? 'Copié' : 'Copier'}
              </button>
            </div>

            <div className="space-y-3.5 text-xs leading-relaxed">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="font-semibold text-slate-400 block mb-0.5">Contexte & Objectifs :</span>
                <p className="text-slate-200">{selectedSession.academicJournal.context}</p>
                <p className="text-slate-300 mt-1 italic">{selectedSession.academicJournal.objectives}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="font-semibold text-sky-400 block mb-0.5">Recherches & Actions concrètes :</span>
                <p className="text-slate-200">{selectedSession.academicJournal.actionsDone}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="font-semibold text-emerald-400 block mb-0.5">Résultats obtenus :</span>
                <p className="text-slate-200">{selectedSession.academicJournal.resultsAchieved}</p>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3">
                <span className="font-semibold text-emerald-300 block mb-0.5">Décisions prises & Justifications :</span>
                <p className="text-emerald-100 font-medium">{selectedSession.academicJournal.validatedDecisions}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="font-semibold text-amber-400 block mb-0.5">Difficultés & Limites :</span>
                <p className="text-slate-300">{selectedSession.academicJournal.difficultiesAndLimits}</p>
              </div>

              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                <span className="font-semibold text-slate-400 block mb-0.5">Prochaines actions :</span>
                <p className="text-slate-300">{selectedSession.academicJournal.nextSteps}</p>
              </div>
            </div>
          </div>

          {/* PRODUCTION B : Social Media Scripts */}
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-amber-400" />
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Production B
                  </span>
                  <h3 className="text-base font-bold text-white">Scripts Narratifs Réseaux</h3>
                </div>
              </div>

              {/* Format selector */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveMediaTab('tiktok')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeMediaTab === 'tiktok'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3 w-3" />
                  TikTok 30s
                </button>
                <button
                  onClick={() => setActiveMediaTab('vlog')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeMediaTab === 'vlog'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="h-3 w-3" />
                  Vlog 60s
                </button>
                <button
                  onClick={() => setActiveMediaTab('podcast')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeMediaTab === 'podcast'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="h-3 w-3" />
                  Podcast
                </button>
              </div>
            </div>

            {/* Active Script Rendering */}
            {activeMediaTab === 'tiktok' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">
                    {selectedSession.socialScripts.tiktok30s.title}
                  </h4>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                    {selectedSession.socialScripts.tiktok30s.estimatedDuration}
                  </span>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1">
                  <span className="font-bold text-amber-400 text-[11px] block uppercase tracking-wider">
                    Accroche (3 premières secondes) :
                  </span>
                  <p className="text-white font-medium italic text-xs leading-relaxed">
                    "{selectedSession.socialScripts.tiktok30s.hook}"
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                  <span className="font-bold text-slate-300 text-[11px] block uppercase tracking-wider">
                    Texte à dire face caméra :
                  </span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedSession.socialScripts.tiktok30s.script}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex flex-wrap gap-1">
                    {(selectedSession.socialScripts.tiktok30s.hashtags || []).map((h, i) => (
                      <span key={i} className="text-[11px] text-amber-400">
                        {h}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${selectedSession.socialScripts.tiktok30s.hook}\n\n${selectedSession.socialScripts.tiktok30s.script}\n\n${(selectedSession.socialScripts.tiktok30s.hashtags || []).join(' ')}`,
                        'tiktok-copy'
                      )
                    }
                    className="flex items-center gap-1 text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    {copiedKey === 'tiktok-copy' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === 'tiktok-copy' ? 'Copié' : 'Copier le script TikTok'}
                  </button>
                </div>
              </div>
            )}

            {activeMediaTab === 'vlog' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">
                    {selectedSession.socialScripts.vlog60s.title}
                  </h4>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                    {selectedSession.socialScripts.vlog60s.estimatedDuration}
                  </span>
                </div>

                {selectedSession.socialScripts.vlog60s.visualNotes && (
                  <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 space-y-1">
                    <span className="font-bold text-sky-400 text-[11px] block uppercase tracking-wider">
                      Indications de mise en scène & plans B-roll :
                    </span>
                    <p className="text-sky-200 leading-relaxed text-xs">
                      {selectedSession.socialScripts.vlog60s.visualNotes}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                  <span className="font-bold text-slate-300 text-[11px] block uppercase tracking-wider">
                    Texte de la voix off / face caméra :
                  </span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedSession.socialScripts.vlog60s.script}
                  </p>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-800">
                  <button
                    onClick={() =>
                      copyToClipboard(selectedSession.socialScripts.vlog60s.script, 'vlog-copy')
                    }
                    className="flex items-center gap-1 text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    {copiedKey === 'vlog-copy' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === 'vlog-copy' ? 'Copié' : 'Copier le script Vlog'}
                  </button>
                </div>
              </div>
            )}

            {activeMediaTab === 'podcast' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">
                    {selectedSession.socialScripts.podcastEpisode.title}
                  </h4>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                    {selectedSession.socialScripts.podcastEpisode.estimatedDuration}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                  <span className="font-bold text-slate-300 text-[11px] block uppercase tracking-wider">
                    Épisode Carnet de Bord Audio :
                  </span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap font-academic text-sm">
                    {selectedSession.socialScripts.podcastEpisode.script}
                  </p>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-800">
                  <button
                    onClick={() =>
                      copyToClipboard(selectedSession.socialScripts.podcastEpisode.script, 'podcast-copy')
                    }
                    className="flex items-center gap-1 text-xs text-amber-400 hover:underline cursor-pointer"
                  >
                    {copiedKey === 'podcast-copy' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === 'podcast-copy' ? 'Copié' : 'Copier le script Podcast'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

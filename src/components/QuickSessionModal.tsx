import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useSam } from '../context/SamContext';

interface QuickSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessNavigate?: () => void;
}

export const QuickSessionModal: React.FC<QuickSessionModalProps> = ({
  isOpen,
  onClose,
  onSuccessNavigate,
}) => {
  const { data, addSessionLog, addValidatedDecision } = useSam();
  const [rawNotes, setRawNotes] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [relatedStageId, setRelatedStageId] = useState<number>(4);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const recognitionRef = useRef<any>(null);

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

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
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

        if (resData.journal.validatedDecisions && resData.journal.validatedDecisions !== 'Aucune') {
          addValidatedDecision({
            date: new Date().toISOString().split('T')[0],
            stageName: stage?.title || 'Séance de travail',
            decisionText: resData.journal.validatedDecisions,
            justification: resData.journal.resultsAchieved || 'Issu de la séance de travail de Donald',
            impactOnProject: 'Intégré au carnet de bord et au mémoire',
          });
        }

        setRawNotes('');
        onClose();
        if (onSuccessNavigate) {
          onSuccessNavigate();
        }
      } else {
        alert(resData.error || 'Erreur lors de la génération');
      }
    } catch (e) {
      alert('Erreur réseau');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Consigner ma séance de travail</h3>
              <p className="text-[11px] text-slate-400">Génération automatique du Journal & des Scripts Réseaux</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Étape liée</label>
              <select
                value={relatedStageId}
                onChange={(e) => setRelatedStageId(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              >
                {data.stages.map((st) => (
                  <option key={st.id} value={st.id}>
                    Étape {st.id} : {st.title.slice(0, 28)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Durée (minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-400">Récit libre (ou dicte à la voix)</label>
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                {isRecording ? 'En écoute...' : 'Activer dictée'}
              </button>
            </div>
            <textarea
              required
              rows={6}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Explique ce que tu as fait aujourd'hui, tes calculs, tes doutes, tes lectures ou tes choix architecturaux..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
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
              {isGenerating ? 'Génération par SAM...' : 'Enregistrer & Générer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

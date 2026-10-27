import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Mic,
  MicOff,
  Trash2,
  Download,
  SlidersHorizontal,
  BookmarkPlus,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { useSam } from '../context/SamContext';

export const ChatView: React.FC = () => {
  const { data, addChatMessage, clearChatHistory, addValidatedDecision } = useSam();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<number | undefined>(undefined);
  const [conciseness, setConciseness] = useState<'concise' | 'balanced' | 'detailed'>('balanced');
  const [tone, setTone] = useState<'direct_chaleureux' | 'analytique' | 'academique_strict'>('direct_chaleureux');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.chatHistory, isSending]);

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
        setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

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

  const handleSend = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isSending) return;

    // Add Donald's message
    addChatMessage({
      sender: 'Donald',
      content: textToSend,
      stageReferenceId: selectedStageId,
    });

    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: data.chatHistory,
          stageId: selectedStageId,
          tone,
          conciseness,
          context: {
            topic: data.profile.topic,
            subTopic: data.profile.subTopic,
            contextLocation: data.profile.contextLocation,
            defenseDate: data.profile.defenseDate,
            decisions: data.decisions,
            stages: data.stages,
          },
        }),
      });

      const resData = await res.json();
      if (resData.success && resData.reply) {
        addChatMessage({
          sender: 'SAM',
          content: resData.reply,
          stageReferenceId: selectedStageId,
        });
      } else {
        addChatMessage({
          sender: 'SAM',
          content: `Donald, j'ai rencontré une interruption lors du traitement : ${resData.error || 'Veuillez réessayer'}.`,
        });
      }
    } catch (err: any) {
      addChatMessage({
        sender: 'SAM',
        content: `Donald, une erreur réseau est survenue. Tes données restent sécurisées localement.`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleExportChat = () => {
    const text = data.chatHistory
      .map((m) => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender} :\n${m.content}\n`)
      .join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAM_Conversation_Donald_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickPrompts = [
    "Aide-moi à problématiser mon sujet d'architecture",
    "Compare les propriétés du BTC stabilisé par rapport au parpaing creux",
    "Synthétise les décisions que nous avons déjà validées",
    "Comment structurer le chapitre de diagnostic de mon site TPFE ?",
    "Pose-moi 3 questions critiques pour éprouver mon hypothèse de recherche",
  ];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-2xl">
      {/* Chat Sub-Header / Controls */}
      <div className="border-b border-slate-800 bg-slate-900/90 p-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-bold shadow-sm">
            S
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              SAM
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/30">
                Opérationnelle
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Dialogue direct avec Donald • Contexte mémoire actif
            </p>
          </div>
        </div>

        {/* Filter & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stage anchor */}
          <select
            value={selectedStageId || ''}
            onChange={(e) => setSelectedStageId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="">Ancrage : Mémoire global</option>
            {data.stages.map((st) => (
              <option key={st.id} value={st.id}>
                Étape {st.id} : {st.title.slice(0, 30)}...
              </option>
            ))}
          </select>

          {/* Concision */}
          <select
            value={conciseness}
            onChange={(e: any) => setConciseness(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="concise">Concision : Synthétique</option>
            <option value="balanced">Concision : Équilibré</option>
            <option value="detailed">Concision : Approfondi</option>
          </select>

          {/* Action buttons */}
          <button
            onClick={handleExportChat}
            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-white"
            title="Exporter l'historique en Markdown"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm("Réinitialiser l'historique de conversation ?")) {
                clearChatHistory();
              }
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-400 hover:text-red-400"
            title="Vider la discussion"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {data.chatHistory.map((msg) => {
          const isSam = msg.sender === 'SAM';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSam ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  {isSam ? 'SAM' : 'Donald'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.stageReferenceId && (
                  <span className="text-[9px] bg-slate-800 text-amber-300 px-1.5 rounded">
                    Étape #{msg.stageReferenceId}
                  </span>
                )}
              </div>

              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  isSam
                    ? 'rounded-tl-xs border border-slate-800 bg-slate-800/80 text-slate-100 shadow-sm'
                    : 'rounded-tr-xs bg-amber-500 text-slate-950 font-medium shadow-md shadow-amber-500/10'
                }`}
              >
                {msg.content}
              </div>

              {/* Quick action on SAM reply: validate as decision */}
              {isSam && msg.content.length > 50 && (
                <div className="mt-1 flex items-center gap-2 px-1">
                  <button
                    onClick={() => {
                      const text = prompt("Enregistrer un extrait de cette réponse comme décision validée de ton projet :", msg.content.slice(0, 160));
                      if (text) {
                        addValidatedDecision({
                          date: new Date().toISOString().split('T')[0],
                          stageName: selectedStageId ? `Étape #${selectedStageId}` : "Séance d'échange",
                          decisionText: text,
                          justification: "Validé lors de l'échange avec SAM",
                          impactOnProject: "Orientera les futurs choix de conception et de rédaction",
                        });
                        alert("Décision officielle enregistrée dans la mémoire du projet !");
                      }
                    }}
                    className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition"
                  >
                    <BookmarkPlus className="h-3 w-3" />
                    Enregistrer comme décision du projet
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isSending && (
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-semibold text-slate-400 mb-1 px-1">SAM</span>
            <div className="rounded-2xl rounded-tl-xs border border-slate-800 bg-slate-800/60 p-4 text-xs text-amber-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
              <span>SAM analyse et formule sa réponse pour Donald...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-900/60 overflow-x-auto flex gap-2 scrollbar-none">
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(undefined, p)}
            disabled={isSending}
            className="rounded-full border border-slate-800 bg-slate-800/50 px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-amber-300 whitespace-nowrap transition cursor-pointer"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="border-t border-slate-800 bg-slate-900/90 p-3 sm:p-4 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleRecording}
          className={`rounded-xl p-2.5 transition cursor-pointer ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'border border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
          }`}
          title={isRecording ? "Arrêter la dictée" : "Activer la dictée vocale"}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? "SAM vous écoute Donald..." : "Pose une question, demande une formulation, ou soumets une hypothèse..."}
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="rounded-xl bg-amber-500 p-2.5 text-slate-950 font-bold hover:bg-amber-400 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

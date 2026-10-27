import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  History,
  Check,
  ChevronRight,
  Eye,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { MemoirSection, SectionValidationStep } from '../types/sam';

export const DraftingView: React.FC = () => {
  const { data, updateSection } = useSam();
  const [selectedSectionId, setSelectedSectionId] = useState<string>(data.sections[0]?.id || '');
  const [isProcessingStep, setIsProcessingStep] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const section = data.sections.find((s) => s.id === selectedSectionId) || data.sections[0];

  const stepsList: { step: SectionValidationStep; label: string; desc: string }[] = [
    { step: 1, label: "Consignes & Sources", desc: "Cadrage initial des besoins et documents" },
    { step: 2, label: "Proposition de Plan", desc: "Architecture logique des arguments" },
    { step: 3, label: "Données Manquantes", desc: "Relevés de terrain et chiffres à réunir" },
    { step: 4, label: "Premier Jet Rédigé", desc: "Rédaction académique rigoureuse" },
    { step: 5, label: "Références Intégrées", desc: "Formatage des citations et sources" },
    { step: 6, label: "Points Critiques", desc: "Audit de cohérence et chassé-croisé" },
    { step: 7, label: "Validation Donald", desc: "Ajustements et retours de Donald" },
    { step: 8, label: "Section Validée", desc: "Archivage et gel de la version finale" },
  ];

  const handleRunAiStep = async (stepNum: SectionValidationStep) => {
    setIsProcessingStep(true);
    try {
      const res = await fetch('/api/draft-academic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionTitle: section.title,
          stepNumber: stepNum,
          currentOutline: section.outline,
          existingDraft: section.draftContent,
          instructions: instructions || `Contexte : ${data.profile.topic}. Veiller à la précision bioclimatique.`,
          contextData: {
            topic: data.profile.topic,
            subTopic: data.profile.subTopic,
            contextLocation: data.profile.contextLocation,
          },
        }),
      });

      const resData = await res.json();
      if (resData.success && resData.result) {
        if (stepNum === 2) {
          updateSection(section.id, {
            outline: resData.result,
            currentStep: 3,
          });
        } else if (stepNum === 3) {
          updateSection(section.id, {
            missingData: [resData.result],
            currentStep: 4,
          });
        } else if (stepNum === 4) {
          // New draft generated: save current into history if not empty
          const newVersions = section.draftContent
            ? [
                ...section.versions,
                {
                  version: section.versions.length + 1,
                  timestamp: new Date().toISOString(),
                  content: section.draftContent,
                  notes: 'Version précédente avant nouveau jet',
                },
              ]
            : section.versions;

          updateSection(section.id, {
            draftContent: resData.result,
            versions: newVersions,
            currentStep: 5,
          });
        } else if (stepNum === 6) {
          updateSection(section.id, {
            verificationPoints: [resData.result],
            currentStep: 7,
          });
        }
      }
    } catch (e) {
      alert('Erreur lors du traitement académique');
    } finally {
      setIsProcessingStep(false);
      setInstructions('');
    }
  };

  const handleValidateSection = () => {
    updateSection(section.id, {
      currentStep: 8,
      isValidatedByDonald: true,
      versions: [
        ...section.versions,
        {
          version: section.versions.length + 1,
          timestamp: new Date().toISOString(),
          content: section.draftContent,
          notes: 'Version officiellement validée par Donald pour le mémoire',
        },
      ],
    });
    alert(`Félicitations Donald ! La section "${section.title}" est validée.`);
  };

  // Export to Word compatible HTML (.doc)
  const handleExportWord = () => {
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${section.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: black; margin: 2.5cm; }
          h1 { font-size: 18pt; font-weight: bold; color: #1e293b; border-bottom: 2pt solid #e2e8f0; padding-bottom: 6pt; }
          h2 { font-size: 14pt; font-weight: bold; color: #334155; margin-top: 18pt; }
          p { text-align: justify; text-indent: 1.25cm; margin-bottom: 8pt; }
          .header-meta { font-size: 10pt; color: #64748b; margin-bottom: 24pt; }
        </style>
      </head>
      <body>
        <div class="header-meta">
          <strong>Auteur :</strong> Donald • Master en Architecture<br>
          <strong>Sujet :</strong> ${data.profile.topic}<br>
          <strong>Institution :</strong> ${data.profile.university}<br>
          <strong>Date d'export :</strong> ${new Date().toLocaleDateString('fr-FR')}
        </div>
        <h1>${section.title}</h1>
        <div>${section.draftContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Memoire_Donald_${section.code}_${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const wordCount = section.draftContent
    ? section.draftContent.split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PenTool className="h-6 w-6 text-amber-400" />
            Atelier de Rédaction Académique
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Progression méthodique section par section selon le protocole rigoureux en 8 étapes. Donald garde le contrôle absolu sur chaque mot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            {previewMode ? 'Mode Éditeur' : 'Aperçu Manuscrit'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
            title="Imprimer ou enregistrer en PDF propre"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimer / PDF
          </button>
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer"
            title="Télécharger au format Word (.doc)"
          >
            <Download className="h-3.5 w-3.5" />
            Export Word (.doc)
          </button>
        </div>
      </div>

      {/* Section selector tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {data.sections.map((sec) => {
          const isSelected = sec.id === section.id;
          return (
            <button
              key={sec.id}
              onClick={() => setSelectedSectionId(sec.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap border ${
                isSelected
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{sec.title}</span>
              {sec.isValidatedByDonald && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 8-Step Progress Stepper */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            Protocole de progression (Étape {section.currentStep}/8)
          </span>
          <span className="text-slate-400">
            {stepsList.find((s) => s.step === section.currentStep)?.desc}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {stepsList.map((st) => {
            const isCompleted = section.currentStep > st.step || section.isValidatedByDonald;
            const isCurrent = section.currentStep === st.step;
            return (
              <button
                key={st.step}
                onClick={() => updateSection(section.id, { currentStep: st.step })}
                className={`p-2 rounded-xl text-left border transition text-[11px] cursor-pointer ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                    : isCurrent
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold shadow-sm'
                    : 'border-slate-800 bg-slate-800/40 text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold">Étape {st.step}</span>
                  {isCompleted && <Check className="h-3 w-3 text-emerald-400" />}
                </div>
                <div className="mt-0.5 truncate font-medium">{st.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Drafting Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor or Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">
                Volume rédigé : <strong className="text-white">{wordCount}</strong> / {section.targetWordCount} mots
              </span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs text-slate-400">
                Versions : <strong className="text-white">{section.versions.length}</strong>
              </span>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1"
            >
              <History className="h-3.5 w-3.5" />
              {showHistory ? 'Masquer historique' : 'Historique des versions'}
            </button>
          </div>

          {/* Versions drawer if open */}
          {showHistory && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-slate-200">Versions antérieures de cette section</h4>
              {section.versions.length === 0 ? (
                <p className="text-slate-500 italic">Aucune version antérieure enregistrée.</p>
              ) : (
                section.versions.map((v) => (
                  <div
                    key={v.version}
                    className="flex items-center justify-between border-b border-slate-800 py-2"
                  >
                    <div>
                      <span className="font-semibold text-amber-300">Version {v.version}</span>
                      <span className="text-slate-500 ml-2">
                        {new Date(v.timestamp).toLocaleString()}
                      </span>
                      <p className="text-slate-400 text-[11px] mt-0.5">{v.notes}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Restaurer la version ${v.version} ?`)) {
                          updateSection(section.id, { draftContent: v.content });
                        }
                      }}
                      className="text-xs text-amber-400 hover:underline"
                    >
                      Restaurer
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Editor Area */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-inner">
            {previewMode ? (
              <div className="font-academic text-slate-100 text-sm sm:text-base leading-relaxed space-y-4 max-w-none p-4 bg-slate-950/60 rounded-xl">
                <h2 className="text-xl font-bold text-amber-200 border-b border-slate-800 pb-2">
                  {section.title}
                </h2>
                <div className="whitespace-pre-wrap">
                  {section.draftContent || (
                    <span className="italic text-slate-500">Section encore vierge.</span>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                value={section.draftContent}
                onChange={(e) => updateSection(section.id, { draftContent: e.target.value })}
                placeholder="Rédige ici ou laisse SAM proposer un premier jet selon ton plan..."
                rows={16}
                className="w-full font-academic text-sm sm:text-base text-slate-100 leading-relaxed bg-transparent focus:outline-none resize-y"
              />
            )}
          </div>

          {/* Validation Banner by Donald */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-300 block">
                Validation définitive de Donald :
              </span>
              <span className="text-[11px] text-slate-500">
                {section.isValidatedByDonald
                  ? "Section validée et approuvée pour l'incorporation dans le manuscrit final."
                  : "Section en cours de maturation. N'hésite pas à demander un audit à SAM."}
              </span>
            </div>

            <button
              onClick={handleValidateSection}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                section.isValidatedByDonald
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {section.isValidatedByDonald ? 'Section déjà validée' : 'Valider cette version'}
            </button>
          </div>
        </div>

        {/* Right Column: SAM Co-Pilot & Step Actions */}
        <div className="space-y-4">
          {/* Active Step Actions */}
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="h-4 w-4" />
              SAM • Assistance Étape {section.currentStep}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Consignes spécifiques de Donald pour SAM :
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex: Concentre-toi sur la critique du béton armé à Cotonou et intègre les données de Givoni..."
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleRunAiStep(2)}
                disabled={isProcessingStep}
                className="w-full flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-slate-200 hover:border-amber-500 hover:text-amber-300 transition cursor-pointer"
              >
                <span>2. Proposer un plan détaillé</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleRunAiStep(3)}
                disabled={isProcessingStep}
                className="w-full flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-slate-200 hover:border-amber-500 hover:text-amber-300 transition cursor-pointer"
              >
                <span>3. Identifier données manquantes</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>

              <button
                onClick={() => handleRunAiStep(4)}
                disabled={isProcessingStep}
                className="w-full flex items-center justify-between rounded-xl bg-amber-500 p-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
              >
                <span>4. Rédiger le premier jet académique</span>
                <Sparkles className="h-4 w-4" />
              </button>

              <button
                onClick={() => handleRunAiStep(6)}
                disabled={isProcessingStep}
                className="w-full flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs text-slate-200 hover:border-amber-500 hover:text-amber-300 transition cursor-pointer"
              >
                <span>6. Audit critique & cohérence scientifique</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            {isProcessingStep && (
              <div className="text-center py-2 text-xs text-amber-300 animate-pulse">
                SAM rédige selon les règles académiques...
              </div>
            )}
          </div>

          {/* Plan Outline display */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center justify-between">
              <span>Plan directeur de la section</span>
              <button
                onClick={() => {
                  const p = prompt("Modifier le plan :", section.outline);
                  if (p !== null) updateSection(section.id, { outline: p });
                }}
                className="text-[10px] text-amber-400 hover:underline"
              >
                Modifier
              </button>
            </h4>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
              {section.outline || 'Aucun plan défini. Clique sur "2. Proposer un plan".'}
            </div>
          </div>

          {/* Verification Points / Missing Data */}
          {(section.missingData.length > 0 || section.verificationPoints.length > 0) && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs">
              <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Vérifications & Données requises
              </h4>
              {section.missingData.map((m, i) => (
                <div key={i} className="text-slate-300 text-[11px] bg-slate-950/50 p-2 rounded">
                  {m}
                </div>
              ))}
              {section.verificationPoints.map((v, i) => (
                <div key={i} className="text-slate-300 text-[11px] bg-slate-950/50 p-2 rounded">
                  {v}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

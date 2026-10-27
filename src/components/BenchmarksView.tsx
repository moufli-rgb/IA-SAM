import React, { useState } from 'react';
import {
  Award,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Scale,
  BookOpen,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { BenchmarkThesis } from '../types/sam';

export const BenchmarksView: React.FC = () => {
  const { data, addBenchmark } = useSam();
  const [selectedThesisId, setSelectedThesisId] = useState<string>(data.benchmarks[0]?.id || '');
  const [isAnalyzingNew, setIsAnalyzingNew] = useState(false);

  // Form state for AI analysis of a thesis
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [university, setUniversity] = useState('');
  const [grade, setGrade] = useState('18/20 - Mention Très Bien');
  const [thesisText, setThesisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const selectedThesis = data.benchmarks.find((b) => b.id === selectedThesisId) || data.benchmarks[0];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesisText.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/analyze-thesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thesisTitle: title.trim() || 'Mémoire de Master en Architecture',
          author: author.trim(),
          university: university.trim(),
          grade: grade.trim(),
          thesisText: thesisText.trim(),
        }),
      });

      const resData = await res.json();
      if (resData.success && resData.analysis) {
        setAnalysisResult(resData.analysis);

        // Add to benchmark store
        addBenchmark({
          title: title.trim() || 'Mémoire de référence',
          author: author.trim() || 'Anonyme',
          university: university.trim() || 'École d’Architecture',
          year: new Date().getFullYear().toString(),
          gradeOrMention: grade.trim(),
          generalPlan: "Déduit de l'analyse SAM",
          problemStatementMethod: "Déduit de l'analyse SAM",
          theoreticalFramework: "Déduit de l'analyse SAM",
          architecturalIntegration: "Déduit de l'analyse SAM",
          strengths: ["Rigueur d'argumentation", "Clarté des schémas d'ambiance"],
          weaknesses: ["Données de simulation à approfondir"],
          lessonsForDonald: [
            "Structurer chaque sous-partie autour d'une tension spatiale",
            "Relier directement chaque concept théorique à une décision sur le TPFE",
          ],
        });
      }
    } catch (e) {
      alert("Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-400" />
            Analyse des Mémoires de Référence (Benchmarks)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Déconstruction des mémoires primés pour assimiler leurs exigences structurelles et méthodologiques sans jamais plagier.
          </p>
        </div>

        <button
          onClick={() => setIsAnalyzingNew(!isAnalyzingNew)}
          className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          {isAnalyzingNew ? 'Fermer l’analyseur' : 'Analyser un nouveau mémoire'}
        </button>
      </div>

      {/* AI Dissection Drawer */}
      {isAnalyzingNew && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 space-y-4 shadow-2xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Analyseur de Mémoire de Référence par SAM
          </h3>
          <p className="text-xs text-slate-400">
            Colle le sommaire, l'introduction, la problématique ou les extraits clés d'un mémoire d'architecture ayant obtenu une excellente note. SAM va en extraire l'ossature logique.
          </p>

          <form onSubmit={handleAnalyze} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Titre du mémoire</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Habiter l'air et la terre..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Auteur</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nom de l'étudiant"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Note / Mention obtenue</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="18/20 - Félicitations"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Extraits, Sommaire détaillé, Problématique ou texte du mémoire *
              </label>
              <textarea
                required
                value={thesisText}
                onChange={(e) => setThesisText(e.target.value)}
                rows={6}
                placeholder="Colle ici le texte ou le plan du mémoire..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-3 text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={isAnalyzing}
                className="rounded-lg bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? 'Déconstruction en cours...' : 'Lancer la déconstruction méthodologique'}
              </button>
            </div>
          </form>

          {analysisResult && (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Rapport de dissection produit par SAM :
              </h4>
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {analysisResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Benchmark Selector tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {data.benchmarks.map((bm) => (
          <button
            key={bm.id}
            onClick={() => setSelectedThesisId(bm.id)}
            className={`rounded-xl px-4 py-2.5 text-xs text-left transition whitespace-nowrap cursor-pointer border ${
              selectedThesis?.id === bm.id
                ? 'border-amber-500 bg-amber-500/10 text-white font-bold shadow-sm'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold">{bm.title.slice(0, 36)}...</div>
            <div className="text-[10px] text-amber-400 font-normal">
              {bm.gradeOrMention || 'Mémoire de référence'}
            </div>
          </button>
        ))}
      </div>

      {/* Selected Benchmark Detail */}
      {selectedThesis && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {selectedThesis.gradeOrMention}
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                {selectedThesis.title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedThesis.author} • {selectedThesis.university} ({selectedThesis.year})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left Column : Plan & Problématique */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                <h4 className="font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  Architecture générale & Enchaînement du Plan
                </h4>
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedThesis.generalPlan}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                <h4 className="font-bold text-sky-400 mb-2">
                  Construction de la problématique & Méthode de démonstration
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  {selectedThesis.problemStatementMethod}
                </p>
              </div>
            </div>

            {/* Right Column : Strengths, Weaknesses, Lessons for Donald */}
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-4">
                <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Points forts observés par SAM
                </h4>
                <ul className="list-disc list-inside text-slate-300 space-y-1 leading-relaxed">
                  {selectedThesis.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Enseignements concrets et transposables pour Donald
                </h4>
                <ul className="list-disc list-inside text-slate-200 space-y-1.5 leading-relaxed font-medium">
                  {selectedThesis.lessonsForDonald.map((les, i) => (
                    <li key={i}>{les}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparative Grid Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Scale className="h-4 w-4 text-amber-400" />
          Grille Comparative Synthétique des Bonnes Pratiques
        </h3>
        <p className="text-xs text-slate-400">
          Ce que les jurys d'architecture recherchent en priorité pour attribuer les félicitations :
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 pr-4 font-semibold">Critère d'excellence</th>
                <th className="py-2 pr-4 font-semibold">Erreur fréquente des étudiants</th>
                <th className="py-2 font-semibold text-emerald-400">Recommandation de SAM pour Donald</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 pr-4 font-medium text-white">Problématique</td>
                <td className="py-2.5 pr-4 text-slate-400">Simple exposé d'une situation sans tension dialectique.</td>
                <td className="py-2.5 text-emerald-300">Poser une tension concrète : ex. modernité formelle vs vulnérabilité thermique.</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-white">Lien Mémoire - TPFE</td>
                <td className="py-2.5 pr-4 text-slate-400">Mémoire théorique déconnecté du dessin architectural.</td>
                <td className="py-2.5 text-emerald-300">Chaque concept théorique doit se matérialiser dans une coupe ou un détail 1/20.</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-white">Style rédactionnel</td>
                <td className="py-2.5 pr-4 text-slate-400">Phrases à rallonge, formules creuses (« De tout temps... »).</td>
                <td className="py-2.5 text-emerald-300">Phrases sobres, verbes d'action, preuves chiffrées et sources certifiées.</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-white">Revue de littérature</td>
                <td className="py-2.5 pr-4 text-slate-400">Empilement de résumés d'auteurs sans lien critique.</td>
                <td className="py-2.5 text-emerald-300">Confrontation croisée : comparer Givoni, CRAterre et Frampton sur le même problème.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

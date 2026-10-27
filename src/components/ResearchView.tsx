import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  Plus,
  Sparkles,
  CheckCircle,
  AlertCircle,
  FileText,
  Filter,
  BookmarkPlus,
  Globe,
} from 'lucide-react';
import { useSam } from '../context/SamContext';

export const ResearchView: React.FC = () => {
  const { addSource, data } = useSam();
  const [query, setQuery] = useState('');
  const [researchType, setResearchType] = useState('scientifique');
  const [theme, setTheme] = useState('Bioclimatique & Matériaux');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    text: string;
    sources: { title: string; url: string }[];
  } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || query.trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setResults(null);
    setSavedSuccess(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          researchType,
          theme,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setResults({
          text: resData.text,
          sources: resData.sources || [],
        });
      } else {
        alert(resData.error || 'Erreur lors de la recherche');
      }
    } catch (e: any) {
      alert('Erreur réseau lors de la recherche.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAddAsSource = (title: string, url: string) => {
    addSource({
      title,
      authors: 'Auteur extrait du Web',
      year: new Date().getFullYear().toString(),
      type: 'site',
      doiOrUrl: url,
      summary: `Source identifiée lors de la recherche documentaire sur "${query}".`,
      architecturalRelevance: `Données exploitables pour le mémoire et le TPFE sur le thème ${theme}.`,
      keyQuotes: [],
      verified: true,
      theme,
    });
    setSavedSuccess(`Source "${title.slice(0, 30)}..." ajoutée à ta bibliothèque !`);
    setTimeout(() => setSavedSuccess(null), 4000);
  };

  const suggestedQueries = [
    "Conductivité thermique brique de terre compressée stabilisée climat tropical",
    "Diagramme bioclimatique de Givoni ventilation naturelle confort d'été",
    "Normes de conception architecturale passive en Afrique de l'Ouest",
    "Typologie des patios régulateurs thermiques en climat chaud et humide",
    "Kenneth Frampton régionalisme critique architecture africaine",
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Search Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Search className="h-6 w-6 text-amber-400" />
          Recherche Documentaire & Scientifique
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Recherche Web sourcée via Google Search Grounding. SAM privilégie les sources scientifiques, réglementaires et institutionnelles réelles.
        </p>
      </div>

      {/* Search Bar & Filters */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des articles, thèses, normes, caractéristiques physiques des matériaux..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 pl-12 pr-32 py-3.5 text-sm text-white placeholder-slate-500 shadow-xl focus:border-amber-500 focus:outline-none"
          />
          <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2.5 top-2.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-40 cursor-pointer"
          >
            {isLoading ? 'Recherche...' : 'Lancer'}
          </button>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">Type de recherche :</span>
            <select
              value={researchType}
              onChange={(e) => setResearchType(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="scientifique">Articles scientifiques & Thèses</option>
              <option value="normative">Normes thermiques & Textes légaux</option>
              <option value="technique">Fiches techniques & Matériaux (BTC, bois, terre)</option>
              <option value="etude_de_cas">Études de cas architecturaux contemporains</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Thématique :</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="Bioclimatique & Matériaux">Bioclimatique & Matériaux</option>
              <option value="Conception du Site & Climat">Conception du Site & Climat</option>
              <option value="Typologies & Espaces">Typologies & Espaces</option>
              <option value="Théorie & Régionalisme">Théorie & Régionalisme</option>
              <option value="Réglementation & Énergie">Réglementation & Énergie</option>
            </select>
          </div>
        </div>
      </form>

      {/* Suggested Queries */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Suggestions de requêtes prioritaires pour Donald :
        </span>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuery(sq);
                handleSearch(undefined, sq);
              }}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-400 hover:text-amber-300 hover:border-slate-700 transition cursor-pointer"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Notification if saved */}
      {savedSuccess && (
        <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          {savedSuccess}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center space-y-3">
          <Sparkles className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-white">
            SAM explore le Web et la littérature scientifique pour Donald...
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Interrogation des bases bibliographiques, recoupement des données sur les matériaux locaux et formulation de la synthèse critique.
          </p>
        </div>
      )}

      {/* Results View */}
      {results && !isLoading && (
        <div className="space-y-6">
          {/* Web Links / Grounded Sources */}
          {results.sources.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Sources directes repérées sur le Web ({results.sources.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {results.sources.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-800/40 p-3 hover:border-slate-700 transition"
                  >
                    <div className="truncate text-xs">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-slate-200 hover:text-amber-300 flex items-center gap-1.5 truncate"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{s.title}</span>
                      </a>
                      <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                        {s.url}
                      </span>
                    </div>

                    <button
                      onClick={() => handleQuickAddAsSource(s.title, s.url)}
                      className="shrink-0 rounded-lg bg-amber-500/15 border border-amber-500/30 p-1.5 text-amber-300 hover:bg-amber-500/30 transition cursor-pointer"
                      title="Ajouter cette référence à ma bibliothèque"
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synthesized Academic Report */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-400" />
                Synthèse documentaire de SAM pour Donald
              </h2>
              <button
                onClick={() => {
                  const title = prompt("Titre pour enregistrer cette fiche de recherche :", `Recherche : ${query}`);
                  if (title) {
                    addSource({
                      title,
                      authors: "Synthèse documentaire SAM (Google Search)",
                      year: new Date().getFullYear().toString(),
                      type: 'rapport',
                      doiOrUrl: results.sources[0]?.url || '',
                      summary: results.text.slice(0, 400) + '...',
                      architecturalRelevance: `Données scientifiques rassemblées sur la requête "${query}".`,
                      keyQuotes: [],
                      verified: true,
                      theme,
                    });
                    setSavedSuccess("Fiche complète enregistrée dans ta bibliothèque de sources !");
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                Enregistrer la fiche dans la bibliothèque
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-3">
              {results.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  CheckCircle,
  FileText,
  Filter,
  Quote,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { ReferenceSource } from '../types/sam';

export const SourcesView: React.FC = () => {
  const { data, addSource, removeSource } = useSam();
  const [selectedTheme, setSelectedTheme] = useState('Tous');
  const [isAdding, setIsAdding] = useState(false);

  // New source form state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthors, setNewAuthors] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newType, setNewType] = useState<ReferenceSource['type']>('article');
  const [newDoi, setNewDoi] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newRelevance, setNewRelevance] = useState('');
  const [newQuote, setNewQuote] = useState('');
  const [newTheme, setNewTheme] = useState('Bioclimatique & Matériaux');

  const themes = ['Tous', 'Bioclimatique & Confort thermique', 'Matériaux locaux & Tectonique', 'Théorie architecturale', 'Normes & Énergie', 'Général'];

  const filteredSources =
    selectedTheme === 'Tous'
      ? data.sources
      : data.sources.filter((s) => s.theme.includes(selectedTheme) || s.theme === selectedTheme);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addSource({
      title: newTitle.trim(),
      authors: newAuthors.trim() || 'Auteur non renseigné',
      year: newYear.trim() || '2026',
      type: newType,
      doiOrUrl: newDoi.trim(),
      summary: newSummary.trim(),
      architecturalRelevance: newRelevance.trim(),
      keyQuotes: newQuote.trim() ? [newQuote.trim()] : [],
      verified: true,
      theme: newTheme,
    });

    // Reset
    setNewTitle('');
    setNewAuthors('');
    setNewDoi('');
    setNewSummary('');
    setNewRelevance('');
    setNewQuote('');
    setIsAdding(false);
  };

  // Export functions
  const handleExportAPA = () => {
    const list = data.sources.map((s) => {
      return `${s.authors} (${s.year}). ${s.title}. ${s.doiOrUrl ? `[Lien/DOI: ${s.doiOrUrl}]` : ''}`;
    });
    const content = `BIBLIOGRAPHIE OFFICIELLE DU MÉMOIRE DE DONALD\nNorme APA 7ème édition\n\n` + list.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bibliographie_APA_Donald_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportBibTeX = () => {
    const entries = data.sources.map((s, idx) => {
      const citeKey = `${s.authors.split(',')[0].replace(/\s+/g, '').toLowerCase()}${s.year || idx}`;
      const entryType = s.type === 'livre' ? 'book' : s.type === 'these' ? 'phdthesis' : 'article';
      return `@${entryType}{${citeKey},
  title = {${s.title}},
  author = {${s.authors}},
  year = {${s.year}},
  url = {${s.doiOrUrl || ''}},
  note = {${s.architecturalRelevance.replace(/[\n\r]/g, ' ')}}
}`;
    });
    const blob = new Blob([entries.join('\n\n')], { type: 'application/x-bibtex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bibliographie_Donald_${new Date().toISOString().split('T')[0]}.bib`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-400" />
            Bibliothèque de Références Vérifiées
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {data.sources.length} sources référencées pour étayer le mémoire et le projet TPFE de Donald.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportAPA}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:text-white cursor-pointer"
            title="Exporter en format APA"
          >
            <Download className="h-3.5 w-3.5" />
            Export APA (.txt)
          </button>
          <button
            onClick={handleExportBibTeX}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:text-white cursor-pointer"
            title="Exporter en format BibTeX pour LaTeX/Zotero"
          >
            <Download className="h-3.5 w-3.5" />
            Export BibTeX (.bib)
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Ajouter une référence
          </button>
        </div>
      </div>

      {/* Theme Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {themes.map((th) => (
          <button
            key={th}
            onClick={() => setSelectedTheme(th)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              selectedTheme === th
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {th}
          </button>
        ))}
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-6 shadow-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-amber-400" />
            Nouvelle Fiche Bibliographique
          </h3>
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Titre de l'ouvrage ou article *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Architecture bioclimatique en milieu tropical"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Auteur(s) (Nom, Prénom)</label>
                <input
                  type="text"
                  value={newAuthors}
                  onChange={(e) => setNewAuthors(e.target.value)}
                  placeholder="Ex: Givoni, Baruch"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Année d'édition</label>
                <input
                  type="text"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="2024"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Type de document</label>
                <select
                  value={newType}
                  onChange={(e: any) => setNewType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                >
                  <option value="article">Article scientifique</option>
                  <option value="livre">Ouvrage / Livre</option>
                  <option value="these">Thèse de Doctorat / Mémoire Master</option>
                  <option value="norme">Norme réglementaire</option>
                  <option value="rapport">Rapport institutionnel</option>
                  <option value="site">Ressource en ligne / Site web</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Lien URL ou DOI officiel</label>
                <input
                  type="text"
                  value={newDoi}
                  onChange={(e) => setNewDoi(e.target.value)}
                  placeholder="https://doi.org/... ou URL de la publication"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Résumé synthétique</label>
              <textarea
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Principales thèses, découvertes ou conclusions de l'auteur..."
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Pertinence pour le projet de Donald (TPFE & Mémoire)</label>
              <textarea
                value={newRelevance}
                onChange={(e) => setNewRelevance(e.target.value)}
                placeholder="En quoi ce document justifie-t-il mes choix spatiaux ou mes calculs thermiques ?"
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Citation clé exploitable</label>
              <input
                type="text"
                value={newQuote}
                onChange={(e) => setNewQuote(e.target.value)}
                placeholder="'Citation exacte avec numéro de page si possible...'"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                Enregistrer dans la bibliothèque
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sources Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSources.map((source) => (
          <div
            key={source.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3.5 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mb-1.5">
                  {source.type} • {source.year}
                </span>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {source.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {source.authors}
                </p>
              </div>

              <button
                onClick={() => {
                  if (confirm("Supprimer cette référence ?")) {
                    removeSource(source.id);
                  }
                }}
                className="text-slate-600 hover:text-red-400 p-1"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {source.doiOrUrl && (
              <a
                href={source.doiOrUrl.startsWith('http') ? source.doiOrUrl : `https://doi.org/${source.doiOrUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline truncate max-w-full"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{source.doiOrUrl}</span>
              </a>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              {source.summary}
            </p>

            {source.architecturalRelevance && (
              <div className="rounded-xl bg-slate-800/40 p-3 border border-slate-800/80 text-[11px] space-y-1">
                <span className="font-semibold text-emerald-400 block">
                  Intérêt direct pour le projet :
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {source.architecturalRelevance}
                </p>
              </div>
            )}

            {source.keyQuotes && source.keyQuotes.length > 0 && (
              <div className="border-l-2 border-amber-500/60 pl-3 italic text-xs text-amber-200/90 py-0.5">
                {source.keyQuotes[0]}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookmarkPlus, Check, ExternalLink, Search } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { callAi } from '../lib/api';
import { Button, Markdown, PageHeader, Panel, Segmented, Select, Thinking } from '../components/ui';

const TYPES = [
  { value: 'scientifique', label: 'Articles & thèses' },
  { value: 'normative', label: 'Normes' },
  { value: 'technique', label: 'Matériaux' },
  { value: 'etude_de_cas', label: 'Études de cas' },
];
const THEMES = ['Bioclimatique & Matériaux', 'Conception du site & climat', 'Typologies & espaces', 'Théorie & régionalisme', 'Réglementation & énergie'];

export const ResearchView: React.FC = () => {
  const { addSource } = useSam();
  const { toast, ask } = useUi();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('scientifique');
  const [theme, setTheme] = useState(THEMES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<{ q: string; text: string; sources: { title: string; url: string }[] } | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const run = async (q: string) => {
    if (!q.trim() || loading) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setRes(null);
    setSaved(new Set());
    try {
      const r = await callAi<{ text: string; sources: { title: string; url: string }[] }>('research', { query: q, researchType: type, theme });
      setRes({ q, text: r.text, sources: r.sources || [] });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveLink = (s: { title: string; url: string }) => {
    addSource({
      title: s.title,
      authors: 'À compléter',
      year: String(new Date().getFullYear()),
      type: 'site',
      doiOrUrl: s.url,
      summary: `Trouvée en cherchant « ${res?.q} ».`,
      architecturalRelevance: `Thème : ${theme}.`,
      keyQuotes: [],
      verified: false,
      theme,
    });
    setSaved((p) => new Set(p).add(s.url));
    toast('Ajoutée à ta bibliothèque.');
  };

  const saveSynthesis = async () => {
    if (!res) return;
    const title = await ask({ title: 'Enregistrer la synthèse', label: 'Titre de la fiche', defaultValue: `Recherche : ${res.q}` });
    if (!title) return;
    addSource({
      title,
      authors: 'Synthèse SAM (recherche web)',
      year: String(new Date().getFullYear()),
      type: 'rapport',
      doiOrUrl: res.sources[0]?.url || '',
      summary: res.text.slice(0, 600),
      architecturalRelevance: `Synthèse sur « ${res.q} ».`,
      keyQuotes: [],
      verified: false,
      theme,
    });
    toast('Synthèse enregistrée dans la bibliothèque.');
  };

  const suggestions = [
    'Conductivité thermique de la brique de terre compressée stabilisée en climat tropical',
    'Diagramme de Givoni et ventilation naturelle pour le confort d’été',
    'Normes de conception passive en Afrique de l’Ouest',
    'Patios régulateurs thermiques en climat chaud et humide',
    'Kenneth Frampton, régionalisme critique et architecture africaine',
  ];

  return (
    <div>
      <PageHeader
        title="Recherche"
        description="SAM fouille le web en direct et te rend une synthèse sourcée. Chaque lien peut rejoindre ta bibliothèque."
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-ink-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Que veux-tu comprendre ?"
          className="h-16 w-full rounded-full border border-line bg-sheet pr-36 pl-13 text-[1.05rem] placeholder:text-ink-3 focus:border-adire focus:outline-none focus:ring-4 focus:ring-adire/15 md:text-lg"
        />
        <Button type="submit" variant="primary" disabled={!query.trim()} loading={loading} className="absolute top-1/2 right-2 -translate-y-1/2">
          Chercher
        </Button>
      </form>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented size="sm" value={type} onChange={setType} options={TYPES} />
        <Select value={theme} onChange={(e) => setTheme(e.target.value)} className="h-10 py-0 sm:w-64">
          {THEMES.map((t) => <option key={t}>{t}</option>)}
        </Select>
      </div>

      {!res && !loading && (
        <div className="mt-8">
          <p className="mb-2 text-sm font-semibold text-ink-3">Pistes pour démarrer</p>
          <ul className="divide-y divide-line/70 overflow-hidden rounded-[var(--radius-panel)] border border-line/70 bg-sheet">
            {suggestions.map((s) => (
              <li key={s}>
                <button onClick={() => run(s)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-ink transition hover:bg-sheet-2">
                  <Search className="h-4 w-4 shrink-0 text-ink-3" />
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && (
        <div className="mt-8">
          <Thinking label="SAM explore les sources…" detail="Recherche, recoupement, puis synthèse critique. Compte 20 à 40 secondes." />
        </div>
      )}
      {error && <p className="mt-6 rounded-2xl bg-laterite-soft px-4 py-3 text-laterite">{error}</p>}

      {res && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Panel className="p-5 md:p-8">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h2 className="max-w-xl text-[1.15rem] font-semibold leading-snug">{res.q}</h2>
              <Button size="sm" icon={<BookmarkPlus className="h-4 w-4" />} onClick={saveSynthesis}>
                Enregistrer
              </Button>
            </div>
            <Markdown>{res.text}</Markdown>
          </Panel>
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <p className="mb-2 text-sm font-semibold text-ink-3">Sources consultées ({res.sources.length})</p>
            {res.sources.length === 0 ? (
              <p className="text-sm text-ink-2">Aucun lien direct renvoyé. Vérifie les références citées dans la synthèse.</p>
            ) : (
              <ul className="space-y-2">
                {res.sources.map((s) => {
                  const ok = saved.has(s.url);
                  let host = s.url;
                  try { host = new URL(s.url).hostname.replace(/^www\./, ''); } catch { /* url brute */ }
                  return (
                    <li key={s.url} className="flex items-start gap-2 rounded-[var(--radius-inner)] bg-sheet p-3 border border-line/70">
                      <a href={s.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[0.93rem] font-semibold text-ink hover:text-adire">{s.title}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[0.8rem] text-ink-3">
                          <ExternalLink className="h-3 w-3" /> {host}
                        </span>
                      </a>
                      <button
                        onClick={() => !ok && saveLink(s)}
                        aria-label="Ajouter à la bibliothèque"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${ok ? 'bg-feuille-soft text-feuille' : 'bg-sheet-2 text-ink-2 hover:text-adire'}`}
                      >
                        {ok ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </motion.div>
      )}
    </div>
  );
};

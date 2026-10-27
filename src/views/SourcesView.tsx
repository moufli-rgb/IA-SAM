import React, { useMemo, useState } from 'react';
import { BookOpen, Download, ExternalLink, FileText, Globe, Landmark, MessageCircle, Plus, Scale, ScrollText, Search, Trash2 } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { download, today } from '../lib/api';
import type { ReferenceSource } from '../types/sam';
import { Badge, Button, Empty, Field, IconButton, Input, PageHeader, Panel, Segmented, Select, Sheet, TextArea } from '../components/ui';
import type { Nav } from '../App';

const TYPE: Record<ReferenceSource['type'], { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  article: { label: 'Article', icon: FileText },
  livre: { label: 'Livre', icon: BookOpen },
  these: { label: 'Thèse / mémoire', icon: ScrollText },
  norme: { label: 'Norme', icon: Scale },
  rapport: { label: 'Rapport', icon: Landmark },
  site: { label: 'Web', icon: Globe },
};

const empty = { title: '', authors: '', year: String(new Date().getFullYear()), type: 'article' as ReferenceSource['type'], doiOrUrl: '', summary: '', architecturalRelevance: '', quote: '', theme: 'Bioclimatique & Matériaux' };

export const SourcesView: React.FC<{ nav: Nav }> = ({ nav }) => {
  const { data, addSource, removeSource } = useSam();
  const { confirm, toast } = useUi();
  const [type, setType] = useState<string>('all');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(empty);

  const list = useMemo(
    () =>
      data.sources.filter(
        (s) =>
          (type === 'all' || s.type === type) &&
          (!q || `${s.title} ${s.authors} ${s.summary} ${s.theme}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [data.sources, type, q],
  );
  const usedTypes = Array.from(new Set(data.sources.map((s) => s.type)));

  const exportApa = () =>
    download(
      `Bibliographie_APA_${today()}.txt`,
      data.sources.map((s) => `${s.authors} (${s.year}). ${s.title}.${s.doiOrUrl ? ` ${s.doiOrUrl}` : ''}`).sort().join('\n\n'),
    );
  const exportBib = () =>
    download(
      `Bibliographie_${today()}.bib`,
      data.sources
        .map((s, i) => {
          const key = `${(s.authors.split(',')[0] || 'src').replace(/\W+/g, '').toLowerCase()}${s.year || i}`;
          const t = s.type === 'livre' ? 'book' : s.type === 'these' ? 'phdthesis' : s.type === 'site' ? 'misc' : 'article';
          return `@${t}{${key},\n  title = {${s.title}},\n  author = {${s.authors}},\n  year = {${s.year}},\n  url = {${s.doiOrUrl || ''}}\n}`;
        })
        .join('\n\n'),
      'application/x-bibtex',
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    addSource({
      title: f.title.trim(),
      authors: f.authors.trim() || 'Auteur à compléter',
      year: f.year.trim(),
      type: f.type,
      doiOrUrl: f.doiOrUrl.trim(),
      summary: f.summary.trim(),
      architecturalRelevance: f.architecturalRelevance.trim(),
      keyQuotes: f.quote.trim() ? [f.quote.trim()] : [],
      verified: true,
      theme: f.theme,
    });
    setF(empty);
    setAdding(false);
    toast('Référence ajoutée.');
  };

  return (
    <div>
      <PageHeader
        title="Bibliothèque"
        description={`${data.sources.length} référence${data.sources.length > 1 ? 's' : ''} pour étayer ton mémoire. Exporte-les en APA ou BibTeX quand tu veux.`}
        actions={
          <>
            <Button size="sm" variant="ghost" icon={<Download className="h-4 w-4" />} onClick={exportApa}>APA</Button>
            <Button size="sm" variant="ghost" icon={<Download className="h-4 w-4" />} onClick={exportBib}>BibTeX</Button>
            <Button size="sm" variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>Ajouter</Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un titre, un auteur…" className="h-10 rounded-full py-0 pl-10" />
        </div>
        <Segmented
          size="sm"
          value={type}
          onChange={setType}
          options={[{ value: 'all', label: 'Tout', count: data.sources.length }, ...usedTypes.map((t) => ({ value: t, label: TYPE[t].label }))]}
        />
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<BookOpen className="h-8 w-8" />}
          title={data.sources.length ? 'Aucune référence ne correspond.' : 'Ta bibliothèque est vide.'}
          body="Ajoute une référence à la main ou lance une recherche : chaque lien trouvé peut être enregistré ici."
          action={<Button variant="primary" size="sm" onClick={() => nav('research')}>Lancer une recherche</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map((s) => {
            const T = TYPE[s.type] || TYPE.site;
            const href = s.doiOrUrl ? (s.doiOrUrl.startsWith('http') ? s.doiOrUrl : `https://doi.org/${s.doiOrUrl}`) : null;
            return (
              <Panel key={s.id} className="flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-adire-soft text-adire">
                    <T.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold leading-snug text-ink">{s.title}</h3>
                    <p className="mt-0.5 text-sm text-ink-2">
                      {s.authors}, {s.year}
                    </p>
                  </div>
                  <IconButton
                    label="Supprimer"
                    tone="danger"
                    className="-mt-1 -mr-2"
                    onClick={async () => {
                      if (await confirm({ title: 'Supprimer cette référence ?', description: s.title, confirmLabel: 'Supprimer', danger: true })) removeSource(s.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
                {s.summary && <p className="mt-3 line-clamp-4 text-[0.95rem] text-ink-2">{s.summary}</p>}
                {s.keyQuotes?.[0] && (
                  <blockquote className="mt-3 border-l-[3px] border-soleil pl-3 font-serif text-[0.98rem] italic text-ink">
                    {s.keyQuotes[0]}
                  </blockquote>
                )}
                {s.architecturalRelevance && (
                  <p className="mt-3 rounded-[var(--radius-inner)] bg-feuille-soft/60 px-3 py-2 text-sm text-ink">
                    <span className="font-semibold text-feuille">Pour ton projet : </span>
                    {s.architecturalRelevance}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  <Badge>{T.label}</Badge>
                  {!s.verified && <Badge tone="soleil">À vérifier</Badge>}
                  <span className="flex-1" />
                  {href && (
                    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-medium text-ink-2 hover:bg-sheet-2">
                      <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                    </a>
                  )}
                  <button
                    onClick={() =>
                      nav('chat', {
                        prompt: `Aide-moi à exploiter cette source dans mon mémoire : « ${s.title} » (${s.authors}, ${s.year}). Résumé : ${s.summary}. Où et comment la citer, et avec quel esprit critique ?`,
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-medium text-adire hover:bg-adire-soft"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> L’exploiter avec SAM
                  </button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Sheet
        open={adding}
        onClose={() => setAdding(false)}
        title="Nouvelle référence"
        width="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>Annuler</Button>
            <Button variant="primary" type="submit" form="src-form" disabled={!f.title.trim()}>Ajouter à la bibliothèque</Button>
          </>
        }
      >
        <form id="src-form" onSubmit={submit} className="grid gap-4 pb-3 sm:grid-cols-2">
          <Field label="Titre" className="sm:col-span-2">
            <Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Architecture bioclimatique en milieu tropical" />
          </Field>
          <Field label="Auteur(s)">
            <Input value={f.authors} onChange={(e) => setF({ ...f, authors: e.target.value })} placeholder="Givoni, Baruch" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Année">
              <Input value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as any })}>
                {Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Lien ou DOI" className="sm:col-span-2">
            <Input value={f.doiOrUrl} onChange={(e) => setF({ ...f, doiOrUrl: e.target.value })} placeholder="https://doi.org/…" />
          </Field>
          <Field label="Résumé" className="sm:col-span-2">
            <TextArea rows={3} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} placeholder="Thèse principale, résultats, conclusions…" />
          </Field>
          <Field label="Pourquoi elle compte pour ton projet" className="sm:col-span-2">
            <TextArea rows={2} value={f.architecturalRelevance} onChange={(e) => setF({ ...f, architecturalRelevance: e.target.value })} />
          </Field>
          <Field label="Citation clé (avec la page si possible)" className="sm:col-span-2">
            <Input value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} />
          </Field>
        </form>
      </Sheet>
    </div>
  );
};

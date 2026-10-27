import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { callAi, today } from '../lib/api';
import { useDictation } from '../lib/useDictation';
import { Button, Field, Input, Select, Sheet, TextArea, Thinking, cx } from './ui';

/** « Raconter ma séance » : notes libres ou dictées → journal académique + 3 scripts vidéo/audio. */
export const SessionSheet: React.FC<{ open: boolean; onClose: () => void; onDone: (sessionId: string) => void }> = ({
  open,
  onClose,
  onDone,
}) => {
  const { data, addSessionLog, addValidatedDecision } = useSam();
  const { toast } = useUi();
  const active = data.stages.find((s) => s.status === 'in_progress') || data.stages[0];
  const [notes, setNotes] = useState('');
  const [minutes, setMinutes] = useState(90);
  const [stageId, setStageId] = useState<number>(active.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dict = useDictation((t) => setNotes((p) => (p ? `${p} ${t}` : t)));

  const submit = async () => {
    if (!notes.trim() || busy) return;
    setBusy(true);
    setError(null);
    const stage = data.stages.find((s) => s.id === stageId);
    try {
      const r = await callAi<{ journal: any; scripts: any }>('journal', {
        rawNotes: notes,
        durationMinutes: minutes,
        relatedStageTitle: stage?.title,
        topic: data.profile.topic,
      });
      const id = addSessionLog({
        date: today(),
        rawInput: notes,
        durationMinutes: minutes,
        relatedStageId: stageId,
        academicJournal: r.journal,
        socialScripts: r.scripts,
      });
      const dec = String(r.journal.validatedDecisions || '').trim();
      if (dec && !/^aucune/i.test(dec)) {
        addValidatedDecision({
          date: today(),
          stageName: stage?.title || 'Séance de travail',
          decisionText: dec,
          justification: r.journal.resultsAchieved || 'Issue de la séance de travail',
          impactOnProject: 'Intégrée au carnet de bord et au mémoire',
        });
      }
      setNotes('');
      toast('Séance enregistrée : journal et scripts prêts.');
      onClose();
      onDone(id);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={() => !busy && onClose()}
      title="Raconte ta séance"
      description="Écris ou dicte ce que tu as fait. SAM en tire ton journal de bord et trois scripts pour tes réseaux."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Annuler</Button>
          <Button variant="sam" onClick={submit} loading={busy} disabled={!notes.trim()}>
            Générer journal et scripts
          </Button>
        </>
      }
    >
      {busy ? (
        <div className="py-6">
          <Thinking label="SAM met ta séance en forme…" detail="Journal académique, TikTok, vlog et podcast." />
        </div>
      ) : (
        <div className="space-y-4 pb-3">
          <div className="relative">
            <TextArea
              rows={7}
              autoFocus
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex. J’ai passé 2 h à confronter le diagramme de Givoni avec les vents dominants de Cotonou. Le patio central devrait créer une dépression suffisante pour…"
              className="pr-14"
            />
            {dict.supported && (
              <button
                type="button"
                onClick={dict.toggle}
                aria-label={dict.listening ? 'Arrêter la dictée' : 'Dicter'}
                className={cx(
                  'absolute right-2.5 bottom-2.5 flex h-10 w-10 items-center justify-center rounded-full transition',
                  dict.listening ? 'bg-laterite text-white' : 'bg-sheet-2 text-ink-2 hover:text-ink',
                )}
              >
                {dict.listening ? <Square className="h-4 w-4" fill="currentColor" /> : <Mic className="h-[18px] w-[18px]" />}
                {dict.listening && <span className="absolute inset-0 animate-ping rounded-full bg-laterite/40" />}
              </button>
            )}
          </div>
          <div className="grid grid-cols-[1fr_7.5rem] gap-3">
            <Field label="Étape concernée">
              <Select value={stageId} onChange={(e) => setStageId(Number(e.target.value))}>
                {data.stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Durée (min)">
              <Input type="number" min={5} step={5} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
            </Field>
          </div>
          {error && <p className="rounded-2xl bg-laterite-soft px-4 py-3 text-sm text-laterite">{error}</p>}
        </div>
      )}
    </Sheet>
  );
};

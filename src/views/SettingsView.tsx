import React, { useState } from 'react';
import { Download, LogOut, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useSam } from '../context/SamContext';
import { useUi } from '../context/UiContext';
import { formatDate, today } from '../lib/api';
import { isCloud } from '../lib/supabase';
import { Button, Empty, Field, IconButton, Input, PageHeader, Panel, Segmented, cx } from '../components/ui';

type Tab = 'decisions' | 'profil' | 'donnees';

export const SettingsView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('decisions');
  const { data } = useSam();
  return (
    <div>
      <PageHeader title="Mémoire & profil" description="Ce que SAM sait de toi et de ton projet, et ce qu’elle ne doit jamais remettre en cause." />
      <Segmented
        value={tab}
        onChange={setTab}
        className="mb-6"
        options={[
          { value: 'decisions', label: 'Décisions', count: data.decisions.length },
          { value: 'profil', label: 'Profil' },
          { value: 'donnees', label: 'Données & sécurité' },
        ]}
      />
      {tab === 'decisions' && <Decisions />}
      {tab === 'profil' && <Profile />}
      {tab === 'donnees' && <DataPanel />}
    </div>
  );
};

const Decisions: React.FC = () => {
  const { data, addValidatedDecision, removeDecision } = useSam();
  const { confirm, toast } = useUi();
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const [why, setWhy] = useState('');
  const list = data.decisions.filter((d) => `${d.decisionText} ${d.justification} ${d.stageName}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <Panel className="p-5 md:p-6">
        <p className="mb-3 font-semibold">Inscrire une décision</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            addValidatedDecision({ date: today(), stageName: 'Décision transversale', decisionText: text.trim(), justification: why.trim() || 'Arrêtée par moi', impactOnProject: 'Intégrée au mémoire et au TPFE' });
            setText('');
            setWhy('');
            toast('Décision enregistrée. SAM s’y tiendra.');
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_auto]"
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex. Toiture double pente ventilée avec surtoiture légère" />
          <Input value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Pourquoi ?" />
          <Button type="submit" variant="primary" icon={<Plus className="h-4 w-4" />} disabled={!text.trim()}>Ajouter</Button>
        </form>
      </Panel>

      <div className="relative md:w-80">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher dans les décisions…" className="h-10 rounded-full py-0 pl-10" />
      </div>

      {list.length === 0 ? (
        <Empty title={data.decisions.length ? 'Aucune décision ne correspond.' : 'Aucune décision pour l’instant.'} body="Chaque choix ferme inscrit ici est rappelé à SAM à chaque échange." />
      ) : (
        <ol className="relative space-y-3 border-l-2 border-line pl-5 md:pl-7">
          {list.map((d) => (
            <li key={d.id} className="relative">
              <span className="absolute top-5 -left-[27px] h-3 w-3 rounded-full border-2 border-paper bg-laterite md:-left-[35px]" />
              <Panel className="flex items-start gap-3 p-4 md:p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-3">{formatDate(d.date, { day: 'numeric', month: 'long', year: 'numeric' })} · {d.stageName}</p>
                  <p className="mt-1 font-semibold leading-snug text-ink">{d.decisionText}</p>
                  <p className="mt-1 text-[0.95rem] text-ink-2">{d.justification}</p>
                </div>
                <IconButton
                  label="Supprimer"
                  tone="danger"
                  onClick={async () => {
                    if (await confirm({ title: 'Retirer cette décision ?', description: 'SAM ne la prendra plus en compte.', confirmLabel: 'Retirer', danger: true })) removeDecision(d.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </Panel>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

const Profile: React.FC = () => {
  const { data, updateProfile } = useSam();
  const { toast } = useUi();
  const [p, setP] = useState(data.profile);
  const set = (k: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP({ ...p, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value });

  return (
    <Panel className="p-5 md:p-7">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile({ ...p, name: p.name.trim() || 'Donald' });
          toast('Profil enregistré.');
        }}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <Field label="Ton prénom" hint="SAM t’appellera ainsi.">
          <Input value={p.name} onChange={set('name')} />
        </Field>
        <Field label="Diplôme préparé">
          <Input value={p.degree} onChange={set('degree')} />
        </Field>
        <Field label="Sujet du mémoire" className="md:col-span-2">
          <Input value={p.topic} onChange={set('topic')} />
        </Field>
        <Field label="Sujet du TPFE" className="md:col-span-2">
          <Input value={p.subTopic} onChange={set('subTopic')} />
        </Field>
        <Field label="Lieu du projet">
          <Input value={p.contextLocation} onChange={set('contextLocation')} />
        </Field>
        <Field label="Établissement">
          <Input value={p.university} onChange={set('university')} />
        </Field>
        <Field label="Encadrant">
          <Input value={p.supervisor} onChange={set('supervisor')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Soutenance">
            <Input type="date" value={p.defenseDate} onChange={set('defenseDate')} />
          </Field>
          <Field label="Heures / semaine">
            <Input type="number" min={1} value={p.availableHoursPerWeek} onChange={set('availableHoursPerWeek')} />
          </Field>
        </div>
        <div className="flex justify-end md:col-span-2">
          <Button type="submit" variant="primary">Enregistrer le profil</Button>
        </div>
      </form>
    </Panel>
  );
};

const DataPanel: React.FC = () => {
  const { data, updateProfile, exportProjectJson, importProjectJson, resetToDefault, session, signOut, sync } = useSam();
  const { toast, confirm } = useUi();
  const [pinOn, setPinOn] = useState(data.profile.isPinLocked);
  const [pin, setPin] = useState(data.profile.pinCode || '');

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Panel className="p-5 md:p-6">
        <p className="font-semibold">Ton compte</p>
        {isCloud && session ? (
          <>
            <p className="mt-1 text-ink-2">
              Connecté en tant que <strong className="text-ink">{session.user.email}</strong>. Ton projet est enregistré dans Supabase et suit tes appareils.
            </p>
            <p className={cx('mt-2 text-sm', sync === 'error' ? 'text-laterite' : 'text-feuille')}>
              {sync === 'error' ? 'Dernière synchronisation échouée : les modifications sont gardées sur cet appareil.' : 'Synchronisation active.'}
            </p>
            <Button className="mt-4" size="sm" icon={<LogOut className="h-4 w-4" />} onClick={signOut}>Se déconnecter</Button>
          </>
        ) : (
          <p className="mt-1 text-ink-2">
            Mode local : tes données restent dans ce navigateur. Configure Supabase (voir le guide de déploiement) pour les retrouver partout.
          </p>
        )}
      </Panel>

      <Panel className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">Verrou par code</p>
            <p className="mt-1 text-ink-2">Utile si d’autres personnes utilisent cet appareil.</p>
          </div>
          <button
            role="switch"
            aria-checked={pinOn}
            onClick={() => setPinOn(!pinOn)}
            className={cx('relative h-7 w-12 shrink-0 rounded-full transition', pinOn ? 'bg-adire' : 'bg-line')}
          >
            <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', pinOn ? 'left-6' : 'left-1')} />
          </button>
        </div>
        {pinOn && (
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 à 6 chiffres"
            className="mt-4 w-44 text-center font-display tracking-[0.4em]"
          />
        )}
        <Button
          className="mt-4"
          size="sm"
          variant="primary"
          disabled={pinOn && pin.length < 4}
          onClick={() => {
            updateProfile({ isPinLocked: pinOn, pinCode: pinOn ? pin : '' });
            toast(pinOn ? 'Verrou activé.' : 'Verrou désactivé.');
          }}
        >
          Enregistrer
        </Button>
      </Panel>

      <Panel className="p-5 md:col-span-2 md:p-6">
        <p className="font-semibold">Sauvegarde</p>
        <p className="mt-1 text-ink-2">Télécharge une copie complète de ton projet, ou restaure une sauvegarde (y compris celles de l’ancienne version de SAM).</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" icon={<Download className="h-4 w-4" />} onClick={exportProjectJson}>Télécharger (.json)</Button>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line bg-sheet px-3.5 text-sm font-semibold hover:bg-sheet-2">
            <Upload className="h-4 w-4" /> Restaurer
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const r = new FileReader();
                r.onload = () => {
                  const ok = importProjectJson(String(r.result));
                  toast(ok ? 'Sauvegarde restaurée.' : 'Ce fichier n’est pas une sauvegarde SAM.', ok ? 'success' : 'error');
                };
                r.readAsText(file);
                e.target.value = '';
              }}
            />
          </label>
          <span className="flex-1" />
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (await confirm({ title: 'Repartir du projet d’exemple ?', description: 'Toutes tes données actuelles seront remplacées. Télécharge une sauvegarde avant.', confirmLabel: 'Tout remplacer', danger: true })) {
                resetToDefault();
                toast('Projet d’exemple chargé.');
              }
            }}
          >
            Réinitialiser
          </Button>
        </div>
      </Panel>
    </div>
  );
};

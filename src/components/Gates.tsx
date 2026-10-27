import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSam } from '../context/SamContext';
import { initialStages } from '../data/initialData';
import { BuildingSection } from './BuildingSection';
import { Button, Field, Input, SamMark } from './ui';

/* ---------------------------------------------------------------- Écran de chargement */
export const Splash: React.FC = () => (
  <div className="grid min-h-dvh place-items-center bg-paper">
    <div className="flex flex-col items-center gap-4">
      <SamMark size={56} thinking />
      <p className="text-sm text-ink-2">SAM ouvre ton atelier…</p>
    </div>
  </div>
);

/* ---------------------------------------------------------------- Connexion Supabase */
export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Une coupe de démonstration qui se construit pendant qu'on se connecte
  const demo = useMemo(
    () => initialStages.map((s, i) => ({ ...s, status: i < 9 ? 'donald_validated' : i < 12 ? 'in_progress' : 'not_started' }) as typeof s),
    [],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setMsg({ kind: 'ok', text: 'Lien envoyé. Ouvre ton e-mail sur cet appareil pour entrer.' });
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (!data.session) setMsg({ kind: 'ok', text: 'Compte créé. Confirme ton adresse depuis l’e-mail reçu, puis connecte-toi.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      const m = String(err?.message || '');
      setMsg({
        kind: 'err',
        text: m.includes('Invalid login')
          ? 'E-mail ou mot de passe incorrect.'
          : m.includes('Email not confirmed')
            ? 'Adresse pas encore confirmée : clique le lien reçu par e-mail.'
            : /Database error|not allowed|non autoris|Signups not allowed/i.test(m)
              ? 'Cette adresse n’est pas autorisée. SAM est réservée à deux personnes.'
              : m || 'Connexion impossible. Réessaie.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <div className="relative flex flex-col justify-between overflow-hidden bg-sheet-2 px-6 pt-8 pb-6 text-ink lg:px-14 lg:py-12">
        <div className="flex items-center gap-3">
          <SamMark size={40} />
          <span className="text-lg font-semibold">SAM</span>
        </div>
        <div className="my-6 lg:my-0">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] lg:text-[3rem]"
          >
            Ton mémoire, brique par brique.
          </motion.h1>
          <p className="mt-4 max-w-md text-[1.02rem] text-ink-2 lg:text-lg">
            SAM t’accompagne des premières lectures jusqu’à la soutenance : elle cherche, questionne, rédige avec toi et garde la mémoire de chaque décision.
          </p>
        </div>
        <div className="hidden rounded-[20px] bg-sheet px-2 pt-3 sm:block">
          <BuildingSection stages={demo} daysLeft={54} className="w-full" />
        </div>
      </div>

      <div className="flex items-center justify-center bg-paper px-6 py-10">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-[-0.02em]">
            {mode === 'signup' ? 'Créer ton atelier' : 'Entrer dans l’atelier'}
          </h2>
          <p className="mt-1.5 text-ink-2">
            {mode === 'signup'
              ? 'Réservé aux deux adresses autorisées. Tes données restent dans ton espace privé.'
              : 'Espace privé, réservé à deux personnes. Retrouve ton projet sur ton téléphone comme sur ton ordinateur.'}
          </p>

          <div className="mt-7 space-y-4">
            <Field label="Adresse e-mail">
              <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@exemple.com" />
            </Field>
            {mode !== 'magic' && (
              <Field label="Mot de passe" hint={mode === 'signup' ? '6 caractères minimum.' : undefined}>
                <Input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            )}
          </div>

          {msg && (
            <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${msg.kind === 'ok' ? 'bg-feuille-soft text-feuille' : 'bg-laterite-soft text-laterite'}`}>
              {msg.text}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" loading={busy} className="mt-6 w-full" icon={mode === 'magic' ? <Mail className="h-4 w-4" /> : undefined}>
            {mode === 'signup' ? 'Créer mon compte' : mode === 'magic' ? 'Recevoir un lien de connexion' : 'Se connecter'}
          </Button>

          <div className="mt-5 flex flex-col items-center gap-2 text-sm">
            {mode !== 'signup' ? (
              <button type="button" className="font-semibold text-adire" onClick={() => setMode('signup')}>
                Pas encore de compte ? Créer un compte
              </button>
            ) : (
              <button type="button" className="font-semibold text-adire" onClick={() => setMode('signin')}>
                J’ai déjà un compte
              </button>
            )}
            {mode !== 'magic' ? (
              <button type="button" className="text-ink-2 hover:text-ink" onClick={() => setMode('magic')}>
                Se connecter sans mot de passe
              </button>
            ) : (
              <button type="button" className="text-ink-2 hover:text-ink" onClick={() => setMode('signin')}>
                Utiliser un mot de passe
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Verrou PIN */
export const LockScreen: React.FC = () => {
  const { unlockWithPin, data } = useSam();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(0);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-paper px-6">
      <motion.form
        key={shake}
        animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!unlockWithPin(pin)) {
            setPin('');
            setShake((s) => s + 1);
          }
        }}
        className="w-full max-w-xs text-center text-ink"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sheet-2">
          <Lock className="h-6 w-6 text-soleil" />
        </div>
        <h2 className="text-xl font-semibold">L’atelier de {data.profile.name} est verrouillé</h2>
        <p className="mt-1.5 text-sm text-ink-2">Saisis ton code pour continuer.</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="mt-6 w-full rounded-2xl border border-line bg-sheet py-3.5 text-center text-2xl tracking-[0.5em] text-ink focus:border-ink-3 focus:outline-none"
          aria-label="Code PIN"
        />
        {shake > 0 && <p className="mt-3 text-sm text-laterite">Code incorrect.</p>}
        <button type="submit" className="mt-5 h-11 w-full rounded-xl bg-ink font-medium text-paper">
          Déverrouiller
        </button>
      </motion.form>
    </div>
  );
};

/* ---------------------------------------------------------------- Accès refusé */
export const AccessScreen: React.FC<{ reason: 'denied' | 'unconfigured' }> = ({ reason }) => {
  const { session, signOut } = useSam();
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sheet-2">
          <Lock className="h-6 w-6 text-ink-2" />
        </div>
        <h2 className="text-xl font-semibold">{reason === 'denied' ? 'Accès réservé' : 'Accès pas encore configuré'}</h2>
        <p className="mt-2 text-ink-2">
          {reason === 'denied'
            ? <>Le compte <strong className="text-ink">{session?.user.email}</strong> n’est pas autorisé. SAM est réservée à deux personnes.</>
            : <>La liste des deux adresses autorisées n’existe pas encore dans Supabase. Exécute le fichier <code className="rounded bg-sheet-2 px-1">supabase/acces-deux-utilisateurs.sql</code> dans l’éditeur SQL.</>}
        </p>
        <button onClick={signOut} className="mt-6 h-11 w-full rounded-xl bg-ink font-medium text-paper">
          Se déconnecter
        </button>
      </div>
    </div>
  );
};

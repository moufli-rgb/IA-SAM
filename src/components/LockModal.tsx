import React, { useState } from 'react';
import { Lock, ShieldCheck, Key } from 'lucide-react';
import { useSam } from '../context/SamContext';

export const LockModal: React.FC = () => {
  const { unlockWithPin } = useSam();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = unlockWithPin(pin);
    if (!ok) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Lock className="h-7 w-7" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">Espace Privé de Donald</h2>
          <p className="text-xs text-slate-400 mt-1">
            Cet espace de recherche et de rédaction est verrouillé. Entrez votre code PIN pour accéder à SAM.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            autoFocus
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            placeholder="••••"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 p-3 text-center text-2xl font-mono tracking-widest text-white focus:border-amber-500 focus:outline-none"
          />

          {error && (
            <p className="text-xs text-rose-400">Code PIN incorrect. Veuillez réessayer.</p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
          >
            Déverrouiller l'espace
          </button>
        </form>
      </div>
    </div>
  );
};

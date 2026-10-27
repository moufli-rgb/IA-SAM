import React, { useState } from 'react';
import {
  Database,
  Lock,
  Download,
  Upload,
  CheckCircle2,
  Trash2,
  BookmarkCheck,
  Search,
  Shield,
  User,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useSam } from '../context/SamContext';
import { ValidatedDecision } from '../types/sam';

export const MemorySettingsView: React.FC = () => {
  const {
    data,
    updateProfile,
    exportProjectJson,
    importProjectJson,
    resetToDefault,
    removeDecision,
    addValidatedDecision,
  } = useSam();

  // Search in memory
  const [searchQuery, setSearchQuery] = useState('');

  // Profile buffer
  const [topic, setTopic] = useState(data.profile.topic);
  const [subTopic, setSubTopic] = useState(data.profile.subTopic);
  const [supervisor, setSupervisor] = useState(data.profile.supervisor);
  const [university, setUniversity] = useState(data.profile.university);
  const [defenseDate, setDefenseDate] = useState(data.profile.defenseDate);
  const [availableHours, setAvailableHours] = useState(data.profile.availableHoursPerWeek);
  const [pinCode, setPinCode] = useState(data.profile.pinCode || '');
  const [isPinLocked, setIsPinLocked] = useState(data.profile.isPinLocked);

  // New decision state
  const [newDecText, setNewDecText] = useState('');
  const [newDecJustif, setNewDecJustif] = useState('');
  const [newDecStage, setNewDecStage] = useState('Décision transversale');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      topic,
      subTopic,
      supervisor,
      university,
      defenseDate,
      availableHoursPerWeek: availableHours,
      pinCode,
      isPinLocked,
    });
    alert('Profil et paramètres de Donald mis à jour avec succès.');
  };

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecText.trim()) return;

    addValidatedDecision({
      date: new Date().toISOString().split('T')[0],
      stageName: newDecStage,
      decisionText: newDecText.trim(),
      justification: newDecJustif.trim() || 'Décision stratégique arrêtée par Donald',
      impactOnProject: 'Intégré au mémoire et au projet TPFE',
    });

    setNewDecText('');
    setNewDecJustif('');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importProjectJson(content);
        if (ok) {
          alert('Sauvegarde restaurée avec succès !');
        } else {
          alert('Fichier de sauvegarde invalide.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Search matching decisions or stages
  const filteredDecisions = data.decisions.filter(
    (d) =>
      d.decisionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.justification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.stageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="h-6 w-6 text-amber-400" />
          Mémoire Persistante du Projet & Paramètres Privés
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Registre officiel des décisions, sauvegardes intégrales et préférences de l'espace de Donald.
        </p>
      </div>

      {/* 1. REGISTRE DES DÉCISIONS VALIDÉES */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookmarkCheck className="h-5 w-5 text-indigo-400" />
              Registre Officiel des Décisions Validées par Donald ({data.decisions.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ce sont les choix fermes que SAM ne doit jamais remettre en cause, sauf demande explicite de révision.
            </p>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans la mémoire..."
              className="rounded-xl border border-slate-700 bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Form to add decision manually */}
        <form onSubmit={handleAddDecision} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3 text-xs">
          <span className="font-semibold text-slate-300 block">Inscrire une nouvelle décision officielle :</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                required
                value={newDecText}
                onChange={(e) => setNewDecText(e.target.value)}
                placeholder="Énoncé de la décision (ex: Toiture à double pente ventilée avec surtoiture légère)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
            <div>
              <input
                type="text"
                value={newDecStage}
                onChange={(e) => setNewDecStage(e.target.value)}
                placeholder="Étape reliée (ex: Étape 15 : Concept)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDecJustif}
              onChange={(e) => setNewDecJustif(e.target.value)}
              placeholder="Justification technique ou théorique..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-400 cursor-pointer"
            >
              Enregistrer la décision
            </button>
          </div>
        </form>

        {/* Decisions List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {filteredDecisions.map((dec) => (
            <div
              key={dec.id}
              className="rounded-xl border border-slate-800 bg-slate-800/40 p-4 space-y-2 relative group hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {dec.stageName} • {dec.date}
                </span>
                <button
                  onClick={() => removeDecision(dec.id)}
                  className="text-slate-600 hover:text-red-400 p-1"
                  title="Supprimer la décision"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <h4 className="text-xs font-bold text-slate-100 leading-snug">
                {dec.decisionText}
              </h4>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong>Justification :</strong> {dec.justification}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. PARAMÈTRES DU PROFIL DE DONALD */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <User className="h-5 w-5 text-amber-400" />
          Fiche & Profil Académique de Donald
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Intitulé officiel du Mémoire</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Sous-thème / Intitulé du TPFE</label>
              <input
                type="text"
                value={subTopic}
                onChange={(e) => setSubTopic(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Établissement / Université</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Enseignant Encadrant / Directeur</label>
              <input
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Date cible de la soutenance</label>
              <input
                type="date"
                value={defenseDate}
                onChange={(e) => setDefenseDate(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Heures disponibles par semaine</label>
              <input
                type="number"
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white"
              />
            </div>
          </div>

          {/* Privacy & PIN Lock */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">
                  Verrouillage Privé par Code PIN
                </span>
                <p className="text-[11px] text-slate-400">
                  Protège tes recherches, conversations et documents confidentiels si d'autres personnes utilisent cet appareil.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isPinLocked}
                onChange={(e) => setIsPinLocked(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-500 cursor-pointer"
              />
            </div>

            {isPinLocked && (
              <div>
                <label className="block text-slate-400 mb-1">Définir le code PIN secret de Donald</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Code à 4 ou 6 chiffres"
                  className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-white w-48 font-mono text-center tracking-widest"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>

      {/* 3. SAUVEGARDE & RESTAURATION */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Shield className="h-5 w-5 text-emerald-400" />
          Sauvegarde & Restauration des Données
        </h3>

        <p className="text-xs text-slate-300">
          Toutes tes données sont persistantes et synchronisées sur le serveur et ton navigateur. Tu peux à tout moment télécharger une sauvegarde complète ou restaurer un fichier antérieur.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportProjectJson}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Télécharger la sauvegarde complète (JSON)
          </button>

          <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer">
            <Upload className="h-4 w-4 text-slate-400" />
            <span>Restaurer une sauvegarde</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (confirm("Réinitialiser toutes les données aux valeurs de démonstration initiales ?")) {
                resetToDefault();
              }
            }}
            className="text-xs text-red-400 hover:underline ml-auto"
          >
            Réinitialiser les données de démo
          </button>
        </div>
      </div>
    </div>
  );
};

# SAM : l'atelier du mémoire

Assistante IA pour le mémoire et le TPFE d'architecture. Elle tourne en React + Vite, avec des fonctions serverless sur **Vercel**, Gemini pour l'IA et **Supabase** pour les comptes et la base de données.

```
api/ai.ts            → toutes les actions IA (chat, recherche, rédaction, journal, planning, analyse)
api/health.ts        → /api/health : vérifie que les clés sont bien configurées
supabase/schema.sql  → la table `projects` + sécurité RLS
src/                 → l'application (vues, design system, synchronisation Supabase)
```

---

## 1. Créer la base Supabase (5 min)

1. Va sur https://supabase.com → **New project** (région conseillée : *West EU* ou la plus proche de toi).
2. Ouvre **SQL Editor → New query**, colle le contenu de `supabase/schema.sql` et clique sur **Run**.
3. Ouvre **Project Settings → API** et note deux valeurs :
   - **Project URL** (`https://xxxx.supabase.co`)
   - la clé **anon / public** (ou *publishable key*)
4. Ouvre **Authentication → URL Configuration** :
   - **Site URL** : l'adresse Vercel de ton site (à remplir après l'étape 2, par ex. `https://sam-memoire.vercel.app`)
   - ajoute la même adresse dans **Redirect URLs**
5. *(Facultatif)* Dans **Authentication → Providers → Email**, désactive « Confirm email » si tu veux entrer sans passer par l'e-mail de confirmation.

Chaque utilisateur a une seule ligne dans `projects` (une colonne `data` en JSON), protégée par RLS : personne d'autre ne peut la lire.

## 2. Déployer sur Vercel (5 min)

1. Pousse ce dossier sur GitHub (nouveau dépôt).
2. Sur https://vercel.com → **Add New → Project** → importe le dépôt. Vercel détecte Vite tout seul.
3. Dans **Environment Variables**, ajoute :

| Nom | Valeur |
| --- | --- |
| `GEMINI_API_KEY` | ta clé https://aistudio.google.com/apikey |
| `VITE_SUPABASE_URL` | l'URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | la clé anon / public |
| `GEMINI_MODEL` | *(facultatif)* par défaut `gemini-3.8-flash` |

4. **Deploy**. Ouvre ensuite `https://ton-site.vercel.app/api/health` : `hasGeminiKey` et `hasSupabase` doivent valoir `true`.
5. Retourne dans Supabase (étape 1.4) et renseigne l'adresse définitive.

> Les variables `VITE_…` sont lues **au moment du build**. Si tu les modifies, relance un déploiement (**Deployments → Redeploy**).

## Déployer en ligne de commande (Windows PowerShell)

```powershell
cd $HOME\Documents\projet-ia
npm install
vercel env ls                      # vérifier les 3 variables
vercel --prod                      # déployer
```

### Si le déploiement bloque
- **Root Directory** : dans Vercel → Settings → Build and Deployment, le champ *Root Directory* doit être **vide**. L'ancien projet avait le code dans `SAM/`, ce n'est plus le cas.
- **Version de Node** : `package.json` impose Node 22. Si Vercel affiche autre chose, mets 22.x dans Settings → Build and Deployment → Node.js Version.
- **Logs** : `vercel inspect <url-du-déploiement> --logs` affiche l'erreur exacte.

## 3. Lancer en local

```bash
npm install
cp .env.example .env      # puis remplis les valeurs
npm run dev               # http://localhost:5173, les fonctions /api tournent aussi
```

Sans variables Supabase, l'app fonctionne en **mode local** : pas de connexion, les données restent dans le navigateur.

## Reprendre les données de l'ancienne version

Dans l'ancienne app : **Mémoire & Données → Télécharger la sauvegarde (JSON)**.
Dans la nouvelle : **Mémoire & profil → Données & sécurité → Restaurer**. Le format est compatible.

## Sécurité

- La clé Gemini ne quitte jamais le serveur.
- Quand Supabase est configuré, `/api/ai` refuse toute requête sans session valide : personne ne peut utiliser ta clé Gemini à ta place.
- Le verrou par code PIN reste disponible pour un appareil partagé (protection locale, en plus du compte).

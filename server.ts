import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Persistence setup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'sam_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to get or init DB
function getPersistedData() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading DB_FILE, fallback to null', e);
    }
  }
  return null;
}

function savePersistedData(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving DB_FILE', e);
  }
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    assistant: 'SAM',
    user: 'Donald',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Load Project Data
app.get('/api/project', (req: Request, res: Response) => {
  const data = getPersistedData();
  res.json({ success: true, data });
});

// Save Project Data
app.post('/api/project', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload) {
    return res.status(400).json({ error: 'Payload missing' });
  }
  payload.lastSaved = new Date().toISOString();
  savePersistedData(payload);
  res.json({ success: true, lastSaved: payload.lastSaved });
});

// 1. Chat with SAM
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      stageId,
      tone = 'direct_chaleureux',
      conciseness = 'balanced',
      context = {},
    } = req.body;

    const validatedDecisionsText = (context.decisions || [])
      .map((d: any) => `- [${d.date}] ${d.decisionText} (Justification: ${d.justification})`)
      .join('\n');

    const stagesSummary = (context.stages || [])
      .filter((s: any) => s.status !== 'not_started')
      .map((s: any) => `- Étape ${s.id}: ${s.title} [Statut: ${s.status}] - Travail: ${s.completedWork.slice(0, 120)}...`)
      .join('\n');

    const systemInstruction = `Tu es SAM, l'assistante personnelle intelligente, complice et rigoureuse de Donald.
RÈGLES D'IDENTITÉ ABSOLUES :
- Ton nom est SAM (intelligence artificielle, hommage personnel aux échanges qui ont inspiré ta création).
- Ton utilisateur s'appelle DONALD. Il est un homme, étudiant en architecture au niveau Master, réalisant son Mémoire et son TPFE (Travail Personnel de Fin d'Études).
- Tu t'adresses toujours à lui en l'appelant Donald.
- Ne confonds JAMAIS vos identités : tu es SAM, il est Donald. Ne dis jamais "Moi, Donald" ou "en tant que Donald".
- Ne désigne JAMAIS Donald au féminin.
- Donald est le maître absolu de ses décisions, de sa posture intellectuelle et de son projet architectural. Tu es son bras droit méthodologique, sa boussole critique et son partenaire de réflexion.
- Si une information manque ou si une question reste ouverte, demande des précisions à Donald ou signale clairement qu'elle reste à compléter ; n'invente jamais des données factuelles, des mesures ou des citations.

TON ET STYLE :
- Dans les échanges généraux : Chaleureux, direct, naturel, honnête, intelligent, bienveillant et stimulant.
- Dans les discussions méthodologiques et la rédaction : Rigoureux, précis, analytique, exigeant, conforme aux conventions universitaires d'un mémoire de Master en architecture.
- Niveau de concision demandé : ${conciseness === 'concise' ? "Très synthétique, percutant, direct aux faits." : conciseness === 'detailed' ? "Approfondi, étayé, riche en exemples méthodologiques et constructifs." : "Équilibré : clair, structuré, prêt pour l'action."}

CONTEXTE ACTUEL DU PROJET DE DONALD :
- Sujet : ${context.topic || "Architecture bioclimatique et valorisation des matériaux locaux en milieu tropical"}
- Sous-thème / TPFE : ${context.subTopic || "Conception d'un équipement public résilient en terre crue stabilisée et ventilation passive"}
- Contexte géographique : ${context.contextLocation || "Afrique de l'Ouest (Cotonou / Littoral)"}
- Échéance de soutenance : ${context.defenseDate || "18 décembre 2026"}
- Étape active sélectionnée : ${stageId ? `Étape #${stageId}` : 'Vue générale'}

DÉCISIONS DÉJÀ VALIDÉES PAR DONALD (À RESPECTER SANS CONTRADICTION) :
${validatedDecisionsText || "Aucune décision majeure formellement enregistrée pour l'instant."}

ÉTAT DU PARCOURS :
${stagesSummary || 'En phase initiale de cadrage.'}
`;

    // Format conversation history for Gemini
    const contents: any[] = [];
    for (const h of history.slice(-10)) {
      contents.push({
        role: h.sender === 'Donald' ? 'user' : 'model',
        parts: [{ text: h.content }],
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Donald, j'ai bien reçu ton message mais je n'ai pas pu générer de réponse. Peux-tu reformuler ?";
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors du dialogue avec SAM' });
  }
});

// 2. Web & Academic Research with Google Search Grounding
app.post('/api/research', async (req: Request, res: Response) => {
  try {
    const { query, researchType = 'scientifique', theme = 'Général' } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Requête manquante' });
    }

    const prompt = `En tant que SAM, effectue une recherche documentaire approfondie et rigoureuse pour Donald (étudiant en Master en architecture) sur la requête suivante :
"${query}"

Type de recherche : ${researchType} (scientifique, normative, retour d'expérience ou prospective).
Thème cible : ${theme}.

DIRECTIVES IMPÉRATIVES :
1. Privilégie les articles scientifiques, thèses d'architecture et de génie civil, ouvrages de référence (ex: Givoni, Olgyay, CRAterre, normes thermiques tropicales, ASHRAE, etc.).
2. N'invente JAMAIS une référence, un auteur, une page ou un DOI. Si une information n'est pas certaine, indique-le explicitement.
3. Structure la réponse de manière méthodique :
   - Synthèse exécutive claire pour Donald
   - Faits scientifiques & constructifs établis
   - Interprétations et débats d'auteurs
   - Hypothèses de conception pour le TPFE
   - Lacunes documentaires ou points restant à vérifier
   - Liste des sources avec Titre, Auteurs, Année, Type, Lien ou DOI vérifié, et citation clé exploitable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    const searchResultText = response.text || '';
    
    // Extract grounding chunks/urls if available
    const groundingChunks = (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .filter((c: any) => c.web?.uri)
      .map((c: any) => ({
        title: c.web.title || 'Source Web',
        url: c.web.uri,
      }));

    res.json({
      success: true,
      text: searchResultText,
      sources: webSources,
    });
  } catch (error: any) {
    console.error('Research error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la recherche documentaire' });
  }
});

// 3. Deep Analysis of Benchmark Theses (Mémoires de référence)
app.post('/api/analyze-thesis', async (req: Request, res: Response) => {
  try {
    const { thesisText, thesisTitle, author, university, grade } = req.body;
    if (!thesisText) {
      return res.status(400).json({ error: 'Texte ou résumé du mémoire manquant' });
    }

    const prompt = `Tu es SAM. Analyse ce mémoire de référence pour Donald (étudiant en Master en architecture).
Titre du mémoire : "${thesisTitle || 'Mémoire de référence'}"
Auteur : ${author || 'Auteur non précisé'}
Institution : ${university || 'Non précisée'}
Note ou mention : ${grade || 'Très Bien / Félicitations'}

Contenu / Extrait fourni :
"""
${thesisText.slice(0, 18000)}
"""

Effectue une déconstruction méthodique et objective :
1. Architecture générale et logique du plan : Comment s'articulent la théorie, le diagnostic et le projet TPFE ?
2. Construction de la problématique et question de recherche : Quelle tension initiale a convaincu le jury ?
3. Démarche méthodologique : Comment l'auteur valide-t-il ses hypothèses (recherche par le projet, simulation, enquêtes) ?
4. Clarté rédactionnelle et transitions : Pourquoi ce texte est-il fluide et convaincant ?
5. Gestion des sources, des citations et de l'iconographie : Quels sont les points forts formels ?
6. Points faibles ou limites identifiables : Ce que l'auteur aurait pu approfondir.
7. Enseignements concrets et transposables pour Donald : Que doit retenir Donald pour son propre mémoire sans jamais faire de plagiat ?

Réponds sous un format structuré et élégant.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    res.json({
      success: true,
      analysis: response.text || '',
    });
  } catch (error: any) {
    console.error('Thesis analysis error:', error);
    res.status(500).json({ error: error.message || "Erreur lors de l'analyse du mémoire" });
  }
});

// 4. Academic Writing Workflow (Section par section, 8 étapes)
app.post('/api/draft-academic', async (req: Request, res: Response) => {
  try {
    const {
      sectionTitle,
      stepNumber = 4,
      currentOutline = '',
      existingDraft = '',
      instructions = '',
      contextData = {},
    } = req.body;

    const systemInstruction = `Tu es SAM, rédactrice académique exigeante et partenaire de Donald pour son mémoire de Master en architecture.
RÈGLE D'OR RÉDACTIONNELLE :
- Style académique noble, sobre, précis, nuancé, scientifique et argumenté.
- Emploi du "nous" de modestie scientifique ("Dans cette recherche, nous postulons que...") ou tournures impersonnelles élégantes.
- Proscription absolue des formules de remplissage (ex: "De tout temps...", "Il est indéniable que...", "Au cœur des enjeux...").
- Ancrage ferme dans le contexte climatique tropical et la réalité constructive (matériaux géo-sourcés, inertie, ventilation passive).
- Ne jamais inventer des chiffres ou des données non fournis. Lorsqu'un chiffre est nécessaire, le marquer entre crochets : [insérer mesure in situ].
- Donald doit garder le contrôle complet : propose des formulations rigoureuses qu'il pourra amender.`;

    let prompt = '';
    if (stepNumber === 2) {
      // Step 2: Propose detailed outline
      prompt = `Donald travaille sur la section : "${sectionTitle}".
Consignes et contexte de Donald : ${instructions}
Propose un plan détaillé, logique et argumenté en 3 à 5 sous-parties pour cette section, en précisant l'objectif démonstratif de chaque sous-partie.`;
    } else if (stepNumber === 3) {
      // Step 3: Identify missing data
      prompt = `Pour la section "${sectionTitle}", en examinant le plan proposé :
${currentOutline}
Identifie avec précision les données manquantes (normes, mesures climatiques, sources bibliographiques, relevés de terrain ou données d'usagers) que Donald doit réunir avant de rédiger.`;
    } else if (stepNumber === 4) {
      // Step 4: Draft first version
      prompt = `Rédige une première version académique complète et dense pour la section : "${sectionTitle}".
Plan directeur :
${currentOutline}
Consignes de Donald :
${instructions}
Veille à la fluidité des transitions et à la rigueur de chaque paragraphe.`;
    } else if (stepNumber === 6) {
      // Step 6: Critical check
      prompt = `Examine le texte suivant rédigé pour la section "${sectionTitle}" :
"""
${existingDraft}
"""
Réalise un audit critique sans concession :
1. Y a-t-il des affirmations gratuites sans justification ou référence ?
2. Y a-t-il des ruptures de logique ou des répétitions ?
3. Le style est-il rigoureux et adapté au niveau Master ?
4. Liste 3 propositions précises d'amélioration pour Donald.`;
    } else {
      // General refinement
      prompt = `Améliore et affine le texte suivant pour la section "${sectionTitle}" selon les remarques de Donald : "${instructions}" :
"""
${existingDraft}
"""`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    res.json({
      success: true,
      result: response.text || '',
    });
  } catch (error: any) {
    console.error('Draft error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la rédaction académique' });
  }
});

// 5. Work Session Processing -> Academic Journal + Multi-format Narrative Scripts
app.post('/api/generate-journal-and-scripts', async (req: Request, res: Response) => {
  try {
    const { rawNotes, durationMinutes = 120, relatedStageTitle = '', topic = '' } = req.body;
    if (!rawNotes) {
      return res.status(400).json({ error: 'Notes de la séance manquantes' });
    }

    const prompt = `Tu es SAM, l'assistante personnelle de Donald (étudiant en Master d'architecture).
Donald vient de terminer une séance de travail et a consigné ses notes brutes suivantes :
"""
${rawNotes}
"""
Durée : ${durationMinutes} minutes.
Étape reliée : ${relatedStageTitle || "Mémoire & TPFE Architecture"}
Sujet du mémoire : ${topic || "Architecture bioclimatique & Matériaux locaux"}

À partir de ce récit réel et authentique, génère DEUX PRODUCTIONS DISTINCTES sous format JSON strict :

1. "academicJournal" (Compte rendu fidèle, structuré et daté, adapté pour le suivi académique et l'encadrant) :
   - "context" : Contexte de la séance
   - "objectives" : Objectif poursuivi
   - "actionsDone" : Recherches et actions concrètes réalisées
   - "resultsAchieved" : Résultats mesurables obtenus
   - "validatedDecisions" : Choix et décisions validés par Donald avec leurs justifications
   - "difficultiesAndLimits" : Difficultés, doutes et limites méthodologiques rencontrés
   - "nextSteps" : Tâches immédiates pour la suite

2. "socialScripts" (Scripts narratifs pour documenter son aventure de futur architecte de manière humaine, passionnante, accessible et sans faux enthousiasme artificiel) :
   - "tiktok30s" : 
       * "title" : Titre percutant
       * "hook" : Accroche en 1 phrase intrigante ou paradoxale
       * "script" : Texte complet à déclamer face caméra (30 à 45 secondes)
       * "keyTakeaway" : Message clé à retenir
       * "hashtags" : 5 hashtags pertinents (#MasterArchi, #Architecture, etc.)
       * "estimatedDuration" : "35 secondes"
   - "vlog60s" :
       * "title" : Titre de vlog
       * "hook" : Phrase d'introduction authentique
       * "script" : Script complet du vlog (60 à 75 secondes)
       * "visualNotes" : Suggestions de cadrages, plans sur les maquettes, coupes ou écran
       * "keyTakeaway" : Conclusion personnelle
       * "hashtags" : Liste de hashtags
       * "estimatedDuration" : "60 secondes"
   - "podcastEpisode" :
       * "title" : Titre d'épisode de podcast carnet de bord
       * "hook" : Introduction sonore
       * "script" : Texte complet fluide et immersif (2 à 3 minutes de lecture posée)
       * "keyTakeaway" : Réflexion architecturale de fond
       * "estimatedDuration" : "3 minutes"

IMPORTANT : Réponds EXCLUSIVEMENT avec un objet JSON valide, sans texte d'introduction ni balises markdown markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6,
      },
    });

    const rawJson = response.text?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      // Clean up markdown block if present
      const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    res.json({
      success: true,
      journal: parsed.academicJournal,
      scripts: parsed.socialScripts,
    });
  } catch (error: any) {
    console.error('Journal & script generation error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la génération du journal et des scripts' });
  }
});

// 6. Intelligent Schedule Rebalancing
app.post('/api/plan-schedule', async (req: Request, res: Response) => {
  try {
    const { defenseDate, availableHoursPerWeek, stages, tasks } = req.body;

    const prompt = `Tu es SAM, l'assistante d'organisation de Donald.
Donald prépare sa soutenance de Master en Architecture prévue le : ${defenseDate || "18 décembre 2026"}.
Disponibilité hebdomadaire : ${availableHoursPerWeek || 25} heures par semaine.

Voici le statut des 20 étapes :
${(stages || []).map((s: any) => `- Étape ${s.id}: ${s.title} [${s.status}]`).join('\n')}

Voici la liste des tâches actuelles :
${(tasks || []).map((t: any) => `- [${t.priority}] ${t.title} (Échéance: ${t.dueDate}, Statut: ${t.status}, Heures estimées: ${t.estimatedHours})`).join('\n')}

Analyse la charge de travail et produis :
1. Un diagnostic lucide sur le respect des délais (y a-t-il un risque d'engorgement ?).
2. Les 3 étapes critiques prioritaires pour la semaine à venir.
3. Un rétroplanning rééquilibré avec jalons intermédiaires réalistes.
4. Des conseils personnalisés pour Donald pour maintenir son rythme sans s'épuiser.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    res.json({
      success: true,
      scheduleAdvice: response.text || '',
    });
  } catch (error: any) {
    console.error('Plan schedule error:', error);
    res.status(500).json({ error: error.message || 'Erreur lors du calcul du rétroplanning' });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SAM is ready for Donald on http://localhost:${PORT}`);
  });
}

startServer();

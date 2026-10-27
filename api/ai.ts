/**
 * Fonction serverless Vercel unique : toutes les actions IA de SAM.
 * POST /api/ai  { action: 'chat' | 'research' | 'analyze-thesis' | 'draft' | 'journal' | 'plan', ...payload }
 *
 * La clé Gemini reste côté serveur. Si Supabase est configuré, chaque appel
 * doit porter le jeton de session de l'utilisateur (Authorization: Bearer ...).
 */
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

type Req = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
};
type Res = {
  status: (code: number) => Res;
  json: (body: unknown) => void;
  setHeader: (k: string, v: string) => void;
};

export const config = { maxDuration: 60 };

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let ai: GoogleGenAI | null = null;
function getAi() {
  if (!process.env.GEMINI_API_KEY) {
    throw new HttpError(500, "GEMINI_API_KEY n'est pas configurée sur le serveur (Vercel → Settings → Environment Variables).");
  }
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
}

class HttpError extends Error {
  constructor(public code: number, message: string) {
    super(message);
  }
}

async function requireUser(req: Req) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null; // mode local sans auth
  const raw = req.headers['authorization'];
  const header = Array.isArray(raw) ? raw[0] : raw;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Connecte-toi pour utiliser SAM.');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Session expirée. Reconnecte-toi.');
  return data.user;
}

const str = (v: unknown, max = 20000) => (typeof v === 'string' ? v.slice(0, max) : '');

// Modèles essayés dans l'ordre quand Google est surchargé (erreurs 503 / 429).
const FALLBACKS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.6-flash,gemini-3.5-flash-lite')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
const MODELS = [MODEL, ...FALLBACKS.filter((m) => m !== MODEL)];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function isBusy(e: any) {
  if (e instanceof HttpError) return false;
  const msg = String(e?.message || '');
  const code = Number(e?.status || e?.code || 0);
  return code === 503 || code === 429 || code === 500 || /UNAVAILABLE|overloaded|high demand|RESOURCE_EXHAUSTED|503|429/i.test(msg);
}
const isTimeout = (e: any) => e?.name === 'AbortError' || e?.name === 'TimeoutError' || /aborted|timeout/i.test(String(e?.message || ''));

// Vercel coupe la fonction à 60 s : on garde une marge pour répondre proprement.
const BUDGET_MS = 52_000;

async function generate(contents: any, cfg: Record<string, unknown>) {
  const started = Date.now();
  let lastErr: any;
  for (let i = 0; i < MODELS.length; i++) {
    const remaining = BUDGET_MS - (Date.now() - started);
    if (remaining < 6_000) break;
    // Le premier modèle a plus de temps ; les modèles de secours sont plus rapides.
    const slot = i === MODELS.length - 1 ? remaining : Math.min(remaining, i === 0 ? 30_000 : 20_000);
    try {
      return await getAi().models.generateContent({
        model: MODELS[i],
        contents,
        config: { ...cfg, abortSignal: AbortSignal.timeout(slot) },
      });
    } catch (e: any) {
      lastErr = e;
      if (!isBusy(e) && !isTimeout(e)) throw e;
      console.warn(`[SAM api] ${MODELS[i]} indisponible (${isTimeout(e) ? 'délai dépassé' : 'surchargé'}), modèle suivant`);
      await sleep(400);
    }
  }
  throw new HttpError(
    503,
    isTimeout(lastErr)
      ? 'Gemini met trop de temps à répondre en ce moment. Réessaie dans une minute, ou demande une réponse plus courte.'
      : 'Les serveurs de Google sont très sollicités en ce moment. Réessaie dans une minute.',
  );
}

// ---------------------------------------------------------------- actions

async function chat(b: any) {
  const name = str(b.studentName, 60) || 'Donald';
  const ctx = b.context || {};
  const conciseness = b.conciseness;
  const decisions = (ctx.decisions || [])
    .slice(0, 40)
    .map((d: any) => `- [${d.date}] ${d.decisionText} (Justification : ${d.justification})`)
    .join('\n');
  const stages = (ctx.stages || [])
    .filter((s: any) => s.status !== 'not_started')
    .map((s: any) => `- Étape ${s.id} : ${s.title} [${s.status}] – ${String(s.completedWork || '').slice(0, 120)}…`)
    .join('\n');

  const systemInstruction = `Tu es SAM, l'assistante personnelle intelligente, complice et rigoureuse de ${name}.
RÈGLES D'IDENTITÉ :
- Tu es SAM. Ton utilisateur s'appelle ${name} : étudiant en architecture (Master), qui réalise son mémoire et son TPFE.
- Tu t'adresses à lui en l'appelant ${name}. Ne confonds jamais vos identités.
- ${name} décide de tout : sa posture intellectuelle et son projet architectural. Tu es son bras droit méthodologique, sa boussole critique et sa partenaire de réflexion.
- Si une information manque, demande-la ou signale qu'elle reste à compléter. N'invente jamais de données, de mesures ni de citations.

TON ET STYLE :
- Échanges généraux : chaleureux, direct, honnête, stimulant. Donne envie d'avancer.
- Méthodologie et rédaction : rigoureux, précis, conforme aux conventions d'un mémoire de Master en architecture.
- Mets en forme en Markdown léger (titres courts, listes, gras pour l'essentiel).
- Concision : ${conciseness === 'concise' ? 'très synthétique, droit aux faits.' : conciseness === 'detailed' ? 'approfondi, étayé, riche en exemples.' : 'équilibré : clair, structuré, prêt pour l’action.'}

CONTEXTE DU PROJET :
- Sujet : ${str(ctx.topic, 400) || 'Architecture bioclimatique et matériaux locaux en milieu tropical'}
- TPFE : ${str(ctx.subTopic, 400) || 'Équipement public résilient en terre crue stabilisée'}
- Lieu : ${str(ctx.contextLocation, 200) || "Afrique de l'Ouest"}
- Soutenance : ${str(ctx.defenseDate, 40) || 'non fixée'}
- Étape active : ${b.stageId ? `Étape #${b.stageId}` : 'vue générale'}

DÉCISIONS VALIDÉES (à respecter sans contradiction) :
${decisions || 'Aucune pour l’instant.'}

PARCOURS :
${stages || 'Phase initiale de cadrage.'}`;

  const contents: any[] = [];
  for (const h of (b.history || []).slice(-10)) {
    contents.push({ role: h.sender === 'SAM' ? 'model' : 'user', parts: [{ text: str(h.content, 6000) }] });
  }
  contents.push({ role: 'user', parts: [{ text: str(b.message, 8000) }] });

  const r = await generate(contents, { systemInstruction, temperature: 0.7 });
  return { reply: r.text || `${name}, je n'ai pas pu formuler de réponse. Peux-tu reformuler ?` };
}

async function research(b: any) {
  const query = str(b.query, 1000);
  if (!query) throw new HttpError(400, 'Requête manquante');
  const name = str(b.studentName, 60) || 'Donald';
  const prompt = `En tant que SAM, effectue une recherche documentaire approfondie et rigoureuse pour ${name} (Master en architecture) :
"${query}"

Type de recherche : ${str(b.researchType, 60) || 'scientifique'}. Thème : ${str(b.theme, 80) || 'Général'}.

DIRECTIVES :
1. Privilégie articles scientifiques, thèses d'architecture et de génie civil, ouvrages de référence (Givoni, Olgyay, CRAterre, normes thermiques tropicales, ASHRAE…).
2. N'invente JAMAIS une référence, un auteur, une page ou un DOI. Signale toute incertitude.
3. Structure en Markdown :
   ## Synthèse
   ## Faits établis
   ## Débats d'auteurs
   ## Pistes pour le TPFE
   ## À vérifier
   ## Sources (titre, auteurs, année, type, lien ou DOI, citation clé)`;

  const r = await generate(prompt, { tools: [{ googleSearch: {} }], temperature: 0.3 });
  const chunks = (r.candidates?.[0] as any)?.groundingMetadata?.groundingChunks || [];
  const seen = new Set<string>();
  const sources = chunks
    .filter((c: any) => c.web?.uri && !seen.has(c.web.uri) && seen.add(c.web.uri))
    .map((c: any) => ({ title: c.web.title || 'Source web', url: c.web.uri }));
  return { text: r.text || '', sources };
}

async function analyzeThesis(b: any) {
  const text = str(b.thesisText, 18000);
  if (!text) throw new HttpError(400, 'Texte du mémoire manquant');
  const name = str(b.studentName, 60) || 'Donald';
  const prompt = `Tu es SAM. Analyse ce mémoire de référence pour ${name} (Master en architecture).
Titre : "${str(b.thesisTitle, 300) || 'Mémoire de référence'}" — Auteur : ${str(b.author, 120) || 'non précisé'} — Institution : ${str(b.university, 200) || 'non précisée'} — Mention : ${str(b.grade, 80) || 'non précisée'}

Extrait :
"""
${text}
"""

Réponds en JSON strict avec ces clés :
{
  "generalPlan": "logique du plan : comment s'articulent théorie, diagnostic et projet (paragraphe)",
  "problemStatementMethod": "construction de la problématique et méthode de démonstration (paragraphe)",
  "theoreticalFramework": "cadre théorique mobilisé (paragraphe)",
  "architecturalIntegration": "lien entre mémoire et projet architectural (paragraphe)",
  "strengths": ["3 à 5 points forts"],
  "weaknesses": ["2 à 4 limites"],
  "lessonsForDonald": ["3 à 5 enseignements concrets et transposables pour ${name}, sans plagiat"],
  "report": "rapport complet en Markdown (sections : Plan, Problématique, Méthode, Écriture, Sources et iconographie, Limites, Ce que ${name} peut en retenir)"
}`;
  const r = await generate(prompt, { temperature: 0.4, responseMimeType: 'application/json' });
  return { analysis: parseJson(r.text) };
}

async function draft(b: any) {
  const name = str(b.studentName, 60) || 'Donald';
  const title = str(b.sectionTitle, 300);
  const outline = str(b.currentOutline, 8000);
  const existing = str(b.existingDraft, 16000);
  const instructions = str(b.instructions, 3000);
  const step = Number(b.stepNumber) || 4;

  const systemInstruction = `Tu es SAM, rédactrice académique exigeante et partenaire de ${name} pour son mémoire de Master en architecture.
- Style académique sobre, précis, nuancé, argumenté. "Nous" de modestie ou tournures impersonnelles.
- Aucune formule de remplissage ("De tout temps…", "Il est indéniable que…").
- Ancrage dans le climat tropical et la réalité constructive (géomatériaux, inertie, ventilation passive).
- N'invente aucun chiffre : marque-le entre crochets, ex. [insérer mesure in situ].
- ${name} garde le contrôle : propose des formulations qu'il pourra amender.`;

  let prompt: string;
  if (step === 2) {
    prompt = `Section : "${title}". Consignes de ${name} : ${instructions}\nPropose un plan détaillé en 3 à 5 sous-parties, avec l'objectif démonstratif de chacune.`;
  } else if (step === 3) {
    prompt = `Section "${title}", plan :\n${outline}\nListe précisément les données manquantes (normes, mesures climatiques, sources, relevés, données d'usagers) à réunir avant de rédiger.`;
  } else if (step === 4) {
    prompt = `Rédige une première version académique complète pour la section "${title}".\nPlan :\n${outline}\nConsignes :\n${instructions}\nSoigne les transitions. Rends uniquement le texte de la section, en paragraphes.`;
  } else if (step === 6) {
    prompt = `Audit critique du texte de la section "${title}" :\n"""\n${existing}\n"""\n1. Affirmations non justifiées ?\n2. Ruptures logiques ou répétitions ?\n3. Style adapté au niveau Master ?\n4. Trois propositions d'amélioration précises.`;
  } else {
    prompt = `Améliore le texte de la section "${title}" selon les remarques : "${instructions}"\n"""\n${existing}\n"""`;
  }
  const r = await generate(prompt, { systemInstruction, temperature: 0.5 });
  return { result: r.text || '' };
}

async function journal(b: any) {
  const notes = str(b.rawNotes, 10000);
  if (!notes) throw new HttpError(400, 'Notes de la séance manquantes');
  const name = str(b.studentName, 60) || 'Donald';
  const prompt = `Tu es SAM, l'assistante de ${name} (Master d'architecture).
Notes brutes de sa séance de travail :
"""
${notes}
"""
Durée : ${Number(b.durationMinutes) || 120} minutes. Étape : ${str(b.relatedStageTitle, 200) || 'Mémoire & TPFE'}. Sujet : ${str(b.topic, 300)}.

Génère un JSON strict :
{
 "academicJournal": { "context": "", "objectives": "", "actionsDone": "", "resultsAchieved": "", "validatedDecisions": "décisions validées par ${name} avec justification, ou 'Aucune'", "difficultiesAndLimits": "", "nextSteps": "" },
 "socialScripts": {
   "tiktok30s": { "title": "", "hook": "1 phrase intrigante", "script": "30 à 45 s face caméra", "keyTakeaway": "", "hashtags": ["5 hashtags"], "estimatedDuration": "35 secondes" },
   "vlog60s": { "title": "", "hook": "", "script": "60 à 75 s", "visualNotes": "cadrages, maquettes, coupes, écran", "keyTakeaway": "", "hashtags": [], "estimatedDuration": "60 secondes" },
   "podcastEpisode": { "title": "", "hook": "", "script": "2 à 3 minutes de lecture posée", "keyTakeaway": "", "estimatedDuration": "3 minutes" }
 }
}
Le journal est fidèle et factuel. Les scripts sont humains, accessibles, sans faux enthousiasme.`;
  const r = await generate(prompt, { responseMimeType: 'application/json', temperature: 0.6 });
  const parsed = parseJson(r.text);
  if (!parsed.academicJournal || !parsed.socialScripts) throw new HttpError(502, 'Réponse IA incomplète, réessaie.');
  return { journal: parsed.academicJournal, scripts: parsed.socialScripts };
}

async function plan(b: any) {
  const name = str(b.studentName, 60) || 'Donald';
  const prompt = `Tu es SAM, l'assistante d'organisation de ${name}.
Soutenance prévue le ${str(b.defenseDate, 40) || 'non fixée'}. Disponibilité : ${Number(b.availableHoursPerWeek) || 25} h/semaine.

Étapes :
${(b.stages || []).map((s: any) => `- Étape ${s.id} : ${s.title} [${s.status}]`).join('\n')}

Tâches :
${(b.tasks || []).map((t: any) => `- [${t.priority}] ${t.title} (échéance ${t.dueDate}, ${t.status}, ${t.estimatedHours} h)`).join('\n')}

Réponds en Markdown :
## Diagnostic
## Les 3 priorités de la semaine
## Rétroplanning rééquilibré
## Pour tenir le rythme sans s'épuiser`;
  const r = await generate(prompt, { temperature: 0.4 });
  return { scheduleAdvice: r.text || '' };
}

function parseJson(text?: string) {
  const raw = (text || '{}').trim();
  try {
    return JSON.parse(raw);
  } catch {
    return JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
  }
}

const ACTIONS: Record<string, (b: any) => Promise<unknown>> = {
  chat,
  research,
  'analyze-thesis': analyzeThesis,
  draft,
  journal,
  plan,
};

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  try {
    await requireUser(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const fn = ACTIONS[body.action];
    if (!fn) throw new HttpError(400, `Action inconnue : ${body.action}`);
    const result = await fn(body);
    res.status(200).json({ success: true, ...(result as object) });
  } catch (e: any) {
    const code = e instanceof HttpError ? e.code : 500;
    console.error('[SAM api]', e);
    let message = e?.message || 'Erreur serveur';
    try {
      const parsed = JSON.parse(message);
      message = parsed?.error?.message || message;
    } catch { /* message déjà lisible */ }
    res.status(code).json({ success: false, error: message });
  }
}

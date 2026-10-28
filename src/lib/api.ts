import { supabase } from './supabase';

let studentName = 'Donald';
export const setStudentName = (n: string) => { studentName = n || 'Donald'; };

export type AiAction = 'chat' | 'research' | 'analyze-thesis' | 'draft' | 'journal' | 'plan';

/** Appelle la fonction serverless /api/ai et renvoie la réponse JSON ou lève une erreur lisible. */
export async function callAi<T = any>(action: AiAction, payload: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  let res: Response;
  try {
    res = await fetch('/api/ai', { method: 'POST', headers, body: JSON.stringify({ action, studentName, ...payload }) });
  } catch {
    throw new Error('Pas de connexion au serveur. Vérifie ton réseau puis réessaie.');
  }
  let json: any = null;
  try { json = await res.json(); } catch { /* réponse non JSON */ }
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Le serveur a répondu ${res.status}. Réessaie dans un instant.`);
  }
  return json as T;
}

export function download(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const today = () => new Date().toISOString().split('T')[0];
export const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
export const wordCount = (t?: string) => (t ? t.split(/\s+/).filter(Boolean).length : 0);

export function daysUntil(date?: string) {
  if (!date) return null;
  const d = new Date(date).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

export function formatDate(date?: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('fr-FR', opts);
}

/**
 * Message à SAM avec réponse au fil de l'eau : `onText` reçoit le texte déjà arrivé, à chaque morceau.
 * Si le serveur ne diffuse pas (ancienne version, erreur), on retombe sur une réponse classique.
 */
export async function chatStream(payload: Record<string, unknown>, onText: (full: string) => void): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  let res: Response;
  try {
    res = await fetch('/api/ai', { method: 'POST', headers, body: JSON.stringify({ action: 'chat', stream: true, studentName, ...payload }) });
  } catch {
    throw new Error('Pas de connexion au serveur. Vérifie ton réseau puis réessaie.');
  }
  const type = res.headers.get('content-type') || '';
  if (!res.ok || type.includes('application/json')) {
    let json: any = null;
    try { json = await res.json(); } catch { /* réponse vide */ }
    if (res.ok && json?.success && json.reply) {
      onText(json.reply);
      return json.reply;
    }
    if (res.status === 413) throw new Error('Pièces jointes trop lourdes. Envoie moins de fichiers ou des fichiers plus légers.');
    throw new Error(json?.error || `Le serveur a répondu ${res.status}. Réessaie dans un instant.`);
  }
  const reader = res.body?.getReader();
  if (!reader) {
    const t = await res.text();
    onText(t);
    return t;
  }
  const decoder = new TextDecoder();
  let full = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onText(full.replace(/\n*\[\[SAM_ERROR\]\][\s\S]*$/, ''));
  }
  full += decoder.decode();
  const err = full.match(/\[\[SAM_ERROR\]\]\s*([\s\S]*)$/);
  if (err) {
    const partial = full.slice(0, err.index).trimEnd();
    if (partial) return `${partial}\n\n_(${err[1].trim()})_`;
    throw new Error(err[1].trim());
  }
  return full;
}

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

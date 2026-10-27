import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

/** null quand Supabase n'est pas configuré : l'app fonctionne alors en mode local (navigateur). */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
export const isCloud = !!supabase;

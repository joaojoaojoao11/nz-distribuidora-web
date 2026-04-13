import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[NZ] Variáveis de ambiente do Supabase não configuradas.\n' +
    'Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env ou no painel da Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

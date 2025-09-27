import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// helpful runtime hint (only logs presence, not secrets)
if (!supabaseUrl || !supabaseKey) {
  // run-time notice in the browser console when the app loads
  // (keeps secret values out of logs)
  // eslint-disable-next-line no-console
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing. Supabase client will be disabled.');
} else {
  // eslint-disable-next-line no-console
  console.debug('[supabase] VITE_SUPABASE_* env vars present. Supabase client will be initialized.');
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export default supabase;

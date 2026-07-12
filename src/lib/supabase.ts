import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Nullable so the UI can be built/previewed before the backend is configured.
 * Call `requireSupabase()` inside actions that actually need the DB.
 */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } }) : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
    )
  }
  return supabase
}

export const isSupabaseConfigured = !!supabase

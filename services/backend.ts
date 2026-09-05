import { isSupabaseConfigured } from '@/lib/supabaseConfig';
import { isFirebaseConfigured } from '@/lib/firebaseConfig';
import { Backend } from '@/services/backendTypes';
import { localBackend } from '@/services/localBackend';

/**
 * Selects the active backend. Supabase when configured, then Firebase,
 * otherwise the local offline store so the app stays fully usable with no
 * cloud setup at all.
 *
 * Requires are lazy so an unconfigured cloud SDK never initializes.
 */
let selected: Backend = localBackend;

if (isSupabaseConfigured) {
  const { supabaseBackend } = require('@/services/supabaseBackend');
  selected = supabaseBackend;
} else if (isFirebaseConfigured) {
  const { firebaseBackend } = require('@/services/firebaseBackend');
  selected = firebaseBackend;
}

export const backend = selected;
export const backendKind = selected.kind;

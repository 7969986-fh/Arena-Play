/**
 * Supabase project connection.
 *
 * The publishable key is meant to ship inside the app — it only grants what
 * the row-level security policies in `supabase/schema.sql` allow. Never put
 * the *secret* / service-role key in here; that one bypasses RLS entirely.
 */
export const supabaseConfig = {
  url: 'https://afgkwzfglvhskssjwuhp.supabase.co',
  publishableKey: 'sb_publishable_0zRtuw44NdmQl6OJzs_SMg_UVvshqLt',
};

export const isSupabaseConfigured =
  !!supabaseConfig.url &&
  !!supabaseConfig.publishableKey &&
  !supabaseConfig.url.startsWith('YOUR_');

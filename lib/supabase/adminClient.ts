import "server-only";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let adminInstance: SupabaseClient | null = null;

/**
 * Supabase client with service_role (bypasses RLS). Server-only; never expose the key to the client.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!supabaseUrl.startsWith("http") || !serviceRoleKey) {
    return null;
  }
  if (!adminInstance) {
    adminInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminInstance;
}

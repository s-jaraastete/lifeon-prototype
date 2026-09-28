import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function requireArtpVersionPdfAccess(
  request: Request,
  versionId: string
): Promise<
  | { ok: true; ctx: { user: User; userClient: SupabaseClient } }
  | { ok: false; status: number; error: string }
> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 503, error: "Supabase no configurado" };
  }
  const id = versionId.trim();
  if (!id) return { ok: false, status: 400, error: "Versión requerida" };

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return { ok: false, status: 401, error: "Token de sesión requerido" };

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);
  if (userError || !user) return { ok: false, status: 401, error: "Sesión inválida" };

  const { data, error } = await userClient.rpc("can_read_artp_version", {
    p_version_id: id,
  });
  if (error || data !== true) {
    return { ok: false, status: 403, error: "No tienes acceso a este ARTP" };
  }

  return { ok: true, ctx: { user, userClient } };
}

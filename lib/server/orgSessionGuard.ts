import "server-only";

import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export type OrgEditorContext = {
  user: User;
  userClient: SupabaseClient;
  organizationId: string;
  role: string;
};

/** Only Administrador may grant the Administrador role. */
export function canAssignMemberRole(actorRole: string, targetRole: string): boolean {
  if (targetRole === "Administrador" && actorRole !== "Administrador") {
    return false;
  }
  return true;
}

export async function requireOrgEditor(
  request: Request,
  organizationId: string
): Promise<{ ok: true; ctx: OrgEditorContext } | { ok: false; status: number; error: string }> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 503, error: "Supabase no configurado" };
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return { ok: false, status: 401, error: "Token de sesión requerido" };
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return { ok: false, status: 401, error: "Sesión inválida" };
  }

  const orgId = organizationId.trim();
  if (!orgId) {
    return { ok: false, status: 400, error: "organizationId requerido" };
  }

  const { data: editorMember, error: editorErr } = await userClient
    .from("organization_members")
    .select("id, role, status, organization_id")
    .eq("auth_user_id", user.id)
    .eq("organization_id", orgId)
    .eq("status", "Activo")
    .maybeSingle();

  if (editorErr || !editorMember) {
    return { ok: false, status: 403, error: "Sin membresía en la organización" };
  }

  if (!["Administrador", "Editor"].includes(editorMember.role)) {
    return { ok: false, status: 403, error: "Sin permiso para esta acción" };
  }

  return {
    ok: true,
    ctx: {
      user,
      userClient,
      organizationId: orgId,
      role: editorMember.role,
    },
  };
}

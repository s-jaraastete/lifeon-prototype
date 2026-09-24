import "server-only";

import { createClient, User, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export type DeliveryAccessContext = {
  user: User;
  userClient: SupabaseClient;
  deliveryId: string;
};

export async function requireDeliveryAssigneeAccess(
  request: Request,
  deliveryId: string
): Promise<
  { ok: true; ctx: DeliveryAccessContext } | { ok: false; status: number; error: string }
> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 503, error: "Supabase no configurado" };
  }

  const id = deliveryId.trim();
  if (!id) {
    return { ok: false, status: 400, error: "ID de entrega requerido" };
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

  const { data: row, error } = await userClient
    .from("document_deliveries")
    .select("id")
    .eq("id", id)
    .eq("assignee_auth_user_id", user.id)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, status: 403, error: "No tienes acceso a este documento" };
  }

  return { ok: true, ctx: { user, userClient, deliveryId: id } };
}

export async function requireDeliveryPdfAccess(
  request: Request,
  deliveryId: string
): Promise<
  { ok: true; ctx: DeliveryAccessContext } | { ok: false; status: number; error: string }
> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: false, status: 503, error: "Supabase no configurado" };
  }

  const id = deliveryId.trim();
  if (!id) {
    return { ok: false, status: 400, error: "ID de entrega requerido" };
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

  const { data: delivery, error } = await userClient
    .from("document_deliveries")
    .select("id, organization_id, assignee_auth_user_id")
    .eq("id", id)
    .maybeSingle();

  if (error || !delivery) {
    return { ok: false, status: 404, error: "Documento no encontrado" };
  }

  if (delivery.assignee_auth_user_id === user.id) {
    return { ok: true, ctx: { user, userClient, deliveryId: id } };
  }

  const { data: editorMember, error: editorErr } = await userClient
    .from("organization_members")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .eq("organization_id", delivery.organization_id)
    .eq("status", "Activo")
    .maybeSingle();

  if (
    editorErr ||
    !editorMember ||
    !["Administrador", "Editor"].includes(String(editorMember.role))
  ) {
    return { ok: false, status: 403, error: "No tienes acceso a este documento" };
  }

  return { ok: true, ctx: { user, userClient, deliveryId: id } };
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { findAuthUserIdByEmail } from "@/lib/server/memberProvisioning";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function resolveInviteRedirectOrigin(request: Request): string | null {
  const originHeader = request.headers.get("origin")?.replace(/\/$/, "") ?? "";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const allowed = new Set<string>();
  if (siteUrl) allowed.add(siteUrl);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }
  if (originHeader && allowed.has(originHeader)) {
    return originHeader;
  }
  if (siteUrl) return siteUrl;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return null;
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Token de sesión requerido" }, { status: 401 });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  let body: { organizationId?: string; memberId?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim();
  const memberId = body.memberId?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!organizationId || !memberId || !email) {
    return NextResponse.json({ error: "Faltan organizationId, memberId o email" }, { status: 400 });
  }

  const { data: editorMember, error: editorErr } = await userClient
    .from("organization_members")
    .select("id, role, status, organization_id")
    .eq("auth_user_id", user.id)
    .eq("organization_id", organizationId)
    .eq("status", "Activo")
    .maybeSingle();

  if (editorErr || !editorMember) {
    return NextResponse.json({ error: "Sin membresía en la organización" }, { status: 403 });
  }

  if (!["Administrador", "Editor"].includes(editorMember.role)) {
    return NextResponse.json({ error: "Sin permiso para enviar accesos" }, { status: 403 });
  }

  const { data: targetMember, error: targetErr } = await userClient
    .from("organization_members")
    .select("id, email, organization_id, status")
    .eq("id", memberId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (targetErr || !targetMember) {
    return NextResponse.json({ error: "Usuario no encontrado en la organización" }, { status: 404 });
  }

  if (targetMember.email.toLowerCase() !== email) {
    return NextResponse.json({ error: "El email no coincide con el usuario" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Servicio de administración no disponible" }, { status: 503 });
  }

  const origin = resolveInviteRedirectOrigin(request);
  if (!origin) {
    return NextResponse.json(
      { error: "Origen no permitido para el enlace de invitación" },
      { status: 400 }
    );
  }

  const redirectTo = `${origin}/auth/set-password`;

  let authUserId: string;

  const existingAuthId = await findAuthUserIdByEmail(admin, email);

  if (existingAuthId) {
    const { error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (linkErr) {
      return NextResponse.json({ error: linkErr.message }, { status: 500 });
    }
    authUserId = existingAuthId;
  } else {
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });
    if (inviteErr || !invited.user) {
      return NextResponse.json({ error: inviteErr?.message ?? "No se pudo invitar" }, { status: 500 });
    }
    authUserId = invited.user.id;
  }

  await admin.from("profiles").upsert({ id: authUserId });

  const { error: linkErr } = await admin
    .from("organization_members")
    .update({ auth_user_id: authUserId })
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (linkErr) {
    return NextResponse.json({ error: linkErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, linked: true });
}

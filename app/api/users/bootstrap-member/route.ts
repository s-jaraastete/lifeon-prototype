import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { bootstrapOrganizationMemberIfAllowed } from "@/lib/server/memberBootstrap";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

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

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
  }

  let body: {
    organizationId?: string;
    legacyUserId?: string;
    email?: string;
    name?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const sessionEmail = user.email.trim().toLowerCase();
  if (!email || email !== sessionEmail) {
    return NextResponse.json({ error: "El email no coincide con la sesión" }, { status: 403 });
  }

  const organizationId = body.organizationId?.trim() ?? "";
  const legacyUserId = body.legacyUserId?.trim() ?? "";
  const name = body.name?.trim() ?? "";

  if (!organizationId || !legacyUserId || !name) {
    return NextResponse.json({ error: "Faltan datos de vinculación" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servicio de administración no disponible" },
      { status: 503 }
    );
  }

  try {
    const result = await bootstrapOrganizationMemberIfAllowed(admin, {
      organizationId,
      legacyUserId,
      email,
      name,
      authUserId: user.id,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo vincular la membresía";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TEST_ACCOUNTS_CONFIG, isResetAllowedForUser } from "@/lib/auth/authService";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { resetTestOrganization } from "@/lib/server/testOrgReset";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const resetInFlight = new Set<string>();

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Token de sesión requerido" }, { status: 401 });
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!email || !isResetAllowedForUser(email)) {
    return NextResponse.json({ error: "Restablecimiento no permitido para esta cuenta" }, { status: 403 });
  }

  const account = TEST_ACCOUNTS_CONFIG[email];
  if (!account?.resetAllowed) {
    return NextResponse.json({ error: "Restablecimiento no permitido" }, { status: 403 });
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

  const sessionEmail = user.email?.trim().toLowerCase() ?? "";
  if (sessionEmail !== email) {
    return NextResponse.json(
      { error: "Solo puedes restablecer tu propia cuenta de prueba" },
      { status: 403 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Restablecimiento no disponible en este entorno. Configure SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor (p. ej. Vercel → Settings → Environment Variables) y vuelva a desplegar.",
      },
      { status: 503 }
    );
  }

  if (resetInFlight.has(email)) {
    return NextResponse.json(
      { error: "Ya hay un restablecimiento en curso para esta cuenta" },
      { status: 429 }
    );
  }

  resetInFlight.add(email);

  try {
    await resetTestOrganization(admin, account);
    return NextResponse.json({ success: true, organizationId: account.orgId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo restablecer la cuenta";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    resetInFlight.delete(email);
  }
}

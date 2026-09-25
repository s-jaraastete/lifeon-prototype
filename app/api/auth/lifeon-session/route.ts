import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateLifeOnCredentials } from "@/lib/auth/devCredentials.server";
import {
  clearLifeonSessionCookieOptions,
  createLifeOnSessionToken,
  getLifeOnSession,
  lifeonSessionCookieOptions,
} from "@/lib/auth/lifeonSession";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

async function sessionFromSupabaseBearer(
  token: string
): Promise<{ id: string; email: string; orgId: string } | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser(token);

  if (error || !user?.email) return null;

  const { data: member } = await userClient
    .from("organization_members")
    .select("id, user_id, email, organization_id")
    .eq("auth_user_id", user.id)
    .eq("status", "Activo")
    .limit(1)
    .maybeSingle();

  if (!member?.organization_id) return null;

  return {
    id: member.user_id || member.id,
    email: member.email,
    orgId: member.organization_id,
  };
}

export async function GET() {
  const session = await getLifeOnSession();
  return NextResponse.json({ ok: !!session });
}

export async function POST(request: Request) {
  try {
    const isProd = process.env.NODE_ENV === "production";
    const authHeader = request.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let sessionUser: { id: string; email: string; orgId: string } | null = null;

    if (bearer) {
      sessionUser = await sessionFromSupabaseBearer(bearer);
    }

    if (!sessionUser && !isProd) {
      const body = (await request.json()) as { email?: string; password?: string };
      const email = body.email ?? "";
      const password = body.password ?? "";

      const result = validateLifeOnCredentials(email, password);
      if (!result.ok) {
        return NextResponse.json({ ok: false, message: result.message }, { status: 401 });
      }
      sessionUser = {
        id: result.user.id,
        email: result.user.email,
        orgId: result.user.orgId,
      };
    }

    if (!sessionUser) {
      const status = isProd ? 401 : 401;
      const message = isProd
        ? "Sesión Supabase requerida para APR Virtual."
        : "Credenciales inválidas o sesión no vinculada.";
      return NextResponse.json({ ok: false, message }, { status });
    }

    const token = createLifeOnSessionToken({
      id: sessionUser.id,
      email: sessionUser.email,
      orgId: sessionUser.orgId,
    });

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Servidor sin LIFEON_SESSION_SECRET configurado." },
        { status: 503 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(lifeonSessionCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json({ ok: false, message: "Solicitud inválida." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearLifeonSessionCookieOptions());
  return response;
}

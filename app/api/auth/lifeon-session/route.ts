import { NextResponse } from "next/server";
import { validateLifeOnCredentials } from "@/lib/auth/devCredentials.server";
import {
  clearLifeonSessionCookieOptions,
  createLifeOnSessionToken,
  getLifeOnSession,
  lifeonSessionCookieOptions,
} from "@/lib/auth/lifeonSession";

export async function GET() {
  const session = await getLifeOnSession();
  return NextResponse.json({ ok: !!session });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email ?? "";
    const password = body.password ?? "";

    const result = validateLifeOnCredentials(email, password);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 401 });
    }

    const token = createLifeOnSessionToken({
      id: result.user.id,
      email: result.user.email,
      orgId: result.user.orgId,
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

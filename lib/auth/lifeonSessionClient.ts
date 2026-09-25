import { getSupabaseClient } from "@/lib/supabaseClient";
import { isProductionBuild } from "@/lib/env/runtime";

export type LifeOnSessionSyncResult = {
  ok: boolean;
  message?: string;
  code?: string;
};

/** Comprueba si la cookie httpOnly de sesión IA está activa. */
export async function hasLifeOnAiSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/lifeon-session", { credentials: "include" });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return !!data.ok;
  } catch {
    return false;
  }
}

async function getSupabaseAccessToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const {
    data: { session },
  } = await client.auth.getSession();
  return session?.access_token ?? null;
}

/** Sincroniza cookie httpOnly de sesión LifeOn (APIs de IA). */
export async function syncLifeOnSessionCookie(
  email: string,
  password: string
): Promise<LifeOnSessionSyncResult> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const accessToken = await getSupabaseAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const body =
      isProductionBuild() || accessToken
        ? {}
        : { email, password };

    const res = await fetch("/api/auth/lifeon-session", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
    });
    const data = (await res.json()) as { ok?: boolean; message?: string; code?: string };
    return {
      ok: res.ok && !!data.ok,
      message: data.message,
      code: data.code,
    };
  } catch {
    return { ok: false, message: "Error de red al conectar con el servidor." };
  }
}

export async function clearLifeOnSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/lifeon-session", {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    /* ignore */
  }
}

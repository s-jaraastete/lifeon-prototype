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

/** Sincroniza cookie httpOnly de sesión LifeOn (APIs de IA). */
export async function syncLifeOnSessionCookie(email: string, password: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/lifeon-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
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

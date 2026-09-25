import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  AuthUser,
  TEST_ACCOUNTS_CONFIG,
  authenticateUser,
  setActiveUser,
} from "@/lib/auth/authService";
import { mustUseSupabasePersistence, requiresSupabaseAuthSession } from "@/lib/env/runtime";
import {
  fetchMemberByAuthUser,
  fetchMemberByEmail,
  ensureBootstrapMember,
  type MemberRow,
} from "@/lib/repositories/memberRepository";
import { fetchProfileByAuthId, upsertProfile } from "@/lib/repositories/profileRepository";
import { fetchOrganization } from "@/lib/repositories/organizationRepository";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import { normalizeAppLoginPassword, loginPasswordCandidates } from "@/lib/auth/defaultAppPassword";
import { withMediaCacheBust } from "@/lib/media/cacheBust";

export interface LifeOnSignInResult {
  success: boolean;
  user?: AuthUser;
  message?: string;
  usedSupabaseAuth?: boolean;
}

function buildAuthUserFromTestAccount(email: string): AuthUser | null {
  const normalized = email.trim().toLowerCase();
  const account = TEST_ACCOUNTS_CONFIG[normalized];
  if (!account) return null;
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    orgId: account.orgId,
    orgName: account.orgName,
    isDemo: account.isDemo,
    avatarUrl: account.avatarUrl ?? null,
  };
}

async function authUserFromMemberRow(
  member: MemberRow,
  authUserId: string
): Promise<AuthUser> {
  const org = await fetchOrganization(member.organization_id);
  const profile = await fetchProfileByAuthId(authUserId);
  const displayName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
      : member.name;
  return {
    id: member.user_id || member.id,
    name: displayName || member.name,
    email: member.email,
    orgId: member.organization_id,
    orgName: org?.name || member.organization_id,
    isDemo: member.organization_id === "org_demo",
    avatarUrl: profile?.avatar_path
      ? withMediaCacheBust(profile.avatar_path, profile.updated_at)
      : null,
  };
}

async function resolveMemberForAuthUser(
  authUserId: string,
  email: string
): Promise<MemberRow | null> {
  let member = await fetchMemberByAuthUser(authUserId);
  if (member) return member;

  const testAccount = TEST_ACCOUNTS_CONFIG[email.trim().toLowerCase()];
  if (!testAccount) return null;

  await ensureBootstrapMember(
    testAccount.orgId,
    testAccount.id,
    testAccount.email,
    testAccount.name,
    authUserId
  );

  member = await fetchMemberByAuthUser(authUserId);
  if (member) return member;

  member = await fetchMemberByEmail(testAccount.orgId, email);
  if (member?.auth_user_id === authUserId) return member;

  return null;
}

async function hydrateFromSupabaseSession(
  authUserId: string,
  email: string
): Promise<AuthUser | null> {
  const member = await resolveMemberForAuthUser(authUserId, email);
  if (member) {
    return authUserFromMemberRow(member, authUserId);
  }

  if (!requiresSupabaseAuthSession()) {
    return buildAuthUserFromTestAccount(email);
  }

  return null;
}

/**
 * Sign in: Supabase Auth first, then dev credentials when allowed.
 */
export async function signInLifeOn(email: string, password: string): Promise<LifeOnSignInResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const client = getSupabaseClient();

  if (client && isSupabaseConfigured()) {
    const passwordCandidates = loginPasswordCandidates(normalizedEmail, password);
    let data: Awaited<ReturnType<typeof client.auth.signInWithPassword>>["data"] | null = null;
    let lastError: Awaited<ReturnType<typeof client.auth.signInWithPassword>>["error"] = null;

    for (const authPassword of passwordCandidates) {
      const attempt = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password: authPassword,
      });
      if (!attempt.error && attempt.data.user) {
        data = attempt.data;
        lastError = null;
        break;
      }
      lastError = attempt.error;
    }

    if (data?.user) {
      const testAccount = TEST_ACCOUNTS_CONFIG[normalizedEmail];
      if (testAccount) {
        const parts = testAccount.name.split(" ");
        await upsertProfile(data.user.id, {
          first_name: parts[0],
          last_name: parts.slice(1).join(" ") || null,
        });
      }

      const hydrated = await hydrateFromSupabaseSession(data.user.id, normalizedEmail);
      if (hydrated) {
        setActiveUser(hydrated);
        return { success: true, user: hydrated, usedSupabaseAuth: true };
      }

      if (testAccount) {
        return {
          success: false,
          message:
            "Tu cuenta inició sesión en Supabase, pero no está vinculada a la organización. Revisa SUPABASE_SERVICE_ROLE_KEY en .env.local, cierra sesión y vuelve a entrar.",
        };
      }

      return {
        success: false,
        message:
          "No tienes membresía activa en ninguna organización. Contacta a un administrador.",
      };
    }

    if (lastError) {
      logPersistenceError("auth.signIn", lastError);
    }
  }

  if (requiresSupabaseAuthSession() || mustUseSupabasePersistence()) {
    return {
      success: false,
      message:
        "No se pudo iniciar sesión con Supabase Auth. Usa tu correo @safetyclub.cl y la contraseña de prueba (ej. serg, luis) o la contraseña completa en Auth.",
    };
  }

  const devResult = authenticateUser(email, password);
  if (devResult.success && devResult.user) {
    setActiveUser(devResult.user);
    return { success: true, user: devResult.user, usedSupabaseAuth: false };
  }
  return { success: false, message: devResult.message || "Credenciales incorrectas." };
}

export async function signOutLifeOn(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      logPersistenceError("auth.signOut", e);
    }
  }
}

export async function getSupabaseAuthUserId(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const {
    data: { session },
  } = await client.auth.getSession();
  if (session?.user?.id) return session.user.id;

  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}

/** Re-sincroniza usuario activo desde Supabase (p. ej. al cargar el dashboard). */
export async function refreshActiveUserFromSupabaseSession(): Promise<AuthUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const {
    data: { session },
  } = await client.auth.getSession();
  const authUserId = session?.user?.id;
  const email = session?.user?.email?.trim().toLowerCase();
  if (!authUserId || !email) return null;

  const hydrated = await hydrateFromSupabaseSession(authUserId, email);
  if (hydrated) {
    setActiveUser(hydrated);
  }
  return hydrated;
}

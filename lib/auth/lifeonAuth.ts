import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  AuthUser,
  TEST_ACCOUNTS_CONFIG,
  authenticateUser,
  setActiveUser,
} from "@/lib/auth/authService";
import { mustUseSupabasePersistence } from "@/lib/env/runtime";
import { fetchMemberByAuthUser, ensureBootstrapMember } from "@/lib/repositories/memberRepository";
import { fetchProfileByAuthId, upsertProfile } from "@/lib/repositories/profileRepository";
import { fetchOrganization } from "@/lib/repositories/organizationRepository";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import { normalizeAppLoginPassword } from "@/lib/auth/defaultAppPassword";
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

async function hydrateFromSupabaseSession(
  authUserId: string,
  email: string
): Promise<AuthUser | null> {
  const member = await fetchMemberByAuthUser(authUserId);
  if (member) {
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

  const fallback = buildAuthUserFromTestAccount(email);
  if (fallback) {
    await ensureBootstrapMember(
      fallback.orgId,
      fallback.id,
      fallback.email,
      fallback.name,
      authUserId
    );
    return fallback;
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
    const authPassword = normalizeAppLoginPassword(normalizedEmail, password);
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password: authPassword,
    });

    if (!error && data.user) {
      const hydrated = await hydrateFromSupabaseSession(data.user.id, normalizedEmail);
      if (hydrated) {
        setActiveUser(hydrated);
        const testAccount = TEST_ACCOUNTS_CONFIG[normalizedEmail];
        if (testAccount) {
          const parts = testAccount.name.split(" ");
          await upsertProfile(data.user.id, {
            first_name: parts[0],
            last_name: parts.slice(1).join(" ") || null,
          });
          await ensureBootstrapMember(
            testAccount.orgId,
            testAccount.id,
            testAccount.email,
            testAccount.name,
            data.user.id
          );
        }
        return { success: true, user: hydrated, usedSupabaseAuth: true };
      }
    }

    if (error) {
      logPersistenceError("auth.signIn", error);
    }
  }

  if (mustUseSupabasePersistence()) {
    return {
      success: false,
      message:
        "No se pudo iniciar sesión con Supabase Auth. Verifica email, contraseña y que el usuario exista en el proyecto Supabase.",
    };
  }

  const devResult = authenticateUser(email, password);
  if (devResult.success && devResult.user) {
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
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

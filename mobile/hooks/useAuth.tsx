import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/services/supabase";
import {
  clearSelectedMemberId,
  fetchActiveMemberships,
  loadSelectedMemberId,
  resolveActiveMember,
  saveSelectedMemberId,
} from "@/services/session";
import type { MemberContext } from "@/types/models";
import { translateSupabaseMessage, toUserFacingError } from "@/utils/userFacingError";

interface AuthState {
  loading: boolean;
  session: Session | null;
  memberships: MemberContext[];
  member: MemberContext | null;
  needsOrgSelection: boolean;
  configError: string | null;
  gateError: string | null;
  clearGateError: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  selectMember: (memberId: string) => Promise<void>;
  refreshMemberships: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function hydrateMemberships(
  authUserId: string,
  email?: string | null
): Promise<{ memberships: MemberContext[]; member: MemberContext | null; needsOrgSelection: boolean }> {
  const memberships = await fetchActiveMemberships(authUserId, email);
  if (memberships.length === 0) {
    return { memberships: [], member: null, needsOrgSelection: false };
  }
  const selectedId = await loadSelectedMemberId();
  const member = resolveActiveMember(memberships, selectedId);
  if (member && memberships.length === 1) {
    await saveSelectedMemberId(member.memberId);
  }
  return {
    memberships,
    member,
    needsOrgSelection: memberships.length > 1 && !member,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [memberships, setMemberships] = useState<MemberContext[]>([]);
  const [member, setMember] = useState<MemberContext | null>(null);
  const [needsOrgSelection, setNeedsOrgSelection] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<string | null>(null);

  const applySession = useCallback(async (next: Session | null) => {
    if (!next?.user) {
      setSession(null);
      setMemberships([]);
      setMember(null);
      setNeedsOrgSelection(false);
      return;
    }
    try {
      const hydrated = await hydrateMemberships(next.user.id, next.user.email);
      if (hydrated.memberships.length === 0) {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        setSession(null);
        setMemberships([]);
        setMember(null);
        setNeedsOrgSelection(false);
        setGateError(
          "Tu usuario no tiene una membresía activa en ninguna organización."
        );
        return;
      }
      setGateError(null);
      setSession(next);
      setMemberships(hydrated.memberships);
      setMember(hydrated.member);
      setNeedsOrgSelection(hydrated.needsOrgSelection);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al cargar membresía";
      throw new Error(message);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setConfigError(
        "Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en mobile/.env"
      );
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session)
        .catch((e) => {
          setMemberships([]);
          setMember(null);
          setSession(null);
          setGateError(e instanceof Error ? e.message : "Error al cargar membresía");
        })
        .finally(() => setLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession).catch(async (e) => {
        setMemberships([]);
        setMember(null);
        setSession(null);
        setGateError(e instanceof Error ? e.message : "Error al cargar membresía");
        await supabase.auth.signOut();
      });
    });

    return () => sub.subscription.unsubscribe();
  }, [applySession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setGateError(null);
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    if (error) {
      return translateSupabaseMessage(error.message) ?? error.message;
    }
    try {
      const hydrated = await hydrateMemberships(data.user!.id, data.user!.email);
      if (hydrated.memberships.length === 0) {
        await supabase.auth.signOut();
        return "Tu usuario no tiene una membresía activa en ninguna organización.";
      }
      setMemberships(hydrated.memberships);
      setMember(hydrated.member);
      setNeedsOrgSelection(hydrated.needsOrgSelection);
      setSession(data.session);
    } catch (e) {
      await supabase.auth.signOut();
      return toUserFacingError(e, "Error al validar membresía");
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    await clearSelectedMemberId();
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setSession(null);
    setMemberships([]);
    setMember(null);
    setNeedsOrgSelection(false);
    setGateError(null);
  }, []);

  const clearGateError = useCallback(() => setGateError(null), []);

  const selectMember = useCallback(async (memberId: string) => {
    const picked = memberships.find((m) => m.memberId === memberId);
    if (!picked) return;
    await saveSelectedMemberId(memberId);
    setMember(picked);
    setNeedsOrgSelection(false);
  }, [memberships]);

  const refreshMemberships = useCallback(async () => {
    if (!session?.user) return;
    const hydrated = await hydrateMemberships(session.user.id, session.user.email);
    setMemberships(hydrated.memberships);
    setMember(hydrated.member);
    setNeedsOrgSelection(hydrated.needsOrgSelection);
  }, [session]);

  const value = useMemo(
    () => ({
      loading,
      session,
      memberships,
      member,
      needsOrgSelection,
      configError,
      gateError,
      clearGateError,
      signIn,
      signOut,
      selectMember,
      refreshMemberships,
    }),
    [
      loading,
      session,
      memberships,
      member,
      needsOrgSelection,
      configError,
      gateError,
      clearGateError,
      signIn,
      signOut,
      selectMember,
      refreshMemberships,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}

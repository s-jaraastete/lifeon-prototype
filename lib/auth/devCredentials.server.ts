import "server-only";

import type { AuthUser } from "@/lib/auth/authService";

interface TestAccountServer {
  id: string;
  name: string;
  email: string;
  orgId: string;
  orgName: string;
  isDemo: boolean;
}

const TEST_ACCOUNTS: Record<string, TestAccountServer> = {
  "luis.godoy@safetyclub.cl": {
    id: "user_luis",
    name: "Luis Godoy",
    email: "luis.godoy@safetyclub.cl",
    orgId: "org_luis",
    orgName: "SafetyCo Consultores SpA",
    isDemo: false,
  },
  "sergio.jara@safetyclub.cl": {
    id: "user_sergio",
    name: "Sergio Jara",
    email: "sergio.jara@safetyclub.cl",
    orgId: "org_sergio",
    orgName: "Constructora Horizonte SpA",
    isDemo: false,
  },
  "aldo.berrios@safetyclub.cl": {
    id: "user_aldo",
    name: "Aldo Berríos",
    email: "aldo.berrios@safetyclub.cl",
    orgId: "org_aldo",
    orgName: "Berríos Ingeniería y Construcción SpA",
    isDemo: false,
  },
  "gonzalo.cabrera@safetyclub.cl": {
    id: "user_gonzalo_c",
    name: "Gonzalo Cabrera",
    email: "gonzalo.cabrera@safetyclub.cl",
    orgId: "org_gonzalo_c",
    orgName: "Cabrera Seguridad Industrial SpA",
    isDemo: false,
  },
  "gonzalo.beristain@safetyclub.cl": {
    id: "user_gonzalo_b",
    name: "Gonzalo Beristain",
    email: "gonzalo.beristain@safetyclub.cl",
    orgId: "org_gonzalo_b",
    orgName: "Beristain Prevención SpA",
    isDemo: false,
  },
  "sergio.jara@lifeon.cl": {
    id: "demo_sergio",
    name: "Sergio A. Jara Astete",
    email: "sergio.jara@lifeon.cl",
    orgId: "org_demo",
    orgName: "Constructora y Servicios Santiago SpA",
    isDemo: true,
  },
};

const DEV_PASSWORDS: Record<string, string[]> = {
  "luis.godoy@safetyclub.cl": ["luis"],
  "sergio.jara@safetyclub.cl": ["serg", "sergio"],
  "aldo.berrios@safetyclub.cl": ["aldo"],
  "gonzalo.cabrera@safetyclub.cl": ["gonz"],
  "gonzalo.beristain@safetyclub.cl": ["gonz"],
  "sergio.jara@lifeon.cl": ["serg"],
};

export function validateLifeOnCredentials(
  email: string,
  password: string
): { ok: true; user: AuthUser } | { ok: false; message: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedPass = password.trim();
  const account = TEST_ACCOUNTS[normalizedEmail];

  if (account) {
    const validPasses = DEV_PASSWORDS[normalizedEmail] || [];
    if (validPasses.includes(trimmedPass)) {
      return {
        ok: true,
        user: {
          id: account.id,
          name: account.name,
          email: account.email,
          orgId: account.orgId,
          orgName: account.orgName,
          isDemo: account.isDemo,
          avatarUrl: null,
        },
      };
    }
    return { ok: false, message: `Contraseña incorrecta para ${normalizedEmail}.` };
  }

  if (trimmedPass === "serg" || trimmedPass === "sergio") {
    const u = TEST_ACCOUNTS["sergio.jara@safetyclub.cl"];
    return {
      ok: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        orgId: u.orgId,
        orgName: u.orgName,
        isDemo: u.isDemo,
        avatarUrl: null,
      },
    };
  }
  if (trimmedPass === "luis") {
    const u = TEST_ACCOUNTS["luis.godoy@safetyclub.cl"];
    return {
      ok: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        orgId: u.orgId,
        orgName: u.orgName,
        isDemo: u.isDemo,
        avatarUrl: null,
      },
    };
  }
  if (trimmedPass === "aldo") {
    const u = TEST_ACCOUNTS["aldo.berrios@safetyclub.cl"];
    return {
      ok: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        orgId: u.orgId,
        orgName: u.orgName,
        isDemo: u.isDemo,
        avatarUrl: null,
      },
    };
  }
  if (trimmedPass === "gonz") {
    const u = TEST_ACCOUNTS["gonzalo.cabrera@safetyclub.cl"];
    return {
      ok: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        orgId: u.orgId,
        orgName: u.orgName,
        isDemo: u.isDemo,
        avatarUrl: null,
      },
    };
  }

  return { ok: false, message: "Credenciales inválidas." };
}

import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  getLifeOnSessionSecret,
  LIFEON_SESSION_COOKIE,
  LIFEON_SESSION_MAX_AGE_SEC,
} from "@/lib/ai/config";
import { AiServiceError } from "@/lib/ai/errors";

export interface LifeOnSessionPayload {
  userId: string;
  email: string;
  orgId: string;
  exp: number;
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function encodePayload(payload: LifeOnSessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(payloadB64: string): LifeOnSessionPayload | null {
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as LifeOnSessionPayload;
    if (!parsed.userId || !parsed.email || !parsed.orgId || !parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createLifeOnSessionToken(user: {
  id: string;
  email: string;
  orgId: string;
}): string | null {
  const secret = getLifeOnSessionSecret();
  if (!secret) return null;

  const payload: LifeOnSessionPayload = {
    userId: user.id,
    email: user.email,
    orgId: user.orgId,
    exp: Math.floor(Date.now() / 1000) + LIFEON_SESSION_MAX_AGE_SEC,
  };

  const payloadB64 = encodePayload(payload);
  const sig = signPayload(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export function parseLifeOnSessionToken(token: string): LifeOnSessionPayload | null {
  const secret = getLifeOnSessionSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expected = signPayload(payloadB64, secret);

  try {
    const a = Buffer.from(sig, "base64url");
    const b = Buffer.from(expected, "base64url");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const payload = decodePayload(payloadB64);
  if (!payload) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export async function getLifeOnSession(): Promise<LifeOnSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(LIFEON_SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseLifeOnSessionToken(token);
}

export async function requireLifeOnSession(): Promise<LifeOnSessionPayload> {
  const session = await getLifeOnSession();
  if (!session) {
    throw new AiServiceError("UNAUTHORIZED", "Sesión no válida.", 401);
  }
  return session;
}

export function lifeonSessionCookieOptions(token: string) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    name: LIFEON_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: LIFEON_SESSION_MAX_AGE_SEC,
  };
}

export function clearLifeonSessionCookieOptions() {
  return {
    name: LIFEON_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

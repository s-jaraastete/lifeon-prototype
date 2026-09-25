/**
 * Runtime helpers for LifeOn dashboard / Supabase configuration.
 */

import { isSupabaseConfigured } from "@/lib/supabaseClient";

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** True when running a production build (client or server). */
export function isProductionBuild(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Hostname looks like Vercel production/preview (client-only). */
export function isDeployedLifeOnHost(): boolean {
  if (!isBrowser()) return false;
  const host = window.location.hostname;
  return host.endsWith(".vercel.app") || host.includes("lifeon");
}

/**
 * Dashboard must not silently run without Supabase on deployed environments.
 */
export function mustUseSupabasePersistence(): boolean {
  if (isProductionBuild()) return true;
  if (isBrowser() && isDeployedLifeOnHost()) return true;
  return false;
}

/** Local dev with .env Supabase must use Auth JWT — otherwise RLS blocks all reads. */
export function requiresSupabaseAuthSession(): boolean {
  return isSupabaseConfigured();
}

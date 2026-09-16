/**
 * Server-side env resolution without silent localhost fallbacks in production.
 */

function requireInProduction(value: string | undefined, name: string): string | undefined {
  if (process.env.NODE_ENV === "production" && !value) {
    console.error(`[LifeOn env] Missing required variable in production: ${name}`);
    return undefined;
  }
  return value;
}

export function getBackendHost(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BACKEND_HOST ?? process.env.backendHost;
  if (process.env.NODE_ENV === "production") {
    return requireInProduction(fromEnv, "NEXT_PUBLIC_BACKEND_HOST") ?? "";
  }
  return fromEnv ?? "http://localhost:8001";
}

export function getAuthFrontendUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_AUTH_FRONTEND_URL;
  if (process.env.NODE_ENV === "production") {
    return requireInProduction(fromEnv, "NEXT_PUBLIC_AUTH_FRONTEND_URL") ?? "";
  }
  return fromEnv ?? "http://localhost:3002";
}

export function getPurchaseFrontendUrl(): string {
  const fromEnv = process.env.PURCHASE_FRONTEND_URL;
  if (process.env.NODE_ENV === "production") {
    return requireInProduction(fromEnv, "PURCHASE_FRONTEND_URL") ?? "";
  }
  return fromEnv ?? "http://localhost:3000";
}

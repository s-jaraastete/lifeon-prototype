/** Mantener alineado con lib/auth/defaultAppPassword.ts (web). */

export function emailPasswordPrefix(email: string): string {
  return email.trim().toLowerCase().slice(0, 4).padEnd(4, "0");
}

export function defaultAppPasswordFromEmail(email: string): string {
  return emailPasswordPrefix(email).padEnd(6, "0");
}

export function normalizeAppLoginPassword(email: string, password: string): string {
  const trimmed = password.trim();
  const prefix = emailPasswordPrefix(email);
  if (trimmed.toLowerCase() === prefix) {
    return defaultAppPasswordFromEmail(email);
  }
  return trimmed;
}

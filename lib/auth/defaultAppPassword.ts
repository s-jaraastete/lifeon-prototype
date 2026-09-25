/** Primeros 4 caracteres del correo (minúsculas), rellenados si el email es más corto. */
export function emailPasswordPrefix(email: string): string {
  return email.trim().toLowerCase().slice(0, 4).padEnd(4, "0");
}

/**
 * Contraseña por defecto en Supabase Auth: prefijo de 4 caracteres + "00" (mínimo 6).
 * Ej.: sergio.jara@safetyclub.cl → "serg00"
 */
export function defaultAppPasswordFromEmail(email: string): string {
  return emailPasswordPrefix(email).padEnd(6, "0");
}

/**
 * Si el usuario ingresa solo los 4 caracteres del correo, usa la contraseña Auth completa.
 */
export function normalizeAppLoginPassword(email: string, password: string): string {
  const trimmed = password.trim();
  const prefix = emailPasswordPrefix(email);
  if (trimmed.toLowerCase() === prefix) {
    return defaultAppPasswordFromEmail(email);
  }
  return trimmed;
}

/** Orden: contraseña canónica Auth, luego la ingresada (cuentas legacy con clave corta). */
export function loginPasswordCandidates(email: string, password: string): string[] {
  const trimmed = password.trim();
  const normalized = normalizeAppLoginPassword(email, password);
  const candidates: string[] = [];
  for (const p of [normalized, trimmed]) {
    if (p && !candidates.includes(p)) candidates.push(p);
  }
  return candidates;
}

import { ACTIVE_SESSION_STORAGE_KEY } from "@/lib/auth/authService";

/** Supabase Auth persists session under keys like `sb-<project>-auth-token`. */
export function isSupabaseAuthStorageKey(key: string | null): boolean {
  if (!key) return false;
  return key.includes("-auth-token");
}

export function isStorageEvent(event: Event): event is StorageEvent {
  return event instanceof StorageEvent;
}

/**
 * Returns true when a cross-tab storage event targets the given key.
 * Ignores Supabase auth token updates and unrelated keys.
 */
export function storageEventMatchesKey(
  event: Event,
  storageKey: string
): StorageEvent | null {
  if (!isStorageEvent(event)) return null;
  if (event.key !== storageKey) return null;
  return event;
}

/**
 * Returns true when another tab changed the active LifeOn session.
 */
export function storageEventIsActiveSessionChange(event: Event): StorageEvent | null {
  if (!isStorageEvent(event)) return null;
  if (event.key !== ACTIVE_SESSION_STORAGE_KEY) return null;
  return event;
}

/**
 * Writes to localStorage only when the serialized value differs from the current entry.
 * Reduces cross-tab `storage` noise during hydration.
 */
export function setLocalStorageIfChanged(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = window.localStorage.getItem(key);
    if (current === value) return false;
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function setLocalStorageJsonIfChanged(key: string, data: unknown): boolean {
  return setLocalStorageIfChanged(key, JSON.stringify(data));
}

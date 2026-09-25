const inflight = new Map<string, Promise<unknown>>();

/**
 * Shares one in-flight Supabase read across callers that ask for the same key
 * at the same time (several hooks on the dashboard, two tabs do not share this).
 */
export function coalesceRequest<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const pending = run().finally(() => {
    if (inflight.get(key) === pending) inflight.delete(key);
  });
  inflight.set(key, pending);
  return pending;
}

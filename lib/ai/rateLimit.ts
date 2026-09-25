import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { AI_LIMITS } from "@/lib/ai/config";
import { AiServiceError } from "@/lib/ai/errors";

function floorToMinute(d: Date): Date {
  const x = new Date(d);
  x.setSeconds(0, 0);
  return x;
}

function floorToDay(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

async function incrementWindow(
  orgId: string,
  userId: string,
  windowType: "minute" | "day",
  windowStart: Date,
  limit: number
): Promise<boolean> {
  const client = getSupabaseAdminClient();
  const failClosed = process.env.NODE_ENV === "production";
  if (!client) return !failClosed;

  const startIso = windowStart.toISOString();

  try {
    const { data: existing } = await client
      .from("apr_ai_usage")
      .select("request_count")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .eq("window_type", windowType)
      .eq("window_start", startIso)
      .maybeSingle();

    const next = (existing?.request_count ?? 0) + 1;
    if (next > limit) return false;

    await client.from("apr_ai_usage").upsert({
      org_id: orgId,
      user_id: userId,
      window_type: windowType,
      window_start: startIso,
      request_count: next,
      updated_at: new Date().toISOString(),
    });

    return true;
  } catch {
    return !failClosed;
  }
}

export async function assertAiRateLimit(orgId: string, userId: string): Promise<void> {
  const now = new Date();
  const minuteOk = await incrementWindow(
    orgId,
    userId,
    "minute",
    floorToMinute(now),
    AI_LIMITS.requestsPerMinute
  );
  if (!minuteOk) {
    throw new AiServiceError(
      "AI_BUSY",
      "APR Virtual está temporalmente ocupado. Intenta nuevamente en unos momentos.",
      429
    );
  }

  const dayOk = await incrementWindow(
    orgId,
    "__org__",
    "day",
    floorToDay(now),
    AI_LIMITS.requestsPerDayOrg
  );
  if (!dayOk) {
    throw new AiServiceError(
      "AI_DAILY_LIMIT",
      "Se alcanzó el límite diario de consultas de APR Virtual.",
      429
    );
  }
}

import "server-only";

import { createHash } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { AI_LIMITS } from "@/lib/ai/config";
import type { IperAiContextInput, IperSuggestionKind } from "@/types/ai";
import type { AiSuggestionsResponse } from "@/types/ai";
import { sanitizeIperContext } from "@/lib/ai/sanitizeAIContext";

function canonicalize(obj: unknown): string {
  return JSON.stringify(obj);
}

export function buildSuggestionCacheKey(
  orgId: string,
  kind: IperSuggestionKind,
  ctx: IperAiContextInput
): string {
  const sanitized = sanitizeIperContext(ctx);
  const raw = `${kind}:${orgId}:${canonicalize(sanitized)}`;
  return createHash("sha256").update(raw).digest("hex");
}

export async function getCachedSuggestions(
  cacheKey: string
): Promise<AiSuggestionsResponse | null> {
  const client = getSupabaseAdminClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("apr_ai_suggestion_cache")
      .select("payload, expires_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (error || !data) return null;
    if (new Date(data.expires_at) < new Date()) return null;
    return data.payload as AiSuggestionsResponse;
  } catch {
    return null;
  }
}

export async function setCachedSuggestions(
  cacheKey: string,
  orgId: string,
  payload: AiSuggestionsResponse
): Promise<void> {
  const client = getSupabaseAdminClient();
  if (!client) return;

  const expires = new Date();
  expires.setHours(expires.getHours() + AI_LIMITS.suggestionCacheTtlHours);

  try {
    await client.from("apr_ai_suggestion_cache").upsert({
      cache_key: cacheKey,
      org_id: orgId,
      organization_id: orgId,
      payload,
      expires_at: expires.toISOString(),
    });
  } catch {
    /* fail open */
  }
}

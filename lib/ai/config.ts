import "server-only";

export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

export const AI_LIMITS = {
  maxHistoryMessages: 10,
  maxMessageChars: 2000,
  maxHistoryContentChars: 800,
  maxChatOutputTokens: 700,
  maxSuggestionOutputTokens: 500,
  maxTechnicalDocOutputTokens: 8000,
  suggestionTemperature: 0.3,
  chatTemperature: 0.5,
  requestsPerMinute: 8,
  requestsPerDayOrg: 60,
  suggestionCacheTtlHours: 6,
} as const;

export const LIFEON_SESSION_COOKIE = "lifeon_session";
export const LIFEON_SESSION_MAX_AGE_SEC = 12 * 60 * 60;

export function getGroqApiKey(): string | null {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;
  return key;
}

export function getLifeOnSessionSecret(): string | null {
  const secret = process.env.LIFEON_SESSION_SECRET?.trim();
  if (!secret) return null;
  return secret;
}

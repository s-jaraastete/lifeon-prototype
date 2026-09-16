import "server-only";

import { createGroqProvider } from "@/lib/ai/provider/groqProvider";
import type { AIProvider } from "@/lib/ai/provider/types";
import { AiServiceError } from "@/lib/ai/errors";

let cached: AIProvider | null | undefined;

export function getAIProvider(): AIProvider {
  if (cached !== undefined && cached !== null) {
    return cached;
  }

  const provider = createGroqProvider();
  if (!provider) {
    throw new AiServiceError(
      "AI_UNAVAILABLE",
      "APR Virtual no está configurado en el servidor.",
      503
    );
  }
  cached = provider;
  return provider;
}

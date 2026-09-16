import type {
  AiChatHistoryItem,
  AiClientErrorBody,
  AiSuggestionsResponse,
  AiUiContext,
  AprChatMode,
  IperAiContextInput,
  IperSuggestionKind,
  TechnicalDocGenerateRequest,
  TechnicalDocGenerateResponse,
} from "@/types/ai";
import { AI_USER_MESSAGES } from "@/lib/ai/errors";
import type { AiErrorCode } from "@/lib/ai/errors";

export function getAiUserMessage(code?: string, fallback?: string): string {
  if (code && code in AI_USER_MESSAGES) {
    return AI_USER_MESSAGES[code as AiErrorCode];
  }
  return fallback || AI_USER_MESSAGES.AI_UNAVAILABLE;
}

export async function postAprVirtualSuggestions(
  kind: IperSuggestionKind,
  iperContext: IperAiContextInput
): Promise<AiSuggestionsResponse> {
  const axios = (await import("axios")).default;
  try {
    const res = await axios.post<AiSuggestionsResponse>(
      "/api/ai/suggestions",
      { kind, iperContext },
      { withCredentials: true }
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as AiClientErrorBody;
      throw new Error(getAiUserMessage(body.code, body.message));
    }
    throw new Error(getAiUserMessage(undefined));
  }
}

export async function postGenerateTechnicalDocument(
  payload: TechnicalDocGenerateRequest
): Promise<TechnicalDocGenerateResponse> {
  const axios = (await import("axios")).default;
  try {
    const res = await axios.post<TechnicalDocGenerateResponse>(
      "/api/ai/technical-doc",
      payload,
      { withCredentials: true }
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data) {
      const body = err.response.data as AiClientErrorBody;
      throw new Error(getAiUserMessage(body.code, body.message));
    }
    throw new Error(getAiUserMessage(undefined));
  }
}

export async function streamAprVirtualChatRequest(params: {
  mode: AprChatMode;
  message: string;
  history: AiChatHistoryItem[];
  uiContext: AiUiContext;
  onToken: (chunk: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}): Promise<void> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        mode: params.mode,
        message: params.message,
        history: params.history,
        uiContext: params.uiContext,
      }),
    });

    if (!res.ok) {
      let code: string | undefined;
      try {
        const body = (await res.json()) as AiClientErrorBody;
        code = body.code;
      } catch {
        /* ignore */
      }
      params.onError(getAiUserMessage(code));
      return;
    }

    if (!res.body) {
      params.onError(getAiUserMessage(undefined));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") {
          params.onDone();
          return;
        }
        try {
          const parsed = JSON.parse(payload) as { token?: string; error?: string; code?: string };
          if (parsed.error) {
            params.onError(getAiUserMessage(parsed.code, parsed.error));
            return;
          }
          if (parsed.token) params.onToken(parsed.token);
        } catch {
          /* ignore malformed chunk */
        }
      }
    }
    params.onDone();
  } catch {
    params.onError(getAiUserMessage(undefined));
  }
}

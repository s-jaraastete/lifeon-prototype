"use client";

import { useCallback, useState } from "react";
import type { AiChatHistoryItem, AiUiContext, AprChatMode } from "@/types/ai";
import { streamAprVirtualChatRequest } from "@/lib/ai/aprVirtualClient";

export interface ChatUiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function useAprVirtualChat(mode: AprChatMode, uiContext: AiUiContext) {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isGenerating) return;

      const userMsg: ChatUiMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: nowLabel(),
      };

      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", timestamp: nowLabel() },
      ]);
      setIsGenerating(true);
      setError(null);

      const history: AiChatHistoryItem[] = messages
        .filter((m) => m.content)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      await streamAprVirtualChatRequest({
        mode,
        message: trimmed,
        history,
        uiContext,
        onToken: (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + token } : m
            )
          );
        },
        onDone: () => setIsGenerating(false),
        onError: (message) => {
          setError(message);
          setIsGenerating(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: m.content || message,
                  }
                : m
            )
          );
        },
      });
    },
    [isGenerating, messages, mode, uiContext]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isGenerating, error, sendMessage, resetChat, setMessages };
}

export default useAprVirtualChat;

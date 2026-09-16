import "server-only";

import Groq from "groq-sdk";
import { getGroqApiKey, GROQ_MODEL } from "@/lib/ai/config";
import {
  AIProvider,
  ChatMessage,
  GenerateStructuredOptions,
  GenerateTextOptions,
  StreamChatOptions,
} from "@/lib/ai/provider/types";
import { AiServiceError, mapGroqErrorToAiError } from "@/lib/ai/errors";

function toGroqMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));
}

export class GroqProvider implements AIProvider {
  private client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async generateText(options: GenerateTextOptions): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: GROQ_MODEL,
        messages: toGroqMessages(options.messages),
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      });
      return completion.choices[0]?.message?.content?.trim() || "";
    } catch (err) {
      throw mapGroqErrorToAiError(err);
    }
  }

  async *streamChat(options: StreamChatOptions): AsyncIterable<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model: GROQ_MODEL,
        messages: toGroqMessages(options.messages),
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    } catch (err) {
      throw mapGroqErrorToAiError(err);
    }
  }

  async generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T> {
    try {
      const completion = await this.client.chat.completions.create({
        model: GROQ_MODEL,
        messages: toGroqMessages(options.messages),
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: options.schemaName,
            strict: true,
            schema: options.jsonSchema,
          },
        },
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        throw new AiServiceError("AI_UNAVAILABLE", "Respuesta vacía del modelo.", 503);
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      if (err instanceof AiServiceError) throw err;
      try {
        const fallback = await this.client.chat.completions.create({
          model: GROQ_MODEL,
          messages: toGroqMessages(options.messages),
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          response_format: { type: "json_object" },
        });
        const raw = fallback.choices[0]?.message?.content;
        if (!raw) {
          throw new AiServiceError("AI_UNAVAILABLE", "Respuesta vacía del modelo.", 503);
        }
        return JSON.parse(raw) as T;
      } catch (inner) {
        if (inner instanceof AiServiceError) throw inner;
        throw mapGroqErrorToAiError(inner);
      }
    }
  }
}

export function createGroqProvider(): GroqProvider | null {
  const apiKey = getGroqApiKey();
  if (!apiKey) return null;
  return new GroqProvider(apiKey);
}

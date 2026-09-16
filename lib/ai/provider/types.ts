import "server-only";

export type ChatMessageRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface GenerateTextOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface StreamChatOptions extends GenerateTextOptions {}

export interface GenerateStructuredOptions<T> {
  messages: ChatMessage[];
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AIProvider {
  generateText(options: GenerateTextOptions): Promise<string>;
  streamChat(options: StreamChatOptions): AsyncIterable<string>;
  generateStructured<T>(options: GenerateStructuredOptions<T>): Promise<T>;
}

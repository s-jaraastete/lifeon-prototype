import { requireLifeOnSession } from "@/lib/auth/lifeonSession";
import { streamAprVirtualChat } from "@/lib/ai/aprVirtualService";
import { AiServiceError, AI_USER_MESSAGES } from "@/lib/ai/errors";
import type { AiChatHistoryItem, AiUiContext, AprChatMode } from "@/types/ai";

export const runtime = "nodejs";

function sseLine(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${data}\n\n`);
}

export async function POST(request: Request) {
  try {
    const session = await requireLifeOnSession();
    const body = (await request.json()) as {
      mode?: AprChatMode;
      message?: string;
      history?: AiChatHistoryItem[];
      uiContext?: AiUiContext;
      organizationId?: string;
    };

    void body.organizationId;

    const mode = body.mode === "module_assistant" ? "module_assistant" : "apr_chat";
    const message = body.message || "";
    const history = Array.isArray(body.history) ? body.history : [];
    const uiContext: AiUiContext = body.uiContext?.module
      ? body.uiContext
      : { module: "apr" };

    const stream = await streamAprVirtualChat({
      session,
      mode,
      message,
      history,
      uiContext,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of stream) {
            controller.enqueue(sseLine(JSON.stringify({ token })));
          }
          controller.enqueue(sseLine("[DONE]"));
          controller.close();
        } catch (err) {
          const code = err instanceof AiServiceError ? err.code : "AI_UNAVAILABLE";
          const msg = AI_USER_MESSAGES[code] || AI_USER_MESSAGES.AI_UNAVAILABLE;
          controller.enqueue(sseLine(JSON.stringify({ error: msg, code })));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof AiServiceError) {
      return Response.json(
        { code: err.code, message: AI_USER_MESSAGES[err.code] || err.message },
        { status: err.status }
      );
    }
    return Response.json(
      { code: "AI_UNAVAILABLE", message: AI_USER_MESSAGES.AI_UNAVAILABLE },
      { status: 503 }
    );
  }
}

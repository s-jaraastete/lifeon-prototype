import { requireLifeOnSession } from "@/lib/auth/lifeonSession";
import { generateIperSuggestions } from "@/lib/ai/aprVirtualService";
import { AiServiceError, AI_USER_MESSAGES } from "@/lib/ai/errors";
import type { IperAiContextInput, IperSuggestionKind } from "@/types/ai";

export const runtime = "nodejs";

const KINDS: IperSuggestionKind[] = ["task", "hazard", "risk", "control"];

export async function POST(request: Request) {
  try {
    const session = await requireLifeOnSession();
    const body = (await request.json()) as {
      kind?: IperSuggestionKind;
      iperContext?: IperAiContextInput;
      organizationId?: string;
    };

    void body.organizationId;

    const kind = body.kind;
    if (!kind || !KINDS.includes(kind)) {
      return Response.json(
        { code: "INVALID_REQUEST", message: AI_USER_MESSAGES.INVALID_REQUEST },
        { status: 400 }
      );
    }

    const result = await generateIperSuggestions({
      session,
      kind,
      iperContext: body.iperContext || {},
    });

    return Response.json(result);
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

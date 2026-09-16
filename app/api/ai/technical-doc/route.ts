import { requireLifeOnSession } from "@/lib/auth/lifeonSession";
import { generateTechnicalDocumentContent } from "@/lib/ai/aprVirtualService";
import { AiServiceError, AI_USER_MESSAGES } from "@/lib/ai/errors";
import type { TechnicalDocGenerateRequest } from "@/types/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await requireLifeOnSession();
    const body = (await request.json()) as TechnicalDocGenerateRequest & {
      organizationId?: string;
    };

    void body.organizationId;

    if (!body.documentType?.trim() || !body.documentName?.trim()) {
      return Response.json(
        { code: "INVALID_REQUEST", message: AI_USER_MESSAGES.INVALID_REQUEST },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.sections) || body.sections.length === 0) {
      return Response.json(
        { code: "INVALID_REQUEST", message: "El documento no tiene secciones definidas." },
        { status: 400 }
      );
    }

    const result = await generateTechnicalDocumentContent({
      session,
      documentType: body.documentType.trim(),
      documentName: body.documentName.trim(),
      sections: body.sections.map((s) => ({
        key: s.key,
        label: s.label,
        required: s.required,
        placeholder: s.placeholder,
      })),
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

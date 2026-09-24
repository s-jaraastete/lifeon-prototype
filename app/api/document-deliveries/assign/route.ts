import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireOrgEditor } from "@/lib/server/orgSessionGuard";
import { assignDocumentDeliveryAdmin } from "@/lib/server/documentDeliveryAssign";

export async function POST(request: Request) {
  let body: {
    organizationId?: string;
    sourceType?: "irl" | "technical_document";
    sourceId?: string;
    assigneeMemberId?: string;
    cargoName?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim() ?? "";
  const sourceType = body.sourceType;
  const sourceId = body.sourceId?.trim() ?? "";
  const assigneeMemberId = body.assigneeMemberId?.trim() ?? "";

  if (!organizationId || !sourceType || !sourceId || !assigneeMemberId) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }

  const auth = await requireOrgEditor(request, organizationId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servicio de administración no disponible" },
      { status: 503 }
    );
  }

  const result = await assignDocumentDeliveryAdmin(admin, {
    organizationId,
    sourceType,
    sourceId,
    assigneeMemberId,
    cargoName: body.cargoName ?? null,
    assignedByAuthUserId: auth.ctx.user.id,
  });

  if (!result.id) {
    return NextResponse.json({ error: result.error ?? "No se pudo asignar" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: result.id });
}

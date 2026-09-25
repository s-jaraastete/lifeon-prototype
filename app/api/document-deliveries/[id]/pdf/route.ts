import { NextResponse } from "next/server";
import { resolveOrganizationDisplayName } from "@/lib/organization/displayName";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { fetchOrganizationDisplayName } from "@/lib/server/organizationDisplayName";
import { requireDeliveryPdfAccess } from "@/lib/server/requireDeliveryAssigneeAccess";
import { generateIrlDeliveryPdf } from "@/lib/server/generateIrlDeliveryPdf";
import { fetchAckSignaturePngBytes } from "@/lib/server/fetchAckSignaturePng";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const auth = await requireDeliveryPdfAccess(request, id);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: delivery, error } = await auth.ctx.userClient
    .from("document_deliveries")
    .select(
      "id, organization_id, source_type, content_snapshot, document_code, signed_at, signature_path, title"
    )
    .eq("id", auth.ctx.deliveryId)
    .maybeSingle();

  if (error || !delivery) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  if (delivery.source_type !== "irl") {
    return NextResponse.json({ error: "Solo disponible para IRL" }, { status: 400 });
  }

  let signaturePngBytes: Uint8Array | null = null;
  if (delivery.signature_path) {
    signaturePngBytes = await fetchAckSignaturePngBytes(
      auth.ctx.userClient,
      delivery.signature_path
    );
  }

  let snapshot =
    typeof delivery.content_snapshot === "object" && delivery.content_snapshot
      ? (delivery.content_snapshot as Record<string, unknown>)
      : {};

  const admin = getSupabaseAdminClient();
  const orgId =
    typeof delivery.organization_id === "string" ? delivery.organization_id.trim() : "";
  if (admin && orgId) {
    const canonicalName = await fetchOrganizationDisplayName(admin, orgId);
    snapshot = {
      ...snapshot,
      organizationName: resolveOrganizationDisplayName(
        canonicalName,
        typeof snapshot.organizationName === "string" ? snapshot.organizationName : undefined
      ),
    };
  }

  try {
    const pdfBytes = await generateIrlDeliveryPdf({
      snapshot,
      documentCode: delivery.document_code,
      signedAt: delivery.signed_at,
      signaturePngBytes,
    });

    const filename = `${delivery.document_code || "IRL"}.pdf`.replace(/[^\w.-]+/g, "_");

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (e) {
    console.error("[document-deliveries/pdf]", e);
    const message = e instanceof Error ? e.message : "Error al generar PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

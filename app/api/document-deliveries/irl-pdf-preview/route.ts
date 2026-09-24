import { NextResponse } from "next/server";
import { requireOrgEditor } from "@/lib/server/orgSessionGuard";
import { generateIrlDeliveryPdf } from "@/lib/server/generateIrlDeliveryPdf";

export async function POST(request: Request) {
  let body: {
    organizationId?: string;
    snapshot?: Record<string, unknown>;
    documentCode?: string | null;
    signedAt?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim() ?? "";
  const snapshot = body.snapshot;

  if (!organizationId || !snapshot || snapshot.kind !== "irl") {
    return NextResponse.json({ error: "Snapshot IRL requerido" }, { status: 400 });
  }

  const auth = await requireOrgEditor(request, organizationId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const pdfBytes = await generateIrlDeliveryPdf({
      snapshot,
      documentCode: body.documentCode ?? null,
      signedAt: body.signedAt ?? null,
      signaturePngBytes: null,
    });

    const code =
      typeof snapshot.documentCode === "string" ? snapshot.documentCode : "IRL";
    const filename = `${code}.pdf`.replace(/[^\w.-]+/g, "_");

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (e) {
    console.error("[irl-pdf-preview]", e);
    const message = e instanceof Error ? e.message : "Error al generar PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

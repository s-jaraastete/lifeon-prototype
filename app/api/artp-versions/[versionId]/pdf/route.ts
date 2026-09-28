import { NextResponse } from "next/server";
import { createArtpPrintToken } from "@/lib/server/artpPrintToken";
import { printPageToPdf } from "@/lib/server/printPageToPdf";
import { requireArtpVersionPdfAccess } from "@/lib/server/requireArtpVersionPdfAccess";

export async function GET(
  request: Request,
  context: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await context.params;
  const auth = await requireArtpVersionPdfAccess(request, versionId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.ctx.userClient.rpc("get_artp_version_detail", {
    p_version_id: versionId,
  });
  if (error || !data || typeof data !== "object") {
    return NextResponse.json({ error: "Documento no disponible" }, { status: 404 });
  }
  const status = (data as { version?: { status?: string } }).version?.status;
  if (status !== "vigente") {
    return NextResponse.json(
      { error: "El PDF firmado está disponible cuando el ARTP pasa a vigente." },
      { status: 409 }
    );
  }

  try {
    const token = createArtpPrintToken(versionId);
    const origin = new URL(request.url).origin;
    const pdf = await printPageToPdf(
      `${origin}/print/artp/${encodeURIComponent(versionId)}?t=${encodeURIComponent(token)}`
    );
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="ARTP.pdf"',
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (e) {
    console.error("[artp-pdf]", e);
    const message = e instanceof Error ? e.message : "Error al generar PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

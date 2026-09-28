import { NextResponse } from "next/server";
import { loadArtpFormalDetailForPrint } from "@/lib/server/loadArtpFormalDetail";
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

  const loaded = await loadArtpFormalDetailForPrint(versionId);
  if (!loaded?.detail.planning) {
    return NextResponse.json({ supervisorDataUrl: null, workers: [] });
  }

  return NextResponse.json({
    supervisorDataUrl: loaded.detail.planning.workContext.supervisorSignatureDataUrl ?? null,
    workers: loaded.detail.planning.workers.map((worker) => ({
      id: worker.id,
      dataUrl: worker.signatureDataUrl ?? null,
    })),
  });
}

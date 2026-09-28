import { getSupabaseClient } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import type { IperEvaluationRow } from "@/app/dashboard/components/IperMatrixDetailView";
import { buildIperRowsFromArtpDetail } from "@/lib/artp/iperLink";
import type { ArtpVersionDetail } from "@/types/artp";
import { scopedArtpId } from "@/types/artp";

export async function proposeArtpToIper(params: {
  orgId: string;
  orgTaskId: string;
  artpDocumentId: string;
  matrixId: string;
  matrixStatus: string;
  taskLabel: string;
  detail: ArtpVersionDetail;
  cargoNames: string[];
}): Promise<"applied" | "pending" | "error"> {
  const client = getSupabaseClient();
  if (!client) return "error";

  const rows = buildIperRowsFromArtpDetail(params.detail, params.cargoNames);
  const linkId = scopedArtpId(params.orgId, `link_${Date.now()}`);

  if (params.matrixStatus === "Borrador") {
    const { data: matrix, error: fetchErr } = await client
      .from("iper_matrices")
      .select("hazards")
      .eq("id", params.matrixId)
      .single();
    if (fetchErr || !matrix) {
      logPersistenceError("artp.iper.apply", fetchErr);
      return "error";
    }
    const hazards = Array.isArray(matrix.hazards) ? matrix.hazards : [];
    const { error: updErr } = await client
      .from("iper_matrices")
      .update({ hazards: [...hazards, ...rows] })
      .eq("id", params.matrixId);
    if (updErr) {
      logPersistenceError("artp.iper.update", updErr);
      return "error";
    }
    await client.from("artp_iper_links").upsert({
      id: linkId,
      organization_id: params.orgId,
      org_task_id: params.orgTaskId,
      artp_document_id: params.artpDocumentId,
      iper_matrix_id: params.matrixId,
      task_label: params.taskLabel,
      status: "vinculada",
      proposed_rows: rows,
    });
    return "applied";
  }

  await client.from("artp_iper_links").upsert({
    id: linkId,
    organization_id: params.orgId,
    org_task_id: params.orgTaskId,
    artp_document_id: params.artpDocumentId,
    iper_matrix_id: params.matrixId,
    task_label: params.taskLabel,
    status: "propuesta_pendiente",
    proposed_rows: rows,
  });
  return "pending";
}

export async function cloneIperMatrixDraftFromVigente(params: {
  orgId: string;
  sourceMatrixId: string;
  sourceTitle: string;
  sourceHazards: IperEvaluationRow[];
  extraRows: IperEvaluationRow[];
}): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const newId = scopedArtpId(params.orgId, `m_${Date.now()}`);
  const { error } = await client.from("iper_matrices").insert({
    id: newId,
    organization_id: params.orgId,
    title: `${params.sourceTitle} (actualización ARTP)`,
    status: "Borrador",
    hazards: [...params.sourceHazards, ...params.extraRows],
    source_matrix_id: params.sourceMatrixId,
  });
  if (error) {
    logPersistenceError("artp.iper.clone", error);
    return null;
  }
  return newId;
}

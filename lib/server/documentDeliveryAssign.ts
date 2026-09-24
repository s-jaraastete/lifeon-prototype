import "server-only";

import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildIrlDocumentCode } from "@/lib/irl/irlDocumentCopy";
import { resolveOrganizationLogoUrl } from "@/lib/media/publicStorageUrl";
import { fetchVigenteIperMatrixForOrg } from "@/lib/server/resolveVigenteIperMatrix";
import { iperMatrixIdCandidates } from "@/lib/utils/iperMatrixPersistence";

export type AssignDocumentParams = {
  organizationId: string;
  sourceType: "irl" | "technical_document";
  sourceId: string;
  assigneeMemberId: string;
  cargoName?: string | null;
  assignedByAuthUserId: string;
};

function evaluationMatchesCargo(evCargo: string | undefined, targetCargo: string): boolean {
  if (!evCargo || !targetCargo.trim()) return false;
  const target = targetCargo.trim().toLowerCase();
  return evCargo
    .split(/[,/;•]/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .some((token) => token === target);
}

function filterHazardsForCargo(hazards: unknown, targetCargo: string): unknown[] {
  if (!Array.isArray(hazards)) return [];
  return hazards.filter((ev) =>
    evaluationMatchesCargo(
      typeof ev === "object" && ev && "cargo" in ev
        ? String((ev as { cargo?: string }).cargo ?? "")
        : "",
      targetCargo
    )
  );
}

function hashJsonContent(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function relatedName(
  rel: { name: string } | { name: string }[] | null | undefined
): string | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0]?.name ?? null;
  return rel.name ?? null;
}

export async function assignDocumentDeliveryAdmin(
  admin: SupabaseClient,
  params: AssignDocumentParams
): Promise<{ id: string | null; error?: string }> {
  const {
    organizationId,
    sourceType,
    sourceId,
    assigneeMemberId,
    cargoName,
    assignedByAuthUserId,
  } = params;

  const { data: assignee, error: memberErr } = await admin
    .from("organization_members")
    .select(
      `
      *,
      positions ( name ),
      work_centers ( name )
    `
    )
    .eq("id", assigneeMemberId)
    .eq("organization_id", organizationId)
    .eq("status", "Activo")
    .maybeSingle();

  if (memberErr || !assignee) {
    return { id: null, error: "Trabajador no encontrado o inactivo" };
  }

  if (!assignee.auth_user_id) {
    return { id: null, error: "El trabajador no tiene cuenta de acceso vinculada" };
  }

  const positionName = relatedName(
    assignee.positions as { name: string } | { name: string }[] | null
  );
  const resolvedCargoName = (cargoName?.trim() || positionName || "").trim();
  const wcName = relatedName(
    assignee.work_centers as { name: string } | { name: string }[] | null
  );

  let snapshot: Record<string, unknown>;
  let title: string;
  let documentCode: string;
  let sourceUpdatedAt: string | null = null;
  const cargoId = assignee.cargo_id as string | null;
  const workCenterId = assignee.work_center_id as string | null;
  let workCenterName = wcName;
  let canonicalSourceId = sourceId;

  if (sourceType === "irl") {
    if (!resolvedCargoName) {
      return { id: null, error: "Cargo requerido para envío de IRL" };
    }

    const resolved = await fetchVigenteIperMatrixForOrg(admin, organizationId, sourceId);
    if (resolved.error || !resolved.matrix) {
      return { id: null, error: resolved.error ?? "Matriz IPER no vigente o no encontrada" };
    }
    const matrix = resolved.matrix;

    const filtered = filterHazardsForCargo(matrix.hazards, resolvedCargoName);
    if (filtered.length === 0) {
      return { id: null, error: "No hay evaluaciones para el cargo indicado" };
    }

    const matrixWorkCenterId =
      typeof matrix.work_center_id === "string" ? matrix.work_center_id : null;
    const matrixWorkCenterLabel =
      typeof matrix.work_center === "string" ? matrix.work_center : null;

    if (!workCenterName && matrixWorkCenterId) {
      const { data: wc } = await admin
        .from("work_centers")
        .select("name")
        .eq("id", matrixWorkCenterId)
        .maybeSingle();
      workCenterName = wc?.name ?? matrixWorkCenterLabel;
    } else if (!workCenterName) {
      workCenterName = matrixWorkCenterLabel;
    }

    const { data: orgRow } = await admin
      .from("organizations")
      .select("name, logo_url, logo_path")
      .eq("id", organizationId)
      .maybeSingle();

    const organizationName = orgRow?.name?.trim() || "Empresa";
    const organizationLogoUrl = resolveOrganizationLogoUrl(
      admin,
      organizationId,
      orgRow?.logo_url,
      orgRow?.logo_path
    );

    const assigneeFullName = [assignee.first_name, assignee.last_name]
      .filter((p) => typeof p === "string" && p.trim())
      .join(" ")
      .trim();

    documentCode = buildIrlDocumentCode(String(matrix.code), resolvedCargoName);

    snapshot = {
      kind: "irl",
      matrixId: matrix.id,
      matrixCode: matrix.code,
      matrixTitle: matrix.title,
      workCenterName,
      cargoName: resolvedCargoName,
      responsible: matrix.responsible,
      organizationName,
      organizationLogoUrl,
      documentCode,
      issuedAt: new Date().toISOString(),
      assigneeFullName: assigneeFullName || null,
      assigneeIdentificationNumber: assignee.identification_number ?? null,
      evaluations: filtered,
    };
    title = `IRL — ${resolvedCargoName}`;
    sourceUpdatedAt =
      typeof matrix.updated_at === "string" ? matrix.updated_at : null;
    canonicalSourceId = String(matrix.id);
  } else {
    const { data: doc, error: docErr } = await admin
      .from("technical_documents")
      .select("*")
      .eq("id", sourceId)
      .eq("organization_id", organizationId)
      .eq("status", "Vigente")
      .maybeSingle();

    if (docErr || !doc) {
      return { id: null, error: "Documento técnico no vigente o no encontrado" };
    }

    snapshot = {
      kind: "technical_document",
      documentId: doc.id,
      documentType: doc.document_type,
      name: doc.name,
      content: doc.content,
    };
    title = doc.name;
    documentCode = `${doc.document_type}-${doc.id}`;
    sourceUpdatedAt = doc.updated_at ?? null;
  }

  const contentHash = hashJsonContent(snapshot);

  const sourceIdCandidates =
    sourceType === "irl"
      ? iperMatrixIdCandidates(sourceId, organizationId)
      : [sourceId];

  const { data: existing } = await admin
    .from("document_deliveries")
    .select("id")
    .eq("source_type", sourceType)
    .in("source_id", sourceIdCandidates)
    .eq("assignee_member_id", assigneeMemberId)
    .in("status", ["pendiente_revision", "pendiente_firma"])
    .maybeSingle();

  if (existing?.id) {
    const { data: updated, error: updErr } = await admin
      .from("document_deliveries")
      .update({
        cargo_id: cargoId,
        cargo_name: resolvedCargoName || null,
        work_center_id: workCenterId,
        work_center_name: workCenterName,
        title,
        document_code: documentCode,
        content_snapshot: snapshot,
        content_hash: contentHash,
        source_updated_at: sourceUpdatedAt,
        assigned_by: assignedByAuthUserId,
      })
      .eq("id", existing.id)
      .select("id")
      .single();

    if (updErr || !updated) {
      return { id: null, error: updErr?.message ?? "No se pudo actualizar la entrega" };
    }
    return { id: updated.id };
  }

  const { data: inserted, error: insErr } = await admin
    .from("document_deliveries")
    .insert({
      organization_id: organizationId,
      assignee_member_id: assigneeMemberId,
      assignee_auth_user_id: assignee.auth_user_id,
      source_type: sourceType,
      source_id: canonicalSourceId,
      cargo_id: cargoId,
      cargo_name: resolvedCargoName || null,
      work_center_id: workCenterId,
      work_center_name: workCenterName,
      title,
      document_code: documentCode,
      content_snapshot: snapshot,
      content_hash: contentHash,
      source_updated_at: sourceUpdatedAt,
      status: "pendiente_revision",
      assigned_by: assignedByAuthUserId,
    })
    .select("id")
    .single();

  if (insErr || !inserted) {
    const msg = insErr?.message ?? "";
    if (msg.includes("document_deliveries")) {
      return {
        id: null,
        error:
          "Falta la tabla document_deliveries en Supabase. Ejecuta supabase/migrations/20261001_document_deliveries.sql en el SQL Editor del proyecto.",
      };
    }
    return { id: null, error: insErr?.message ?? "No se pudo crear la entrega" };
  }

  return { id: inserted.id };
}

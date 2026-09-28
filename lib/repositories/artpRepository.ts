import { getSupabaseClient } from "@/lib/supabaseClient";
import { coalesceRequest } from "@/lib/supabase/coalesceRequest";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import type {
  ArtpChangeAnswer,
  ArtpCheckAnswer,
  ArtpDocumentListItem,
  ArtpExecutionSummary,
  ArtpHomeCounts,
  ArtpPlanningBundle,
  ArtpVersionDetail,
  ArtpVersionStatus,
  EnergyType,
  OrgTask,
} from "@/types/artp";
import { parseStepWithEvents } from "@/lib/artp/stepTreeMapper";
import { normalizeTaskName, scopedArtpId } from "@/types/artp";

function mapEnergy(row: Record<string, unknown>): EnergyType {
  return {
    id: String(row.id),
    code: String(row.code),
    label: String(row.label),
    organizationId: row.organization_id ? String(row.organization_id) : null,
    isSystem: Boolean(row.is_system),
  };
}

export async function fetchEnergyTypes(orgId: string): Promise<EnergyType[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("energy_types")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${orgId}`)
    .eq("active", true)
    .order("label");
  if (error) {
    logPersistenceError("artp.energy.fetch", error);
    return [];
  }
  return (data || []).map(mapEnergy);
}

export async function upsertOrgTask(
  orgId: string,
  input: {
    id?: string;
    name: string;
    description?: string;
    workCenterId?: string;
    areaId?: string;
    processId?: string;
    subprocessId?: string;
    origin: "manual" | "iper" | "artp";
    iperMatrixId?: string;
    iperTaskLabel?: string;
  }
): Promise<OrgTask | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const normalized = normalizeTaskName(input.name);

  let existingQuery = client
    .from("org_tasks")
    .select("*")
    .eq("organization_id", orgId)
    .eq("normalized_name", normalized);

  if (input.processId) {
    existingQuery = existingQuery.eq("process_id", input.processId);
  } else {
    existingQuery = existingQuery.is("process_id", null);
  }

  const { data: existingRow, error: findErr } = await existingQuery.maybeSingle();
  if (findErr) {
    logPersistenceError("artp.org_task.find", findErr);
  }

  const id = input.id ?? existingRow?.id ?? scopedArtpId(orgId, `task_${Date.now()}`);
  const row = {
    id,
    organization_id: orgId,
    name: input.name,
    normalized_name: normalized,
    description: input.description ?? null,
    work_center_id: input.workCenterId ?? null,
    area_id: input.areaId ?? null,
    process_id: input.processId ?? null,
    subprocess_id: input.subprocessId ?? null,
    origin: input.origin,
    iper_matrix_id: input.iperMatrixId ?? null,
    iper_task_label: input.iperTaskLabel ?? null,
  };

  const { data, error } = await client.from("org_tasks").upsert(row).select("*").single();
  if (error) {
    logPersistenceError("artp.org_task.upsert", error);
    return null;
  }
  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    normalizedName: data.normalized_name,
    description: data.description ?? undefined,
    workCenterId: data.work_center_id ?? undefined,
    areaId: data.area_id ?? undefined,
    processId: data.process_id ?? undefined,
    subprocessId: data.subprocess_id ?? undefined,
    origin: data.origin,
    iperMatrixId: data.iper_matrix_id ?? undefined,
    iperTaskLabel: data.iper_task_label ?? undefined,
  };
}

export async function fetchArtpHomeCounts(orgId: string): Promise<ArtpHomeCounts> {
  const client = getSupabaseClient();
  const empty: ArtpHomeCounts = {
    vigente: 0,
    borrador: 0,
    enRevision: 0,
    executionsPendiente: 0,
    executionsCompletada: 0,
  };
  if (!client) return empty;

  const countStatus = async (status: ArtpVersionStatus) => {
    const { count, error } = await client
      .from("artp_versions")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", status);
    if (error) logPersistenceError("artp.count", error);
    return count ?? 0;
  };

  const countExec = async (status: string) => {
    const { count, error } = await client
      .from("artp_executions")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", status);
    if (error) logPersistenceError("artp.exec.count", error);
    return count ?? 0;
  };

  const [vigente, borrador, enRevision, executionsPendiente, executionsCompletada] =
    await Promise.all([
      countStatus("vigente"),
      countStatus("borrador"),
      countStatus("en_revision"),
      countExec("pendiente"),
      countExec("completada"),
    ]);

  return { vigente, borrador, enRevision, executionsPendiente, executionsCompletada };
}

export async function fetchArtpDocuments(orgId: string): Promise<ArtpDocumentListItem[]> {
  return coalesceRequest(`artp:docs:${orgId}`, () => fetchArtpDocumentsUncached(orgId));
}

async function fetchArtpDocumentsUncached(orgId: string): Promise<ArtpDocumentListItem[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data: docs, error } = await client
    .from("artp_documents")
    .select("*")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) {
    logPersistenceError("artp.documents.fetch", error);
    return [];
  }

  const versionIds = (docs || [])
    .map((d) => d.current_version_id)
    .filter(Boolean) as string[];

  let versions: Record<string, { version_number: number; status: string; task_name: string }> =
    {};
  if (versionIds.length) {
    const { data: vers } = await client
      .from("artp_versions")
      .select("id, version_number, status, task_name")
      .in("id", versionIds);
    for (const v of vers || []) {
      versions[v.id] = v;
    }
  }

  const taskIds = [...new Set((docs || []).map((d) => d.org_task_id))];
  const { data: tasks } = await client.from("org_tasks").select("id, name").in("id", taskIds);
  const taskMap = new Map((tasks || []).map((t) => [t.id, t.name]));

  return (docs || []).map((d) => {
    const ver = d.current_version_id ? versions[d.current_version_id] : undefined;
    return {
      id: d.id,
      organizationId: d.organization_id,
      name: d.name,
      code: d.code ?? undefined,
      description: d.description ?? undefined,
      orgTaskId: d.org_task_id,
      taskName: ver?.task_name ?? taskMap.get(d.org_task_id) ?? "",
      workCenterId: d.work_center_id ?? undefined,
      areaId: d.area_id ?? undefined,
      processId: d.process_id ?? undefined,
      currentVersionId: d.current_version_id ?? undefined,
      versionNumber: ver?.version_number,
      versionStatus: ver?.status as ArtpVersionStatus | undefined,
      updatedAt: d.updated_at,
    };
  });
}

export async function fetchArtpVersionDetail(versionId: string): Promise<ArtpVersionDetail | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.rpc("get_artp_version_detail", {
    p_version_id: versionId,
  });
  if (error) {
    logPersistenceError("artp.version.detail", error);
    return null;
  }
  let detail = parseArtpVersionDetail(data);
  if (!detail) return null;

  const { data: row } = await client
    .from("artp_versions")
    .select("content_snapshot")
    .eq("id", versionId)
    .maybeSingle();
  const snapPlanning = (row?.content_snapshot as Record<string, unknown> | null)?.planning;
  if (snapPlanning && typeof snapPlanning === "object") {
    const raw = data as Record<string, unknown>;
    const content = { ...((raw.content as Record<string, unknown>) ?? {}), planning: snapPlanning };
    const remerged = parseArtpVersionDetail({ ...raw, content });
    if (remerged) detail = remerged;
  }
  return detail;
}

export function parseArtpVersionDetail(raw: unknown): ArtpVersionDetail | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const doc = o.document as Record<string, unknown>;
  const ver = o.version as Record<string, unknown>;
  const content = (o.content ?? {}) as Record<string, unknown>;
  const stepsRaw = (content.steps as unknown[]) ?? [];
  const positionsRaw = (content.positions as { positionId?: string }[]) ?? [];

  const steps = stepsRaw.map((s) => {
    const step = s as Record<string, unknown>;
    const hazardsRaw = (step.hazards as unknown[]) ?? [];
    return {
      id: String(step.id),
      sequence: Number(step.sequence),
      description: String(step.description ?? ""),
      tools: (step.tools as string[]) ?? [],
      energyTypeIds: ((step.energies as { id: string }[]) ?? []).map((e) => e.id),
      hazards: hazardsRaw.map((h) => {
        const hz = h as Record<string, unknown>;
        const risksRaw = (hz.risks as unknown[]) ?? [];
        return {
          id: String(hz.id),
          name: String(hz.name ?? ""),
          classification: hz.classification ? String(hz.classification) : undefined,
          risks: risksRaw.map((r) => {
            const rk = r as Record<string, unknown>;
            const controlsRaw = (rk.controls as unknown[]) ?? [];
            return {
              id: String(rk.id),
              name: String(rk.name ?? ""),
              controls: controlsRaw.map((c) => {
                const ct = c as Record<string, unknown>;
                return {
                  id: String(ct.id),
                  description: String(ct.description ?? ""),
                  controlType: ct.controlType as ArtpVersionDetail["steps"][0]["hazards"][0]["risks"][0]["controls"][0]["controlType"],
                  isCritical: Boolean(ct.isCritical),
                  verificationQuestion: ct.verificationQuestion
                    ? String(ct.verificationQuestion)
                    : undefined,
                  verificationAnswer: ct.verificationAnswer
                    ? (String(ct.verificationAnswer) as ArtpVersionDetail["steps"][0]["hazards"][0]["risks"][0]["controls"][0]["verificationAnswer"])
                    : ct.planningVerificationAnswer
                      ? (String(ct.planningVerificationAnswer) as ArtpVersionDetail["steps"][0]["hazards"][0]["risks"][0]["controls"][0]["verificationAnswer"])
                      : undefined,
                };
              }),
            };
          }),
        };
      }),
    };
  }).map((s) => parseStepWithEvents(s));

  const planningRaw = content.planning as Record<string, unknown> | undefined;
  let planning: ArtpPlanningBundle | undefined;
  if (planningRaw && typeof planningRaw === "object") {
    const wc = (planningRaw.workContext ?? {}) as Record<string, unknown>;
    planning = {
      taskName: String(planningRaw.taskName ?? ver.taskName ?? ""),
      iperMatrixId: planningRaw.iperMatrixId ? String(planningRaw.iperMatrixId) : undefined,
      workContext: {
        workDate: String(wc.workDate ?? ""),
        startTime: String(wc.startTime ?? ""),
        endTime: String(wc.endTime ?? ""),
        specificLocation: String(wc.specificLocation ?? ""),
        workArea: String(wc.workArea ?? ""),
        supervisorMemberId: wc.supervisorMemberId ? String(wc.supervisorMemberId) : undefined,
        supervisorName: String(wc.supervisorName ?? ""),
        supervisorSignatureDataUrl: wc.supervisorSignatureDataUrl
          ? String(wc.supervisorSignatureDataUrl)
          : null,
        signatureStoragePath: wc.signatureStoragePath
          ? String(wc.signatureStoragePath)
          : null,
      },
      changeAnswers: ((planningRaw.changeAnswers as unknown[]) ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        return {
          questionId: String(r.questionId ?? ""),
          category: r.category as ArtpChangeAnswer["category"],
          question: String(r.question ?? ""),
          answer: r.answer === true ? true : r.answer === false ? false : null,
          changeDescription: r.changeDescription ? String(r.changeDescription) : "",
          undesiredEvent: r.undesiredEvent ? String(r.undesiredEvent) : "",
          additionalControl: r.additionalControl ? String(r.additionalControl) : "",
          implementationVerified:
            r.implementationVerified === true
              ? true
              : r.implementationVerified === false
                ? false
                : null,
        };
      }),
      workers: ((planningRaw.workers as unknown[]) ?? []).map((row) => {
        const w = row as Record<string, unknown>;
        return {
          id: String(w.id),
          memberId: w.memberId ? String(w.memberId) : undefined,
          workerName: String(w.workerName ?? ""),
          signatureDataUrl: w.signatureDataUrl ? String(w.signatureDataUrl) : null,
          signatureStoragePath: w.signatureStoragePath ? String(w.signatureStoragePath) : null,
        };
      }),
      controlAnswers: (planningRaw.controlAnswers as Record<string, ArtpCheckAnswer>) ?? {},
    };
  }

  const controlAnswers = planning?.controlAnswers ?? {};
  const stepsWithAnswers = steps.map((s) => ({
    ...s,
    hazards: s.hazards.map((h) => ({
      ...h,
      risks: h.risks.map((r) => ({
        ...r,
        controls: r.controls.map((c) => ({
          ...c,
          verificationAnswer: c.verificationAnswer ?? controlAnswers[c.id] ?? null,
        })),
      })),
    })),
  })).map((s) => parseStepWithEvents(s));

  return {
    document: {
      id: String(doc.id),
      name: String(doc.name),
      code: doc.code ? String(doc.code) : undefined,
      description: doc.description ? String(doc.description) : undefined,
    },
    version: {
      id: String(ver.id),
      versionNumber: Number(ver.versionNumber),
      status: ver.status as ArtpVersionStatus,
      taskName: String(ver.taskName ?? ""),
      contentHash: ver.contentHash ? String(ver.contentHash) : undefined,
      publishedAt: ver.publishedAt ? String(ver.publishedAt) : undefined,
    },
    positionIds: positionsRaw.map((p) => String(p.positionId)),
    steps: stepsWithAnswers,
    planning,
    contentSnapshot: content as Record<string, unknown>,
  };
}

export async function createArtpDocumentWithVersion(
  orgId: string,
  input: {
    name: string;
    code?: string;
    description?: string;
    workCenterId?: string;
    areaId?: string;
    processId?: string;
    subprocessId?: string;
    orgTaskId: string;
    taskName: string;
    positionIds: string[];
  }
): Promise<{ documentId: string; versionId: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const docId = scopedArtpId(orgId, `doc_${Date.now()}`);
  const verId = scopedArtpId(orgId, `ver_${Date.now()}`);

  const { error: docErr } = await client.from("artp_documents").insert({
    id: docId,
    organization_id: orgId,
    name: input.taskName,
    code: input.code ?? null,
    description: input.description ?? null,
    work_center_id: input.workCenterId ?? null,
    area_id: input.areaId ?? null,
    process_id: input.processId ?? null,
    subprocess_id: input.subprocessId ?? null,
    org_task_id: input.orgTaskId,
    current_version_id: null,
  });
  if (docErr) {
    logPersistenceError("artp.doc.create", docErr);
    return null;
  }

  const { error: verErr } = await client.from("artp_versions").insert({
    id: verId,
    organization_id: orgId,
    artp_document_id: docId,
    version_number: 1,
    status: "borrador",
    work_center_id: input.workCenterId ?? null,
    area_id: input.areaId ?? null,
    process_id: input.processId ?? null,
    subprocess_id: input.subprocessId ?? null,
    org_task_id: input.orgTaskId,
    task_name: input.taskName,
  });
  if (verErr) {
    logPersistenceError("artp.ver.create", verErr);
    await client.from("artp_documents").delete().eq("id", docId);
    return null;
  }

  const { error: linkErr } = await client
    .from("artp_documents")
    .update({ current_version_id: verId })
    .eq("id", docId);
  if (linkErr) {
    logPersistenceError("artp.doc.link_version", linkErr);
    return null;
  }

  if (input.positionIds.length) {
    await client.from("artp_version_positions").insert(
      input.positionIds.map((pid, i) => ({
        id: `${verId}_pos_${i}`,
        organization_id: orgId,
        version_id: verId,
        position_id: pid,
      }))
    );
  }

  return { documentId: docId, versionId: verId };
}

export async function saveArtpStepsTree(
  orgId: string,
  versionId: string,
  steps: ArtpVersionDetail["steps"]
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { data: existingSteps } = await client
    .from("artp_steps")
    .select("id")
    .eq("version_id", versionId);
  const stepIds = (existingSteps || []).map((s) => s.id);
  if (stepIds.length) {
    const { data: hazards } = await client
      .from("artp_step_hazards")
      .select("id")
      .in("step_id", stepIds);
    const hazardIds = (hazards || []).map((h) => h.id);
    if (hazardIds.length) {
      const { data: risks } = await client
        .from("artp_step_risks")
        .select("id")
        .in("hazard_id", hazardIds);
      const riskIds = (risks || []).map((r) => r.id);
      if (riskIds.length) {
        await client.from("artp_step_controls").delete().in("risk_id", riskIds);
        await client.from("artp_step_risks").delete().in("id", riskIds);
      }
      await client.from("artp_step_hazards").delete().in("id", hazardIds);
    }
    await client.from("artp_step_energies").delete().in("step_id", stepIds);
    await client.from("artp_steps").delete().in("id", stepIds);
  }

  for (const step of steps) {
    await client.from("artp_steps").insert({
      id: step.id,
      organization_id: orgId,
      version_id: versionId,
      sequence: step.sequence,
      description: step.description,
      tools: step.tools,
    });
    for (const eid of step.energyTypeIds) {
      await client.from("artp_step_energies").insert({
        id: `${step.id}_en_${eid}`,
        organization_id: orgId,
        step_id: step.id,
        energy_type_id: eid,
      });
    }
    for (const h of step.hazards) {
      await client.from("artp_step_hazards").insert({
        id: h.id,
        organization_id: orgId,
        step_id: step.id,
        name: h.name,
        classification: h.classification ?? null,
        source: "manual",
      });
      for (const r of h.risks) {
        await client.from("artp_step_risks").insert({
          id: r.id,
          organization_id: orgId,
          hazard_id: h.id,
          name: r.name,
          source: "manual",
        });
        for (const c of r.controls) {
          await client.from("artp_step_controls").insert({
            id: c.id,
            organization_id: orgId,
            risk_id: r.id,
            description: c.description,
            control_type: c.controlType,
            is_critical: c.isCritical,
            verification_question: c.verificationQuestion ?? null,
            source: "manual",
          });
        }
      }
    }
  }
  return true;
}

export async function saveArtpPlanningMeta(
  orgId: string,
  versionId: string,
  documentId: string,
  planning: ArtpPlanningBundle
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const { data: row, error: readErr } = await client
    .from("artp_versions")
    .select("content_snapshot")
    .eq("id", versionId)
    .single();
  if (readErr) {
    logPersistenceError("artp.planning.read", readErr);
    return false;
  }

  const prev = (row?.content_snapshot ?? {}) as Record<string, unknown>;
  const nextSnapshot = { ...prev, planning };

  const { error: verErr } = await client
    .from("artp_versions")
    .update({
      task_name: planning.taskName,
      content_snapshot: nextSnapshot,
      updated_at: new Date().toISOString(),
    })
    .eq("id", versionId);
  if (verErr) {
    logPersistenceError("artp.planning.version", verErr);
    return false;
  }

  const { error: docErr } = await client
    .from("artp_documents")
    .update({ name: planning.taskName, updated_at: new Date().toISOString() })
    .eq("id", documentId)
    .eq("organization_id", orgId);
  if (docErr) {
    logPersistenceError("artp.planning.document", docErr);
    return false;
  }

  return true;
}

export async function fetchArtpDocumentOrgTaskId(documentId: string): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("artp_documents")
    .select("org_task_id")
    .eq("id", documentId)
    .maybeSingle();
  if (error) {
    logPersistenceError("artp.doc.org_task", error);
    return null;
  }
  return data?.org_task_id ? String(data.org_task_id) : null;
}

export async function submitArtpForSignatures(versionId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.rpc("submit_artp_version_for_signatures", {
    p_version_id: versionId,
  });
  if (error) {
    logPersistenceError("artp.submit_signatures", error);
    return false;
  }
  const { error: syncErr } = await client.rpc("sync_artp_version_signature_deliveries", {
    p_version_id: versionId,
  });
  if (syncErr) {
    logPersistenceError("artp.sync_signature_deliveries", syncErr);
  }
  return true;
}

/** Idempotente: crea/actualiza entregas móviles para firmantes del ARTP en revisión. */
export async function syncArtpSignatureDeliveries(versionId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.rpc("sync_artp_version_signature_deliveries", {
    p_version_id: versionId,
  });
  if (error) {
    logPersistenceError("artp.sync_signature_deliveries", error);
    return false;
  }
  return true;
}

export async function fetchArtpSignatureProgress(versionId: string): Promise<{
  signers: {
    memberId: string;
    name: string;
    role: string;
    status: string;
    signedAt?: string | null;
  }[];
  pending: number;
  total: number;
  allSigned: boolean;
}> {
  const empty = { signers: [], pending: 0, total: 0, allSigned: false };
  const client = getSupabaseClient();
  if (!client) return empty;
  const { data, error } = await client.rpc("get_artp_signature_progress", {
    p_version_id: versionId,
  });
  if (error || !data || typeof data !== "object") {
    if (error) logPersistenceError("artp.signature_progress", error);
    return empty;
  }
  const row = data as Record<string, unknown>;
  const signers = Array.isArray(row.signers) ? row.signers : [];
  return {
    signers: signers.map((s) => {
      const item = s as Record<string, unknown>;
      return {
        memberId: String(item.memberId ?? ""),
        name: String(item.name ?? ""),
        role: String(item.role ?? "worker"),
        status: String(item.status ?? ""),
        signedAt: item.signedAt ? String(item.signedAt) : null,
      };
    }),
    pending: Number(row.pending ?? 0),
    total: Number(row.total ?? 0),
    allSigned: Boolean(row.allSigned),
  };
}

export async function publishArtpVersion(versionId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.rpc("publish_artp_version", { p_version_id: versionId });
  if (error) {
    logPersistenceError("artp.publish", error);
    return false;
  }
  return true;
}

export async function deleteArtpDraftDocument(
  documentId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Sin conexión con el servidor." };

  const { data: doc, error: docErr } = await client
    .from("artp_documents")
    .select("id, current_version_id")
    .eq("id", documentId)
    .maybeSingle();

  if (docErr || !doc) {
    logPersistenceError("artp.doc.delete.load", docErr);
    return { ok: false, message: "No se encontró el documento ARTP." };
  }

  if (doc.current_version_id) {
    const { count, error: execErr } = await client
      .from("artp_executions")
      .select("id", { count: "exact", head: true })
      .eq("artp_version_id", doc.current_version_id);

    if (execErr) {
      logPersistenceError("artp.doc.delete.executions", execErr);
      return { ok: false, message: "No se pudo verificar ejecuciones asociadas." };
    }
    if (count && count > 0) {
      return {
        ok: false,
        message: "No se puede eliminar: este ARTP tiene ejecuciones registradas.",
      };
    }
  }

  const { error: delErr } = await client.rpc("delete_artp_document", {
    p_document_id: documentId,
  });
  if (delErr) {
    logPersistenceError("artp.doc.delete", delErr);
    return { ok: false, message: "No se pudo eliminar. Verifique permisos de editor." };
  }

  return { ok: true };
}

export async function cloneArtpVersion(
  sourceVersionId: string
): Promise<{ versionId: string | null; message?: string }> {
  const client = getSupabaseClient();
  if (!client) return { versionId: null, message: "No hay sesión para crear la nueva versión." };
  const { data, error } = await client.rpc("clone_artp_version", {
    p_source_version_id: sourceVersionId,
  });
  if (error) {
    logPersistenceError("artp.clone", error);
    const raw = error.message || "";
    const message = raw.includes("Solo se versiona")
      ? "Solo se puede crear una nueva versión desde un ARTP vigente."
      : raw.includes("Sin permiso")
        ? "No tienes permiso para versionar este ARTP."
        : "No se pudo crear la nueva versión. Vuelve a intentar en unos segundos.";
    return { versionId: null, message };
  }
  return { versionId: typeof data === "string" ? data : null };
}

export async function createArtpExecution(
  orgId: string,
  versionId: string,
  input: {
    workCenterId?: string;
    areaId?: string;
    specificLocation?: string;
    supervisorMemberId?: string;
    startsOn?: string;
  }
): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: ver } = await client
    .from("artp_versions")
    .select("artp_document_id")
    .eq("id", versionId)
    .single();
  if (!ver) return null;

  const { count } = await client
    .from("artp_executions")
    .select("*", { count: "exact", head: true })
    .eq("artp_version_id", versionId);

  const code = `EJ-${String((count ?? 0) + 1).padStart(3, "0")}`;
  const execId = scopedArtpId(orgId, `exec_${Date.now()}`);

  const { error } = await client.from("artp_executions").insert({
    id: execId,
    organization_id: orgId,
    artp_version_id: versionId,
    code,
    status: "pendiente",
    work_center_id: input.workCenterId ?? null,
    area_id: input.areaId ?? null,
    specific_location: input.specificLocation ?? null,
    supervisor_member_id: input.supervisorMemberId ?? null,
    starts_on: input.startsOn ?? null,
  });
  if (error) {
    logPersistenceError("artp.execution.create", error);
    return null;
  }
  return execId;
}

export async function fetchArtpExecutions(orgId: string): Promise<ArtpExecutionSummary[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("artp_executions")
    .select("id, code, status, artp_version_id, specific_location, starts_on, started_at, ended_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) {
    logPersistenceError("artp.executions.fetch", error);
    return [];
  }
  return (data || []).map((r) => ({
    id: r.id,
    code: r.code,
    status: r.status,
    artpVersionId: r.artp_version_id,
    specificLocation: r.specific_location ?? undefined,
    startsOn: r.starts_on ?? undefined,
    startedAt: r.started_at ?? undefined,
    endedAt: r.ended_at ?? undefined,
  }));
}

export async function transitionArtpExecution(
  executionId: string,
  targetStatus: string
): Promise<{ ok: boolean; message?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase no configurado" };
  const { error } = await client.rpc("transition_artp_execution", {
    p_execution_id: executionId,
    p_target_status: targetStatus,
  });
  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function registerArtpAcknowledgement(
  ackId: string,
  signaturePath: string
): Promise<{ ok: boolean; message?: string }> {
  const client = getSupabaseClient();
  if (!client) return { ok: false, message: "Supabase no configurado" };
  const { error } = await client.rpc("register_artp_acknowledgement", {
    p_ack_id: ackId,
    p_signature_path: signaturePath,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function fetchPendingIperLinks(orgId: string): Promise<
  { id: string; iperMatrixId: string; artpDocumentId: string; taskLabel: string }[]
> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data } = await client
    .from("artp_iper_links")
    .select("id, iper_matrix_id, artp_document_id, task_label")
    .eq("organization_id", orgId)
    .eq("status", "propuesta_pendiente");
  return (data || []).map((r) => ({
    id: r.id,
    iperMatrixId: r.iper_matrix_id,
    artpDocumentId: r.artp_document_id,
    taskLabel: r.task_label,
  }));
}

import { getSupabaseClient } from "@/lib/supabaseClient";
import { coalesceRequest } from "@/lib/supabase/coalesceRequest";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import type { ProgramActivity, ActivityEvidence } from "@/types/preventiveProgram";

const defaultPlanId = (orgId: string) => `plan_${orgId}`;

function rowToActivity(row: any): ProgramActivity {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description || "",
    objective: row.objective,
    category: row.category,
    areaId: row.area_id,
    areaName: row.area_name,
    responsibleUserId: row.responsible_user_id,
    responsibleUserName: row.responsible_user_name,
    responsiblePositionId: row.responsible_position_id,
    responsiblePositionName: row.responsible_position_name,
    startDate: row.start_date,
    endDate: row.end_date,
    periodicity: row.periodicity,
    applicability: row.applicability,
    status: row.status,
    progress: row.progress,
    weight: row.weight ? Number(row.weight) : 1,
    observations: row.observations,
    evidences: [],
  };
}

export async function fetchPreventiveActivities(orgId: string): Promise<ProgramActivity[]> {
  return coalesceRequest(`planning:${orgId}`, () => fetchPreventiveActivitiesUncached(orgId));
}

async function fetchPreventiveActivitiesUncached(orgId: string): Promise<ProgramActivity[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const planId = defaultPlanId(orgId);
  const { data: plan } = await client
    .from("preventive_plans")
    .select("id")
    .eq("organization_id", orgId)
    .eq("status", "Activo")
    .maybeSingle();

  const activePlanId = plan?.id ?? planId;

  const { data: acts, error } = await client
    .from("preventive_activities")
    .select("*")
    .eq("organization_id", orgId)
    .eq("plan_id", activePlanId)
    .order("start_date", { ascending: true });

  if (error) {
    logPersistenceError("planning.activities.fetch", error);
    return [];
  }

  const activities = (acts || []).map(rowToActivity);

  const { data: evidences } = await client
    .from("preventive_evidence")
    .select("*")
    .eq("organization_id", orgId);

  const evByAct = new Map<string, ActivityEvidence[]>();
  for (const ev of evidences || []) {
    const item: ActivityEvidence = {
      id: ev.id,
      name: ev.name,
      type: ev.type,
      uploadedAt: ev.uploaded_at,
      fileSize: ev.file_size_bytes ? `${ev.file_size_bytes}` : undefined,
      url: ev.storage_path,
    };
    const list = evByAct.get(ev.activity_id) || [];
    list.push(item);
    evByAct.set(ev.activity_id, list);
  }

  return activities.map((a) => ({
    ...a,
    evidences: evByAct.get(a.id) || [],
  }));
}

export async function ensurePreventivePlan(orgId: string): Promise<string> {
  const client = getSupabaseClient();
  const planId = defaultPlanId(orgId);
  if (!client) return planId;

  await client.from("preventive_plans").upsert({
    id: planId,
    organization_id: orgId,
    name: "Programa Anual",
    status: "Activo",
  });
  return planId;
}

export async function savePreventiveActivities(
  orgId: string,
  activities: ProgramActivity[]
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const planId = await ensurePreventivePlan(orgId);

  const activityRows = activities.map((act) => ({
    id: act.id,
    organization_id: orgId,
    plan_id: planId,
    code: act.code,
    name: act.name,
    description: act.description,
    objective: act.objective,
    category: act.category,
    area_id: act.areaId,
    area_name: act.areaName,
    responsible_user_id: act.responsibleUserId,
    responsible_user_name: act.responsibleUserName,
    responsible_position_id: act.responsiblePositionId,
    responsible_position_name: act.responsiblePositionName,
    start_date: act.startDate,
    end_date: act.endDate,
    periodicity: act.periodicity,
    applicability: act.applicability,
    status: act.status,
    progress: act.progress,
    weight: act.weight ?? 1,
    observations: act.observations,
  }));

  if (activityRows.length > 0) {
    const { error } = await client.from("preventive_activities").upsert(activityRows);
    if (error) {
      logPersistenceError("planning.activity.upsert", error);
      return false;
    }
  }

  const evidenceRows = activities.flatMap((act) =>
    (act.evidences || []).map((ev) => ({
      id: ev.id,
      organization_id: orgId,
      activity_id: act.id,
      name: ev.name,
      type: ev.type,
      storage_path: ev.url ?? null,
    }))
  );

  if (evidenceRows.length > 0) {
    const { error } = await client.from("preventive_evidence").upsert(evidenceRows);
    if (error) {
      logPersistenceError("planning.evidence.upsert", error);
      return false;
    }
  }

  return true;
}

export async function deletePreventiveActivity(orgId: string, activityId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  await client.from("preventive_evidence").delete().eq("activity_id", activityId);
  const { error } = await client
    .from("preventive_activities")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", activityId);
  if (error) {
    logPersistenceError("planning.activity.delete", error);
    return false;
  }
  return true;
}

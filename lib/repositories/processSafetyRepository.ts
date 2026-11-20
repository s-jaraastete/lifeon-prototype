import { getSupabaseClient } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import { PS_BASE_TEMPLATE } from "@/lib/processSafety/baseTemplate";
import {
  scopedPsId,
  type PsActivity,
  type PsPhase,
  type PsProgressLogEntry,
} from "@/types/processSafety";

export interface PsActivityInput {
  id?: string;
  elementNumber: number;
  phase: PsPhase;
  code: string | null;
  title: string;
  responsible: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  progress: number;
  sortOrder?: number;
}

function fail(context: string, error: unknown): never {
  throw new Error(logPersistenceError(context, error).message);
}

function mapActivity(row: Record<string, unknown>): PsActivity {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    elementNumber: Number(row.element_number),
    phase: row.phase as PsPhase,
    code: row.code ? String(row.code) : null,
    title: String(row.title),
    responsible: row.responsible ? String(row.responsible) : null,
    plannedStart: row.planned_start ? String(row.planned_start) : null,
    plannedEnd: row.planned_end ? String(row.planned_end) : null,
    progress: Number(row.progress ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function fetchPsActivities(orgId: string): Promise<PsActivity[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("ps_activities")
    .select("*")
    .eq("organization_id", orgId)
    .order("element_number")
    .order("sort_order");
  if (error) fail("process_safety.activities.fetch", error);
  return (data || []).map(mapActivity);
}

export async function fetchPsProgressLog(orgId: string): Promise<PsProgressLogEntry[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("ps_progress_log")
    .select("activity_id, progress, recorded_on")
    .eq("organization_id", orgId);
  if (error) fail("process_safety.log.fetch", error);
  return (data || []).map((row) => ({
    activityId: String(row.activity_id),
    progress: Number(row.progress),
    recordedOn: String(row.recorded_on),
  }));
}

/** Carga la plantilla base sin fechas. Idempotente: ids fijos por elemento y código. */
export async function seedPsBaseTemplate(orgId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const rows = Object.entries(PS_BASE_TEMPLATE).flatMap(([element, steps]) =>
    steps.map((step, i) => ({
      id: scopedPsId(orgId, `base_e${element}_${step.code}`),
      organization_id: orgId,
      element_number: Number(element),
      phase: step.phase,
      code: step.code,
      title: step.title,
      sort_order: (i + 1) * 10,
    }))
  );
  const { error } = await client
    .from("ps_activities")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) fail("process_safety.seed", error);
}

export async function upsertPsActivity(orgId: string, input: PsActivityInput): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const row = {
    element_number: input.elementNumber,
    phase: input.phase,
    code: input.code,
    title: input.title,
    responsible: input.responsible,
    planned_start: input.plannedStart,
    planned_end: input.plannedEnd,
    progress: input.progress,
  };
  const { error } = input.id
    ? await client.from("ps_activities").update(row).eq("id", input.id).eq("organization_id", orgId)
    : await client.from("ps_activities").insert({
        ...row,
        id: scopedPsId(orgId, `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
        organization_id: orgId,
        sort_order: input.sortOrder ?? 9999,
      });
  if (error) fail("process_safety.activity.upsert", error);
}

export async function updatePsActivityProgress(
  orgId: string,
  id: string,
  progress: number
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("ps_activities")
    .update({ progress })
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) fail("process_safety.activity.progress", error);
}

export async function deletePsActivity(orgId: string, id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client
    .from("ps_activities")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) fail("process_safety.activity.delete", error);
}

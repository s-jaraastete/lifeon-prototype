import { getSupabaseClient } from "@/lib/supabaseClient";

export type DashboardOverviewCounts = {
  workCenters: number;
  areas: number;
  processes: number;
  positions: number;
  members: number;
  preventiveTotal: number;
  preventiveCompleted: number;
  preventiveInProgress: number;
  preventivePending: number;
  compliancePercentage: number;
};

export async function fetchDashboardOverviewCounts(
  orgId: string
): Promise<DashboardOverviewCounts | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const headCount = async (table: string) => {
    const { count, error } = await client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);
    if (error) return 0;
    return count ?? 0;
  };

  const [workCenters, areas, processes, positions, members] = await Promise.all([
    headCount("work_centers"),
    headCount("areas"),
    headCount("processes"),
    headCount("positions"),
    headCount("organization_members"),
  ]);

  const { data: activityRows, error: actErr } = await client
    .from("preventive_activities")
    .select("status, progress")
    .eq("organization_id", orgId);

  if (actErr) {
    return {
      workCenters,
      areas,
      processes,
      positions,
      members,
      preventiveTotal: 0,
      preventiveCompleted: 0,
      preventiveInProgress: 0,
      preventivePending: 0,
      compliancePercentage: 0,
    };
  }

  const rows = activityRows ?? [];
  const preventiveTotal = rows.length;
  let preventiveCompleted = 0;
  let preventiveInProgress = 0;
  let preventivePending = 0;
  let progressSum = 0;

  for (const row of rows) {
    const progress = typeof row.progress === "number" ? row.progress : 0;
    progressSum += progress;
    const status = String(row.status || "");
    if (status === "Completada" || progress >= 100) {
      preventiveCompleted += 1;
    } else if (status === "En curso" || progress > 0) {
      preventiveInProgress += 1;
    } else {
      preventivePending += 1;
    }
  }

  const compliancePercentage =
    preventiveTotal === 0 ? 0 : Math.round(progressSum / preventiveTotal);

  return {
    workCenters,
    areas,
    processes,
    positions,
    members,
    preventiveTotal,
    preventiveCompleted,
    preventiveInProgress,
    preventivePending,
    compliancePercentage,
  };
}

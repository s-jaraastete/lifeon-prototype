import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensurePositionForOrg(
  admin: SupabaseClient,
  organizationId: string,
  positionId: string,
  positionName?: string | null
): Promise<boolean> {
  const id = positionId.trim();
  if (!id) return false;

  const name = positionName?.trim() || id;
  const { error } = await admin.from("positions").upsert({
    id,
    organization_id: organizationId,
    name,
    status: "Activo",
    dotation_total: 1,
    dotation_male: 0,
    dotation_female: 0,
    dotation_other: 0,
    disabled_workers_count: 0,
    sensitive_workers_count: 0,
  });

  return !error;
}

export async function ensureAreaForOrg(
  admin: SupabaseClient,
  organizationId: string,
  areaId: string,
  areaName?: string | null
): Promise<boolean> {
  const id = areaId.trim();
  if (!id) return false;

  const name = areaName?.trim() || id;
  const { error } = await admin.from("areas").upsert({
    id,
    organization_id: organizationId,
    name,
    status: "Activo",
  });

  return !error;
}

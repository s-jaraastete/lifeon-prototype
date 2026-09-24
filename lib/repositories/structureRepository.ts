import { getSupabaseClient } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import type {
  OrgArea,
  OrgPosition,
  OrgProcess,
  OrgStructureData,
  OrgSubprocess,
  OrgUser,
  OrgWorkCenter,
} from "@/types/orgStructure";

export async function fetchNormalizedStructure(orgId: string): Promise<OrgStructureData | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [wcRes, areaRes, procRes, subRes, posRes, memRes] = await Promise.all([
      client.from("work_centers").select("*").eq("organization_id", orgId),
      client.from("areas").select("*").eq("organization_id", orgId),
      client.from("processes").select("*").eq("organization_id", orgId),
      client.from("subprocesses").select("*").eq("organization_id", orgId),
      client.from("positions").select("*").eq("organization_id", orgId),
      client.from("organization_members").select(
        `
      *,
      positions ( name ),
      areas ( name )
    `
      ).eq("organization_id", orgId),
    ]);

    if (wcRes.error) logPersistenceError("structure.work_centers", wcRes.error);
    if (areaRes.error) logPersistenceError("structure.areas", areaRes.error);

    const workCenters: OrgWorkCenter[] = (wcRes.data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      address: r.address,
      description: r.description,
      status: r.status,
      organizationId: orgId,
      createdAt: r.created_at,
    }));

    const wcById = new Map(workCenters.map((w) => [w.id, w]));

    const subprocessesByProcess = new Map<string, OrgSubprocess[]>();
    for (const r of subRes.data || []) {
      const sp: OrgSubprocess = {
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description,
        processId: r.process_id,
        status: r.status,
        organizationId: orgId,
      };
      const list = subprocessesByProcess.get(r.process_id) || [];
      list.push(sp);
      subprocessesByProcess.set(r.process_id, list);
    }

    const processesByArea = new Map<string, OrgProcess[]>();
    for (const r of procRes.data || []) {
      const pr: OrgProcess = {
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description,
        areaId: r.area_id,
        status: r.status,
        subprocesses: subprocessesByProcess.get(r.id) || [],
        organizationId: orgId,
      };
      const list = processesByArea.get(r.area_id) || [];
      list.push(pr);
      processesByArea.set(r.area_id, list);
    }

    const areas: OrgArea[] = (areaRes.data || []).map((r: any) => {
      const wc = r.work_center_id ? wcById.get(r.work_center_id) : undefined;
      return {
        id: r.id,
        name: r.name,
        code: r.code,
        description: r.description,
        workCenterId: r.work_center_id,
        workCenter: wc?.name,
        workCenterName: wc?.name,
        status: r.status,
        processes: processesByArea.get(r.id) || [],
        organizationId: orgId,
      };
    });

    const positions: OrgPosition[] = (posRes.data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      totalStaff: r.dotation_total,
      menCount: r.dotation_male,
      womenCount: r.dotation_female,
      otherCount: r.dotation_other,
      disabledCount: r.disabled_workers_count,
      sensitiveCount: r.sensitive_workers_count,
      status: r.status,
      organizationId: orgId,
      createdAt: r.created_at,
    }));

    const users: OrgUser[] = (memRes.data || []).map((r: any) => {
      const first = r.first_name?.trim() || "";
      const last = r.last_name?.trim() || "";
      const composed = [first, last].filter(Boolean).join(" ").trim();
      const displayName = composed || r.name || r.email;
      const posRel = r.positions;
      const cargoName = Array.isArray(posRel)
        ? posRel[0]?.name
        : posRel?.name;
      const areaRel = r.areas;
      const areaName = Array.isArray(areaRel) ? areaRel[0]?.name : areaRel?.name;
      return {
        id: r.id,
        name: displayName,
        email: r.email,
        cargoId: r.cargo_id,
        cargoName: cargoName || undefined,
        areaId: r.area_id,
        areaName: areaName || undefined,
        role: r.role,
        status: r.status === "Invitado" ? "Inactivo" : r.status,
        organizationId: orgId,
        createdAt: r.created_at,
      };
    });

    if (
      workCenters.length === 0 &&
      areas.length === 0 &&
      positions.length === 0 &&
      users.length === 0
    ) {
      return null;
    }

    return {
      workCenters,
      areas,
      positions,
      users,
      lastUpdated: new Date().toISOString(),
    };
  } catch (e) {
    logPersistenceError("structure.fetch", e);
    return null;
  }
}

export async function saveNormalizedStructure(
  orgId: string,
  data: OrgStructureData
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    for (const wc of data.workCenters || []) {
      const { error } = await client.from("work_centers").upsert({
        id: wc.id,
        organization_id: orgId,
        name: wc.name,
        code: wc.code ?? null,
        description: wc.description ?? null,
        address: wc.address ?? null,
        status: wc.status || "Activo",
      });
      if (error) logPersistenceError("structure.wc.upsert", error);
    }

    for (const area of data.areas || []) {
      const { error } = await client.from("areas").upsert({
        id: area.id,
        organization_id: orgId,
        work_center_id: area.workCenterId ?? null,
        name: area.name,
        code: area.code ?? null,
        description: area.description ?? null,
        status: area.status || "Activo",
      });
      if (error) logPersistenceError("structure.area.upsert", error);

      for (const proc of area.processes || []) {
        const { error: pErr } = await client.from("processes").upsert({
          id: proc.id,
          organization_id: orgId,
          area_id: area.id,
          name: proc.name,
          code: proc.code ?? null,
          description: proc.description ?? null,
          status: proc.status || "Activo",
        });
        if (pErr) logPersistenceError("structure.process.upsert", pErr);

        for (const sp of proc.subprocesses || []) {
          const { error: sErr } = await client.from("subprocesses").upsert({
            id: sp.id,
            organization_id: orgId,
            process_id: proc.id,
            name: sp.name,
            code: sp.code ?? null,
            description: sp.description ?? null,
            status: sp.status || "Activo",
          });
          if (sErr) logPersistenceError("structure.subprocess.upsert", sErr);
        }
      }
    }

    for (const pos of data.positions || []) {
      const { error } = await client.from("positions").upsert({
        id: pos.id,
        organization_id: orgId,
        name: pos.name,
        code: pos.code ?? null,
        description: pos.description ?? null,
        dotation_total: pos.totalStaff ?? 1,
        dotation_male: pos.menCount ?? 0,
        dotation_female: pos.womenCount ?? 0,
        dotation_other: pos.otherCount ?? 0,
        disabled_workers_count: pos.disabledCount ?? 0,
        sensitive_workers_count: pos.sensitiveCount ?? 0,
        status: pos.status || "Activo",
      });
      if (error) logPersistenceError("structure.position.upsert", error);
    }

    return true;
  } catch (e) {
    logPersistenceError("structure.save", e);
    return false;
  }
}

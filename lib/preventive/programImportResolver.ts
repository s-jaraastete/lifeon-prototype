import type { OrgArea, OrgUser, OrgWorkCenter, OrgPosition } from "@/types/orgStructure";
import type { PlatformUser } from "@/types/users";

export function normalizeMatchKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export type ResolvedOrgUser = {
  id: string;
  name: string;
};

export function buildWorkCenterByName(workCenters: OrgWorkCenter[]): Map<string, OrgWorkCenter> {
  const map = new Map<string, OrgWorkCenter>();
  for (const wc of workCenters) {
    if (wc.status === "Inactivo") continue;
    map.set(normalizeMatchKey(wc.name), wc);
    if (wc.code) map.set(normalizeMatchKey(wc.code), wc);
  }
  return map;
}

export function buildPositionByName(positions: OrgPosition[]): Map<string, OrgPosition> {
  const map = new Map<string, OrgPosition>();
  for (const pos of positions) {
    if (pos.status === "Inactivo") continue;
    map.set(normalizeMatchKey(pos.name), pos);
    if (pos.code) map.set(normalizeMatchKey(pos.code), pos);
  }
  return map;
}

export function buildUserLookup(
  orgUsers: OrgUser[],
  platformUsers: PlatformUser[] = []
): Map<string, ResolvedOrgUser> {
  const map = new Map<string, ResolvedOrgUser>();

  const register = (keys: string[], user: ResolvedOrgUser) => {
    for (const key of keys) {
      const norm = normalizeMatchKey(key);
      if (!norm) continue;
      if (!map.has(norm)) map.set(norm, user);
    }
  };

  for (const u of orgUsers) {
    if (u.status === "Inactivo") continue;
    register([u.name, u.email], { id: u.id, name: u.name });
  }

  for (const p of platformUsers) {
    if (p.status === "Inactivo") continue;
    const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
    const display = fullName || p.email;
    register(
      [fullName, p.email, `${p.lastName}, ${p.firstName}`, p.firstName, p.lastName].filter(Boolean) as string[],
      { id: p.id, name: display }
    );
  }

  return map;
}

export function resolveWorkCenter(
  raw: string,
  wcByName: Map<string, OrgWorkCenter>
): OrgWorkCenter | null {
  if (!raw.trim()) return null;
  return wcByName.get(normalizeMatchKey(raw)) ?? null;
}

export function resolveArea(
  areaRaw: string,
  workCenterRaw: string | undefined,
  areas: OrgArea[],
  wcByName: Map<string, OrgWorkCenter>
): { area: OrgArea | null; ambiguous: boolean } {
  if (!areaRaw.trim()) return { area: null, ambiguous: false };

  const key = normalizeMatchKey(areaRaw);
  const candidates = areas.filter(
    (a) => a.status !== "Inactivo" && normalizeMatchKey(a.name) === key
  );

  if (candidates.length === 0) {
    const byCode = areas.find(
      (a) => a.status !== "Inactivo" && a.code && normalizeMatchKey(a.code) === key
    );
    return { area: byCode ?? null, ambiguous: false };
  }

  if (candidates.length === 1) return { area: candidates[0], ambiguous: false };

  if (workCenterRaw?.trim()) {
    const wc = resolveWorkCenter(workCenterRaw, wcByName);
    const wcKey = normalizeMatchKey(workCenterRaw);
    const scoped = candidates.find((a) => {
      if (wc && a.workCenterId && a.workCenterId === wc.id) return true;
      const wcName = a.workCenterName || a.workCenter;
      return wcName ? normalizeMatchKey(wcName) === wcKey : false;
    });
    if (scoped) return { area: scoped, ambiguous: false };
  }

  return { area: null, ambiguous: true };
}

export function areaBelongsToWorkCenter(
  area: OrgArea,
  workCenterName: string,
  wcByName: Map<string, OrgWorkCenter>
): boolean {
  const wc = resolveWorkCenter(workCenterName, wcByName);
  const wcKey = normalizeMatchKey(workCenterName);
  if (wc && area.workCenterId) return area.workCenterId === wc.id;
  const areaWc = area.workCenterName || area.workCenter;
  if (!areaWc) return true;
  return normalizeMatchKey(areaWc) === wcKey;
}

export function resolveUser(
  raw: string,
  userLookup: Map<string, ResolvedOrgUser>
): ResolvedOrgUser | null {
  if (!raw.trim()) return null;
  const key = normalizeMatchKey(raw);
  const direct = userLookup.get(key);
  if (direct) return direct;

  const commaParts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (commaParts.length === 2) {
    const swapped = `${commaParts[1]} ${commaParts[0]}`;
    return userLookup.get(normalizeMatchKey(swapped)) ?? null;
  }

  return null;
}

export function resolvePosition(
  raw: string,
  posByName: Map<string, OrgPosition>
): OrgPosition | null {
  if (!raw.trim()) return null;
  return posByName.get(normalizeMatchKey(raw)) ?? null;
}

export function orgUsersFromPlatformUsers(platformUsers: PlatformUser[]): OrgUser[] {
  return platformUsers
    .filter((p) => p.status !== "Inactivo")
    .map((p) => {
      const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.email;
      return {
        id: p.id,
        name,
        email: p.email,
        cargoId: p.cargoId,
        cargoName: p.cargoName,
        areaId: p.areaId,
        areaName: p.areaName,
        role: p.role,
        status: "Activo" as const,
        organizationId: p.organizationId,
      };
    });
}

export function mergeOrgUsersForImport(
  structureUsers: OrgUser[],
  platformUsers: PlatformUser[]
): OrgUser[] {
  const byId = new Map<string, OrgUser>();
  for (const u of structureUsers) {
    if (u.status !== "Inactivo") byId.set(u.id, u);
  }
  for (const u of orgUsersFromPlatformUsers(platformUsers)) {
    byId.set(u.id, { ...byId.get(u.id), ...u, name: u.name || byId.get(u.id)?.name || u.email });
  }
  return Array.from(byId.values());
}

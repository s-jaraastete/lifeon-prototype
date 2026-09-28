import type { PlatformUser } from "@/types/users";

const SUPERVISOR_CARGO_PATTERN =
  /supervisor|supervisora|jefe|jefa|capataz|responsable|l[ií]der|mandante|prevencion|prevenci[oó]n/i;

export function formatPlatformUserName(user: PlatformUser): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function filterSupervisorCandidates(users: PlatformUser[]): PlatformUser[] {
  const active = users.filter((u) => u.status === "Activo");
  const matched = active.filter((u) => SUPERVISOR_CARGO_PATTERN.test(u.cargoName ?? ""));
  return matched.length > 0 ? matched : active;
}

export function filterActiveParticipants(users: PlatformUser[]): PlatformUser[] {
  return users.filter((u) => u.status === "Activo");
}

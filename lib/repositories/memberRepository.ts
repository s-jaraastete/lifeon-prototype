import { getSupabaseClient } from "@/lib/supabaseClient";
import { logPersistenceError } from "@/lib/supabase/persistenceError";
import type { PlatformUser, UserPermissions, UserRole, UserStatus } from "@/types/users";

export interface MemberRow {
  id: string;
  organization_id: string;
  auth_user_id: string | null;
  user_id: string | null;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  identification_type: string | null;
  identification_number: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus | "Invitado";
  permissions: UserPermissions | Record<string, unknown>;
  cargo_id: string | null;
  area_id: string | null;
  work_center_id: string | null;
  created_at?: string;
  updated_at?: string;
}

function rowToPlatformUser(row: MemberRow, cargoName?: string, areaName?: string): PlatformUser {
  const firstName = row.first_name || row.name.split(" ")[0] || "";
  const lastName =
    row.last_name || row.name.split(" ").slice(1).join(" ") || "";
  return {
    id: row.id,
    firstName,
    lastName,
    identificationType: (row.identification_type as PlatformUser["identificationType"]) || "RUT",
    identificationNumber: row.identification_number || "",
    email: row.email,
    phone: row.phone || undefined,
    role: row.role,
    permissions: (row.permissions as UserPermissions) || undefined,
    status: row.status === "Invitado" ? "Inactivo" : (row.status as UserStatus),
    cargoId: row.cargo_id || undefined,
    cargoName,
    areaId: row.area_id || undefined,
    areaName,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchMembersByOrganization(orgId: string): Promise<PlatformUser[]> {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error) {
    logPersistenceError("members.fetch", error);
    return [];
  }
  return (data as MemberRow[]).map((r) => rowToPlatformUser(r));
}

export async function fetchMemberByAuthUser(
  authUserId: string
): Promise<MemberRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("organization_members")
    .select("*")
    .eq("auth_user_id", authUserId)
    .eq("status", "Activo")
    .limit(1)
    .maybeSingle();
  if (error) {
    logPersistenceError("members.byAuth", error);
    return null;
  }
  return data as MemberRow | null;
}

export async function fetchMemberByEmail(
  orgId: string,
  email: string
): Promise<MemberRow | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId)
    .ilike("email", email.trim())
    .maybeSingle();
  if (error) {
    logPersistenceError("members.byEmail", error);
    return null;
  }
  return data as MemberRow | null;
}

export async function upsertMember(
  orgId: string,
  user: PlatformUser,
  authUserId?: string | null
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const name = `${user.firstName} ${user.lastName}`.trim();
  const row = {
    id: user.id,
    organization_id: orgId,
    auth_user_id: authUserId ?? null,
    user_id: user.id,
    email: user.email,
    name,
    first_name: user.firstName,
    last_name: user.lastName,
    identification_type: user.identificationType,
    identification_number: user.identificationNumber,
    phone: user.phone ?? null,
    role: user.role,
    status: user.status,
    permissions: user.permissions ?? {},
    cargo_id: user.cargoId ?? null,
    area_id: user.areaId ?? null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await client.from("organization_members").upsert(row);
  if (error) {
    logPersistenceError("members.upsert", error);
    return false;
  }
  return true;
}

export async function deleteMember(orgId: string, memberId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client
    .from("organization_members")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", memberId);
  if (error) {
    logPersistenceError("members.delete", error);
    return false;
  }
  return true;
}

export async function ensureBootstrapMember(
  orgId: string,
  legacyUserId: string,
  email: string,
  name: string,
  authUserId?: string | null
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  const existing = await fetchMemberByEmail(orgId, email);
  if (existing) {
    if (authUserId && !existing.auth_user_id) {
      await client
        .from("organization_members")
        .update({ auth_user_id: authUserId, user_id: legacyUserId })
        .eq("id", existing.id);
    }
    return;
  }
  await client.from("organization_members").upsert({
    id: `mem_${legacyUserId}`,
    organization_id: orgId,
    user_id: legacyUserId,
    auth_user_id: authUserId ?? null,
    email,
    name,
    first_name: name.split(" ")[0],
    last_name: name.split(" ").slice(1).join(" "),
    role: "Administrador",
    status: "Activo",
    permissions: {},
  });
}

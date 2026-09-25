import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { defaultAppPasswordFromEmail } from "@/lib/server/defaultAppPassword";
import { ensureAreaForOrg, ensurePositionForOrg } from "@/lib/server/structureRefs";
import type { PlatformUser, UserRole, UserStatus } from "@/types/users";

export type ProvisionMemberInput = {
  id?: string;
  firstName: string;
  lastName: string;
  identificationType: PlatformUser["identificationType"];
  identificationNumber: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  cargoId?: string;
  areaId?: string;
  cargoName?: string;
  areaName?: string;
};

export async function findAuthUserIdByEmail(
  admin: SupabaseClient,
  email: string
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

export async function provisionOrganizationMember(
  admin: SupabaseClient,
  organizationId: string,
  input: ProvisionMemberInput
): Promise<PlatformUser> {
  const email = input.email.trim().toLowerCase();
  const memberId =
    input.id?.trim() ||
    `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const name = `${input.firstName} ${input.lastName}`.trim();
  const password = defaultAppPasswordFromEmail(email);
  const now = new Date().toISOString();

  let authUserId = await findAuthUserIdByEmail(admin, email);

  if (!authUserId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "No se pudo crear el acceso de autenticación");
    }
    authUserId = created.user.id;
  }
  // Existing Auth users keep their password; only new users receive the default password.

  await admin.from("profiles").upsert({ id: authUserId });

  let cargo_id = input.cargoId?.trim() || null;
  let area_id = input.areaId?.trim() || null;
  if (cargo_id) {
    await ensurePositionForOrg(admin, organizationId, cargo_id, input.cargoName);
  }
  if (area_id) {
    await ensureAreaForOrg(admin, organizationId, area_id, null);
  }
  if (cargo_id) {
    const { data } = await admin
      .from("positions")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", cargo_id)
      .maybeSingle();
    if (!data) cargo_id = null;
  }
  if (area_id) {
    const { data } = await admin
      .from("areas")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", area_id)
      .maybeSingle();
    if (!data) area_id = null;
  }

  const row = {
    id: memberId,
    organization_id: organizationId,
    auth_user_id: authUserId,
    user_id: memberId,
    email,
    name,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    identification_type: input.identificationType,
    identification_number: input.identificationNumber.trim(),
    phone: input.phone?.trim() || null,
    role: input.role,
    status: input.status,
    permissions: {},
    cargo_id: cargo_id,
    area_id: area_id,
    updated_at: now,
  };

  const { error: memberErr } = await admin.from("organization_members").upsert(row);
  if (memberErr) {
    throw new Error(memberErr.message);
  }

  let cargoName: string | undefined;
  if (cargo_id) {
    const { data: posRow } = await admin
      .from("positions")
      .select("name")
      .eq("id", cargo_id)
      .maybeSingle();
    cargoName = posRow?.name ?? input.cargoName;
  }

  return {
    id: memberId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    identificationType: input.identificationType,
    identificationNumber: input.identificationNumber.trim(),
    email,
    phone: input.phone?.trim() || undefined,
    role: input.role,
    status: input.status,
    cargoId: cargo_id || undefined,
    cargoName,
    areaId: area_id || undefined,
    organizationId,
    createdAt: now,
    updatedAt: now,
  };
}

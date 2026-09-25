import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { TEST_ACCOUNTS_CONFIG } from "@/lib/auth/authService";

export type BootstrapMemberInput = {
  organizationId: string;
  legacyUserId: string;
  email: string;
  name: string;
  authUserId: string;
};

async function linkMemberRow(
  admin: SupabaseClient,
  memberId: string,
  input: BootstrapMemberInput
): Promise<void> {
  const { error: linkErr } = await admin
    .from("organization_members")
    .update({
      auth_user_id: input.authUserId,
      user_id: input.legacyUserId,
      email: input.email.trim().toLowerCase(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", memberId);
  if (linkErr) throw new Error(linkErr.message);
}

/**
 * Links or creates organization_members for allowed test/bootstrap accounts only.
 * Uses service role; caller must have verified JWT email matches input email.
 */
export async function bootstrapOrganizationMemberIfAllowed(
  admin: SupabaseClient,
  input: BootstrapMemberInput
): Promise<{ linked: boolean; created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const orgId = input.organizationId.trim();
  const testAccount = TEST_ACCOUNTS_CONFIG[email];

  if (!testAccount || testAccount.orgId !== orgId) {
    throw new Error("Organización no autorizada para auto-vinculación");
  }

  const { data: existingByEmail, error: findErr } = await admin
    .from("organization_members")
    .select("id, auth_user_id, organization_id, email, role, status")
    .eq("organization_id", orgId)
    .ilike("email", email)
    .maybeSingle();

  if (findErr) {
    throw new Error(findErr.message);
  }

  if (existingByEmail) {
    if (existingByEmail.auth_user_id !== input.authUserId) {
      await linkMemberRow(admin, existingByEmail.id, input);
    }
    return { linked: true, created: false };
  }

  const legacyCandidates = [input.legacyUserId, `mem_${input.legacyUserId}`];
  for (const candidate of legacyCandidates) {
    const { data: byLegacy, error: legacyErr } = await admin
      .from("organization_members")
      .select("id, auth_user_id, organization_id, email, role, status")
      .eq("organization_id", orgId)
      .or(`user_id.eq.${candidate},id.eq.${candidate}`)
      .maybeSingle();

    if (legacyErr) {
      throw new Error(legacyErr.message);
    }
    if (byLegacy) {
      await linkMemberRow(admin, byLegacy.id, input);
      return { linked: true, created: false };
    }
  }

  const { count, error: countErr } = await admin
    .from("organization_members")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if (countErr) {
    throw new Error(countErr.message);
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "No se encontró tu usuario en la organización. Contacta a un administrador para vincular tu acceso."
    );
  }

  const parts = input.name.trim().split(/\s+/);
  const firstName = parts[0] || input.name;
  const lastName = parts.slice(1).join(" ");

  const { error: insertErr } = await admin.from("organization_members").insert({
    id: `mem_${input.legacyUserId}`,
    organization_id: orgId,
    user_id: input.legacyUserId,
    auth_user_id: input.authUserId,
    email,
    name: input.name,
    first_name: firstName,
    last_name: lastName,
    role: "Administrador",
    status: "Activo",
    permissions: {},
  });

  if (insertErr) {
    throw new Error(insertErr.message);
  }

  return { linked: false, created: true };
}

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TestAccountConfig } from "@/lib/auth/authService";
import { defaultAppPasswordFromEmail } from "@/lib/server/defaultAppPassword";

const ALLOWED_ORGS = new Set([
  "org_luis",
  "org_sergio",
  "org_aldo",
  "org_gonzalo_c",
  "org_gonzalo_b",
  "org_rene",
  "org_alex",
  "org_carlos",
]);

const ORG_META: Record<
  string,
  { industry: string; size: string }
> = {
  org_luis: { industry: "Construcción", size: "51-200" },
  org_sergio: { industry: "Construcción", size: "51-200" },
  org_aldo: { industry: "Construcción", size: "51-200" },
  org_gonzalo_c: { industry: "Construcción", size: "51-200" },
  org_gonzalo_b: { industry: "Construcción", size: "51-200" },
  org_rene: { industry: "Consultoría en Prevención", size: "1-20" },
  org_alex: { industry: "Construcción", size: "21-50" },
  org_carlos: { industry: "Construcción", size: "21-50" },
};

async function clearAuthUserProfileMedia(
  admin: SupabaseClient,
  authUserId: string
): Promise<void> {
  try {
    const { data: listed } = await admin.storage.from("avatars").list(authUserId, { limit: 100 });
    if (listed?.length) {
      await admin.storage
        .from("avatars")
        .remove(listed.map((f) => `${authUserId}/${f.name}`));
    }
  } catch {
    /* noop */
  }

  const fallbackPaths = ["png", "jpg", "jpeg", "webp", "gif"].flatMap((ext) => [
    `${authUserId}/avatar.${ext}`,
    `${authUserId}/photo.${ext}`,
  ]);
  try {
    await admin.storage.from("avatars").remove(fallbackPaths);
  } catch {
    /* noop */
  }

  await admin.from("profiles").update({ avatar_path: null }).eq("id", authUserId);
}

async function findAuthUserIdByEmail(
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

export async function purgeTestOrganizationData(
  admin: SupabaseClient,
  orgId: string,
  account?: TestAccountConfig
): Promise<void> {
  if (!ALLOWED_ORGS.has(orgId)) {
    throw new Error("Organización no autorizada para restablecimiento");
  }

  const { error: deliveriesErr } = await admin
    .from("document_deliveries")
    .delete()
    .eq("organization_id", orgId);
  if (
    deliveriesErr &&
    !deliveriesErr.message.includes("does not exist") &&
    !deliveriesErr.message.includes("schema cache")
  ) {
    throw new Error(`document_deliveries: ${deliveriesErr.message}`);
  }

  try {
    const { data: ackFiles } = await admin.storage
      .from("acknowledgement-evidence")
      .list(orgId, { limit: 1000 });
    if (ackFiles?.length) {
      const paths = ackFiles.map((f) => `${orgId}/${f.name}`);
      await admin.storage.from("acknowledgement-evidence").remove(paths);
    }
  } catch {
    /* noop */
  }

  if (account?.email) {
    const authUserId = await findAuthUserIdByEmail(admin, account.email);
    if (authUserId) {
      await clearAuthUserProfileMedia(admin, authUserId);
    }
  }

  if (account?.id) {
    try {
      await admin.storage.from("avatars").remove([
        `${account.id}/avatar.png`,
        `${account.id}/photo.png`,
        `${account.id}/avatar.jpg`,
        `${account.id}/avatar.jpeg`,
        `${account.id}/avatar.webp`,
      ]);
    } catch {
      /* noop */
    }
  }

  try {
    await admin.storage.from("organization-logos").remove([
      `${orgId}/logo.png`,
      `${orgId}/logo.jpg`,
      `${orgId}/logo.jpeg`,
      `${orgId}/logo.webp`,
      `${orgId}/logo.svg`,
    ]);
    const { data: logoFiles } = await admin.storage
      .from("organization-logos")
      .list(orgId, { limit: 100 });
    if (logoFiles?.length) {
      await admin.storage
        .from("organization-logos")
        .remove(logoFiles.map((f) => `${orgId}/${f.name}`));
    }
  } catch {
    /* noop */
  }

  await admin
    .from("organizations")
    .update({ logo_url: null, logo_path: null })
    .eq("id", orgId);

  await admin.from("organization_members").delete().eq("organization_id", orgId);
  await admin.from("positions").delete().eq("organization_id", orgId);
  await admin.from("subprocesses").delete().eq("organization_id", orgId);
  await admin.from("processes").delete().eq("organization_id", orgId);
  await admin.from("areas").delete().eq("organization_id", orgId);
  await admin.from("work_centers").delete().eq("organization_id", orgId);

  await admin.from("preventive_evidence").delete().eq("organization_id", orgId);
  await admin.from("preventive_activities").delete().eq("organization_id", orgId);
  await admin.from("preventive_plans").delete().eq("organization_id", orgId);
  await admin.from("technical_documents").delete().eq("organization_id", orgId);
  await admin.from("preventive_docs").delete().like("id", `${orgId}_%`);
  await admin
    .from("iper_matrices")
    .delete()
    .or(`organization_id.eq.${orgId},id.like.${orgId}_%`);
  await admin.from("org_structure").delete().in("id", [`structure_${orgId}`, orgId]);
  await admin
    .from("organization_preferences")
    .delete()
    .or(`id.eq.${orgId},organization_id.eq.${orgId}`);
}

export async function reseedTestOrganizationBootstrap(
  admin: SupabaseClient,
  account: TestAccountConfig
): Promise<void> {
  const orgId = account.orgId;
  if (!ALLOWED_ORGS.has(orgId)) {
    throw new Error("Organización no autorizada para restablecimiento");
  }

  const meta = ORG_META[orgId] ?? { industry: "Construcción", size: "1-20" };

  await admin.from("organizations").upsert({
    id: orgId,
    name: account.orgName,
    industry: meta.industry,
    size: meta.size,
    status: "Activo",
    logo_url: null,
    logo_path: null,
  });

  await admin.from("organization_preferences").upsert({
    id: orgId,
    organization_id: orgId,
    preferences: {
      onboardingCompleted: false,
      organizationLogo: null,
      profilePhoto: null,
    },
  });

  await admin.from("preventive_plans").upsert({
    id: `plan_${orgId}`,
    organization_id: orgId,
    name: "Programa Anual",
    status: "Activo",
  });

  const email = account.email.trim().toLowerCase();
  const password = defaultAppPasswordFromEmail(email);
  let authUserId = await findAuthUserIdByEmail(admin, email);

  if (!authUserId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "No se pudo restaurar el acceso del administrador");
    }
    authUserId = created.user.id;
  } else {
    await admin.auth.admin.updateUserById(authUserId, { password });
  }

  const memberId = `mem_${account.id}`;
  const firstName = account.name.split(" ")[0] || account.name;
  const lastName = account.name.split(" ").slice(1).join(" ") || "";

  await admin.from("organization_members").upsert({
    id: memberId,
    organization_id: orgId,
    auth_user_id: authUserId,
    user_id: account.id,
    email,
    name: account.name,
    first_name: firstName,
    last_name: lastName,
    role: "Administrador",
    status: "Activo",
    permissions: {},
  });

  await admin.from("profiles").upsert({
    id: authUserId,
    first_name: firstName,
    last_name: lastName || null,
    avatar_path: null,
  });
}

export async function resetTestOrganization(
  admin: SupabaseClient,
  account: TestAccountConfig
): Promise<void> {
  await purgeTestOrganizationData(admin, account.orgId, account);
  await reseedTestOrganizationBootstrap(admin, account);
}

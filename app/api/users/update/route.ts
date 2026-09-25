import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { canAssignMemberRole, requireOrgEditor } from "@/lib/server/orgSessionGuard";
import { ensureAreaForOrg, ensurePositionForOrg } from "@/lib/server/structureRefs";
import type { PlatformUser } from "@/types/users";

type UpdateBody = {
  organizationId?: string;
  memberId?: string;
  updates?: Partial<PlatformUser>;
};

async function resolveForeignKeys(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  organizationId: string,
  cargoId?: string | null,
  areaId?: string | null
): Promise<{ cargo_id: string | null; area_id: string | null }> {
  let cargo_id = cargoId?.trim() || null;
  let area_id = areaId?.trim() || null;

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

  return { cargo_id, area_id };
}

export async function PATCH(request: Request) {
  let body: UpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim() ?? "";
  const memberId = body.memberId?.trim() ?? "";
  const updates = body.updates;

  if (!organizationId || !memberId || !updates) {
    return NextResponse.json(
      { error: "Faltan organizationId, memberId o updates" },
      { status: 400 }
    );
  }

  const auth = await requireOrgEditor(request, organizationId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (updates.role !== undefined && !canAssignMemberRole(auth.ctx.role, updates.role)) {
    return NextResponse.json(
      { error: "Solo un Administrador puede asignar rol Administrador" },
      { status: 403 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servicio de administración no disponible" },
      { status: 503 }
    );
  }

  const { data: existing, error: fetchErr } = await admin
    .from("organization_members")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", memberId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const firstName =
    updates.firstName?.trim() ?? existing.first_name ?? existing.name?.split(" ")[0] ?? "";
  const lastName =
    updates.lastName?.trim() ??
    existing.last_name ??
    existing.name?.split(" ").slice(1).join(" ") ??
    "";
  const name = `${firstName} ${lastName}`.trim() || existing.name;

  const cargoInput =
    updates.cargoId !== undefined ? updates.cargoId || null : existing.cargo_id;
  const areaInput =
    updates.areaId !== undefined ? updates.areaId || null : existing.area_id;

  if (cargoInput) {
    await ensurePositionForOrg(admin, organizationId, cargoInput, updates.cargoName);
  }
  if (areaInput) {
    await ensureAreaForOrg(admin, organizationId, areaInput, updates.areaName);
  }

  const { cargo_id, area_id } = await resolveForeignKeys(
    admin,
    organizationId,
    cargoInput,
    areaInput
  );

  const patch = {
    name,
    first_name: firstName,
    last_name: lastName,
    identification_type: updates.identificationType ?? existing.identification_type,
    identification_number:
      updates.identificationNumber?.trim() ?? existing.identification_number,
    email: updates.email?.trim().toLowerCase() ?? existing.email,
    phone: updates.phone !== undefined ? updates.phone?.trim() || null : existing.phone,
    role: updates.role ?? existing.role,
    status: updates.status ?? existing.status,
    cargo_id,
    area_id,
    auth_user_id: existing.auth_user_id,
    user_id: existing.user_id,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error: saveErr } = await admin
    .from("organization_members")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", memberId)
    .select("*")
    .single();

  if (saveErr || !saved) {
    return NextResponse.json(
      { error: saveErr?.message ?? "No se pudo actualizar el usuario" },
      { status: 500 }
    );
  }

  let cargoName = updates.cargoName;
  if (saved.cargo_id && !cargoName) {
    const { data: posRow } = await admin
      .from("positions")
      .select("name")
      .eq("id", saved.cargo_id)
      .maybeSingle();
    cargoName = posRow?.name ?? undefined;
  }

  let areaName = updates.areaName;
  if (saved.area_id && !areaName) {
    const { data: areaRow } = await admin
      .from("areas")
      .select("name")
      .eq("id", saved.area_id)
      .maybeSingle();
    areaName = areaRow?.name ?? undefined;
  }

  const member: PlatformUser = {
    id: saved.id,
    firstName: saved.first_name || firstName,
    lastName: saved.last_name || lastName,
    identificationType: saved.identification_type,
    identificationNumber: saved.identification_number || "",
    email: saved.email,
    phone: saved.phone || undefined,
    role: saved.role,
    status: saved.status === "Invitado" ? "Inactivo" : saved.status,
    cargoId: saved.cargo_id || undefined,
    areaId: saved.area_id || undefined,
    organizationId,
    updatedAt: saved.updated_at,
    createdAt: saved.created_at,
  };

  if (updates.cargoName) member.cargoName = updates.cargoName;
  if (updates.areaName) member.areaName = updates.areaName;
  if (cargoName) member.cargoName = cargoName;
  if (areaName) member.areaName = areaName;

  return NextResponse.json({ success: true, member });
}

import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireOrgEditor } from "@/lib/server/orgSessionGuard";
import {
  provisionOrganizationMember,
  type ProvisionMemberInput,
} from "@/lib/server/memberProvisioning";

export async function POST(request: Request) {
  let body: { organizationId?: string; member?: ProvisionMemberInput };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const organizationId = body.organizationId?.trim() ?? "";
  const member = body.member;

  if (!organizationId || !member?.email || !member.firstName || !member.lastName) {
    return NextResponse.json(
      { error: "Faltan organizationId o datos obligatorios del usuario" },
      { status: 400 }
    );
  }

  const auth = await requireOrgEditor(request, organizationId);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Servicio de administración no disponible (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 }
    );
  }

  try {
    const saved = await provisionOrganizationMember(admin, organizationId, member);
    return NextResponse.json({ success: true, member: saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo crear el usuario";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

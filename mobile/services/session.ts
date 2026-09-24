import { getSupabase } from "@/services/supabase";
import type { MemberContext } from "@/types/models";
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "@/services/secureStorage";

const SELECTED_MEMBER_KEY = "lifeon_selected_member_id";

function mapMember(row: Record<string, unknown>, fallbackAuthUserId?: string): MemberContext {
  const org = row.organizations as { name: string } | { name: string }[] | null;
  const pos = row.positions as { name: string } | { name: string }[] | null;
  const wc = row.work_centers as { name: string } | { name: string }[] | null;
  const orgName = Array.isArray(org) ? org[0]?.name : org?.name;
  const posName = Array.isArray(pos) ? pos[0]?.name : pos?.name;
  const wcName = Array.isArray(wc) ? wc[0]?.name : wc?.name;
  const displayName =
    row.first_name || row.last_name
      ? `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim()
      : String(row.name);
  return {
    memberId: String(row.id),
    organizationId: String(row.organization_id),
    organizationName: orgName ?? String(row.organization_id),
    email: String(row.email),
    displayName: displayName || String(row.name),
    role: row.role as MemberContext["role"],
    cargoId: (row.cargo_id as string | null) ?? null,
    cargoName: posName ?? null,
    workCenterId: (row.work_center_id as string | null) ?? null,
    workCenterName: wcName ?? null,
    authUserId: String(row.auth_user_id ?? fallbackAuthUserId ?? ""),
  };
}

const MEMBER_SELECT = `
  id, organization_id, email, name, first_name, last_name, role,
  cargo_id, work_center_id, auth_user_id,
  organizations ( name ),
  positions ( name ),
  work_centers ( name )
`;

async function linkAuthUserOnMembers(
  authUserId: string,
  rows: { id: string; auth_user_id: string | null }[]
): Promise<void> {
  const supabase = getSupabase();
  const toLink = rows.filter((r) => !r.auth_user_id);
  await Promise.all(
    toLink.map((r) =>
      supabase.from("organization_members").update({ auth_user_id: authUserId }).eq("id", r.id)
    )
  );
}

export async function fetchActiveMemberships(
  authUserId: string,
  email?: string | null
): Promise<MemberContext[]> {
  const supabase = getSupabase();

  const queryByAuth = async () => {
    const { data, error } = await supabase
      .from("organization_members")
      .select(MEMBER_SELECT)
      .eq("auth_user_id", authUserId)
      .eq("status", "Activo");
    if (error) throw new Error(error.message);
    return data ?? [];
  };

  let rows = await queryByAuth();

  if (rows.length === 0 && email?.trim()) {
    const { data, error } = await supabase
      .from("organization_members")
      .select(MEMBER_SELECT)
      .ilike("email", email.trim())
      .eq("status", "Activo");
    if (error) throw new Error(error.message);
    rows = data ?? [];
    if (rows.length > 0) {
      await linkAuthUserOnMembers(
        authUserId,
        rows as { id: string; auth_user_id: string | null }[]
      );
      rows = await queryByAuth();
      if (rows.length === 0) {
        rows = data ?? [];
      }
    }
  }

  return rows.map((row) => mapMember(row as Record<string, unknown>, authUserId));
}

export async function loadSelectedMemberId(): Promise<string | null> {
  return getSecureItem(SELECTED_MEMBER_KEY);
}

export async function saveSelectedMemberId(memberId: string): Promise<void> {
  await setSecureItem(SELECTED_MEMBER_KEY, memberId);
}

export async function clearSelectedMemberId(): Promise<void> {
  await deleteSecureItem(SELECTED_MEMBER_KEY);
}

export function resolveActiveMember(
  memberships: MemberContext[],
  selectedId: string | null
): MemberContext | null {
  if (memberships.length === 0) return null;
  if (selectedId) {
    const found = memberships.find((m) => m.memberId === selectedId);
    if (found) return found;
  }
  if (memberships.length === 1) return memberships[0];
  return null;
}

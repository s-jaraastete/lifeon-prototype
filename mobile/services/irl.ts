import { getSupabase } from "@/services/supabase";
import type { IrlMatrixEntry, MemberContext } from "@/types/models";

export type IrlMemberScope = {
  memberId: string;
  organizationId: string;
};

export function irlScopeFromMember(
  member: MemberContext | null | undefined
): IrlMemberScope | null {
  if (!member?.memberId || !member.organizationId) {
    return null;
  }
  return { memberId: member.memberId, organizationId: member.organizationId };
}

export function findIrlEntryByMatrixId(
  entries: IrlMatrixEntry[],
  matrixId: string
): IrlMatrixEntry | undefined {
  const target = matrixId.trim();
  return entries.find(
    (e) =>
      e.matrixId === target ||
      e.matrixId.endsWith(`_${target}`) ||
      target.endsWith(`_${e.matrixId}`)
  );
}

export async function fetchMyIrl(scope?: IrlMemberScope | null): Promise<IrlMatrixEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_my_irl");
  if (error) {
    throw new Error(error.message);
  }
  if (!data || !Array.isArray(data)) {
    return [];
  }
  let list = data as IrlMatrixEntry[];
  if (scope) {
    list = list.filter(
      (entry) =>
        entry.memberId === scope.memberId && entry.organizationId === scope.organizationId
    );
  }
  return list;
}

export function consequencesForLevel(level?: string): string {
  switch (level) {
    case "Crítico":
      return "Muerte, invalidez total, traumatismo severo, atrapamiento.";
    case "Alto":
      return "Fracturas, quemaduras graves, daño musculoesquelético o auditivo.";
    default:
      return "Contusiones, cortes menores, fatiga o irritación temporal.";
  }
}

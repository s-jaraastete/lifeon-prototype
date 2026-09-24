import { getSupabase } from "@/services/supabase";
import type { IrlMatrixEntry } from "@/types/models";

export async function fetchMyIrl(): Promise<IrlMatrixEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_my_irl");
  if (error) {
    throw new Error(error.message);
  }
  if (!data || !Array.isArray(data)) {
    return [];
  }
  return data as IrlMatrixEntry[];
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

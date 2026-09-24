import type { SupabaseClient } from "@supabase/supabase-js";
import {
  iperMatrixIdCandidates,
  scopedIperMatrixId,
} from "@/lib/utils/iperMatrixPersistence";

export { scopedIperMatrixId, iperMatrixIdCandidates };

type IperMatrixRow = Record<string, unknown> & {
  id: string;
  status?: string;
};

export async function fetchVigenteIperMatrixForOrg(
  admin: SupabaseClient,
  organizationId: string,
  sourceId: string
): Promise<{ matrix: IperMatrixRow | null; error?: string }> {
  const candidates = iperMatrixIdCandidates(sourceId, organizationId);

  for (const id of candidates) {
    const { data, error } = await admin
      .from("iper_matrices")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .eq("status", "Vigente")
      .maybeSingle();

    if (error) {
      return { matrix: null, error: error.message };
    }
    if (data) {
      return { matrix: data as IperMatrixRow };
    }
  }

  for (const id of candidates) {
    const { data } = await admin
      .from("iper_matrices")
      .select("id, status")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (data) {
      const status = String((data as { status?: string }).status ?? "");
      if (status !== "Vigente") {
        return {
          matrix: null,
          error: `La matriz IPER está en estado «${status}». Debe estar Vigente en el servidor para enviar el IRL.`,
        };
      }
    }
  }

  return {
    matrix: null,
    error:
      "Matriz IPER no vigente o no encontrada en el servidor. Publica la matriz como Vigente y verifica que se haya sincronizado con Supabase.",
  };
}

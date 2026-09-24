import { NextResponse } from "next/server";
import { getSupabasePublicConfigStatus } from "@/lib/supabaseClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

/**
 * Comprueba configuración pública y conectividad básica (sin exponer datos por tenant).
 */
export async function GET() {
  const config = getSupabasePublicConfigStatus();

  if (!config.configured) {
    return NextResponse.json({
      ok: false,
      config,
      hint:
        "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno del build.",
    });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({
      ok: config.configured,
      config,
      reachable: null,
      hint:
        "Configuración pública OK. Define SUPABASE_SERVICE_ROLE_KEY en el servidor para comprobar conectividad a la base.",
    });
  }

  const { error: pingError } = await admin
    .from("iper_matrices")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    ok: !pingError,
    config,
    reachable: !pingError,
    error: pingError?.message ?? null,
    hint: pingError
      ? "Revisa credenciales service_role y estado del proyecto Supabase."
      : "Conexión PostgREST OK (comprobación con service_role en servidor).",
  });
}

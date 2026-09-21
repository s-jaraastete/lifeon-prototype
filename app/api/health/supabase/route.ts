import { NextResponse } from "next/server";
import {
  getSupabaseClient,
  getSupabasePublicConfigStatus,
} from "@/lib/supabaseClient";

const TRACKED_ORGS = [
  "org_sergio",
  "org_luis",
  "org_aldo",
  "org_gonzalo_c",
  "org_gonzalo_b",
  "org_rene",
  "org_alex",
  "org_carlos",
  "org_demo",
];

async function countForOrg(
  table: "iper_matrices" | "preventive_docs" | "organization_preferences" | "org_structure",
  orgId: string
): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  if (table === "organization_preferences") {
    const targetId = orgId === "org_demo" ? "default_org" : orgId;
    const { count, error } = await client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("id", targetId);
    return error ? null : count ?? 0;
  }

  if (table === "org_structure") {
    const targetId = orgId === "org_demo" ? "default_structure" : `structure_${orgId}`;
    const { count, error } = await client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("id", targetId);
    return error ? null : count ?? 0;
  }

  if (table === "iper_matrices") {
    if (orgId === "org_demo") {
      const { count, error } = await client
        .from(table)
        .select("id", { count: "exact", head: true })
        .or("id.like.org_demo_%,id.like.MA-%,id.in.(1,2,3,4,5,6,7)");
      return error ? null : count ?? 0;
    }
    const { count, error } = await client
      .from(table)
      .select("id", { count: "exact", head: true })
      .like("id", `${orgId}_%`);
    return error ? null : count ?? 0;
  }

  if (orgId === "org_demo") {
    const { count, error } = await client
      .from(table)
      .select("id", { count: "exact", head: true })
      .or("id.like.DOC-%,id.like.org_demo_%");
    return error ? null : count ?? 0;
  }

  const { count, error } = await client
    .from(table)
    .select("id", { count: "exact", head: true })
    .like("id", `${orgId}_%`);
  return error ? null : count ?? 0;
}

/**
 * Comprueba conexión Supabase y conteos por organización (diagnóstico multi-cuenta).
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

  const client = getSupabaseClient();
  if (!client) {
    return NextResponse.json({
      ok: false,
      config,
      hint: "Cliente Supabase no inicializado.",
    });
  }

  const { error: pingError } = await client
    .from("iper_matrices")
    .select("id", { count: "exact", head: true });

  const tenants: Record<
    string,
    {
      preferences: number | null;
      orgStructure: number | null;
      iperMatrices: number | null;
      preventiveDocs: number | null;
    }
  > = {};

  for (const orgId of TRACKED_ORGS) {
    tenants[orgId] = {
      preferences: await countForOrg("organization_preferences", orgId),
      orgStructure: await countForOrg("org_structure", orgId),
      iperMatrices: await countForOrg("iper_matrices", orgId),
      preventiveDocs: await countForOrg("preventive_docs", orgId),
    };
  }

  return NextResponse.json({
    ok: !pingError,
    config,
    error: pingError?.message ?? null,
    tenants,
    hint: pingError
      ? "Revisa schema.sql y RLS en Supabase."
      : "Cada orgId debería tener sus propias filas (prefijos org_*). Documentación preventiva compartía DOC-* global hasta el fix de scoping.",
  });
}

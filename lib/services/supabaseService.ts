import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { OrganizationPreferences } from "@/types/preferences";
import { OrgArea } from "@/types/orgStructure";
import { PreventiveDoc } from "@/types/preventiveDocs";
import { DEFAULT_PREVENTIVE_DOCS } from "@/data/defaultPreventiveDocs";
import { getDefaultOrgStructure } from "@/hooks/useOrgStructure";
import { INITIAL_MATRICES } from "@/app/dashboard/components/IperMatrixView";

export interface SupabaseConnectionStatus {
  isConfigured: boolean;
  connected: boolean;
  latencyMs?: number;
  message?: string;
  error?: string;
}

/**
 * Prueba la conexión en vivo con Supabase calculando la latencia en milisegundos.
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      connected: false,
      message: "Variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY no configuradas. La plataforma opera en modo local (localStorage).",
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      isConfigured: false,
      connected: false,
      error: "No se pudo instanciar el cliente de Supabase.",
    };
  }

  const start = performance.now();
  try {
    const { data, error } = await client
      .from("organization_preferences")
      .select("id")
      .limit(1);

    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      // Si la tabla aún no existe, nos conectamos a Postgres pero falta correr el schema
      if (error.code === "42P01") {
        return {
          isConfigured: true,
          connected: true,
          latencyMs,
          message: "Conexión a Supabase exitosa, pero las tablas aún no han sido creadas. Ejecuta el script schema.sql en el SQL Editor.",
        };
      }
      return {
        isConfigured: true,
        connected: false,
        latencyMs,
        error: `Error de Supabase: ${error.message} (${error.code || "unknown"})`,
      };
    }

    return {
      isConfigured: true,
      connected: true,
      latencyMs,
      message: `Conexión exitosa a Supabase (${latencyMs}ms de latencia).`,
    };
  } catch (err: any) {
    return {
      isConfigured: true,
      connected: false,
      error: err?.message || "Fallo inesperado al conectar con Supabase.",
    };
  }
}

// ============================================================================
// SERVICIOS DE PREFERENCIAS
// ============================================================================
export async function savePreferencesToSupabase(prefs: OrganizationPreferences): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from("organization_preferences")
      .upsert({ id: "default_org", preferences: prefs });

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al guardar preferencias en Supabase:", e);
    return false;
  }
}

export async function fetchPreferencesFromSupabase(): Promise<OrganizationPreferences | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("organization_preferences")
      .select("preferences")
      .eq("id", "default_org")
      .maybeSingle();

    if (error || !data) return null;
    return data.preferences as OrganizationPreferences;
  } catch (e) {
    console.warn("Error al obtener preferencias de Supabase:", e);
    return null;
  }
}

// ============================================================================
// SERVICIOS DE ESTRUCTURA ORGANIZACIONAL
// ============================================================================
export async function saveOrgStructureToSupabase(areas: OrgArea[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from("org_structure")
      .upsert({ id: "default_structure", areas });

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al guardar estructura organizacional en Supabase:", e);
    return false;
  }
}

export async function fetchOrgStructureFromSupabase(): Promise<OrgArea[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("org_structure")
      .select("areas")
      .eq("id", "default_structure")
      .maybeSingle();

    if (error || !data) return null;
    return data.areas as OrgArea[];
  } catch (e) {
    console.warn("Error al obtener estructura organizacional de Supabase:", e);
    return null;
  }
}

// ============================================================================
// SERVICIOS DE DOCUMENTACIÓN PREVENTIVA
// ============================================================================
export async function savePreventiveDocsToSupabase(docs: PreventiveDoc[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const rows = docs.map((d) => ({
      id: d.id,
      code: d.code,
      title: d.title,
      category: d.category,
      regulatory_basis: d.regulatoryBasis,
      version: d.version,
      status: d.status,
      author: d.author,
      approver: d.approver || null,
      issue_date: d.issueDate,
      expiry_date: d.expiryDate,
      days_remaining: d.daysRemaining,
      source: d.source,
      has_file: d.hasFile,
      file_name: d.fileName || null,
      file_size: d.fileSize || null,
      content_sections: d.contentSections || [],
      audit_checklist: d.auditChecklist || [],
      audit_score: d.auditScore,
      audit_status: d.auditStatus,
    }));

    const { error } = await client.from("preventive_docs").upsert(rows);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al guardar documentos preventivos en Supabase:", e);
    return false;
  }
}

export async function fetchPreventiveDocsFromSupabase(): Promise<PreventiveDoc[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("preventive_docs")
      .select("*")
      .order("code", { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      category: row.category,
      version: row.version,
      regulatoryBasis: row.regulatory_basis || "Normativa Legal Vigente",
      status: row.status,
      author: row.author || "Depto. Prevención de Riesgos",
      approver: row.approver || undefined,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      daysRemaining: row.days_remaining,
      source: row.source || "Plantilla del Sistema",
      hasFile: Boolean(row.has_file),
      fileName: row.file_name || undefined,
      fileSize: row.file_size || undefined,
      contentSections: row.content_sections || [],
      auditChecklist: row.audit_checklist || [],
      auditScore: row.audit_score || 0,
      auditStatus: row.audit_status,
    }));
  } catch (e) {
    console.warn("Error al recuperar documentos preventivos de Supabase:", e);
    return null;
  }
}

// ============================================================================
// SERVICIOS DE MATRICES IPER
// ============================================================================
export async function saveIperMatricesToSupabase(matrices: any[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const rows = matrices.map((m) => ({
      id: m.id,
      code: m.code,
      title: m.title,
      area: m.area,
      work_center: m.workCenter,
      responsible: m.responsible,
      status: m.status,
      progress: m.progress,
      total_risks: m.totalRisks,
      critical_risks: m.criticalRisks,
      last_review: m.lastReview,
      next_review: m.nextReview,
      hazards: m.hazards || [],
    }));

    const { error } = await client.from("iper_matrices").upsert(rows);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al guardar matrices IPER en Supabase:", e);
    return false;
  }
}

export async function fetchIperMatricesFromSupabase(): Promise<any[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from("iper_matrices")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      area: row.area,
      workCenter: row.work_center,
      responsible: row.responsible,
      status: row.status,
      progress: row.progress,
      totalRisks: row.total_risks,
      criticalRisks: row.critical_risks,
      lastReview: row.last_review,
      nextReview: row.next_review,
      hazards: row.hazards,
    }));
  } catch (e) {
    console.warn("Error al recuperar matrices IPER de Supabase:", e);
    return null;
  }
}

// ============================================================================
// SEMBRADOR INICIAL (SEEDER) CON 1-CLIC
// ============================================================================
export async function seedInitialDataToSupabase(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: "Configura primero tu NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
    };
  }

  try {
    // 1. Estructura por defecto
    const defaultAreas = getDefaultOrgStructure("Construcción");
    await saveOrgStructureToSupabase(defaultAreas);

    // 2. Documentos preventivos por defecto
    await savePreventiveDocsToSupabase(DEFAULT_PREVENTIVE_DOCS);

    // 3. Matrices iniciales
    await saveIperMatricesToSupabase(INITIAL_MATRICES);

    return {
      success: true,
      message: "¡Datos iniciales sembrados con éxito en Supabase (Estructura, Documentación Preventiva y Matrices IPER)!",
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error durante la siembra de datos: ${err?.message || "desconocido"}`,
    };
  }
}

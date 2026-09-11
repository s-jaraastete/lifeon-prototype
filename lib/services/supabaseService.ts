import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { OrganizationPreferences } from "@/types/preferences";
import {
  OrgArea,
  OrgStructureData,
  OrgWorkCenter,
  OrgPosition,
  OrgUser,
} from "@/types/orgStructure";
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
export async function savePreferencesToSupabase(prefs: OrganizationPreferences, orgId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const targetId = (!orgId || orgId === "org_demo") ? "default_org" : orgId;

  try {
    const { error } = await client
      .from("organization_preferences")
      .upsert({ id: targetId, preferences: prefs });

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al guardar preferencias en Supabase:", e);
    return false;
  }
}

export async function fetchPreferencesFromSupabase(orgId?: string): Promise<OrganizationPreferences | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const targetId = (!orgId || orgId === "org_demo") ? "default_org" : orgId;

  try {
    const { data, error } = await client
      .from("organization_preferences")
      .select("preferences")
      .eq("id", targetId)
      .maybeSingle();

    if (error || !data) return null;
    return data.preferences as OrganizationPreferences;
  } catch (e) {
    console.warn("Error al obtener preferencias de Supabase:", e);
    return null;
  }
}

export async function savePreventiveActivitiesToSupabase(activities: any[], orgId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const currentPrefs = (await fetchPreferencesFromSupabase(orgId)) || ({} as any);
    const updatedPrefs: OrganizationPreferences = {
      ...currentPrefs,
      preventiveActivities: activities,
      moduleConfigurations: {
        ...(currentPrefs.moduleConfigurations || {}),
        miper: currentPrefs.moduleConfigurations?.miper || {
          configured: false,
          methodology: "pending",
          confirmed: false,
        },
        preventivePlanning: {
          ...(currentPrefs.moduleConfigurations?.preventivePlanning || {}),
          configured: activities.length > 0,
          hasExistingProgram: activities.length > 0,
          configuredAt: currentPrefs.moduleConfigurations?.preventivePlanning?.configuredAt || new Date().toISOString(),
        },
      },
    };
    return await savePreferencesToSupabase(updatedPrefs, orgId);
  } catch (e) {
    console.warn("Error al guardar actividades preventivas en Supabase:", e);
    return false;
  }
}

export async function fetchPreventiveActivitiesFromSupabase(orgId?: string): Promise<any[] | null> {
  try {
    const prefs = await fetchPreferencesFromSupabase(orgId);
    if (prefs && Array.isArray(prefs.preventiveActivities)) {
      return prefs.preventiveActivities;
    }
    return null;
  } catch (e) {
    console.warn("Error al obtener actividades preventivas de Supabase:", e);
    return null;
  }
}

export async function uploadFileToSupabaseStorage(bucket: string, filePath: string, file: Blob | File): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { error: uploadError } = await client.storage.from(bucket).upload(filePath, file, {
      upsert: true,
      contentType: file.type || "image/png",
    });

    if (uploadError) {
      console.warn(`Supabase Storage upload warning in bucket ${bucket}:`, uploadError);
      return null;
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(filePath);
    return publicUrlData?.publicUrl || null;
  } catch (e) {
    console.warn(`Error al subir archivo a bucket ${bucket} en Supabase:`, e);
    return null;
  }
}

// ============================================================================
// SERVICIOS DE ESTRUCTURA ORGANIZACIONAL
// ============================================================================
export async function saveOrgStructureToSupabase(
  data: OrgStructureData | OrgArea[],
  orgId?: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const currentOrg = orgId || "org_demo";
  const targetId = currentOrg === "org_demo" ? "default_structure" : `structure_${currentOrg}`;

  let payload: OrgStructureData;
  if (Array.isArray(data)) {
    payload = {
      workCenters: [],
      areas: data,
      positions: [],
      users: [],
      lastUpdated: new Date().toISOString(),
    };
  } else {
    payload = {
      workCenters: data.workCenters || [],
      areas: data.areas || [],
      positions: data.positions || [],
      users: data.users || [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  }

  try {
    const { error } = await client
      .from("org_structure")
      .upsert({ id: targetId, areas: payload });

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al guardar estructura organizacional en Supabase:", e);
    return false;
  }
}

export async function fetchOrgStructureFromSupabase(orgId?: string): Promise<OrgStructureData | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const currentOrg = orgId || "org_demo";
  const targetId = currentOrg === "org_demo" ? "default_structure" : `structure_${currentOrg}`;

  try {
    const possibleIds = currentOrg === "org_demo"
      ? ["default_structure"]
      : [`structure_${currentOrg}`, currentOrg];

    const { data, error } = await client
      .from("org_structure")
      .select("areas")
      .in("id", possibleIds)
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.areas) return null;

    // Si data.areas es un array (formato legacy plano)
    if (Array.isArray(data.areas)) {
      const rawAreas = data.areas as OrgArea[];
      const reconstructedWcs: OrgWorkCenter[] = [];
      const seenWc = new Set<string>();
      rawAreas.forEach((a: any) => {
        const wcName = a.workCenterName || a.workCenter;
        if (wcName && !seenWc.has(wcName.toLowerCase())) {
          seenWc.add(wcName.toLowerCase());
          reconstructedWcs.push({
            id: a.workCenterId || `wc-recon-${Date.now()}-${reconstructedWcs.length}`,
            name: wcName,
            status: "Activo",
            createdAt: new Date().toISOString().split("T")[0],
          });
        }
      });

      return {
        workCenters: reconstructedWcs,
        areas: rawAreas,
        positions: [],
        users: [],
      };
    }

    // Si data.areas es un objeto (formato compuesto completo)
    const composite = data.areas as any;
    let wcs: OrgWorkCenter[] = Array.isArray(composite.workCenters) ? composite.workCenters : [];
    const ars: OrgArea[] = Array.isArray(composite.areas) ? composite.areas : [];
    const pos: OrgPosition[] = Array.isArray(composite.positions) ? composite.positions : [];
    const usrs: OrgUser[] = Array.isArray(composite.users) ? composite.users : [];

    // Si wcs está vacío pero ars tiene workCenterName / workCenterId, reconstruir
    if (wcs.length === 0 && ars.length > 0) {
      const seenWc = new Set<string>();
      ars.forEach((a: any) => {
        const wcName = a.workCenterName || a.workCenter;
        if (wcName && !seenWc.has(wcName.toLowerCase())) {
          seenWc.add(wcName.toLowerCase());
          wcs.push({
            id: a.workCenterId || `wc-recon-${Date.now()}-${wcs.length}`,
            name: wcName,
            status: "Activo",
            createdAt: new Date().toISOString().split("T")[0],
          });
        }
      });
    }

    return {
      workCenters: wcs,
      areas: ars,
      positions: pos,
      users: usrs,
      lastUpdated: composite.lastUpdated,
    };
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
export async function saveIperMatricesToSupabase(matrices: any[], orgId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const currentOrg = orgId || "org_demo";

  try {
    const rows = matrices.map((m) => {
      // Formatear el ID garantizando prefijo de tenant si es necesario
      const scopedId = m.id.startsWith("org_") || m.id.startsWith("m-") || m.id.startsWith("MA-")
        ? (m.id.startsWith(`${currentOrg}_`) ? m.id : `${currentOrg}_${m.id}`)
        : `${currentOrg}_${m.id}`;

      const finalTitle = (m.name || m.title || "").trim();
      const finalWorkCenter = (m.workCenterName || m.workCenter || "").trim();
      const finalArea = (m.areaName || m.area || "").trim();
      const finalProcess = (m.processName || m.process || "").trim();

      return {
        id: scopedId,
        code: m.code || `MA-${Date.now().toString().slice(-4)}`,
        title: finalTitle,
        area: finalArea,
        work_center: finalWorkCenter,
        responsible: (m.responsible || "").trim(),
        status: m.status || "Borrador",
        progress: typeof m.progress === "number" ? m.progress : 0,
        total_risks: typeof m.totalRecords === "number" ? m.totalRecords : (m.total_risks || 0),
        critical_risks: typeof m.intolerableRisks === "number" ? m.intolerableRisks : (m.critical_risks || 0),
        last_review: m.lastReview || m.lastReviewDate || null,
        next_review: m.nextReview || m.expiryText || null,
        hazards: m.evaluations || m.hazards || [],
      };
    });

    if (rows.length === 0) return true;

    const { error } = await client.from("iper_matrices").upsert(rows);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al guardar matrices IPER en Supabase:", e);
    return false;
  }
}

/**
 * Guarda o actualiza una única Matriz IPER directamente en Supabase (mutación atómica).
 */
export async function saveIperMatrixToSupabase(matrix: any, orgId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const currentOrg = orgId || "org_demo";
  const scopedId = matrix.id.startsWith("org_") || matrix.id.startsWith("m-") || matrix.id.startsWith("MA-")
    ? (matrix.id.startsWith(`${currentOrg}_`) ? matrix.id : `${currentOrg}_${matrix.id}`)
    : `${currentOrg}_${matrix.id}`;

  const finalTitle = (matrix.name || matrix.title || "").trim();
  const finalWorkCenter = (matrix.workCenterName || matrix.workCenter || "").trim();
  const finalArea = (matrix.areaName || matrix.area || "").trim();

  const row = {
    id: scopedId,
    code: matrix.code || `MA-${Date.now().toString().slice(-4)}`,
    title: finalTitle,
    area: finalArea,
    work_center: finalWorkCenter,
    responsible: (matrix.responsible || "").trim(),
    status: matrix.status || "Borrador",
    progress: typeof matrix.progress === "number" ? matrix.progress : 0,
    total_risks: typeof matrix.totalRecords === "number" ? matrix.totalRecords : (matrix.total_risks || 0),
    critical_risks: typeof matrix.intolerableRisks === "number" ? matrix.intolerableRisks : (matrix.critical_risks || 0),
    last_review: matrix.lastReview || matrix.lastReviewDate || null,
    next_review: matrix.nextReview || matrix.expiryText || null,
    hazards: matrix.evaluations || matrix.hazards || [],
  };

  try {
    const { error } = await client.from("iper_matrices").upsert(row);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al guardar matriz IPER individual en Supabase:", e);
    return false;
  }
}

export async function fetchIperMatricesFromSupabase(orgId?: string): Promise<any[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const currentOrg = orgId || "org_demo";

  try {
    let query = client.from("iper_matrices").select("*");

    // Aislamiento estricto por tenant
    if (currentOrg === "org_demo") {
      query = query.or("id.like.org_demo_%,id.like.MA-%,id.in.(1,2,3,4,5,6,7)");
    } else {
      query = query.like("id", `${currentOrg}_%`);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.warn("Error al recuperar matrices IPER de Supabase:", error);
      return null;
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      name: row.title,
      area: row.area,
      areaName: row.area,
      workCenter: row.work_center,
      workCenterName: row.work_center,
      responsible: row.responsible,
      status: row.status,
      progress: row.progress,
      totalRecords: row.total_risks,
      intolerableRisks: row.critical_risks,
      totalRisks: row.total_risks,
      criticalRisks: row.critical_risks,
      lastReview: row.last_review,
      lastReviewDate: row.last_review,
      nextReview: row.next_review,
      expiryText: row.next_review || "Vencimiento: 1 año",
      hazards: row.hazards,
      evaluations: row.hazards,
    }));
  } catch (e) {
    console.warn("Error al recuperar matrices IPER de Supabase:", e);
    return null;
  }
}

export async function deleteIperMatrixFromSupabase(matrixId: string, orgId?: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  const currentOrg = orgId || "org_demo";
  const scopedId = matrixId.startsWith("org_") || matrixId.startsWith("m-") || matrixId.startsWith("MA-")
    ? (matrixId.startsWith(`${currentOrg}_`) ? matrixId : `${currentOrg}_${matrixId}`)
    : `${currentOrg}_${matrixId}`;

  try {
    const { error } = await client
      .from("iper_matrices")
      .delete()
      .or(`id.eq.${scopedId},id.eq.${matrixId}`);

    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("Error al eliminar matriz de Supabase:", e);
    return false;
  }
}

/**
 * Restablece y elimina todos los datos de Supabase correspondientes a la cuenta de prueba luis.godoy@safetyclub.cl (org_luis).
 * Por seguridad estricta, NUNCA ejecuta eliminaciones sobre otras organizaciones.
 */
export async function resetSupabaseDataForOrg(orgId: string, userId?: string): Promise<boolean> {
  // Solo permitir organizaciones autorizadas de prueba
  const ALLOWED_ORGS = [
    "org_luis",
    "org_sergio",
    "org_aldo",
    "org_gonzalo_c",
    "org_gonzalo_b",
  ];
  if (!ALLOWED_ORGS.includes(orgId)) {
    console.error("Seguridad: Intento de reset no autorizado para la organización:", orgId);
    return false;
  }

  const client = getSupabaseClient();
  if (!client) return true;

  try {
    // 1. Limpiar archivos de Storage de esta organización (evidencias, logos, avatares)
    try {
      if (userId) {
        await client.storage.from("avatars").remove([
          `${userId}/avatar.png`,
          `${userId}/photo.png`,
          `${userId}/avatar.jpg`,
          `${userId}/avatar.jpeg`,
          `${userId}/avatar.webp`,
        ]);
      }
      await client.storage.from("organization-logos").remove([
        `${orgId}/logo.png`,
        `${orgId}/logo.jpg`,
        `${orgId}/logo.jpeg`,
        `${orgId}/logo.webp`,
      ]);
    } catch (_) {}

    // 2. Si existen tablas relacionales en Supabase, eliminar en orden estricto de dependencias:
    try {
      await client.from("organization_members").delete().eq("organization_id", orgId);
      await client.from("positions").delete().eq("organization_id", orgId);
      await client.from("subprocesses").delete().eq("organization_id", orgId);
      await client.from("processes").delete().eq("organization_id", orgId);
      await client.from("areas").delete().eq("organization_id", orgId);
      await client.from("work_centers").delete().eq("organization_id", orgId);
    } catch (_) {}

    // 3. Eliminar documentos preventivos asociados a la organización
    await client.from("preventive_docs").delete().like("id", `${orgId}_%`);

    // 4. Eliminar matrices IPER asociadas a la organización
    await client.from("iper_matrices").delete().like("id", `${orgId}_%`);

    // 5. Eliminar estructura organizacional compuesta
    await client.from("org_structure").delete().in("id", [`structure_${orgId}`, orgId]);

    // 6. Eliminar preferencias organizacionales (onboarding, módulos, actividades preventivas)
    await client.from("organization_preferences").delete().eq("id", orgId);

    return true;
  } catch (e) {
    console.warn(`Advertencia limpiando datos de Supabase para ${orgId}:`, e);
    return false;
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

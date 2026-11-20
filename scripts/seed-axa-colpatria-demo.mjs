/**
 * Cuenta demo AXA COLPATRIA (org_axa) con datos de ejemplo en todos los módulos.
 * - Usuario Auth: william.baron@axacolpatria.co, contraseña "will" (Auth guarda "will00", ver lib/auth/defaultAppPassword.ts).
 *   Se crea con email_confirm=true: Supabase NO envía correos.
 * - Personas ficticias del equipo usan @example.com (dominio reservado, no entrega correo).
 * - Re-ejecutable: actualiza por id y recrea ARTP y Seguridad de Procesos de la organización.
 * Uso: node scripts/seed-axa-colpatria-demo.mjs
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { createJiti } from "jiti";
import { connectSupabaseDb, root } from "./lib/pgConnect.mjs";

const ORG = "org_axa";
const ORG_NAME = "AXA COLPATRIA";
const ADMIN = {
  email: "william.baron@axacolpatria.co",
  password: "will00",
  userId: "user_william",
  memberId: "mem_user_william",
  firstName: "William",
  lastName: "Barón Santoyo",
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

// ---------------------------------------------------------------------------
// Auth + archivos
// ---------------------------------------------------------------------------
async function ensureAuthUser() {
  for (let page = 1; page < 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === ADMIN.email);
    if (found) {
      await admin.auth.admin.updateUserById(found.id, { password: ADMIN.password, email_confirm: true });
      return found.id;
    }
    if (data.users.length < 1000) break;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN.email,
    password: ADMIN.password,
    email_confirm: true,
    user_metadata: { full_name: `${ADMIN.firstName} ${ADMIN.lastName}`, org_id: ORG },
  });
  if (error) throw error;
  return data.user.id;
}

async function uploadPublic(bucket, path, buffer) {
  const { error } = await admin.storage.from(bucket).upload(path, buffer, { contentType: "image/png", upsert: true });
  if (error) throw error;
  return `${admin.storage.from(bucket).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
}

const authUid = await ensureAuthUser();
const logoUrl = await uploadPublic(
  "organization-logos",
  `${ORG}/logo.png`,
  readFileSync(join(root, "scripts/assets/axa-colpatria-logo.png"))
);
// La guía de configuración exige foto de perfil para no volver a bloquear módulos.
// Usa scripts/assets/william-baron.(jpg|png) si existe; si no, un avatar con iniciales.
const photoPath = ["jpg", "jpeg", "png"]
  .map((ext) => join(root, `scripts/assets/william-baron.${ext}`))
  .find((p) => existsSync(p));
const avatarPng = photoPath
  ? await sharp(photoPath).resize(256, 256, { fit: "cover" }).png().toBuffer()
  : await sharp(
      Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
        <rect width="256" height="256" rx="128" fill="#00008F"/>
        <text x="128" y="160" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="700" fill="#fff" text-anchor="middle">WB</text>
      </svg>`)
    ).png().toBuffer();
const avatarUrl = await uploadPublic("avatars", `${authUid}/avatar.png`, avatarPng);

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------
const today = "2026-11-20";

const workCenters = [
  { id: "wc_axa_bog", name: "Sede Principal Bogotá", code: "BOG-01", address: "Bogotá D.C.", description: "Oficinas corporativas: dirección, operaciones, tecnología y áreas de soporte." },
  { id: "wc_axa_cc", name: "Centro de Contacto Bogotá", code: "BOG-CC", address: "Bogotá D.C.", description: "Atención telefónica y digital de clientes (línea integral y salud)." },
  { id: "wc_axa_med", name: "Oficina Regional Medellín", code: "MED-01", address: "Medellín, Antioquia", description: "Atención comercial y servicio al cliente de la región Antioquia." },
  { id: "wc_axa_cali", name: "Oficina Regional Cali", code: "CLO-01", address: "Cali, Valle del Cauca", description: "Atención comercial y ajuste de siniestros del suroccidente." },
];

const areas = [
  { id: "area_axa_bog_ops", wc: "wc_axa_bog", name: "Operaciones y Siniestros" },
  { id: "area_axa_bog_ti", wc: "wc_axa_bog", name: "Tecnología" },
  { id: "area_axa_bog_adm", wc: "wc_axa_bog", name: "Administración y Servicios Generales" },
  { id: "area_axa_bog_gh", wc: "wc_axa_bog", name: "Gestión Humana y SST" },
  { id: "area_axa_cc_atn", wc: "wc_axa_cc", name: "Atención al Cliente" },
  { id: "area_axa_med_com", wc: "wc_axa_med", name: "Comercial" },
  { id: "area_axa_cali_aju", wc: "wc_axa_cali", name: "Ajuste de Siniestros" },
  { id: "area_axa_cali_com", wc: "wc_axa_cali", name: "Comercial" },
];

const processes = [
  { id: "pr_axa_sin", area: "area_axa_bog_ops", name: "Gestión de siniestros", subs: ["Radicación de reclamaciones", "Liquidación y pago"] },
  { id: "pr_axa_ti", area: "area_axa_bog_ti", name: "Soporte e infraestructura tecnológica", subs: ["Mesa de ayuda", "Centro de datos"] },
  { id: "pr_axa_sg", area: "area_axa_bog_adm", name: "Servicios generales", subs: ["Mantenimiento locativo", "Mensajería y correspondencia"] },
  { id: "pr_axa_sst", area: "area_axa_bog_gh", name: "Gestión del SG-SST", subs: ["Medicina preventiva", "Gestión de emergencias"] },
  { id: "pr_axa_cc", area: "area_axa_cc_atn", name: "Atención de canales", subs: ["Atención telefónica", "Atención digital"] },
  { id: "pr_axa_med_ven", area: "area_axa_med_com", name: "Venta y asesoría de seguros", subs: ["Visitas a clientes"] },
  { id: "pr_axa_aju", area: "area_axa_cali_aju", name: "Inspección y ajuste en terreno", subs: ["Inspección de vehículos", "Inspección de inmuebles"] },
  { id: "pr_axa_cali_ven", area: "area_axa_cali_com", name: "Venta y asesoría de seguros", subs: ["Visitas a clientes"] },
];

const positions = [
  { id: "pos_axa_asesor_cc", name: "Asesor de Centro de Contacto", t: 180, m: 70, f: 110 },
  { id: "pos_axa_analista_sin", name: "Analista de Siniestros", t: 60, m: 25, f: 35 },
  { id: "pos_axa_ajustador", name: "Ajustador de Siniestros", t: 24, m: 18, f: 6 },
  { id: "pos_axa_ejecutivo", name: "Ejecutivo Comercial", t: 45, m: 20, f: 25 },
  { id: "pos_axa_analista_ti", name: "Analista de Tecnología", t: 40, m: 28, f: 12 },
  { id: "pos_axa_aux_sg", name: "Auxiliar de Servicios Generales", t: 12, m: 7, f: 5 },
  { id: "pos_axa_mensajero", name: "Mensajero Motorizado", t: 8, m: 8, f: 0 },
  { id: "pos_axa_coord_sst", name: "Coordinador de SST", t: 3, m: 1, f: 2 },
  { id: "pos_axa_lider_cc", name: "Líder de Centro de Contacto", t: 10, m: 4, f: 6 },
];

// Equipo ficticio (sin acceso). Correos @example.com: dominio reservado.
const team = [
  { id: "mem_axa_lmartinez", first: "Laura", last: "Martínez Rojas", role: "Editor", cargo: "pos_axa_coord_sst", area: "area_axa_bog_gh", wc: "wc_axa_bog" },
  { id: "mem_axa_cgomez", first: "Carlos", last: "Gómez Pardo", role: "Editor", cargo: "pos_axa_lider_cc", area: "area_axa_cc_atn", wc: "wc_axa_cc" },
  { id: "mem_axa_dramirez", first: "Diana", last: "Ramírez Ospina", role: "Lector", cargo: "pos_axa_analista_sin", area: "area_axa_bog_ops", wc: "wc_axa_bog" },
  { id: "mem_axa_jcastro", first: "Julián", last: "Castro Mejía", role: "Lector", cargo: "pos_axa_ajustador", area: "area_axa_cali_aju", wc: "wc_axa_cali" },
  { id: "mem_axa_avelez", first: "Andrea", last: "Vélez Restrepo", role: "Lector", cargo: "pos_axa_ejecutivo", area: "area_axa_med_com", wc: "wc_axa_med" },
];

const level = (r) => (r >= 15 ? "Crítico" : r >= 8 ? "Alto" : r >= 4 ? "Medio" : "Bajo");
function ev(id, base, [task, hazard, riskEvent, pi, si, controls, pr, sr, controlStatus, cargo]) {
  return {
    id, process: base.process, task, hazard, riskEvent,
    probInitial: pi, sevInitial: si, riskInitial: pi * si, initialLevel: level(pi * si),
    controls, probResidual: pr, sevResidual: sr, riskResidual: pr * sr, residualLevel: level(pr * sr),
    controlStatus, responsible: base.responsible, cargo, area: base.area, workCenter: base.workCenter,
  };
}

const iperDefs = [
  {
    id: `${ORG}_m-oficinas-bog`, code: "IPER-ADM-01", title: "Trabajo administrativo en oficinas - Sede Principal Bogotá",
    status: "Vigente", progress: 100, wc: "wc_axa_bog", area: "area_axa_bog_ops", process: "pr_axa_sin",
    base: { process: "Gestión de siniestros", responsible: "Laura Martínez (SST)", area: "Operaciones y Siniestros", workCenter: "Sede Principal Bogotá" },
    lastReview: "2026-08-12", nextReview: "2027-08-12",
    rows: [
      ["Digitación y análisis de reclamaciones en computador", "Postura sedente prolongada y movimientos repetitivos", "Desórdenes musculoesqueléticos (túnel carpiano, lumbalgia)", 4, 3, "Puestos ergonómicos ajustables, pausas activas cada 2 horas, programa de vigilancia osteomuscular", 2, 3, "Implementado", "Analista de Siniestros"],
      ["Gestión de casos complejos con plazos regulatorios", "Carga mental y presión de tiempos", "Estrés laboral y fatiga", 3, 3, "Batería de riesgo psicosocial, distribución de cargas, programa de bienestar", 2, 3, "En proceso", "Analista de Siniestros"],
      ["Desplazamiento por pasillos y escaleras de la sede", "Superficies irregulares o húmedas", "Caída al mismo nivel", 2, 3, "Señalización de pisos húmedos, cintas antideslizantes, orden y aseo", 1, 3, "Implementado", "Analista de Siniestros, Analista de Tecnología"],
      ["Permanencia en edificio durante la jornada", "Sismo (amenaza natural)", "Lesiones por colapso o caída de objetos", 3, 5, "Plan de emergencias, brigada entrenada, simulacro anual, anclaje de muebles altos", 2, 5, "Implementado", "Analista de Siniestros, Analista de Tecnología"],
    ],
  },
  {
    id: `${ORG}_m-ajuste-terreno`, code: "IPER-AJU-02", title: "Inspección y ajuste de siniestros en terreno - Cali",
    status: "Vigente", progress: 100, wc: "wc_axa_cali", area: "area_axa_cali_aju", process: "pr_axa_aju",
    base: { process: "Inspección y ajuste en terreno", responsible: "Laura Martínez (SST)", area: "Ajuste de Siniestros", workCenter: "Oficina Regional Cali" },
    lastReview: "2026-06-03", nextReview: "2027-06-03",
    rows: [
      ["Desplazamiento en vehículo a lugar del siniestro", "Tránsito vehicular", "Accidente de tránsito", 4, 5, "Plan Estratégico de Seguridad Vial, curso de manejo defensivo, revisión preoperacional, control de velocidad por GPS", 2, 5, "Implementado", "Ajustador de Siniestros"],
      ["Inspección de inmuebles afectados por incendio o inundación", "Estructuras inestables y superficies contaminadas", "Golpes, atrapamiento o caída a distinto nivel", 3, 5, "Verificación previa con bomberos o administración, ingreso solo con autorización, casco, botas y guantes", 2, 4, "En proceso", "Ajustador de Siniestros"],
      ["Atención a asegurados en el lugar del evento", "Contacto con público alterado", "Agresión verbal o física", 3, 3, "Protocolo de atención en situaciones de tensión, trabajo en parejas en zonas de riesgo, reporte inmediato", 2, 3, "Implementado", "Ajustador de Siniestros"],
      ["Inspección de vehículos en patios y talleres", "Exposición a radiación solar", "Quemaduras solares e insolación", 3, 2, "Protector solar, gorra, hidratación, inspecciones en horarios de menor radiación", 2, 2, "Pendiente", "Ajustador de Siniestros"],
    ],
  },
  {
    id: `${ORG}_m-centro-contacto`, code: "IPER-CC-03", title: "Atención telefónica y digital - Centro de Contacto",
    status: "En revisión", progress: 70, wc: "wc_axa_cc", area: "area_axa_cc_atn", process: "pr_axa_cc",
    base: { process: "Atención de canales", responsible: "Carlos Gómez (Centro de Contacto)", area: "Atención al Cliente", workCenter: "Centro de Contacto Bogotá" },
    lastReview: "2026-10-28", nextReview: "2026-12-15",
    rows: [
      ["Atención de llamadas con diadema", "Uso intensivo de la voz", "Disfonía y alteraciones de la voz", 4, 2, "Programa de conservación de la voz, hidratación, pausas vocales", 2, 2, "En proceso", "Asesor de Centro de Contacto"],
      ["Atención de llamadas con diadema", "Ruido por exposición a audífonos", "Fatiga auditiva", 3, 2, "Limitadores de volumen en diademas, audiometrías periódicas", 2, 2, "Implementado", "Asesor de Centro de Contacto"],
      ["Atención de clientes con reclamaciones", "Atención de usuarios insatisfechos y metas de servicio", "Estrés laboral y desgaste emocional", 4, 3, "Rotación de colas de atención, acompañamiento de líderes, línea de apoyo psicológico de la ARL", 3, 3, "En proceso", "Asesor de Centro de Contacto, Líder de Centro de Contacto"],
    ],
  },
];

const activity = (id, name, category, start, end, periodicity, status, progress, responsible, cargoId, areaName) => ({
  id: `${ORG}_pa_${id}`, name, category, start, end, periodicity, status, progress, responsible, cargoId, areaName,
});
const preventive = [
  activity("01", "Actualizar la política y objetivos del SG-SST", "Gestión de Riesgos", "2026-01-12", "2026-02-27", "Anual", "Cumplida", 100, "Laura Martínez", "pos_axa_coord_sst", "Gestión Humana y SST"),
  activity("02", "Autoevaluación de estándares mínimos (Resolución 0312)", "Inspecciones y Verificaciones", "2026-02-02", "2026-03-31", "Anual", "Cumplida", 100, "Laura Martínez", "pos_axa_coord_sst", "Gestión Humana y SST"),
  activity("03", "Actualizar matrices de peligros de todas las sedes", "Gestión de Riesgos", "2026-03-02", "2026-08-31", "Anual", "Cumplida", 100, "Laura Martínez", "pos_axa_coord_sst", "Gestión Humana y SST"),
  activity("04", "Inducción y reinducción en SST a trabajadores", "Capacitación y Difusión", "2026-01-15", "2026-12-15", "Mensual", "En curso", 85, "Laura Martínez", "pos_axa_coord_sst", "Gestión Humana y SST"),
  activity("05", "Reuniones mensuales del COPASST", "Participación y CPHS", "2026-01-20", "2026-12-18", "Mensual", "En curso", 83, "Carlos Gómez", "pos_axa_lider_cc", "Atención al Cliente"),
  activity("06", "Inspecciones locativas trimestrales en las cuatro sedes", "Inspecciones y Verificaciones", "2026-02-15", "2026-12-10", "Trimestral", "En curso", 75, "Laura Martínez", "pos_axa_coord_sst", "Administración y Servicios Generales"),
  activity("07", "Simulacro nacional de evacuación por sismo", "Emergencias y Simulacros", "2026-09-01", "2026-10-15", "Anual", "Cumplida", 100, "Laura Martínez", "pos_axa_coord_sst", "Gestión Humana y SST"),
  activity("08", "Entrenamiento de la brigada de emergencias", "Emergencias y Simulacros", "2026-04-06", "2026-11-30", "Semestral", "En curso", 60, "Laura Martínez", "pos_axa_coord_sst", "Gestión Humana y SST"),
  activity("09", "Curso de manejo defensivo para ajustadores y mensajeros", "Capacitación y Difusión", "2026-05-04", "2026-09-30", "Una vez", "Atrasada", 55, "Julián Castro", "pos_axa_ajustador", "Ajuste de Siniestros"),
  activity("10", "Aplicación de batería de riesgo psicosocial", "Gestión de Riesgos", "2026-06-01", "2026-10-31", "Anual", "Atrasada", 40, "Laura Martínez", "pos_axa_coord_sst", "Gestión Humana y SST"),
  activity("11", "Programa de pausas activas y conservación de la voz", "Capacitación y Difusión", "2026-02-02", "2026-12-18", "Mensual", "En curso", 80, "Carlos Gómez", "pos_axa_lider_cc", "Atención al Cliente"),
  activity("12", "Evaluaciones médicas ocupacionales periódicas", "Inspecciones y Verificaciones", "2026-07-01", "2026-12-20", "Anual", "En curso", 45, "Laura Martínez", "pos_axa_coord_sst", "Gestión Humana y SST"),
  activity("13", "Rendición de cuentas y revisión por la dirección del SG-SST", "Gestión de Riesgos", "2026-12-01", "2026-12-22", "Anual", "Pendiente", 0, "William Barón", null, "Gestión Humana y SST"),
];

const docs = [
  {
    id: `${ORG}_td_politica`, type: "PoliticaSST", name: "Política de Seguridad y Salud en el Trabajo", status: "Vigente",
    content: {
      declaracion: `${ORG_NAME} reconoce que la seguridad y salud de sus colaboradores, contratistas y visitantes es un valor fundamental. Nos comprometemos a mantener ambientes de trabajo seguros y saludables, identificando peligros, evaluando y controlando los riesgos en todas nuestras sedes y actividades en terreno, en cumplimiento del Decreto 1072 de 2015 y la Resolución 0312 de 2019.`,
      compromisos: "1. Prevenir lesiones y enfermedades laborales.\n2. Cumplir la normativa vigente en riesgos laborales.\n3. Asignar los recursos necesarios para el SG-SST.\n4. Promover la participación de los trabajadores y del COPASST.\n5. Mejorar continuamente el desempeño en SST.",
      objetivos: "Reducir la accidentalidad laboral, controlar los riesgos prioritarios (vial, biomecánico y psicosocial) y cumplir el plan anual de trabajo.",
      difusion: "Esta política se comunica en la inducción, se publica en la intranet y se revisa anualmente.",
      firma: "Representante legal — 27 de febrero de 2026",
    },
  },
  {
    id: `${ORG}_td_plan_emergencia`, type: "PlanEmergencia", name: "Plan de Emergencias - Sede Principal Bogotá", status: "Vigente",
    content: {
      objetivo: "Establecer las acciones para proteger la vida de las personas y los bienes ante emergencias en la Sede Principal Bogotá.",
      alcance: "Aplica a colaboradores, contratistas y visitantes de la Sede Principal Bogotá.",
      organizacion: "Comité de emergencias, coordinador de emergencias y brigada integral por piso.",
      roles: "Coordinador de emergencias: activa el plan y dirige la evacuación.\nBrigadistas: primeros auxilios, control de conatos y evacuación.\nTrabajadores: siguen instrucciones y se dirigen al punto de encuentro.",
      tipos: "Sismo, incendio, emergencia médica, inundación y amenaza de artefacto explosivo.",
      evacuacion: "Alarma → suspender actividades → evacuar por rutas señalizadas sin usar ascensores → conteo en punto de encuentro.",
      punto_encuentro: "Punto de encuentro principal señalizado frente a la sede",
      comunicaciones: "Línea de emergencias 123. Notificación al coordinador de emergencias y a la ARL.",
      brigadas: "Brigada integral: 24 brigadistas entrenados en primeros auxilios, evacuación y control de incendios.",
      simulacros: "Simulacro nacional anual y un simulacro parcial semestral por sede.",
    },
  },
  {
    id: `${ORG}_td_pts_ajuste`, type: "PTS", name: "PTS-001 Inspección de siniestros en terreno", status: "Vigente",
    content: {
      nombre: "PTS-001 Inspección de siniestros en terreno",
      objetivo: "Realizar inspecciones de siniestros en vehículos e inmuebles controlando los riesgos vial, locativo y de seguridad pública.",
      alcance: "Ajustadores de siniestros de todas las regionales.",
      responsables: "Líder de ajuste: programa visitas y verifica condiciones.\nAjustador: aplica el procedimiento y reporta condiciones inseguras.\nSST: capacita y verifica cumplimiento.",
      epp: "Casco, botas de seguridad, guantes, chaleco reflectivo, protector solar.",
      riesgos: "Accidente de tránsito, ingreso a estructuras inestables, agresión de terceros, exposición solar.",
      controles: "Revisión preoperacional del vehículo, autorización previa para ingresar a inmuebles afectados, trabajo en parejas en zonas de riesgo, pausas de hidratación.",
      secuencia: "Paso 1: Confirmar cita y condiciones del lugar.\nPaso 2: Revisión preoperacional del vehículo.\nPaso 3: Verificar accesos seguros al llegar.\nPaso 4: Realizar la inspección con EPP.\nPaso 5: Registrar evidencias y retirarse.\nPaso 6: Reportar novedades.",
      emergencias: "Ante un incidente, retirarse a zona segura, llamar al 123 y reportar a la línea de la ARL.",
    },
  },
  {
    id: `${ORG}_td_riohs`, type: "RIOHS", name: "Reglamento de Higiene y Seguridad Industrial", status: "En Revisión",
    content: {
      identificacion: `${ORG_NAME}. Actividad económica: seguros. Sedes en Bogotá, Medellín y Cali.`,
      objetivo: "Establecer las normas de higiene y seguridad industrial que deben cumplir todos los colaboradores.",
      disposiciones: "La empresa se compromete a dar cumplimiento a la legislación vigente en seguridad y salud en el trabajo.",
      obligaciones_empleador: "Implementar el SG-SST, proveer EPP, realizar evaluaciones médicas ocupacionales y capacitar a los trabajadores.",
      obligaciones_trabajador: "Cumplir las normas de SST, usar los EPP, reportar condiciones inseguras e incidentes, participar en capacitaciones.",
    },
  },
  {
    id: `${ORG}_td_instructivo_pausas`, type: "Instructivo", name: "ITS-001 Pausas activas en puestos de oficina", status: "Borrador",
    content: {
      nombre: "ITS-001 Pausas activas en puestos de oficina",
      objetivo: "Prevenir desórdenes musculoesqueléticos y fatiga visual en trabajo con computador.",
      aplicacion: "Colaboradores de oficinas y centro de contacto.",
      epp: "No aplica.",
      pasos: "1. Cada 2 horas, pausa de 5 minutos.\n2. Estiramiento de cuello y hombros.\n3. Movilidad de muñecas y dedos.\n4. Ejercicio visual 20-20-20.\n5. Hidratación.",
    },
  },
];

const artpDefs = [
  {
    key: "veh", task: "Inspección de vehículo siniestrado en patio o taller", code: "ARTP-AJU-01", publish: true,
    wc: "wc_axa_cali", area: "area_axa_cali_aju", process: "pr_axa_aju", position: "pos_axa_ajustador",
    steps: [
      ["Coordinar la visita y confirmar condiciones del patio", ["Teléfono", "Agenda"], "energy_sys_mecanica", "Tránsito de vehículos en el patio", "Seguridad", "Atropello", [["Ingreso solo por rutas peatonales demarcadas", "Controles Administrativos", true, "¿El taller confirmó la ruta peatonal?"]]],
      ["Ingresar al patio y ubicar el vehículo", ["Chaleco reflectivo"], "energy_sys_mecanica", "Vehículos y maquinaria en movimiento", "Seguridad", "Golpe o atropello", [["Uso de chaleco reflectivo", "Elementos de Protección Personal (EPP)", false, null]]],
      ["Inspeccionar daños y registrar evidencias fotográficas", ["Celular", "Linterna"], "energy_sys_gravitacional", "Vehículo elevado o mal calzado", "Seguridad", "Aplastamiento", [["No ubicarse bajo vehículos elevados sin soportes", "Controles Administrativos", true, "¿El vehículo está calzado o con soportes?"]]],
      ["Revisar zona de motor y batería", ["Guantes"], "energy_sys_electrica", "Batería y sistema eléctrico", "Seguridad", "Contacto eléctrico o quemadura", [["Verificar motor apagado y llave retirada", "Controles Administrativos", true, "¿El motor está apagado?"], ["Uso de guantes", "Elementos de Protección Personal (EPP)", false, null]]],
    ],
  },
  {
    key: "inm", task: "Inspección de inmueble afectado por inundación", code: "ARTP-AJU-02", publish: false,
    wc: "wc_axa_cali", area: "area_axa_cali_aju", process: "pr_axa_aju", position: "pos_axa_ajustador",
    steps: [
      ["Verificar corte de energía con la administración", ["Teléfono"], "energy_sys_electrica", "Instalaciones eléctricas energizadas con agua", "Seguridad", "Electrocución", [["Confirmar corte de energía antes de ingresar", "Controles Administrativos", true, "¿Se confirmó el corte de energía?"]]],
      ["Ingresar y recorrer áreas afectadas", ["Botas de caucho", "Linterna"], "energy_sys_gravitacional", "Pisos húmedos y escombros", "Seguridad", "Caída al mismo nivel", [["Uso de botas antideslizantes", "Elementos de Protección Personal (EPP)", false, null]]],
      ["Registrar daños y tomar muestras de humedad", ["Medidor de humedad", "Celular"], "energy_sys_quimica", "Agua contaminada y moho", "Higiénicos", "Infección o irritación", [["Guantes de nitrilo y lavado de manos", "Elementos de Protección Personal (EPP)", false, null]]],
    ],
  },
];

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------
const db = await connectSupabaseDb();

async function upsert(table, rows) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const values = [];
  const tuples = rows.map((row, r) =>
    `(${cols.map((c, i) => {
      values.push(row[c]);
      return `$${r * cols.length + i + 1}`;
    }).join(", ")})`
  );
  const updates = cols.filter((c) => c !== "id").map((c) => `${c} = EXCLUDED.${c}`).join(", ");
  await db.query(
    `INSERT INTO ${table} (${cols.join(", ")}) VALUES ${tuples.join(", ")}
     ON CONFLICT (id) DO ${updates ? `UPDATE SET ${updates}` : "NOTHING"}`,
    values
  );
}
const json = (v) => JSON.stringify(v);
const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

try {
  await db.query("BEGIN");

  await upsert("organizations", [{
    id: ORG, name: ORG_NAME, legal_name: ORG_NAME, industry: "Seguros", size: "500+", status: "Activo",
    logo_url: logoUrl, logo_path: logoUrl,
  }]);

  await upsert("organization_preferences", [{
    id: ORG, organization_id: ORG,
    preferences: json({
      organizationName: ORG_NAME, organizationSize: "500+", organizationSector: "Seguros",
      experienceLevel: "expert", guidanceLevel: "contextual", riskEvaluationMethod: "ds44", riskManagementApproach: "iper",
      modules: { miper: true, documentManagement: true, aprVirtual: true },
      onboardingCompleted: true, onboardingCompletedAt: `${today}T09:00:00.000Z`, onboardingStep: 5, tourCompleted: true,
      setupGuide: {
        completed: true, dismissed: false, completedAt: `${today}T09:30:00.000Z`, technicalStartAcknowledged: true,
        initialModalShown: true, companionCollapsed: true, userFinalized: true,
      },
      moduleConfigurations: {
        miper: { configured: true, methodology: "dynamic5x5_vep", confirmed: true, configuredAt: `${today}T09:40:00.000Z` },
        preventivePlanning: { configured: true, hasExistingProgram: true, setupMode: "create_base", configuredAt: `${today}T09:45:00.000Z` },
      },
    }),
  }]);

  await upsert("profiles", [{ id: authUid, first_name: ADMIN.firstName, last_name: ADMIN.lastName, avatar_path: avatarUrl }]);

  await upsert("work_centers", workCenters.map((w) => ({ ...w, organization_id: ORG, status: "Activo" })));
  await upsert("areas", areas.map((a) => ({ id: a.id, organization_id: ORG, work_center_id: a.wc, name: a.name, status: "Activo" })));
  await upsert("processes", processes.map((p) => ({ id: p.id, organization_id: ORG, area_id: p.area, name: p.name, status: "Activo" })));
  await upsert("subprocesses", processes.flatMap((p) =>
    p.subs.map((name, i) => ({ id: `${p.id}_sub${i + 1}`, organization_id: ORG, process_id: p.id, name, status: "Activo" }))
  ));
  await upsert("positions", positions.map((p) => ({
    id: p.id, organization_id: ORG, name: p.name, dotation_total: p.t, dotation_male: p.m, dotation_female: p.f, status: "Activo",
  })));

  await upsert("organization_members", [
    {
      id: ADMIN.memberId, organization_id: ORG, auth_user_id: authUid, user_id: ADMIN.userId, email: ADMIN.email,
      name: `${ADMIN.firstName} ${ADMIN.lastName}`, first_name: ADMIN.firstName, last_name: ADMIN.lastName,
      role: "Administrador", status: "Activo", permissions: "{}", cargo_id: null, area_id: "area_axa_bog_gh", work_center_id: "wc_axa_bog",
    },
    ...team.map((m) => ({
      id: m.id, organization_id: ORG, auth_user_id: null, user_id: null,
      email: `${norm(m.first)}.${norm(m.last.split(" ")[0])}@example.com`.normalize("NFD").replace(/[̀-ͯ]/g, ""),
      name: `${m.first} ${m.last}`, first_name: m.first, last_name: m.last,
      role: m.role, status: "Activo", permissions: "{}", cargo_id: m.cargo, area_id: m.area, work_center_id: m.wc,
    })),
  ]);

  await upsert("iper_matrices", iperDefs.map((m) => {
    const hazards = m.rows.map((row, i) => ev(`ev-${m.code.toLowerCase()}-${i + 1}`, m.base, row));
    return {
      id: m.id, organization_id: ORG, code: m.code, title: m.title, status: m.status, progress: m.progress,
      area: m.base.area, work_center: m.base.workCenter, responsible: m.base.responsible,
      work_center_id: m.wc, area_id: m.area, process_id: m.process,
      total_risks: hazards.length, critical_risks: hazards.filter((h) => h.initialLevel === "Crítico").length,
      last_review: m.lastReview, next_review: m.nextReview, hazards: json(hazards), acknowledgements: "[]",
    };
  }));

  await upsert("preventive_plans", [{ id: `plan_${ORG}`, organization_id: ORG, name: "Plan Anual de Trabajo SG-SST 2026", year: 2026, status: "Activo" }]);
  await upsert("preventive_activities", preventive.map((a, i) => ({
    id: a.id, organization_id: ORG, plan_id: `plan_${ORG}`, code: `PAT-${String(i + 1).padStart(2, "0")}`,
    name: a.name, category: a.category, start_date: a.start, end_date: a.end, periodicity: a.periodicity,
    status: a.status, progress: a.progress, weight: 1, area_name: a.areaName,
    responsible_user_name: a.responsible, responsible_position_id: a.cargoId,
    responsible_position_name: positions.find((p) => p.id === a.cargoId)?.name ?? null,
  })));

  await upsert("technical_documents", docs.map((d) => ({
    id: d.id, organization_id: ORG, document_type: d.type, name: d.name, status: d.status, content: json(d.content), created_by: authUid,
  })));

  // ARTP: se recrea completo (una versión publicada no se puede volver a publicar).
  await db.query(`DELETE FROM artp_documents WHERE organization_id = $1`, [ORG]);
  await db.query(`DELETE FROM org_tasks WHERE organization_id = $1 AND origin = 'artp'`, [ORG]);
  for (const a of artpDefs) {
    const id = (s) => `${ORG}_artp_${a.key}_${s}`;
    await upsert("org_tasks", [{
      id: id("task"), organization_id: ORG, name: a.task, normalized_name: norm(a.task), origin: "artp",
      work_center_id: a.wc, area_id: a.area, process_id: a.process,
    }]);
    await upsert("artp_documents", [{
      id: id("doc"), organization_id: ORG, name: a.task, code: a.code, org_task_id: id("task"),
      work_center_id: a.wc, area_id: a.area, process_id: a.process,
    }]);
    await upsert("artp_versions", [{
      id: id("ver1"), organization_id: ORG, artp_document_id: id("doc"), version_number: 1, status: "borrador",
      org_task_id: id("task"), task_name: a.task,
    }]);
    await db.query(`UPDATE artp_documents SET current_version_id = $1 WHERE id = $2`, [id("ver1"), id("doc")]);
    await upsert("artp_version_positions", [{ id: id("pos1"), organization_id: ORG, version_id: id("ver1"), position_id: a.position }]);
    for (const [s, [description, tools, energy, hazard, classification, risk, controls]] of a.steps.entries()) {
      const sid = id(`s${s + 1}`);
      await upsert("artp_steps", [{ id: sid, organization_id: ORG, version_id: id("ver1"), sequence: s + 1, description, tools }]);
      await upsert("artp_step_energies", [{ id: `${sid}_en`, organization_id: ORG, step_id: sid, energy_type_id: energy }]);
      await upsert("artp_step_hazards", [{ id: `${sid}_hz`, organization_id: ORG, step_id: sid, name: hazard, classification, source: "manual" }]);
      await upsert("artp_step_risks", [{ id: `${sid}_rk`, organization_id: ORG, hazard_id: `${sid}_hz`, name: risk, source: "manual" }]);
      await upsert("artp_step_controls", controls.map(([desc, type, critical, question], c) => ({
        id: `${sid}_ct${c + 1}`, organization_id: ORG, risk_id: `${sid}_rk`, description: desc, control_type: type,
        is_critical: critical, verification_question: question, source: "manual",
      })));
    }
    if (a.publish) await db.query(`SELECT public.publish_artp_version_core($1, false)`, [id("ver1")]);
  }

  // Seguridad de Procesos: plantilla base (el script demo luego pone fechas, avance e historial).
  const jiti = createJiti(import.meta.url, { alias: { "@": root } });
  const { PS_BASE_TEMPLATE } = await jiti.import(join(root, "lib/processSafety/baseTemplate.ts"));
  await db.query(`DELETE FROM ps_activities WHERE organization_id = $1`, [ORG]);
  await upsert("ps_activities", Object.entries(PS_BASE_TEMPLATE).flatMap(([element, steps]) =>
    steps.map((st, i) => ({
      id: `${ORG}_ps_base_e${element}_${st.code}`, organization_id: ORG, element_number: Number(element),
      phase: st.phase, code: st.code, title: st.title, sort_order: (i + 1) * 10, progress: 0,
    }))
  ));

  await db.query("COMMIT");
} catch (e) {
  await db.query("ROLLBACK").catch(() => {});
  console.error("Revertido:", e.message || e);
  await db.end();
  process.exit(1);
}
await db.end();

execFileSync(process.execPath, [join(root, "scripts/seed-process-safety-demo.mjs"), ORG], { stdio: "inherit" });

console.log(`Listo: ${ORG_NAME} (${ORG}) — usuario ${ADMIN.email}, contraseña "will".`);

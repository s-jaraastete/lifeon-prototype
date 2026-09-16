import type { DashboardMenuKey } from "@/types/dashboardNav";
import type { AiUiContext } from "@/types/ai";

const MODULE_HINTS: Record<DashboardMenuKey, string> = {
  dashboard: "El usuario está en Inicio. Explica resumen, accesos y primeros pasos.",
  users: "Módulo Usuarios: roles Lector, Editor y Administrador; permisos y buenas prácticas.",
  org: "Módulo Estructura: Centro de Trabajo, Área, Proceso, Subproceso y Cargo.",
  iper: "Módulo Matriz IPER: tareas, peligros, evaluación, controles y riesgo residual.",
  docs: "Planificación preventiva: actividades, responsables, periodicidad, avance y Curva S.",
  techDocs: "Documentación técnica: PTS, RIOHS, Plan de Emergencia y estructura documental.",
  apr: "Módulo APR Virtual (chat principal).",
};

export function buildModuleAssistantSystemAddon(ui: AiUiContext): string {
  const hint = MODULE_HINTS[ui.module] || MODULE_HINTS.dashboard;
  const ctxLines: string[] = [hint, `Módulo actual: ${ui.module}.`];
  if (ui.currentStep) ctxLines.push(`Paso/pantalla: ${ui.currentStep}.`);
  if (ui.workCenterName) ctxLines.push(`Centro de trabajo: ${ui.workCenterName}.`);
  if (ui.areaName) ctxLines.push(`Área: ${ui.areaName}.`);
  if (ui.processName) ctxLines.push(`Proceso: ${ui.processName}.`);
  if (ui.subprocessName) ctxLines.push(`Subproceso: ${ui.subprocessName}.`);
  if (ui.taskName) ctxLines.push(`Tarea: ${ui.taskName}.`);
  if (ui.hazardName) ctxLines.push(`Peligro: ${ui.hazardName}.`);
  if (ui.riskName) ctxLines.push(`Riesgo: ${ui.riskName}.`);
  return ctxLines.join("\n");
}

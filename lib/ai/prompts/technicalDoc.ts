import type { OrganizationPreferences } from "@/types/preferences";
import type { TechnicalDocSectionSpec } from "@/types/ai";

export const TECHNICAL_DOC_SYSTEM =
  "Eres APR Virtual IA generando borradores de documentación técnica SST (Chile). " +
  "Entregas propuestas para revisión; no afirmas cumplimiento legal ni reemplazas validación del empleador.";

export function buildTechnicalDocUserPrompt(params: {
  documentType: string;
  documentName: string;
  sections: TechnicalDocSectionSpec[];
  prefs: OrganizationPreferences;
}): string {
  const sector = params.prefs.organizationSector?.trim() || "no especificado";
  const orgName = params.prefs.organizationName?.trim() || "la organización";

  const sectionList = params.sections
    .map(
      (s) =>
        `- key: "${s.key}" | ${s.label}${s.required ? " (obligatoria)" : ""}${
          s.placeholder ? ` | guía: ${s.placeholder.slice(0, 120)}` : ""
        }`
    )
    .join("\n");

  return [
    `Genera el contenido de cada sección del documento.`,
    `Tipo: ${params.documentType}`,
    `Nombre del documento: ${params.documentName}`,
    `Organización (referencia): ${orgName}`,
    `Rubro/sector: ${sector}`,
    `Adapta el lenguaje al rubro cuando sea pertinente, sin inventar procesos específicos no indicados.`,
    `NO incluyas RUT, DNI, emails, teléfonos ni datos personales. Usa marcadores como [COMPLETAR] donde corresponda.`,
    `Responde SOLO JSON con las claves exactas listadas (una propiedad string por sección).`,
    `Secciones:\n${sectionList}`,
  ].join("\n");
}

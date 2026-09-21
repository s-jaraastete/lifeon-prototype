import { z } from "zod";
import { formatTechnicalDocSectionText } from "@/lib/ai/formatTechnicalDocText";

export function buildTechnicalDocSectionsSchema(sectionKeys: string[]) {
  const shape: Record<string, z.ZodString> = {};
  for (const key of sectionKeys) {
    shape[key] = z.string().min(1).max(8000);
  }
  return z.object(shape);
}

export function buildTechnicalDocJsonSchema(sectionKeys: string[]) {
  const properties: Record<string, { type: string; description: string }> = {};
  for (const key of sectionKeys) {
    properties[key] = {
      type: "string",
      description: `Contenido de la sección ${key}`,
    };
  }
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: sectionKeys,
  } as const;
}

export function parseTechnicalDocSections(
  sectionKeys: string[],
  raw: unknown
): Record<string, string> {
  const schema = buildTechnicalDocSectionsSchema(sectionKeys);
  const parsed = schema.parse(raw);
  const out: Record<string, string> = {};
  for (const key of sectionKeys) {
    out[key] = formatTechnicalDocSectionText(parsed[key].trim());
  }
  return out;
}

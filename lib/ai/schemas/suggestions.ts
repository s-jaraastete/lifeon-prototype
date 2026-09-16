import { z } from "zod";
import type {
  ControlSuggestionItem,
  HazardSuggestionItem,
  IperSuggestionKind,
  RiskSuggestionItem,
  TaskSuggestionItem,
} from "@/types/ai";

const suggestionReason = z.string().min(8).max(400);
const suggestionName = z.string().min(4).max(200);

export const taskSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: suggestionName,
        reason: suggestionReason,
      })
    )
    .min(1)
    .max(6),
});

export const hazardSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: suggestionName,
        reason: suggestionReason,
        classification: z
          .enum(["Seguridad", "Emergencias", "Higiénicos", "Psicosociales", "Músculo-esquelético"])
          .optional(),
      })
    )
    .min(1)
    .max(6),
});

export const riskSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: suggestionName,
        reason: suggestionReason,
        family: z.string().max(120).optional(),
      })
    )
    .min(1)
    .max(6),
});

const controlTypeSchema = z.enum([
  "Eliminar / Sustituir",
  "Controles de Ingeniería",
  "Controles Administrativos",
  "Elementos de Protección Personal (EPP)",
]);

export const controlSuggestionsSchema = z.object({
  suggestions: z
    .array(
      z.object({
        type: controlTypeSchema,
        description: suggestionName,
        reason: suggestionReason,
        isCritical: z.boolean().optional(),
      })
    )
    .min(1)
    .max(6),
});

export const TASK_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          reason: { type: "string" },
        },
        required: ["name", "reason"],
      },
    },
  },
  required: ["suggestions"],
} as const;

export const HAZARD_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          reason: { type: "string" },
          classification: {
            type: "string",
            enum: ["Seguridad", "Emergencias", "Higiénicos", "Psicosociales", "Músculo-esquelético"],
          },
        },
        required: ["name", "reason"],
      },
    },
  },
  required: ["suggestions"],
} as const;

export const RISK_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          reason: { type: "string" },
          family: { type: "string" },
        },
        required: ["name", "reason"],
      },
    },
  },
  required: ["suggestions"],
} as const;

export const CONTROL_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    suggestions: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: [
              "Eliminar / Sustituir",
              "Controles de Ingeniería",
              "Controles Administrativos",
              "Elementos de Protección Personal (EPP)",
            ],
          },
          description: { type: "string" },
          reason: { type: "string" },
          isCritical: { type: "boolean" },
        },
        required: ["type", "description", "reason"],
      },
    },
  },
  required: ["suggestions"],
} as const;

export function parseSuggestionsByKind(
  kind: IperSuggestionKind,
  raw: unknown
):
  | TaskSuggestionItem[]
  | HazardSuggestionItem[]
  | RiskSuggestionItem[]
  | ControlSuggestionItem[] {
  switch (kind) {
    case "task":
      return taskSuggestionsSchema.parse(raw).suggestions;
    case "hazard":
      return hazardSuggestionsSchema.parse(raw).suggestions;
    case "risk":
      return riskSuggestionsSchema.parse(raw).suggestions;
    case "control":
      return controlSuggestionsSchema.parse(raw).suggestions;
    default:
      return taskSuggestionsSchema.parse(raw).suggestions;
  }
}

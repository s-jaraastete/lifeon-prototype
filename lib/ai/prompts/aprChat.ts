import { LIFEON_MODULES_KNOWLEDGE } from "@/lib/ai/knowledge/lifeonModules";

export function buildAprChatSystemAddon(): string {
  return [
    "Modo: chat principal APR Virtual.",
    "Ayuda con APR en terreno, IPER, identificación de peligros/riesgos, controles, documentación preventiva y uso de LifeOn.",
    LIFEON_MODULES_KNOWLEDGE,
  ].join("\n");
}

/** Ruta o URL del prototipo LifeOn Mobile en el mismo despliegue (/mobile). */
export function getMobilePrototypeHref(): string {
  const override = process.env.NEXT_PUBLIC_MOBILE_PROTOTYPE_URL?.trim();
  if (override) {
    return override.replace(/\/$/, "");
  }
  return "/mobile";
}

/**
 * Catálogo central de rubros / sectores económicos (UI + resolución de plantillas IPER).
 * organizationSector persiste el `label` visible para el usuario.
 */

export type SectorTemplateKey =
  | "Construcción"
  | "Minería"
  | "Transporte y Logística"
  | "Manufactura / Industrial"
  | "Servicios e Ingeniería"
  | "Genérico";

export interface EconomicSectorOption {
  id: string;
  label: string;
  aliases: string[];
  templateKey: SectorTemplateKey;
}

export const ECONOMIC_SECTORS: EconomicSectorOption[] = [
  { id: "agricultura", label: "Agricultura, ganadería y silvicultura", aliases: ["agricultura", "ganadería", "silvicultura", "agro"], templateKey: "Genérico" },
  { id: "pesca", label: "Pesca y acuicultura", aliases: ["pesca", "acuicultura"], templateKey: "Genérico" },
  { id: "mineria", label: "Minería", aliases: ["minería", "extracción", "mineria y extracción"], templateKey: "Minería" },
  { id: "construccion", label: "Construcción", aliases: ["construcción", "construccion"], templateKey: "Construcción" },
  { id: "obras-civiles", label: "Obras civiles", aliases: ["obras civiles", "infraestructura"], templateKey: "Construcción" },
  { id: "manufactura", label: "Manufactura / Industria", aliases: ["manufactura", "industria", "manufactura e industria"], templateKey: "Manufactura / Industrial" },
  { id: "metalurgica", label: "Metalúrgica", aliases: ["metalúrgica", "metalurgica"], templateKey: "Manufactura / Industrial" },
  { id: "quimica", label: "Química", aliases: ["química", "quimica"], templateKey: "Manufactura / Industrial" },
  { id: "farmaceutica", label: "Farmacéutica", aliases: ["farmacéutica", "farmaceutica"], templateKey: "Manufactura / Industrial" },
  { id: "alimentos", label: "Alimentos y bebidas", aliases: ["alimentos", "bebidas", "agroindustria"], templateKey: "Manufactura / Industrial" },
  { id: "automotriz", label: "Automotriz", aliases: ["automotriz", "automóvil"], templateKey: "Manufactura / Industrial" },
  { id: "energia", label: "Energía", aliases: ["energía", "energia", "eléctrica", "renovable"], templateKey: "Genérico" },
  { id: "agua", label: "Agua y saneamiento", aliases: ["agua", "saneamiento", "potable"], templateKey: "Genérico" },
  { id: "transporte", label: "Transporte y logística", aliases: ["transporte", "logística", "logistica y transporte"], templateKey: "Transporte y Logística" },
  { id: "almacenamiento", label: "Almacenamiento", aliases: ["almacenamiento", "bodegas", "depósito"], templateKey: "Transporte y Logística" },
  { id: "comercio-mayorista", label: "Comercio mayorista", aliases: ["mayorista", "distribución"], templateKey: "Genérico" },
  { id: "comercio-minorista", label: "Comercio minorista", aliases: ["minorista", "retail", "comercio y retail"], templateKey: "Genérico" },
  { id: "servicios-prof", label: "Servicios profesionales", aliases: ["servicios profesionales", "profesionales"], templateKey: "Servicios e Ingeniería" },
  { id: "ingenieria", label: "Ingeniería y consultoría", aliases: ["ingeniería", "consultoría", "servicios e ingeniería"], templateKey: "Servicios e Ingeniería" },
  { id: "tecnologia", label: "Tecnología / TI", aliases: ["tecnología", "ti", "software", "informática"], templateKey: "Servicios e Ingeniería" },
  { id: "telecom", label: "Telecomunicaciones", aliases: ["telecomunicaciones", "telecom"], templateKey: "Genérico" },
  { id: "financiero", label: "Servicios financieros", aliases: ["financiero", "banca"], templateKey: "Genérico" },
  { id: "seguros", label: "Seguros", aliases: ["seguros", "aseguradora"], templateKey: "Genérico" },
  { id: "inmobiliario", label: "Inmobiliario", aliases: ["inmobiliario", "inmobiliaria"], templateKey: "Genérico" },
  { id: "salud", label: "Salud", aliases: ["salud", "asistencia", "salud y asistencia", "hospital", "clínica"], templateKey: "Genérico" },
  { id: "educacion", label: "Educación", aliases: ["educación", "educacion", "colegio", "universidad"], templateKey: "Genérico" },
  { id: "hoteleria", label: "Hotelería", aliases: ["hotelería", "hotel"], templateKey: "Genérico" },
  { id: "gastronomia", label: "Gastronomía", aliases: ["gastronomía", "restaurant", "cocina"], templateKey: "Genérico" },
  { id: "turismo", label: "Turismo", aliases: ["turismo", "viajes"], templateKey: "Genérico" },
  { id: "seguridad-privada", label: "Seguridad privada", aliases: ["seguridad privada", "guardias"], templateKey: "Genérico" },
  { id: "limpieza", label: "Limpieza y servicios generales", aliases: ["limpieza", "aseo", "servicios generales"], templateKey: "Genérico" },
  { id: "admin-publica", label: "Administración pública", aliases: ["administración pública", "municipalidad", "gobierno"], templateKey: "Genérico" },
  { id: "comunitarios", label: "Servicios comunitarios", aliases: ["comunitarios", "ong"], templateKey: "Genérico" },
  { id: "ambientales", label: "Servicios ambientales", aliases: ["ambientales", "medio ambiente"], templateKey: "Genérico" },
  { id: "residuos", label: "Gestión de residuos", aliases: ["residuos", "reciclaje"], templateKey: "Genérico" },
  { id: "forestal", label: "Forestal", aliases: ["forestal", "madera"], templateKey: "Genérico" },
  { id: "portuario", label: "Portuario", aliases: ["portuario", "puerto"], templateKey: "Transporte y Logística" },
  { id: "maritimo", label: "Marítimo", aliases: ["marítimo", "naval"], templateKey: "Transporte y Logística" },
  { id: "aeronautico", label: "Aeronáutico", aliases: ["aeronáutico", "aviación"], templateKey: "Transporte y Logística" },
  { id: "mantenimiento-ind", label: "Mantenimiento industrial", aliases: ["mantenimiento industrial"], templateKey: "Manufactura / Industrial" },
  { id: "servicios-tecnicos", label: "Servicios técnicos", aliases: ["servicios técnicos", "técnicos especializados"], templateKey: "Servicios e Ingeniería" },
  { id: "otro", label: "Otro", aliases: ["otro", "otro rubro"], templateKey: "Genérico" },
];

/** Labels ordenados para `<select>` */
export const ECONOMIC_SECTOR_LABELS: string[] = ECONOMIC_SECTORS.map((s) => s.label);

/**
 * Resuelve rubro guardado (label o alias legacy) al templateKey de plantillas IPER.
 */
export function resolveSectorTemplateKey(sectorName?: string): SectorTemplateKey {
  if (!sectorName?.trim()) return "Genérico";

  const normalized = sectorName.toLowerCase().trim();

  const byLabel = ECONOMIC_SECTORS.find(
    (s) => s.label.toLowerCase() === normalized
  );
  if (byLabel) return byLabel.templateKey;

  const byAlias = ECONOMIC_SECTORS.find((s) =>
    s.aliases.some((a) => a === normalized || normalized.includes(a) || a.includes(normalized))
  );
  if (byAlias) return byAlias.templateKey;

  // Legacy fuzzy (compatibilidad datos antiguos)
  if (normalized.includes("servicio") || normalized.includes("ingenier") || normalized.includes("consultor")) {
    return "Servicios e Ingeniería";
  }
  if (normalized.includes("miner")) return "Minería";
  if (normalized.includes("transp") || normalized.includes("logíst")) return "Transporte y Logística";
  if (normalized.includes("manuf") || normalized.includes("industr")) return "Manufactura / Industrial";
  if (normalized.includes("construc") || normalized.includes("obra") || normalized.includes("edific")) {
    return "Construcción";
  }

  return "Genérico";
}

export function findEconomicSectorByLabel(label: string): EconomicSectorOption | undefined {
  const n = label.toLowerCase().trim();
  return ECONOMIC_SECTORS.find(
    (s) => s.label.toLowerCase() === n || s.aliases.some((a) => a === n)
  );
}

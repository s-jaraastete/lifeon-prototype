import * as XLSX from "xlsx";

/**
 * ============================================================================
 * LIFEON EXCEL THEME & WORKBOOK UTILITY
 * Sistema centralizado de generación y estilizado de plantillas XLSX para LifeOn.
 * Garantiza coherencia visual, distinción clara entre obligatorios y opcionales,
 * congelación de paneles, anchos de columna automáticos y normalización de importación.
 * ============================================================================
 */

export const LIFEON_XLSX_COLORS = {
  primaryTeal: "0D9488",       // LifeOn Teal (#0D9488)
  darkTeal: "115E59",          // Deep Teal (#115E59)
  navyBanner: "0F172A",        // Slate Dark (#0F172A)
  optionalGray: "475569",      // Slate 600 (#475569)
  softTealBg: "F0FDFA",        // Teal 50
  softGrayBg: "F8FAFC",        // Slate 50
  borderColor: "CBD5E1",       // Border Slate 300
  whiteText: "FFFFFF",
  darkText: "0F172A",
  mutedText: "64748B",
};

export interface ThemeColumnDefinition {
  header: string;             // Nombre base del campo (ej: "Nombre Centro de Trabajo")
  key: string;                // Clave normalizada interna
  mandatory: boolean;         // Si es obligatorio
  width?: number;             // Ancho de columna en caracteres aproximados
  align?: "left" | "center" | "right";
  notes?: string;             // Nota o descripción para comentarios
}

export interface SheetConfig {
  sheetTitle: string;
  sheetSubtitle?: string;
  columns: ThemeColumnDefinition[];
  data: Record<string, any>[];
  includeSubheader?: boolean;  // Fila 2 explícita "OBLIGATORIO" / "OPCIONAL"
}

export interface InstructionSection {
  title: string;
  items: string[];
}

/**
 * Formatea el encabezado visible con indicador inequívoco
 */
export function formatHeaderLabel(col: ThemeColumnDefinition): string {
  if (col.mandatory) {
    return `${col.header} * [OBLIGATORIO]`;
  }
  return `${col.header} [OPCIONAL]`;
}

/**
 * Crea una hoja de datos formateada con el sistema visual LifeOn
 */
export function createThemedDataSheet(config: SheetConfig): XLSX.WorkSheet {
  const { columns, data, includeSubheader = true } = config;

  // 1. Fila de encabezados principales
  const headerRow = columns.map((col) => formatHeaderLabel(col));

  // 2. Fila secundaria de tipos (OBLIGATORIO / OPCIONAL)
  const subheaderRow = columns.map((col) => (col.mandatory ? "OBLIGATORIO" : "OPCIONAL"));

  // 3. Filas de datos
  const dataRows = data.map((row) => {
    return columns.map((col) => {
      const val = row[col.key] ?? row[col.header] ?? "";
      return val !== null && val !== undefined ? val : "";
    });
  });

  const allAoa: any[][] = [];
  allAoa.push(headerRow);
  if (includeSubheader) {
    allAoa.push(subheaderRow);
  }
  dataRows.forEach((r) => allAoa.push(r));

  const ws = XLSX.utils.aoa_to_sheet(allAoa);

  // 4. Anchos de columnas configurados
  ws["!cols"] = columns.map((col) => ({
    wch: col.width || Math.max(col.header.length + 12, 16),
  }));

  // 5. Congelar encabezados
  const freezeRow = includeSubheader ? 2 : 1;
  ws["!views"] = [{ state: "frozen", ySplit: freezeRow }];

  // 6. Rango de autofiltro en la fila de encabezados
  const lastColLetter = XLSX.utils.encode_col(columns.length - 1);
  const totalRows = allAoa.length;
  ws["!autofilter"] = { ref: `A1:${lastColLetter}${totalRows}` };

  // 7. Aplicar estilos en celdas (compatible con motores compatibles de SheetJS)
  columns.forEach((col, cIdx) => {
    const headerCellAddress = XLSX.utils.encode_cell({ r: 0, c: cIdx });
    if (ws[headerCellAddress]) {
      ws[headerCellAddress].s = {
        fill: {
          fgColor: { rgb: col.mandatory ? LIFEON_XLSX_COLORS.primaryTeal : LIFEON_XLSX_COLORS.optionalGray },
        },
        font: {
          name: "Segoe UI",
          sz: 10,
          bold: true,
          color: { rgb: LIFEON_XLSX_COLORS.whiteText },
        },
        alignment: {
          horizontal: col.align || "left",
          vertical: "center",
          wrapText: false,
        },
        border: {
          top: { style: "thin", color: { rgb: LIFEON_XLSX_COLORS.borderColor } },
          bottom: { style: "medium", color: { rgb: LIFEON_XLSX_COLORS.primaryTeal } },
          left: { style: "thin", color: { rgb: LIFEON_XLSX_COLORS.borderColor } },
          right: { style: "thin", color: { rgb: LIFEON_XLSX_COLORS.borderColor } },
        },
      };
    }

    if (includeSubheader) {
      const subCellAddress = XLSX.utils.encode_cell({ r: 1, c: cIdx });
      if (ws[subCellAddress]) {
        ws[subCellAddress].s = {
          fill: {
            fgColor: { rgb: col.mandatory ? LIFEON_XLSX_COLORS.softTealBg : LIFEON_XLSX_COLORS.softGrayBg },
          },
          font: {
            name: "Segoe UI",
            sz: 8,
            bold: true,
            color: { rgb: col.mandatory ? LIFEON_XLSX_COLORS.darkTeal : LIFEON_XLSX_COLORS.optionalGray },
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
          border: {
            bottom: { style: "thin", color: { rgb: LIFEON_XLSX_COLORS.borderColor } },
          },
        };
      }
    }
  });

  return ws;
}

/**
 * Crea la hoja de Instrucciones con diseño profesional y leyenda de colores
 */
export function createThemedInstructionsSheet(params: {
  title: string;
  subtitle: string;
  sections: InstructionSection[];
  legendNotes?: string[];
}): XLSX.WorkSheet {
  const { title, subtitle, sections, legendNotes = [] } = params;

  const aoa: string[][] = [];

  // Banner Principal
  aoa.push([`LIFEON — ${title.toUpperCase()}`]);
  aoa.push([subtitle]);
  aoa.push([""]);

  // Leyenda de Campos Obligatorios vs Opcionales
  aoa.push(["================================================================================"]);
  aoa.push(["LEYENDA DE IDENTIFICACIÓN DE CAMPOS (CÓDIGO VISUAL LIFEON):"]);
  aoa.push(["  * [OBLIGATORIO]  → Encabezado en VERDE AZULADO (#0D9488) con asterisco (*)."]);
  aoa.push(["                     Dato indispensable para registrar la entidad y procesar relaciones."]);
  aoa.push(["  [OPCIONAL]       → Encabezado en GRIS PIZARRA (#475569)."]);
  aoa.push(["                     Dato complementario. Puede dejarse en blanco sin afectar la carga."]);
  legendNotes.forEach((note) => aoa.push([`  * NOTA: ${note}`]));
  aoa.push(["================================================================================"]);
  aoa.push([""]);

  // Secciones informativas
  sections.forEach((sec) => {
    aoa.push([sec.title.toUpperCase()]);
    sec.items.forEach((item) => {
      aoa.push([`• ${item}`]);
    });
    aoa.push([""]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 110 }];

  // Estilo al título principal
  if (ws["A1"]) {
    ws["A1"].s = {
      font: { name: "Segoe UI", sz: 14, bold: true, color: { rgb: LIFEON_XLSX_COLORS.darkTeal } },
    };
  }

  return ws;
}

/**
 * Normaliza las filas importadas para ser 100% tolerantes a:
 * - Fila secundaria de "OBLIGATORIO" / "OPCIONAL"
 * - Claves con asterisco "*" o etiquetas "[OBLIGATORIO]"
 * - Diferencias de acentos o mayúsculas
 */
export function normalizeImportedRows<T = any>(
  worksheet: XLSX.WorkSheet,
  columnMapping?: Record<string, string>
): T[] {
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  if (rawRows.length === 0) return [];

  const normalizedResults: any[] = [];

  // Función para normalizar cualquier string de encabezado
  const cleanKey = (key: string): string => {
    return key
      .toLowerCase()
      .replace(/\*/g, "")
      .replace(/\[obligatorio\]/gi, "")
      .replace(/\[opcional\]/gi, "")
      .replace(/\(obligatorio\)/gi, "")
      .replace(/\(opcional\)/gi, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];

    // Verificar si la fila es la subcabecera "OBLIGATORIO" / "OPCIONAL"
    const rowValues = Object.values(rawRow).map((v) => String(v).trim().toUpperCase());
    const isSubheader = rowValues.some(
      (v) => v === "OBLIGATORIO" || v === "OPCIONAL"
    ) && !rowValues.some((v) => v.length > 25);

    if (isSubheader && i === 0) {
      continue; // Ignorar la fila subcabecera
    }

    // Verificar si la fila está completamente vacía
    const hasAnyValue = Object.values(rawRow).some((v) => String(v).trim() !== "");
    if (!hasAnyValue) continue;

    const cleanRow: Record<string, any> = {};

    for (const [rawColKey, val] of Object.entries(rawRow)) {
      const normalizedKey = cleanKey(rawColKey);

      // Si existe mapeo explícito
      if (columnMapping && columnMapping[normalizedKey]) {
        cleanRow[columnMapping[normalizedKey]] = val;
      }

      // Guardar también con la clave normalizada
      cleanRow[normalizedKey] = val;

      // Preservar clave original recortada
      cleanRow[rawColKey.trim()] = val;
    }

    normalizedResults.push(cleanRow as T);
  }

  return normalizedResults;
}

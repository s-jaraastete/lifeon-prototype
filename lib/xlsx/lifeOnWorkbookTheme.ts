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

export interface SheetMetadataField {
  label: string;
  value: string;
  mandatory?: boolean;
}

export interface SheetConfig {
  sheetTitle: string;
  sheetSubtitle?: string;
  metadata?: SheetMetadataField[];
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
  const { columns, data, metadata, includeSubheader = true } = config;

  const allAoa: any[][] = [];
  let tableHeaderRowIndex = 0;

  // 1. Zona superior de Metadatos de la Matriz (si existe)
  if (metadata && metadata.length > 0) {
    allAoa.push(["METADATOS DE LA MATRIZ IPER", ""]);
    metadata.forEach((m) => {
      const label = m.mandatory ? `${m.label} * [OBLIGATORIO]` : `${m.label} [OPCIONAL]`;
      allAoa.push([label, m.value ?? ""]);
    });
    allAoa.push(["", ""]); // Fila vacía de separación visual limpia
    tableHeaderRowIndex = allAoa.length;
  }

  // 2. Fila de encabezados principales de la tabla
  const headerRow = columns.map((col) => formatHeaderLabel(col));

  // 3. Fila secundaria de tipos (OBLIGATORIO / OPCIONAL)
  const subheaderRow = columns.map((col) => (col.mandatory ? "OBLIGATORIO" : "OPCIONAL"));

  // 4. Filas de datos
  const dataRows = data.map((row) => {
    return columns.map((col) => {
      const val = row[col.key] ?? row[col.header] ?? "";
      return val !== null && val !== undefined ? val : "";
    });
  });

  allAoa.push(headerRow);
  if (includeSubheader) {
    allAoa.push(subheaderRow);
  }
  dataRows.forEach((r) => allAoa.push(r));

  const ws = XLSX.utils.aoa_to_sheet(allAoa);

  // 5. Anchos de columnas configurados
  ws["!cols"] = columns.map((col) => ({
    wch: col.width || Math.max(col.header.length + 12, 16),
  }));

  // 6. Congelar paneles
  const freezeRow = tableHeaderRowIndex + (includeSubheader ? 2 : 1);
  ws["!views"] = [{ state: "frozen", ySplit: freezeRow }];

  // 7. Rango de autofiltro en la fila de encabezados de la tabla
  const lastColLetter = XLSX.utils.encode_col(columns.length - 1);
  const totalRows = allAoa.length;
  ws["!autofilter"] = { ref: `A${tableHeaderRowIndex + 1}:${lastColLetter}${totalRows}` };

  // 8. Aplicar estilos en celdas de metadatos y encabezados
  if (metadata && metadata.length > 0) {
    // Título de metadatos
    const metaTitleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (ws[metaTitleCell]) {
      ws[metaTitleCell].s = {
        font: { name: "Segoe UI", sz: 11, bold: true, color: { rgb: LIFEON_XLSX_COLORS.darkTeal } },
      };
    }
  }

  columns.forEach((col, cIdx) => {
    const headerCellAddress = XLSX.utils.encode_cell({ r: tableHeaderRowIndex, c: cIdx });
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
      const subCellAddress = XLSX.utils.encode_cell({ r: tableHeaderRowIndex + 1, c: cIdx });
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

export interface ParsedIperMatrixResult {
  matrixName: string | null;
  matrixType?: string | null;
  workCenter?: string | null;
  area?: string | null;
  process?: string | null;
  code?: string | null;
  description?: string | null;
  rows: any[];
}

/**
 * Parsea una hoja de cálculo XLSX de Matriz IPER extrayendo la zona superior
 * de metadatos (Nombre de la Matriz, Centro, Área, etc.) y la tabla tabular de datos.
 */
export function parseIperWorkbookWithMetadata(worksheet: XLSX.WorkSheet): ParsedIperMatrixResult {
  const cleanStr = (val: any) => (val !== null && val !== undefined ? String(val).trim() : "");
  const cleanHeader = (key: string): string => {
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

  const rawAoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  let matrixName: string | null = null;
  let matrixType: string | null = null;
  let workCenter: string | null = null;
  let area: string | null = null;
  let process: string | null = null;
  let code: string | null = null;
  let description: string | null = null;

  let tableHeaderRowIdx = -1;

  for (let r = 0; r < rawAoa.length; r++) {
    const row = rawAoa[r] || [];
    const firstCell = cleanHeader(cleanStr(row[0]));
    const secondCell = cleanStr(row[1]);

    if (firstCell.includes("nombre") && (firstCell.includes("matriz") || firstCell.includes("nombre de la matriz"))) {
      if (secondCell) matrixName = secondCell;
    } else if (firstCell.includes("tipo") && firstCell.includes("matriz")) {
      if (secondCell) matrixType = secondCell;
    } else if (firstCell.includes("centro") && (firstCell.includes("trabajo") || firstCell.includes("centro"))) {
      if (secondCell) workCenter = secondCell;
    } else if (firstCell.startsWith("area") || firstCell === "area") {
      if (secondCell) area = secondCell;
    } else if (firstCell.startsWith("proceso") || firstCell === "proceso") {
      if (secondCell) process = secondCell;
    } else if (firstCell.startsWith("codigo") || firstCell === "codigo") {
      if (secondCell) code = secondCell;
    } else if (firstCell.includes("descripcion")) {
      if (secondCell) description = secondCell;
    }

    // Identificar fila donde comienzan los encabezados de la tabla IPER
    const rowHeaders = row.map((c) => cleanHeader(cleanStr(c)));
    const hasTaskCol = rowHeaders.some((h) => h.includes("tarea") || h.includes("task"));
    const hasHazardOrCargo = rowHeaders.some((h) => h.includes("peligro") || h.includes("hazard") || h.includes("cargo"));
    if (hasTaskCol && hasHazardOrCargo) {
      tableHeaderRowIdx = r;
      break;
    }
  }

  let rows: any[] = [];
  if (tableHeaderRowIdx >= 0) {
    const headerRow = rawAoa[tableHeaderRowIdx].map((c) => cleanHeader(cleanStr(c)));
    const dataAoa = rawAoa.slice(tableHeaderRowIdx + 1);

    for (let i = 0; i < dataAoa.length; i++) {
      const row = dataAoa[i] || [];
      const rowVals = row.map((v) => cleanStr(v).toUpperCase());
      const isSub = rowVals.some((v) => v === "OBLIGATORIO" || v === "OPCIONAL") && !rowVals.some((v) => v.length > 25);
      if (isSub && i === 0) continue;

      const hasValue = row.some((v) => cleanStr(v) !== "");
      if (!hasValue) continue;

      const rowObj: Record<string, any> = {};
      headerRow.forEach((colKey, colIdx) => {
        if (!colKey) return;
        const val = row[colIdx];
        rowObj[colKey] = val !== undefined && val !== null ? val : "";
      });

      // Si la columna contiene el nombre de la matriz y no lo teníamos arriba
      if (!matrixName) {
        const colMatrixName = rowObj["nombre de la matriz"] || rowObj["nombre matriz"] || rowObj["matriz"];
        if (colMatrixName && cleanStr(colMatrixName)) {
          matrixName = cleanStr(colMatrixName);
        }
      }

      rows.push(rowObj);
    }
  } else {
    // Si no se detectó cabecera con metadatos superior, usar normalizer
    rows = normalizeImportedRows(worksheet);
    if (rows.length > 0 && !matrixName) {
      const first = rows[0];
      const colName = first["nombre de la matriz"] || first["nombre matriz"] || first["matriz"];
      if (colName && cleanStr(colName)) {
        matrixName = cleanStr(colName);
      }
    }
  }

  return {
    matrixName,
    matrixType,
    workCenter,
    area,
    process,
    code,
    description,
    rows,
  };
}


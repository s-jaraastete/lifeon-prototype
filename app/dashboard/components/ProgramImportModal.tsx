"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import clsx from "clsx";
import {
  LuUpload,
  LuFileSpreadsheet,
  LuCheck,
  LuX,
  LuTriangleAlert,
  LuCircleCheck,
  LuCircleAlert,
  LuInfo,
  LuArrowRight,
  LuDownload,
} from "react-icons/lu";
import {
  ProgramActivity,
  ActivityCategory,
  ActivityPeriodicity,
  ActivityStatus,
  ActivityApplicability,
} from "@/types/preventiveProgram";
import { OrgWorkCenter, OrgArea, OrgPosition, OrgUser } from "@/types/orgStructure";
import { normalizeImportedRows } from "@/lib/xlsx/lifeOnWorkbookTheme";

interface ProgramImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workCenters: OrgWorkCenter[];
  areas: OrgArea[];
  positions: OrgPosition[];
  users: OrgUser[];
  onConfirmImport: (activities: ProgramActivity[]) => void;
  onDownloadTemplate: () => void;
}

interface ValidationErrorItem {
  rowNumber: number;
  activity: string;
  message: string;
}

export default function ProgramImportModal({
  isOpen,
  onClose,
  workCenters,
  areas,
  positions,
  users,
  onConfirmImport,
  onDownloadTemplate,
}: ProgramImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Resultados de validación
  const [totalRows, setTotalRows] = useState(0);
  const [validActivities, setValidActivities] = useState<ProgramActivity[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasValidated, setHasValidated] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setIsAnalyzing(false);
    setParseError(null);
    setTotalRows(0);
    setValidActivities([]);
    setValidationErrors([]);
    setWarnings([]);
    setHasValidated(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsAnalyzing(true);
    setParseError(null);
    setValidationErrors([]);
    setWarnings([]);
    setValidActivities([]);
    setHasValidated(false);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      // Buscar hoja PROGRAMA
      const targetSheetName =
        workbook.SheetNames.find((s) => s.trim().toUpperCase() === "PROGRAMA") ||
        workbook.SheetNames.find((s) => s.trim().toUpperCase() !== "INSTRUCCIONES") ||
        workbook.SheetNames[0];

      if (!targetSheetName) {
        setParseError("El archivo no contiene hojas con datos.");
        setIsAnalyzing(false);
        return;
      }

      const ws = workbook.Sheets[targetSheetName];
      const rows = normalizeImportedRows<any>(ws);

      if (rows.length === 0) {
        setParseError("La hoja 'PROGRAMA' no contiene registros válidos para procesar.");
        setIsAnalyzing(false);
        return;
      }

      setTotalRows(rows.length);

      // Mapas de búsqueda rápida (en minúsculas)
      const wcByName = new Map(workCenters.map((w) => [w.name.toLowerCase().trim(), w]));
      const areaByName = new Map(areas.map((a) => [a.name.toLowerCase().trim(), a]));
      const posByName = new Map(positions.map((p) => [p.name.toLowerCase().trim(), p]));
      const userByName = new Map(users.map((u) => [u.name.toLowerCase().trim(), u]));

      const errorsList: ValidationErrorItem[] = [];
      const warningsList: string[] = [];
      const parsedValidActivities: ProgramActivity[] = [];

      const validPeriodicities: ActivityPeriodicity[] = [
        "Una vez",
        "Mensual",
        "Trimestral",
        "Semestral",
        "Anual",
        "Según necesidad",
        "Otra",
        "Única vez",
        "Bimestral",
      ];

      const validStatuses: ActivityStatus[] = ["Pendiente", "En curso", "Cumplida", "Atrasada"];

      rows.forEach((r, idx) => {
        const rowNum = idx + 2;
        const code = String(r["codigo"] || "").trim();
        const categoryRaw = String(r["categoria"] || "Planificación y Gestión").trim();
        const activityName = String(r["actividad"] || r["nombre"] || "").trim();
        const description = String(r["descripcion"] || "").trim();
        const objective = String(r["objetivo"] || "").trim();
        const wcVal = String(r["centro de trabajo"] || r["centro"] || "").trim();
        const areaVal = String(r["area"] || "").trim();
        const respUserVal = String(r["responsable"] || "").trim();
        const respPosVal = String(r["cargo responsable"] || r["cargo"] || "").trim();
        const startDateVal = String(r["fecha inicio"] || r["inicio"] || "").trim();
        const endDateVal = String(r["fecha termino"] || r["termino"] || r["fin"] || "").trim();
        const periodicityRaw = String(r["periodicidad"] || "").trim();
        const applicabilityRaw = String(r["aplicabilidad"] || "Obligatoria").trim();
        const statusRaw = String(r["estado"] || "Pendiente").trim();
        const progressRaw = Number(r["porcentaje de avance"] || r["avance"] || 0);
        const observations = String(r["observaciones"] || "").trim();

        let rowHasError = false;

        // 1. Validar Actividad (Obligatorio)
        if (!activityName) {
          errorsList.push({
            rowNumber: rowNum,
            activity: `Fila ${rowNum}`,
            message: "El campo 'Actividad' es obligatorio.",
          });
          rowHasError = true;
        }

        // 2. Validar Centro de Trabajo (si se informa, debe existir)
        let matchedWcId: string | undefined;
        let matchedWcName: string | undefined;
        if (wcVal) {
          const foundWc = wcByName.get(wcVal.toLowerCase());
          if (!foundWc) {
            errorsList.push({
              rowNumber: rowNum,
              activity: activityName || `Fila ${rowNum}`,
              message: `El Centro de Trabajo '${wcVal}' no existe en la Estructura Organizacional.`,
            });
            rowHasError = true;
          } else {
            matchedWcId = foundWc.id;
            matchedWcName = foundWc.name;
          }
        }

        // 3. Validar Área (si se informa, debe existir y coincidir con el centro si aplica)
        let matchedAreaId: string | undefined;
        let matchedAreaName: string | undefined;
        if (areaVal) {
          const foundArea = areaByName.get(areaVal.toLowerCase());
          if (!foundArea) {
            errorsList.push({
              rowNumber: rowNum,
              activity: activityName || `Fila ${rowNum}`,
              message: `El Área '${areaVal}' no existe en la Estructura Organizacional.`,
            });
            rowHasError = true;
          } else {
            matchedAreaId = foundArea.id;
            matchedAreaName = foundArea.name;

            // Si se informó centro y el área tiene centro asociado, validar coherencia
            if (
              matchedWcName &&
              foundArea.workCenter &&
              foundArea.workCenter.toLowerCase() !== matchedWcName.toLowerCase()
            ) {
              errorsList.push({
                rowNumber: rowNum,
                activity: activityName || `Fila ${rowNum}`,
                message: `El Área '${areaVal}' pertenece al centro '${foundArea.workCenter}' y no a '${matchedWcName}'.`,
              });
              rowHasError = true;
            }
          }
        }

        // 4. Validar Responsable o Cargo Responsable (al menos uno debe existir)
        let matchedUserId: string | undefined;
        let matchedUserName: string | undefined;
        let matchedPosId: string | undefined;
        let matchedPosName: string | undefined;

        if (respUserVal) {
          const foundUser = userByName.get(respUserVal.toLowerCase());
          if (!foundUser) {
            errorsList.push({
              rowNumber: rowNum,
              activity: activityName || `Fila ${rowNum}`,
              message: `El Responsable '${respUserVal}' no existe en los Usuarios de la organización.`,
            });
            rowHasError = true;
          } else {
            matchedUserId = foundUser.id;
            matchedUserName = foundUser.name;
          }
        }

        if (respPosVal) {
          const foundPos = posByName.get(respPosVal.toLowerCase());
          if (!foundPos) {
            errorsList.push({
              rowNumber: rowNum,
              activity: activityName || `Fila ${rowNum}`,
              message: `El Cargo Responsable '${respPosVal}' no existe en los Cargos de la organización.`,
            });
            rowHasError = true;
          } else {
            matchedPosId = foundPos.id;
            matchedPosName = foundPos.name;
          }
        }

        if (!respUserVal && !respPosVal) {
          errorsList.push({
            rowNumber: rowNum,
            activity: activityName || `Fila ${rowNum}`,
            message: "Debe indicar al menos un Responsable o Cargo Responsable válido.",
          });
          rowHasError = true;
        }

        // 5. Validar Fechas
        if (!startDateVal) {
          errorsList.push({
            rowNumber: rowNum,
            activity: activityName || `Fila ${rowNum}`,
            message: "El campo 'Fecha Inicio' es obligatorio.",
          });
          rowHasError = true;
        }
        if (!endDateVal) {
          errorsList.push({
            rowNumber: rowNum,
            activity: activityName || `Fila ${rowNum}`,
            message: "El campo 'Fecha Término' es obligatorio.",
          });
          rowHasError = true;
        }

        if (startDateVal && endDateVal) {
          const startMs = Date.parse(startDateVal);
          const endMs = Date.parse(endDateVal);
          if (isNaN(startMs) || isNaN(endMs)) {
            errorsList.push({
              rowNumber: rowNum,
              activity: activityName || `Fila ${rowNum}`,
              message: "Formato de fecha inválido. Utilice AAAA-MM-DD (ej: 2026-03-15).",
            });
            rowHasError = true;
          } else if (endMs < startMs) {
            errorsList.push({
              rowNumber: rowNum,
              activity: activityName || `Fila ${rowNum}`,
              message: `Fecha de término (${endDateVal}) no puede ser anterior a fecha de inicio (${startDateVal}).`,
            });
            rowHasError = true;
          }
        }

        // 6. Validar Periodicidad
        let finalPeriodicity: ActivityPeriodicity = "Mensual";
        const matchedPeriodicity = validPeriodicities.find(
          (p) => p.toLowerCase() === periodicityRaw.toLowerCase()
        );
        if (!matchedPeriodicity) {
          if (!periodicityRaw) {
            errorsList.push({
              rowNumber: rowNum,
              activity: activityName || `Fila ${rowNum}`,
              message: "El campo 'Periodicidad' es obligatorio.",
            });
            rowHasError = true;
          } else {
            warningsList.push(`Fila ${rowNum}: Periodicidad '${periodicityRaw}' no estándar; se asignará 'Mensual'.`);
            finalPeriodicity = "Mensual";
          }
        } else {
          finalPeriodicity = matchedPeriodicity;
        }

        // 7. Validar Estado
        let finalStatus: ActivityStatus = "Pendiente";
        const matchedStatus = validStatuses.find(
          (s) => s.toLowerCase() === statusRaw.toLowerCase()
        );
        if (matchedStatus) {
          finalStatus = matchedStatus;
        } else if (statusRaw) {
          warningsList.push(`Fila ${rowNum}: Estado '${statusRaw}' desconocido; se registrará como 'Pendiente'.`);
        }

        if (!rowHasError) {
          parsedValidActivities.push({
            id: `act-imp-${Date.now()}-${idx + 1}`,
            code: code || `ACT-IMP-${String(idx + 1).padStart(2, "0")}`,
            name: activityName,
            description: description || activityName,
            objective: objective || undefined,
            category: (categoryRaw as ActivityCategory) || "Planificación y Gestión",
            areaId: matchedAreaId,
            areaName: matchedAreaName,
            responsibleUserId: matchedUserId,
            responsibleUserName: matchedUserName,
            responsiblePositionId: matchedPosId,
            responsiblePositionName: matchedPosName,
            startDate: startDateVal,
            endDate: endDateVal,
            periodicity: finalPeriodicity,
            applicability: (applicabilityRaw as ActivityApplicability) || "Obligatoria",
            status: finalStatus,
            progress: Math.min(Math.max(progressRaw || 0, 0), 100),
            evidences: [],
            observations: observations || undefined,
          });
        }
      });

      setValidationErrors(errorsList);
      setWarnings(warningsList);
      setValidActivities(parsedValidActivities);
      setHasValidated(true);
      setIsAnalyzing(false);
    } catch (err: any) {
      console.error("Error al procesar archivo:", err);
      setParseError("Error al interpretar el archivo XLSX: " + (err.message || "Formato incompatible."));
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    if (validActivities.length === 0) return;
    onConfirmImport(validActivities);
    handleClose();
  };

  const canConfirm = hasValidated && validActivities.length > 0 && validationErrors.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 p-6 max-h-[90vh] flex flex-col relative">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition cursor-pointer"
        >
          <LuX className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <LuFileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Importar Programa de Trabajo</h3>
            <p className="text-xs text-gray-500">
              Carga masiva mediante archivo XLSX con validación cruzada con Estructura Organizacional
            </p>
          </div>
        </div>

        {/* Cuerpo con scroll */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4 pr-1">
          {/* Instrucción y descarga de plantilla */}
          <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-teal-900">
              <LuInfo className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>
                ¿No tienes el archivo estructurado? Descarga la plantilla oficial con el estándar visual LifeOn.
              </span>
            </div>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <LuDownload className="w-3.5 h-3.5" />
              <span>Descargar Plantilla XLSX</span>
            </button>
          </div>

          {/* Área de carga de archivo */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              "border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2",
              selectedFile ? "border-teal-500 bg-teal-50/20" : "border-gray-200 hover:border-teal-400 bg-gray-50/50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <LuUpload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">
                {selectedFile ? selectedFile.name : "Haz clic para seleccionar el archivo Excel (.xlsx)"}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB — Listo para validación`
                  : "Se procesará únicamente la hoja 'PROGRAMA'"}
              </p>
            </div>
          </div>

          {parseError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <LuCircleAlert className="w-4 h-4 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {isAnalyzing && (
            <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <span>Analizando y validando estructura organizacional...</span>
            </div>
          )}

          {/* PREVISUALIZACIÓN DE IMPORTACIÓN (REQS 23 & 24) */}
          {hasValidated && !isAnalyzing && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* Tarjetas resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Total Leídas</span>
                  <p className="text-xl font-black text-gray-800 mt-0.5">{totalRows}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Válidas</span>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{validActivities.length}</p>
                </div>
                <div className={clsx("p-3 rounded-xl border", validationErrors.length > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200")}>
                  <span className={clsx("text-[10px] uppercase font-bold", validationErrors.length > 0 ? "text-red-600" : "text-gray-400")}>
                    Con Errores
                  </span>
                  <p className={clsx("text-xl font-black mt-0.5", validationErrors.length > 0 ? "text-red-700" : "text-gray-800")}>
                    {validationErrors.length}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-600">Advertencias</span>
                  <p className="text-xl font-black text-amber-700 mt-0.5">{warnings.length}</p>
                </div>
              </div>

              {/* Detalle de Errores de Validación */}
              {validationErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <LuTriangleAlert className="w-4 h-4 text-red-600" />
                    <span>Se encontraron {validationErrors.length} inconsistencias que impiden la importación:</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                    {validationErrors.map((err, i) => (
                      <div key={i} className="text-[11px] text-red-700 bg-white/70 p-2 rounded-lg border border-red-100 flex items-start gap-2">
                        <span className="font-bold text-red-800 whitespace-nowrap">Fila {err.rowNumber}:</span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advertencias no bloqueantes */}
              {warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex flex-col gap-1">
                  <span className="font-bold flex items-center gap-1">
                    <LuInfo className="w-3.5 h-3.5 text-amber-600" />
                    Advertencias de normalización:
                  </span>
                  {warnings.slice(0, 3).map((w, i) => (
                    <span key={i}>• {w}</span>
                  ))}
                  {warnings.length > 3 && <span className="text-[10px] text-amber-600">... y {warnings.length - 3} más</span>}
                </div>
              )}

              {/* Previsualización de actividades válidas */}
              {validActivities.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-2">
                    <LuCircleCheck className="w-4 h-4 text-teal-600" />
                    <span>Previsualización de Actividades a Importar ({validActivities.length}):</span>
                  </h4>
                  <div className="border border-gray-200 rounded-xl overflow-x-auto max-h-44">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase font-semibold">
                        <tr>
                          <th className="px-3 py-2">Código</th>
                          <th className="px-3 py-2">Actividad</th>
                          <th className="px-3 py-2">Responsable / Cargo</th>
                          <th className="px-3 py-2">Inicio - Término</th>
                          <th className="px-3 py-2">Periodicidad</th>
                          <th className="px-3 py-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700">
                        {validActivities.slice(0, 5).map((a, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-3 py-1.5 font-mono text-[10px] text-teal-700 font-bold">{a.code}</td>
                            <td className="px-3 py-1.5 font-medium max-w-xs truncate">{a.name}</td>
                            <td className="px-3 py-1.5 text-gray-600">{a.responsibleUserName || a.responsiblePositionName || "-"}</td>
                            <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{a.startDate} / {a.endDate}</td>
                            <td className="px-3 py-1.5">{a.periodicity}</td>
                            <td className="px-3 py-1.5 font-semibold text-teal-700">{a.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validActivities.length > 5 && (
                    <p className="text-[10px] text-gray-400 text-right">
                      Mostrando las primeras 5 de {validActivities.length} actividades
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className={clsx(
              "px-5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs",
              canConfirm
                ? "bg-teal-600 hover:bg-teal-700 text-white cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            <LuCheck className="w-4 h-4" />
            <span>Confirmar Importación ({validActivities.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
}

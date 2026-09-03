"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  LuX,
  LuUpload,
  LuFileText,
  LuCalendar,
  LuShieldCheck,
  LuTag,
} from "react-icons/lu";
import { DocCategory, PreventiveDoc } from "@/types/preventiveDocs";

interface DocUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDoc?: PreventiveDoc | null;
  onUploadCustomFile: (
    docId: string,
    fileInfo: {
      fileName: string;
      fileSize?: string;
      expiryDate?: string;
      author?: string;
      version?: string;
    }
  ) => void;
  onAddNewDocument?: (newDoc: Omit<PreventiveDoc, "id">) => void;
}

export default function DocUploadModal({
  isOpen,
  onClose,
  targetDoc,
  onUploadCustomFile,
  onAddNewDocument,
}: DocUploadModalProps) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(targetDoc?.title || "");
  const [code, setCode] = useState(targetDoc?.code || "");
  const [category, setCategory] = useState<DocCategory>(
    targetDoc?.category || "Procedimiento PTS"
  );
  const [regulatoryBasis, setRegulatoryBasis] = useState(
    targetDoc?.regulatoryBasis || "DS 594 / Código del Trabajo"
  );
  const [author, setAuthor] = useState(targetDoc?.author || "Sergio A. Jara Astete");
  const [version, setVersion] = useState(targetDoc?.version || "v1.0");
  const [issueDate, setIssueDate] = useState(
    targetDoc?.issueDate || new Date().toLocaleDateString("es-CL")
  );
  const [expiryDate, setExpiryDate] = useState(targetDoc?.expiryDate || "31-12-2026");
  const [fileName, setFileName] = useState(
    targetDoc?.fileName || `${code || "DOC"}_Oficial_Empresa.pdf`
  );
  const [isSimulatedFileAttached, setIsSimulatedFileAttached] = useState(!!targetDoc?.hasFile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      alert("Por favor ingresa el título y código del documento.");
      return;
    }

    if (targetDoc) {
      // Reemplazo de archivo en documento existente
      onUploadCustomFile(targetDoc.id, {
        fileName: fileName.trim() || `${code}_Oficial.pdf`,
        fileSize: "2.1 MB",
        expiryDate,
        author,
        version,
      });
    } else if (onAddNewDocument) {
      // Nuevo documento personalizado
      onAddNewDocument({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        category,
        regulatoryBasis: regulatoryBasis.trim(),
        version,
        status: "Vigente",
        author,
        issueDate,
        expiryDate,
        source: "Cargado por Empresa",
        hasFile: true,
        fileName: fileName.trim() || `${code}_Oficial.pdf`,
        fileSize: "1.8 MB",
        auditScore: 70,
        auditStatus: "Con Observaciones",
        contentSections: [
          {
            id: "sec-1",
            title: "1. Descripción y Alcance Operacional",
            content: "Documento oficial provisto por la empresa para cumplimiento normativo.",
          },
        ],
        auditChecklist: [
          {
            id: `aud-${Date.now()}-1`,
            code: "AUD-GEN-01",
            requirement: "Documento firmado y formalizado por la jefatura competente.",
            normativeReference: regulatoryBasis,
            criticality: "Crítico",
            status: "Cumple",
            notes: "Documento recibido y cargado formalmente.",
            lastAuditedDate: new Date().toLocaleDateString("es-CL"),
          },
          {
            id: `aud-${Date.now()}-2`,
            code: "AUD-GEN-02",
            requirement: "Registro de difusión y toma de conocimiento firmado por los trabajadores.",
            normativeReference: "DS 40 Art. 21",
            criticality: "Mayor",
            status: "Observado",
            notes: "Verificar firmas de respaldo en terreno.",
            lastAuditedDate: new Date().toLocaleDateString("es-CL"),
          },
        ],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 p-6 relative flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition cursor-pointer"
        >
          <LuX className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <LuUpload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {targetDoc ? `Cargar Documento: ${targetDoc.code}` : "Cargar Documento Propio"}
            </h3>
            <p className="text-xs text-gray-500">
              {targetDoc
                ? "Adjunta el archivo PDF o Word oficial de la empresa para esta exigencia normativa."
                : "Registra un procedimiento o protocolo propio de la organización."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                Código *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: PTS-ALT-01"
                disabled={!!targetDoc}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono disabled:bg-gray-100"
              />
            </div>

            <div className="sm:col-span-8">
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                Título del Documento *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Procedimiento de Trabajo Seguro en Altura"
                disabled={!!targetDoc}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                Categoría Normativa
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocCategory)}
                disabled={!!targetDoc}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 bg-white disabled:bg-gray-100"
              >
                <option value="Programa Anual SST">Programa Anual SST</option>
                <option value="Reglamento Interno">Reglamento Interno</option>
                <option value="Plan de Emergencia">Plan de Emergencia</option>
                <option value="Procedimiento PTS">Procedimiento PTS</option>
                <option value="Protocolo Minsal">Protocolo Minsal</option>
                <option value="Registro Obligatorio">Registro Obligatorio</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                Versión del Documento
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="Ej: v2.0"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-gray-700 block mb-1">
              Base Legal / Referencia Fiscalizable
            </label>
            <input
              type="text"
              value={regulatoryBasis}
              onChange={(e) => setRegulatoryBasis(e.target.value)}
              placeholder="Ej: DS 44 Art. 8 / DS 594"
              disabled={!!targetDoc}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                Fecha de Emisión / Vigencia
              </label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                placeholder="DD-MM-YYYY"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                Fecha de Vencimiento *
              </label>
              <input
                type="text"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                placeholder="DD-MM-YYYY o Indefinido"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:ring-2 focus:ring-teal-500/20 font-medium"
              />
            </div>
          </div>

          {/* Área de Arrastre de Archivo */}
          <div>
            <label className="text-[11px] font-semibold text-gray-700 block mb-1">
              Archivo Digital (PDF, Word o Excel)
            </label>
            <div
              onClick={() => setIsSimulatedFileAttached(true)}
              className={clsx(
                "border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5",
                isSimulatedFileAttached
                  ? "border-emerald-300 bg-emerald-50/40 text-emerald-900"
                  : "border-gray-200 bg-gray-50/70 hover:bg-teal-50/30 hover:border-teal-300 text-gray-600"
              )}
            >
              <LuUpload className={clsx("w-6 h-6", isSimulatedFileAttached ? "text-emerald-600" : "text-teal-600")} />
              {isSimulatedFileAttached ? (
                <div>
                  <p className="font-bold text-xs text-emerald-900">
                    ✓ Archivo adjunto: {fileName}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    Tamaño: 2.1 MB • Listo para subir y auditar
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-xs text-gray-800">
                    Haz clic o arrastra tu documento aquí
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Soporta PDF, DOCX, XLSX (Hasta 25 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs"
            >
              Guardar y Vincular Documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

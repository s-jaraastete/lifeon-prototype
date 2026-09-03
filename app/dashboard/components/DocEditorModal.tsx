"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  LuX,
  LuSquarePen,
  LuSave,
  LuPrinter,
  LuDownload,
  LuRotateCcw,
  LuCheck,
  LuFileText,
  LuPlus,
  LuTrash2,
  LuSparkles,
} from "react-icons/lu";
import { PreventiveDoc, DocSection } from "@/types/preventiveDocs";

interface DocEditorModalProps {
  isOpen: boolean;
  doc: PreventiveDoc | null;
  onClose: () => void;
  onSaveSections: (docId: string, sections: DocSection[]) => void;
}

export default function DocEditorModal({
  isOpen,
  doc,
  onClose,
  onSaveSections,
}: DocEditorModalProps) {
  if (!isOpen || !doc) return null;

  const [sections, setSections] = useState<DocSection[]>(() =>
    doc.contentSections && doc.contentSections.length > 0
      ? doc.contentSections
      : [
          {
            id: "sec-1",
            title: "1. Objetivo y Alcance",
            content: "Definir las directrices operacionales y responsabilidades...",
          },
          {
            id: "sec-2",
            title: "2. Marco Legal y Referencias",
            content: doc.regulatoryBasis,
          },
        ]
  );

  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id || ""
  );

  const [hasSaved, setHasSaved] = useState(false);

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  const handleUpdateSectionContent = (content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === activeSectionId ? { ...s, content } : s))
    );
    setHasSaved(false);
  };

  const handleUpdateSectionTitle = (title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === activeSectionId ? { ...s, title } : s))
    );
    setHasSaved(false);
  };

  const handleAddSection = () => {
    const newSec: DocSection = {
      id: `sec-${Date.now()}`,
      title: `${sections.length + 1}. Nueva Sección o Anexo Técnico`,
      content: "Ingresa el contenido, procedimiento o directriz aplicable...",
    };
    setSections([...sections, newSec]);
    setActiveSectionId(newSec.id);
    setHasSaved(false);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) return;
    const filtered = sections.filter((s) => s.id !== id);
    setSections(filtered);
    if (activeSectionId === id) {
      setActiveSectionId(filtered[0]?.id || "");
    }
    setHasSaved(false);
  };

  const handleSave = () => {
    onSaveSections(doc.id, sections);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 via-white to-teal-50/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <LuSquarePen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                  {doc.code}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {doc.category}
                </span>
                <span className="text-[10px] text-teal-700 bg-teal-100/60 font-bold px-2 py-0.5 rounded-md">
                  Propuesta Base Modificable
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                {doc.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <LuFileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Exigencia: <strong className="text-gray-700">{doc.regulatoryBasis}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:text-teal-700 hover:bg-teal-50 border border-gray-200 rounded-xl transition cursor-pointer"
              title="Imprimir propuesta"
            >
              <LuPrinter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Editor: 2 Columnas (Navegación de Secciones + Editor de Contenido) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Columna Izquierda: Índice de Secciones (4 cols) */}
          <div className="md:col-span-4 border-r border-gray-100 bg-gray-50/50 p-4 flex flex-col justify-between overflow-y-auto max-h-[60vh] md:max-h-none">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Estructura del Documento
                </span>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                >
                  <LuPlus className="w-3.5 h-3.5" />
                  + Sección
                </button>
              </div>

              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={clsx(
                    "p-3 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between group",
                    activeSectionId === sec.id
                      ? "bg-white border-teal-500 text-teal-900 shadow-xs ring-2 ring-teal-500/10"
                      : "bg-white border-gray-200 text-gray-700 hover:border-teal-200 hover:bg-teal-50/30"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-md bg-gray-100 group-hover:bg-teal-100 text-gray-600 group-hover:text-teal-800 text-[10px] font-mono flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{sec.title}</span>
                  </div>

                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSection(sec.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition cursor-pointer"
                      title="Eliminar sección"
                    >
                      <LuTrash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 text-[11px] text-gray-500 flex items-center gap-1.5">
              <LuSparkles className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span>Contenido redactado bajo normativa chilena vigente. Ajusta según la faena.</span>
            </div>
          </div>

          {/* Columna Derecha: Editor de la Sección Activa (8 cols) */}
          <div className="md:col-span-8 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto bg-white">
            {activeSection ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Título de la Sección:
                  </label>
                  <input
                    type="text"
                    value={activeSection.title}
                    onChange={(e) => handleUpdateSectionTitle(e.target.value)}
                    className="w-full text-sm font-bold text-gray-900 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Cuerpo Normativo / Procedimiento Específico:
                  </label>
                  <textarea
                    rows={12}
                    value={activeSection.content}
                    onChange={(e) => handleUpdateSectionContent(e.target.value)}
                    className="w-full text-xs text-gray-800 border border-gray-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans leading-relaxed resize-y min-h-[220px]"
                    placeholder="Redacta los procedimientos, responsabilidades y medidas preventivas aplicables..."
                  />
                </div>
              </div>
            ) : null}

            {/* Acciones de Guardado */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
              <div className="flex items-center gap-2">
                {hasSaved && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <LuCheck className="w-4 h-4" />
                    Cambios guardados en el sistema
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition cursor-pointer shadow-xs"
                >
                  <LuSave className="w-4 h-4" />
                  Guardar Propuesta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

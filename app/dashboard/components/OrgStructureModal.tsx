"use client";

import { useState, useMemo } from "react";
import clsx from "clsx";
import {
  LuX,
  LuPlus,
  LuTrash2,
  LuPencil,
  LuFolderTree,
  LuChevronDown,
  LuChevronUp,
  LuSearch,
  LuSparkles,
  LuCheck,
  LuLayers,
  LuBuilding2,
  LuTag,
  LuRotateCw,
  LuCircleAlert,
  LuCircleCheck,
} from "react-icons/lu";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { SECTOR_RISK_PROFILES } from "@/data/sectorRiskTemplates";
import { OrgArea, OrgProcess } from "@/types/orgStructure";

interface OrgStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrgStructureModal({ isOpen, onClose }: OrgStructureModalProps) {
  const { preferences } = useLifeOnPreferences();
  const {
    areas,
    addArea,
    updateArea,
    removeArea,
    addProcess,
    updateProcess,
    removeProcess,
    addSubprocess,
    removeSubprocess,
    loadSectorDefaults,
    totalAreasCount,
    totalProcessesCount,
    totalSubprocessesCount,
  } = useOrgStructure();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAreaIds, setExpandedAreaIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estados de formularios para creación / edición
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaCode, setNewAreaCode] = useState("");
  const [newAreaWorkCenter, setNewAreaWorkCenter] = useState("");

  const [editingArea, setEditingArea] = useState<OrgArea | null>(null);
  const [editAreaName, setEditAreaName] = useState("");
  const [editAreaCode, setEditAreaCode] = useState("");

  // Formulario para nuevo proceso en un área específica
  const [addingProcessAreaId, setAddingProcessAreaId] = useState<string | null>(null);
  const [newProcessName, setNewProcessName] = useState("");
  const [newProcessSubprocesses, setNewProcessSubprocesses] = useState("");

  // Edición de proceso
  const [editingProcess, setEditingProcess] = useState<{
    areaId: string;
    process: OrgProcess;
  } | null>(null);
  const [editProcessName, setEditProcessName] = useState("");

  // Input rápido para nuevo subproceso en un proceso específico
  const [quickSubInputs, setQuickSubInputs] = useState<Record<string, string>>({});

  // Confirmación de recarga de catálogo por rubro
  const [isConfirmReloadOpen, setIsConfirmReloadOpen] = useState(false);
  const [selectedSectorToLoad, setSelectedSectorToLoad] = useState(
    preferences.organizationSector || "Construcción"
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const toggleAreaExpand = (id: string) => {
    setExpandedAreaIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtrar áreas según búsqueda
  const filteredAreas = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return areas;

    return areas.filter((area) => {
      const matchArea =
        area.name.toLowerCase().includes(q) ||
        (area.code && area.code.toLowerCase().includes(q));
      const matchProc = area.processes.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.subprocesses.some((s) => s.name.toLowerCase().includes(q))
      );
      return matchArea || matchProc;
    });
  }, [areas, searchQuery]);

  if (!isOpen) return null;

  // Handlers para Área
  const handleSaveNewArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName.trim()) return;
    const created = addArea(newAreaName, newAreaCode, "", newAreaWorkCenter);
    setNewAreaName("");
    setNewAreaCode("");
    setNewAreaWorkCenter("");
    setIsAddAreaOpen(false);
    // Expandir el área recién creada
    setExpandedAreaIds((prev) => ({ ...prev, [created.id]: true }));
    showToast(`Área "${created.name}" creada exitosamente.`);
  };

  const handleSaveEditArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea || !editAreaName.trim()) return;
    updateArea(editingArea.id, {
      name: editAreaName.trim(),
      code: editAreaCode.trim() || undefined,
    });
    showToast(`Área "${editAreaName}" actualizada.`);
    setEditingArea(null);
  };

  const handleDeleteArea = (area: OrgArea) => {
    if (confirm(`¿Estás seguro de eliminar el área "${area.name}" con sus ${area.processes.length} procesos?`)) {
      removeArea(area.id);
      showToast(`Área "${area.name}" eliminada.`);
    }
  };

  // Handlers para Proceso
  const handleSaveNewProcess = (e: React.FormEvent, areaId: string) => {
    e.preventDefault();
    if (!newProcessName.trim()) return;
    const subsList = newProcessSubprocesses
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    addProcess(areaId, newProcessName, undefined, undefined, subsList);
    setNewProcessName("");
    setNewProcessSubprocesses("");
    setAddingProcessAreaId(null);
    showToast(`Proceso agregado con éxito.`);
  };

  const handleSaveEditProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProcess || !editProcessName.trim()) return;
    updateProcess(editingProcess.areaId, editingProcess.process.id, {
      name: editProcessName.trim(),
    });
    showToast(`Proceso actualizado.`);
    setEditingProcess(null);
  };

  const handleDeleteProcess = (areaId: string, process: OrgProcess) => {
    if (confirm(`¿Eliminar el proceso "${process.name}"?`)) {
      removeProcess(areaId, process.id);
      showToast(`Proceso "${process.name}" eliminado.`);
    }
  };

  // Handlers para Subproceso
  const handleAddQuickSub = (areaId: string, processId: string) => {
    const val = (quickSubInputs[processId] || "").trim();
    if (!val) return;
    addSubprocess(areaId, processId, val);
    setQuickSubInputs((prev) => ({ ...prev, [processId]: "" }));
  };

  const handleLoadDefaults = () => {
    loadSectorDefaults(selectedSectorToLoad);
    setIsConfirmReloadOpen(false);
    showToast(`Estructura restablecida con la plantilla estándar de ${selectedSectorToLoad}.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Toast Flotante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <LuCircleCheck className="w-5 h-5 text-teal-400 flex-shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* 1. Header del Modal */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col gap-4 bg-gradient-to-b from-teal-50/40 via-white to-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 flex-shrink-0">
                <LuFolderTree className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                    Gestión de Áreas y Estructura Organizacional
                  </h3>
                  <span className="bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Corporativo
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Define las áreas de trabajo de la empresa, junto con sus procesos y subprocesos. Esta estructura estará disponible para la confección de matrices IPER.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>

          {/* Badges de Contadores y Acciones Principales */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-semibold">
                <LuBuilding2 className="w-4 h-4 text-teal-600" />
                <span>{totalAreasCount} Áreas</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold">
                <LuLayers className="w-4 h-4 text-slate-600" />
                <span>{totalProcessesCount} Procesos</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold">
                <LuTag className="w-4 h-4 text-emerald-600" />
                <span>{totalSubprocessesCount} Subprocesos</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsConfirmReloadOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
                title="Cargar estructura sugerida de la industria"
              >
                <LuSparkles className="w-3.5 h-3.5 text-amber-500" />
                Cargar plantilla según rubro
              </button>

              <button
                type="button"
                onClick={() => setIsAddAreaOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition cursor-pointer"
              >
                <LuPlus className="w-4 h-4" />
                Nueva Área
              </button>
            </div>
          </div>

          {/* Barra de Búsqueda */}
          <div className="relative">
            <LuSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por área, proceso o subproceso..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* 2. Cuerpo con el Árbol de Áreas, Procesos y Subprocesos */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-[#F8FAFC]">
          {/* Modal / Formulario para Agregar Nueva Área */}
          {isAddAreaOpen && (
            <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <LuPlus className="w-4 h-4 text-teal-600" />
                  Agregar Nueva Área de Trabajo
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddAreaOpen(false)}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer text-xs"
                >
                  <LuX className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNewArea} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Nombre del Área *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Maestranza Central, Bodega de Químicos, Frente de Obra..."
                    value={newAreaName}
                    onChange={(e) => setNewAreaName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[11px] font-semibold text-gray-700 block mb-1">
                    Código (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: AR-001"
                    value={newAreaCode}
                    onChange={(e) => setNewAreaCode(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none font-mono"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Guardar Área
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddAreaOpen(false)}
                    className="py-2.5 px-3 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Modal para Editar Área */}
          {editingArea && (
            <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <LuPencil className="w-4 h-4 text-teal-600" />
                    Editar Área
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingArea(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <LuX className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveEditArea} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Nombre del Área
                    </label>
                    <input
                      type="text"
                      required
                      value={editAreaName}
                      onChange={(e) => setEditAreaName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Código
                    </label>
                    <input
                      type="text"
                      value={editAreaCode}
                      onChange={(e) => setEditAreaCode(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setEditingArea(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal para Editar Proceso */}
          {editingProcess && (
            <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <LuPencil className="w-4 h-4 text-teal-600" />
                    Editar Proceso
                  </h4>
                  <button
                    type="button"
                    onClick={() => setEditingProcess(null)}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <LuX className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveEditProcess} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Nombre del Proceso
                    </label>
                    <input
                      type="text"
                      required
                      value={editProcessName}
                      onChange={(e) => setEditProcessName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setEditingProcess(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                    >
                      Guardar Proceso
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Confirmación para Recargar Plantilla del Rubro */}
          {isConfirmReloadOpen && (
            <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <LuSparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Cargar Plantilla según Rubro</h4>
                    <p className="text-xs text-gray-500">
                      Selecciona un rubro para precargar su estructura operativa estándar de áreas, procesos y subprocesos.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Rubro / Sector</label>
                  <select
                    value={selectedSectorToLoad}
                    onChange={(e) => setSelectedSectorToLoad(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    {Object.keys(SECTOR_RISK_PROFILES).map((sectorKey) => (
                      <option key={sectorKey} value={sectorKey}>
                        {SECTOR_RISK_PROFILES[sectorKey].sectorDisplayName || sectorKey}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <LuCircleAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Esta acción reemplazará la estructura actual con la plantilla del rubro seleccionado.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsConfirmReloadOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDefaults}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Confirmar y Cargar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Listado de Áreas */}
          {filteredAreas.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200 flex flex-col items-center justify-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <LuFolderTree className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                {searchQuery ? "No se encontraron resultados" : "No hay áreas registradas"}
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                {searchQuery
                  ? `No se encontró ningún elemento que coincida con "${searchQuery}".`
                  : "Comienza agregando la primera área operativa de tu empresa o carga la plantilla recomendada según tu rubro."}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAreaOpen(true)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  + Agregar Primera Área
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmReloadOpen(true)}
                  className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cargar Plantilla
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {filteredAreas.map((area, aIdx) => {
                const isExpanded = expandedAreaIds[area.id] ?? true; // Por defecto desplegado
                const totalSubInArea = area.processes.reduce(
                  (acc, p) => acc + (p.subprocesses?.length || 0),
                  0
                );

                return (
                  <div
                    key={area.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs hover:border-teal-300 transition-all"
                  >
                    {/* Fila de Encabezado del Área */}
                    <div
                      onClick={() => toggleAreaExpand(area.id)}
                      className="p-4 flex items-center justify-between gap-3 cursor-pointer bg-white hover:bg-gray-50/70 transition select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        >
                          {isExpanded ? (
                            <LuChevronUp className="w-4 h-4 text-teal-600" />
                          ) : (
                            <LuChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-teal-200">
                          {aIdx + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{area.name}</h4>
                            {area.code && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                                {area.code}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {area.processes.length} proceso{area.processes.length !== 1 ? "s" : ""} &bull;{" "}
                            {totalSubInArea} subproceso{totalSubInArea !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Botones de Acción sobre el Área */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 flex-shrink-0"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setAddingProcessAreaId(area.id);
                            if (!isExpanded) toggleAreaExpand(area.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition cursor-pointer"
                        >
                          <LuPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Proceso</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingArea(area);
                            setEditAreaName(area.name);
                            setEditAreaCode(area.code || "");
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                          title="Editar área"
                        >
                          <LuPencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteArea(area)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Eliminar área"
                        >
                          <LuTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contenido Desplegado: Procesos y Subprocesos */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100 flex flex-col gap-3 bg-gray-50/40">
                        {/* Formulario rápido para añadir proceso a esta área */}
                        {addingProcessAreaId === area.id && (
                          <div className="p-3.5 bg-white border border-teal-200 rounded-xl shadow-2xs animate-in fade-in duration-150">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-800">
                                + Agregar Proceso a {area.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setAddingProcessAreaId(null)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer text-xs"
                              >
                                &times;
                              </button>
                            </div>
                            <form
                              onSubmit={(e) => handleSaveNewProcess(e, area.id)}
                              className="flex flex-col sm:flex-row items-end gap-2.5"
                            >
                              <div className="flex-1 w-full">
                                <label className="text-[10px] font-semibold text-gray-600 block mb-1">
                                  Nombre del Proceso
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Ej: Chancado Primario, Montaje de Andamios..."
                                  value={newProcessName}
                                  onChange={(e) => setNewProcessName(e.target.value)}
                                  className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:outline-none"
                                />
                              </div>
                              <div className="flex-1 w-full">
                                <label className="text-[10px] font-semibold text-gray-600 block mb-1">
                                  Subprocesos (separados por coma, opcional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ej: Tolva de recepción, Alimentador vibratorio"
                                  value={newProcessSubprocesses}
                                  onChange={(e) => setNewProcessSubprocesses(e.target.value)}
                                  className="w-full bg-[#F8FAFC] border border-gray-200 rounded-lg p-2 text-xs text-gray-900 focus:outline-none"
                                />
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  type="submit"
                                  className="py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg cursor-pointer flex-1 sm:flex-none"
                                >
                                  Agregar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAddingProcessAreaId(null)}
                                  className="py-2 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* Listado de Procesos de esta Área */}
                        {area.processes.length === 0 ? (
                          <div className="p-3 bg-white border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                            Esta área aún no tiene procesos definidos. Haz clic en "+ Proceso" arriba para agregar uno.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {area.processes.map((proc, pIdx) => (
                              <div
                                key={proc.id}
                                className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col gap-2 shadow-2xs hover:border-teal-200 transition"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                      {pIdx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-gray-800 truncate">
                                      {proc.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingProcess({ areaId: area.id, process: proc });
                                        setEditProcessName(proc.name);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-700 rounded-md transition cursor-pointer"
                                      title="Editar proceso"
                                    >
                                      <LuPencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProcess(area.id, proc)}
                                      className="p-1 text-gray-400 hover:text-red-600 rounded-md transition cursor-pointer"
                                      title="Eliminar proceso"
                                    >
                                      <LuTrash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Chips de Subprocesos */}
                                <div className="pt-1.5 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-semibold text-gray-400 mr-0.5">
                                    Subprocesos:
                                  </span>

                                  {proc.subprocesses.length === 0 ? (
                                    <span className="text-[11px] text-gray-400 italic">
                                      Sin subprocesos
                                    </span>
                                  ) : (
                                    proc.subprocesses.map((sub) => (
                                      <span
                                        key={sub.id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-900 border border-teal-200 rounded-md text-[11px] font-medium"
                                      >
                                        {sub.name}
                                        <button
                                          type="button"
                                          onClick={() => removeSubprocess(area.id, proc.id, sub.id)}
                                          className="text-teal-500 hover:text-red-600 cursor-pointer ml-0.5 leading-none"
                                          title="Eliminar subproceso"
                                        >
                                          &times;
                                        </button>
                                      </span>
                                    ))
                                  )}

                                  {/* Input rápido para agregar subproceso */}
                                  <div className="inline-flex items-center gap-1">
                                    <input
                                      type="text"
                                      placeholder="+ Subproceso"
                                      value={quickSubInputs[proc.id] || ""}
                                      onChange={(e) =>
                                        setQuickSubInputs((prev) => ({
                                          ...prev,
                                          [proc.id]: e.target.value,
                                        }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddQuickSub(area.id, proc.id);
                                        }
                                      }}
                                      className="w-24 px-2 py-0.5 bg-[#F8FAFC] border border-gray-200 hover:border-gray-300 focus:border-teal-500 rounded-md text-[11px] text-gray-800 focus:w-36 transition-all focus:outline-none"
                                    />
                                    {quickSubInputs[proc.id] && (
                                      <button
                                        type="button"
                                        onClick={() => handleAddQuickSub(area.id, proc.id)}
                                        className="px-1.5 py-0.5 bg-teal-600 text-white rounded-md text-[10px] font-bold cursor-pointer hover:bg-teal-700"
                                      >
                                        +
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Footer del Modal */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex items-center justify-between gap-3 bg-white">
          <p className="text-xs text-gray-500 hidden sm:block">
            Los cambios se guardan automáticamente y se sincronizan con las matrices IPER.
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition cursor-pointer shadow-xs"
            >
              Listo / Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

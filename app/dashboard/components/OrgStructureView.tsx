"use client";

import React, { useState, useMemo, useRef } from "react";
import clsx from "clsx";
import {
  LuFolderTree,
  LuPlus,
  LuUpload,
  LuDownload,
  LuSearch,
  LuBriefcase,
  LuUsers,
  LuLayers,
  LuPencil,
  LuPower,
  LuCheck,
  LuX,
  LuTriangleAlert,
  LuCircleCheck,
  LuChevronDown,
  LuChevronRight,
  LuBuilding2,
  LuMail,
  LuUserCheck,
  LuSparkles,
  LuFileSpreadsheet,
  LuMapPin,
  LuTrash2,
  LuInfo,
} from "react-icons/lu";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import {
  OrgWorkCenter,
  OrgArea,
  OrgProcess,
  OrgPosition,
  UserRole,
  XlsxValidationReport,
} from "@/types/orgStructure";

type OrgTab = "centros" | "areas" | "procesos" | "cargos" | "usuarios";

export default function OrgStructureView() {
  const { isGuided } = useLifeOnPreferences();
  const {
    workCenters,
    areas,
    positions,
    users,
    addWorkCenter,
    updateWorkCenter,
    toggleWorkCenterStatus,
    deleteWorkCenter,
    addArea,
    updateArea,
    toggleAreaStatus,
    addProcess,
    updateProcess,
    toggleProcessStatus,
    addSubprocess,
    toggleSubprocessStatus,
    addPosition,
    updatePosition,
    togglePositionStatus,
    addUser,
    updateUser,
    toggleUserStatus,
    validateImportFile,
    applyBulkImportXlsx,
    downloadTemplateXlsx,
    totalWorkCentersCount,
    totalActiveWorkCentersCount,
    totalAreasCount,
    totalActiveAreasCount,
    totalProcessesCount,
    totalSubprocessesCount,
    totalPositionsCount,
    totalUsersCount,
  } = useOrgStructure();

  const [activeTab, setActiveTab] = useState<OrgTab>("centros");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtros dependientes para pestaña Procesos
  const [filterWcId, setFilterWcId] = useState<string>("all");
  const [filterAreaId, setFilterAreaId] = useState<string>("all");

  // Modales
  const [isAddWcModalOpen, setIsAddWcModalOpen] = useState(false);
  const [isEditWcModalOpen, setIsEditWcModalOpen] = useState(false);
  const [editingWc, setEditingWc] = useState<OrgWorkCenter | null>(null);

  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<OrgArea | null>(null);

  const [isAddProcModalOpen, setIsAddProcModalOpen] = useState(false);
  const [addingProcessToAreaId, setAddingProcessToAreaId] = useState<string>("");

  const [isAddPositionModalOpen, setIsAddPositionModalOpen] = useState(false);
  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<OrgPosition | null>(null);

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Formularios Centros de Trabajo
  const [wcFormName, setWcFormName] = useState("");
  const [wcFormCode, setWcFormCode] = useState("");
  const [wcFormAddress, setWcFormAddress] = useState("");
  const [wcFormDesc, setWcFormDesc] = useState("");

  // Formularios Áreas
  const [areaFormName, setAreaFormName] = useState("");
  const [areaFormCode, setAreaFormCode] = useState("");
  const [areaFormWorkCenterId, setAreaFormWorkCenterId] = useState("");
  const [areaFormDesc, setAreaFormDesc] = useState("");

  // Formularios Procesos
  const [procFormAreaId, setProcFormAreaId] = useState("");
  const [procFormName, setProcFormName] = useState("");
  const [procFormCode, setProcFormCode] = useState("");
  const [procFormDesc, setProcFormDesc] = useState("");
  const [procFormSubprocesses, setProcFormSubprocesses] = useState("");

  // Formularios Subprocesos rápidos
  const [quickSubName, setQuickSubName] = useState<Record<string, string>>({});

  // Formularios Cargos con Dotación (Req 18 & 19)
  const [posFormName, setPosFormName] = useState("");
  const [posFormCode, setPosFormCode] = useState("");
  const [posFormDesc, setPosFormDesc] = useState("");
  const [posFormTotalStaff, setPosFormTotalStaff] = useState(1);
  const [posFormMenCount, setPosFormMenCount] = useState(1);
  const [posFormWomenCount, setPosFormWomenCount] = useState(0);
  const [posFormOtherCount, setPosFormOtherCount] = useState(0);
  const [posFormDisabledCount, setPosFormDisabledCount] = useState(0);
  const [posFormSensitiveCount, setPosFormSensitiveCount] = useState(0);
  const [posFormConditionsNote, setPosFormConditionsNote] = useState("");

  // Formularios Usuarios
  const [userFormName, setUserFormName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormCargoId, setUserFormCargoId] = useState("");
  const [userFormAreaId, setUserFormAreaId] = useState("");
  const [userFormRole, setUserFormRole] = useState<UserRole>("Editor");

  // Importación masiva XLSX
  const [xlsxReport, setXlsxReport] = useState<XlsxValidationReport | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  // =========================================================================
  // HANDLERS CENTROS DE TRABAJO
  // =========================================================================
  const handleOpenAddWc = () => {
    setWcFormName("");
    setWcFormCode(`CT-00${workCenters.length + 1}`);
    setWcFormAddress("");
    setWcFormDesc("");
    setIsAddWcModalOpen(true);
  };

  const handleCreateWc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wcFormName.trim()) return;
    addWorkCenter({
      name: wcFormName.trim(),
      code: wcFormCode.trim(),
      address: wcFormAddress.trim(),
      description: wcFormDesc.trim(),
    });
    setIsAddWcModalOpen(false);
  };

  const handleOpenEditWc = (wc: OrgWorkCenter) => {
    setEditingWc(wc);
    setWcFormName(wc.name);
    setWcFormCode(wc.code || "");
    setWcFormAddress(wc.address || "");
    setWcFormDesc(wc.description || "");
    setIsEditWcModalOpen(true);
  };

  const handleUpdateWc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWc || !wcFormName.trim()) return;
    updateWorkCenter(editingWc.id, {
      name: wcFormName.trim(),
      code: wcFormCode.trim(),
      address: wcFormAddress.trim(),
      description: wcFormDesc.trim(),
    });
    setIsEditWcModalOpen(false);
    setEditingWc(null);
  };

  const handleDeleteWc = (id: string) => {
    const res = deleteWorkCenter(id);
    if (!res.success && res.message) {
      alert(res.message);
    }
  };

  // =========================================================================
  // HANDLERS ÁREAS
  // =========================================================================
  const handleOpenAddArea = () => {
    setAreaFormName("");
    setAreaFormCode(`AR-00${areas.length + 1}`);
    setAreaFormWorkCenterId(workCenters[0]?.id || "");
    setAreaFormDesc("");
    setIsAddAreaModalOpen(true);
  };

  const handleCreateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaFormName.trim()) return;
    const selectedWc = workCenters.find((w) => w.id === areaFormWorkCenterId) || workCenters[0];
    addArea(
      areaFormName.trim(),
      areaFormCode.trim(),
      areaFormDesc.trim(),
      selectedWc?.name || "Obra Central",
      selectedWc?.id,
      selectedWc?.name
    );
    setIsAddAreaModalOpen(false);
  };

  const handleOpenEditArea = (area: OrgArea) => {
    setEditingArea(area);
    setAreaFormName(area.name);
    setAreaFormCode(area.code || "");
    setAreaFormWorkCenterId(area.workCenterId || "");
    setAreaFormDesc(area.description || "");
    setIsEditAreaModalOpen(true);
  };

  const handleUpdateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea || !areaFormName.trim()) return;
    const selectedWc = workCenters.find((w) => w.id === areaFormWorkCenterId);
    updateArea(editingArea.id, {
      name: areaFormName.trim(),
      code: areaFormCode.trim(),
      description: areaFormDesc.trim(),
      workCenter: selectedWc?.name || editingArea.workCenter,
      workCenterId: selectedWc?.id || editingArea.workCenterId,
      workCenterName: selectedWc?.name || editingArea.workCenterName,
    });
    setIsEditAreaModalOpen(false);
    setEditingArea(null);
  };

  // =========================================================================
  // HANDLERS PROCESOS Y SUBPROCESOS
  // =========================================================================
  const handleOpenAddProc = (defaultAreaId?: string) => {
    setProcFormAreaId(defaultAreaId || areas[0]?.id || "");
    setProcFormName("");
    setProcFormCode("");
    setProcFormDesc("");
    setProcFormSubprocesses("");
    setIsAddProcModalOpen(true);
  };

  const handleCreateProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procFormAreaId || !procFormName.trim()) return;
    const subs = procFormSubprocesses
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    addProcess(procFormAreaId, procFormName.trim(), procFormCode.trim(), procFormDesc.trim(), subs);
    setIsAddProcModalOpen(false);
  };

  const handleQuickAddSubprocess = (areaId: string, procId: string) => {
    const key = `${areaId}__${procId}`;
    const name = (quickSubName[key] || "").trim();
    if (!name) return;
    addSubprocess(areaId, procId, name);
    setQuickSubName((prev) => ({ ...prev, [key]: "" }));
  };

  // =========================================================================
  // HANDLERS CARGOS (REQ 18 & 19)
  // =========================================================================
  const handleOpenAddPosition = () => {
    setPosFormName("");
    setPosFormCode(`CARG-00${positions.length + 1}`);
    setPosFormDesc("");
    setPosFormTotalStaff(1);
    setPosFormMenCount(1);
    setPosFormWomenCount(0);
    setPosFormOtherCount(0);
    setPosFormDisabledCount(0);
    setPosFormSensitiveCount(0);
    setPosFormConditionsNote("");
    setIsAddPositionModalOpen(true);
  };

  const isStaffValid = useMemo(() => {
    return posFormMenCount + posFormWomenCount + posFormOtherCount <= posFormTotalStaff;
  }, [posFormTotalStaff, posFormMenCount, posFormWomenCount, posFormOtherCount]);

  const handleCreatePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!posFormName.trim() || !isStaffValid) return;
    addPosition(
      posFormName.trim(),
      posFormCode.trim(),
      undefined,
      posFormDesc.trim(),
      {
        totalStaff: Number(posFormTotalStaff) || 1,
        menCount: Number(posFormMenCount) || 0,
        womenCount: Number(posFormWomenCount) || 0,
        otherCount: Number(posFormOtherCount) || 0,
        disabledCount: Number(posFormDisabledCount) || 0,
        sensitiveCount: Number(posFormSensitiveCount) || 0,
        specialConditionsNote: posFormConditionsNote.trim(),
      }
    );
    setIsAddPositionModalOpen(false);
  };

  const handleOpenEditPosition = (pos: OrgPosition) => {
    setEditingPos(pos);
    setPosFormName(pos.name);
    setPosFormCode(pos.code || "");
    setPosFormDesc(pos.description || "");
    setPosFormTotalStaff(pos.totalStaff || 1);
    setPosFormMenCount(pos.menCount || 0);
    setPosFormWomenCount(pos.womenCount || 0);
    setPosFormOtherCount(pos.otherCount || 0);
    setPosFormDisabledCount(pos.disabledCount || 0);
    setPosFormSensitiveCount(pos.sensitiveCount || 0);
    setPosFormConditionsNote(pos.specialConditionsNote || "");
    setIsEditPositionModalOpen(true);
  };

  const handleUpdatePosition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPos || !posFormName.trim() || !isStaffValid) return;
    updatePosition(editingPos.id, {
      name: posFormName.trim(),
      code: posFormCode.trim(),
      description: posFormDesc.trim(),
      totalStaff: Number(posFormTotalStaff) || 1,
      menCount: Number(posFormMenCount) || 0,
      womenCount: Number(posFormWomenCount) || 0,
      otherCount: Number(posFormOtherCount) || 0,
      disabledCount: Number(posFormDisabledCount) || 0,
      sensitiveCount: Number(posFormSensitiveCount) || 0,
      specialConditionsNote: posFormConditionsNote.trim(),
    });
    setIsEditPositionModalOpen(false);
    setEditingPos(null);
  };

  // =========================================================================
  // HANDLERS USUARIOS
  // =========================================================================
  const handleOpenAddUser = () => {
    setUserFormName("");
    setUserFormEmail("");
    setUserFormCargoId(positions[0]?.id || "");
    setUserFormAreaId(areas[0]?.id || "");
    setUserFormRole("Editor");
    setIsAddUserModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormEmail.trim()) return;
    addUser(userFormName.trim(), userFormEmail.trim(), userFormCargoId, userFormAreaId, userFormRole);
    setIsAddUserModalOpen(false);
  };

  // =========================================================================
  // IMPORTACIÓN MASIVA
  // =========================================================================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const report = await validateImportFile(file);
      setXlsxReport(report);
    } catch (err) {
      console.error("Error al validar archivo:", err);
    }
  };

  const handleConfirmImport = () => {
    if (!xlsxReport || xlsxReport.validRecords === 0) return;
    applyBulkImportXlsx(xlsxReport.parsedData);
    setImportFeedback(`¡Se importaron ${xlsxReport.validRecords} registros correctamente!`);
    setTimeout(() => {
      setImportFeedback(null);
      setIsImportModalOpen(false);
      setXlsxReport(null);
    }, 2500);
  };

  // =========================================================================
  // FILTRADO DE DATOS
  // =========================================================================
  const filteredWorkCenters = useMemo(() => {
    if (!searchQuery.trim()) return workCenters;
    const q = searchQuery.toLowerCase();
    return workCenters.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.code && w.code.toLowerCase().includes(q)) ||
        (w.address && w.address.toLowerCase().includes(q))
    );
  }, [workCenters, searchQuery]);

  const filteredAreas = useMemo(() => {
    let list = areas;
    if (filterWcId !== "all") {
      list = list.filter((a) => a.workCenterId === filterWcId || a.workCenter === workCenters.find((w) => w.id === filterWcId)?.name);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.code && a.code.toLowerCase().includes(q)) ||
        (a.workCenter && a.workCenter.toLowerCase().includes(q))
    );
  }, [areas, workCenters, filterWcId, searchQuery]);

  const allProcessesFlat = useMemo(() => {
    const result: Array<{
      areaId: string;
      areaName: string;
      workCenterName: string;
      workCenterId?: string;
      process: OrgProcess;
    }> = [];
    areas.forEach((a) => {
      (a.processes || []).forEach((p) => {
        result.push({
          areaId: a.id,
          areaName: a.name,
          workCenterName: a.workCenterName || a.workCenter || "General",
          workCenterId: a.workCenterId,
          process: p,
        });
      });
    });
    return result;
  }, [areas]);

  const filteredProcesses = useMemo(() => {
    let list = allProcessesFlat;
    if (filterWcId !== "all") {
      list = list.filter((item) => item.workCenterId === filterWcId || item.workCenterName === workCenters.find((w) => w.id === filterWcId)?.name);
    }
    if (filterAreaId !== "all") {
      list = list.filter((item) => item.areaId === filterAreaId);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.process.name.toLowerCase().includes(q) ||
        (item.process.code && item.process.code.toLowerCase().includes(q)) ||
        item.areaName.toLowerCase().includes(q) ||
        item.process.subprocesses?.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [allProcessesFlat, filterWcId, filterAreaId, workCenters, searchQuery]);

  const filteredPositions = useMemo(() => {
    if (!searchQuery.trim()) return positions;
    const q = searchQuery.toLowerCase();
    return positions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [positions, searchQuery]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.cargoName && u.cargoName.toLowerCase().includes(q)) ||
        (u.areaName && u.areaName.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  return (
    <div className="flex flex-col gap-4 font-[family-name:var(--font-poppins)] select-none">
      {/* Encabezado del Módulo */}
      <section className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#F04438] flex items-center justify-center font-bold">
              <LuFolderTree className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Estructura Organizacional
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Jerarquía transversal: Centro de Trabajo &rarr; Área &rarr; Proceso &rarr; Subproceso.
              </p>
            </div>
          </div>

          {isGuided && (
            <div className="mt-3 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-800 flex items-center gap-2">
              <LuSparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>
                <strong>Modo Guiado:</strong> Esta jerarquía alimenta de manera contextual la confección
                de la Matriz IPER, las asignaciones de cargo y el Programa Preventivo.
              </span>
            </div>
          )}
        </div>

        {/* Acciones globales */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={downloadTemplateXlsx}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition cursor-pointer"
            title="Descargar plantilla Excel multi-hoja (.xlsx)"
          >
            <LuFileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Plantilla XLSX</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
          >
            <LuUpload className="w-4 h-4 text-teal-600" />
            <span>Importar estructura</span>
          </button>

          {activeTab === "centros" && (
            <button
              type="button"
              onClick={handleOpenAddWc}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F04438] hover:bg-[#D92D20] transition shadow-xs cursor-pointer"
            >
              <LuPlus className="w-4 h-4" />
              <span>Nuevo Centro de Trabajo</span>
            </button>
          )}

          {activeTab === "areas" && (
            <button
              type="button"
              onClick={handleOpenAddArea}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F04438] hover:bg-[#D92D20] transition shadow-xs cursor-pointer"
            >
              <LuPlus className="w-4 h-4" />
              <span>Nueva Área</span>
            </button>
          )}

          {activeTab === "procesos" && (
            <button
              type="button"
              onClick={() => handleOpenAddProc()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F04438] hover:bg-[#D92D20] transition shadow-xs cursor-pointer"
            >
              <LuPlus className="w-4 h-4" />
              <span>Nuevo Proceso</span>
            </button>
          )}

          {activeTab === "cargos" && (
            <button
              type="button"
              onClick={handleOpenAddPosition}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F04438] hover:bg-[#D92D20] transition shadow-xs cursor-pointer"
            >
              <LuPlus className="w-4 h-4" />
              <span>Nuevo Cargo</span>
            </button>
          )}

          {activeTab === "usuarios" && (
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F04438] hover:bg-[#D92D20] transition shadow-xs cursor-pointer"
            >
              <LuPlus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          )}
        </div>
      </section>

      {/* Métricas KPI de la Estructura */}
      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Centros</span>
            <LuBuilding2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalWorkCentersCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">{totalActiveWorkCentersCount} activos</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Áreas</span>
            <LuLayers className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalAreasCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">{totalActiveAreasCount} activas</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Procesos</span>
            <LuFolderTree className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalProcessesCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">{totalSubprocessesCount} subprocesos</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cargos</span>
            <LuBriefcase className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalPositionsCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">Dotación registrada</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Usuarios</span>
            <LuUsers className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalUsersCount}</p>
          <span className="text-[10px] text-gray-500 mt-0.5">Accesos SST</span>
        </div>
      </section>

      {/* Barra de 5 Pestañas Diferenciadas (Req 3) */}
      <div className="bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("centros")}
            className={clsx(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0",
              activeTab === "centros"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <LuBuilding2 className="w-4 h-4 text-blue-600" />
            <span>Centros de Trabajo ({totalWorkCentersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("areas")}
            className={clsx(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0",
              activeTab === "areas"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <LuLayers className="w-4 h-4 text-red-500" />
            <span>Áreas ({totalAreasCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("procesos")}
            className={clsx(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0",
              activeTab === "procesos"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <LuFolderTree className="w-4 h-4 text-teal-600" />
            <span>Procesos y Subprocesos ({totalProcessesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cargos")}
            className={clsx(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0",
              activeTab === "cargos"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <LuBriefcase className="w-4 h-4 text-amber-500" />
            <span>Cargos ({totalPositionsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("usuarios")}
            className={clsx(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0",
              activeTab === "usuarios"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <LuUsers className="w-4 h-4 text-emerald-600" />
            <span>Usuarios ({totalUsersCount})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <LuSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar en ${activeTab}...`}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECCIÓN 1: CENTROS DE TRABAJO (REQ 2, 3 & 4) */}
      {/* ==================================================================== */}
      {activeTab === "centros" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Catálogo de Centros de Trabajo</h2>
              <p className="text-xs text-gray-500">
                Unidades físicas, operacionales o geográficas de la organización (Obras, Faenas, Plantas, Sedes).
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddWc}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <LuPlus className="w-3.5 h-3.5" />
              <span>Agregar Centro</span>
            </button>
          </div>

          {filteredWorkCenters.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No hay Centros de Trabajo registrados. Haz clic en "Nuevo Centro de Trabajo" para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Nombre del Centro de Trabajo</th>
                    <th className="py-3 px-4">Dirección</th>
                    <th className="py-3 px-4">Áreas Asignadas</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredWorkCenters.map((wc) => {
                    const assignedAreasCount = areas.filter(
                      (a) => a.workCenterId === wc.id || a.workCenter === wc.name
                    ).length;
                    const isInactive = wc.status === "Inactivo";

                    return (
                      <tr key={wc.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-gray-600 text-[11px]">
                          {wc.code || "CT"}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{wc.name}</p>
                          {wc.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-1">{wc.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {wc.address ? (
                            <span className="flex items-center gap-1">
                              <LuMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="line-clamp-1">{wc.address}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">No especificada</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                            {assignedAreasCount} {assignedAreasCount === 1 ? "área" : "áreas"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              isInactive
                                ? "bg-gray-100 text-gray-500 border-gray-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            {wc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditWc(wc)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                              title="Editar Centro de Trabajo"
                            >
                              <LuPencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleWorkCenterStatus(wc.id)}
                              className={clsx(
                                "p-1.5 rounded-lg transition",
                                isInactive
                                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                  : "text-gray-500 hover:bg-gray-100"
                              )}
                              title={isInactive ? "Activar Centro" : "Desactivar Centro"}
                            >
                              <LuPower className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWc(wc.id)}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 transition"
                              title="Eliminar Centro (si no tiene áreas asignadas)"
                            >
                              <LuTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECCIÓN 2: ÁREAS (VISUALMENTE SEPARADA, REQ 3) */}
      {/* ==================================================================== */}
      {activeTab === "areas" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Catálogo de Áreas Operativas</h2>
              <p className="text-xs text-gray-500">
                Departamentos o áreas de trabajo asociadas a cada Centro de Trabajo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterWcId}
                onChange={(e) => setFilterWcId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none"
              >
                <option value="all">Todos los Centros de Trabajo</option>
                {workCenters.map((wc) => (
                  <option key={wc.id} value={wc.id}>
                    {wc.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleOpenAddArea}
                className="px-3 py-1.5 bg-[#F04438] hover:bg-[#D92D20] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <LuPlus className="w-3.5 h-3.5" />
                <span>Nueva Área</span>
              </button>
            </div>
          </div>

          {filteredAreas.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No hay áreas registradas para el filtro seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Nombre del Área</th>
                    <th className="py-3 px-4">Centro de Trabajo</th>
                    <th className="py-3 px-4">Procesos Operativos</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAreas.map((area) => {
                    const isInactive = area.status === "Inactivo";
                    const procCount = area.processes?.length || 0;

                    return (
                      <tr key={area.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-gray-600 text-[11px]">
                          {area.code || "AR"}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{area.name}</p>
                          {area.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-1">{area.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                            {area.workCenterName || area.workCenter || "General"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[11px] font-semibold">
                            {procCount} {procCount === 1 ? "proceso" : "procesos"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              isInactive
                                ? "bg-gray-100 text-gray-500 border-gray-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            {area.status || "Activo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAddProc(area.id)}
                              className="px-2 py-1 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 text-[11px] font-semibold transition"
                              title="Agregar Proceso a esta Área"
                            >
                              + Proceso
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditArea(area)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                              title="Editar Área"
                            >
                              <LuPencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleAreaStatus(area.id)}
                              className={clsx(
                                "p-1.5 rounded-lg transition",
                                isInactive
                                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                  : "text-gray-500 hover:bg-gray-100"
                              )}
                              title={isInactive ? "Activar Área" : "Desactivar Área"}
                            >
                              <LuPower className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECCIÓN 3: PROCESOS Y SUBPROCESOS (REQ 3) */}
      {/* ==================================================================== */}
      {activeTab === "procesos" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Procesos y Subprocesos</h2>
              <p className="text-xs text-gray-500">
                Estructura de tareas operativas asociadas a Áreas y Centros de Trabajo.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Centro */}
              <select
                value={filterWcId}
                onChange={(e) => {
                  setFilterWcId(e.target.value);
                  setFilterAreaId("all");
                }}
                className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none"
              >
                <option value="all">Todos los Centros</option>
                {workCenters.map((wc) => (
                  <option key={wc.id} value={wc.id}>
                    {wc.name}
                  </option>
                ))}
              </select>

              {/* Filtro Área */}
              <select
                value={filterAreaId}
                onChange={(e) => setFilterAreaId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none"
              >
                <option value="all">Todas las Áreas</option>
                {(filterWcId === "all"
                  ? areas
                  : areas.filter((a) => a.workCenterId === filterWcId)
                ).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleOpenAddProc(filterAreaId !== "all" ? filterAreaId : undefined)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <LuPlus className="w-3.5 h-3.5" />
                <span>Nuevo Proceso</span>
              </button>
            </div>
          </div>

          {filteredProcesses.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No hay procesos registrados para los filtros seleccionados.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredProcesses.map(({ areaId, areaName, workCenterName, process }) => {
                const isInactive = process.status === "Inactivo";
                const subKey = `${areaId}__${process.id}`;

                return (
                  <div key={process.id} className="p-4 sm:p-5 hover:bg-slate-50/40 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md">
                          {process.code || "PR"}
                        </span>
                        <h3 className="font-bold text-gray-900 text-sm">{process.name}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-semibold">
                          Área: {areaName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                          {workCenterName}
                        </span>
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                            isInactive
                              ? "bg-gray-100 text-gray-500 border-gray-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}
                        >
                          {process.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => toggleProcessStatus(areaId, process.id)}
                          className={clsx(
                            "p-1.5 rounded-lg transition",
                            isInactive
                              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              : "text-gray-400 hover:bg-gray-100"
                          )}
                          title={isInactive ? "Activar Proceso" : "Desactivar Proceso"}
                        >
                          <LuPower className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {process.description && (
                      <p className="text-xs text-gray-500 mb-3">{process.description}</p>
                    )}

                    {/* Subprocesos asociados */}
                    <div className="mt-3 pl-4 border-l-2 border-teal-200/60 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                          Subprocesos ({process.subprocesses?.length || 0}):
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(process.subprocesses || []).map((sub) => {
                          const subInactive = sub.status === "Inactivo";
                          return (
                            <span
                              key={sub.id}
                              className={clsx(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition",
                                subInactive
                                  ? "bg-gray-100 text-gray-400 border-gray-200 line-through"
                                  : "bg-white text-gray-800 border-gray-200 shadow-2xs"
                              )}
                            >
                              <span>{sub.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleSubprocessStatus(areaId, process.id, sub.id)}
                                className="text-gray-400 hover:text-red-600"
                                title={subInactive ? "Reactivar subproceso" : "Desactivar subproceso"}
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })}

                        {/* Input rápido de nuevo subproceso */}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={quickSubName[subKey] || ""}
                            onChange={(e) =>
                              setQuickSubName((prev) => ({ ...prev, [subKey]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuickAddSubprocess(areaId, process.id);
                              }
                            }}
                            placeholder="+ Agregar subproceso..."
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 w-44"
                          />
                          {(quickSubName[subKey] || "").trim() && (
                            <button
                              type="button"
                              onClick={() => handleQuickAddSubprocess(areaId, process.id)}
                              className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECCIÓN 4: CARGOS CON DOTACIÓN Y CONDICIONES (REQ 17, 18 & 19) */}
      {/* ==================================================================== */}
      {activeTab === "cargos" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Catálogo de Cargos de la Organización</h2>
              <p className="text-xs text-gray-500">
                Catálogo transversal con dotación agregada por género y condiciones especiales.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddPosition}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <LuPlus className="w-3.5 h-3.5" />
              <span>Nuevo Cargo</span>
            </button>
          </div>

          {filteredPositions.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No hay cargos configurados. Haz clic en "Nuevo Cargo" para comenzar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Nombre del Cargo</th>
                    <th className="py-3 px-4">Dotación Total</th>
                    <th className="py-3 px-4">Desglose H / M</th>
                    <th className="py-3 px-4">Condiciones Especiales</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPositions.map((pos) => {
                    const isInactive = pos.status === "Inactivo";
                    const total = pos.totalStaff || 0;
                    const men = pos.menCount || 0;
                    const women = pos.womenCount || 0;
                    const disabled = pos.disabledCount || 0;
                    const sensitive = pos.sensitiveCount || 0;

                    return (
                      <tr key={pos.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-gray-600 text-[11px]">
                          {pos.code || "CARG"}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900">{pos.name}</p>
                          {pos.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-1">{pos.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900 text-sm">{total}</span>
                          <span className="text-gray-400 text-[11px] ml-1">trabajadores</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                              H: {men}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 font-semibold">
                              M: {women}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {disabled > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                {disabled} con discapacidad
                              </span>
                            )}
                            {sensitive > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                {sensitive} sensibles
                              </span>
                            )}
                            {disabled === 0 && sensitive === 0 && (
                              <span className="text-gray-400 italic text-[11px]">Estándar</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              isInactive
                                ? "bg-gray-100 text-gray-500 border-gray-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            {pos.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPosition(pos)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                              title="Editar Cargo y Dotación"
                            >
                              <LuPencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => togglePositionStatus(pos.id)}
                              className={clsx(
                                "p-1.5 rounded-lg transition",
                                isInactive
                                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                  : "text-gray-500 hover:bg-gray-100"
                              )}
                              title={isInactive ? "Activar Cargo" : "Desactivar Cargo"}
                            >
                              <LuPower className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECCIÓN 5: USUARIOS Y ACCESOS (REQ 3) */}
      {/* ==================================================================== */}
      {activeTab === "usuarios" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Usuarios con Acceso a la Plataforma</h2>
              <p className="text-xs text-gray-500">
                Gestión de accesos, roles y asignación de cargos de LifeOn.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <LuPlus className="w-3.5 h-3.5" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No hay usuarios registrados. Haz clic en "Nuevo Usuario" para registrar uno.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Cargo Asignado</th>
                    <th className="py-3 px-4">Área</th>
                    <th className="py-3 px-4">Rol SST</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((usr) => {
                    const isInactive = usr.status === "Inactivo";
                    const role = usr.role || "Editor";

                    return (
                      <tr key={usr.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs">
                              {usr.name.slice(0, 1).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900">{usr.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-600">{usr.email}</td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {usr.cargoName || "Sin cargo asignado"}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{usr.areaName || "General"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              role === "Administrador"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : role === "Lector"
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : "bg-teal-50 text-teal-700 border-teal-200"
                            )}
                          >
                            {role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              isInactive
                                ? "bg-gray-100 text-gray-500 border-gray-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            )}
                          >
                            {usr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(usr.id)}
                            className={clsx(
                              "p-1.5 rounded-lg transition cursor-pointer",
                              isInactive
                                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                : "text-gray-400 hover:bg-gray-100"
                            )}
                            title={isInactive ? "Activar usuario" : "Desactivar usuario"}
                          >
                            <LuPower className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: NUEVO CENTRO DE TRABAJO */}
      {/* ==================================================================== */}
      {isAddWcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Crear Centro de Trabajo</h3>
              <button
                type="button"
                onClick={() => setIsAddWcModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWc} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Centro de Trabajo *
                </label>
                <input
                  type="text"
                  value={wcFormName}
                  onChange={(e) => setWcFormName(e.target.value)}
                  placeholder="Ej: Obra Hospital Talca"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código (opcional)
                  </label>
                  <input
                    type="text"
                    value={wcFormCode}
                    onChange={(e) => setWcFormCode(e.target.value)}
                    placeholder="Ej: CT-TALCA"
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dirección (opcional)
                  </label>
                  <input
                    type="text"
                    value={wcFormAddress}
                    onChange={(e) => setWcFormAddress(e.target.value)}
                    placeholder="Ej: 1 Norte 1990, Talca"
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={wcFormDesc}
                  onChange={(e) => setWcFormDesc(e.target.value)}
                  placeholder="Alcance operacional del centro..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddWcModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!wcFormName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Crear Centro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDITAR CENTRO DE TRABAJO */}
      {/* ==================================================================== */}
      {isEditWcModalOpen && editingWc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Editar Centro de Trabajo</h3>
              <button
                type="button"
                onClick={() => setIsEditWcModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateWc} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Centro de Trabajo *
                </label>
                <input
                  type="text"
                  value={wcFormName}
                  onChange={(e) => setWcFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código (opcional)
                  </label>
                  <input
                    type="text"
                    value={wcFormCode}
                    onChange={(e) => setWcFormCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Dirección (opcional)
                  </label>
                  <input
                    type="text"
                    value={wcFormAddress}
                    onChange={(e) => setWcFormAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={wcFormDesc}
                  onChange={(e) => setWcFormDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditWcModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!wcFormName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: NUEVA ÁREA */}
      {/* ==================================================================== */}
      {isAddAreaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Crear Nueva Área</h3>
              <button
                type="button"
                onClick={() => setIsAddAreaModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArea} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Centro de Trabajo Asociado *
                </label>
                <select
                  value={areaFormWorkCenterId}
                  onChange={(e) => setAreaFormWorkCenterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {workCenters.map((wc) => (
                    <option key={wc.id} value={wc.id}>
                      {wc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Área *
                </label>
                <input
                  type="text"
                  value={areaFormName}
                  onChange={(e) => setAreaFormName(e.target.value)}
                  placeholder="Ej: Construcción / Operaciones"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={areaFormCode}
                  onChange={(e) => setAreaFormCode(e.target.value)}
                  placeholder="Ej: AR-01"
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={areaFormDesc}
                  onChange={(e) => setAreaFormDesc(e.target.value)}
                  placeholder="Breve descripción del alcance del área..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAreaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!areaFormName.trim()}
                  className="px-5 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Crear Área
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDITAR ÁREA */}
      {/* ==================================================================== */}
      {isEditAreaModalOpen && editingArea && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Editar Área</h3>
              <button
                type="button"
                onClick={() => setIsEditAreaModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateArea} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Centro de Trabajo Asociado
                </label>
                <select
                  value={areaFormWorkCenterId}
                  onChange={(e) => setAreaFormWorkCenterId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  {workCenters.map((wc) => (
                    <option key={wc.id} value={wc.id}>
                      {wc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Área *
                </label>
                <input
                  type="text"
                  value={areaFormName}
                  onChange={(e) => setAreaFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={areaFormCode}
                  onChange={(e) => setAreaFormCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={areaFormDesc}
                  onChange={(e) => setAreaFormDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditAreaModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!areaFormName.trim()}
                  className="px-5 py-2 bg-[#F04438] hover:bg-[#D92D20] text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: NUEVO PROCESO */}
      {/* ==================================================================== */}
      {isAddProcModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Crear Nuevo Proceso</h3>
              <button
                type="button"
                onClick={() => setIsAddProcModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProcess} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Área Perteneciente *
                </label>
                <select
                  value={procFormAreaId}
                  onChange={(e) => setProcFormAreaId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Selecciona un área...</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.workCenterName || a.workCenter || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Proceso *
                </label>
                <input
                  type="text"
                  value={procFormName}
                  onChange={(e) => setProcFormName(e.target.value)}
                  placeholder="Ej: Montaje estructural"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código (opcional)
                  </label>
                  <input
                    type="text"
                    value={procFormCode}
                    onChange={(e) => setProcFormCode(e.target.value)}
                    placeholder="Ej: PR-01"
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={procFormDesc}
                    onChange={(e) => setProcFormDesc(e.target.value)}
                    placeholder="Alcance del proceso..."
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Subprocesos iniciales (opcional, uno por línea)
                </label>
                <textarea
                  value={procFormSubprocesses}
                  onChange={(e) => setProcFormSubprocesses(e.target.value)}
                  placeholder={"Montaje de vigas\nAlineación y torque\nInstalación de pasarelas"}
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddProcModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!procFormAreaId || !procFormName.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Crear Proceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: NUEVO CARGO CON DOTACIÓN Y CARACTERÍSTICAS (REQ 18 & 19) */}
      {/* ==================================================================== */}
      {isAddPositionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Crear Cargo y Dotación</h3>
                <p className="text-xs text-gray-500">
                  Define el cargo, su dotación agregada y características especiales.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPositionModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePosition} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Cargo *
                </label>
                <input
                  type="text"
                  value={posFormName}
                  onChange={(e) => setPosFormName(e.target.value)}
                  placeholder="Ej: Operador de Planta"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código (opcional)
                  </label>
                  <input
                    type="text"
                    value={posFormCode}
                    onChange={(e) => setPosFormCode(e.target.value)}
                    placeholder="Ej: CARG-01"
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={posFormDesc}
                    onChange={(e) => setPosFormDesc(e.target.value)}
                    placeholder="Funciones generales..."
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* SECCIÓN DOTACIÓN (REQ 18) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">
                    Dotación de Trabajadores
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Datos cuantitativos del cargo
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Dotación Total *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={posFormTotalStaff}
                      onChange={(e) => setPosFormTotalStaff(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-blue-700 mb-1">
                      Hombres
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={posFormMenCount}
                      onChange={(e) => setPosFormMenCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-pink-700 mb-1">
                      Mujeres
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={posFormWomenCount}
                      onChange={(e) => setPosFormWomenCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>
                </div>

                {!isStaffValid && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <LuTriangleAlert className="w-3.5 h-3.5" />
                    La suma de hombres ({posFormMenCount}) y mujeres ({posFormWomenCount}) no puede superar la dotación total ({posFormTotalStaff}).
                  </p>
                )}
              </div>

              {/* SECCIÓN CARACTERÍSTICAS ESPECIALES (REQ 19) */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl flex flex-col gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-900">
                    Características Especiales del Grupo (Agregado)
                  </span>
                  <p className="text-[11px] text-amber-700/90 mt-0.5">
                    Para gestión diferenciada de riesgos. No registrar diagnósticos individuales.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Personas con discapacidad
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={posFormDisabledCount}
                      onChange={(e) => setPosFormDisabledCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Especialmente sensibles
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={posFormSensitiveCount}
                      onChange={(e) => setPosFormSensitiveCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Observaciones de condiciones especiales agregadas
                  </label>
                  <input
                    type="text"
                    value={posFormConditionsNote}
                    onChange={(e) => setPosFormConditionsNote(e.target.value)}
                    placeholder="Ej: Cuadrilla en monitoreo audiométrico anual"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddPositionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!posFormName.trim() || !isStaffValid}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Crear Cargo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDITAR CARGO (REQ 18 & 19) */}
      {/* ==================================================================== */}
      {isEditPositionModalOpen && editingPos && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Editar Cargo y Dotación</h3>
                <p className="text-xs text-gray-500">{editingPos.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPositionModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePosition} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre del Cargo *
                </label>
                <input
                  type="text"
                  value={posFormName}
                  onChange={(e) => setPosFormName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código (opcional)
                  </label>
                  <input
                    type="text"
                    value={posFormCode}
                    onChange={(e) => setPosFormCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    value={posFormDesc}
                    onChange={(e) => setPosFormDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* SECCIÓN DOTACIÓN */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-800">Dotación de Trabajadores</span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Dotación Total *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={posFormTotalStaff}
                      onChange={(e) => setPosFormTotalStaff(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-blue-700 mb-1">
                      Hombres
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={posFormMenCount}
                      onChange={(e) => setPosFormMenCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-pink-700 mb-1">
                      Mujeres
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={posFormWomenCount}
                      onChange={(e) => setPosFormWomenCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>
                </div>

                {!isStaffValid && (
                  <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                    <LuTriangleAlert className="w-3.5 h-3.5" />
                    La suma de hombres ({posFormMenCount}) y mujeres ({posFormWomenCount}) no puede superar la dotación total ({posFormTotalStaff}).
                  </p>
                )}
              </div>

              {/* SECCIÓN CARACTERÍSTICAS ESPECIALES */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-2xl flex flex-col gap-3">
                <span className="text-xs font-bold text-amber-900">Características Especiales del Grupo</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Personas con discapacidad
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={posFormDisabledCount}
                      onChange={(e) => setPosFormDisabledCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Especialmente sensibles
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={posFormSensitiveCount}
                      onChange={(e) => setPosFormSensitiveCount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Observaciones agregadas
                  </label>
                  <input
                    type="text"
                    value={posFormConditionsNote}
                    onChange={(e) => setPosFormConditionsNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditPositionModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!posFormName.trim() || !isStaffValid}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: NUEVO USUARIO */}
      {/* ==================================================================== */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">Registrar Usuario SST</h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={userFormName}
                  onChange={(e) => setUserFormName(e.target.value)}
                  placeholder="Ej: Marcelo Morales Soto"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={userFormEmail}
                  onChange={(e) => setUserFormEmail(e.target.value)}
                  placeholder="marcelo.morales@empresa.cl"
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Cargo
                  </label>
                  <select
                    value={userFormCargoId}
                    onChange={(e) => setUserFormCargoId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">Sin cargo</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Área
                  </label>
                  <select
                    value={userFormAreaId}
                    onChange={(e) => setUserFormAreaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="">General</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Rol / Permisos SST *
                </label>
                <select
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-semibold"
                >
                  <option value="Editor">Editor (Gestión y carga de evidencias)</option>
                  <option value="Lector">Lector (Solo visualización de matrices e IRL)</option>
                  <option value="Administrador">Administrador (Control total de configuración)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!userFormName.trim() || !userFormEmail.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  Registrar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: IMPORTAR ESTRUCTURA ORGANIZACIONAL (XLSX) */}
      {/* ==================================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Importación Masiva XLSX</h3>
                <p className="text-xs text-gray-500">
                  Carga estructurada de Centros de Trabajo, Áreas, Procesos, Subprocesos, Cargos y Usuarios.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setXlsxReport(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {importFeedback ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <LuCircleCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-900">{importFeedback}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-2xl p-6 text-center transition">
                  <LuFileSpreadsheet className="w-10 h-10 text-teal-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-800 mb-1">
                    Selecciona tu archivo Excel (.xlsx) completado
                  </p>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Recomendamos utilizar la plantilla oficial de 7 hojas de LifeOn
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                  />
                </div>

                {/* Informe de validación */}
                {xlsxReport && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">
                        Resultado de Validación
                      </span>
                      <span
                        className={clsx(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                          xlsxReport.isValid
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        )}
                      >
                        {xlsxReport.isValid ? "Archivo Válido" : "Requiere Corrección"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px]">
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400 block">Centros</span>
                        <strong className="text-gray-900">{xlsxReport.summary.newWorkCentersCount || 0}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400 block">Áreas</span>
                        <strong className="text-gray-900">{xlsxReport.summary.areasCount}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400 block">Procesos</span>
                        <strong className="text-gray-900">{xlsxReport.summary.processesCount}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400 block">Subproc.</span>
                        <strong className="text-gray-900">{xlsxReport.summary.subprocessesCount}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400 block">Cargos</span>
                        <strong className="text-gray-900">{xlsxReport.summary.positionsCount}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <span className="text-gray-400 block">Usuarios</span>
                        <strong className="text-gray-900">{xlsxReport.summary.usersCount}</strong>
                      </div>
                    </div>

                    {xlsxReport.errors.length > 0 && (
                      <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-xs flex flex-col gap-1 max-h-36 overflow-y-auto">
                        <span className="font-bold text-red-800">
                          Se encontraron {xlsxReport.errors.length} errores de validación:
                        </span>
                        {xlsxReport.errors.map((err, idx) => (
                          <p key={idx} className="text-[11px] text-red-700">
                            &bull; <strong>[{err.sheet}] Fila {err.rowNumber}:</strong> {err.error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={downloadTemplateXlsx}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <LuDownload className="w-3.5 h-3.5" />
                    Descargar plantilla
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setXlsxReport(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={!xlsxReport || !xlsxReport.isValid}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition cursor-pointer shadow-xs"
                    >
                      Confirmar Importación
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

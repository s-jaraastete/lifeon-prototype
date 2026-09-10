"use client";

import React, { useState, useMemo, useCallback } from "react";
import clsx from "clsx";
import {
  LuCalendarCheck,
  LuPlus,
  LuUpload,
  LuSearch,
  LuFilter,
  LuCircleCheck,
  LuClock,
  LuTriangleAlert,
  LuPaperclip,
  LuFileText,
  LuUser,
  LuBuilding2,
  LuBriefcase,
  LuSparkles,
  LuCheck,
  LuX,
  LuCalendar,
  LuArrowRight,
  LuChevronDown,
  LuEye,
  LuTrash2,
  LuPrinter,
  LuDownload,
  LuShieldAlert,
  LuActivity,
  LuLayers,
} from "react-icons/lu";
import * as XLSX from "xlsx";
import {
  createThemedDataSheet,
  createThemedInstructionsSheet,
} from "@/lib/xlsx/lifeOnWorkbookTheme";
import { usePreventiveProgram } from "@/hooks/usePreventiveProgram";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import ProgramImportModal from "./ProgramImportModal";
import {
  ProgramActivity,
  ActivityEvidence,
  ActivityCategory,
  ActivityPeriodicity,
  ActivityApplicability,
  ActivityStatus,
} from "@/types/preventiveProgram";
import PreventivePlanningOnboardingModal from "./PreventivePlanningOnboardingModal";

const CATEGORIES: ActivityCategory[] = [
  "Planificación y Gestión",
  "Gestión de Riesgos",
  "Información de Riesgos Laborales (IRL)",
  "Capacitación y Difusión",
  "Reglamentación (RIOHS)",
  "Emergencias y Evacuación",
  "Vigilancia y Salud Ocupacional",
  "Gestión de Incidentes",
  "Participación y CPHS",
  "Inspecciones y Verificaciones",
  "Documentación y Registros",
  "Cierre y Evaluación Anual",
];

const PERIODICITIES: ActivityPeriodicity[] = [
  "Una vez",
  "Mensual",
  "Trimestral",
  "Semestral",
  "Anual",
  "Según necesidad",
  "Otra",
];

const APPLICABILITIES: ActivityApplicability[] = [
  "Obligatoria",
  "Recomendada",
  "Según corresponda",
  "Aplicabilidad por revisar",
];

export default function PreventiveDocsView() {
  const { preferences, configurePreventivePlanningModule, isGuided } = useLifeOnPreferences();
  const {
    activities,
    metrics,
    addActivity,
    updateActivity,
    deleteActivity,
    addEvidence,
    removeEvidence,
    generateBaseProgram,
    importExistingProgramActivities,
  } = usePreventiveProgram();

  const { workCenters, areas, positions, users } = useOrgStructure();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Estado de configuración del módulo
  const isModuleConfigured = preferences.moduleConfigurations?.preventivePlanning?.configured ?? false;
  const hasProgram = isModuleConfigured && activities.length > 0;

  // Estado del modal de onboarding / configuración inicial
  const [hasDismissedModal, setHasDismissedModal] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Modal para ver programa completo en formato documento
  const [isFullProgramModalOpen, setIsFullProgramModalOpen] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("Todos");
  const [selectedAreaFilter, setSelectedAreaFilter] = useState("Todos");
  const [selectedResponsibleFilter, setSelectedResponsibleFilter] = useState("Todos");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("Todos");
  const [activeTab, setActiveTab] = useState<"dashboard" | "tabla">("dashboard");

  // Modales operativos
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ProgramActivity | null>(null);

  const [evidenceModalActivity, setEvidenceModalActivity] = useState<ProgramActivity | null>(null);
  const [evidenceFormName, setEvidenceFormName] = useState("");
  const [evidenceFormType, setEvidenceFormType] = useState<ActivityEvidence["type"]>("Documento");

  // Formulario de actividad
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formObjective, setFormObjective] = useState("");
  const [formCategory, setFormCategory] = useState<ActivityCategory>("Planificación y Gestión");
  const [formAreaId, setFormAreaId] = useState("");
  const [formPositionId, setFormPositionId] = useState("");
  const [formUserId, setFormUserId] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formPeriodicity, setFormPeriodicity] = useState<ActivityPeriodicity>("Mensual");
  const [formApplicability, setFormApplicability] = useState<ActivityApplicability>("Obligatoria");
  const [formStatus, setFormStatus] = useState<ActivityStatus>("Pendiente");
  const [formProgress, setFormProgress] = useState(0);
  const [formObservations, setFormObservations] = useState("");

  const handleOpenNewActivityModal = () => {
    if (!hasProgram) {
      setIsConfigModalOpen(true);
      return;
    }
    setEditingActivity(null);
    setFormCode(`ACT-${String(activities.length + 1).padStart(2, "0")}`);
    setFormName("");
    setFormDesc("");
    setFormObjective("");
    setFormCategory("Planificación y Gestión");
    setFormAreaId(areas[0]?.id || "");
    setFormPositionId(positions[0]?.id || "");
    setFormUserId(users[0]?.id || "");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    setFormEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setFormPeriodicity("Mensual");
    setFormApplicability("Obligatoria");
    setFormStatus("Pendiente");
    setFormProgress(0);
    setFormObservations("");
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivityModal = (act: ProgramActivity) => {
    setEditingActivity(act);
    setFormCode(act.code || "");
    setFormName(act.name);
    setFormDesc(act.description);
    setFormObjective(act.objective || "");
    setFormCategory(act.category);
    setFormAreaId(act.areaId || (areas.find((a) => a.name === act.areaName)?.id || ""));
    setFormPositionId(act.responsiblePositionId || (positions.find((p) => p.name === act.responsiblePositionName)?.id || ""));
    setFormUserId(act.responsibleUserId || (users.find((u) => u.name === act.responsibleUserName)?.id || ""));
    setFormStartDate(act.startDate);
    setFormEndDate(act.endDate);
    setFormPeriodicity(act.periodicity);
    setFormApplicability(act.applicability || "Obligatoria");
    setFormStatus(act.status);
    setFormProgress(act.progress);
    setFormObservations(act.observations || "");
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const selectedArea = areas.find((a) => a.id === formAreaId);
    const selectedPosition = positions.find((p) => p.id === formPositionId);
    const selectedUser = users.find((u) => u.id === formUserId);

    const activityData = {
      code: formCode.trim() || undefined,
      name: formName.trim(),
      description: formDesc.trim(),
      objective: formObjective.trim() || undefined,
      category: formCategory,
      areaId: selectedArea?.id,
      areaName: selectedArea?.name || "Área General",
      responsiblePositionId: selectedPosition?.id,
      responsiblePositionName: selectedPosition?.name || "Sin cargo",
      responsibleUserId: selectedUser?.id,
      responsibleUserName: selectedUser?.name || "Responsable asignado",
      startDate: formStartDate,
      endDate: formEndDate,
      periodicity: formPeriodicity,
      applicability: formApplicability,
      status: formStatus,
      progress: formProgress,
      observations: formObservations.trim(),
    };

    if (editingActivity) {
      updateActivity(editingActivity.id, activityData);
    } else {
      addActivity(activityData);
    }

    setIsActivityModalOpen(false);
  };

  const handleAddEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceModalActivity || !evidenceFormName.trim()) return;

    addEvidence(evidenceModalActivity.id, {
      name: evidenceFormName.trim(),
      type: evidenceFormType,
      fileSize: "1.2 MB",
    });

    setEvidenceFormName("");
    const updated = activities.find((a) => a.id === evidenceModalActivity.id);
    if (updated) {
      setEvidenceModalActivity(updated);
    }
  };

  // Filtrado de actividades
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        act.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (act.code && act.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.responsibleUserName && act.responsibleUserName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (act.areaName && act.areaName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategoryFilter === "Todos" || act.category === selectedCategoryFilter;

      const matchesArea =
        selectedAreaFilter === "Todos" || act.areaName === selectedAreaFilter;

      const matchesResp =
        selectedResponsibleFilter === "Todos" || act.responsibleUserName === selectedResponsibleFilter;

      const matchesStatus =
        selectedStatusFilter === "Todos" || act.status === selectedStatusFilter;

      return matchesSearch && matchesCategory && matchesArea && matchesResp && matchesStatus;
    });
  }, [activities, searchQuery, selectedCategoryFilter, selectedAreaFilter, selectedResponsibleFilter, selectedStatusFilter]);

  // Actividades con atención prioritaria (atrasadas o próximas a vencer)
  const priorityActivities = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return activities.filter((a) => a.status === "Atrasada" || (!a.status.includes("Cumplida") && a.endDate < todayStr) || a.status === "En curso");
  }, [activities]);

  const companyName = preferences.organizationName || "Constructora y Servicios Santiago SpA";
  const responsiblePerson = users[0]?.name || "Experto en Prevención de Riesgos";

  // Descarga de Plantilla Oficial de Programa de Trabajo (2 hojas: INSTRUCCIONES y PROGRAMA)
  const downloadProgramTemplateXlsx = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // HOJA 1: INSTRUCCIONES
    const wsInstructions = createThemedInstructionsSheet({
      title: "PLANTILLA OFICIAL DE PROGRAMA DE TRABAJO EN GESTIÓN DE RIESGOS",
      subtitle: "Planificación anual de actividades, responsabilidades, cronogramas y metas de cumplimiento (DS 44 / Mutualidades).",
      legendNotes: [
        "La hoja 'INSTRUCCIONES' es informativa y no se importa a la plataforma.",
        "La hoja 'PROGRAMA' contiene las actividades y tareas que serán importadas.",
        "Los campos 'Centro de Trabajo', 'Área', 'Responsable' y 'Cargo Responsable' deben existir previamente en Estructura Organizacional.",
        "No inserte archivos como evidencias en el Excel; las evidencias se adjuntan directamente en LifeOn.",
      ],
      sections: [
        {
          title: "1. RELACIONES CON ESTRUCTURA ORGANIZACIONAL",
          items: [
            "Centro de Trabajo: Sede u obra física registrada en tu organización.",
            "Área: Departamento operativo donde se ejecuta la actividad.",
            "Responsable: Nombre del usuario registrado en LifeOn a cargo de reportar o ejecutar.",
            "Cargo Responsable: Cargo organizacional responsable del cumplimiento.",
            "Debe indicar al menos un Responsable o Cargo Responsable válido.",
          ],
        },
        {
          title: "2. CRONOGRAMA Y FORMATO DE FECHAS",
          items: [
            "Las fechas de Inicio y Término deben seguir el formato AAAA-MM-DD (ej: 2026-03-15).",
            "La Fecha de Término debe ser igual o posterior a la Fecha de Inicio.",
          ],
        },
        {
          title: "3. PERIODICIDAD Y ESTADOS ADMITIDOS",
          items: [
            "Periodicidades válidas: 'Una vez', 'Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Según necesidad'.",
            "Estados válidos: 'Pendiente', 'En curso', 'Cumplida', 'Atrasada'. Por defecto: 'Pendiente'.",
          ],
        },
      ],
    });

    // HOJA 2: PROGRAMA
    const wsPrograma = createThemedDataSheet({
      sheetTitle: "PROGRAMA DE TRABAJO",
      columns: [
        { header: "Código", key: "code", mandatory: false, width: 16 },
        { header: "Categoría", key: "category", mandatory: false, width: 26 },
        { header: "Actividad", key: "name", mandatory: true, width: 40 },
        { header: "Descripción", key: "description", mandatory: false, width: 45 },
        { header: "Objetivo", key: "objective", mandatory: false, width: 38 },
        { header: "Centro de Trabajo", key: "workCenter", mandatory: false, width: 32 },
        { header: "Área", key: "area", mandatory: false, width: 28 },
        { header: "Responsable", key: "responsible", mandatory: true, width: 30 },
        { header: "Cargo Responsable", key: "position", mandatory: true, width: 30 },
        { header: "Fecha Inicio", key: "startDate", mandatory: true, width: 18 },
        { header: "Fecha Término", key: "endDate", mandatory: true, width: 18 },
        { header: "Periodicidad", key: "periodicity", mandatory: true, width: 20 },
        { header: "Aplicabilidad", key: "applicability", mandatory: false, width: 20 },
        { header: "Estado", key: "status", mandatory: true, width: 18 },
        { header: "Porcentaje de Avance", key: "progress", mandatory: false, width: 22 },
        { header: "Observaciones", key: "observations", mandatory: false, width: 45 },
      ],
      data: [
        {
          code: "PLN-01",
          category: "Planificación y Gestión",
          name: "Elaboración y Aprobación del Programa Anual de Trabajo en Gestión de Riesgos",
          description: "Definición formal de objetivos, metas, recursos y cronograma para el período 2026",
          objective: "Establecer directrices estratégicas de SST según DS 44",
          workCenter: "Obra Edificio Santiago Centro",
          area: "Operaciones y Montaje",
          responsible: "Carlos Mendoza Riquelme",
          position: "Jefe de Terreno / Administrador de Obra",
          startDate: "2026-01-05",
          endDate: "2026-01-25",
          periodicity: "Anual",
          applicability: "Obligatoria",
          status: "Cumplida",
          progress: 100,
          observations: "Aprobado formalmente por Gerencia General",
        },
        {
          code: "RSK-01",
          category: "Gestión de Riesgos",
          name: "Revisión y Actualización Periódica de Matrices IPER",
          description: "Reevaluación de peligros, probabilidad, severidad y controles existentes",
          objective: "Mantener actualizada la identificación de peligros en todos los procesos",
          workCenter: "Obra Edificio Santiago Centro",
          area: "Operaciones y Montaje",
          responsible: "Carlos Mendoza Riquelme",
          position: "Experto en Prevención de Riesgos",
          startDate: "2026-02-01",
          endDate: "2026-03-15",
          periodicity: "Trimestral",
          applicability: "Obligatoria",
          status: "En curso",
          progress: 60,
          observations: "Matriz de Montaje revisada en terreno",
        },
      ],
    });

    XLSX.utils.book_append_sheet(wb, wsInstructions, "INSTRUCCIONES");
    XLSX.utils.book_append_sheet(wb, wsPrograma, "PROGRAMA");

    XLSX.writeFile(wb, "Plantilla_Programa_Trabajo_LifeOn.xlsx");
  }, []);

  const handleConfirmProgramImport = (importedActivities: ProgramActivity[]) => {
    importExistingProgramActivities(importedActivities);
    configurePreventivePlanningModule(true, "upload_existing");
  };

  return (
    <div className="flex flex-col gap-4 font-[family-name:var(--font-poppins)] select-none">
      {/* Onboarding Inicial del Módulo (Cerrable) */}
      <PreventivePlanningOnboardingModal
        isOpen={(!isModuleConfigured && !hasDismissedModal) || isConfigModalOpen}
        onClose={() => {
          setHasDismissedModal(true);
          setIsConfigModalOpen(false);
        }}
        onSelectOption={(hasExisting, setupMode) => {
          configurePreventivePlanningModule(hasExisting, setupMode);
          setIsConfigModalOpen(false);
          setHasDismissedModal(true);
          if (setupMode === "create_base") {
            generateBaseProgram(areas[0]?.name, users[0]?.name);
          }
        }}
      />

      {/* Encabezado del Módulo con branding oficial */}
      <section className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <LuCalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Programa de Trabajo en Gestión de Riesgos Laborales
                </h1>
                <span className={clsx(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  hasProgram ? "bg-teal-100 text-teal-800 border-teal-200" : "bg-gray-100 text-gray-600 border-gray-200"
                )}>
                  {hasProgram ? "Programa Activo 2026" : "Sin Configurar"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Planifica, asigna, ejecuta, haz seguimiento, adjunta evidencias y mide el cumplimiento de tu empresa.
              </p>
            </div>
          </div>

          {isGuided && hasProgram && (
            <div className="mt-3 p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs text-teal-800 flex items-center gap-2">
              <LuSparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span>
                <strong>Modo Guiado:</strong> Cada tarea debe contar con un responsable de tu estructura organizacional y evidencias adjuntas al completarse.
              </span>
            </div>
          )}
        </div>

        {/* Botones de acción principales */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={downloadProgramTemplateXlsx}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition cursor-pointer"
            title="Descargar plantilla oficial XLSX de Programa de Trabajo"
          >
            <LuDownload className="w-3.5 h-3.5 text-gray-600" />
            <span>Descargar Plantilla</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
            title="Importar actividades desde archivo Excel (.xlsx)"
          >
            <LuUpload className="w-3.5 h-3.5 text-teal-600" />
            <span>Importar Programa</span>
          </button>

          {hasProgram && (
            <button
              type="button"
              onClick={() => setIsFullProgramModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition cursor-pointer"
              title="Visualizar Programa Completo como Documento"
            >
              <LuFileText className="w-4 h-4 text-teal-600" />
              <span>Ver Programa Completo</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenNewActivityModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-xs cursor-pointer"
          >
            <LuPlus className="w-4 h-4" />
            <span>Nueva Actividad</span>
          </button>
        </div>
      </section>

      {/* CASO: NO EXISTE PROGRAMA DE TRABAJO (RESTRICCIÓN REQ 18) */}
      {!hasProgram ? (
        <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-gray-100 shadow-xs flex flex-col items-center justify-center max-w-2xl mx-auto my-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 shadow-2xs">
            <LuCalendarCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2">
            Configura tu Programa de Trabajo para comenzar
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-md mb-6 leading-relaxed">
            El Programa de Trabajo es la base de la planificación y seguimiento de la Gestión de Riesgos Laborales de tu organización.
          </p>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-teal-700/20 cursor-pointer flex items-center gap-2"
            >
              <LuCalendarCheck className="w-4 h-4" />
              <span>Configurar Programa</span>
            </button>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-5 py-3 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
            >
              <LuUpload className="w-4 h-4 text-teal-600" />
              <span>Importar Programa (XLSX)</span>
            </button>
            <button
              type="button"
              onClick={downloadProgramTemplateXlsx}
              className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <LuDownload className="w-3.5 h-3.5 text-gray-500" />
              <span>Descargar Plantilla</span>
            </button>
          </div>
        </div>
      ) : (
        /* CASO: PROGRAMA EXISTENTE (DASHBOARD Y TABLA OPERATIVA) */
        <>
          {/* TARJETAS DE MÉTRICAS KPI (DASHBOARD DEL PROGRAMA) */}
          <section className="grid grid-cols-2 sm:grid-cols-7 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Tareas</span>
              <p className="text-2xl font-black text-gray-900 mt-1">{metrics.totalActivities}</p>
              <span className="text-[10px] text-gray-500">Planificadas</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Cumplidas</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{metrics.completedActivities}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">Con evidencias</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">En Curso</span>
              <p className="text-2xl font-black text-teal-700 mt-1">{metrics.inProgressActivities}</p>
              <span className="text-[10px] text-teal-600">En ejecución</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pendientes</span>
              <p className="text-2xl font-black text-gray-700 mt-1">{metrics.pendingActivities}</p>
              <span className="text-[10px] text-gray-400">Por iniciar</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Atrasadas</span>
              <p className="text-2xl font-black text-red-600 mt-1">{metrics.overdueActivities}</p>
              <span className="text-[10px] text-red-500 font-semibold">Vencidas</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Próximas a Vencer</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{metrics.upcomingActivities}</p>
              <span className="text-[10px] text-amber-600 font-semibold">En 15 días</span>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Cumplimiento</span>
              <p className="text-2xl font-black text-teal-800 mt-1">{metrics.compliancePercentage}%</p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.compliancePercentage}%` }}
                />
              </div>
            </div>
          </section>

          {/* Selector de Vistas: Dashboard de Seguimiento vs Tabla Operativa */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-3 shadow-xs border border-gray-100 flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className={clsx(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                  activeTab === "dashboard"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <LuActivity className="w-3.5 h-3.5" />
                <span>Dashboard de Seguimiento</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tabla")}
                className={clsx(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5",
                  activeTab === "tabla"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <LuLayers className="w-3.5 h-3.5" />
                <span>Tabla Operativa ({activities.length})</span>
              </button>
            </div>

            {/* Filtros rápidos */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <LuSearch className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar código, tarea o responsable..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-48 sm:w-60"
                />
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none cursor-pointer"
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En curso">En curso</option>
                <option value="Cumplida">Cumplida</option>
                <option value="Atrasada">Atrasada</option>
              </select>
            </div>
          </div>

          {/* VISTA 1: DASHBOARD DE SEGUIMIENTO (GRÁFICOS Y DISTRIBUCIONES REALES) */}
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Panel Izquierdo: Cumplimiento General y Distribución de Estados */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Estado de Ejecución del Programa
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Distribución porcentual de las tareas programadas
                  </p>

                  {/* Barra de Distribución */}
                  <div className="w-full h-4 bg-gray-100 rounded-full flex overflow-hidden mb-4">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${metrics.totalActivities ? (metrics.completedActivities / metrics.totalActivities) * 100 : 0}%`,
                      }}
                      title="Cumplidas"
                    />
                    <div
                      className="bg-teal-500 h-full"
                      style={{
                        width: `${metrics.totalActivities ? (metrics.inProgressActivities / metrics.totalActivities) * 100 : 0}%`,
                      }}
                      title="En curso"
                    />
                    <div
                      className="bg-gray-300 h-full"
                      style={{
                        width: `${metrics.totalActivities ? (metrics.pendingActivities / metrics.totalActivities) * 100 : 0}%`,
                      }}
                      title="Pendientes"
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{
                        width: `${metrics.totalActivities ? (metrics.overdueActivities / metrics.totalActivities) * 100 : 0}%`,
                      }}
                      title="Atrasadas"
                    />
                  </div>

                  {/* Leyenda */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-gray-700">Cumplidas ({metrics.completedActivities})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                      <span className="text-gray-700">En curso ({metrics.inProgressActivities})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                      <span className="text-gray-700">Pendientes ({metrics.pendingActivities})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-red-600 font-bold">Atrasadas ({metrics.overdueActivities})</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total: {activities.length} actividades</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("tabla")}
                    className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver tabla completa</span>
                    <LuArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Panel Central: Actividades Prioritarias / Atrasadas */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 lg:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Actividades que Requieren Atención Inmediata
                      </h3>
                      <p className="text-xs text-gray-400">
                        Tareas atrasadas o en ejecución con plazos comprometidos
                      </p>
                    </div>
                    <span className="bg-red-50 text-red-600 font-bold text-xs px-2.5 py-1 rounded-full">
                      {metrics.overdueActivities} con atraso
                    </span>
                  </div>

                  {priorityActivities.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400">
                      ¡Excelente! No hay actividades atrasadas actualmente en el programa.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {priorityActivities.slice(0, 5).map((act) => {
                        const isOverdue = act.status === "Atrasada";

                        return (
                          <div
                            key={act.id}
                            className={clsx(
                              "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition",
                              isOverdue
                                ? "bg-red-50/50 border-red-200"
                                : "bg-gray-50 border-gray-200"
                            )}
                          >
                            <div className="flex-1 truncate">
                              <div className="flex items-center gap-2">
                                {act.code && (
                                  <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                                    {act.code}
                                  </span>
                                )}
                                <span
                                  className={clsx(
                                    "px-2 py-0.5 rounded text-[10px] font-bold",
                                    isOverdue
                                      ? "bg-red-100 text-red-800"
                                      : "bg-teal-100 text-teal-800"
                                  )}
                                >
                                  {act.status}
                                </span>
                                <span className="font-bold text-gray-900 truncate">
                                  {act.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 mt-1 truncate">
                                {act.category} • {act.areaName} • Resp: {act.responsibleUserName} • Vence: {act.endDate}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEvidenceModalActivity(act)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1 cursor-pointer"
                              >
                                <LuPaperclip className="w-3.5 h-3.5" />
                                <span>{act.evidences.length}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditActivityModal(act)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 cursor-pointer"
                              >
                                Gestionar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>Gestión de Riesgos Laborales • Ciclo Anual 2026</span>
                  <button
                    type="button"
                    onClick={handleOpenNewActivityModal}
                    className="text-teal-600 hover:underline font-semibold cursor-pointer"
                  >
                    + Planificar nueva actividad
                  </button>
                </div>
              </div>

              {/* Panel Inferior: Cumplimiento por Categoría */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 lg:col-span-2">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  Cumplimiento por Categoría de Gestión
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Avance de actividades en los 12 ejes preventivos del programa anual
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                  {Object.entries(metrics.byCategory).map(([cat, val]) => {
                    const pct = val.total > 0 ? Math.round((val.completed / val.total) * 100) : 0;
                    return (
                      <div key={cat} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                        <div className="flex items-center justify-between font-semibold text-gray-800 mb-1">
                          <span className="truncate pr-2">{cat}</span>
                          <span className="text-teal-800 font-bold">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-1.5">
                          <div className="bg-teal-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>{val.completed} de {val.total} completadas</span>
                          {val.overdue > 0 && (
                            <span className="text-red-600 font-bold">{val.overdue} atrasada(s)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Panel Inferior Derecho: Cumplimiento por Área y Responsable */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Cumplimiento por Área
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Rendimiento de los frentes de trabajo
                  </p>

                  <div className="space-y-3">
                    {Object.entries(metrics.byArea).map(([area, val]) => (
                      <div key={area} className="text-xs">
                        <div className="flex items-center justify-between text-gray-700 font-medium mb-1">
                          <span className="truncate">{area}</span>
                          <span className="font-bold text-teal-800">{val.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-teal-600 h-full rounded-full" style={{ width: `${val.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsFullProgramModalOpen(true)}
                    className="w-full py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-teal-200"
                  >
                    <LuFileText className="w-4 h-4" />
                    <span>Ver Documento Completo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: TABLA OPERATIVA DETALLADA */}
          {activeTab === "tabla" && (
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 overflow-x-auto">
              {/* Filtro por Categoría en la tabla */}
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-700">Filtrar Categoría:</span>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todas las Categorías ({activities.length})</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {filteredActivities.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400">
                  No se encontraron actividades con los filtros seleccionados.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Código</th>
                      <th className="py-3 px-3">Actividad / Objetivo</th>
                      <th className="py-3 px-3">Categoría</th>
                      <th className="py-3 px-3">Área y Resp.</th>
                      <th className="py-3 px-3">Periodicidad</th>
                      <th className="py-3 px-3">Plazo</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-3">Avance</th>
                      <th className="py-3 px-3 text-center">Evidencias</th>
                      <th className="py-3 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredActivities.map((act) => {
                      const isOverdue = act.status === "Atrasada";

                      return (
                        <tr
                          key={act.id}
                          className={clsx(
                            "hover:bg-gray-50/60 transition",
                            isOverdue && "bg-red-50/20"
                          )}
                        >
                          <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-teal-800">
                            {act.code || "-"}
                          </td>

                          <td className="py-3 px-3 max-w-xs">
                            <p className="font-bold text-gray-900 leading-tight">
                              {act.name}
                            </p>
                            {act.objective && (
                              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 italic">
                                {act.objective}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-gray-600 font-medium text-[11px]">
                            {act.category}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <p className="font-semibold text-gray-800">
                              {act.responsibleUserName || "No asignado"}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {act.areaName || "General"}
                            </p>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-[11px] text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                              {act.periodicity}
                            </span>
                            {act.applicability && (
                              <p className="text-[9px] text-gray-400 mt-0.5">
                                {act.applicability}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-gray-600 font-mono text-[11px]">
                            <div>{act.startDate}</div>
                            <div className={clsx(isOverdue && "text-red-600 font-bold")}>
                              {act.endDate}
                            </div>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={clsx(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                                act.status === "Cumplida" && "bg-emerald-50 text-emerald-800 border-emerald-200",
                                act.status === "En curso" && "bg-teal-50 text-teal-800 border-teal-200",
                                act.status === "Pendiente" && "bg-gray-100 text-gray-600 border-gray-200",
                                act.status === "Atrasada" && "bg-red-50 text-red-700 border-red-200 animate-pulse"
                              )}
                            >
                              {act.status}
                            </span>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap w-24">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-teal-600 h-full rounded-full"
                                  style={{ width: `${act.progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-gray-600 font-bold">
                                {act.progress}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setEvidenceModalActivity(act)}
                              className={clsx(
                                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition",
                                act.evidences.length > 0
                                  ? "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                              )}
                            >
                              <LuPaperclip className="w-3.5 h-3.5" />
                              <span>{act.evidences.length}</span>
                            </button>
                          </td>

                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditActivityModal(act)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition cursor-pointer"
                                title="Editar actividad"
                              >
                                <LuEye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteActivity(act.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Eliminar actividad"
                              >
                                <LuTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* ==================================================================== */}
      {/* MODAL: VER PROGRAMA COMPLETO COMO DOCUMENTO ESTRUCTURADO (REQ 23) */}
      {/* ==================================================================== */}
      {isFullProgramModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Barra de Acciones del Documento */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-xs">
                <LuFileText className="w-4 h-4 text-teal-600" />
                <span>Vista Documento Oficial • LifeOn Risk Management</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LuPrinter className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullProgramModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENIDO TIPO DOCUMENTO CORPORATIVO */}
            <div className="space-y-6 text-gray-800 text-xs leading-relaxed">
              {/* Encabezado Corporativo */}
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-teal-700 block">
                  Documento Oficial de Planificación Anual
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  PROGRAMA DE TRABAJO EN GESTIÓN DE RIESGOS LABORALES
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 text-left text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">Empresa</span>
                    <strong className="text-gray-900">{companyName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">Período</span>
                    <strong className="text-gray-900">2026</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">Responsable General</span>
                    <strong className="text-gray-900">{responsiblePerson}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold uppercase">Fecha de Elaboración</span>
                    <strong className="text-gray-900">Enero 2026 (Actualizado)</strong>
                  </div>
                </div>
              </div>

              {/* 1. Objetivo */}
              <div>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-1.5 border-b border-gray-200 pb-1">
                  1. Objetivo
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Establecer la estructura sistemática de directrices, actividades, controles y verificaciones para la Gestión de Riesgos Laborales en <strong>{companyName}</strong> durante el período 2026, asegurando la protección eficaz de la vida y salud de los trabajadores, la mejora continua de las condiciones laborales y el estricto cumplimiento normativo según DS 44, Ley 16.744 y estándares técnicos aplicables.
                </p>
              </div>

              {/* 2. Alcance */}
              <div>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-1.5 border-b border-gray-200 pb-1">
                  2. Alcance
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  El presente programa aplica obligatoriamente a todos los centros de trabajo, faenas, instalaciones, personal directo, empresas contratistas y subcontratistas vinculadas a los procesos de la organización.
                </p>
              </div>

              {/* 3. Responsabilidades */}
              <div>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-1.5 border-b border-gray-200 pb-1">
                  3. Responsabilidades
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li><strong>Alta Dirección / Gerencia:</strong> Proveer los recursos humanos, técnicos y financieros necesarios y ejercer un liderazgo preventivo visible.</li>
                  <li><strong>Línea de Mando / Supervisores:</strong> Ejecutar, controlar y verificar en terreno las actividades preventivas y el cumplimiento de medidas de control crítico.</li>
                  <li><strong>Asesoría en Prevención de Riesgos:</strong> Coordinar la planificación, auditar cumplimiento, gestionar evidencias y asesorar técnicamente a los comités y jefaturas.</li>
                  <li><strong>Comité Paritario (CPHS):</strong> Fiscalizar medidas preventivas, investigar incidentes y promover la participación de los trabajadores.</li>
                  <li><strong>Trabajadores:</strong> Cumplir rigurosamente con los procedimientos de trabajo seguro, uso obligatorio de EPP y reporte inmediato de peligros.</li>
                </ul>
              </div>

              {/* 4. Programa Anual de Actividades */}
              <div>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
                  4. Programa Anual de Actividades ({activities.length} Actividades)
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold text-[10px] uppercase">
                        <th className="py-2.5 px-2 text-center">N°</th>
                        <th className="py-2.5 px-2">Código</th>
                        <th className="py-2.5 px-2">Categoría</th>
                        <th className="py-2.5 px-2">Actividad</th>
                        <th className="py-2.5 px-2">Responsable</th>
                        <th className="py-2.5 px-2">Periodicidad</th>
                        <th className="py-2.5 px-2">Inicio</th>
                        <th className="py-2.5 px-2">Término</th>
                        <th className="py-2.5 px-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activities.map((act, index) => (
                        <tr key={act.id} className="hover:bg-gray-50/50">
                          <td className="py-2 px-2 text-center text-gray-400 font-mono">{index + 1}</td>
                          <td className="py-2 px-2 font-mono font-bold text-teal-800">{act.code || "-"}</td>
                          <td className="py-2 px-2 text-gray-600 font-medium">{act.category}</td>
                          <td className="py-2 px-2 font-semibold text-gray-900">{act.name}</td>
                          <td className="py-2 px-2 text-gray-700">{act.responsibleUserName || "-"}</td>
                          <td className="py-2 px-2 text-gray-600">{act.periodicity}</td>
                          <td className="py-2 px-2 font-mono text-[11px] text-gray-600">{act.startDate}</td>
                          <td className="py-2 px-2 font-mono text-[11px] text-gray-600">{act.endDate}</td>
                          <td className="py-2 px-2">
                            <span className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-bold",
                              act.status === "Cumplida" && "bg-emerald-100 text-emerald-800",
                              act.status === "En curso" && "bg-teal-100 text-teal-800",
                              act.status === "Pendiente" && "bg-gray-100 text-gray-700",
                              act.status === "Atrasada" && "bg-red-100 text-red-800"
                            )}>
                              {act.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Seguimiento */}
              <div>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-1.5 border-b border-gray-200 pb-1">
                  5. Seguimiento y Control
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  El seguimiento del programa se realiza mediante revisiones sistemáticas mensuales en la plataforma LifeOn, constatando el porcentaje de ejecución de cada hito y la carga de registros verificables en formato digital.
                </p>
              </div>

              {/* 6. Indicadores */}
              <div>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
                  6. Indicadores de Cumplimiento
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Cumplimiento Global</span>
                    <strong className="text-lg text-teal-800 font-black">{metrics.compliancePercentage}%</strong>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Total Tareas</span>
                    <strong className="text-lg text-gray-900 font-black">{metrics.totalActivities}</strong>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">Cumplidas</span>
                    <strong className="text-lg text-emerald-700 font-black">{metrics.completedActivities}</strong>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-teal-700 font-bold uppercase block">En Curso</span>
                    <strong className="text-lg text-teal-700 font-black">{metrics.inProgressActivities}</strong>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Pendientes</span>
                    <strong className="text-lg text-gray-700 font-black">{metrics.pendingActivities}</strong>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[10px] text-red-700 font-bold uppercase block">Atrasadas</span>
                    <strong className="text-lg text-red-700 font-black">{metrics.overdueActivities}</strong>
                  </div>
                </div>
              </div>

              {/* 7. Evidencias / Registros */}
              <div>
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-1.5 border-b border-gray-200 pb-1">
                  7. Evidencias y Registros
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Todas las actividades contempladas disponen de respaldo trazable en la plataforma LifeOn, contando actualmente con un repositorio consolidado de <strong>{activities.reduce((acc, a) => acc + a.evidences.length, 0)} archivo(s) de evidencia</strong> (actas CPHS, registros de asistencia, informes de inspección técnica y fotografías de terreno).
                </p>
              </div>

              {/* 8. Estado General del Programa y Firmas */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider mb-2">
                  8. Estado General y Cierre
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  El Programa Anual de Trabajo se encuentra activo y sujeto a auditorías periódicas de conformidad legal y técnica. Las desviaciones detectadas son gestionadas oportunamente mediante medidas correctivas documentadas en el sistema.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 text-center text-xs">
                  <div className="border-t border-gray-400 pt-2">
                    <strong className="text-gray-900 block">{responsiblePerson}</strong>
                    <span className="text-gray-500">Experto / Encargado de Prevención de Riesgos</span>
                    <span className="text-[10px] text-gray-400 block mt-1">Elaborador y Administrador del Programa</span>
                  </div>
                  <div className="border-t border-gray-400 pt-2">
                    <strong className="text-gray-900 block">Representante Legal / Gerencia</strong>
                    <span className="text-gray-500">{companyName}</span>
                    <span className="text-[10px] text-gray-400 block mt-1">Aprobación Corporativa</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-200 flex justify-end print:hidden">
              <button
                type="button"
                onClick={() => setIsFullProgramModalOpen(false)}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Entendido / Cerrar Documento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREAR / EDITAR ACTIVIDAD DEL PROGRAMA (REQ 21 & 22) */}
      {/* ==================================================================== */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingActivity ? "Editar Actividad del Programa" : "Nueva Actividad Preventiva"}
              </h3>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ej: PLN-01"
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre de la Actividad *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Inspección mensual de extintores y red húmeda"
                    required
                    autoFocus
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Objetivo de la Actividad
                </label>
                <input
                  type="text"
                  value={formObjective}
                  onChange={(e) => setFormObjective(e.target.value)}
                  placeholder="Ej: Asegurar la operatividad de los equipos de extinción ante emergencias"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ActivityCategory)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Periodicidad
                  </label>
                  <select
                    value={formPeriodicity}
                    onChange={(e) => setFormPeriodicity(e.target.value as ActivityPeriodicity)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none"
                  >
                    {PERIODICITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Aplicabilidad
                  </label>
                  <select
                    value={formApplicability}
                    onChange={(e) => setFormApplicability(e.target.value as ActivityApplicability)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none"
                  >
                    {APPLICABILITIES.map((app) => (
                      <option key={app} value={app}>
                        {app}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* VINCULACIÓN CON ESTRUCTURA ORGANIZACIONAL */}
              <div className="p-3 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
                <span className="text-[11px] font-bold text-teal-900 block">
                  Asignación Organizacional
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                      Área
                    </label>
                    <select
                      value={formAreaId}
                      onChange={(e) => setFormAreaId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="">Seleccionar área</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                      Cargo Responsable
                    </label>
                    <select
                      value={formPositionId}
                      onChange={(e) => setFormPositionId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="">Seleccionar cargo</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">
                      Usuario Asignado
                    </label>
                    <select
                      value={formUserId}
                      onChange={(e) => setFormUserId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="">Seleccionar usuario</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Fecha de Término
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              {/* Estado y Avance */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Estado Actual
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => {
                      const next = e.target.value as ActivityStatus;
                      setFormStatus(next);
                      if (next === "Cumplida") setFormProgress(100);
                      if (next === "Pendiente") setFormProgress(0);
                    }}
                    className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En curso">En curso</option>
                    <option value="Cumplida">Cumplida</option>
                    <option value="Atrasada">Atrasada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    % de Avance ({formProgress}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full accent-teal-600 mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Descripción u Observaciones
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Detalles sobre el procedimiento o verificación..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim()}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  Guardar Actividad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EVIDENCIAS DE LA ACTIVIDAD */}
      {/* ==================================================================== */}
      {evidenceModalActivity && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Evidencias de Ejecución
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-xs">
                  {evidenceModalActivity.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEvidenceModalActivity(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de evidencias actuales */}
            <div className="mb-4">
              <span className="text-xs font-bold text-gray-700 mb-2 block">
                Archivos o Registros Asociados ({evidenceModalActivity.evidences.length})
              </span>

              {evidenceModalActivity.evidences.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400 border border-gray-100">
                  No hay evidencias adjuntas para esta actividad.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {evidenceModalActivity.evidences.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <LuPaperclip className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 truncate">{ev.name}</span>
                        <span className="text-[10px] text-gray-400">({ev.type})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEvidence(evidenceModalActivity.id, ev.id)}
                        className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Eliminar evidencia"
                      >
                        <LuTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulario para registrar nueva evidencia */}
            <form onSubmit={handleAddEvidenceSubmit} className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
              <span className="text-xs font-bold text-teal-900 block mb-2">
                + Adjuntar Nueva Evidencia
              </span>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={evidenceFormName}
                  onChange={(e) => setEvidenceFormName(e.target.value)}
                  placeholder="Nombre del archivo o registro (ej: Acta_Firma_Charla.pdf)"
                  className="w-full px-3 py-2 text-xs border border-teal-200 rounded-xl bg-white focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={evidenceFormType}
                    onChange={(e) => setEvidenceFormType(e.target.value as any)}
                    className="px-3 py-1.5 text-xs border border-teal-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Documento">Documento</option>
                    <option value="Registro">Registro de Asistencia</option>
                    <option value="Fotografía">Fotografía en Terreno</option>
                    <option value="Certificado">Certificado</option>
                    <option value="Informe">Informe Técnico</option>
                    <option value="Otro">Otro Archivo</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!evidenceFormName.trim()}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer ml-auto"
                  >
                    Adjuntar
                  </button>
                </div>
              </div>
            </form>

            <div className="pt-3 mt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setEvidenceModalActivity(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importación Masiva de Programa de Trabajo (Req 19 - 24) */}
      <ProgramImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        workCenters={workCenters}
        areas={areas}
        positions={positions}
        users={users}
        onConfirmImport={handleConfirmProgramImport}
        onDownloadTemplate={downloadProgramTemplateXlsx}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import {
  LuSparkles,
  LuArrowRight,
  LuArrowLeft,
  LuCheck,
  LuBuilding2,
  LuBriefcase,
  LuUsers,
  LuLayers,
  LuTable,
  LuFileText,
  LuAtom,
  LuShieldAlert,
  LuCircleHelp,
  LuLightbulb,
  LuSlidersHorizontal,
  LuCircleCheck,
  LuFlame,
  LuShieldCheck,
  LuFolderCheck,
} from "react-icons/lu";
import {
  OrganizationPreferences,
  ExperienceLevel,
  GuidanceLevel,
  RiskEvaluationMethod,
  RiskManagementApproach,
  OrganizationSize,
  TERMINOLOGY_MAP,
} from "@/types/preferences";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";

interface InitialOnboardingWizardProps {
  onCompleted?: () => void;
  userDefaultOrgName?: string;
}

const TOTAL_STEPS = 7;

export default function InitialOnboardingWizard({
  onCompleted,
  userDefaultOrgName,
}: InitialOnboardingWizardProps) {
  const {
    preferences,
    updatePreferences,
    completeOnboarding,
  } = useLifeOnPreferences();

  // Paso actual inicializado desde preferences para reanudar si cerró la ventana
  const [step, setStep] = useState<number>(() => {
    const saved = preferences.onboardingStep;
    return saved && saved >= 1 && saved <= TOTAL_STEPS ? saved : 1;
  });

  // Estado local del formulario
  const [orgName, setOrgName] = useState(
    preferences.organizationName || userDefaultOrgName || "Constructora y Servicios Santiago SpA"
  );
  const [orgSize, setOrgSize] = useState<OrganizationSize | string>(
    preferences.organizationSize || "51-200"
  );
  const [orgSector, setOrgSector] = useState(
    preferences.organizationSector || "Construcción"
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    preferences.experienceLevel || "guided"
  );
  const [modules, setModules] = useState(
    preferences.modules || { miper: true, documentManagement: true, aprVirtual: true }
  );
  const [riskEvaluationMethod, setRiskEvaluationMethod] = useState<RiskEvaluationMethod>(
    preferences.riskEvaluationMethod || "ds44"
  );
  const [riskManagementApproach, setRiskManagementApproach] = useState<RiskManagementApproach>(
    preferences.riskManagementApproach || "simplified"
  );
  const [guidanceLevel, setGuidanceLevel] = useState<GuidanceLevel>(
    preferences.guidanceLevel || "high"
  );

  // Pantalla de éxito tras finalizar
  const [isSuccessScreen, setIsSuccessScreen] = useState(false);

  // Guardar automáticamente el progreso en cada paso
  useEffect(() => {
    updatePreferences({
      onboardingStep: step,
      organizationName: orgName,
      organizationSize: orgSize,
      organizationSector: orgSector,
      experienceLevel,
      modules,
      riskEvaluationMethod,
      riskManagementApproach,
      guidanceLevel,
    });
  }, [
    step,
    orgName,
    orgSize,
    orgSector,
    experienceLevel,
    modules,
    riskEvaluationMethod,
    riskManagementApproach,
    guidanceLevel,
    updatePreferences,
  ]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    } else if (step === TOTAL_STEPS) {
      // Mostrar pantalla de confirmación previa a entrar a LifeOn
      setIsSuccessScreen(true);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleFinishAndEnter = () => {
    completeOnboarding({
      organizationName: orgName,
      organizationSize: orgSize,
      organizationSector: orgSector,
      experienceLevel,
      modules,
      riskEvaluationMethod,
      riskManagementApproach,
      guidanceLevel,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      tourCompleted: false,
    });
    if (onCompleted) {
      onCompleted();
    }
  };

  // Porcentaje de progreso
  const progressPercentage = Math.round((step / TOTAL_STEPS) * 100);

  // Opciones de sectores industriales
  const SECTORS = [
    "Construcción",
    "Minería",
    "Manufactura / Industria",
    "Transporte y logística",
    "Comercio",
    "Servicios",
    "Salud",
    "Educación",
    "Agricultura",
    "Otro",
  ];

  // Opciones de tamaño
  const SIZES: { label: string; value: OrganizationSize }[] = [
    { label: "1 a 20 trabajadores", value: "1-20" },
    { label: "21 a 50", value: "21-50" },
    { label: "51 a 200", value: "51-200" },
    { label: "201 a 500", value: "201-500" },
    { label: "Más de 500", value: "500+" },
  ];

  // Vista comparativa de terminología para Paso 3
  const sampleTerms = useMemo(() => {
    return TERMINOLOGY_MAP[experienceLevel];
  }, [experienceLevel]);

  // Si estamos en la pantalla de éxito final
  if (isSuccessScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAFC]/95 backdrop-blur-sm flex items-center justify-center p-4 font-[family-name:var(--font-poppins)] animate-in fade-in duration-300">
        <div className="bg-white max-w-lg w-full rounded-3xl p-8 sm:p-10 shadow-2xl border border-gray-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 mb-6 animate-in zoom-in-50 duration-300">
            <LuCircleCheck className="w-10 h-10" />
          </div>

          <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            Configuración Finalizada
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            ¡Todo listo!
          </h2>

          <p className="text-sm text-gray-600 mt-3 max-w-sm leading-relaxed">
            LifeOn ha sido configurado de acuerdo con las necesidades de{" "}
            <span className="font-semibold text-gray-900">{orgName}</span> y tu forma de trabajar.
          </p>

          <div className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl p-4 my-6 text-left flex flex-col gap-2 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Nivel de experiencia:</span>
              <span className="font-semibold text-gray-800 capitalize">
                {experienceLevel === "expert" ? "Especialista / Técnico" : experienceLevel === "intermediate" ? "Conocimientos Básicos" : "Guiado y Asistido"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Metodología Matriz IPER:</span>
              <span className="font-semibold text-gray-800">
                {riskEvaluationMethod === "ds44" ? "Normativa DS 44 / ISL" : riskEvaluationMethod === "matrix5x5" ? "Matriz 5 × 5" : "Pendiente"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Enfoque de gestión:</span>
              <span className="font-semibold text-gray-800">
                {riskManagementApproach === "simplified" ? "Matriz Simplificada" : "Controles Críticos (Avanzada)"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishAndEnter}
            className="w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ir a LifeOn</span>
            <LuArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col font-[family-name:var(--font-poppins)] overflow-y-auto">
      {/* 1. Barra Superior con Logo y Progreso */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200/80 shadow-2xs flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#F04438]">Life</span>
              <span className="text-2xl font-black text-[#0D9488]">On</span>
            </div>
            <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block" />
            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
              Asistente de Configuración Inicial
            </span>
          </div>

          {step > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-600">
                Paso <span className="text-teal-700 font-bold">{step}</span> de {TOTAL_STEPS}
              </span>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                {progressPercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Línea de progreso continuo */}
        <div className="w-full bg-gray-100 h-1">
          <div
            className="bg-gradient-to-r from-[#F04438] via-teal-500 to-[#0D9488] h-1 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* 2. Contenedor Central del Wizard (Máx 840px, centrado y sobrio) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-gray-100/80 flex flex-col justify-between min-h-[500px]">

          {/* =========================================================================
              PASO 1 — BIENVENIDA
              ========================================================================= */}
          {step === 1 && (
            <div className="flex flex-col items-center text-center my-auto py-2 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-xs mb-5">
                <LuSparkles className="w-8 h-8" />
              </div>

              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                Bienvenido a LifeOn
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight max-w-lg">
                Configura LifeOn a tu forma de trabajar
              </h1>

              <p className="text-sm text-gray-600 mt-3 max-w-xl leading-relaxed">
                Antes de comenzar, configuraremos LifeOn de acuerdo con las necesidades de tu organización y tu nivel de experiencia en Prevención de Riesgos.
              </p>

              <div className="my-6 p-4 sm:p-5 bg-gradient-to-br from-teal-50/50 via-[#F8FAFC] to-slate-50 border border-teal-100/60 rounded-2xl max-w-xl text-left">
                <p className="text-xs font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  ¿Qué es LifeOn?
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  LifeOn centraliza y simplifica la gestión preventiva de tu organización, permitiéndote trabajar con distintas metodologías y niveles de profundidad según tus necesidades operativas y normativas.
                </p>
              </div>

              <p className="text-xs text-gray-400 mb-6">
                Solo tomará unos minutos y podrás modificar estas preferencias cuando quieras desde Configuración.
              </p>

              <button
                type="button"
                onClick={handleNext}
                className="py-3.5 px-8 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-md shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
              >
                <span>Comenzar configuración</span>
                <LuArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* =========================================================================
              PASO 2 — CONOZCAMOS TU ORGANIZACIÓN
              ========================================================================= */}
          {step === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Contexto Inicial
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                  Conozcamos tu organización
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Esta información nos ayuda a contextualizar reportes, faenas y sugerencias preventivas.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* 1. Nombre de la Organización */}
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5 flex items-center gap-2">
                    <LuBuilding2 className="w-4 h-4 text-teal-600" />
                    Nombre o Razón Social de la Organización
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ej: Constructora y Servicios Santiago SpA"
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 text-xs sm:text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Nombre registrado para membretes de matrices y análisis preventivos.
                  </span>
                </div>

                {/* 2. Tamaño de la Organización */}
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-2 flex items-center gap-2">
                    <LuUsers className="w-4 h-4 text-teal-600" />
                    Tamaño aproximado de la organización (Dotación total)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SIZES.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setOrgSize(item.value)}
                        className={clsx(
                          "p-3 rounded-xl border text-xs font-semibold text-left transition cursor-pointer flex items-center justify-between",
                          orgSize === item.value
                            ? "bg-teal-50/80 border-teal-500 text-teal-900 shadow-2xs"
                            : "bg-white border-gray-200 hover:border-gray-300 text-gray-700"
                        )}
                      >
                        <span>{item.label}</span>
                        {orgSize === item.value && (
                          <LuCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Actividad o Sector Principal */}
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1.5 flex items-center gap-2">
                    <LuBriefcase className="w-4 h-4 text-teal-600" />
                    Actividad o sector productivo principal
                  </label>
                  <select
                    value={orgSector}
                    onChange={(e) => setOrgSector(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-gray-200 rounded-xl p-3 text-xs sm:text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  >
                    {SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PASO 3 — NIVEL DE EXPERIENCIA EN PREVENCIÓN DE RIESGOS
              ========================================================================= */}
          {step === 3 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Personalización Clave
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                  ¿Qué nivel de experiencia tienes en Prevención de Riesgos?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  LifeOn adaptará el vocabulario técnico, las preguntas y las ayudas contextuales a tu perfil.
                </p>
              </div>

              {/* 3 Opciones principales */}
              <div className="flex flex-col gap-3">
                {/* Opción A: Experto */}
                <button
                  type="button"
                  onClick={() => setExperienceLevel("expert")}
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                    experienceLevel === "expert"
                      ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border text-xs font-bold",
                      experienceLevel === "expert"
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-gray-300 text-transparent"
                    )}
                  >
                    <LuCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        Tengo conocimientos o experiencia en Prevención de Riesgos
                      </h4>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Especialista
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      LifeOn utilizará terminología técnica directa (Probabilidad, Consecuencia, Riesgo Residual, Controles Mitigadores) y te permitirá trabajar con mayor nivel de detalle y opciones avanzadas.
                    </p>
                  </div>
                </button>

                {/* Opción B: Intermedio */}
                <button
                  type="button"
                  onClick={() => setExperienceLevel("intermediate")}
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                    experienceLevel === "intermediate"
                      ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border text-xs font-bold",
                      experienceLevel === "intermediate"
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-gray-300 text-transparent"
                    )}
                  >
                    <LuCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        Tengo conocimientos básicos
                      </h4>
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Equilibrado
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Utilizaremos un equilibrio entre una experiencia guiada y terminología técnica clara con aclaraciones en puntos clave.
                    </p>
                  </div>
                </button>

                {/* Opción C: Guiado */}
                <button
                  type="button"
                  onClick={() => setExperienceLevel("guided")}
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                    experienceLevel === "guided"
                      ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border text-xs font-bold",
                      experienceLevel === "guided"
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-gray-300 text-transparent"
                    )}
                  >
                    <LuCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">
                        No tengo conocimientos especializados
                      </h4>
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Asistido
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      LifeOn formulará preguntas sencillas y humanas (&ldquo;¿Qué tan probable es que ocurra?&rdquo;, &ldquo;¿Qué podemos hacer para evitarlo?&rdquo;), con ejemplos y procesos guiados paso a paso.
                    </p>
                  </div>
                </button>
              </div>

              {/* Muestra en vivo de cómo cambia el lenguaje */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <LuSparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span>Cómo verás las preguntas de evaluación:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-semibold text-gray-800">
                    {sampleTerms.probability}
                  </span>
                  <span className="text-gray-400">×</span>
                  <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-semibold text-gray-800">
                    {sampleTerms.consequence}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PASO 4 — CONFIGURACIÓN DE MÓDULOS
              ========================================================================= */}
          {step === 4 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Módulos de la Plataforma
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                  ¿Qué módulos quieres comenzar a configurar ahora?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Los módulos no seleccionados para configurar ahora quedarán activos con su configuración estándar y podrás personalizarlos más adelante.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* 1. Matriz IPER */}
                <div
                  onClick={() => setModules((prev) => ({ ...prev, miper: !prev.miper }))}
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4",
                    modules.miper
                      ? "bg-teal-50/60 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <LuTable className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">Matriz IPER</h4>
                        <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Identifica peligros, evalúa riesgos y administra las medidas de control preventivas de tu organización según la normativa vigente.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={modules.miper}
                    onChange={() => {}}
                    className="w-5 h-5 accent-teal-600 rounded mt-1 flex-shrink-0 cursor-pointer"
                  />
                </div>

                {/* 2. Gestión Documental */}
                <div
                  onClick={() =>
                    setModules((prev) => ({ ...prev, documentManagement: !prev.documentManagement }))
                  }
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4",
                    modules.documentManagement
                      ? "bg-teal-50/60 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <LuFileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">Gestión Documental</h4>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Organiza procedimientos de trabajo seguro (PTS), programas preventivos, responsables y procesos de difusión formal.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={modules.documentManagement}
                    onChange={() => {}}
                    className="w-5 h-5 accent-teal-600 rounded mt-1 flex-shrink-0 cursor-pointer"
                  />
                </div>

                {/* 3. APR Virtual */}
                <div
                  onClick={() =>
                    setModules((prev) => ({ ...prev, aprVirtual: !prev.aprVirtual }))
                  }
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4",
                    modules.aprVirtual
                      ? "bg-teal-50/60 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <LuAtom className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">APR Virtual con Inteligencia Artificial</h4>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          IA
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        Genera y gestiona análisis preventivos de las actividades de manera simple, rápida y asistida con motor de IA preventiva.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={modules.aprVirtual}
                    onChange={() => {}}
                    className="w-5 h-5 accent-teal-600 rounded mt-1 flex-shrink-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PASO 5 — CONFIGURACIÓN MATRIZ IPER
              ========================================================================= */}
          {step === 5 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Metodología Preventiva
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                  Configuración Matriz IPER
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Define cómo evaluará los riesgos tu organización y el nivel de profundidad de tus análisis.
                </p>
              </div>

              {/* 5.1 METODOLOGÍA DE EVALUACIÓN */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2">
                  1. ¿Cómo prefieres evaluar los riesgos?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* DS44 / ISL */}
                  <button
                    type="button"
                    onClick={() => setRiskEvaluationMethod("ds44")}
                    className={clsx(
                      "p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2",
                      riskEvaluationMethod === "ds44"
                        ? "bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900">DS 44 / ISL</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Chile
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Orientada al cumplimiento legal normativo chileno y criterios ISL / SUSESO.
                      </p>
                    </div>
                    {riskEvaluationMethod === "ds44" && (
                      <span className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                        <LuCheck className="w-3.5 h-3.5" /> Seleccionada
                      </span>
                    )}
                  </button>

                  {/* Matriz 5x5 */}
                  <button
                    type="button"
                    onClick={() => setRiskEvaluationMethod("matrix5x5")}
                    className={clsx(
                      "p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2",
                      riskEvaluationMethod === "matrix5x5"
                        ? "bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-900 block mb-1">Matriz 5 × 5</span>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Cinco niveles de probabilidad y cinco de severidad para evaluaciones estándar.
                      </p>
                    </div>
                    {riskEvaluationMethod === "matrix5x5" && (
                      <span className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                        <LuCheck className="w-3.5 h-3.5" /> Seleccionada
                      </span>
                    )}
                  </button>

                  {/* Configurar más adelante */}
                  <button
                    type="button"
                    onClick={() => setRiskEvaluationMethod("pending")}
                    className={clsx(
                      "p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2",
                      riskEvaluationMethod === "pending"
                        ? "bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-900 block mb-1">Configurar luego</span>
                      <p className="text-[11px] text-gray-600 leading-snug">
                        Comenzar con parámetros predeterminados y definirlo en tu primera matriz.
                      </p>
                    </div>
                    {riskEvaluationMethod === "pending" && (
                      <span className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                        <LuCheck className="w-3.5 h-3.5" /> Seleccionada
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 5.2 PROFUNDIDAD DE LA MATRIZ */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2">
                  2. ¿Qué nivel de profundidad necesitas para gestionar tus riesgos?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opción A: Simplificada */}
                  <button
                    type="button"
                    onClick={() => setRiskManagementApproach("simplified")}
                    className={clsx(
                      "p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-3",
                      riskManagementApproach === "simplified"
                        ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                          Matriz IPER Simplificada
                        </h4>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Directa
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed mb-2">
                        Gestión ágil para identificar peligros, evaluar riesgos y definir medidas de control.
                      </p>
                      <div className="p-2 bg-white/80 rounded-lg border border-gray-100 text-[10px] text-gray-500 font-mono">
                        Proceso &rarr; Tarea &rarr; Peligro &rarr; Control &rarr; Riesgo Residual
                      </div>
                    </div>

                    <div className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                      {riskManagementApproach === "simplified" ? (
                        <>
                          <LuCheck className="w-3.5 h-3.5" /> Enfoque seleccionado
                        </>
                      ) : (
                        <span>Seleccionar opción &rarr;</span>
                      )}
                    </div>
                  </button>

                  {/* Opción B: Gestión Avanzada de Controles Críticos */}
                  <button
                    type="button"
                    onClick={() => setRiskManagementApproach("critical_controls")}
                    className={clsx(
                      "p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-3",
                      riskManagementApproach === "critical_controls"
                        ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                          Gestión de Riesgos y Controles Críticos
                        </h4>
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Avanzada
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed mb-2">
                        Orientada a eventos de alto potencial, causas, controles preventivos y mitigadores.
                      </p>
                      <div className="p-2 bg-white/80 rounded-lg border border-gray-100 text-[10px] text-gray-500 font-mono">
                        Causas &rarr; Controles Prev. &rarr; Evento &rarr; Mitigadores
                      </div>
                    </div>

                    <div className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                      {riskManagementApproach === "critical_controls" ? (
                        <>
                          <LuCheck className="w-3.5 h-3.5" /> Enfoque seleccionado
                        </>
                      ) : (
                        <span>Seleccionar opción &rarr;</span>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* 5.3 RECOMENDACIÓN INTELIGENTE */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50/90 to-cyan-50/60 border border-teal-200/80 rounded-xl flex items-start gap-3">
                <LuLightbulb className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-teal-900">
                  <span className="font-bold">Recomendación para tu perfil: </span>
                  {experienceLevel === "guided" && (
                    <span>
                      Por tus respuestas, te recomendamos comenzar con <b>Matriz IPER Simplificada</b>. Podrás cambiar a una gestión avanzada posteriormente cuando tu equipo lo requiera.
                    </span>
                  )}
                  {experienceLevel === "expert" && (
                    <span>
                      Al contar con experiencia técnica, la <b>Gestión de Controles Críticos</b> te permitirá mapear eventos de alto impacto con estándares de desempeño y verificación en faena.
                    </span>
                  )}
                  {experienceLevel === "intermediate" && (
                    <span>
                      Puedes comenzar con la <b>Matriz IPER Simplificada</b> para una rápida adopción inicial y evolucionar hacia controles críticos en una segunda fase.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              PASO 6 — NIVEL DE ACOMPAÑAMIENTO
              ========================================================================= */}
          {step === 6 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Asistencia y Ayudas
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                  ¿Cuánta ayuda quieres recibir mientras utilizas LifeOn?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Configura el nivel de asistencia contextual, guías y consejos que la plataforma mostrará en tu día a día.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* 1. Guíame paso a paso */}
                <button
                  type="button"
                  onClick={() => setGuidanceLevel("high")}
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                    guidanceLevel === "high"
                      ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border text-xs font-bold",
                      guidanceLevel === "high"
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-gray-300 text-transparent"
                    )}
                  >
                    <LuCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Guíame paso a paso</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Mostrar explicaciones, ejemplos prácticos y recomendaciones preventivas en cada formulario y proceso de la plataforma.
                    </p>
                  </div>
                </button>

                {/* 2. Ayuda cuando la necesite */}
                <button
                  type="button"
                  onClick={() => setGuidanceLevel("contextual")}
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                    guidanceLevel === "contextual"
                      ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border text-xs font-bold",
                      guidanceLevel === "contextual"
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-gray-300 text-transparent"
                    )}
                  >
                    <LuCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Ayuda cuando la necesite</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Mostrar información contextual o tooltips de asistencia solo en puntos clave o campos con requerimientos normativos específicos.
                    </p>
                  </div>
                </button>

                {/* 3. Prefiero una experiencia directa */}
                <button
                  type="button"
                  onClick={() => setGuidanceLevel("minimal")}
                  className={clsx(
                    "p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                    guidanceLevel === "minimal"
                      ? "bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className={clsx(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border text-xs font-bold",
                      guidanceLevel === "minimal"
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-gray-300 text-transparent"
                    )}
                  >
                    <LuCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Prefiero una experiencia directa</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      Reducir explicaciones adicionales y priorizar una interfaz limpia, técnica y compacta optimizada para usuarios recurrentes.
                    </p>
                  </div>
                </button>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-500">
                💡 <span className="font-semibold text-gray-700">Nota:</span> Esta configuración trabaja de forma combinada con tu nivel de experiencia para ofrecerte siempre el nivel de detalle óptimo.
              </div>
            </div>
          )}

          {/* =========================================================================
              PASO 7 — RESUMEN
              ========================================================================= */}
          {step === 7 && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Confirmación Final
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                  Así configuraremos tu experiencia en LifeOn
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Revisa el resumen antes de ingresar. Podrás modificar estas preferencias en cualquier momento desde Configuración.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Organización */}
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <LuBuilding2 className="w-3.5 h-3.5 text-teal-600" /> Organización
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                      >
                        Modificar
                      </button>
                    </div>
                    <p className="text-xs font-bold text-gray-900">{orgName}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{orgSector} • {orgSize} trabajadores</p>
                  </div>
                </div>

                {/* 2. Experiencia */}
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <LuUsers className="w-3.5 h-3.5 text-teal-600" /> Experiencia SST
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                      >
                        Modificar
                      </button>
                    </div>
                    <p className="text-xs font-bold text-gray-900">
                      {experienceLevel === "expert"
                        ? "Conocimientos Especializados"
                        : experienceLevel === "intermediate"
                        ? "Conocimientos Básicos"
                        : "Experiencia Guiada"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Lenguaje: {experienceLevel === "expert" ? "Técnico directo" : experienceLevel === "intermediate" ? "Técnico equilibrado" : "Preguntas orientadoras"}
                    </p>
                  </div>
                </div>

                {/* 3. Matriz IPER */}
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <LuTable className="w-3.5 h-3.5 text-teal-600" /> Matriz IPER
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(5)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                      >
                        Modificar
                      </button>
                    </div>
                    <p className="text-xs font-bold text-gray-900">
                      {riskEvaluationMethod === "ds44"
                        ? "Normativa DS 44 / ISL"
                        : riskEvaluationMethod === "matrix5x5"
                        ? "Matriz 5 × 5"
                        : "Por definir en primera matriz"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Enfoque: {riskManagementApproach === "simplified" ? "Matriz Simplificada" : "Controles Críticos (Avanzada)"}
                    </p>
                  </div>
                </div>

                {/* 4. Acompañamiento y Módulos */}
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <LuSlidersHorizontal className="w-3.5 h-3.5 text-teal-600" /> Acompañamiento & Módulos
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep(6)}
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold cursor-pointer"
                      >
                        Modificar
                      </button>
                    </div>
                    <p className="text-xs font-bold text-gray-900">
                      {guidanceLevel === "high"
                        ? "Guía paso a paso activa"
                        : guidanceLevel === "contextual"
                        ? "Ayuda contextual puntual"
                        : "Experiencia directa y compacta"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-teal-800 font-medium">
                      {modules.miper && <span>✓ IPER</span>}
                      {modules.documentManagement && <span>• ✓ Docs</span>}
                      {modules.aprVirtual && <span>• ✓ APR IA</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              BARRA DE NAVEGACIÓN INFERIOR (ATRÁS / CONTINUAR)
              ========================================================================= */}
          <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <LuArrowLeft className="w-3.5 h-3.5" />
                Atrás
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              {step === TOTAL_STEPS ? (
                <>
                  <LuCircleCheck className="w-4 h-4" />
                  Finalizar configuración
                </>
              ) : (
                <>
                  Continuar
                  <LuArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";
import {
  LuSparkles,
  LuArrowRight,
  LuArrowLeft,
  LuCheck,
  LuBuilding2,
  LuBriefcase,
  LuUsers,
  LuShieldCheck,
  LuCircleCheck,
  LuFlame,
  LuBookOpen,
  LuGraduationCap,
  LuLayers,
  LuSlidersHorizontal,
  LuCircleHelp,
  LuTarget,
} from "react-icons/lu";
import {
  ExperienceLevel,
  OrganizationSize,
  RiskManagementApproach,
  GuidanceLevel,
} from "@/types/preferences";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";

interface InitialOnboardingWizardProps {
  onCompleted?: () => void;
  userDefaultOrgName?: string;
}

const TOTAL_STEPS = 5;

const SECTORS = [
  "Construcción",
  "Minería y Extracción",
  "Servicios e Ingeniería",
  "Manufactura e Industria",
  "Logística y Transporte",
  "Salud y Asistencia",
  "Comercio y Retail",
  "Otro Rubro",
];

const WORKER_RANGES = [
  "1 a 20 trabajadores",
  "21 a 50 trabajadores",
  "51 a 100 trabajadores",
  "101 a 200 trabajadores",
  "201 a 500 trabajadores",
  "Más de 500 trabajadores",
];

export default function InitialOnboardingWizard({
  onCompleted,
  userDefaultOrgName,
}: InitialOnboardingWizardProps) {
  const { preferences, updatePreferences, completeOnboarding, currentUser } = useLifeOnPreferences();

  // Paso actual (1: Bienvenida, 2: Datos Empresa, 3: Nivel de Conocimiento, 4: Enfoque Gestión, 5: Acompañamiento)
  const [step, setStep] = useState<number>(() => {
    const saved = preferences.onboardingStep;
    return saved && saved >= 1 && saved <= TOTAL_STEPS ? saved : 1;
  });

  // Detectar cuenta limpia para no precargar datos demo
  const isCleanAccount = currentUser?.orgId === "org_luis";

  const [orgName, setOrgName] = useState<string>(() => {
    if (isCleanAccount) return preferences.organizationName || "";
    return preferences.organizationName || currentUser?.orgName || userDefaultOrgName || "";
  });
  const [orgSize, setOrgSize] = useState<string>(() => {
    if (isCleanAccount) return preferences.organizationSize || "";
    return preferences.organizationSize || "51 a 100 trabajadores";
  });
  const [orgSector, setOrgSector] = useState<string>(() => {
    if (isCleanAccount) return preferences.organizationSector || "";
    return preferences.organizationSector || "Construcción";
  });
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    preferences.experienceLevel || "guided"
  );
  const [riskManagementApproach, setRiskManagementApproach] = useState<RiskManagementApproach>(() => {
    return preferences.riskManagementApproach === "critical_controls" ? "critical_controls" : "iper";
  });
  const [guidanceLevel, setGuidanceLevel] = useState<GuidanceLevel>(
    preferences.guidanceLevel || "high"
  );

  const [isSuccessScreen, setIsSuccessScreen] = useState(false);

  // Guardar progreso en cada paso
  useEffect(() => {
    updatePreferences({
      onboardingStep: step,
      organizationName: orgName,
      organizationSize: orgSize,
      organizationSector: orgSector,
      experienceLevel,
      riskManagementApproach,
      guidanceLevel,
    });
  }, [step, orgName, orgSize, orgSector, experienceLevel, riskManagementApproach, guidanceLevel, updatePreferences]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    } else if (step === TOTAL_STEPS) {
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
      organizationName: orgName.trim() || (currentUser?.orgId === "org_luis" ? "Mi Empresa SpA" : "Constructora y Servicios Santiago SpA"),
      organizationSize: orgSize,
      organizationSector: orgSector,
      experienceLevel,
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

  const progressPercentage = Math.round((step / TOTAL_STEPS) * 100);

  // Pantalla final de éxito
  if (isSuccessScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#EDF7F5] flex items-center justify-center p-4 sm:p-6 select-none font-[family-name:var(--font-poppins)] overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-lg w-full p-8 sm:p-10 shadow-xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-xs">
            <LuShieldCheck className="w-9 h-9" />
          </div>

          <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <LuSparkles className="w-3.5 h-3.5 text-teal-600" />
            Configuración general lista
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
            Todo listo
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            LifeOn ha configurado tu experiencia inicial de acuerdo con la información de tu organización.
          </p>

          <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left mb-6 text-xs text-gray-600 space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Organización:</span>
              <span className="font-semibold text-gray-800">{orgName || "No especificada"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Rubro:</span>
              <span className="font-semibold text-gray-800">{orgSector || "No especificado"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Dotación estimada:</span>
              <span className="font-semibold text-gray-800">{orgSize || "No especificada"}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Nivel de Conocimiento:</span>
              <span className="font-semibold text-gray-800">
                {experienceLevel === "expert"
                  ? "Conocimientos avanzados"
                  : experienceLevel === "intermediate"
                  ? "Conocimientos básicos o intermedios"
                  : "Sin conocimientos especializados"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
              <span className="text-gray-500">Enfoque de Gestión:</span>
              <span className="font-semibold text-teal-700">
                {riskManagementApproach === "critical_controls"
                  ? "Gestión de Controles Críticos (ICMM)"
                  : "Gestión de Riesgos IPER (Simple)"}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500">Nivel de Acompañamiento:</span>
              <span className="font-semibold text-teal-700">
                {guidanceLevel === "high"
                  ? "Guíame paso a paso"
                  : guidanceLevel === "contextual"
                  ? "Ayuda cuando la necesite"
                  : "Experiencia directa"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFinishAndEnter}
            className="w-full py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ir a LifeOn</span>
            <LuArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#EDF7F5] flex flex-col justify-between p-4 sm:p-8 font-[family-name:var(--font-poppins)] overflow-y-auto select-none">
      {/* Barra superior con progreso */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#F04438] leading-none">L</span>
          <span className="text-2xl font-black text-[#0D9488] leading-none">O</span>
          <span className="text-sm font-bold text-gray-700 ml-1">LifeOn</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-32 sm:w-48 bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Paso {step} de {TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Tarjeta Central del Wizard */}
      <div className="max-w-2xl w-full mx-auto my-auto bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-gray-100 flex flex-col justify-between min-h-[480px]">
        {/* PASO 1: Bienvenida */}
        {step === 1 && (
          <div className="flex flex-col flex-1 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6">
              <LuSparkles className="w-7 h-7" />
            </div>

            <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
              Gestión de Riesgos Laborales
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug mb-3">
              Bienvenido a LifeOn
            </h1>
            <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed mb-2">
              LifeOn te ayuda a organizar, simplificar y mejorar la Gestión de Riesgos Laborales de tu organización desde una sola plataforma.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-6">
              Centraliza información, facilita el cumplimiento de tus procesos preventivos y permite mantener una gestión más ordenada, trazable y fácil de administrar.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  <LuCheck className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-0.5">Gestión centralizada</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Organiza la información preventiva de tu empresa en un solo lugar.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  <LuCheck className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-0.5">Procesos más simples</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    LifeOn te guía para facilitar tareas que normalmente requieren múltiples documentos y herramientas.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  <LuCheck className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-0.5">Información actualizada</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Mantén matrices, información de riesgos, programas y evidencias disponibles y ordenadas.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
                  <LuCheck className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-0.5">Gestión adaptable</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    La plataforma se adapta al nivel de experiencia y necesidades de cada organización.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Datos Generales de la Empresa */}
        {step === 2 && (
          <div className="flex flex-col flex-1 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <LuBuilding2 className="w-7 h-7" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug mb-2">
              Información de tu Organización
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              Indica los datos de tu empresa para contextualizar las recomendaciones y procesos en LifeOn.
            </p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Nombre de la Organización o Razón Social
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Ej: Constructora del Pacífico SpA"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 placeholder-gray-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Sector Económico / Rubro Principal
                  </label>
                  <select
                    value={orgSector}
                    onChange={(e) => setOrgSector(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 cursor-pointer"
                  >
                    <option value="">Selecciona un rubro o sector...</option>
                    {SECTORS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Cantidad de Trabajadores
                  </label>
                  <select
                    value={orgSize}
                    onChange={(e) => setOrgSize(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 cursor-pointer"
                  >
                    <option value="">Selecciona la cantidad de trabajadores...</option>
                    {WORKER_RANGES.map((rng) => (
                      <option key={rng} value={rng}>
                        {rng}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Nivel de Conocimientos */}
        {step === 3 && (
          <div className="flex flex-col flex-1 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
              <LuGraduationCap className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug mb-2">
              ¿Cuál es tu nivel de conocimientos en Gestión de Riesgos Laborales?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              Selecciona una alternativa para que LifeOn adapte el lenguaje, las ayudas y el nivel de acompañamiento a tu experiencia.
            </p>

            <div className="flex flex-col gap-3">
              {/* Opción 1: Sin conocimientos especializados */}
              <button
                type="button"
                onClick={() => setExperienceLevel("guided")}
                className={clsx(
                  "p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                  experienceLevel === "guided"
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                    experienceLevel === "guided" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                  )}
                >
                  {experienceLevel === "guided" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Sin conocimientos especializados
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    LifeOn utilizará un lenguaje más simple, explicaciones claras y procesos guiados paso a paso.
                  </p>
                </div>
              </button>

              {/* Opción 2: Con conocimientos básicos o intermedios */}
              <button
                type="button"
                onClick={() => setExperienceLevel("intermediate")}
                className={clsx(
                  "p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                  experienceLevel === "intermediate"
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                    experienceLevel === "intermediate" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                  )}
                >
                  {experienceLevel === "intermediate" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Con conocimientos básicos o intermedios
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    LifeOn utilizará un equilibrio entre lenguaje simple, terminología técnica y ayuda contextual.
                  </p>
                </div>
              </button>

              {/* Opción 3: Con conocimientos avanzados */}
              <button
                type="button"
                onClick={() => setExperienceLevel("expert")}
                className={clsx(
                  "p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                  experienceLevel === "expert"
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                    experienceLevel === "expert" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                  )}
                >
                  {experienceLevel === "expert" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Con conocimientos avanzados
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    LifeOn utilizará terminología técnica y una experiencia más directa, reduciendo explicaciones básicas.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: Enfoque de Gestión de Riesgos */}
        {step === 4 && (
          <div className="flex flex-col flex-1 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6">
              <LuLayers className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug mb-2">
              ¿Qué enfoque de Gestión de Riesgos necesita tu organización?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              Define el alcance y la estructura metodológica con la que abordarás los riesgos en LifeOn.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opción 1: Gestión de Riesgos IPER */}
              <button
                type="button"
                onClick={() => setRiskManagementApproach("iper")}
                className={clsx(
                  "p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative",
                  riskManagementApproach === "iper"
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Simple
                    </span>
                    <div
                      className={clsx(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
                        riskManagementApproach === "iper" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                      )}
                    >
                      {riskManagementApproach === "iper" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                    Gestión de Riesgos IPER
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Gestiona los riesgos mediante una Matriz IPER, identificando tareas, peligros, riesgos, personas expuestas y medidas de control de una manera clara y estructurada.
                  </p>

                  <div className="pt-3 border-t border-gray-100/80">
                    <p className="text-[11px] font-semibold text-gray-700 mb-1.5">Ideal para organizaciones que:</p>
                    <ul className="text-[11px] text-gray-500 space-y-1">
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                        Buscan una gestión más simple y directa
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                        Necesitan desarrollar y mantener matrices IPER
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                        Están comenzando a estructurar su Gestión de Riesgos
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                        No necesitan todavía una gestión avanzada de controles críticos
                      </li>
                    </ul>
                  </div>
                </div>
              </button>

              {/* Opción 2: Gestión de Controles Críticos */}
              <button
                type="button"
                onClick={() => setRiskManagementApproach("critical_controls")}
                className={clsx(
                  "p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between relative",
                  riskManagementApproach === "critical_controls"
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Avanzado
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500">
                        Enfoque basado en ICMM
                      </span>
                    </div>
                    <div
                      className={clsx(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition",
                        riskManagementApproach === "critical_controls" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                      )}
                    >
                      {riskManagementApproach === "critical_controls" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 mb-1.5">
                    Gestión de Controles Críticos
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Permite profundizar en riesgos de alto potencial mediante causas, consecuencias, controles preventivos, controles mitigadores y controles críticos.
                  </p>

                  <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100 text-[10px] text-gray-600 mb-3 text-center">
                    <span className="font-semibold text-gray-700 block mb-1">Estructura conceptual:</span>
                    <span className="font-mono text-teal-700 font-bold">Causas &rarr; C. Preventivos &rarr; Evento &rarr; C. Mitigadores &rarr; Consecuencias</span>
                  </div>

                  <div className="pt-2 border-t border-gray-100/80">
                    <p className="text-[11px] font-semibold text-gray-700 mb-1.5">Incluye adicionalmente:</p>
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">Controles Críticos</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">Responsables</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">Estándares desempeño</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">Verificaciones</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">Efectividad</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PASO 5: Nivel de Acompañamiento en LifeOn */}
        {step === 5 && (
          <div className="flex flex-col flex-1 animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <LuCircleHelp className="w-7 h-7" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug mb-2">
              ¿Cuánta ayuda quieres recibir mientras utilizas LifeOn?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              Personaliza el nivel de asistencia, guías y avisos explicativos durante tu navegación.
            </p>

            <div className="flex flex-col gap-3">
              {/* Opción 1: Guíame paso a paso */}
              <button
                type="button"
                onClick={() => setGuidanceLevel("high")}
                className={clsx(
                  "p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                  guidanceLevel === "high"
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                    guidanceLevel === "high" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                  )}
                >
                  {guidanceLevel === "high" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Guíame paso a paso
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    LifeOn mostrará explicaciones, recomendaciones y ayudas durante los principales procesos.
                  </p>
                </div>
              </button>

              {/* Opción 2: Ayuda cuando la necesite */}
              <button
                type="button"
                onClick={() => setGuidanceLevel("contextual")}
                className={clsx(
                  "p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                  guidanceLevel === "contextual"
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                    guidanceLevel === "contextual" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                  )}
                >
                  {guidanceLevel === "contextual" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Ayuda cuando la necesite
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    LifeOn mostrará ayuda contextual solamente en los puntos más importantes.
                  </p>
                </div>
              </button>

              {/* Opción 3: Prefiero una experiencia directa */}
              <button
                type="button"
                onClick={() => setGuidanceLevel("minimal")}
                className={clsx(
                  "p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-4",
                  guidanceLevel === "minimal"
                    ? "border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 transition",
                    guidanceLevel === "minimal" ? "border-teal-600 bg-teal-600" : "border-gray-300"
                  )}
                >
                  {guidanceLevel === "minimal" && <LuCheck className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Prefiero una experiencia directa
                  </h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    LifeOn reducirá las explicaciones y priorizará una experiencia más rápida y compacta.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Botones de Navegación Inferiores */}
        <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LuArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>
              {step === 1 ? "Comenzar" : step === TOTAL_STEPS ? "Revisar y finalizar" : "Siguiente"}
            </span>
            <LuArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-center py-2">
        <span className="text-[11px] text-gray-400">
          LifeOn • Gestión de Riesgos Laborales
        </span>
      </div>
    </div>
  );
}

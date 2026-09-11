"use client";

import clsx from "clsx";
import {
  LuTable,
  LuShieldAlert,
  LuFileCheck,
  LuFolderTree,
  LuFileText,
  LuUsers,
} from "react-icons/lu";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { usePreventiveProgram } from "@/hooks/usePreventiveProgram";
import { useIperMatrices } from "@/hooks/useIperMatrices";

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  change: string;
  isPositive?: boolean;
  color: string;
  icon: React.ElementType;
  badge?: string;
  targetTab?: string;
}

interface DashboardKpisProps {
  onSelectMetric?: (tab: string) => void;
  activeWorkplace?: string;
}

export default function DashboardKpis({ onSelectMetric, activeWorkplace }: DashboardKpisProps) {
  const { preferences } = useLifeOnPreferences();
  const {
    workCenters,
    areas,
    totalProcessesCount,
    totalPositionsCount,
    totalUsersCount,
  } = useOrgStructure();

  const { metrics, activities } = usePreventiveProgram();
  const {
    totalMatricesCount,
    vigentesCount,
    borradoresCount,
    totalRisksCount,
    criticalRisksCount,
    cargosWithIrlCount,
    enRevisionCount,
  } = useIperMatrices(activeWorkplace);

  const isProgramConfigured =
    preferences.moduleConfigurations?.preventivePlanning?.configured && activities.length > 0;

  const kpis: KpiMetric[] = [
    {
      id: "iper",
      label: "Matrices IPER",
      value: totalMatricesCount === 0 ? "0" : `${totalMatricesCount}`,
      subtitle:
        totalMatricesCount === 0
          ? "Sin matrices aún"
          : `${vigentesCount} vigentes • ${enRevisionCount} en revisión • ${borradoresCount} borradores`,
      change:
        totalRisksCount === 0
          ? "Comienza en Matriz IPER"
          : `${totalRisksCount} riesgos identificados`,
      isPositive: totalMatricesCount > 0,
      color: "text-gray-900",
      icon: LuTable,
      targetTab: "iper",
    },
    {
      id: "criticos",
      label: "Riesgos Críticos",
      value: `${criticalRisksCount}`,
      subtitle:
        criticalRisksCount === 0
          ? "0 riesgos intolerables"
          : `${criticalRisksCount} riesgos intolerables`,
      change:
        totalRisksCount === 0
          ? "Sin evaluaciones aún"
          : `${totalRisksCount - criticalRisksCount} controlados / residuales`,
      isPositive: criticalRisksCount === 0,
      color: criticalRisksCount > 0 ? "text-amber-600" : "text-emerald-600",
      icon: LuShieldAlert,
      targetTab: "iper",
    },
    {
      id: "programa",
      label: "Programa Preventivo",
      value: isProgramConfigured ? `${metrics.compliancePercentage}%` : "Sin configurar",
      subtitle: isProgramConfigured
        ? `${metrics.completedActivities}/${metrics.totalActivities} actividades al día`
        : "Programa de Trabajo no configurado",
      change: isProgramConfigured
        ? `${metrics.inProgressActivities} en curso • ${metrics.pendingActivities} pendientes`
        : "Configurar programa",
      isPositive: isProgramConfigured,
      color: isProgramConfigured ? "text-[#10B981]" : "text-gray-500",
      icon: LuFileCheck,
      targetTab: "docs",
    },
    {
      id: "irl",
      label: "IRL por Cargo",
      value: `${cargosWithIrlCount}`,
      subtitle:
        cargosWithIrlCount === 0
          ? "Sin IRL disponibles"
          : `${cargosWithIrlCount} cargo(s) con IRL vigente`,
      change:
        cargosWithIrlCount > 0
          ? "Generado desde matrices vigentes"
          : "Requiere matrices vigentes",
      isPositive: cargosWithIrlCount > 0,
      color: cargosWithIrlCount > 0 ? "text-teal-700" : "text-gray-400",
      icon: LuFileText,
      targetTab: "iper",
    },
    {
      id: "org",
      label: "Estructura Organizacional",
      value: `${workCenters.length} ${workCenters.length === 1 ? "Centro" : "Centros"}`,
      subtitle: `${areas.length} áreas • ${totalProcessesCount} procesos`,
      change: `${totalPositionsCount} cargos • ${totalUsersCount} usuarios`,
      isPositive: true,
      color: "text-teal-800",
      icon: LuFolderTree,
      targetTab: "org",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <button
            key={kpi.id}
            type="button"
            onClick={() => kpi.targetTab && onSelectMetric?.(kpi.targetTab)}
            className="p-4 rounded-2xl bg-white border border-gray-100 hover:border-teal-300 transition-all hover:shadow-md cursor-pointer text-left flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500 group-hover:text-teal-700 transition">
                {kpi.label}
              </span>
              <div className="w-7 h-7 rounded-xl bg-gray-50 group-hover:bg-teal-50 flex items-center justify-center text-gray-400 group-hover:text-teal-600 transition">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={clsx("text-2xl font-extrabold tracking-tight", kpi.color)}>
                {kpi.value}
              </div>
              <p className="text-[11px] text-gray-500 font-medium mt-1 truncate">
                {kpi.subtitle}
              </p>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-50 flex items-center justify-between text-[10px]">
              <span className="text-gray-400 truncate">{kpi.change}</span>
              <span className="text-teal-600 font-semibold group-hover:underline">
                Ver &rarr;
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

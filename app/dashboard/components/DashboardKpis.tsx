"use client";

import clsx from "clsx";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { useIperMatrices } from "@/hooks/useIperMatrices";
import { useDashboardOverviewCounts } from "@/hooks/useDashboardOverviewCounts";

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  change: string;
  color: string;
  targetTab?: string;
}

interface DashboardKpisProps {
  onSelectMetric?: (tab: string) => void;
  activeWorkplace?: string;
}

export default function DashboardKpis({ onSelectMetric, activeWorkplace }: DashboardKpisProps) {
  const { preferences } = useLifeOnPreferences();
  const { counts } = useDashboardOverviewCounts();

  const {
    totalMatricesCount,
    vigentesCount,
    borradoresCount,
    totalRisksCount,
    criticalRisksCount,
    cargosWithIrlCount,
    enRevisionCount,
  } = useIperMatrices(activeWorkplace, []);

  const isProgramConfigured =
    preferences.moduleConfigurations?.preventivePlanning?.configured &&
    counts.preventiveTotal > 0;

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
      color: "text-grey-800",
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
      color: criticalRisksCount > 0 ? "text-red-error-600" : "text-green-600",
      targetTab: "iper",
    },
    {
      id: "programa",
      label: "Programa Preventivo",
      value: isProgramConfigured ? `${counts.compliancePercentage}%` : "—",
      subtitle: isProgramConfigured
        ? `${counts.preventiveCompleted}/${counts.preventiveTotal} actividades al día`
        : "Programa de Trabajo no configurado",
      change: isProgramConfigured
        ? `${counts.preventiveInProgress} en curso • ${counts.preventivePending} pendientes`
        : "Configurar programa",
      color: isProgramConfigured ? "text-green-600" : "text-yellow-600",
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
      color: cargosWithIrlCount > 0 ? "text-green-600" : "text-yellow-600",
      targetTab: "iper",
    },
    {
      id: "org",
      label: "Estructura Organizacional",
      value: `${counts.workCenters} ${counts.workCenters === 1 ? "Centro" : "Centros"}`,
      subtitle: `${counts.areas} áreas • ${counts.processes} procesos`,
      change: `${counts.positions} cargos • ${counts.members} usuarios`,
      color: "text-grey-800",
      targetTab: "org",
    },
  ];

  // Stat Card según Figma › Dashboard: etiqueta, valor H4 SemiBold y una línea de estado coloreada.
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, i) => (
        <button
          key={kpi.id}
          type="button"
          title={kpi.change}
          onClick={() => kpi.targetTab && onSelectMetric?.(kpi.targetTab)}
          className={clsx(
            "p-5 rounded-2xl bg-white border border-grey-300 text-left flex flex-col gap-2 cursor-pointer hover:border-grey-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 transition-colors",
            i === kpis.length - 1 && kpis.length % 2 === 1 && "col-span-2 lg:col-span-1"
          )}
        >
          <span className="text-sm text-grey-800 truncate">{kpi.label}</span>
          <span className="text-[32px] leading-[38px] font-semibold text-grey-950 tabular-nums">
            {kpi.value}
          </span>
          <span className={clsx("text-xs leading-5 line-clamp-2", kpi.color)}>{kpi.subtitle}</span>
        </button>
      ))}
    </div>
  );
}

"use client";

import clsx from "clsx";
import {
  LuTable,
  LuShieldAlert,
  LuFileCheck,
  LuAward,
  LuListTodo,
  LuTrendingUp,
  LuTrendingDown,
} from "react-icons/lu";

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
}

export default function DashboardKpis({ onSelectMetric }: DashboardKpisProps) {
  const kpis: KpiMetric[] = [
    {
      id: "iper",
      label: "Matrices IPER Activas",
      value: "12",
      subtitle: "100% actualizadas",
      change: "+2 nuevas faenas",
      isPositive: true,
      color: "text-gray-900",
      icon: LuTable,
      targetTab: "iper",
    },
    {
      id: "criticos",
      label: "Riesgos Críticos",
      value: "24",
      subtitle: "96% bajo control",
      change: "-18% residual",
      isPositive: true,
      color: "text-[#EAB308]",
      icon: LuShieldAlert,
      targetTab: "iper",
    },
    {
      id: "programa",
      label: "Planificación Preventiva",
      value: "94,2%",
      subtitle: "Doc. y auditoría al día",
      change: "+7,7% vs mes ant.",
      isPositive: true,
      color: "text-[#10B981]",
      icon: LuFileCheck,
      targetTab: "docs",
    },
    {
      id: "incidentes",
      label: "Accidentabilidad (Mes)",
      value: "0",
      subtitle: "Meta Cero Daño",
      change: "0 con tiempo perdido",
      isPositive: true,
      color: "text-emerald-600",
      icon: LuAward,
      targetTab: "docs",
    },
    {
      id: "acciones",
      label: "Acciones Correctivas",
      value: "3",
      subtitle: "En proceso activo",
      change: "1 por vencer pronto",
      isPositive: false,
      color: "text-[#EF4444]",
      icon: LuListTodo,
      targetTab: "docs",
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
            className="border border-gray-100/90 rounded-2xl p-4 sm:p-5 bg-white flex flex-col justify-between gap-1 shadow-2xs hover:shadow-md hover:border-teal-200 transition text-left cursor-pointer group relative overflow-hidden"
          >
            {/* Cabecera de la Tarjeta */}
            <div className="flex items-center justify-between w-full">
              <p className="text-xs font-medium text-gray-500 line-clamp-1 group-hover:text-teal-700 transition">
                {kpi.label}
              </p>
              <div className="w-6 h-6 rounded-lg bg-gray-50 group-hover:bg-teal-50 text-gray-400 group-hover:text-teal-600 flex items-center justify-center transition flex-shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Valor Principal */}
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 my-0.5 tracking-tight">
              {kpi.value}
            </p>

            {/* Subtítulo y Variación */}
            <div className="flex items-center justify-between text-[11px] font-medium tracking-tight mt-0.5">
              <span className={clsx(kpi.color, "flex items-center gap-0.5")}>
                {kpi.isPositive ? (
                  <LuTrendingUp className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <LuTrendingDown className="w-3 h-3 flex-shrink-0" />
                )}
                {kpi.change}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

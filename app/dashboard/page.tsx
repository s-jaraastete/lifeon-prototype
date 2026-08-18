"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  LuHouse,
  LuLayoutGrid,
  LuFileText,
  LuAtom,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuSearch,
  LuBell,
  LuCircleHelp,
  LuSlidersHorizontal,
  LuUserRound,
  LuTriangleAlert,
} from "react-icons/lu";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const kpis = [
    { label: "Lorem Ipsum", value: "0", change: "+7,7% vs mes anterior", color: "text-gray-700" },
    { label: "Lorem Ipsum", value: "0", change: "+7,7% vs mes anterior", color: "text-[#10B981]" },
    { label: "Lorem Ipsum", value: "0", change: "+7,7% vs mes anterior", color: "text-[#EAB308]" },
    { label: "Lorem Ipsum", value: "0", change: "+7,7% vs mes anterior", color: "text-[#EF4444]" },
    { label: "Lorem Ipsum", value: "0", change: "+7,7% vs mes anterior", color: "text-[#EF4444]" },
  ];

  return (
    <div className="w-full h-screen min-h-screen bg-[#EDF7F5] flex p-3 gap-3 overflow-hidden font-[family-name:var(--font-poppins)] select-none">
      {/* Sidebar Izquierdo */}
      <aside
        className={clsx(
          "bg-white rounded-2xl flex flex-col justify-between p-4 shadow-xs transition-all duration-300 flex-shrink-0 z-30",
          sidebarOpen ? "w-60" : "hidden lg:flex lg:w-20 items-center"
        )}
      >
        <div className="w-full flex flex-col">
          {/* Logo LifeOn */}
          <div className="flex items-center gap-1 px-2 pt-2 mb-8">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-[#F04438]">Life</span>
              <span className="text-2xl font-extrabold text-[#0D9488]">On</span>
            </Link>
          </div>

          {/* Menú de Navegación */}
          <nav className="flex flex-col gap-2 w-full">
            {/* Dashboard */}
            <button
              onClick={() => setActiveMenu("dashboard")}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer w-full text-left",
                activeMenu === "dashboard"
                  ? "text-[#F04438] bg-red-50/60"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <LuHouse className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Dashboard</span>}
            </button>

            {/* Matriz IPER */}
            <button
              onClick={() => setActiveMenu("iper")}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer w-full text-left",
                activeMenu === "iper"
                  ? "text-[#F04438] bg-red-50/60"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <LuLayoutGrid className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Matriz IPER</span>}
            </button>

            {/* Programa y Documentos */}
            <button
              onClick={() => setActiveMenu("docs")}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer w-full text-left",
                activeMenu === "docs"
                  ? "text-[#F04438] bg-red-50/60"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <LuFileText className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">Programa y Documen...</span>}
            </button>

            {/* APR Virtual */}
            <button
              onClick={() => setActiveMenu("apr")}
              className={clsx(
                "flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer w-full text-left",
                activeMenu === "apr"
                  ? "text-[#F04438] bg-red-50/60"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <LuAtom className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>APR Virtual</span>}
              </div>
              {sidebarOpen && (
                <span className="bg-[#DBEAFE] text-[#155DFC] text-[10px] font-bold px-1.5 py-0.5 rounded">
                  IA
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Sección Inferior del Sidebar */}
        <div className="w-full flex flex-col gap-2 pt-4">
          {sidebarOpen && (
            <div className="bg-[#F8FAFC] border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-800">Suscripción activa</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 pl-4">
                Próxima renovación: 01-01-2026
              </p>
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-1">
            {sidebarOpen ? "V.2.0.0" : "2.0"}
          </p>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <main className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* Barra Superior (Top Navigation) */}
        <header className="bg-white rounded-2xl p-2.5 px-4 flex items-center justify-between shadow-xs gap-3">
          {/* Lado Izquierdo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Alternar barra lateral"
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-xl transition cursor-pointer border border-gray-200"
            >
              {sidebarOpen ? (
                <LuPanelLeftClose className="w-4 h-4" />
              ) : (
                <LuPanelLeftOpen className="w-4 h-4" />
              )}
            </button>

            {/* Icono de Seguridad / Advertencia */}
            <div className="w-8 h-8 flex items-center justify-center text-amber-500 rounded-lg">
              <LuTriangleAlert className="w-5 h-5" />
            </div>
          </div>

          {/* Buscador Central */}
          <div className="relative flex-1 max-w-xl mx-2">
            <LuSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Busca en LifeOn..."
              className="w-full bg-[#F8FAFC] border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 placeholder-gray-400 transition"
            />
          </div>

          {/* Acciones del Lado Derecho */}
          <div className="flex items-center gap-2">
            {/* Botón APR Atom */}
            <button
              type="button"
              className="p-2 rounded-xl bg-[#E6F4F1] text-[#0D9488] hover:bg-[#D3EFEA] transition cursor-pointer"
            >
              <LuAtom className="w-4 h-4" />
            </button>

            {/* Notificaciones */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-50 border border-gray-100 transition cursor-pointer"
            >
              <LuBell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-[#F04438] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                1
              </span>
            </button>

            {/* Ayuda */}
            <button
              type="button"
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-50 border border-gray-100 transition cursor-pointer"
            >
              <LuCircleHelp className="w-4 h-4" />
            </button>

            {/* Ajustes / Filtros */}
            <button
              type="button"
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-50 border border-gray-100 transition cursor-pointer"
            >
              <LuSlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Avatar Usuario */}
            <div className="w-8 h-8 rounded-full bg-[#A855F7] text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-xs ml-1">
              <LuUserRound className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Tarjeta de Bienvenida y KPIs */}
        <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-6">
          {/* Encabezado con saludo */}
          <div className="flex items-start gap-4">
            <div className="relative text-3xl sm:text-4xl select-none flex-shrink-0 pt-0.5">
              <span className="inline-block transform -rotate-12">✋</span>
              {/* Líneas sutiles de saludo */}
              <span className="absolute -top-1 -left-1 text-red-400 text-xs font-bold select-none">
                ~
              </span>
              <span className="absolute -top-1 -right-1 text-red-400 text-xs font-bold select-none">
                ~
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                Hola de nuevo, Gonzalo
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Aquí tienes el resumen general y las actualizaciones de tu espacio de trabajo.
              </p>
            </div>
          </div>

          {/* Fila de 5 Tarjetas de Métricas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {kpis.map((kpi, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-2xl p-4 sm:p-5 bg-white flex flex-col justify-between gap-1 shadow-2xs hover:shadow-xs transition"
              >
                <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 my-0.5">{kpi.value}</p>
                <p className={clsx("text-[11px] font-medium tracking-tight", kpi.color)}>
                  {kpi.change}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Dos Paneles Principales Inferiores */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-[300px]">
          <div className="bg-white rounded-2xl p-6 shadow-xs flex-1 min-h-[260px] border border-gray-50" />
          <div className="bg-white rounded-2xl p-6 shadow-xs flex-1 min-h-[260px] border border-gray-50" />
        </section>
      </main>
    </div>
  );
}

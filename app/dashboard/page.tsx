"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  LuArrowRight,
  LuShieldAlert,
  LuSparkles,
  LuCircleCheck,
  LuFileCheck,
  LuTable,
  LuLayers,
} from "react-icons/lu";

import DashboardKpis from "./components/DashboardKpis";
import IperMatrixView from "./components/IperMatrixView";
import PreventiveDocsView from "./components/PreventiveDocsView";
import AprVirtualView from "./components/AprVirtualView";
import {
  NotificationsDropdown,
  AlertsDropdown,
  UserProfileDropdown,
  HelpModal,
  FilterWorkplaceModal,
  GlobalSearchDropdown,
  AccountModal,
  SettingsModal,
  SubscriptionUpgradeModal,
  NotificationItem,
} from "./components/TopBarModals";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Dynamic user data with priority on logged in session, falling back to Sergio A. Jara Astete
  const userDisplayName = session?.user?.name || "Sergio A. Jara Astete";
  const userFirstName = userDisplayName.split(" ")[0] || "Sergio";
  const userEmail = session?.user?.email || "sergio.jara@lifeon.cl";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<"dashboard" | "iper" | "docs" | "apr">("dashboard");
  const [activeWorkplace, setActiveWorkplace] = useState("Obra Central Santiago");

  // Top Bar Dropdown & Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      title: "Nueva actualización en Matriz IPER",
      desc: "Se registraron 2 nuevos controles para Montaje en Altura en Obra Central.",
      time: "Hace 15 min",
      read: false,
      type: "alert",
    },
    {
      id: "2",
      title: "Programa SST DS 44 Cumplido al 94%",
      desc: "Las inspecciones mensuales de andamios fueron aprobadas con éxito.",
      time: "Hace 2 horas",
      read: false,
      type: "success",
    },
    {
      id: "3",
      title: "Nuevo procedimiento PTS cargado",
      desc: "PTS-ALT-01 listo para descarga y difusión en faena.",
      time: "Ayer",
      read: true,
      type: "info",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    if (session) {
      await signOut({ redirect: false });
    }
    router.push("/login");
  };

  const closeAllDropdowns = () => {
    setIsNotificationsOpen(false);
    setIsAlertsOpen(false);
    setIsProfileOpen(false);
    setIsSearchDropdownOpen(false);
  };

  // Close dropdowns when clicking outside
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        closeAllDropdowns();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                  ? "text-[#F04438] bg-red-50/70 font-semibold"
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
                  ? "text-[#F04438] bg-red-50/70 font-semibold"
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
                  ? "text-[#F04438] bg-red-50/70 font-semibold"
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
                  ? "text-[#F04438] bg-red-50/70 font-semibold"
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
            <div
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-cyan-50/40 border border-emerald-200/80 rounded-xl p-3 cursor-pointer hover:shadow-md hover:border-emerald-400 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                  <span className="text-xs font-bold text-gray-800">Suscripción activa</span>
                </div>
                <span className="text-[9px] font-bold bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded group-hover:bg-emerald-600 group-hover:text-white transition">
                  Pro
                </span>
              </div>
              <p className="text-[11px] font-bold text-teal-900 mt-1">
                Plan Pro Enterprise
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Renovación: 01-01-2027
              </p>
              <div className="mt-2 pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[10px] font-bold text-emerald-700 group-hover:text-emerald-900">
                <span>Mejorar Plan / Add-ons</span>
                <span>&rarr;</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-1">
            {sidebarOpen ? "LifeOn SST V.2.0.0" : "2.0"}
          </p>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <main className="flex-1 flex flex-col gap-3 overflow-y-auto">
        {/* Barra Superior (Top Navigation) */}
        <header
          ref={headerRef}
          className="bg-white rounded-2xl p-2.5 px-4 flex items-center justify-between shadow-xs gap-3 relative z-40"
        >
          {/* Lado Izquierdo */}
          <div className="flex items-center gap-2 relative">
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
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsAlertsOpen(!isAlertsOpen);
                  setIsNotificationsOpen(false);
                  setIsProfileOpen(false);
                }}
                className="w-8 h-8 flex items-center justify-center text-amber-500 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                title="Alertas de Seguridad DS 44"
              >
                <LuTriangleAlert className="w-5 h-5" />
              </button>

              {isAlertsOpen && (
                <AlertsDropdown
                  onClose={() => setIsAlertsOpen(false)}
                  onNavigateTab={(tab) => {
                    setActiveMenu(tab as any);
                    setIsAlertsOpen(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* Buscador Central */}
          <div className="relative flex-1 max-w-xl mx-2">
            <LuSearch className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchDropdownOpen(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setIsSearchDropdownOpen(true);
              }}
              placeholder="Busca en matrices, documentos, APR..."
              className="w-full bg-[#F8FAFC] border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-gray-800 placeholder-gray-400 transition"
            />

            {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
              <GlobalSearchDropdown
                query={searchQuery}
                onClose={() => setIsSearchDropdownOpen(false)}
                onNavigateTab={(tab) => {
                  setActiveMenu(tab as any);
                  setIsSearchDropdownOpen(false);
                }}
              />
            )}
          </div>

          {/* Acciones del Lado Derecho */}
          <div className="flex items-center gap-2 relative">
            {/* Botón APR Atom */}
            <button
              type="button"
              onClick={() => setActiveMenu("apr")}
              className={clsx(
                "p-2 rounded-xl transition cursor-pointer",
                activeMenu === "apr"
                  ? "bg-teal-600 text-white"
                  : "bg-[#E6F4F1] text-[#0D9488] hover:bg-[#D3EFEA]"
              )}
              title="Abrir Asistente APR Virtual con IA"
            >
              <LuAtom className="w-4 h-4" />
            </button>

            {/* Notificaciones */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsAlertsOpen(false);
                  setIsProfileOpen(false);
                }}
                className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-50 border border-gray-100 transition cursor-pointer"
                title="Notificaciones"
              >
                <LuBell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#F04438] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <NotificationsDropdown
                  notifications={notifications}
                  onMarkAllAsRead={handleMarkAllNotificationsRead}
                  onClose={() => setIsNotificationsOpen(false)}
                  onNavigateTab={(tab) => {
                    setActiveMenu(tab as any);
                    setIsNotificationsOpen(false);
                  }}
                />
              )}
            </div>

            {/* Ayuda */}
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-50 border border-gray-100 transition cursor-pointer"
              title="Centro de Ayuda y Normativa DS 44"
            >
              <LuCircleHelp className="w-4 h-4" />
            </button>

            {/* Ajustes / Filtro de Sede */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-50 border border-gray-100 transition cursor-pointer"
              title={`Sede Activa: ${activeWorkplace}`}
            >
              <LuSlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Avatar Usuario / Perfil de Sergio */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                  setIsAlertsOpen(false);
                }}
                title={`Cuenta: ${userDisplayName}`}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs ml-1 hover:ring-2 hover:ring-purple-300 transition"
              >
                {userDisplayName
                  .split(" ")
                  .filter(Boolean)
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "SJ"}
              </button>

              {isProfileOpen && (
                <UserProfileDropdown
                  userDisplayName={userDisplayName}
                  userEmail={userEmail}
                  activeWorkplace={activeWorkplace}
                  onOpenAccountModal={() => setIsAccountModalOpen(true)}
                  onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
                  onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                  onLogout={handleLogout}
                  onClose={() => setIsProfileOpen(false)}
                />
              )}
            </div>
          </div>
        </header>

        {/* Renderizado Condicional de las Vistas según el Menú Activo */}
        {activeMenu === "dashboard" && (
          <div className="flex flex-col gap-3">
            {/* Tarjeta de Bienvenida y KPIs */}
            <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-6">
              {/* Encabezado con saludo dinámico */}
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative text-3xl sm:text-4xl select-none flex-shrink-0 pt-0.5">
                    <span className="inline-block transform -rotate-12">✋</span>
                    <span className="absolute -top-1 -left-1 text-red-400 text-xs font-bold select-none">
                      ~
                    </span>
                    <span className="absolute -top-1 -right-1 text-red-400 text-xs font-bold select-none">
                      ~
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                      Hola de nuevo, {userFirstName}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Aquí tienes el resumen general de gestión de riesgos y estado de cumplimiento en{" "}
                      <span className="font-semibold text-teal-700">{activeWorkplace}</span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveMenu("apr")}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 transition cursor-pointer border border-teal-200"
                  >
                    <LuSparkles className="w-4 h-4 text-teal-600" />
                    Generar APR con IA
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMenu("iper")}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition cursor-pointer shadow-xs"
                  >
                    <LuTable className="w-4 h-4" />
                    Nueva Matriz IPER
                  </button>
                </div>
              </div>

              {/* Fila de 5 Tarjetas de Métricas KPI */}
              <DashboardKpis onSelectMetric={(tab) => setActiveMenu(tab as any)} />
            </section>

            {/* Dos Paneles Principales Inferiores */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-[300px]">
              {/* Panel Izquierdo: Mapa de Calor y Estado de Riesgos IPER */}
              <div className="bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between border border-gray-50">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                        <LuShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Matriz de Riesgos y Procesos Críticos
                        </h3>
                        <p className="text-[11px] text-gray-400">Jerarquía de control según DS 44</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveMenu("iper")}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Ver Matriz <LuArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Barras de distribución de riesgo */}
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium">Distribución de Riesgos Evaluados</span>
                      <span className="text-gray-400 font-mono text-[11px]">24 Evaluaciones Totales</span>
                    </div>

                    <div className="w-full h-3 bg-gray-100 rounded-full flex overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: "45%" }} title="Bajo: 45%" />
                      <div className="bg-yellow-400 h-full" style={{ width: "30%" }} title="Medio: 30%" />
                      <div className="bg-amber-500 h-full" style={{ width: "20%" }} title="Alto: 20%" />
                      <div className="bg-red-500 h-full" style={{ width: "5%" }} title="Crítico: 5%" />
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-gray-600">Bajo (45%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-gray-600">Medio (30%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-gray-600">Alto (20%)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-gray-600">Crítico (5%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Procesos Principales */}
                  <div className="mt-4 flex flex-col gap-2">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">Montaje Estructural a &gt; 1.8m</p>
                        <p className="text-[11px] text-gray-500">Peligro: Caída de altura • SPDC Activo</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Controlado
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">Apertura de Zanjas &gt; 1.5m</p>
                        <p className="text-[11px] text-gray-500">Peligro: Derrumbe • Entibación NCh 349</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        Controlado
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">Intervención en Tableros TDF 380V</p>
                        <p className="text-[11px] text-gray-500">Peligro: Contacto eléctrico • Bloqueo LOTO</p>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        En Revisión
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                  <span>Actualizado hoy según DS 44</span>
                  <button
                    onClick={() => setActiveMenu("iper")}
                    className="text-teal-600 hover:underline font-medium cursor-pointer"
                  >
                    Administrar Matrices &rarr;
                  </button>
                </div>
              </div>

              {/* Panel Derecho: Programa Preventivo DS 44 & APR Virtual */}
              <div className="bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between border border-gray-50">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                        <LuFileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Programa Anual SST & Documentación
                        </h3>
                        <p className="text-[11px] text-gray-400">94,2% de cumplimiento al día</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveMenu("docs")}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Ver Todo <LuArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Banner Asistente APR Virtual */}
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border border-teal-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                        <LuAtom className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">
                          Asistente APR Virtual con IA
                        </h4>
                        <p className="text-[11px] text-gray-600 mt-0.5">
                          Genera análisis de riesgos inmediatos para tus cuadrillas en terreno.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveMenu("apr")}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer whitespace-nowrap"
                    >
                      Iniciar Asistente &rarr;
                    </button>
                  </div>

                  {/* Próximas Actividades Programadas */}
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-700">
                      Próximas Actividades del Programa 2026:
                    </p>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            Capacitación Práctica: Uso y Revisión de SPDC
                          </p>
                          <p className="text-[11px] text-gray-500">22 de Febrero • 28 trabajadores</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-700">En 4 días</span>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            Auditoría Interna de Cumplimiento DS 44
                          </p>
                          <p className="text-[11px] text-gray-500">15 de Marzo • Toda la Faena</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-700">Programada</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                  <span>Supervisado por: {userDisplayName}</span>
                  <button
                    onClick={() => setActiveMenu("docs")}
                    className="text-teal-600 hover:underline font-medium cursor-pointer"
                  >
                    Ver Biblioteca Documental &rarr;
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Vista: Matriz IPER */}
        {activeMenu === "iper" && (
          <IperMatrixView onOpenAprVirtual={() => setActiveMenu("apr")} />
        )}

        {/* Vista: Programa y Documentos */}
        {activeMenu === "docs" && <PreventiveDocsView />}

        {/* Vista: APR Virtual con IA */}
        {activeMenu === "apr" && <AprVirtualView />}
      </main>

      {/* Modales Globales */}
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      <FilterWorkplaceModal
        isOpen={isFilterModalOpen}
        activeWorkplace={activeWorkplace}
        setActiveWorkplace={setActiveWorkplace}
        onClose={() => setIsFilterModalOpen(false)}
      />
      <AccountModal
        isOpen={isAccountModalOpen}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        onClose={() => setIsAccountModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <SubscriptionUpgradeModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
    </div>
  );
}

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
  LuDatabase,
  LuFolderTree,
  LuBuilding2,
  LuChevronDown,
} from "react-icons/lu";

import DashboardKpis from "./components/DashboardKpis";
import IperMatrixView from "./components/IperMatrixView";
import PreventiveDocsView from "./components/PreventiveDocsView";
import AprVirtualView from "./components/AprVirtualView";
import OrgStructureView from "./components/OrgStructureView";
import InitialOnboardingWizard from "./components/onboarding/InitialOnboardingWizard";
import InteractivePlatformTour from "./components/onboarding/InteractivePlatformTour";
import SupabaseSyncModal from "./components/SupabaseSyncModal";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { logoutActiveUser, resetLuisGodoyAccount } from "@/lib/auth/authService";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
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
  ResetAccountConfirmModal,
} from "./components/TopBarModals";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { preferences, isLoaded, resetOnboarding, updatePreferences, currentUser } = useLifeOnPreferences();

  // Estado para el tutorial interactivo
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Iniciar automáticamente el tutorial cuando el onboarding acaba de ser completado
  useEffect(() => {
    if (isLoaded && preferences.onboardingCompleted && !preferences.tourCompleted) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, preferences.onboardingCompleted, preferences.tourCompleted]);

  const handleFinishTour = () => {
    setIsTourOpen(false);
    updatePreferences({ tourCompleted: true });
  };

  const handleCloseTour = () => {
    setIsTourOpen(false);
    updatePreferences({ tourCompleted: true });
  };

  // Dynamic user data with priority on active multi-tenant user or session
  const userDisplayName = currentUser?.name || session?.user?.name || "Sergio A. Jara Astete";
  const userFirstName = userDisplayName.split(" ")[0] || "Sergio";
  const userEmail = currentUser?.email || session?.user?.email || "sergio.jara@lifeon.cl";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<"dashboard" | "org" | "iper" | "docs" | "apr">("dashboard");

  const { workCenters } = useOrgStructure();
  const [activeWorkplace, setActiveWorkplace] = useState<string>("");

  useEffect(() => {
    if (workCenters.length === 0) {
      setActiveWorkplace("");
    } else if (workCenters.length === 1) {
      setActiveWorkplace(workCenters[0].name);
    } else {
      if (!activeWorkplace || (activeWorkplace !== "Todos los Centros de Trabajo" && !workCenters.some((wc) => wc.name === activeWorkplace))) {
        setActiveWorkplace("Todos los Centros de Trabajo");
      }
    }
  }, [workCenters, activeWorkplace]);

  // Top Bar Dropdown & Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

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
    logoutActiveUser();
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

  // Pantalla de carga mientras se recuperan preferencias de localStorage
  if (!isLoaded) {
    return (
      <div className="w-full h-screen min-h-screen bg-[#EDF7F5] flex items-center justify-center font-[family-name:var(--font-poppins)]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-teal-800">Cargando LifeOn...</span>
        </div>
      </div>
    );
  }

  // Si es la primera vez y el onboarding no ha sido completado, desplegar el asistente
  if (isLoaded && !preferences.onboardingCompleted) {
    return (
      <InitialOnboardingWizard
        userDefaultOrgName={activeWorkplace}
        onCompleted={() => {
          setIsTourOpen(true);
        }}
      />
    );
  }

  return (
    <div className="w-full h-screen min-h-screen bg-[#EDF7F5] flex p-3 gap-3 overflow-hidden font-[family-name:var(--font-poppins)] select-none">
      {/* Sidebar Izquierdo */}
      <aside
        id="tour-sidebar"
        className={clsx(
          "bg-white rounded-2xl flex flex-col justify-between p-4 shadow-xs transition-all duration-300 flex-shrink-0 z-30",
          sidebarOpen ? "w-60" : "hidden lg:flex lg:w-20 items-center"
        )}
      >
        <div className="w-full flex flex-col">
          {/* Logo LifeOn / LO (cambio automático al colapsar el sidebar) */}
          <div
            className={clsx(
              "flex items-center pt-2 mb-8 transition-all duration-200",
              sidebarOpen ? "px-2 justify-start" : "justify-center w-full"
            )}
          >
            <Link href="/" className="flex items-center select-none" title="LifeOn">
              {sidebarOpen ? (
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-[#F04438]">Life</span>
                  <span className="text-2xl font-extrabold text-[#0D9488]">On</span>
                </div>
              ) : (
                <div className="flex items-center justify-center tracking-tighter" title="LifeOn">
                  <span className="text-2xl font-black text-[#F04438] leading-none">L</span>
                  <span className="text-2xl font-black text-[#0D9488] leading-none">O</span>
                </div>
              )}
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

            {/* Estructura Organizacional */}
            <button
              onClick={() => setActiveMenu("org")}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer w-full text-left",
                activeMenu === "org"
                  ? "text-[#F04438] bg-red-50/70 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <LuFolderTree className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Estructura Organizacional</span>}
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

            {/* Programa de Trabajo Preventivo */}
            <button
              onClick={() => setActiveMenu("docs")}
              title="Programa de Trabajo en Gestión de Riesgos Laborales"
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer w-full text-left",
                activeMenu === "docs"
                  ? "text-[#F04438] bg-red-50/70 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <LuFileText className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">Programa Preventivo</span>}
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

            {/* Logo de la Organización (Solo Identidad Visual, sin acción al hacer clic) */}
            <div
              className="h-9 max-w-[140px] flex items-center justify-center px-2 py-1 rounded-xl bg-gray-50/80 border border-gray-200/80 overflow-hidden select-none"
              title={preferences.organizationName || "Organización"}
            >
              {preferences.organizationLogo ? (
                <img
                  src={preferences.organizationLogo}
                  alt={preferences.organizationName || "Logo Empresa"}
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />
              ) : (
                <div className="flex items-center gap-1.5 text-gray-500 text-[11px] font-bold">
                  <LuBuilding2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate max-w-[95px]">
                    {preferences.organizationName
                      ? preferences.organizationName.split(" ")[0]
                      : "Empresa"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Buscador Central */}
          <div id="tour-topbar-search" className="relative flex-1 max-w-xl mx-2">
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

            {/* Indicador de Estado de Base de Datos (Solo Ícono) */}
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={clsx(
                "relative w-8 h-8 flex items-center justify-center rounded-xl border transition cursor-pointer flex-shrink-0",
                isSupabaseConfigured()
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
              )}
              title={isSupabaseConfigured() ? "Base de datos conectada (Supabase)" : "Base de datos desconectada (Modo Local)"}
            >
              <LuDatabase className="w-4 h-4" />
              <span
                className={clsx(
                  "absolute top-1 right-1 w-2 h-2 rounded-full",
                  isSupabaseConfigured() ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                )}
              />
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

            {/* Selector Global de Centro de Trabajo */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                disabled={workCenters.length === 0}
                title={workCenters.length === 0 ? "Sin Centros de Trabajo registrados" : `Centro de Trabajo activo: ${activeWorkplace || "Todos los Centros de Trabajo"}`}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer max-w-[210px]",
                  workCenters.length === 0
                    ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#F0FDFA] border-teal-200/80 text-teal-900 hover:bg-teal-50 shadow-2xs"
                )}
              >
                <LuBuilding2 className={clsx("w-3.5 h-3.5 flex-shrink-0", workCenters.length === 0 ? "text-gray-400" : "text-teal-600")} />
                <span className="truncate">
                  {workCenters.length === 0
                    ? "Sin Centros de Trabajo"
                    : activeWorkplace || "Todos los Centros de Trabajo"}
                </span>
                {workCenters.length > 0 && <LuChevronDown className="w-3 h-3 text-teal-600 flex-shrink-0 ml-0.5" />}
              </button>
            </div>

            {/* Avatar Usuario / Perfil */}
            <div id="tour-user-profile" className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                  setIsAlertsOpen(false);
                }}
                title={`Cuenta: ${userDisplayName}`}
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs cursor-pointer shadow-xs ml-1 hover:ring-2 hover:ring-purple-300 transition flex-shrink-0 border border-teal-200"
              >
                {preferences.profilePhoto ? (
                  <img
                    src={preferences.profilePhoto}
                    alt={userDisplayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center">
                    {userDisplayName
                      .split(" ")
                      .filter(Boolean)
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "SJ"}
                  </div>
                )}
              </button>

              {isProfileOpen && (
                <UserProfileDropdown
                  userDisplayName={userDisplayName}
                  userEmail={userEmail}
                  activeWorkplace={activeWorkplace}
                  organizationName={preferences.organizationName}
                  profilePhoto={preferences.profilePhoto}
                  onOpenAccountModal={() => setIsAccountModalOpen(true)}
                  onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
                  onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
                  onOpenTour={() => setIsTourOpen(true)}
                  onResetTestAccount={() => setIsResetConfirmOpen(true)}
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                        Hola de nuevo, {userFirstName}
                      </h2>
                      {preferences.onboardingCompleted && (
                        <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <LuSparkles className="w-3 h-3 text-teal-600" />
                          {preferences.experienceLevel === "expert"
                            ? "Modo Especialista"
                            : preferences.experienceLevel === "intermediate"
                            ? "Modo Equilibrado"
                            : "Modo Guiado"}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {preferences.riskEvaluationMethod === "ds44"
                          ? "DS 44 / ISL"
                          : preferences.riskEvaluationMethod === "matrix5x5"
                          ? "Matriz 5×5"
                          : "IPER Pendiente"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Aquí tienes el resumen general de gestión de riesgos y estado de cumplimiento en{" "}
                      <span className="font-semibold text-teal-700">
                        {preferences.organizationName || activeWorkplace}
                      </span>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="tour-apr-quick"
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
              <div id="tour-kpis" className="w-full">
                <DashboardKpis onSelectMetric={(tab) => setActiveMenu(tab as any)} />
              </div>
            </section>

            {/* Dos Paneles Principales Inferiores */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-[300px]">
              {/* Panel Izquierdo: Mapa de Calor y Estado de Riesgos IPER */}
              <div id="tour-risk-map" className="bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between border border-gray-50">
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

                  {currentUser?.orgId === "org_luis" ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 my-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <LuShieldAlert className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Aún no hay información disponible</h4>
                      <p className="text-xs text-gray-500 max-w-sm mb-4">
                        Los datos aparecerán a medida que comiences a utilizar LifeOn y registres tus primeras matrices IPER.
                      </p>
                      <button
                        onClick={() => setActiveMenu("iper")}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <LuTable className="w-4 h-4" />
                        Ir a Matriz IPER
                      </button>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                  <span>{currentUser?.orgId === "org_luis" ? "0 matrices vigentes" : "Actualizado hoy según DS 44"}</span>
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
                        <p className="text-[11px] text-gray-400">
                          {currentUser?.orgId === "org_luis" ? "Planificación de Gestión de Riesgos" : "94,2% de cumplimiento al día"}
                        </p>
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

                  {currentUser?.orgId === "org_luis" ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 my-4">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                        <LuFileCheck className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Aún no hay información disponible</h4>
                      <p className="text-xs text-gray-500 max-w-sm mb-4">
                        Configura tu Programa de Trabajo para comenzar la planificación y seguimiento preventivo de tu organización.
                      </p>
                      <button
                        onClick={() => setActiveMenu("docs")}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <LuFileText className="w-4 h-4" />
                        Configurar Programa
                      </button>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400">
                  <span>Supervisado por: {userDisplayName}</span>
                  <button
                    onClick={() => setActiveMenu("docs")}
                    className="text-teal-600 hover:underline font-medium cursor-pointer"
                  >
                    Ver Programa Preventivo &rarr;
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Vista: Estructura Organizacional */}
        {activeMenu === "org" && <OrgStructureView />}

        {/* Vista: Matriz IPER */}
        {activeMenu === "iper" && (
          <IperMatrixView
            onOpenAprVirtual={() => setActiveMenu("apr")}
            onNavigateToOrg={() => setActiveMenu("org")}
          />
        )}

        {/* Vista: Programa y Documentos */}
        {activeMenu === "docs" && <PreventiveDocsView />}

        {/* Vista: APR Virtual con IA */}
        {activeMenu === "apr" && <AprVirtualView />}
      </main>

      {/* Modales Globales */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onOpenTour={() => setIsTourOpen(true)}
      />
      <FilterWorkplaceModal
        isOpen={isFilterModalOpen}
        activeWorkplace={activeWorkplace}
        setActiveWorkplace={setActiveWorkplace}
        workCenters={workCenters}
        onClose={() => setIsFilterModalOpen(false)}
      />
      <AccountModal
        isOpen={isAccountModalOpen}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        organizationName={preferences.organizationName}
        onClose={() => setIsAccountModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenOnboarding={() => {
          setIsSettingsModalOpen(false);
          resetOnboarding();
        }}
      />
      <SubscriptionUpgradeModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
      <ResetAccountConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          if (userEmail.toLowerCase().trim() === "luis.godoy@safetyclub.cl") {
            const ok = resetLuisGodoyAccount(userEmail);
            if (ok) {
              router.push("/login");
            }
          }
        }}
      />

      {/* Tutorial Interactivo con Efecto Spotlight */}
      <InteractivePlatformTour
        isOpen={isTourOpen}
        onClose={handleCloseTour}
        onFinish={handleFinishTour}
      />
    </div>
  );
}

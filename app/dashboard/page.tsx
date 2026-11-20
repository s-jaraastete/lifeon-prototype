"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import clsx from "clsx";
import {
  LuHouse,
  LuFileText,
  LuAtom,
  LuPanelLeftClose,
  LuPanelLeftOpen,
  LuMenu,
  LuSearch,
  LuBell,
  LuCircleHelp,
  LuSlidersHorizontal,
  LuUserRound,
  LuArrowRight,
  LuShieldAlert,
  LuFileCheck,
  LuTable,
  LuDatabase,
  LuFolderTree,
  LuFlame,
  LuBuilding2,
  LuLock,
  LuClipboardList,
  LuChartNoAxesColumnIncreasing,
  LuUsers,
} from "react-icons/lu";

import dynamic from "next/dynamic";
import { hasLifeOnAiSession } from "@/lib/auth/lifeonSessionClient";

import DashboardKpis from "./components/DashboardKpis";
import type { ArtpPrefillFromIper } from "./components/artp/ArtpHomeView";
import AprVirtualAssistant from "./components/AprVirtualAssistant";
import AprVirtualSessionPrompt from "./components/AprVirtualSessionPrompt";

const IperMatrixView = dynamic(() => import("./components/IperMatrixView"), {
  loading: () => (
    <div className="p-8 text-sm text-gray-500">Cargando Matriz IPER…</div>
  ),
});
const ArtpHomeView = dynamic(() => import("./components/artp/ArtpHomeView"), {
  loading: () => <div className="p-8 text-sm text-gray-500">Cargando ARTP…</div>,
});
const PreventiveDocsView = dynamic(() => import("./components/PreventiveDocsView"), {
  loading: () => (
    <div className="p-8 text-sm text-gray-500">Cargando planificación…</div>
  ),
});
const AprVirtualView = dynamic(() => import("./components/AprVirtualView"));
const OrgStructureView = dynamic(() => import("./components/OrgStructureView"), {
  loading: () => (
    <div className="p-8 text-sm text-gray-500">Cargando estructura…</div>
  ),
});
const UsersView = dynamic(() => import("./components/UsersView"));
const ProcessSafetyView = dynamic(() => import("./components/processSafety/ProcessSafetyView"));
const TechnicalDocsView = dynamic(() => import("./components/TechnicalDocsView"), {
  loading: () => (
    <div className="p-8 text-sm text-gray-500">Cargando documentación…</div>
  ),
});
import InitialOnboardingWizard from "./components/onboarding/InitialOnboardingWizard";
import InteractivePlatformTour from "./components/onboarding/InteractivePlatformTour";
import SupabaseSyncModal from "./components/SupabaseSyncModal";
import { useLifeOnPreferences } from "@/hooks/useLifeOnPreferences";
import { useOrgStructure } from "@/hooks/useOrgStructure";
import { useIperMatrices } from "@/hooks/useIperMatrices";
import { usePreventiveProgram } from "@/hooks/usePreventiveProgram";
import { logoutActiveUser, resetTestAccount, isResetAllowedForUser, getScopedStorageKey } from "@/lib/auth/authService";
import { signOutLifeOn } from "@/lib/auth/lifeonAuth";
import { queryClient } from "@/providers/ReactQueryProvider";
import { clearDashboardQueryCache } from "@/lib/dashboard/clearDashboardCaches";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  NotificationsDropdown,
  AlertsDropdown,
  UserProfileDropdown,
  GlobalSearchDropdown,
  HelpModal,
  FilterWorkplaceModal,
  AccountModal,
  SettingsModal,
  SubscriptionUpgradeModal,
  ResetAccountConfirmModal,
  NotificationItem,
} from "./components/TopBarModals";

import {
  type DashboardMenuKey,
  isTechnicalManagementMenu,
} from "@/types/dashboardNav";
import SetupGuide from "./components/onboarding/SetupGuide";
import SetupGuideCompanion from "./components/onboarding/SetupGuideCompanion";
import { useSetupGuideProgress } from "@/hooks/useSetupGuideProgress";
import type { SetupGuidePreferences } from "@/types/preferences";

type NavItemConfig = {
  key: DashboardMenuKey;
  label: string;
  title: string;
  icon: typeof LuHouse;
  showIaBadge?: boolean;
};

type NavSectionConfig = {
  id: string;
  title: string;
  items: NavItemConfig[];
};

// Orden y nombres según Figma "Plataforma LifeOn V2" › Sidebar.
const NAV_SECTIONS: NavSectionConfig[] = [
  {
    id: "tecnica",
    title: "",
    items: [
      { key: "dashboard", label: "Dashboard", title: "Dashboard", icon: LuHouse },
      { key: "iper", label: "Matriz IPER", title: "Matriz IPER", icon: LuTable },
      { key: "artp", label: "ARTP (Análisis de Riesgo)", title: "ARTP (Análisis de Riesgo)", icon: LuClipboardList },
      {
        key: "docs",
        label: "Planificación y Gestión Preventiva",
        title: "Planificación y Gestión Preventiva",
        icon: LuChartNoAxesColumnIncreasing,
      },
      { key: "techDocs", label: "Documentación Técnica", title: "Documentación Técnica", icon: LuFileText },
      { key: "processSafety", label: "Seguridad de Procesos", title: "Seguridad de Procesos", icon: LuFlame },
      { key: "apr", label: "APR Virtual", title: "APR Virtual", icon: LuAtom, showIaBadge: true },
    ],
  },
  {
    id: "config",
    title: "Configuración",
    items: [
      { key: "users", label: "Usuarios", title: "Usuarios", icon: LuUsers },
      { key: "org", label: "Estructura organizacional", title: "Estructura organizacional", icon: LuFolderTree },
    ],
  },
];

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

  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const {
    steps: setupGuideSteps,
    allComplete: setupGuideAllComplete,
    isProgressReady: setupGuideProgressReady,
  } = useSetupGuideProgress();
  const setupGuideDoneCount = setupGuideSteps.filter((s) => s.complete).length;

  const patchSetupGuide = (patch: Partial<SetupGuidePreferences>) => {
    const prev = preferences.setupGuide;
    updatePreferences({
      setupGuide: {
        completed: patch.completed ?? prev?.completed ?? false,
        dismissed: patch.dismissed ?? prev?.dismissed ?? false,
        completedAt: patch.completedAt !== undefined ? patch.completedAt : prev?.completedAt ?? null,
        technicalStartAcknowledged:
          patch.technicalStartAcknowledged ?? prev?.technicalStartAcknowledged ?? false,
        initialModalShown: patch.initialModalShown ?? prev?.initialModalShown ?? false,
        companionCollapsed: patch.companionCollapsed ?? prev?.companionCollapsed ?? false,
        userFinalized: patch.userFinalized ?? prev?.userFinalized ?? false,
      },
    });
  };

  const setupGuideActive =
    preferences.onboardingCompleted &&
    preferences.tourCompleted &&
    preferences.setupGuide?.userFinalized !== true;

  const technicalModulesLocked = setupGuideActive;

  const openSetupGuideModal = () => {
    setIsSetupGuideOpen(true);
    patchSetupGuide({ initialModalShown: true, companionCollapsed: false });
  };

  const tryOpenSetupGuideModalOnce = () => {
    if (!setupGuideActive) return;
    if (preferences.setupGuide?.initialModalShown) return;
    setTimeout(() => openSetupGuideModal(), 400);
  };

  // Reabrir guía solo si ya se finalizó pero vuelven a faltar pasos (datos ya cargados)
  useEffect(() => {
    if (!isLoaded || !setupGuideProgressReady) return;
    const sg = preferences.setupGuide;
    if (!sg?.userFinalized) return;
    if (setupGuideAllComplete) return;

    patchSetupGuide({
      userFinalized: false,
      completed: false,
      completedAt: null,
      companionCollapsed: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoaded,
    setupGuideProgressReady,
    setupGuideAllComplete,
    preferences.setupGuide?.userFinalized,
  ]);

  const handleFinishTour = () => {
    setIsTourOpen(false);
    updatePreferences({ tourCompleted: true });
    tryOpenSetupGuideModalOnce();
  };

  const handleCloseTour = () => {
    setIsTourOpen(false);
    updatePreferences({ tourCompleted: true });
    tryOpenSetupGuideModalOnce();
  };

  const handleMinimizeSetupGuide = () => {
    setIsSetupGuideOpen(false);
    patchSetupGuide({ companionCollapsed: false });
  };

  const handleCompleteSetupGuide = () => {
    setIsSetupGuideOpen(false);
    patchSetupGuide({
      completed: true,
      dismissed: false,
      completedAt: new Date().toISOString(),
      userFinalized: true,
      companionCollapsed: true,
    });
  };

  // Dynamic user data with priority on active multi-tenant user or session
  const userDisplayName = currentUser?.name || session?.user?.name || "Sergio A. Jara Astete";
  const userFirstName = userDisplayName.split(" ")[0] || "Sergio";
  const userEmail =
    session?.user?.email?.trim().toLowerCase() ||
    currentUser?.email?.trim().toLowerCase() ||
    "";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Bajo lg el menú es un panel superpuesto con su propio estado; arranca cerrado.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<DashboardMenuKey>("dashboard");
  const [artpPrefill, setArtpPrefill] = useState<ArtpPrefillFromIper | null>(null);
  const [aiSessionReady, setAiSessionReady] = useState<boolean | null>(null);

  useEffect(() => {
    void hasLifeOnAiSession().then(setAiSessionReady);
  }, []);

  const navigateToMenu = useCallback(
    (key: DashboardMenuKey) => {
      setMobileNavOpen(false);
      if (technicalModulesLocked && isTechnicalManagementMenu(key)) {
        openSetupGuideModal();
        return;
      }
      setActiveMenu(key);
    },
    [technicalModulesLocked]
  );

  useEffect(() => {
    if (!technicalModulesLocked) return;
    if (isTechnicalManagementMenu(activeMenu)) {
      setActiveMenu("dashboard");
    }
  }, [technicalModulesLocked, activeMenu]);

  const { workCenters } = useOrgStructure();
  const wpStorageKey = useMemo(
    () => getScopedStorageKey("lifeon_active_workplace", currentUser?.orgId),
    [currentUser?.orgId]
  );
  const [activeWorkplace, setActiveWorkplace] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(wpStorageKey);
      if (saved && (saved === "Todos los Centros de Trabajo" || workCenters.some((wc) => wc.name === saved))) {
        setActiveWorkplace(saved);
        return;
      }
    }

    if (workCenters.length === 0) {
      setActiveWorkplace("");
    } else if (workCenters.length === 1) {
      setActiveWorkplace(workCenters[0].name);
    } else {
      setActiveWorkplace("Todos los Centros de Trabajo");
    }
  }, [workCenters, wpStorageKey]);

  const handleSelectWorkplace = (wp: string) => {
    setActiveWorkplace(wp);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(wpStorageKey, wp);
    }
  };

  const {
    totalMatricesCount,
    vigentesCount,
    borradoresCount,
    enRevisionCount,
    totalRisksCount,
    riskDistribution,
    topEvaluatedRisks,
  } = useIperMatrices(activeWorkplace, workCenters);

  const { activities, metrics: programMetrics } = usePreventiveProgram();
  const isProgramConfigured =
    Boolean(preferences.moduleConfigurations?.preventivePlanning?.configured) ||
    activities.length > 0 ||
    programMetrics.totalActivities > 0;

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
    const orgId = currentUser?.orgId;
    clearDashboardQueryCache(queryClient);
    await signOutLifeOn();
    logoutActiveUser(orgId);
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
    <div className="w-full h-screen min-h-screen bg-[#EDF7F5] flex p-2 sm:p-3 gap-3 overflow-hidden font-[family-name:var(--font-poppins)]">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}
      {/* Sidebar Izquierdo */}
      <aside
        id="tour-sidebar"
        className={clsx(
          "bg-white rounded-2xl flex-col justify-between p-4 shadow-xs transition-[width] duration-200 flex-shrink-0",
          mobileNavOpen ? "flex fixed inset-y-2 left-2 z-50 w-64 overflow-y-auto" : "hidden",
          "lg:flex lg:static lg:z-30",
          sidebarOpen ? "lg:w-60" : "lg:w-20 lg:items-center"
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
                  <span className="text-2xl font-bold text-[#0D9488]">On</span>
                </div>
              ) : (
                <div className="flex items-center justify-center tracking-tighter" title="LifeOn">
                  <span className="text-2xl font-bold text-[#F04438] leading-none">L</span>
                  <span className="text-2xl font-bold text-[#0D9488] leading-none">O</span>
                </div>
              )}
            </Link>
          </div>

          {/* Menú de Navegación */}
          <nav className="flex flex-col w-full">
            {NAV_SECTIONS.map((section, sectionIdx) => (
              <div key={section.id} className={clsx(sectionIdx > 0 && (sidebarOpen ? "mt-6" : "mt-2"))}>
                {!section.title ? null : sidebarOpen ? (
                  <p className="text-xs font-normal uppercase text-grey-800 px-3 mb-2 flex items-center gap-1.5">
                    <span>{section.title}</span>
                    {section.id === "tecnica" && technicalModulesLocked && (
                      <LuLock className="w-3 h-3 text-amber-600" aria-hidden />
                    )}
                  </p>
                ) : (
                  sectionIdx > 0 && <div className="h-2 mx-2 border-t border-gray-200/80" aria-hidden />
                )}
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeMenu === item.key;
                    const isLocked =
                      technicalModulesLocked && isTechnicalManagementMenu(item.key);
                    const baseClass = clsx(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-base transition w-full text-left",
                      item.showIaBadge && sidebarOpen && "justify-between",
                      isLocked
                        ? "text-gray-500 cursor-pointer hover:bg-amber-50/60"
                        : "cursor-pointer",
                      !isLocked &&
                        (isActive
                          ? "text-red-500 font-medium"
                          : "text-grey-950 hover:bg-grey-100")
                    );
                    return (
                      <button
                        key={item.key}
                        id={item.key === "apr" ? "tour-apr-quick" : undefined}
                        aria-current={isActive ? "page" : undefined}
                        type="button"
                        title={
                          isLocked
                            ? "Completa la guía de primeros pasos para desbloquear"
                            : item.title
                        }
                        onClick={() => navigateToMenu(item.key)}
                        className={baseClass}
                      >
                        {item.showIaBadge ? (
                          <>
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              {sidebarOpen && <span className="truncate">{item.label}</span>}
                            </div>
                            {sidebarOpen && (
                              <span className="flex items-center gap-1 flex-shrink-0">
                                {isLocked && <LuLock className="w-3.5 h-3.5 text-amber-600" />}
                                <span className="bg-blue-100 text-blue-600 text-[10px] leading-[18px] font-medium px-1.5 rounded">
                                  IA
                                </span>
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span className="truncate">{item.label}</span>}
                            {sidebarOpen && isLocked && (
                              <LuLock className="w-3.5 h-3.5 text-amber-600 ml-auto flex-shrink-0" />
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {setupGuideActive && (
            <button
              type="button"
              onClick={openSetupGuideModal}
              title="Primeros pasos en LifeOn"
              className={clsx(
                "mt-4 w-full rounded-xl border border-amber-200/90 bg-amber-50/90 hover:bg-amber-100/90 transition cursor-pointer text-left",
                sidebarOpen ? "px-3 py-2.5" : "p-2 flex justify-center"
              )}
            >
              {sidebarOpen ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800/80">
                    Puesta en marcha
                  </p>
                  <p className="text-xs font-bold text-amber-950 mt-0.5">Primeros pasos</p>
                  <p className="text-[10px] text-amber-800 mt-1">
                    {setupGuideDoneCount}/{setupGuideSteps.length} completados
                  </p>
                </>
              ) : (
                <span className="text-[10px] font-bold text-amber-800">{setupGuideDoneCount}/{setupGuideSteps.length}</span>
              )}
            </button>
          )}
        </div>

        {/* Sección Inferior del Sidebar */}
        <div className="w-full flex flex-col gap-2 pt-4">
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="w-full text-left bg-grey-100 border border-grey-300 rounded-lg p-3 cursor-pointer hover:border-grey-500 transition"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" aria-hidden />
                <span className="text-xs leading-5 font-medium text-grey-950">Suscripción activa</span>
              </div>
              <p className="text-[10px] leading-[18px] text-grey-800 pl-4">
                Próxima renovación: 01-01-2027
              </p>
            </button>
          )}

          <p className="text-xs text-grey-800 text-center mt-4">
            {sidebarOpen ? "V.2.0.0" : "2.0"}
          </p>
        </div>
      </aside>

      {/* Contenedor Principal */}
      <main className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto pb-20">
        {aiSessionReady === false && (
          <AprVirtualSessionPrompt onReady={() => setAiSessionReady(true)} />
        )}
        {/* Barra Superior (Top Navigation) */}
        <header
          ref={headerRef}
          className="bg-white rounded-2xl p-2.5 sm:px-5 flex items-center justify-between shadow-[0_6px_16px_-4px_rgba(0,0,0,0.02)] gap-2 sm:gap-3 relative z-30"
        >
          {/* Lado Izquierdo */}
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => {
                if (window.matchMedia("(min-width: 1024px)").matches) setSidebarOpen(!sidebarOpen);
                else setMobileNavOpen(true);
              }}
              aria-label="Mostrar u ocultar menú"
              className="w-10 h-10 flex items-center justify-center text-grey-800 hover:bg-grey-100 rounded-lg transition cursor-pointer border border-grey-300"
            >
              <LuMenu className="w-4 h-4 lg:hidden" />
              {sidebarOpen ? (
                <LuPanelLeftClose className="w-4 h-4 hidden lg:block" />
              ) : (
                <LuPanelLeftOpen className="w-4 h-4 hidden lg:block" />
              )}
            </button>

            {/* Logo de la Organización (Solo Identidad Visual, sin acción al hacer clic) */}
            <div
              className="h-9 max-w-[140px] hidden md:flex items-center justify-center overflow-hidden select-none"
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
                  <span className="truncate max-w-[110px]">
                    {preferences.organizationName || "Empresa"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Buscador Central */}
          <div id="tour-topbar-search" className="relative flex-1 min-w-0 max-w-[390px] ml-auto">
            <LuSearch className="w-5 h-5 text-grey-800 absolute left-4 top-1/2 -translate-y-1/2" />
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
              placeholder="Busca en LifeOn…"
              aria-label="Buscar en LifeOn"
              className="w-full h-10 bg-white border border-grey-300 rounded-lg pl-11 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-grey-950 placeholder-grey-800 transition"
            />

            {isSearchDropdownOpen && searchQuery.trim().length > 0 && (
              <GlobalSearchDropdown
                query={searchQuery}
                onClose={() => setIsSearchDropdownOpen(false)}
                onNavigateTab={(tab: string) => {
                  navigateToMenu(tab as DashboardMenuKey);
                  setIsSearchDropdownOpen(false);
                }}
              />
            )}
          </div>

          {/* Acciones del Lado Derecho */}
          <div className="flex items-center gap-2 sm:gap-4 relative sm:ml-4">
            {/* APR Virtual: degradado IA/Primario (Azure/100 → Emerald/200) */}
            <button
              type="button"
              onClick={() => navigateToMenu("apr")}
              title="APR Virtual"
              aria-label="Abrir APR Virtual"
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-r from-azure-100 to-emerald-200 text-grey-950 hover:brightness-95 transition cursor-pointer flex-shrink-0"
            >
              <LuAtom className="w-5 h-5" />
            </button>

            {/* Indicador de Estado de Base de Datos (no está en Figma; se conserva por función) */}
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              aria-label={isSupabaseConfigured() ? "Base de datos conectada" : "Base de datos desconectada"}
              className={clsx(
                "relative w-10 h-10 hidden sm:flex items-center justify-center rounded-lg border border-grey-300 text-grey-800 hover:bg-grey-100 transition cursor-pointer flex-shrink-0"
              )}
              title={isSupabaseConfigured() ? "Base de datos conectada (Supabase)" : "Base de datos desconectada (Modo Local)"}
            >
              <LuDatabase className="w-4 h-4" />
              <span
                className={clsx(
                  "absolute top-1.5 right-1.5 w-2 h-2 rounded-full",
                  isSupabaseConfigured() ? "bg-green-500" : "bg-grey-500"
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
                className="relative w-10 h-10 flex items-center justify-center rounded-lg text-grey-800 hover:bg-grey-100 border border-grey-300 transition cursor-pointer"
                title="Notificaciones"
                aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : "Notificaciones"}
                aria-expanded={isNotificationsOpen}
              >
                <LuBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1.5 bg-red-500 text-white text-[10px] leading-none font-medium min-w-4 h-4 px-1 rounded-full flex items-center justify-center tabular-nums">
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
                    navigateToMenu(tab as DashboardMenuKey);
                    setIsNotificationsOpen(false);
                  }}
                />
              )}
            </div>

            {/* Ayuda */}
            <button
              type="button"
              onClick={() => setIsHelpModalOpen(true)}
              className="w-10 h-10 items-center justify-center rounded-lg text-grey-800 hover:bg-grey-100 border border-grey-300 transition cursor-pointer hidden sm:flex"
              title="Centro de Ayuda y Normativa DS 44"
              aria-label="Ayuda y normativa DS 44"
            >
              <LuCircleHelp className="w-5 h-5" />
            </button>

            {/* Filtro global de Centro de Trabajo (botón de filtros en Figma) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                disabled={workCenters.length === 0}
                title={workCenters.length === 0 ? "Sin Centros de Trabajo registrados" : `Centro de Trabajo: ${activeWorkplace || "Todos los Centros de Trabajo"}`}
                aria-label={workCenters.length === 0 ? "Sin centros de trabajo" : `Filtrar por centro de trabajo. Actual: ${activeWorkplace || "Todos"}`}
                className="relative w-10 h-10 flex items-center justify-center rounded-lg text-grey-800 hover:bg-grey-100 border border-grey-300 transition cursor-pointer disabled:text-grey-500 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <LuSlidersHorizontal className="w-5 h-5" />
                {activeWorkplace && activeWorkplace !== "Todos los Centros de Trabajo" && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-500" aria-hidden />
                )}
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
                aria-label={`Cuenta de ${userDisplayName}`}
                aria-expanded={isProfileOpen}
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-medium text-xs cursor-pointer hover:ring-2 hover:ring-lavender-300 transition flex-shrink-0"
              >
                {preferences.profilePhoto ? (
                  <img
                    src={preferences.profilePhoto}
                    alt={userDisplayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-lavender-600 text-lavender-300 flex items-end justify-center">
                    <LuUserRound className="w-6 h-6 translate-y-1" aria-hidden />
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
            <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.02)] flex flex-col gap-6 sm:gap-8">
              {/* Encabezado según Figma › Dashboard: ilustración + saludo + resumen */}
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ilustración local de 2.7 KB exportada de Figma */}
                  <img
                    src="/images/dashboard/hola.png"
                    alt=""
                    width={62}
                    height={62}
                    className="w-12 h-12 sm:w-[62px] sm:h-[62px] flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-[32px] sm:leading-[38px] font-semibold text-grey-950 text-balance">
                      Hola de nuevo, {userFirstName}
                    </h2>
                    <p className="text-sm sm:text-base text-grey-800 mt-0.5">
                      Aquí tienes el resumen general y las actualizaciones de tu espacio de trabajo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigateToMenu("iper")}
                  className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 active:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none transition cursor-pointer w-full sm:w-auto justify-center"
                >
                  <LuTable className="w-4 h-4" />
                  Nueva Matriz IPER
                </button>
              </div>

              {/* Fila de 5 Tarjetas de Métricas KPI */}
              <div id="tour-kpis" className="w-full">
                <DashboardKpis
                  onSelectMetric={(tab) => navigateToMenu(tab as DashboardMenuKey)}
                  activeWorkplace={activeWorkplace}
                />
              </div>
            </section>

            {/* Dos Paneles Principales Inferiores */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-[300px]">
              {/* Panel Izquierdo: Mapa de Calor y Estado de Riesgos IPER */}
              <div id="tour-risk-map" className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="min-w-0">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Riesgos y procesos críticos
                        </h3>
                        <p className="text-xs text-gray-500">
                          {activeWorkplace && activeWorkplace !== "Todos los Centros de Trabajo"
                            ? activeWorkplace
                            : "Jerarquía de control según DS 44"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateToMenu("iper")}
                      className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      Ver matrices <LuArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {totalMatricesCount === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 my-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <LuShieldAlert className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Aún no hay matrices registradas</h4>
                      <p className="text-xs text-gray-500 max-w-sm mb-4">
                        Los indicadores de riesgos aparecerán automáticamente a medida que registres o importes tus matrices IPER.
                      </p>
                      <button
                        onClick={() => navigateToMenu("iper")}
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
                          <span className="text-gray-500 tabular-nums text-xs">
                            {riskDistribution.total || totalRisksCount} evaluaciones
                          </span>
                        </div>

                        <div className="w-full h-3 bg-gray-100 rounded-full flex overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${riskDistribution.pctBajo}%` }}
                            title={`Bajo: ${riskDistribution.pctBajo}% (${riskDistribution.bajo})`}
                          />
                          <div
                            className="bg-yellow-400 h-full transition-all duration-300"
                            style={{ width: `${riskDistribution.pctMedio}%` }}
                            title={`Medio: ${riskDistribution.pctMedio}% (${riskDistribution.medio})`}
                          />
                          <div
                            className="bg-amber-500 h-full transition-all duration-300"
                            style={{ width: `${riskDistribution.pctAlto}%` }}
                            title={`Alto: ${riskDistribution.pctAlto}% (${riskDistribution.alto})`}
                          />
                          <div
                            className="bg-red-500 h-full transition-all duration-300"
                            style={{ width: `${riskDistribution.pctCritico}%` }}
                            title={`Crítico: ${riskDistribution.pctCritico}% (${riskDistribution.critico})`}
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-gray-600">Bajo ({riskDistribution.pctBajo}%)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            <span className="text-gray-600">Medio ({riskDistribution.pctMedio}%)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-gray-600">Alto ({riskDistribution.pctAlto}%)</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-gray-600">Crítico ({riskDistribution.pctCritico}%)</span>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Procesos y Riesgos Principales */}
                      <div className="mt-4 flex flex-col gap-2">
                        {topEvaluatedRisks.length > 0 ? (
                          topEvaluatedRisks.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-semibold text-gray-900 truncate">{item.task}</p>
                                <p className="text-[11px] text-gray-500 truncate">
                                  Peligro: {item.hazard}
                                </p>
                              </div>
                              <span
                                className={clsx(
                                  "text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0",
                                  item.level === "Crítico"
                                    ? "bg-red-100 text-red-800"
                                    : item.level === "Alto"
                                    ? "bg-amber-100 text-amber-800"
                                    : item.level === "Medio"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-emerald-100 text-emerald-800"
                                )}
                              >
                                {item.status || item.level}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-gray-100">
                            Sin evaluaciones de riesgos detalladas registradas en la matriz.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center text-xs text-gray-500">
                  <span>
                    {totalMatricesCount === 0
                      ? "0 matrices registradas"
                      : `${vigentesCount} ${vigentesCount === 1 ? "vigente" : "vigentes"} • ${enRevisionCount} en revisión • ${borradoresCount} ${borradoresCount === 1 ? "borrador" : "borradores"} (${totalMatricesCount} ${totalMatricesCount === 1 ? "total" : "totales"})`}
                  </span>
                  <button
                    onClick={() => navigateToMenu("iper")}
                    className="text-teal-700 hover:underline underline-offset-2 font-medium cursor-pointer"
                  >
                    Administrar matrices
                  </button>
                </div>
              </div>

              {/* Panel Derecho: Programa Preventivo DS 44 & APR Virtual */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="min-w-0">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Programa anual SST
                        </h3>
                        <p className="text-xs text-gray-500">
                          {isProgramConfigured
                            ? `${programMetrics.compliancePercentage}% de cumplimiento al día`
                            : "Planificación de Gestión de Riesgos"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigateToMenu("docs")}
                      className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      Ver programa <LuArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isProgramConfigured || activities.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 my-4">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                        <LuFileCheck className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">Programa de Trabajo no configurado</h4>
                      <p className="text-xs text-gray-500 max-w-sm mb-4">
                        Configura tu Programa de Trabajo para comenzar la planificación y seguimiento preventivo de tu organización.
                      </p>
                      <button
                        onClick={() => navigateToMenu("docs")}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <LuFileText className="w-4 h-4" />
                        Configurar Programa
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Próximas Actividades Programadas */}
                      <div className="mt-4 flex flex-col gap-2">
                        <p className="text-xs font-semibold text-gray-700">
                          Próximas actividades
                        </p>

                        {(() => {
                          const pending = activities.filter(
                            (a) => a.status === "En curso" || a.status === "Pendiente"
                          );
                          const list = (pending.length > 0 ? pending : activities).slice(0, 2);
                          if (list.length === 0) {
                            return (
                              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
                                No hay actividades pendientes.
                              </div>
                            );
                          }
                          return list.map((act) => (
                            <div
                              key={act.id}
                              className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <span
                                  className={clsx(
                                    "w-2 h-2 rounded-full flex-shrink-0",
                                    act.status === "Cumplida"
                                      ? "bg-emerald-500"
                                      : act.status === "En curso"
                                      ? "bg-amber-500"
                                      : act.status === "Atrasada"
                                      ? "bg-red-500"
                                      : "bg-teal-500"
                                  )}
                                />
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 truncate">{act.name}</p>
                                  <p className="text-[11px] text-gray-500 truncate">
                                    {act.endDate ? `Vence: ${act.endDate}` : "Sin fecha"} • {act.category}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={clsx(
                                  "text-[11px] font-semibold whitespace-nowrap flex-shrink-0",
                                  act.status === "Cumplida"
                                    ? "text-emerald-700"
                                    : act.status === "En curso"
                                    ? "text-amber-700"
                                    : act.status === "Atrasada"
                                    ? "text-red-700"
                                    : "text-teal-700"
                                )}
                              >
                                {act.status}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center text-xs text-gray-500">
                  <span>Supervisado por: {userDisplayName}</span>
                  <button
                    onClick={() => navigateToMenu("docs")}
                    className="text-teal-700 hover:underline underline-offset-2 font-medium cursor-pointer"
                  >
                    Ver planificación preventiva
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Vista: Usuarios */}
        {activeMenu === "users" && <UsersView />}

        {/* Vista: Estructura Organizacional */}
        {activeMenu === "org" && <OrgStructureView />}

        {/* Vista: Matriz IPER */}
        {activeMenu === "iper" && (
          <IperMatrixView
            onOpenAprVirtual={() => navigateToMenu("apr")}
            onNavigateToOrg={() => setActiveMenu("org")}
            onNavigateToArtp={(taskName, matrixId) => {
              setArtpPrefill({ taskName, matrixId });
              setActiveMenu("artp");
            }}
          />
        )}

        {activeMenu === "artp" && (
          <ArtpHomeView
            initialPrefill={artpPrefill}
            onClearPrefill={() => setArtpPrefill(null)}
          />
        )}

        {/* Vista: Planificación y Gestión Preventiva */}
        {activeMenu === "docs" && <PreventiveDocsView />}

        {/* Vista: APR Virtual con IA */}
        {activeMenu === "apr" && <AprVirtualView />}

        {/* Vista: Documentación Técnica */}
        {activeMenu === "techDocs" && <TechnicalDocsView />}

        {/* Vista: Seguridad de Procesos */}
        {activeMenu === "processSafety" && <ProcessSafetyView />}
      </main>

      {/* Modales Globales */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onOpenTour={() => setIsTourOpen(true)}
        onOpenSetupGuide={
          setupGuideActive
            ? () => {
                setIsHelpModalOpen(false);
                openSetupGuideModal();
              }
            : undefined
        }
      />
      <FilterWorkplaceModal
        isOpen={isFilterModalOpen}
        activeWorkplace={activeWorkplace}
        setActiveWorkplace={handleSelectWorkplace}
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
        onConfirm={async () => {
          if (!userEmail || !isResetAllowedForUser(userEmail)) {
            return { ok: false, error: "Restablecimiento no permitido para esta cuenta." };
          }
          const result = await resetTestAccount(userEmail);
          if (result.ok) {
            setTimeout(() => {
              setIsResetConfirmOpen(false);
              router.push("/login");
            }, 1400);
            return true;
          }
          return { ok: false, error: result.error };
        }}
      />

      {/* Tutorial Interactivo con Efecto Spotlight */}
      <InteractivePlatformTour
        isOpen={isTourOpen}
        onClose={handleCloseTour}
        onFinish={handleFinishTour}
      />

      {activeMenu !== "apr" && (
        <AprVirtualAssistant
          activeModule={activeMenu}
          companionVisible={
            setupGuideActive && !(preferences.setupGuide?.companionCollapsed ?? false)
          }
        />
      )}

      {setupGuideActive && (
        <SetupGuideCompanion
          collapsed={preferences.setupGuide?.companionCollapsed ?? false}
          onToggleCollapsed={(collapsed) => patchSetupGuide({ companionCollapsed: collapsed })}
          onOpenModal={openSetupGuideModal}
        />
      )}

      <SetupGuide
        isOpen={isSetupGuideOpen}
        onComplete={handleCompleteSetupGuide}
        onMinimize={handleMinimizeSetupGuide}
        onNavigate={navigateToMenu}
        onOpenAccount={() => setIsAccountModalOpen(true)}
      />
    </div>
  );
}

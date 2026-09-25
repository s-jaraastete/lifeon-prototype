"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  OrganizationPreferences,
  DEFAULT_ORGANIZATION_PREFERENCES,
  EMPTY_ORGANIZATION_PREFERENCES,
  DEFAULT_MODULE_CONFIGURATIONS,
  TerminologyDictionary,
  getTermLabels,
  IperMethodology,
} from "@/types/preferences";
import {
  fetchOrganization,
  fetchOrganizationPreferences,
  saveOrganizationPreferences,
  updateOrganization,
} from "@/lib/repositories/organizationRepository";
import { resolveOrganizationDisplayName } from "@/lib/organization/displayName";
import { fetchProfileByAuthId } from "@/lib/repositories/profileRepository";
import { getSupabaseAuthUserId } from "@/lib/auth/lifeonAuth";
import {
  getActiveUser,
  getScopedStorageKey,
  AuthUser,
  SESSION_CHANGE_EVENT,
} from "@/lib/auth/authService";
import { withMediaCacheBust } from "@/lib/media/cacheBust";
import {
  isStorageEvent,
  setLocalStorageJsonIfChanged,
  storageEventIsActiveSessionChange,
  storageEventMatchesKey,
} from "@/lib/dashboard/localStorageSync";
import { isSergioAutoSeedEnabled } from "@/lib/env/demoFlags";

export const PREFERENCES_STORAGE_KEY = "lifeon_org_preferences";

function mergeStoredPreferences(
  parsed: Record<string, unknown>,
  defaultPrefs: OrganizationPreferences
): OrganizationPreferences {
  const modules = (parsed.modules as OrganizationPreferences["modules"]) || {};
  const moduleConfigurations = parsed.moduleConfigurations as OrganizationPreferences["moduleConfigurations"];
  return {
    ...defaultPrefs,
    ...parsed,
    modules: {
      ...defaultPrefs.modules,
      ...modules,
    },
    moduleConfigurations: {
      miper: {
        ...defaultPrefs.moduleConfigurations?.miper,
        ...(moduleConfigurations?.miper || {}),
      },
      preventivePlanning: {
        ...defaultPrefs.moduleConfigurations?.preventivePlanning,
        ...(moduleConfigurations?.preventivePlanning || {}),
      },
    },
  } as OrganizationPreferences;
}

export interface LifeOnPreferencesContextType {
  preferences: OrganizationPreferences;
  isLoaded: boolean;
  currentUser: AuthUser;
  updatePreferences: (partial: Partial<OrganizationPreferences>) => void;
  setStep: (step: number) => void;
  completeOnboarding: (finalPrefs?: Partial<OrganizationPreferences>) => void;
  resetOnboarding: () => void;
  configureMiperModule: (methodology: IperMethodology) => void;
  configurePreventivePlanningModule: (hasExistingProgram: boolean, setupMode: "upload_existing" | "create_base") => void;
  terminology: TerminologyDictionary;
  isGuided: boolean;
  isIntermediate: boolean;
  isExpert: boolean;
  hasCriticalControls: boolean;
  isDs44: boolean;
}

export const LifeOnPreferencesContext = createContext<LifeOnPreferencesContextType | null>(null);

export default function LifeOnPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUser, setCurrentUser] = useState<AuthUser>(getActiveUser());
  const [preferences, setPreferences] = useState<OrganizationPreferences>(() => {
    const user = getActiveUser();
    return user.orgId === "org_demo" ? DEFAULT_ORGANIZATION_PREFERENCES : EMPTY_ORGANIZATION_PREFERENCES;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = useMemo(() => {
    return getScopedStorageKey(PREFERENCES_STORAGE_KEY, currentUser.orgId);
  }, [currentUser.orgId]);

  // Cargar estado desde localStorage y Supabase según la organización activa
  const loadPreferencesForUser = useCallback(async (user: AuthUser) => {
    setIsLoaded(false);
    setCurrentUser(user);
    const orgStorageKey = getScopedStorageKey(PREFERENCES_STORAGE_KEY, user.orgId);
    const defaultPrefs = user.orgId === "org_demo" ? DEFAULT_ORGANIZATION_PREFERENCES : EMPTY_ORGANIZATION_PREFERENCES;

    let basePrefs = defaultPrefs;
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(orgStorageKey) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        basePrefs = {
          ...defaultPrefs,
          ...parsed,
          modules: {
            ...defaultPrefs.modules,
            ...(parsed.modules || {}),
          },
          moduleConfigurations: {
            miper: {
              ...defaultPrefs.moduleConfigurations?.miper,
              ...(parsed.moduleConfigurations?.miper || {}),
            },
            preventivePlanning: {
              ...defaultPrefs.moduleConfigurations?.preventivePlanning,
              ...(parsed.moduleConfigurations?.preventivePlanning || {}),
            },
          },
        };
      }
    } catch (e) {
      console.warn("No se pudo cargar preferencias desde localStorage:", e);
    }

    // Establecer base temporal mientras concluye la llamada remota
    setPreferences(basePrefs);

    try {
      // Hidratar desde Supabase como fuente de verdad obligatoria
      const cloudPrefs = await fetchOrganizationPreferences(user.orgId);
      if (cloudPrefs) {
        const baseMiper = basePrefs.moduleConfigurations?.miper || defaultPrefs.moduleConfigurations?.miper || DEFAULT_MODULE_CONFIGURATIONS.miper;
        const basePrev = basePrefs.moduleConfigurations?.preventivePlanning || defaultPrefs.moduleConfigurations?.preventivePlanning || DEFAULT_MODULE_CONFIGURATIONS.preventivePlanning;
        const cloudMiper = cloudPrefs.moduleConfigurations?.miper;
        const cloudPrev = cloudPrefs.moduleConfigurations?.preventivePlanning;

        const merged: OrganizationPreferences = {
          ...basePrefs,
          ...cloudPrefs,
          onboardingCompleted: cloudPrefs.onboardingCompleted ?? basePrefs.onboardingCompleted,
          tourCompleted: cloudPrefs.tourCompleted ?? basePrefs.tourCompleted,
          setupGuide: {
            ...(defaultPrefs.setupGuide || EMPTY_ORGANIZATION_PREFERENCES.setupGuide!),
            ...basePrefs.setupGuide,
            ...(cloudPrefs.setupGuide || {}),
            userFinalized:
              cloudPrefs.setupGuide?.userFinalized ??
              basePrefs.setupGuide?.userFinalized ??
              false,
          },
          organizationLogo: null,
          profilePhoto: null,
          userPreventiveDocAcknowledgements:
            cloudPrefs.userPreventiveDocAcknowledgements ??
            basePrefs.userPreventiveDocAcknowledgements ??
            [],
          preventiveActivities: cloudPrefs.preventiveActivities ?? basePrefs.preventiveActivities,
          modules: {
            ...basePrefs.modules,
            ...(cloudPrefs.modules || {}),
          },
          moduleConfigurations: {
            miper: {
              ...baseMiper,
              ...(cloudMiper || {}),
              configured: cloudMiper?.configured ?? baseMiper.configured,
              methodology: cloudMiper?.methodology ?? baseMiper.methodology,
              confirmed: cloudMiper?.confirmed ?? baseMiper.confirmed,
            },
            preventivePlanning: {
              ...basePrev,
              ...(cloudPrev || {}),
              configured: cloudPrev?.configured ?? basePrev.configured,
              hasExistingProgram: cloudPrev?.hasExistingProgram ?? basePrev.hasExistingProgram,
              setupMode: cloudPrev?.setupMode ?? basePrev.setupMode,
            },
          },
        };

        let hydratedMedia = { ...merged };
        try {
          const authId = await getSupabaseAuthUserId();
          let avatarFromProfile: string | null = null;
          if (authId) {
            const profile = await fetchProfileByAuthId(authId);
            const avatar = profile?.avatar_path;
            if (avatar && avatar.startsWith("http")) {
              avatarFromProfile = withMediaCacheBust(avatar, profile.updated_at);
            }
          }
          hydratedMedia = {
            ...hydratedMedia,
            profilePhoto: avatarFromProfile,
          };

          const orgRow = await fetchOrganization(user.orgId);
          const canonicalOrgName = resolveOrganizationDisplayName(
            merged.organizationName,
            orgRow?.name
          );
          if (
            merged.organizationName?.trim() &&
            orgRow?.name?.trim() !== merged.organizationName.trim()
          ) {
            void updateOrganization(user.orgId, { name: merged.organizationName.trim() });
          } else if (!merged.organizationName?.trim() && orgRow?.name?.trim()) {
            hydratedMedia = { ...hydratedMedia, organizationName: canonicalOrgName };
          }
          const logo = orgRow?.logo_url || orgRow?.logo_path;
          if (logo && logo.startsWith("http")) {
            hydratedMedia = {
              ...hydratedMedia,
              organizationLogo: withMediaCacheBust(logo, orgRow?.logo_url ?? Date.now()),
            };
          } else {
            hydratedMedia = { ...hydratedMedia, organizationLogo: null, profilePhoto: avatarFromProfile };
          }
        } catch (mediaErr) {
          console.warn("No se pudo hidratar foto/logo desde Supabase:", mediaErr);
        }

        setPreferences(hydratedMedia);

        // Actualizar caché de localStorage para que coincida con Supabase
        if (typeof window !== "undefined") {
          setLocalStorageJsonIfChanged(orgStorageKey, hydratedMedia);
        }
      } else if (user.orgId === "org_sergio" && isSergioAutoSeedEnabled()) {
        // Auto-seed (opt-in): sembrar dataset de prueba solo si LIFEON_ALLOW_SERGIO_AUTO_SEED=true
        try {
          const { seedSergioConstructionDemo } = await import("@/lib/seeds/sergioConstructionDataset");
          await seedSergioConstructionDemo();
          // Reintentar la carga de preferencias recién sembradas
          const seededPrefs = await fetchOrganizationPreferences(user.orgId);
          if (seededPrefs) {
            setPreferences({
              ...defaultPrefs,
              ...seededPrefs,
              modules: { ...defaultPrefs.modules, ...(seededPrefs.modules || {}) },
              moduleConfigurations: {
                miper: {
                  ...DEFAULT_MODULE_CONFIGURATIONS.miper,
                  ...(seededPrefs.moduleConfigurations?.miper || {}),
                },
                preventivePlanning: {
                  ...DEFAULT_MODULE_CONFIGURATIONS.preventivePlanning,
                  ...(seededPrefs.moduleConfigurations?.preventivePlanning || {}),
                },
              },
            });
            if (typeof window !== "undefined") {
              setLocalStorageJsonIfChanged(orgStorageKey, seededPrefs);
            }
            // Notificar a otros módulos del cambio de datos
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("lifeon-org-structure-change", { detail: { orgId: user.orgId } }));
              window.dispatchEvent(new CustomEvent("lifeon-iper-matrices-change", { detail: { orgId: user.orgId } }));
              window.dispatchEvent(new CustomEvent("lifeon-preventive-program-change", { detail: { orgId: user.orgId } }));
            }
          }
        } catch (seedErr) {
          console.warn("Error auto-seeding Sergio dataset:", seedErr);
        }
      }
    } catch (err) {
      console.warn("Error hidratando preferencias desde Supabase:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Carga inicial y escucha activa ante cambios de sesión (Login / Logout / Reset)
  useEffect(() => {
    const user = getActiveUser();
    loadPreferencesForUser(user);

    const handleSessionChange = (e: Event) => {
      const sessionEvt = storageEventIsActiveSessionChange(e);
      if (sessionEvt) {
        if (!sessionEvt.newValue) {
          loadPreferencesForUser(getActiveUser());
          return;
        }
        try {
          const parsed = JSON.parse(sessionEvt.newValue) as AuthUser;
          if (parsed?.email) {
            loadPreferencesForUser(parsed);
          } else {
            loadPreferencesForUser(getActiveUser());
          }
        } catch {
          loadPreferencesForUser(getActiveUser());
        }
        return;
      }

      if (isStorageEvent(e)) {
        const user = getActiveUser();
        const orgKey = getScopedStorageKey(PREFERENCES_STORAGE_KEY, user.orgId);
        const prefsEvt = storageEventMatchesKey(e, orgKey);
        if (prefsEvt?.newValue) {
          const defaultPrefs =
            user.orgId === "org_demo" ? DEFAULT_ORGANIZATION_PREFERENCES : EMPTY_ORGANIZATION_PREFERENCES;
          try {
            const parsed = JSON.parse(prefsEvt.newValue) as Record<string, unknown>;
            setCurrentUser(user);
            setPreferences(mergeStoredPreferences(parsed, defaultPrefs));
          } catch {
            /* noop */
          }
        }
        return;
      }

      const custom = e as CustomEvent<AuthUser | null>;
      const newUser = custom.detail ?? getActiveUser();
      loadPreferencesForUser(newUser);
    };

    if (typeof window !== "undefined") {
      window.addEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
      window.addEventListener("storage", handleSessionChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(SESSION_CHANGE_EVENT, handleSessionChange);
        window.removeEventListener("storage", handleSessionChange);
      }
    };
  }, [loadPreferencesForUser]);

  // Guardar en localStorage y Supabase ante cada modificación
  const persistPreferences = useCallback((newPrefs: OrganizationPreferences) => {
    try {
      const orgKey = getScopedStorageKey(PREFERENCES_STORAGE_KEY, currentUser.orgId);
      if (typeof window !== "undefined") {
        setLocalStorageJsonIfChanged(orgKey, newPrefs);
      }
    } catch (e) {
      console.warn("No se pudo persistir preferencias en localStorage:", e);
    }

    void saveOrganizationPreferences(currentUser.orgId, newPrefs).then((ok) => {
      if (!ok) {
        console.warn("No se pudo sincronizar preferencias con Supabase");
      }
    });
  }, [currentUser.orgId]);

  const updatePreferences = useCallback(
    (partial: Partial<OrganizationPreferences>) => {
      setPreferences((prev) => {
        const next: OrganizationPreferences = {
          ...prev,
          ...partial,
          setupGuide: partial.setupGuide
            ? {
                ...(prev.setupGuide || EMPTY_ORGANIZATION_PREFERENCES.setupGuide!),
                ...partial.setupGuide,
              }
            : prev.setupGuide,
          modules: {
            ...prev.modules,
            ...(partial.modules || {}),
          },
          moduleConfigurations: {
            miper: {
              ...(prev.moduleConfigurations?.miper || DEFAULT_MODULE_CONFIGURATIONS.miper),
              ...(partial.moduleConfigurations?.miper || {}),
              configured:
                partial.moduleConfigurations?.miper?.configured ??
                prev.moduleConfigurations?.miper?.configured ??
                false,
            },
            preventivePlanning: {
              ...(prev.moduleConfigurations?.preventivePlanning || DEFAULT_MODULE_CONFIGURATIONS.preventivePlanning),
              ...(partial.moduleConfigurations?.preventivePlanning || {}),
              configured:
                partial.moduleConfigurations?.preventivePlanning?.configured ??
                prev.moduleConfigurations?.preventivePlanning?.configured ??
                false,
            },
          },
        };
        persistPreferences(next);
        return next;
      });
    },
    [persistPreferences]
  );

  const setStep = useCallback(
    (step: number) => {
      updatePreferences({ onboardingStep: step });
    },
    [updatePreferences]
  );

  const completeOnboarding = useCallback(
    (finalPrefs?: Partial<OrganizationPreferences>) => {
      setPreferences((prev) => {
        const next: OrganizationPreferences = {
          ...prev,
          ...(finalPrefs || {}),
          modules: {
            ...prev.modules,
            ...(finalPrefs?.modules || {}),
          },
          moduleConfigurations: {
            miper: {
              ...(prev.moduleConfigurations?.miper || DEFAULT_MODULE_CONFIGURATIONS.miper),
              ...(finalPrefs?.moduleConfigurations?.miper || {}),
              configured:
                finalPrefs?.moduleConfigurations?.miper?.configured ??
                prev.moduleConfigurations?.miper?.configured ??
                false,
            },
            preventivePlanning: {
              ...(prev.moduleConfigurations?.preventivePlanning || DEFAULT_MODULE_CONFIGURATIONS.preventivePlanning),
              ...(finalPrefs?.moduleConfigurations?.preventivePlanning || {}),
              configured:
                finalPrefs?.moduleConfigurations?.preventivePlanning?.configured ??
                prev.moduleConfigurations?.preventivePlanning?.configured ??
                false,
            },
          },
          onboardingCompleted: true,
          onboardingCompletedAt: new Date().toISOString(),
        };
        persistPreferences(next);
        return next;
      });
    },
    [persistPreferences]
  );

  const resetOnboarding = useCallback(() => {
    const basePrefs = currentUser.orgId !== "org_demo" ? EMPTY_ORGANIZATION_PREFERENCES : DEFAULT_ORGANIZATION_PREFERENCES;
    const next: OrganizationPreferences = {
      ...basePrefs,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingStep: 1,
    };
    setPreferences(next);
    persistPreferences(next);
  }, [currentUser.orgId, persistPreferences]);

  const configureMiperModule = useCallback(
    (methodology: IperMethodology) => {
      setPreferences((prev) => {
        const next: OrganizationPreferences = {
          ...prev,
          riskEvaluationMethod: methodology === "matrix5x5" ? "matrix5x5" : "ds44",
          moduleConfigurations: {
            miper: {
              configured: true,
              methodology,
              confirmed: true,
              configuredAt: new Date().toISOString(),
            },
            preventivePlanning: {
              configured: prev.moduleConfigurations?.preventivePlanning?.configured || false,
              hasExistingProgram: prev.moduleConfigurations?.preventivePlanning?.hasExistingProgram ?? null,
              setupMode: prev.moduleConfigurations?.preventivePlanning?.setupMode ?? null,
            },
          },
        };
        persistPreferences(next);
        return next;
      });
    },
    [persistPreferences]
  );

  const configurePreventivePlanningModule = useCallback(
    (hasExistingProgram: boolean, setupMode: "upload_existing" | "create_base") => {
      setPreferences((prev) => {
        const next: OrganizationPreferences = {
          ...prev,
          moduleConfigurations: {
            miper: {
              configured: prev.moduleConfigurations?.miper?.configured || false,
              methodology: prev.moduleConfigurations?.miper?.methodology || "pending",
              confirmed: prev.moduleConfigurations?.miper?.confirmed || false,
            },
            preventivePlanning: {
              configured: true,
              hasExistingProgram,
              setupMode,
              configuredAt: new Date().toISOString(),
            },
          },
        };
        persistPreferences(next);
        return next;
      });
    },
    [persistPreferences]
  );

  const terminology = useMemo(
    () => getTermLabels(preferences.experienceLevel),
    [preferences.experienceLevel]
  );

  const contextValue = useMemo(
    () => ({
      preferences,
      isLoaded,
      currentUser,
      updatePreferences,
      setStep,
      completeOnboarding,
      resetOnboarding,
      configureMiperModule,
      configurePreventivePlanningModule,
      terminology,
      isGuided: preferences.experienceLevel === "guided",
      isIntermediate: preferences.experienceLevel === "intermediate",
      isExpert: preferences.experienceLevel === "expert",
      hasCriticalControls: preferences.riskManagementApproach === "critical_controls",
      isDs44: preferences.riskEvaluationMethod === "ds44",
    }),
    [
      preferences,
      isLoaded,
      currentUser,
      updatePreferences,
      setStep,
      completeOnboarding,
      resetOnboarding,
      configureMiperModule,
      configurePreventivePlanningModule,
      terminology,
    ]
  );

  return (
    <LifeOnPreferencesContext.Provider value={contextValue}>
      {children}
    </LifeOnPreferencesContext.Provider>
  );
}

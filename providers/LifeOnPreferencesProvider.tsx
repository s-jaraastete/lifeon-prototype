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
  fetchPreferencesFromSupabase,
  savePreferencesToSupabase,
} from "@/lib/services/supabaseService";
import { getActiveUser, getScopedStorageKey, AuthUser, SESSION_CHANGE_EVENT } from "@/lib/auth/authService";

export const PREFERENCES_STORAGE_KEY = "lifeon_org_preferences";

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
      const cloudPrefs = await fetchPreferencesFromSupabase(user.orgId);
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
          organizationLogo: cloudPrefs.organizationLogo ?? basePrefs.organizationLogo ?? null,
          profilePhoto: cloudPrefs.profilePhoto ?? basePrefs.profilePhoto ?? null,
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

        setPreferences(merged);

        // Actualizar caché de localStorage para que coincida con Supabase
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(orgStorageKey, JSON.stringify(merged));
          } catch (_) {}
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

    const handleSessionChange = (e: any) => {
      const newUser = e?.detail || getActiveUser();
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
        window.localStorage.setItem(orgKey, JSON.stringify(newPrefs));
      }
    } catch (e) {
      console.warn("No se pudo persistir preferencias en localStorage:", e);
    }

    savePreferencesToSupabase(newPrefs, currentUser.orgId).catch((err) => {
      console.warn("No se pudo sincronizar preferencias con Supabase:", err);
    });
  }, [currentUser.orgId]);

  const updatePreferences = useCallback(
    (partial: Partial<OrganizationPreferences>) => {
      setPreferences((prev) => {
        const next: OrganizationPreferences = {
          ...prev,
          ...partial,
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
    const basePrefs = currentUser.orgId === "org_luis" ? EMPTY_ORGANIZATION_PREFERENCES : DEFAULT_ORGANIZATION_PREFERENCES;
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

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
import { getActiveUser, getScopedStorageKey, AuthUser } from "@/lib/auth/authService";

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
    return user.orgId === "org_luis" ? EMPTY_ORGANIZATION_PREFERENCES : DEFAULT_ORGANIZATION_PREFERENCES;
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = useMemo(() => {
    return getScopedStorageKey(PREFERENCES_STORAGE_KEY, currentUser.orgId);
  }, [currentUser.orgId]);

  // Cargar estado inicial desde localStorage según la organización activa
  useEffect(() => {
    const user = getActiveUser();
    setCurrentUser(user);
    const orgStorageKey = getScopedStorageKey(PREFERENCES_STORAGE_KEY, user.orgId);
    const defaultPrefs = user.orgId === "org_luis" ? EMPTY_ORGANIZATION_PREFERENCES : DEFAULT_ORGANIZATION_PREFERENCES;

    try {
      const stored = window.localStorage.getItem(orgStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({
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
        });
      } else {
        setPreferences(defaultPrefs);
      }

      // Si Supabase está disponible y es la org demo, hidratar en segundo plano
      if (user.orgId === "org_demo") {
        fetchPreferencesFromSupabase().then((cloudPrefs) => {
          if (cloudPrefs) {
            setPreferences((prev) => ({
              ...prev,
              ...cloudPrefs,
              modules: {
                ...prev.modules,
                ...(cloudPrefs.modules || {}),
              },
            }));
          }
        });
      }
    } catch (e) {
      console.warn("No se pudo cargar preferencias desde localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar en localStorage ante cada modificación
  const persistPreferences = useCallback((newPrefs: OrganizationPreferences) => {
    try {
      const orgKey = getScopedStorageKey(PREFERENCES_STORAGE_KEY, currentUser.orgId);
      window.localStorage.setItem(orgKey, JSON.stringify(newPrefs));
    } catch (e) {
      console.warn("No se pudo persistir preferencias en localStorage:", e);
    }

    if (currentUser.orgId === "org_demo") {
      savePreferencesToSupabase(newPrefs);
    }
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

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  OrganizationPreferences,
  DEFAULT_ORGANIZATION_PREFERENCES,
  TerminologyDictionary,
  getTermLabels,
} from "@/types/preferences";

export const PREFERENCES_STORAGE_KEY = "lifeon_org_preferences";

export interface LifeOnPreferencesContextType {
  preferences: OrganizationPreferences;
  isLoaded: boolean;
  updatePreferences: (partial: Partial<OrganizationPreferences>) => void;
  setStep: (step: number) => void;
  completeOnboarding: (finalPrefs?: Partial<OrganizationPreferences>) => void;
  resetOnboarding: () => void;
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
  const [preferences, setPreferences] = useState<OrganizationPreferences>(DEFAULT_ORGANIZATION_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar estado inicial desde localStorage de manera segura tras la hidratación
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences((prev) => ({
          ...prev,
          ...parsed,
          modules: {
            ...prev.modules,
            ...(parsed.modules || {}),
          },
        }));
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
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (e) {
      console.warn("No se pudo persistir preferencias en localStorage:", e);
    }
  }, []);

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
    const next: OrganizationPreferences = {
      ...DEFAULT_ORGANIZATION_PREFERENCES,
      onboardingCompleted: false,
      onboardingCompletedAt: null,
      onboardingStep: 1,
    };
    setPreferences(next);
    persistPreferences(next);
  }, [persistPreferences]);

  const terminology = useMemo(
    () => getTermLabels(preferences.experienceLevel),
    [preferences.experienceLevel]
  );

  const contextValue = useMemo(
    () => ({
      preferences,
      isLoaded,
      updatePreferences,
      setStep,
      completeOnboarding,
      resetOnboarding,
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
      updatePreferences,
      setStep,
      completeOnboarding,
      resetOnboarding,
      terminology,
    ]
  );

  return (
    <LifeOnPreferencesContext.Provider value={contextValue}>
      {children}
    </LifeOnPreferencesContext.Provider>
  );
}

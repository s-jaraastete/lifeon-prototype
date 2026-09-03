"use client";

import { useContext } from "react";
import {
  LifeOnPreferencesContext,
  LifeOnPreferencesContextType,
} from "@/providers/LifeOnPreferencesProvider";

export function useLifeOnPreferences(): LifeOnPreferencesContextType {
  const context = useContext(LifeOnPreferencesContext);
  if (!context) {
    throw new Error("useLifeOnPreferences debe utilizarse dentro de un LifeOnPreferencesProvider");
  }
  return context;
}

export default useLifeOnPreferences;

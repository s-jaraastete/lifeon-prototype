"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { OrgArea, OrgProcess, OrgSubprocess } from "@/types/orgStructure";
import { useLifeOnPreferences } from "./useLifeOnPreferences";
import { SECTOR_RISK_PROFILES } from "@/data/sectorRiskTemplates";
import {
  fetchOrgStructureFromSupabase,
  saveOrgStructureToSupabase,
} from "@/lib/services/supabaseService";

export const ORG_STRUCTURE_STORAGE_KEY = "lifeon_org_structure";

/**
 * Genera la estructura inicial por defecto agrupando los procesos recomendados
 * según el rubro de la organización.
 */
export function getDefaultOrgStructure(sectorName?: string): OrgArea[] {
  const profile = SECTOR_RISK_PROFILES[sectorName || "Construcción"] || SECTOR_RISK_PROFILES["Construcción"];
  
  const areaMap = new Map<string, OrgProcess[]>();

  if (profile && profile.recommendedProcesses) {
    profile.recommendedProcesses.forEach((recProc, idx) => {
      const areaKey = recProc.workArea || "Área Operativa Principal";
      if (!areaMap.has(areaKey)) {
        areaMap.set(areaKey, []);
      }
      areaMap.get(areaKey)!.push({
        id: `proc-init-${idx + 1}`,
        name: recProc.name,
        code: `PR-00${idx + 1}`,
        subprocesses: recProc.subprocesses.map((sub, sIdx) => ({
          id: `sub-init-${idx + 1}-${sIdx + 1}`,
          name: sub,
        })),
      });
    });
  }

  // Si no hay suficientes áreas, agregar áreas administrativas estándar
  if (!areaMap.has("Instalación de Faena y Bodegas")) {
    areaMap.set("Instalación de Faena y Bodegas", [
      {
        id: "proc-init-bodega",
        name: "Recepción, Almacenamiento y Despacho",
        code: "PR-BOD",
        subprocesses: [
          { id: "sub-b-1", name: "Descarga de camiones y estiba" },
          { id: "sub-b-2", name: "Manejo y acopio de sustancias peligrosas" },
          { id: "sub-b-3", name: "Entrega y control de EPP y herramientas" },
        ],
      },
    ]);
  }

  if (!areaMap.has("Talleres y Mantenimiento")) {
    areaMap.set("Talleres y Mantenimiento", [
      {
        id: "proc-init-talleres",
        name: "Mantenimiento Electromecánico y Reparaciones",
        code: "PR-MANT",
        subprocesses: [
          { id: "sub-t-1", name: "Bloqueo de energía y consignación LOTO" },
          { id: "sub-t-2", name: "Soldadura y oxicorte en banco" },
          { id: "sub-t-3", name: "Uso de herramientas de impacto y esmeriles" },
        ],
      },
    ]);
  }

  // Convertir mapa a lista final de áreas
  const result: OrgArea[] = [];
  let areaIdx = 1;
  areaMap.forEach((processes, areaName) => {
    result.push({
      id: `area-init-${areaIdx}`,
      name: areaName,
      code: `AR-00${areaIdx}`,
      description: `Área operativa con ${processes.length} procesos estándar cargados para ${sectorName || "el rubro seleccionado"}.`,
      workCenter: "Faena Principal",
      processes,
    });
    areaIdx++;
  });

  return result;
}

export function useOrgStructure() {
  const { preferences } = useLifeOnPreferences();
  const [areas, setAreas] = useState<OrgArea[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar desde localStorage o inicializar con base de rubro
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ORG_STRUCTURE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAreas(parsed);
          setIsLoaded(true);
        }
      } else {
        // Inicializar según rubro si no hay nada guardado
        const initial = getDefaultOrgStructure(preferences?.organizationSector);
        setAreas(initial);
        window.localStorage.setItem(ORG_STRUCTURE_STORAGE_KEY, JSON.stringify(initial));
      }

      // Si Supabase está disponible, sincronizar e hidratar desde la nube
      fetchOrgStructureFromSupabase().then((cloudAreas) => {
        if (cloudAreas && Array.isArray(cloudAreas) && cloudAreas.length > 0) {
          setAreas(cloudAreas);
          try {
            window.localStorage.setItem(ORG_STRUCTURE_STORAGE_KEY, JSON.stringify(cloudAreas));
          } catch {}
        }
      });
    } catch (e) {
      console.warn("No se pudo cargar la estructura organizacional de localStorage:", e);
      setAreas(getDefaultOrgStructure(preferences?.organizationSector));
    } finally {
      setIsLoaded(true);
    }
  }, [preferences?.organizationSector]);

  // Persistir en localStorage y en Supabase ante cualquier cambio
  const persistAreas = useCallback((newAreas: OrgArea[]) => {
    setAreas(newAreas);
    try {
      window.localStorage.setItem(ORG_STRUCTURE_STORAGE_KEY, JSON.stringify(newAreas));
    } catch (e) {
      console.warn("Error al guardar estructura organizacional en localStorage:", e);
    }

    // Guardar en Supabase en segundo plano sin bloquear UI
    saveOrgStructureToSupabase(newAreas);
  }, []);

  // CRUD Áreas
  const addArea = useCallback(
    (name: string, code?: string, description?: string, workCenter?: string) => {
      const newArea: OrgArea = {
        id: `area-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        code: code?.trim() || `AR-00${areas.length + 1}`,
        description: description?.trim(),
        workCenter: workCenter?.trim(),
        processes: [],
      };
      const updated = [...areas, newArea];
      persistAreas(updated);
      return newArea;
    },
    [areas, persistAreas]
  );

  const updateArea = useCallback(
    (areaId: string, updates: Partial<OrgArea>) => {
      const updated = areas.map((a) => (a.id === areaId ? { ...a, ...updates } : a));
      persistAreas(updated);
    },
    [areas, persistAreas]
  );

  const removeArea = useCallback(
    (areaId: string) => {
      const updated = areas.filter((a) => a.id !== areaId);
      persistAreas(updated);
    },
    [areas, persistAreas]
  );

  // CRUD Procesos
  const addProcess = useCallback(
    (areaId: string, name: string, code?: string, description?: string, subprocessesList?: string[]) => {
      const newProc: OrgProcess = {
        id: `proc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        code: code?.trim(),
        description: description?.trim(),
        subprocesses: (subprocessesList || []).map((sub, sIdx) => ({
          id: `sub-${Date.now()}-${sIdx}`,
          name: sub.trim(),
        })),
      };

      const updated = areas.map((a) => {
        if (a.id === areaId) {
          return {
            ...a,
            processes: [...a.processes, newProc],
          };
        }
        return a;
      });

      persistAreas(updated);
      return newProc;
    },
    [areas, persistAreas]
  );

  const updateProcess = useCallback(
    (areaId: string, processId: string, updates: Partial<OrgProcess>) => {
      const updated = areas.map((a) => {
        if (a.id === areaId) {
          return {
            ...a,
            processes: a.processes.map((p) => (p.id === processId ? { ...p, ...updates } : p)),
          };
        }
        return a;
      });
      persistAreas(updated);
    },
    [areas, persistAreas]
  );

  const removeProcess = useCallback(
    (areaId: string, processId: string) => {
      const updated = areas.map((a) => {
        if (a.id === areaId) {
          return {
            ...a,
            processes: a.processes.filter((p) => p.id !== processId),
          };
        }
        return a;
      });
      persistAreas(updated);
    },
    [areas, persistAreas]
  );

  // CRUD Subprocesos
  const addSubprocess = useCallback(
    (areaId: string, processId: string, subName: string) => {
      if (!subName.trim()) return;
      const newSub: OrgSubprocess = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: subName.trim(),
      };

      const updated = areas.map((a) => {
        if (a.id === areaId) {
          return {
            ...a,
            processes: a.processes.map((p) => {
              if (p.id === processId) {
                return {
                  ...p,
                  subprocesses: [...p.subprocesses, newSub],
                };
              }
              return p;
            }),
          };
        }
        return a;
      });
      persistAreas(updated);
    },
    [areas, persistAreas]
  );

  const removeSubprocess = useCallback(
    (areaId: string, processId: string, subId: string) => {
      const updated = areas.map((a) => {
        if (a.id === areaId) {
          return {
            ...a,
            processes: a.processes.map((p) => {
              if (p.id === processId) {
                return {
                  ...p,
                  subprocesses: p.subprocesses.filter((s) => s.id !== subId),
                };
              }
              return p;
            }),
          };
        }
        return a;
      });
      persistAreas(updated);
    },
    [areas, persistAreas]
  );

  // Recargar plantilla según rubro
  const loadSectorDefaults = useCallback(
    (sectorName?: string) => {
      const sec = sectorName || preferences?.organizationSector || "Construcción";
      const loaded = getDefaultOrgStructure(sec);
      persistAreas(loaded);
    },
    [preferences?.organizationSector, persistAreas]
  );

  // Métricas agregadas
  const totalAreasCount = areas.length;
  const totalProcessesCount = useMemo(
    () => areas.reduce((acc, a) => acc + (a.processes?.length || 0), 0),
    [areas]
  );
  const totalSubprocessesCount = useMemo(
    () =>
      areas.reduce(
        (acc, a) =>
          acc +
          (a.processes || []).reduce((pAcc, p) => pAcc + (p.subprocesses?.length || 0), 0),
        0
      ),
    [areas]
  );

  return {
    areas,
    isLoaded,
    addArea,
    updateArea,
    removeArea,
    addProcess,
    updateProcess,
    removeProcess,
    addSubprocess,
    removeSubprocess,
    loadSectorDefaults,
    totalAreasCount,
    totalProcessesCount,
    totalSubprocessesCount,
  };
}

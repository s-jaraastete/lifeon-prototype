"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  createThemedDataSheet,
  createThemedInstructionsSheet,
  normalizeImportedRows,
} from "@/lib/xlsx/lifeOnWorkbookTheme";
import {
  OrgWorkCenter,
  OrgArea,
  OrgProcess,
  OrgSubprocess,
  OrgPosition,
  OrgUser,
  OrgStructureData,
  ImportRow,
  ImportValidationReport,
  ImportErrorRecord,
  EntityStatus,
  UserRole,
  XlsxWorkCenterRow,
  XlsxAreaRow,
  XlsxProcessRow,
  XlsxSubprocessRow,
  XlsxPositionRow,
  XlsxUserRow,
  XlsxImportError,
  XlsxValidationReport,
} from "@/types/orgStructure";
import { useLifeOnPreferences } from "./useLifeOnPreferences";
import { SECTOR_RISK_PROFILES } from "@/data/sectorRiskTemplates";
import {
  fetchOrgStructureFromSupabase,
  saveOrgStructureToSupabase,
} from "@/lib/services/supabaseService";
import { getScopedStorageKey } from "@/lib/auth/authService";

export const ORG_STRUCTURE_STORAGE_KEY = "lifeon_org_structure";

export const DEMO_WORK_CENTERS: OrgWorkCenter[] = [
  {
    id: "wc-1",
    name: "Obra Edificio Santiago Centro",
    code: "CT-STGO-01",
    description: "Construcción de edificio residencial y oficinas 22 pisos",
    address: "Av. Libertador Bernardo O'Higgins 1420, Santiago",
    status: "Activo",
    createdAt: "2025-01-10",
  },
  {
    id: "wc-2",
    name: "Obra Hospital Regional Talca",
    code: "CT-TALCA-02",
    description: "Ampliación de pabellones quirúrgicos y urgencias",
    address: "1 Norte 1990, Talca, Región del Maule",
    status: "Activo",
    createdAt: "2025-02-01",
  },
  {
    id: "wc-3",
    name: "Planta Industrial Antofagasta",
    code: "CT-ANTOF-03",
    description: "Mantenimiento y operaciones de faena minera / maestranza",
    address: "Ruta 28 km 12, Antofagasta",
    status: "Activo",
    createdAt: "2025-02-15",
  },
];

export const DEMO_POSITIONS: OrgPosition[] = [
  {
    id: "pos-1",
    name: "Jefe de Terreno / Administrador de Obra",
    code: "CARG-001",
    status: "Activo",
    totalStaff: 4,
    menCount: 3,
    womenCount: 1,
    otherCount: 0,
    disabledCount: 0,
    sensitiveCount: 0,
    specialConditionsNote: "",
  },
  {
    id: "pos-2",
    name: "Experto en Prevención de Riesgos",
    code: "CARG-002",
    status: "Activo",
    totalStaff: 3,
    menCount: 2,
    womenCount: 1,
    otherCount: 0,
    disabledCount: 0,
    sensitiveCount: 0,
    specialConditionsNote: "",
  },
  {
    id: "pos-3",
    name: "Supervisor de Operaciones y Montaje",
    code: "CARG-003",
    status: "Activo",
    totalStaff: 8,
    menCount: 7,
    womenCount: 1,
    otherCount: 0,
    disabledCount: 1,
    sensitiveCount: 0,
    specialConditionsNote: "1 trabajador con hipoacusia leve en monitoreo anual",
  },
  {
    id: "pos-4",
    name: "Maestro Mayor Albañil / Demoledor",
    code: "CARG-004",
    status: "Activo",
    totalStaff: 25,
    menCount: 23,
    womenCount: 2,
    otherCount: 0,
    disabledCount: 0,
    sensitiveCount: 2,
    specialConditionsNote: "2 trabajadores mayores con limitación de carga manual",
  },
  {
    id: "pos-5",
    name: "Operador de Maquinaria y Equipos",
    code: "CARG-005",
    status: "Activo",
    totalStaff: 12,
    menCount: 11,
    womenCount: 1,
    otherCount: 0,
    disabledCount: 0,
    sensitiveCount: 1,
    specialConditionsNote: "1 operador hipertenso compensado",
  },
  {
    id: "pos-6",
    name: "Encargado de Bodega y Pañol",
    code: "CARG-006",
    status: "Activo",
    totalStaff: 6,
    menCount: 4,
    womenCount: 2,
    otherCount: 0,
    disabledCount: 1,
    sensitiveCount: 0,
    specialConditionsNote: "1 trabajador con movilidad motriz reducida adaptada",
  },
];

export const DEMO_USERS: OrgUser[] = [
  {
    id: "usr-sergio",
    name: "Sergio A. Jara Astete",
    email: "sergio.jara@lifeon.cl",
    cargoId: "pos-2",
    cargoName: "Experto en Prevención de Riesgos",
    areaName: "Gestión de Riesgos Laborales",
    role: "Administrador",
    status: "Activo",
  },
  {
    id: "usr-carlos",
    name: "Carlos Mendoza Riquelme",
    email: "carlos.mendoza@constructora.cl",
    cargoId: "pos-1",
    cargoName: "Jefe de Terreno / Administrador de Obra",
    areaName: "Instalación de Faena y Bodegas",
    role: "Editor",
    status: "Activo",
  },
  {
    id: "usr-patricio",
    name: "Patricio Gómez Valenzuela",
    email: "patricio.gomez@constructora.cl",
    cargoId: "pos-3",
    cargoName: "Supervisor de Operaciones y Montaje",
    areaName: "Talleres y Mantenimiento",
    role: "Lector",
    status: "Activo",
  },
];

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
        status: "Activo",
        subprocesses: recProc.subprocesses.map((sub, sIdx) => ({
          id: `sub-init-${idx + 1}-${sIdx + 1}`,
          name: sub,
          status: "Activo",
        })),
      });
    });
  }

  if (!areaMap.has("Instalación de Faena y Bodegas")) {
    areaMap.set("Instalación de Faena y Bodegas", [
      {
        id: "proc-init-bodega",
        name: "Recepción, Almacenamiento y Despacho",
        code: "PR-BOD",
        status: "Activo",
        subprocesses: [
          { id: "sub-b-1", name: "Descarga de camiones y estiba", status: "Activo" },
          { id: "sub-b-2", name: "Manejo y acopio de sustancias peligrosas", status: "Activo" },
          { id: "sub-b-3", name: "Entrega y control de EPP y herramientas", status: "Activo" },
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
        status: "Activo",
        subprocesses: [
          { id: "sub-t-1", name: "Bloqueo de energía y consignación LOTO", status: "Activo" },
          { id: "sub-t-2", name: "Soldadura y oxicorte en banco", status: "Activo" },
          { id: "sub-t-3", name: "Uso de herramientas de impacto y esmeriles", status: "Activo" },
        ],
      },
    ]);
  }

  const result: OrgArea[] = [];
  let areaIdx = 1;
  areaMap.forEach((processes, areaName) => {
    result.push({
      id: `area-init-${areaIdx}`,
      name: areaName,
      code: `AR-00${areaIdx}`,
      status: "Activo",
      description: `Área operativa con ${processes.length} procesos estándar cargados para ${sectorName || "el rubro seleccionado"}.`,
      workCenter: "Faena Principal",
      processes,
    });
    areaIdx++;
  });

  return result;
}

export function useOrgStructure() {
  const { preferences, currentUser } = useLifeOnPreferences();
  const [workCenters, setWorkCenters] = useState<OrgWorkCenter[]>([]);
  const [areas, setAreas] = useState<OrgArea[]>([]);
  const [positions, setPositions] = useState<OrgPosition[]>([]);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const orgId = currentUser?.orgId || "org_demo";
  const storageKey = useMemo(() => getScopedStorageKey(ORG_STRUCTURE_STORAGE_KEY, orgId), [orgId]);

  // Cargar estado inicial según organización
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          // Soportar tanto formato plano (array de áreas) como formato compuesto (OrgStructureData)
          if (Array.isArray(parsed)) {
            setWorkCenters(orgId === "org_luis" ? [] : DEMO_WORK_CENTERS);
            setAreas(parsed);
            setPositions(orgId === "org_luis" ? [] : DEMO_POSITIONS);
            setUsers(orgId === "org_luis" ? [] : DEMO_USERS);
          } else {
            setWorkCenters(parsed.workCenters || (orgId === "org_luis" ? [] : DEMO_WORK_CENTERS));
            setAreas(parsed.areas || []);
            setPositions(parsed.positions || (orgId === "org_luis" ? [] : DEMO_POSITIONS));
            setUsers(parsed.users || (orgId === "org_luis" ? [] : DEMO_USERS));
          }
          setIsLoaded(true);
          return;
        }
      }

      // Si no existe almacenamiento previo:
      if (orgId === "org_luis") {
        // Cuenta de Luis Godoy: completamente vacía
        setWorkCenters([]);
        setAreas([]);
        setPositions([]);
        setUsers([
          {
            id: "usr-luis",
            name: "Luis Godoy",
            email: "luis.godoy@safetyclub.cl",
            role: "Administrador",
            status: "Activo",
          },
        ]);
      } else {
        // Cuenta demo: inicializar con datos demo precargados
        const initAreas = getDefaultOrgStructure(preferences?.organizationSector);
        setWorkCenters(DEMO_WORK_CENTERS);
        setAreas(initAreas);
        setPositions(DEMO_POSITIONS);
        setUsers(DEMO_USERS);
        const demoData: OrgStructureData = {
          workCenters: DEMO_WORK_CENTERS,
          areas: initAreas,
          positions: DEMO_POSITIONS,
          users: DEMO_USERS,
        };
        window.localStorage.setItem(storageKey, JSON.stringify(demoData));
      }

      // Si es cuenta demo y Supabase está disponible, hidratar
      if (orgId === "org_demo") {
        fetchOrgStructureFromSupabase().then((cloudAreas) => {
          if (cloudAreas && Array.isArray(cloudAreas) && cloudAreas.length > 0) {
            setAreas(cloudAreas);
          }
        });
      }
    } catch (e) {
      console.warn("No se pudo cargar la estructura organizacional de localStorage:", e);
      if (orgId === "org_luis") {
        setWorkCenters([]);
        setAreas([]);
        setPositions([]);
        setUsers([]);
      } else {
        setWorkCenters(DEMO_WORK_CENTERS);
        setAreas(getDefaultOrgStructure(preferences?.organizationSector));
        setPositions(DEMO_POSITIONS);
        setUsers(DEMO_USERS);
      }
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey, orgId, preferences?.organizationSector]);

  // Guardar en localStorage
  const persistState = useCallback(
    (
      newWorkCenters: OrgWorkCenter[],
      newAreas: OrgArea[],
      newPositions: OrgPosition[],
      newUsers: OrgUser[]
    ) => {
      setWorkCenters(newWorkCenters);
      setAreas(newAreas);
      setPositions(newPositions);
      setUsers(newUsers);

      const payload: OrgStructureData = {
        workCenters: newWorkCenters,
        areas: newAreas,
        positions: newPositions,
        users: newUsers,
        lastUpdated: new Date().toISOString(),
      };

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (e) {
        console.warn("Error al guardar estructura organizacional en localStorage:", e);
      }

      if (orgId === "org_demo") {
        saveOrgStructureToSupabase(newAreas);
      }
    },
    [storageKey, orgId]
  );

  // ==========================================================================
  // CRUD CENTROS DE TRABAJO
  // ==========================================================================
  const addWorkCenter = useCallback(
    (data: { name: string; code?: string; description?: string; address?: string }) => {
      const newWc: OrgWorkCenter = {
        id: `wc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: data.name.trim(),
        code: data.code?.trim() || `CT-00${workCenters.length + 1}`,
        description: data.description?.trim(),
        address: data.address?.trim(),
        status: "Activo",
        createdAt: new Date().toISOString().split("T")[0],
      };
      const updated = [...workCenters, newWc];
      persistState(updated, areas, positions, users);
      return newWc;
    },
    [workCenters, areas, positions, users, persistState]
  );

  const updateWorkCenter = useCallback(
    (wcId: string, updates: Partial<OrgWorkCenter>) => {
      const updated = workCenters.map((wc) => (wc.id === wcId ? { ...wc, ...updates } : wc));
      let updatedAreas = areas;
      if (updates.name) {
        updatedAreas = areas.map((a) =>
          a.workCenterId === wcId
            ? { ...a, workCenterName: updates.name, workCenter: updates.name }
            : a
        );
      }
      persistState(updated, updatedAreas, positions, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const toggleWorkCenterStatus = useCallback(
    (wcId: string) => {
      const updated = workCenters.map((wc) => {
        if (wc.id === wcId) {
          const nextStatus: EntityStatus = wc.status === "Inactivo" ? "Activo" : "Inactivo";
          return { ...wc, status: nextStatus };
        }
        return wc;
      });
      persistState(updated, areas, positions, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const deleteWorkCenter = useCallback(
    (wcId: string): { success: boolean; message?: string } => {
      const isUsedByArea = areas.some(
        (a) => a.workCenterId === wcId || a.workCenter === workCenters.find((w) => w.id === wcId)?.name
      );
      if (isUsedByArea) {
        return {
          success: false,
          message: "No es posible eliminar el Centro de Trabajo porque tiene Áreas o Procesos asignados. Puedes cambiar su estado a Inactivo.",
        };
      }
      const updated = workCenters.filter((wc) => wc.id !== wcId);
      persistState(updated, areas, positions, users);
      return { success: true };
    },
    [workCenters, areas, positions, users, persistState]
  );


  // ==========================================================================
  // CRUD ÁREAS
  // ==========================================================================
  const addArea = useCallback(
    (name: string, code?: string, description?: string, workCenter?: string, workCenterId?: string, workCenterName?: string) => {
      let resolvedWcName = workCenterName || workCenter || (workCenters.length > 0 ? workCenters[0].name : "Oficina Central");
      let resolvedWcId = workCenterId;
      if (!resolvedWcId && workCenters.length > 0) {
        const found = workCenters.find((w) => w.name.toLowerCase() === resolvedWcName.toLowerCase());
        resolvedWcId = found ? found.id : workCenters[0].id;
        resolvedWcName = found ? found.name : workCenters[0].name;
      }
      const newArea: OrgArea = {
        id: `area-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        code: code?.trim() || `AR-00${areas.length + 1}`,
        description: description?.trim(),
        workCenter: resolvedWcName,
        workCenterId: resolvedWcId,
        workCenterName: resolvedWcName,
        status: "Activo",
        processes: [],
      };
      const updated = [...areas, newArea];
      persistState(workCenters, updated, positions, users);
      return newArea;
    },
    [workCenters, areas, positions, users, persistState]
  );

  const updateArea = useCallback(
    (areaId: string, updates: Partial<OrgArea>) => {
      const updated = areas.map((a) => (a.id === areaId ? { ...a, ...updates } : a));
      persistState(workCenters, updated, positions, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const toggleAreaStatus = useCallback(
    (areaId: string) => {
      const updated = areas.map((a) => {
        if (a.id === areaId) {
          const nextStatus: EntityStatus = a.status === "Inactivo" ? "Activo" : "Inactivo";
          return { ...a, status: nextStatus };
        }
        return a;
      });
      persistState(workCenters, updated, positions, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const removeArea = useCallback(
    (areaId: string) => {
      // Cambio a inactivo para evitar eliminación destructiva
      toggleAreaStatus(areaId);
    },
    [toggleAreaStatus]
  );

  // ==========================================================================
  // CRUD PROCESOS
  // ==========================================================================
  const addProcess = useCallback(
    (areaId: string, name: string, code?: string, description?: string, subprocessesList?: string[]) => {
      const newProc: OrgProcess = {
        id: `proc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        code: code?.trim() || `PR-00${Date.now().toString().slice(-3)}`,
        description: description?.trim(),
        areaId,
        status: "Activo",
        subprocesses: (subprocessesList || []).map((sub, sIdx) => ({
          id: `sub-${Date.now()}-${sIdx}`,
          name: sub.trim(),
          processId: `proc-${Date.now()}`,
          status: "Activo",
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

      persistState(workCenters, updated, positions, users);
      return newProc;
    },
    [workCenters, areas, positions, users, persistState]
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
      persistState(workCenters, updated, positions, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const toggleProcessStatus = useCallback(
    (areaId: string, processId: string) => {
      const updated = areas.map((a) => {
        if (a.id === areaId) {
          return {
            ...a,
            processes: a.processes.map((p) => {
              if (p.id === processId) {
                const nextStatus: EntityStatus = p.status === "Inactivo" ? "Activo" : "Inactivo";
                return { ...p, status: nextStatus };
              }
              return p;
            }),
          };
        }
        return a;
      });
      persistState(workCenters, updated, positions, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const removeProcess = useCallback(
    (areaId: string, processId: string) => {
      toggleProcessStatus(areaId, processId);
    },
    [toggleProcessStatus]
  );

  // ==========================================================================
  // CRUD SUBPROCESOS
  // ==========================================================================
  const addSubprocess = useCallback(
    (areaId: string, processId: string, subName: string) => {
      if (!subName.trim()) return;
      const newSub: OrgSubprocess = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: subName.trim(),
        processId,
        status: "Activo",
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
      persistState(workCenters, updated, positions, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const toggleSubprocessStatus = useCallback(
    (areaId: string, processId: string, subId: string) => {
      const updated = areas.map((a) => {
        if (a.id === areaId) {
          return {
            ...a,
            processes: a.processes.map((p) => {
              if (p.id === processId) {
                return {
                  ...p,
                  subprocesses: p.subprocesses.map((s) => {
                    if (s.id === subId) {
                      const nextStatus: EntityStatus = s.status === "Inactivo" ? "Activo" : "Inactivo";
                      return { ...s, status: nextStatus };
                    }
                    return s;
                  }),
                };
              }
              return p;
            }),
          };
        }
        return a;
      });
      persistState(workCenters, updated, positions, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const removeSubprocess = useCallback(
    (areaId: string, processId: string, subId: string) => {
      toggleSubprocessStatus(areaId, processId, subId);
    },
    [toggleSubprocessStatus]
  );

  // ==========================================================================
  // CRUD CARGOS (POSITIONS)
  // ==========================================================================
  const addPosition = useCallback(
    (
      name: string,
      code?: string,
      areaId?: string,
      description?: string,
      staffData?: {
        totalStaff?: number;
        menCount?: number;
        womenCount?: number;
        otherCount?: number;
        disabledCount?: number;
        sensitiveCount?: number;
        specialConditionsNote?: string;
      }
    ) => {
      const area = areas.find((a) => a.id === areaId);
      const newPos: OrgPosition = {
        id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        code: code?.trim() || `CARG-00${positions.length + 1}`,
        areaId,
        areaName: area?.name,
        description: description?.trim(),
        status: "Activo",
        createdAt: new Date().toISOString().split("T")[0],
        totalStaff: staffData?.totalStaff || 0,
        menCount: staffData?.menCount || 0,
        womenCount: staffData?.womenCount || 0,
        otherCount: staffData?.otherCount || 0,
        disabledCount: staffData?.disabledCount || 0,
        sensitiveCount: staffData?.sensitiveCount || 0,
        specialConditionsNote: staffData?.specialConditionsNote || "",
      };
      const updated = [...positions, newPos];
      persistState(workCenters, areas, updated, users);
      return newPos;
    },
    [workCenters, areas, positions, users, persistState]
  );

  const updatePosition = useCallback(
    (posId: string, updates: Partial<OrgPosition>) => {
      const updated = positions.map((p) => (p.id === posId ? { ...p, ...updates } : p));
      persistState(workCenters, areas, updated, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const togglePositionStatus = useCallback(
    (posId: string) => {
      const updated = positions.map((p) => {
        if (p.id === posId) {
          const nextStatus: EntityStatus = p.status === "Inactivo" ? "Activo" : "Inactivo";
          return { ...p, status: nextStatus };
        }
        return p;
      });
      persistState(workCenters, areas, updated, users);
    },
    [workCenters, areas, positions, users, persistState]
  );

  // ==========================================================================
  // CRUD USUARIOS
  // ==========================================================================
  const addUser = useCallback(
    (name: string, email: string, cargoId?: string, areaId?: string, role: UserRole = "Editor") => {
      const cargo = positions.find((p) => p.id === cargoId);
      const area = areas.find((a) => a.id === areaId);

      const newUser: OrgUser = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        cargoId,
        cargoName: cargo?.name,
        areaId,
        areaName: area?.name,
        role,
        status: "Activo",
        createdAt: new Date().toISOString(),
      };
      const updated = [...users, newUser];
      persistState(workCenters, areas, positions, updated);
      return newUser;
    },
    [workCenters, areas, positions, users, persistState]
  );

  const updateUser = useCallback(
    (userId: string, updates: Partial<OrgUser>) => {
      const updated = users.map((u) => {
        if (u.id === userId) {
          const area = updates.areaId ? areas.find((a) => a.id === updates.areaId) : undefined;
          const cargo = updates.cargoId ? positions.find((p) => p.id === updates.cargoId) : undefined;
          return {
            ...u,
            ...updates,
            areaName: area ? area.name : updates.areaName || u.areaName,
            cargoName: cargo ? cargo.name : updates.cargoName || u.cargoName,
          };
        }
        return u;
      });
      persistState(workCenters, areas, positions, updated);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const toggleUserStatus = useCallback(
    (userId: string) => {
      const updated = users.map((u) => {
        if (u.id === userId) {
          const nextStatus: EntityStatus = u.status === "Inactivo" ? "Activo" : "Inactivo";
          return { ...u, status: nextStatus };
        }
        return u;
      });
      persistState(workCenters, areas, positions, updated);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const loadSectorDefaults = useCallback(
    (sector?: string) => {
      persistState(DEMO_WORK_CENTERS, getDefaultOrgStructure(sector), DEMO_POSITIONS, DEMO_USERS);
    },
    [persistState]
  );

  // ==========================================================================
  // VALIDACIÓN E IMPORTACIÓN MASIVA
  // ==========================================================================
  const validateImportCsv = useCallback(
    (csvText: string): ImportValidationReport => {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        return {
          validRows: [],
          errorRows: [],
          totalRows: 0,
          isValid: false,
          summary: {
            newAreasCount: 0,
            newProcessesCount: 0,
            newSubprocessesCount: 0,
            newPositionsCount: 0,
            newUsersCount: 0,
          },
        };
      }

      // Descartar encabezado si está presente
      const startIndex = lines[0].toLowerCase().includes("área") || lines[0].toLowerCase().includes("area") ? 1 : 0;
      const validRows: ImportRow[] = [];
      const errorRows: ImportErrorRecord[] = [];
      const seenEmails = new Set<string>();

      const areaSet = new Set<string>();
      const processSet = new Set<string>();
      const subSet = new Set<string>();
      const positionSet = new Set<string>();
      const userSet = new Set<string>();

      for (let i = startIndex; i < lines.length; i++) {
        const rowNum = i + 1;
        const line = lines[i];
        // Soportar coma o punto y coma
        const delimiter = line.includes(";") ? ";" : ",";
        const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ""));

        const areaName = cols[0] || "";
        const processName = cols[1] || "";
        const subprocessName = cols[2] || "";
        const cargoName = cols[3] || "";
        const userName = cols[4] || "";
        const userEmail = (cols[5] || "").toLowerCase();

        const errors: string[] = [];

        // Validaciones obligatorias
        if (!areaName) errors.push("El campo 'Área' es obligatorio.");
        if (!processName) errors.push("El campo 'Proceso' es obligatorio.");
        if (!cargoName) errors.push("El campo 'Cargo' es obligatorio.");

        // Si se incluye usuario, validar nombre y email
        if (userName || userEmail) {
          if (!userName) errors.push("Se especificó correo pero falta el 'Nombre del usuario'.");
          if (!userEmail) errors.push("Se especificó nombre de usuario pero falta el 'Email'.");
          if (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            errors.push(`Email '${userEmail}' inválido.`);
          }
          if (userEmail && seenEmails.has(userEmail)) {
            errors.push(`Email '${userEmail}' duplicado dentro del archivo.`);
          }
        }

        if (errors.length > 0) {
          errorRows.push({
            rowNumber: rowNum,
            data: { areaName, processName, subprocessName, cargoName, userName, userEmail },
            errors,
          });
        } else {
          validRows.push({
            areaName,
            processName,
            subprocessName,
            cargoName,
            userName,
            userEmail,
          });
          if (userEmail) seenEmails.add(userEmail);
          areaSet.add(areaName);
          processSet.add(`${areaName}__${processName}`);
          if (subprocessName) subSet.add(`${processName}__${subprocessName}`);
          positionSet.add(cargoName);
          if (userName && userEmail) userSet.add(userEmail);
        }
      }

      return {
        validRows,
        errorRows,
        totalRows: lines.length - startIndex,
        isValid: errorRows.length === 0 && validRows.length > 0,
        summary: {
          newAreasCount: areaSet.size,
          newProcessesCount: processSet.size,
          newSubprocessesCount: subSet.size,
          newPositionsCount: positionSet.size,
          newUsersCount: userSet.size,
        },
      };
    },
    []
  );

  const applyBulkImport = useCallback(
    (validRows: ImportRow[]) => {
      const updatedAreas = [...areas];
      const updatedPositions = [...positions];
      const updatedUsers = [...users];

      validRows.forEach((row) => {
        // 1. Área
        let area = updatedAreas.find((a) => a.name.toLowerCase() === row.areaName.toLowerCase());
        if (!area) {
          area = {
            id: `area-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: row.areaName,
            code: `AR-00${updatedAreas.length + 1}`,
            status: "Activo",
            workCenter: "Faena Principal",
            processes: [],
          };
          updatedAreas.push(area);
        }

        // 2. Proceso
        let proc = area.processes.find((p) => p.name.toLowerCase() === row.processName.toLowerCase());
        if (!proc) {
          proc = {
            id: `proc-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: row.processName,
            code: `PR-00${area.processes.length + 1}`,
            status: "Activo",
            areaId: area.id,
            subprocesses: [],
          };
          area.processes.push(proc);
        }

        // 3. Subproceso (opcional)
        if (row.subprocessName) {
          const subExists = proc.subprocesses.some(
            (s) => s.name.toLowerCase() === row.subprocessName.toLowerCase()
          );
          if (!subExists) {
            proc.subprocesses.push({
              id: `sub-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: row.subprocessName,
              status: "Activo",
              processId: proc.id,
            });
          }
        }

        // 4. Cargo
        let pos = updatedPositions.find((p) => p.name.toLowerCase() === row.cargoName.toLowerCase());
        if (!pos) {
          pos = {
            id: `pos-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: row.cargoName,
            code: `CARG-00${updatedPositions.length + 1}`,
            areaId: area.id,
            areaName: area.name,
            status: "Activo",
          };
          updatedPositions.push(pos);
        }

        // 5. Usuario (opcional)
        if (row.userName && row.userEmail) {
          const userExists = updatedUsers.some((u) => u.email.toLowerCase() === row.userEmail.toLowerCase());
          if (!userExists) {
            updatedUsers.push({
              id: `usr-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: row.userName,
              email: row.userEmail,
              cargoId: pos.id,
              cargoName: pos.name,
              areaId: area.id,
              areaName: area.name,
              status: "Activo",
              createdAt: new Date().toISOString(),
            });
          }
        }
      });

      persistState(workCenters, updatedAreas, updatedPositions, updatedUsers);
    },
    [workCenters, areas, positions, users, persistState]
  );

  // ==========================================================================
  // PLANTILLA XLSX MULTI-HOJA Y VALIDACIÓN AVANZADA
  // ==========================================================================

  const downloadTemplateXlsx = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: INSTRUCCIONES
    const wsInstructions = createThemedInstructionsSheet({
      title: "PLANTILLA OFICIAL DE ESTRUCTURA ORGANIZACIONAL",
      subtitle: "Estructura jerárquica de centros de trabajo, áreas, procesos, subprocesos, cargos y usuarios en LifeOn.",
      legendNotes: [
        "Las hojas 'CENTROS DE TRABAJO', 'ÁREAS', 'PROCESOS', 'CARGOS' y 'USUARIOS' contienen columnas obligatorias.",
        "Los Subprocesos continúan siendo opcionales dentro de cada proceso.",
      ],
      sections: [
        {
          title: "1. JERARQUÍA OPERACIONAL DE LIFEON",
          items: [
            "Organización -> Centro de Trabajo -> Área -> Proceso -> Subproceso (Opcional).",
            "Mantenga el orden sugerido de las hojas para garantizar la integridad referencial.",
          ],
        },
        {
          title: "2. IDENTIDAD DE GÉNERO Y DOTACIÓN EN CARGOS",
          items: [
            "La plataforma clasifica la identidad de género exclusivamente en: 'Hombre', 'Mujer', 'Otro'.",
            "En la hoja CARGOS, las dotaciones agregadas se registran en: 'Dotación Total *', 'Dotación Hombres', 'Dotación Mujeres' y 'Dotación Otro'.",
            "La suma de 'Dotación Hombres' + 'Dotación Mujeres' + 'Dotación Otro' no debe superar la 'Dotación Total'.",
          ],
        },
        {
          title: "3. ROLES DE USUARIOS EN LIFEON",
          items: [
            "Lector: Visualización de matrices IPER, Programa Anual e IRL.",
            "Editor: Actualización de actividades, evidencias y colaboración en matrices.",
            "Administrador: Gestión completa de la estructura organizacional y usuarios.",
          ],
        },
        {
          title: "4. REGLAS DE VALIDACIÓN",
          items: [
            "Cada Área debe asociarse a un Centro de Trabajo existente en la hoja o ya creado.",
            "Cada Proceso debe pertenecer a un Área existente.",
            "Cada Subproceso debe pertenecer a un Proceso existente.",
            "Los correos electrónicos de los Usuarios deben ser válidos y únicos.",
          ],
        },
      ],
    });

    // Hoja 2: CENTROS DE TRABAJO
    const wsWorkCenters = createThemedDataSheet({
      sheetTitle: "CENTROS DE TRABAJO",
      columns: [
        { header: "Código Centro", key: "code", mandatory: false, width: 18 },
        { header: "Nombre Centro de Trabajo", key: "name", mandatory: true, width: 36 },
        { header: "Dirección", key: "address", mandatory: false, width: 44 },
        { header: "Descripción", key: "description", mandatory: false, width: 50 },
        { header: "Estado", key: "status", mandatory: false, width: 14 },
      ],
      data: [
        {
          code: "CT-001",
          name: "Obra Edificio Santiago Centro",
          address: "Av. Libertador Bernardo O'Higgins 1420, Santiago",
          description: "Construcción de edificio residencial y oficinas 22 pisos",
          status: "Activo",
        },
        {
          code: "CT-002",
          name: "Obra Hospital Regional Talca",
          address: "1 Norte 1990, Talca, Maule",
          description: "Ampliación pabellones quirúrgicos y urgencias",
          status: "Activo",
        },
        {
          code: "CT-003",
          name: "Planta Industrial Antofagasta",
          address: "Ruta 28 km 12, Antofagasta",
          description: "Mantenimiento y operaciones de faena minera / maestranza",
          status: "Activo",
        },
      ],
    });

    // Hoja 3: ÁREAS
    const wsAreas = createThemedDataSheet({
      sheetTitle: "ÁREAS",
      columns: [
        { header: "Código Área", key: "code", mandatory: false, width: 16 },
        { header: "Nombre Área", key: "name", mandatory: true, width: 34 },
        { header: "Centro de Trabajo", key: "workCenter", mandatory: true, width: 36 },
        { header: "Descripción", key: "description", mandatory: false, width: 50 },
        { header: "Estado", key: "status", mandatory: false, width: 14 },
      ],
      data: [
        {
          code: "AR-001",
          name: "Operaciones y Montaje",
          workCenter: "Obra Edificio Santiago Centro",
          description: "Ejecución de faenas en terreno y montajes estructurales",
          status: "Activo",
        },
        {
          code: "AR-002",
          name: "Instalación de Faena y Bodegas",
          workCenter: "Obra Edificio Santiago Centro",
          description: "Recepción, almacenamiento y pañol de herramientas",
          status: "Activo",
        },
        {
          code: "AR-003",
          name: "Talleres y Mantenimiento",
          workCenter: "Planta Industrial Antofagasta",
          description: "Mantenimiento preventivo y correctivo de maquinaria y equipos",
          status: "Activo",
        },
      ],
    });

    // Hoja 4: PROCESOS
    const wsProcesses = createThemedDataSheet({
      sheetTitle: "PROCESOS",
      columns: [
        { header: "Código Proceso", key: "code", mandatory: false, width: 18 },
        { header: "Nombre Proceso", key: "name", mandatory: true, width: 34 },
        { header: "Código Área", key: "areaCode", mandatory: false, width: 16 },
        { header: "Nombre Área", key: "areaName", mandatory: true, width: 32 },
        { header: "Descripción", key: "description", mandatory: false, width: 50 },
        { header: "Estado", key: "status", mandatory: false, width: 14 },
      ],
      data: [
        {
          code: "PR-001",
          name: "Montaje Estructural en Altura",
          areaCode: "AR-001",
          areaName: "Operaciones y Montaje",
          description: "Montaje de vigas, arriostramientos y pernos de anclaje",
          status: "Activo",
        },
        {
          code: "PR-002",
          name: "Excavación y Movimiento de Tierras",
          areaCode: "AR-001",
          areaName: "Operaciones y Montaje",
          description: "Zanjas, entibaciones y nivelación de terreno",
          status: "Activo",
        },
        {
          code: "PR-003",
          name: "Almacenamiento y Despacho",
          areaCode: "AR-002",
          areaName: "Instalación de Faena y Bodegas",
          description: "Control de bodegas, sustancias peligrosas y EPP",
          status: "Activo",
        },
      ],
    });

    // Hoja 5: SUBPROCESOS (OPCIONAL)
    const wsSubprocesses = createThemedDataSheet({
      sheetTitle: "SUBPROCESOS",
      columns: [
        { header: "Código Subproceso", key: "code", mandatory: false, width: 18 },
        { header: "Nombre Subproceso", key: "name", mandatory: true, width: 34 },
        { header: "Código Proceso", key: "processCode", mandatory: false, width: 16 },
        { header: "Nombre Proceso", key: "processName", mandatory: true, width: 32 },
        { header: "Descripción", key: "description", mandatory: false, width: 50 },
        { header: "Estado", key: "status", mandatory: false, width: 14 },
      ],
      data: [
        {
          code: "SUB-001",
          name: "Fijación de Pernos de Anclaje",
          processCode: "PR-001",
          processName: "Montaje Estructural en Altura",
          description: "Alineación y torque de pernos estructurales",
          status: "Activo",
        },
        {
          code: "SUB-002",
          name: "Montaje de Vigas Principales",
          processCode: "PR-001",
          processName: "Montaje Estructural en Altura",
          description: "Izaje con grúa y conexión en altura",
          status: "Activo",
        },
        {
          code: "SUB-003",
          name: "Acopio de Sustancias Peligrosas",
          processCode: "PR-003",
          processName: "Almacenamiento y Despacho",
          description: "Almacenamiento en bodega SUSPEL según DS 43",
          status: "Activo",
        },
      ],
    });

    // Hoja 6: CARGOS
    const wsPositions = createThemedDataSheet({
      sheetTitle: "CARGOS",
      columns: [
        { header: "Código Cargo", key: "code", mandatory: false, width: 16 },
        { header: "Nombre Cargo", key: "name", mandatory: true, width: 36 },
        { header: "Dotación Total", key: "totalStaff", mandatory: true, width: 16 },
        { header: "Dotación Hombres", key: "menCount", mandatory: false, width: 18 },
        { header: "Dotación Mujeres", key: "womenCount", mandatory: false, width: 18 },
        { header: "Dotación Otro", key: "otherCount", mandatory: false, width: 16 },
        { header: "Personas con Discapacidad", key: "disabledCount", mandatory: false, width: 24 },
        { header: "Especialmente Sensibles", key: "sensitiveCount", mandatory: false, width: 24 },
        { header: "Descripción", key: "description", mandatory: false, width: 45 },
        { header: "Estado", key: "status", mandatory: false, width: 14 },
      ],
      data: [
        {
          code: "CARG-001",
          name: "Jefe de Terreno / Administrador de Obra",
          totalStaff: 4,
          menCount: 3,
          womenCount: 1,
          otherCount: 0,
          disabledCount: 0,
          sensitiveCount: 0,
          description: "Dirección general de faena y cumplimiento preventivo",
          status: "Activo",
        },
        {
          code: "CARG-002",
          name: "Experto en Prevención de Riesgos",
          totalStaff: 3,
          menCount: 2,
          womenCount: 1,
          otherCount: 0,
          disabledCount: 0,
          sensitiveCount: 0,
          description: "Asesoría técnica y gestión de matrices IPER según DS 44",
          status: "Activo",
        },
        {
          code: "CARG-003",
          name: "Supervisor de Operaciones y Montaje",
          totalStaff: 8,
          menCount: 7,
          womenCount: 1,
          otherCount: 0,
          disabledCount: 1,
          sensitiveCount: 0,
          description: "Supervisión directa de cuadrillas en terreno",
          status: "Activo",
        },
        {
          code: "CARG-004",
          name: "Maestro Mayor Albañil / Demoledor",
          totalStaff: 25,
          menCount: 23,
          womenCount: 2,
          otherCount: 0,
          disabledCount: 0,
          sensitiveCount: 2,
          description: "Ejecución de trabajos de montaje y albañilería",
          status: "Activo",
        },
        {
          code: "CARG-005",
          name: "Bodeguero Central",
          totalStaff: 6,
          menCount: 4,
          womenCount: 2,
          otherCount: 0,
          disabledCount: 1,
          sensitiveCount: 0,
          description: "Custodia y despacho de materiales, EPP y químicos",
          status: "Activo",
        },
      ],
    });

    // Hoja 7: USUARIOS
    const wsUsers = createThemedDataSheet({
      sheetTitle: "USUARIOS",
      columns: [
        { header: "Nombre", key: "name", mandatory: true, width: 18 },
        { header: "Apellido", key: "lastName", mandatory: false, width: 22 },
        { header: "Email", key: "email", mandatory: true, width: 32 },
        { header: "Cargo", key: "cargo", mandatory: false, width: 36 },
        { header: "Área", key: "area", mandatory: false, width: 30 },
        { header: "Rol / Perfil", key: "role", mandatory: true, width: 18 },
        { header: "Estado", key: "status", mandatory: false, width: 14 },
      ],
      data: [
        {
          name: "Carlos",
          lastName: "Mendoza Riquelme",
          email: "carlos.mendoza@empresa.cl",
          cargo: "Jefe de Terreno / Administrador de Obra",
          area: "Operaciones y Montaje",
          role: "Administrador",
          status: "Activo",
        },
        {
          name: "Pedro",
          lastName: "Alarcón Silva",
          email: "pedro.alarcon@empresa.cl",
          cargo: "Supervisor de Operaciones y Montaje",
          area: "Operaciones y Montaje",
          role: "Editor",
          status: "Activo",
        },
        {
          name: "Juan",
          lastName: "Pérez Morales",
          email: "juan.perez@empresa.cl",
          cargo: "Maestro Mayor Albañil / Demoledor",
          area: "Operaciones y Montaje",
          role: "Lector",
          status: "Activo",
        },
        {
          name: "María",
          lastName: "Rojas Soto",
          email: "maria.rojas@empresa.cl",
          cargo: "Bodeguero Central",
          area: "Instalación de Faena y Bodegas",
          role: "Editor",
          status: "Activo",
        },
      ],
    });

    XLSX.utils.book_append_sheet(wb, wsInstructions, "INSTRUCCIONES");
    XLSX.utils.book_append_sheet(wb, wsWorkCenters, "CENTROS DE TRABAJO");
    XLSX.utils.book_append_sheet(wb, wsAreas, "ÁREAS");
    XLSX.utils.book_append_sheet(wb, wsProcesses, "PROCESOS");
    XLSX.utils.book_append_sheet(wb, wsSubprocesses, "SUBPROCESOS");
    XLSX.utils.book_append_sheet(wb, wsPositions, "CARGOS");
    XLSX.utils.book_append_sheet(wb, wsUsers, "USUARIOS");

    XLSX.writeFile(wb, "Plantilla_Estructura_Organizacional_LifeOn.xlsx");
  }, []);

  const validateImportFile = useCallback(
    async (file: File): Promise<XlsxValidationReport> => {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      const errors: XlsxImportError[] = [];
      const parsedData: XlsxValidationReport["parsedData"] = {
        workCenters: [],
        areas: [],
        processes: [],
        subprocesses: [],
        positions: [],
        users: [],
      };

      const existingWcNames = new Set(workCenters.map((w) => w.name.toLowerCase()));
      const existingWcCodes = new Set(workCenters.map((w) => (w.code || "").toLowerCase()).filter(Boolean));
      const existingAreaNames = new Set(areas.map((a) => a.name.toLowerCase()));
      const existingAreaCodes = new Set(areas.map((a) => (a.code || "").toLowerCase()).filter(Boolean));
      const existingProcessNames = new Set(areas.flatMap((a) => a.processes.map((p) => p.name.toLowerCase())));
      const existingProcessCodes = new Set(areas.flatMap((a) => a.processes.map((p) => (p.code || "").toLowerCase()).filter(Boolean)));
      const existingPositionNames = new Set(positions.map((p) => p.name.toLowerCase()));
      const existingPositionCodes = new Set(positions.map((p) => (p.code || "").toLowerCase()).filter(Boolean));

      const importedWcNames = new Set<string>();
      const importedAreaNames = new Set<string>();
      const importedAreaCodes = new Set<string>();
      const importedProcessNames = new Set<string>();
      const importedProcessCodes = new Set<string>();
      const importedPositionNames = new Set<string>();

      const findSheet = (namePattern: string) => {
        const found = wb.SheetNames.find((s) =>
          s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(namePattern)
        );
        return found ? wb.Sheets[found] : null;
      };

      const sheetWorkCenters = findSheet("centro");
      const sheetAreas = findSheet("area");
      const sheetProcesses = findSheet("proceso") && !findSheet("subproceso") ? findSheet("proceso") : wb.Sheets["PROCESOS"] || wb.Sheets["Procesos"];
      const sheetSubprocesses = findSheet("subproceso") || wb.Sheets["SUBPROCESOS"] || wb.Sheets["Subprocesos"];
      const sheetPositions = findSheet("cargo") || wb.Sheets["CARGOS"] || wb.Sheets["Cargos"];
      const sheetUsers = findSheet("usuario") || wb.Sheets["USUARIOS"] || wb.Sheets["Usuarios"];

      let totalRecords = 0;
      let validRecords = 0;

      // 0. Centros de Trabajo
      if (sheetWorkCenters) {
        const rows: any[] = normalizeImportedRows(sheetWorkCenters);
        rows.forEach((r, idx) => {
          totalRecords++;
          const rowNum = idx + 2;
          const code = String(r["codigo centro"] || r["codigo"] || "").trim();
          const name = String(r["nombre centro de trabajo"] || r["nombre centro"] || r["centro de trabajo"] || r["nombre"] || "").trim();
          const address = String(r["direccion"] || "").trim();
          const description = String(r["descripcion"] || "").trim();
          const status = String(r["estado"] || "Activo").trim() as EntityStatus;

          if (!name) {
            errors.push({ sheet: "CENTROS DE TRABAJO", rowNumber: rowNum, item: "Centro sin nombre", error: "El Nombre del Centro de Trabajo es obligatorio." });
          } else {
            validRecords++;
            parsedData.workCenters!.push({ code: code || `CT-00${workCenters.length + parsedData.workCenters!.length + 1}`, name, address, description, status });
            importedWcNames.add(name.toLowerCase());
          }
        });
      }

      // 1. Áreas
      if (sheetAreas) {
        const rows: any[] = normalizeImportedRows(sheetAreas);
        rows.forEach((r, idx) => {
          totalRecords++;
          const rowNum = idx + 2;
          const code = String(r["codigo area"] || r["codigo"] || "").trim();
          const name = String(r["nombre area"] || r["area"] || r["nombre"] || "").trim();
          const workCenter = String(r["centro de trabajo"] || r["centro"] || r["obra"] || "").trim();
          const description = String(r["descripcion"] || "").trim();
          const status = String(r["estado"] || "Activo").trim() as EntityStatus;

          if (!name) {
            errors.push({ sheet: "ÁREAS", rowNumber: rowNum, item: "Área sin nombre", error: "El Nombre del Área es obligatorio." });
          } else {
            validRecords++;
            parsedData.areas.push({ code: code || `AR-00${areas.length + parsedData.areas.length + 1}`, name, description, status, workCenter });
            importedAreaNames.add(name.toLowerCase());
            if (code) importedAreaCodes.add(code.toLowerCase());
          }
        });
      }

      // 2. Procesos
      if (sheetProcesses) {
        const rows: any[] = normalizeImportedRows(sheetProcesses);
        rows.forEach((r, idx) => {
          totalRecords++;
          const rowNum = idx + 2;
          const code = String(r["codigo proceso"] || r["codigo"] || "").trim();
          const name = String(r["nombre proceso"] || r["proceso"] || r["nombre"] || "").trim();
          const areaCode = String(r["codigo area"] || "").trim();
          const areaName = String(r["nombre area"] || r["area"] || "").trim();
          const description = String(r["descripcion"] || "").trim();
          const status = String(r["estado"] || "Activo").trim() as EntityStatus;

          let hasError = false;
          if (!name) {
            errors.push({ sheet: "PROCESOS", rowNumber: rowNum, item: "Proceso sin nombre", error: "El Nombre del Proceso es obligatorio." });
            hasError = true;
          }

          const targetArea = areaName || areaCode;
          if (!targetArea) {
            errors.push({ sheet: "PROCESOS", rowNumber: rowNum, item: name || `Fila ${rowNum}`, error: "Debe especificar el Área a la que pertenece el Proceso." });
            hasError = true;
          } else {
            const areaExists =
              existingAreaNames.has(areaName.toLowerCase()) ||
              existingAreaCodes.has(areaCode.toLowerCase()) ||
              importedAreaNames.has(areaName.toLowerCase()) ||
              importedAreaCodes.has(areaCode.toLowerCase());
            if (!areaExists) {
              errors.push({
                sheet: "PROCESOS",
                rowNumber: rowNum,
                item: name || `Fila ${rowNum}`,
                error: `El Área '${targetArea}' no existe en el catálogo actual ni en la hoja de ÁREAS.`,
              });
              hasError = true;
            }
          }

          if (!hasError) {
            validRecords++;
            parsedData.processes.push({ code: code || `PR-00${parsedData.processes.length + 1}`, name, areaCode, areaName, description, status });
            importedProcessNames.add(name.toLowerCase());
            if (code) importedProcessCodes.add(code.toLowerCase());
          }
        });
      }

      // 3. Subprocesos (opcional)
      if (sheetSubprocesses) {
        const rows: any[] = normalizeImportedRows(sheetSubprocesses);
        rows.forEach((r, idx) => {
          totalRecords++;
          const rowNum = idx + 2;
          const code = String(r["codigo subproceso"] || r["codigo"] || "").trim();
          const name = String(r["nombre subproceso"] || r["subproceso"] || r["nombre"] || "").trim();
          const processCode = String(r["codigo proceso"] || "").trim();
          const processName = String(r["nombre proceso"] || r["proceso"] || "").trim();
          const description = String(r["descripcion"] || "").trim();
          const status = String(r["estado"] || "Activo").trim() as EntityStatus;

          let hasError = false;
          if (!name) {
            errors.push({ sheet: "SUBPROCESOS", rowNumber: rowNum, item: "Subproceso sin nombre", error: "El Nombre del Subproceso es obligatorio." });
            hasError = true;
          }

          const targetProcess = processName || processCode;
          if (!targetProcess) {
            errors.push({ sheet: "SUBPROCESOS", rowNumber: rowNum, item: name || `Fila ${rowNum}`, error: "Debe indicar el Proceso padre correspondiente." });
            hasError = true;
          } else {
            const procExists =
              existingProcessNames.has(processName.toLowerCase()) ||
              existingProcessCodes.has(processCode.toLowerCase()) ||
              importedProcessNames.has(processName.toLowerCase()) ||
              importedProcessCodes.has(processCode.toLowerCase());
            if (!procExists) {
              errors.push({
                sheet: "SUBPROCESOS",
                rowNumber: rowNum,
                item: name || `Fila ${rowNum}`,
                error: `El Proceso '${targetProcess}' no existe en el catálogo actual ni en la hoja de PROCESOS.`,
              });
              hasError = true;
            }
          }

          if (!hasError) {
            validRecords++;
            parsedData.subprocesses.push({ code, name, processCode, processName, description, status });
          }
        });
      }

      // 4. Cargos con Dotación (Identidad de Género: Hombre, Mujer, Otro)
      if (sheetPositions) {
        const rows: any[] = normalizeImportedRows(sheetPositions);
        rows.forEach((r, idx) => {
          totalRecords++;
          const rowNum = idx + 2;
          const code = String(r["codigo cargo"] || r["codigo"] || "").trim();
          const name = String(r["nombre cargo"] || r["cargo"] || r["nombre"] || "").trim();
          const description = String(r["descripcion"] || "").trim();
          const status = String(r["estado"] || "Activo").trim() as EntityStatus;

          const totalStaff = Number(r["dotacion total"] || r["total"] || 0);
          const menCount = Number(r["dotacion hombres"] || r["hombres"] || 0);
          const womenCount = Number(r["dotacion mujeres"] || r["mujeres"] || 0);
          const otherCount = Number(r["dotacion otro"] || r["dotacion otros"] || r["otro"] || r["otros"] || 0);
          const disabledCount = Number(r["personas con discapacidad"] || r["discapacidad"] || 0);
          const sensitiveCount = Number(r["especialmente sensibles"] || r["sensibles"] || 0);

          if (!name) {
            errors.push({ sheet: "CARGOS", rowNumber: rowNum, item: "Cargo sin nombre", error: "El Nombre del Cargo es obligatorio." });
          } else if (totalStaff > 0 && menCount + womenCount + otherCount > totalStaff) {
            errors.push({
              sheet: "CARGOS",
              rowNumber: rowNum,
              item: name,
              error: `La suma de dotaciones (Hombres: ${menCount}, Mujeres: ${womenCount}, Otro: ${otherCount}) supera la dotación total (${totalStaff}).`,
            });
          } else {
            validRecords++;
            parsedData.positions.push({
              code: code || `CARG-00${positions.length + parsedData.positions.length + 1}`,
              name,
              description,
              status,
              totalStaff,
              menCount,
              womenCount,
              otherCount,
              disabledCount,
              sensitiveCount,
            });
            importedPositionNames.add(name.toLowerCase());
          }
        });
      }

      // 5. Usuarios
      if (sheetUsers) {
        const rows: any[] = normalizeImportedRows(sheetUsers);
        const seenEmailsInFile = new Set<string>();

        rows.forEach((r, idx) => {
          totalRecords++;
          const rowNum = idx + 2;
          const name = String(r["nombre"] || "").trim();
          const lastName = String(r["apellido"] || "").trim();
          const email = String(r["email"] || r["correo"] || "").trim().toLowerCase();
          const cargo = String(r["cargo"] || "").trim();
          const area = String(r["area"] || "").trim();
          const rawRole = String(r["rol / perfil"] || r["rol"] || r["perfil"] || "Editor").trim();
          const status = String(r["estado"] || "Activo").trim() as EntityStatus;

          const fullName = lastName ? `${name} ${lastName}`.trim() : name;
          let hasError = false;

          if (!name) {
            errors.push({ sheet: "USUARIOS", rowNumber: rowNum, item: `Fila ${rowNum}`, error: "El Nombre del usuario es obligatorio." });
            hasError = true;
          }

          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push({ sheet: "USUARIOS", rowNumber: rowNum, item: fullName || `Fila ${rowNum}`, error: `Email '${email}' no es válido.` });
            hasError = true;
          } else if (seenEmailsInFile.has(email)) {
            errors.push({ sheet: "USUARIOS", rowNumber: rowNum, item: fullName || email, error: `Email '${email}' duplicado en la hoja de USUARIOS.` });
            hasError = true;
          } else {
            seenEmailsInFile.add(email);
          }

          if (cargo) {
            const cargoExists =
              existingPositionNames.has(cargo.toLowerCase()) ||
              importedPositionNames.has(cargo.toLowerCase());
            if (!cargoExists) {
              errors.push({
                sheet: "USUARIOS",
                rowNumber: rowNum,
                item: fullName || email,
                error: `El cargo '${cargo}' asignado al usuario no existe en el catálogo actual ni en la hoja de CARGOS.`,
              });
              hasError = true;
            }
          }

          let role: UserRole = "Editor";
          if (rawRole.toLowerCase().includes("admin")) {
            role = "Administrador";
          } else if (rawRole.toLowerCase().includes("lector")) {
            role = "Lector";
          } else {
            role = "Editor";
          }

          if (!hasError) {
            validRecords++;
            parsedData.users.push({ name: fullName, email, cargo, area, role, status });
          }
        });
      }

      // Si no se encontró ninguna de las hojas, procesar formato legacy monocapa
      if (totalRecords === 0 && wb.SheetNames.length > 0) {
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const legacyRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
        legacyRows.forEach((r, idx) => {
          totalRecords++;
          const rowNum = idx + 2;
          const areaName = String(r["Área"] || r["Area"] || "").trim();
          const processName = String(r["Proceso"] || "").trim();
          const subprocessName = String(r["Subproceso"] || "").trim();
          const cargoName = String(r["Cargo"] || "").trim();
          const userName = String(r["Nombre del usuario"] || r["Nombre"] || "").trim();
          const userEmail = String(r["Email del usuario"] || r["Email"] || "").trim().toLowerCase();

          if (!areaName || !processName || !cargoName) {
            errors.push({
              sheet: wb.SheetNames[0],
              rowNumber: rowNum,
              item: `Fila ${rowNum}`,
              error: "Los campos Área, Proceso y Cargo son obligatorios.",
            });
          } else {
            validRecords++;
            if (!importedAreaNames.has(areaName.toLowerCase())) {
              parsedData.areas.push({ code: `AR-00${areas.length + parsedData.areas.length + 1}`, name: areaName, status: "Activo" });
              importedAreaNames.add(areaName.toLowerCase());
            }
            parsedData.processes.push({ code: `PR-00${parsedData.processes.length + 1}`, name: processName, areaName, status: "Activo" });
            if (subprocessName) {
              parsedData.subprocesses.push({ name: subprocessName, processName, status: "Activo" });
            }
            if (!importedPositionNames.has(cargoName.toLowerCase())) {
              parsedData.positions.push({ code: `CARG-00${positions.length + parsedData.positions.length + 1}`, name: cargoName, status: "Activo" });
              importedPositionNames.add(cargoName.toLowerCase());
            }
            if (userName && userEmail) {
              parsedData.users.push({ name: userName, email: userEmail, cargo: cargoName, area: areaName, role: "Editor", status: "Activo" });
            }
          }
        });
      }

      return {
        totalRecords,
        validRecords,
        errorRecords: errors.length,
        isValid: errors.length === 0 && validRecords > 0,
        errors,
        parsedData,
        summary: {
          workCentersCount: parsedData.workCenters?.length || 0,
          newWorkCentersCount: parsedData.workCenters?.length || 0,
          areasCount: parsedData.areas.length,
          processesCount: parsedData.processes.length,
          subprocessesCount: parsedData.subprocesses.length,
          positionsCount: parsedData.positions.length,
          usersCount: parsedData.users.length,
        },
      };
    },
    [workCenters, areas, positions]
  );

  const applyBulkImportXlsx = useCallback(
    (parsedData: XlsxValidationReport["parsedData"]) => {
      const updatedWorkCenters = [...workCenters];
      const updatedAreas = [...areas];
      const updatedPositions = [...positions];
      const updatedUsers = [...users];

      // 0. Centros de Trabajo
      if (parsedData.workCenters) {
        parsedData.workCenters.forEach((wcRow) => {
          let wc = updatedWorkCenters.find((w) => w.name.toLowerCase() === wcRow.name.toLowerCase());
          if (!wc) {
            wc = {
              id: `wc-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: wcRow.name,
              code: wcRow.code || `CT-00${updatedWorkCenters.length + 1}`,
              address: wcRow.address,
              description: wcRow.description,
              status: wcRow.status || "Activo",
              createdAt: new Date().toISOString().split("T")[0],
            };
            updatedWorkCenters.push(wc);
          }
        });
      }

      // 1. Áreas
      parsedData.areas.forEach((aRow) => {
        let area = updatedAreas.find((a) => a.name.toLowerCase() === aRow.name.toLowerCase());
        if (!area) {
          const matchedWc = aRow.workCenter
            ? updatedWorkCenters.find((w) => w.name.toLowerCase() === aRow.workCenter?.toLowerCase())
            : updatedWorkCenters[0];
          area = {
            id: `area-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: aRow.name,
            code: aRow.code || `AR-00${updatedAreas.length + 1}`,
            description: aRow.description,
            status: aRow.status || "Activo",
            workCenter: matchedWc?.name || aRow.workCenter || "Faena Principal",
            workCenterId: matchedWc?.id,
            workCenterName: matchedWc?.name,
            processes: [],
          };
          updatedAreas.push(area);
        }
      });

      // 2. Procesos
      parsedData.processes.forEach((pRow) => {
        let area = updatedAreas.find(
          (a) =>
            a.name.toLowerCase() === pRow.areaName.toLowerCase() ||
            (pRow.areaCode && (a.code || "").toLowerCase() === pRow.areaCode.toLowerCase())
        );
        if (!area) {
          area = {
            id: `area-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: pRow.areaName,
            code: pRow.areaCode || `AR-00${updatedAreas.length + 1}`,
            status: "Activo",
            workCenter: "Faena Principal",
            processes: [],
          };
          updatedAreas.push(area);
        }

        let proc = area.processes.find((p) => p.name.toLowerCase() === pRow.name.toLowerCase());
        if (!proc) {
          proc = {
            id: `proc-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: pRow.name,
            code: pRow.code || `PR-00${area.processes.length + 1}`,
            description: pRow.description,
            status: pRow.status || "Activo",
            areaId: area.id,
            subprocesses: [],
          };
          area.processes.push(proc);
        }
      });

      // 3. Subprocesos
      parsedData.subprocesses.forEach((sRow) => {
        for (const area of updatedAreas) {
          const proc = area.processes.find(
            (p) =>
              p.name.toLowerCase() === sRow.processName.toLowerCase() ||
              (sRow.processCode && (p.code || "").toLowerCase() === sRow.processCode.toLowerCase())
          );
          if (proc) {
            const subExists = proc.subprocesses.some((s) => s.name.toLowerCase() === sRow.name.toLowerCase());
            if (!subExists) {
              proc.subprocesses.push({
                id: `sub-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                name: sRow.name,
                code: sRow.code,
                description: sRow.description,
                status: sRow.status || "Activo",
                processId: proc.id,
              });
            }
            break;
          }
        }
      });

      // 4. Cargos
      parsedData.positions.forEach((cRow) => {
        let pos = updatedPositions.find((p) => p.name.toLowerCase() === cRow.name.toLowerCase());
        if (!pos) {
          pos = {
            id: `pos-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: cRow.name,
            code: cRow.code || `CARG-00${updatedPositions.length + 1}`,
            description: cRow.description,
            status: cRow.status || "Activo",
            totalStaff: cRow.totalStaff || 0,
            menCount: cRow.menCount || 0,
            womenCount: cRow.womenCount || 0,
            disabledCount: cRow.disabledCount || 0,
            sensitiveCount: cRow.sensitiveCount || 0,
          };
          updatedPositions.push(pos);
        }
      });

      // 5. Usuarios
      parsedData.users.forEach((uRow) => {
        const userExists = updatedUsers.some((u) => u.email.toLowerCase() === uRow.email.toLowerCase());
        if (!userExists) {
          const pos = updatedPositions.find((p) => p.name.toLowerCase() === uRow.cargo.toLowerCase());
          const area = updatedAreas.find((a) => a.name.toLowerCase() === (uRow.area || "").toLowerCase());
          updatedUsers.push({
            id: `usr-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: uRow.name,
            email: uRow.email,
            cargoId: pos?.id,
            cargoName: pos?.name || uRow.cargo,
            areaId: area?.id,
            areaName: area?.name || uRow.area,
            role: uRow.role || "Editor",
            status: uRow.status || "Activo",
            createdAt: new Date().toISOString(),
          });
        }
      });

      persistState(updatedWorkCenters, updatedAreas, updatedPositions, updatedUsers);
    },
    [workCenters, areas, positions, users, persistState]
  );

  const downloadTemplateCsv = useCallback(() => {
    downloadTemplateXlsx();
  }, [downloadTemplateXlsx]);

  // Métricas agregadas
  const totalWorkCentersCount = workCenters.length;
  const totalActiveWorkCentersCount = useMemo(() => workCenters.filter((w) => w.status !== "Inactivo").length, [workCenters]);
  const totalAreasCount = areas.length;
  const totalActiveAreasCount = useMemo(() => areas.filter((a) => a.status !== "Inactivo").length, [areas]);
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
  const totalPositionsCount = positions.length;
  const totalUsersCount = users.length;

  return {
    workCenters,
    areas,
    positions,
    users,
    isLoaded,
    addWorkCenter,
    updateWorkCenter,
    toggleWorkCenterStatus,
    deleteWorkCenter,
    addArea,
    updateArea,
    toggleAreaStatus,
    removeArea,
    addProcess,
    updateProcess,
    toggleProcessStatus,
    removeProcess,
    addSubprocess,
    toggleSubprocessStatus,
    removeSubprocess,
    addPosition,
    updatePosition,
    togglePositionStatus,
    addUser,
    updateUser,
    toggleUserStatus,
    validateImportCsv,
    validateImportFile,
    applyBulkImport,
    applyBulkImportXlsx,
    downloadTemplateCsv,
    downloadTemplateXlsx,
    loadSectorDefaults,
    totalWorkCentersCount,
    totalActiveWorkCentersCount,
    totalAreasCount,
    totalActiveAreasCount,
    totalProcessesCount,
    totalSubprocessesCount,
    totalPositionsCount,
    totalUsersCount,
  };
}

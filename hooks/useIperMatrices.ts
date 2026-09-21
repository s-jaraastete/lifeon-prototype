"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useLifeOnPreferences } from "./useLifeOnPreferences";
import { fetchIperMatricesFromSupabase } from "@/lib/services/supabaseService";
import { mergeIperMatrixLists } from "@/lib/utils/iperMatrixPersistence";
import { IperMatrixItem } from "@/app/dashboard/components/IperMatrixView";
import { INITIAL_MATRICES } from "@/app/dashboard/components/IperMatrixView";
import type { OrgWorkCenter } from "@/types/orgStructure";

function matrixMatchesWorkplace(
  m: IperMatrixItem,
  activeWorkplace: string,
  workCenters: OrgWorkCenter[]
): boolean {
  const targetWp = activeWorkplace.toLowerCase().trim();
  const wc = workCenters.find((w) => w.name.toLowerCase().trim() === targetWp);
  const wcId = wc?.id?.toLowerCase().trim();
  const wcName = wc?.name?.toLowerCase().trim() || targetWp;

  const center = (m.workCenter || m.workCenterName || "").toLowerCase().trim();
  const centerId = (m.workCenterId || "").toLowerCase().trim();

  if (center === targetWp || center === wcName) return true;
  if (centerId && (centerId === targetWp || (wcId && centerId === wcId))) return true;
  if (center && (center.includes(targetWp) || targetWp.includes(center))) return true;
  if (wcName && center && (center.includes(wcName) || wcName.includes(center))) return true;
  return false;
}

export function useIperMatrices(activeWorkplace?: string, workCenters: OrgWorkCenter[] = []) {
  const { currentUser } = useLifeOnPreferences();
  const orgId = currentUser?.orgId || "org_demo";
  const storageKey = `lifeon_iper_matrices_${orgId}`;

  const isDemo = orgId === "org_demo";

  const [matrices, setMatrices] = useState<IperMatrixItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
    }
    return isDemo ? INITIAL_MATRICES : [];
  });

  const [isLoading, setIsLoading] = useState(false);

  const loadMatrices = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setMatrices(parsed);
          }
        }
      } catch (_) {}
    }

    setIsLoading(true);
    fetchIperMatricesFromSupabase(orgId)
      .then((cloudMatrices) => {
        if (cloudMatrices === null) return;
        setMatrices((prev) => {
          const merged = mergeIperMatrixLists(prev, cloudMatrices, orgId);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(storageKey, JSON.stringify(merged));
            } catch (_) {}
          }
          return merged;
        });
      })
      .catch((err) => {
        console.warn("Error cargando matrices desde Supabase:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [storageKey, orgId]);

  useEffect(() => {
    loadMatrices();

    const handleMatricesSync = (e: any) => {
      if (e?.detail?.matrices) {
        if (!e.detail.orgId || e.detail.orgId === orgId) {
          setMatrices(e.detail.matrices);
        }
      } else {
        loadMatrices();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("lifeon-iper-matrices-change", handleMatricesSync);
      window.addEventListener("lifeon-session-change", handleMatricesSync);
      window.addEventListener("storage", handleMatricesSync);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("lifeon-iper-matrices-change", handleMatricesSync);
        window.removeEventListener("lifeon-session-change", handleMatricesSync);
        window.removeEventListener("storage", handleMatricesSync);
      }
    };
  }, [loadMatrices, orgId]);

  // Normalizadores de estados
  const normalizeStatus = (status?: string): string => {
    if (!status) return "";
    return status.toLowerCase().trim();
  };

  const isVigenteStatus = (status?: string) => {
    const s = normalizeStatus(status);
    return s === "vigente" || s === "aprobada" || s === "aprobado";
  };

  const isBorradorStatus = (status?: string) => {
    const s = normalizeStatus(status);
    return s === "borrador" || s === "en elaboración" || s === "en elaboracion";
  };

  const isEnRevisionStatus = (status?: string) => {
    const s = normalizeStatus(status);
    return (
      s === "en revisión" ||
      s === "en revision" ||
      s === "en aprobación" ||
      s === "en aprobacion" ||
      s === "en actualización" ||
      s === "en actualizacion" ||
      s === "en modificación" ||
      s === "en modificacion" ||
      s === "observada" ||
      s === "observado"
    );
  };

  // Filtrado opcional por Centro de Trabajo
  const filteredMatrices = useMemo(() => {
    if (!activeWorkplace || activeWorkplace === "Todos los Centros de Trabajo") {
      return matrices;
    }
    return matrices.filter((m) => matrixMatchesWorkplace(m, activeWorkplace, workCenters));
  }, [matrices, activeWorkplace, workCenters]);

  const metricsMatrices = useMemo(() => {
    if (!activeWorkplace || activeWorkplace === "Todos los Centros de Trabajo") {
      return matrices;
    }
    if (filteredMatrices.length > 0) return filteredMatrices;
    return matrices;
  }, [matrices, filteredMatrices, activeWorkplace]);

  const vigentesMatrices = useMemo(
    () => metricsMatrices.filter((m) => isVigenteStatus(m.status)),
    [metricsMatrices]
  );

  const totalMatricesCount = metricsMatrices.length;
  const borradoresCount = useMemo(
    () => metricsMatrices.filter((m) => isBorradorStatus(m.status)).length,
    [metricsMatrices]
  );
  const enRevisionCount = useMemo(
    () => metricsMatrices.filter((m) => isEnRevisionStatus(m.status)).length,
    [metricsMatrices]
  );
  const vigentesCount = vigentesMatrices.length;

  // Conteo total de riesgos evaluados
  const totalRisksCount = useMemo(() => {
    return metricsMatrices.reduce((acc, m) => {
      const rec = typeof m.totalRecords === "number" ? m.totalRecords : parseInt(String(m.totalRecords), 10);
      const evCount = Array.isArray(m.evaluations) ? m.evaluations.length : 0;
      return acc + (Number.isFinite(rec) && rec > 0 ? rec : evCount);
    }, 0);
  }, [metricsMatrices]);

  // Conteo total de riesgos intolerables / críticos
  const criticalRisksCount = useMemo(() => {
    return metricsMatrices.reduce((acc, m) => {
      const rec = typeof m.intolerableRisks === "number" ? m.intolerableRisks : parseInt(String(m.intolerableRisks), 10);
      const critFromEv = Array.isArray(m.evaluations)
        ? m.evaluations.filter((e) => e.initialLevel === "Crítico" || e.residualLevel === "Crítico").length
        : 0;
      return acc + (Number.isFinite(rec) && rec > 0 ? rec : critFromEv);
    }, 0);
  }, [metricsMatrices]);

  // Cargos asociados exclusivamente a matrices vigentes
  const irlCargos = useMemo(() => {
    const set = new Set<string>();
    vigentesMatrices.forEach((m) => {
      if (Array.isArray(m.evaluations)) {
        m.evaluations.forEach((ev) => {
          if (ev.cargo && typeof ev.cargo === "string") {
            ev.cargo
              .split(/[,/;•]/)
              .map((c) => c.trim())
              .filter(Boolean)
              .forEach((c) => set.add(c));
          }
        });
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [vigentesMatrices]);

  const cargosWithIrlCount = irlCargos.length;
  const irlAvailableCount = cargosWithIrlCount;

  // Distribución real de riesgos para mapa de calor y barras
  const riskDistribution = useMemo(() => {
    let bajo = 0;
    let medio = 0;
    let alto = 0;
    let critico = 0;

    metricsMatrices.forEach((m) => {
      if (Array.isArray(m.evaluations) && m.evaluations.length > 0) {
        m.evaluations.forEach((ev) => {
          const lvl = ev.residualLevel || ev.initialLevel;
          if (lvl === "Crítico") critico++;
          else if (lvl === "Alto") alto++;
          else if (lvl === "Medio") medio++;
          else bajo++;
        });
      } else {
        // Fallback estimado si la matriz tiene totales numéricos
        const tot = typeof m.totalRecords === "number" ? m.totalRecords : 0;
        const crit = typeof m.intolerableRisks === "number" ? m.intolerableRisks : 0;
        critico += crit;
        if (tot > crit) {
          const rem = tot - crit;
          alto += Math.round(rem * 0.25);
          medio += Math.round(rem * 0.35);
          bajo += Math.max(0, rem - Math.round(rem * 0.25) - Math.round(rem * 0.35));
        }
      }
    });

    const total = bajo + medio + alto + critico;
    return {
      bajo,
      medio,
      alto,
      critico,
      total,
      pctBajo: total > 0 ? Math.round((bajo / total) * 100) : 0,
      pctMedio: total > 0 ? Math.round((medio / total) * 100) : 0,
      pctAlto: total > 0 ? Math.round((alto / total) * 100) : 0,
      pctCritico: total > 0 ? Math.round((critico / total) * 100) : 0,
    };
  }, [metricsMatrices]);

  // Lista de riesgos destacados para el panel del Dashboard
  const topEvaluatedRisks = useMemo(() => {
    const list: Array<{
      task: string;
      hazard: string;
      level: "Bajo" | "Medio" | "Alto" | "Crítico";
      status: string;
    }> = [];

    metricsMatrices.forEach((m) => {
      if (Array.isArray(m.evaluations)) {
        m.evaluations.slice(0, 3).forEach((ev) => {
          list.push({
            task: ev.task || "Tarea Operativa",
            hazard: ev.hazard || ev.riskEvent || "Peligro identificado",
            level: ev.residualLevel || ev.initialLevel || "Medio",
            status: ev.controlStatus || (m.status === "Vigente" ? "Controlado" : "En Revisión"),
          });
        });
      }
    });

    return list.slice(0, 3);
  }, [metricsMatrices]);

  return {
    matrices,
    filteredMatrices,
    vigentesMatrices,
    isLoading,
    totalMatricesCount,
    borradoresCount,
    enRevisionCount,
    vigentesCount,
    totalRisksCount,
    criticalRisksCount,
    irlCargos,
    cargosWithIrlCount,
    irlAvailableCount,
    riskDistribution,
    topEvaluatedRisks,
    refreshMatrices: loadMatrices,
  };
}

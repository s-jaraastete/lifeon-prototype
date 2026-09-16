"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  PreventiveDoc,
  DocStatus,
  AuditStatus,
  AuditPointStatus,
  DocSection,
  getAutoVigenciaStatus,
} from "@/types/preventiveDocs";
import { DEFAULT_PREVENTIVE_DOCS } from "@/data/defaultPreventiveDocs";
import {
  fetchPreventiveDocsFromSupabase,
  savePreventiveDocsToSupabase,
} from "@/lib/services/supabaseService";
import { useLifeOnPreferences } from "./useLifeOnPreferences";
import {
  getScopedStorageKey,
  SESSION_CHANGE_EVENT,
} from "@/lib/auth/authService";

export const PREVENTIVE_DOCS_STORAGE_KEY = "lifeon_preventive_docs";

function withAutoVigencia(docs: PreventiveDoc[]): PreventiveDoc[] {
  return docs.map((doc) => {
    const { status, daysRemaining } = getAutoVigenciaStatus(doc.expiryDate, doc.status);
    return { ...doc, status, daysRemaining };
  });
}

function defaultDocsForOrg(_orgId: string): PreventiveDoc[] {
  return withAutoVigencia(DEFAULT_PREVENTIVE_DOCS);
}

export function usePreventiveDocs() {
  const { currentUser } = useLifeOnPreferences();
  const orgId = currentUser?.orgId || "org_demo";
  const storageKey = useMemo(
    () => getScopedStorageKey(PREVENTIVE_DOCS_STORAGE_KEY, orgId),
    [orgId]
  );

  const [docs, setDocs] = useState<PreventiveDoc[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const skipNextCloudSave = useRef(false);

  const loadDocsForOrg = useCallback(() => {
    setIsLoaded(false);
    let localDocs: PreventiveDoc[] | null = null;

    try {
      const stored =
        typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      if (stored) {
        const parsed: PreventiveDoc[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localDocs = withAutoVigencia(parsed);
          setDocs(localDocs);
        }
      }
    } catch (err) {
      console.error("Error reading preventive docs from localStorage:", err);
    }

    if (!localDocs) {
      setDocs(defaultDocsForOrg(orgId));
    }

    fetchPreventiveDocsFromSupabase(orgId)
      .then((cloudDocs) => {
        if (cloudDocs === null) return;
        if (cloudDocs.length > 0) {
          skipNextCloudSave.current = true;
          const hydrated = withAutoVigencia(cloudDocs);
          setDocs(hydrated);
          try {
            localStorage.setItem(storageKey, JSON.stringify(hydrated));
          } catch {
            /* noop */
          }
        } else if (localDocs && localDocs.length > 0) {
          savePreventiveDocsToSupabase(localDocs, orgId);
        }
      })
      .catch((err) => {
        console.warn("Error hidratando documentos preventivos desde Supabase:", err);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, [orgId, storageKey]);

  useEffect(() => {
    loadDocsForOrg();

    const onSessionChange = () => loadDocsForOrg();
    if (typeof window !== "undefined") {
      window.addEventListener(SESSION_CHANGE_EVENT, onSessionChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(SESSION_CHANGE_EVENT, onSessionChange);
      }
    };
  }, [loadDocsForOrg]);

  useEffect(() => {
    if (!isLoaded) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(docs));
    } catch (err) {
      console.error("Error saving preventive docs to localStorage:", err);
    }

    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }

    void savePreventiveDocsToSupabase(docs, orgId);
  }, [docs, orgId, storageKey, isLoaded]);

  const updateDoc = (id: string, updates: Partial<PreventiveDoc>) => {
    setDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== id) return doc;
        const updated = { ...doc, ...updates };
        const { status, daysRemaining } = getAutoVigenciaStatus(
          updated.expiryDate,
          updated.status
        );
        return { ...updated, status, daysRemaining };
      })
    );
  };

  const uploadCustomFile = (
    docId: string,
    fileInfo: {
      fileName: string;
      fileSize?: string;
      expiryDate?: string;
      author?: string;
      version?: string;
    }
  ) => {
    setDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const newExpiry = fileInfo.expiryDate || doc.expiryDate;
        const { status, daysRemaining } = getAutoVigenciaStatus(newExpiry);
        return {
          ...doc,
          hasFile: true,
          fileName: fileInfo.fileName,
          fileSize: fileInfo.fileSize || "1.5 MB",
          source: "Cargado por Empresa",
          author: fileInfo.author || doc.author,
          version: fileInfo.version || doc.version,
          expiryDate: newExpiry,
          status,
          daysRemaining,
        };
      })
    );
  };

  const updateAuditPoint = (
    docId: string,
    pointId: string,
    pointStatus: AuditPointStatus,
    notes?: string
  ) => {
    setDocs((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;

        const updatedChecklist = doc.auditChecklist.map((pt) => {
          if (pt.id !== pointId) return pt;
          return {
            ...pt,
            status: pointStatus,
            notes: notes !== undefined ? notes : pt.notes,
            lastAuditedDate: new Date().toLocaleDateString("es-CL"),
          };
        });

        const applicablePoints = updatedChecklist.filter((p) => p.status !== "No Aplica");
        const total = applicablePoints.length;
        if (total === 0) {
          return {
            ...doc,
            auditChecklist: updatedChecklist,
            auditScore: 100,
            auditStatus: "Conforme" as AuditStatus,
          };
        }

        const scoreSum = applicablePoints.reduce((acc, p) => {
          if (p.status === "Cumple") return acc + 1;
          if (p.status === "Observado") return acc + 0.5;
          return acc;
        }, 0);

        const newScore = Math.round((scoreSum / total) * 100);
        let newAuditStatus: AuditStatus = "Conforme";
        if (
          newScore < 70 ||
          applicablePoints.some((p) => p.criticality === "Crítico" && p.status === "No Cumple")
        ) {
          newAuditStatus = "No Conforme";
        } else if (
          newScore < 100 ||
          applicablePoints.some((p) => p.status === "Observado")
        ) {
          newAuditStatus = "Con Observaciones";
        }

        return {
          ...doc,
          auditChecklist: updatedChecklist,
          auditScore: newScore,
          auditStatus: newAuditStatus,
        };
      })
    );
  };

  const updateDocSections = (docId: string, sections: DocSection[]) => {
    setDocs((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, contentSections: sections } : doc))
    );
  };

  const addDocument = (newDoc: Omit<PreventiveDoc, "id">) => {
    const id = `DOC-${Date.now().toString().slice(-4)}`;
    const { status, daysRemaining } = getAutoVigenciaStatus(newDoc.expiryDate, newDoc.status);
    const docWithId: PreventiveDoc = {
      ...newDoc,
      id,
      status,
      daysRemaining,
    };
    setDocs((prev) => [docWithId, ...prev]);
    return docWithId;
  };

  const deleteDocument = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const resetToDefaults = () => {
    const fresh = defaultDocsForOrg(orgId);
    setDocs(fresh);
    localStorage.setItem(storageKey, JSON.stringify(fresh));
  };

  const metrics = useMemo(() => {
    const totalDocs = docs.length;
    const vigentesCount = docs.filter((d) => d.status === "Vigente").length;
    const porVencerCount = docs.filter((d) => d.status === "Por Vencer").length;
    const vencidosCount = docs.filter((d) => d.status === "Vencido").length;
    const pendientesCount = docs.filter((d) => d.status === "Pendiente de Carga").length;

    let totalPoints = 0;
    let passedPoints = 0;
    let observedPoints = 0;
    let failedPoints = 0;
    let criticalBreaches = 0;

    docs.forEach((doc) => {
      doc.auditChecklist.forEach((pt) => {
        if (pt.status !== "No Aplica") {
          totalPoints++;
          if (pt.status === "Cumple") passedPoints++;
          if (pt.status === "Observado") {
            observedPoints++;
            if (pt.criticality === "Crítico") criticalBreaches++;
          }
          if (pt.status === "No Cumple") {
            failedPoints++;
            if (pt.criticality === "Crítico") criticalBreaches++;
          }
        }
      });
    });

    const globalComplianceScore =
      totalDocs > 0
        ? Math.round(docs.reduce((acc, d) => acc + (d.auditScore || 0), 0) / totalDocs)
        : 0;

    return {
      totalDocs,
      vigentesCount,
      porVencerCount,
      vencidosCount,
      pendientesCount,
      globalComplianceScore,
      totalPoints,
      passedPoints,
      observedPoints,
      failedPoints,
      criticalBreaches,
    };
  }, [docs]);

  return {
    docs,
    isLoaded,
    updateDoc,
    uploadCustomFile,
    updateAuditPoint,
    updateDocSections,
    addDocument,
    deleteDocument,
    resetToDefaults,
    metrics,
  };
}

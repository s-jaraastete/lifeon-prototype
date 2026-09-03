"use client";

import { useState, useEffect, useMemo } from "react";
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

const STORAGE_KEY = "lifeon_preventive_docs";

export function usePreventiveDocs() {
  const [docs, setDocs] = useState<PreventiveDoc[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_PREVENTIVE_DOCS.map((doc) => {
        const { status, daysRemaining } = getAutoVigenciaStatus(doc.expiryDate, doc.status);
        return { ...doc, status, daysRemaining };
      });
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PreventiveDoc[] = JSON.parse(stored);
        return parsed.map((doc) => {
          const { status, daysRemaining } = getAutoVigenciaStatus(doc.expiryDate, doc.status);
          return { ...doc, status, daysRemaining };
        });
      }
    } catch (err) {
      console.error("Error reading preventive docs from localStorage:", err);
    }

    return DEFAULT_PREVENTIVE_DOCS.map((doc) => {
      const { status, daysRemaining } = getAutoVigenciaStatus(doc.expiryDate, doc.status);
      return { ...doc, status, daysRemaining };
    });
  });

  // Intentar hidratar desde Supabase si está disponible
  useEffect(() => {
    fetchPreventiveDocsFromSupabase().then((cloudDocs) => {
      if (cloudDocs && cloudDocs.length > 0) {
        setDocs(cloudDocs);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudDocs));
        } catch {}
      }
    });
  }, []);

  // Guardar en localStorage y Supabase cuando cambian los documentos
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    } catch (err) {
      console.error("Error saving preventive docs to localStorage:", err);
    }

    // Persistir en Supabase en segundo plano sin bloquear
    savePreventiveDocsToSupabase(docs);
  }, [docs]);

  // Actualizar un documento por ID
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

  // Cargar un archivo propio de la empresa para un documento existente
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

  // Actualizar el estado de un punto de auditoría específico
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

        // Recalcular puntaje y estado de auditoría
        const applicablePoints = updatedChecklist.filter((p) => p.status !== "No Aplica");
        const total = applicablePoints.length;
        if (total === 0) {
          return {
            ...doc,
            auditChecklist: updatedChecklist,
            auditScore: 100,
            auditStatus: "Conforme",
          };
        }

        const scoreSum = applicablePoints.reduce((acc, p) => {
          if (p.status === "Cumple") return acc + 1;
          if (p.status === "Observado") return acc + 0.5;
          return acc;
        }, 0);

        const newScore = Math.round((scoreSum / total) * 100);
        let newAuditStatus: AuditStatus = "Conforme";
        if (newScore < 70 || applicablePoints.some((p) => p.criticality === "Crítico" && p.status === "No Cumple")) {
          newAuditStatus = "No Conforme";
        } else if (newScore < 100 || applicablePoints.some((p) => p.status === "Observado")) {
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

  // Actualizar las secciones de contenido de la propuesta base
  const updateDocSections = (docId: string, sections: DocSection[]) => {
    setDocs((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, contentSections: sections } : doc))
    );
  };

  // Agregar un nuevo documento (personalizado o desde catálogo)
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

  // Eliminar un documento
  const deleteDocument = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Restablecer al catálogo predeterminado
  const resetToDefaults = () => {
    const fresh = DEFAULT_PREVENTIVE_DOCS.map((doc) => {
      const { status, daysRemaining } = getAutoVigenciaStatus(doc.expiryDate, doc.status);
      return { ...doc, status, daysRemaining };
    });
    setDocs(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  // Métricas agregadas y estadísticas de cumplimiento
  const metrics = useMemo(() => {
    const totalDocs = docs.length;
    const vigentesCount = docs.filter((d) => d.status === "Vigente").length;
    const porVencerCount = docs.filter((d) => d.status === "Por Vencer").length;
    const vencidosCount = docs.filter((d) => d.status === "Vencido").length;
    const pendientesCount = docs.filter((d) => d.status === "Pendiente de Carga").length;

    // Puntos de auditoría agregados
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

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TechnicalDocument,
  DocumentType,
  DocumentTypeDefinition,
  TechnicalDocsStorageData,
} from "@/types/technicalDocs";
import { useLifeOnPreferences } from "./useLifeOnPreferences";
import { getScopedStorageKey } from "@/lib/auth/authService";
import {
  deleteTechnicalDocument,
  fetchTechnicalDocuments,
  fetchTechnicalDocumentById,
  upsertTechnicalDocument,
} from "@/lib/repositories/technicalDocumentsRepository";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { getSupabaseAuthUserId } from "@/lib/auth/lifeonAuth";

export const TECHNICAL_DOCS_STORAGE_KEY = "lifeon_technical_docs";
export const TECH_DOCS_CHANGE_EVENT = "lifeon-technical-docs-change";

export const DOCUMENT_TYPE_DEFINITIONS: DocumentTypeDefinition[] = [
  {
    type: "RIOHS",
    label: "Reglamento Interno (RIOHS)",
    description: "Reglamento Interno de Orden, Higiene y Seguridad de la organización.",
    colorClass: "red",
    sections: [
      { key: "identificacion", label: "Identificación del Empleador", required: true, multiline: true, rows: 3, placeholder: "Razón social, RUT, dirección, representante legal..." },
      { key: "objetivo", label: "Objetivo del Reglamento", required: true, multiline: true, rows: 3, placeholder: "Describir el propósito del reglamento..." },
      { key: "disposiciones", label: "Disposiciones Generales", required: true, multiline: true, rows: 5, placeholder: "Normas generales de comportamiento y convivencia..." },
      { key: "obligaciones_empleador", label: "Obligaciones del Empleador", required: true, multiline: true, rows: 5, placeholder: "Listado de obligaciones del empleador en materia de higiene y seguridad..." },
      { key: "obligaciones_trabajador", label: "Obligaciones del Trabajador", required: true, multiline: true, rows: 5, placeholder: "Listado de obligaciones y responsabilidades del trabajador..." },
      { key: "prohibiciones", label: "Prohibiciones", required: false, multiline: true, rows: 4, placeholder: "Conductas y acciones prohibidas en el lugar de trabajo..." },
      { key: "orden", label: "Normas de Orden Interno", required: false, multiline: true, rows: 4, placeholder: "Horarios, uso de instalaciones, procedimientos internos..." },
      { key: "higiene", label: "Normas de Higiene", required: false, multiline: true, rows: 4, placeholder: "Requisitos de higiene personal y del entorno de trabajo..." },
      { key: "seguridad", label: "Normas de Seguridad", required: false, multiline: true, rows: 5, placeholder: "Uso de EPP, procedimientos de seguridad, señalética..." },
      { key: "sanciones", label: "Sanciones y Procedimiento de Reclamación", required: false, multiline: true, rows: 4, placeholder: "Escala de sanciones y proceso para presentar reclamaciones..." },
      { key: "firma", label: "Vigencia y Firmas", required: false, multiline: false, placeholder: "Fecha de vigencia y responsable de aprobación..." },
    ],
  },
  {
    type: "PTS",
    label: "Procedimiento de Trabajo Seguro",
    description: "Define de forma estructurada cómo ejecutar una tarea de manera segura.",
    colorClass: "blue",
    sections: [
      { key: "nombre", label: "Nombre del Procedimiento", required: true, multiline: false, placeholder: "Ej: PTS-001 Trabajo en Altura con Arnés" },
      { key: "objetivo", label: "Objetivo", required: true, multiline: true, rows: 3, placeholder: "Describir el propósito del procedimiento y qué se pretende lograr..." },
      { key: "alcance", label: "Alcance", required: true, multiline: true, rows: 2, placeholder: "Áreas, procesos o trabajadores a los que aplica este procedimiento..." },
      { key: "responsables", label: "Responsables", required: true, multiline: true, rows: 3, placeholder: "Cargos o personas responsables de ejecutar y supervisar este procedimiento..." },
      { key: "definiciones", label: "Definiciones y Abreviaciones", required: false, multiline: true, rows: 3, placeholder: "Términos técnicos relevantes utilizados en este procedimiento..." },
      { key: "epp", label: "Elementos de Protección Personal (EPP)", required: true, multiline: true, rows: 4, placeholder: "Lista de EPP requerido para ejecutar la tarea de forma segura..." },
      { key: "riesgos", label: "Riesgos Asociados", required: true, multiline: true, rows: 4, placeholder: "Identificar los principales riesgos involucrados en la actividad..." },
      { key: "controles", label: "Medidas Preventivas y Controles", required: true, multiline: true, rows: 5, placeholder: "Controles de ingeniería, administrativos y EPP para cada riesgo identificado..." },
      { key: "secuencia", label: "Secuencia de Trabajo (Paso a Paso)", required: true, multiline: true, rows: 8, placeholder: "Paso 1: ...\nPaso 2: ...\nPaso 3: ..." },
      { key: "emergencias", label: "Procedimiento ante Emergencias", required: false, multiline: true, rows: 3, placeholder: "Acciones a tomar en caso de accidente o emergencia durante la ejecución..." },
      { key: "registros", label: "Registros y Control", required: false, multiline: true, rows: 2, placeholder: "Formularios, listas de asistencia u otros registros asociados..." },
    ],
  },
  {
    type: "Instructivo",
    label: "Instructivo de Trabajo Seguro",
    description: "Guía práctica para la ejecución segura de una tarea específica.",
    colorClass: "teal",
    sections: [
      { key: "nombre", label: "Nombre del Instructivo", required: true, multiline: false, placeholder: "Ej: ITS-001 Uso correcto de amoladora angular" },
      { key: "objetivo", label: "Objetivo", required: true, multiline: true, rows: 2, placeholder: "Propósito del instructivo..." },
      { key: "aplicacion", label: "Campo de Aplicación", required: true, multiline: true, rows: 2, placeholder: "Trabajadores, equipos o situaciones donde aplica..." },
      { key: "epp", label: "EPP Requerido", required: true, multiline: true, rows: 3, placeholder: "Lista de elementos de protección personal necesarios..." },
      { key: "pasos", label: "Pasos de Trabajo Seguro", required: true, multiline: true, rows: 8, placeholder: "1. ...\n2. ...\n3. ..." },
      { key: "prohibiciones", label: "Prohibiciones Específicas", required: false, multiline: true, rows: 3, placeholder: "Acciones que no se deben realizar durante esta tarea..." },
      { key: "emergencias", label: "Ante Emergencias", required: false, multiline: true, rows: 2, placeholder: "Qué hacer si ocurre un incidente..." },
    ],
  },
  {
    type: "PlanEmergencia",
    label: "Plan de Emergencia",
    description: "Organiza responsabilidades y acciones frente a situaciones de emergencia.",
    colorClass: "orange",
    sections: [
      { key: "objetivo", label: "Objetivo del Plan", required: true, multiline: true, rows: 3, placeholder: "Propósito y alcance del plan de emergencias..." },
      { key: "alcance", label: "Alcance", required: true, multiline: true, rows: 2, placeholder: "Faenas, instalaciones y personal cubierto por este plan..." },
      { key: "organizacion", label: "Organización de Emergencias", required: true, multiline: true, rows: 4, placeholder: "Estructura del comité o brigada de emergencias..." },
      { key: "roles", label: "Roles y Responsabilidades", required: true, multiline: true, rows: 5, placeholder: "Jefe de Emergencia: ...\nBrigadistas: ...\nTrabajadores: ..." },
      { key: "tipos", label: "Tipos de Emergencia Contemplados", required: true, multiline: true, rows: 4, placeholder: "Incendio, sismo, derrame, accidente grave..." },
      { key: "evacuacion", label: "Procedimiento de Evacuación", required: true, multiline: true, rows: 5, placeholder: "Señal de alarma → Vías de evacuación → Punto de encuentro..." },
      { key: "punto_encuentro", label: "Punto de Encuentro", required: true, multiline: false, placeholder: "Ubicación del punto de encuentro designado..." },
      { key: "comunicaciones", label: "Comunicaciones", required: true, multiline: true, rows: 3, placeholder: "Números de emergencia, protocolo de notificación..." },
      { key: "brigadas", label: "Brigadas y Equipos", required: false, multiline: true, rows: 4, placeholder: "Brigada de primeros auxilios, brigada contra incendios..." },
      { key: "simulacros", label: "Simulacros", required: false, multiline: true, rows: 2, placeholder: "Frecuencia y registro de simulacros planificados..." },
    ],
  },
  {
    type: "PoliticaSST",
    label: "Política de SST",
    description: "Declaración formal de la organización sobre Seguridad y Salud en el Trabajo.",
    colorClass: "purple",
    sections: [
      { key: "declaracion", label: "Declaración de la Alta Dirección", required: true, multiline: true, rows: 6, placeholder: "La organización [nombre] se compromete a...\n\nNuestra política reconoce que la seguridad y salud de nuestros trabajadores es un valor fundamental..." },
      { key: "compromisos", label: "Compromisos", required: true, multiline: true, rows: 6, placeholder: "1. Prevenir lesiones y enfermedades laborales.\n2. Cumplir con la legislación vigente.\n3. Proporcionar recursos suficientes.\n4. Mejorar continuamente..." },
      { key: "objetivos", label: "Objetivos Generales de SST", required: false, multiline: true, rows: 4, placeholder: "Reducir accidentabilidad, mejorar condiciones de trabajo..." },
      { key: "difusion", label: "Difusión y Revisión", required: false, multiline: true, rows: 2, placeholder: "Esta política será comunicada a todos los trabajadores y revisada anualmente..." },
      { key: "firma", label: "Firma y Fecha", required: true, multiline: false, placeholder: "Nombre del Gerente / Director / Responsable — Fecha de emisión" },
    ],
  },
];

export function useTechnicalDocs() {
  const { currentUser } = useLifeOnPreferences();
  const [documents, setDocuments] = useState<TechnicalDocument[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const orgId = currentUser?.orgId || "org_demo";
  const storageKey = useMemo(() => getScopedStorageKey(TECHNICAL_DOCS_STORAGE_KEY, orgId), [orgId]);

  const loadDocs = useCallback(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      if (stored) {
        const parsed: TechnicalDocsStorageData = JSON.parse(stored);
        setDocuments(parsed.documents || []);
      } else {
        setDocuments([]);
      }
    } catch {
      setDocuments([]);
    }

    if (isSupabaseConfigured()) {
      void fetchTechnicalDocuments(orgId).then((cloudDocs) => {
        if (cloudDocs.length > 0) {
          setDocuments(cloudDocs);
          try {
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                storageKey,
                JSON.stringify({ documents: cloudDocs, lastUpdated: new Date().toISOString() })
              );
            }
          } catch {
            /* noop */
          }
        }
      });
    }

    setIsLoaded(true);
  }, [storageKey, orgId]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  useEffect(() => {
    const handler = () => loadDocs();
    window.addEventListener(TECH_DOCS_CHANGE_EVENT, handler);
    return () => window.removeEventListener(TECH_DOCS_CHANGE_EVENT, handler);
  }, [loadDocs]);

  const persistDocs = useCallback(
    (updated: TechnicalDocument[]) => {
      const data: TechnicalDocsStorageData = { documents: updated, lastUpdated: new Date().toISOString() };
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, JSON.stringify(data));
          window.dispatchEvent(new CustomEvent(TECH_DOCS_CHANGE_EVENT, { detail: updated }));
        }
      } catch { /* noop */ }
      setDocuments(updated);
      if (isSupabaseConfigured()) {
        void getSupabaseAuthUserId().then((authId) => {
          void Promise.all(
            updated.map((doc) => upsertTechnicalDocument(orgId, doc, authId))
          );
        });
      }
    },
    [storageKey, orgId]
  );

  const createDocument = useCallback(
    (documentType: DocumentType, name: string, createdBy?: string) => {
      const newDoc: TechnicalDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        organizationId: orgId,
        documentType,
        name,
        status: "Borrador",
        content: {},
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persistDocs([...documents, newDoc]);
      return newDoc;
    },
    [documents, persistDocs, orgId]
  );

  const updateDocument = useCallback(
    (docId: string, updates: Partial<TechnicalDocument>) => {
      const updated = documents.map((d) =>
        d.id === docId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      );
      persistDocs(updated);
    },
    [documents, persistDocs]
  );

  const deleteDocument = useCallback(
    (docId: string) => {
      persistDocs(documents.filter((d) => d.id !== docId));
      if (isSupabaseConfigured()) {
        void deleteTechnicalDocument(orgId, docId);
      }
    },
    [documents, persistDocs, orgId]
  );

  const getTypeDefinition = useCallback((type: DocumentType) => {
    return DOCUMENT_TYPE_DEFINITIONS.find((d) => d.type === type);
  }, []);

  const totalDocsCount = documents.length;
  const draftCount = useMemo(() => documents.filter((d) => d.status === "Borrador").length, [documents]);
  const vigentCount = useMemo(() => documents.filter((d) => d.status === "Vigente").length, [documents]);

  return {
    documents,
    isLoaded,
    createDocument,
    updateDocument,
    deleteDocument,
    getTypeDefinition,
    documentTypeDefinitions: DOCUMENT_TYPE_DEFINITIONS,
    totalDocsCount,
    draftCount,
    vigentCount,
  };
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ProgramActivity,
  ActivityEvidence,
  PreventiveProgramMetrics,
  ActivityCategory,
  ActivityStatus,
} from "@/types/preventiveProgram";
import { useLifeOnPreferences } from "./useLifeOnPreferences";
import { getScopedStorageKey } from "@/lib/auth/authService";
import {
  savePreventiveActivitiesToSupabase,
  fetchPreventiveActivitiesFromSupabase,
} from "@/lib/services/supabaseService";

export const PREVENTIVE_PROGRAM_STORAGE_KEY = "lifeon_preventive_program";

export const BASE_ANNUAL_PROGRAM_TEMPLATES: Omit<ProgramActivity, "id">[] = [
  // 1. Planificación y Gestión
  {
    code: "PLN-01",
    name: "Elaboración y Aprobación del Programa Anual de Trabajo en Gestión de Riesgos",
    description: "Definición formal de objetivos, metas, recursos, cronograma y responsabilidades para el período anual 2026.",
    objective: "Establecer la directriz estratégica y operativa de prevención de la organización.",
    category: "Planificación y Gestión",
    startDate: "2026-01-05",
    endDate: "2026-01-25",
    periodicity: "Anual",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [
      {
        id: "ev-pln-1",
        name: "Resolucion_Aprobacion_Programa_Anual_2026.pdf",
        type: "Documento",
        uploadedAt: "2026-01-24",
        fileSize: "1.8 MB",
      },
    ],
    observations: "Aprobado por Gerencia General y Dirección Técnica.",
  },
  {
    code: "PLN-02",
    name: "Revisión Inicial de Cumplimiento Legal y Verificación de Estructura Preventiva",
    description: "Evaluación diagnóstica del estado de cumplimiento frente a normativa aplicable (DS 44, Ley 16.744, DS 594).",
    objective: "Identificar brechas normativas antes de iniciar el ciclo operativo anual.",
    category: "Planificación y Gestión",
    startDate: "2026-01-20",
    endDate: "2026-02-15",
    periodicity: "Semestral",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [
      {
        id: "ev-pln-2",
        name: "Informe_Auditoria_Inicial_DS44.pdf",
        type: "Informe",
        uploadedAt: "2026-02-14",
        fileSize: "2.1 MB",
      },
    ],
  },
  {
    code: "PLN-03",
    name: "Seguimiento Periódico Mensual y Control de Indicadores de Desempeño",
    description: "Revisión sistemática mensual del avance de actividades preventivas e indicadores de siniestralidad.",
    objective: "Asegurar la ejecución continua y oportuna del programa de trabajo.",
    category: "Planificación y Gestión",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    periodicity: "Mensual",
    applicability: "Base",
    status: "En curso",
    progress: 65,
    evidences: [],
  },

  // 2. Matrices de Riesgos
  {
    code: "RSK-01",
    name: "Revisión y Actualización Periódica de Matrices IPER",
    description: "Reevaluación de los peligros, estimación de probabilidad/consecuencia y verificación de controles existentes.",
    objective: "Mantener actualizada la identificación de peligros y evaluación de riesgos en todos los procesos.",
    category: "Gestión de Riesgos",
    startDate: "2026-02-01",
    endDate: "2026-03-15",
    periodicity: "Trimestral",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [
      {
        id: "ev-rsk-1",
        name: "Acta_Aprobacion_Matrices_Vigentes_2026.pdf",
        type: "Documento",
        uploadedAt: "2026-03-12",
        fileSize: "1.1 MB",
      },
    ],
    observations: "Matrices de Montaje y Obra Gruesa actualizadas a estado Vigente.",
  },
  {
    code: "RSK-02",
    name: "Identificación de Peligros por Modificaciones de Procesos o Nuevos Equipos",
    description: "Levantamiento preventivo de riesgos ante introducción de nuevas tecnologías, herramientas o cambios en el entorno laboral.",
    objective: "Prevenir la materialización de riesgos no evaluados previamente.",
    category: "Gestión de Riesgos",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    periodicity: "Según necesidad",
    applicability: "Recomendada",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "RSK-03",
    name: "Seguimiento y Verificación de Efectividad de Medidas de Control Crítico",
    description: "Auditoría en terreno para constatar la correcta aplicación de barreras duras y controles preventivos.",
    objective: "Garantizar que las medidas de control mitiguen efectivamente los riesgos de alto potencial.",
    category: "Gestión de Riesgos",
    startDate: "2026-03-10",
    endDate: "2026-03-28",
    periodicity: "Mensual",
    applicability: "Base",
    status: "En curso",
    progress: 50,
    evidences: [],
  },

  // 3. Información de Riesgos Laborales (IRL)
  {
    code: "IRL-01",
    name: "Elaboración y Consolidación de Información de Riesgos Laborales (IRL) por Cargo",
    description: "Generación de las fichas IRL basadas exclusivamente en las Matrices IPER vigentes de cada cargo expuesto.",
    objective: "Estructurar la información técnica de peligros y medidas preventivas aplicables a cada función.",
    category: "Información de Riesgos Laborales (IRL)",
    startDate: "2026-02-15",
    endDate: "2026-03-05",
    periodicity: "Semestral",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [
      {
        id: "ev-irl-1",
        name: "Fichas_IRL_Consolidadas_Cargos_Operativos.pdf",
        type: "Documento",
        uploadedAt: "2026-03-04",
        fileSize: "2.4 MB",
      },
    ],
  },
  {
    code: "IRL-02",
    name: "Entrega Formal y Registro de Conocimiento del IRL a Trabajadores Nuevos y Activos",
    description: "Difusión presencial de los riesgos inherentes al cargo, medidas obligatorias de control y firma de comprobante individual.",
    objective: "Garantizar el conocimiento efectivo de los riesgos laborales por parte de cada colaborador.",
    category: "Información de Riesgos Laborales (IRL)",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    periodicity: "Mensual",
    applicability: "Base",
    status: "En curso",
    progress: 75,
    evidences: [
      {
        id: "ev-irl-2",
        name: "Comprobantes_Recepcion_IRL_Cuadrilla_1.pdf",
        type: "Registro",
        uploadedAt: "2026-03-15",
        fileSize: "950 KB",
      },
    ],
  },
  {
    code: "IRL-03",
    name: "Actualización de Fichas IRL ante Cambios en Matrices Vigentes",
    description: "Revisión inmediata de los documentos de información a los trabajadores cuando se modifiquen controles o procesos.",
    objective: "Asegurar congruencia permanente entre la matriz técnica y la información al colaborador.",
    category: "Información de Riesgos Laborales (IRL)",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    periodicity: "Semestral",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },

  // 4. Medidas de Control
  {
    code: "CTL-01",
    name: "Auditoría en Terreno a Protecciones Colectivas y Barreras Físicas",
    description: "Inspección técnica de barandas perimetrales, mallas anticaídas, tapaderas de shafts y delimitaciones de zonas de izaje.",
    objective: "Asegurar la integridad y estabilidad de los controles de ingeniería en obra.",
    category: "Gestión de Riesgos",
    startDate: "2026-04-05",
    endDate: "2026-04-25",
    periodicity: "Trimestral",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "CTL-02",
    name: "Programa de Mantenimiento Preventivo e Inspección de Maquinaria y Equipos Críticos",
    description: "Verificación de pautas de mantenimiento de grúas torre, elevadores, generadores y herramientas eléctricas de alto torque.",
    objective: "Evitar fallas operacionales que pongan en riesgo la vida o integridad de los trabajadores.",
    category: "Gestión de Riesgos",
    startDate: "2026-05-02",
    endDate: "2026-05-20",
    periodicity: "Mensual",
    applicability: "Recomendada",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },

  // 5. Capacitación y Difusión
  {
    code: "CAP-01",
    name: "Capacitación Práctica: Uso Correcto y Revisión de SPDC (Arnés de Seguridad)",
    description: "Instrucción obligatoria en terreno sobre puntos de anclaje, líneas de vida y cálculo de caída libre según DS 44.",
    objective: "Asegurar el correcto anclaje y uso de sistemas de protección contra caídas.",
    category: "Capacitación y Difusión",
    startDate: "2026-03-01",
    endDate: "2026-03-15",
    periodicity: "Trimestral",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [
      {
        id: "ev-cap-1",
        name: "Registro_Asistencia_SPDC_28_trabajadores.pdf",
        type: "Registro",
        uploadedAt: "2026-03-12",
        fileSize: "1.4 MB",
      },
      {
        id: "ev-cap-2",
        name: "Fotografia_Capacitacion_Andamios.jpg",
        type: "Fotografía",
        uploadedAt: "2026-03-12",
        fileSize: "3.2 MB",
      },
    ],
    observations: "Asistencia completa de la cuadrilla de montaje (28 colaboradores).",
  },
  {
    code: "CAP-02",
    name: "Inducción Básica de Seguridad para Nuevos Ingresos (DS 44 / Obligación de Informar)",
    description: "Instrucción inicial sobre políticas de seguridad, riesgos del centro de trabajo y normas básicas de conducta.",
    objective: "Asegurar que ningún trabajador inicie labores sin su inducción aprobada.",
    category: "Capacitación y Difusión",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    periodicity: "Mensual",
    applicability: "Base",
    status: "En curso",
    progress: 80,
    evidences: [],
  },
  {
    code: "CAP-03",
    name: "Charlas Operativas Diarias de 5 Minutos y Análisis de Tareas Críticas",
    description: "Reuniones breves de coordinación diaria previas al inicio de cada jornada en los frentes de trabajo.",
    objective: "Alinear a las cuadrillas en los controles críticos específicos del día.",
    category: "Capacitación y Difusión",
    startDate: "2026-03-01",
    endDate: "2026-12-31",
    periodicity: "Mensual",
    applicability: "Recomendada",
    status: "En curso",
    progress: 55,
    evidences: [],
  },
  {
    code: "CAP-04",
    name: "Taller Práctico de Primeros Auxilios, RCP y Uso de Extintores Portátiles",
    description: "Entrenamiento de campo en respuesta rápida frente a heridas, paros cardiorrespiratorios y principios de incendio.",
    objective: "Desarrollar habilidades de primera intervención de emergencia en el personal de terreno.",
    category: "Capacitación y Difusión",
    startDate: "2026-07-06",
    endDate: "2026-07-24",
    periodicity: "Semestral",
    applicability: "Recomendada",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },

  // 6. Reglamentación (RIOHS)
  {
    code: "REG-01",
    name: "Revisión Anual y Actualización del Reglamento Interno de Orden, Higiene y Seguridad",
    description: "Revisión integral del RIOHS para incorporar nuevas disposiciones normativas, sanciones y procedimientos de denuncia.",
    objective: "Mantener el marco reglamentario laboral y preventivo plenamente actualizado.",
    category: "Reglamentación (RIOHS)",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    periodicity: "Anual",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "REG-02",
    name: "Entrega Formal del RIOHS Actualizado a Trabajadores y Remisión a Autoridades",
    description: "Distribución física o digital a los colaboradores y envío de copias al Ministerio de Salud y Dirección del Trabajo.",
    objective: "Dar cumplimiento cabal al procedimiento de vigencia y publicidad del reglamento.",
    category: "Reglamentación (RIOHS)",
    startDate: "2026-05-01",
    endDate: "2026-05-20",
    periodicity: "Anual",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },

  // 7. Emergencias y Evacuación
  {
    code: "EMG-01",
    name: "Actualización del Plan de Emergencia, Vías de Evacuación y Roles de Brigada",
    description: "Revisión de planos, zonas de seguridad, directores de evacuación y coordinación con cuerpos de rescate.",
    objective: "Preparar a la organización para responder de forma rápida y segura ante emergencias.",
    category: "Emergencias y Evacuación",
    startDate: "2026-02-10",
    endDate: "2026-02-28",
    periodicity: "Semestral",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [],
  },
  {
    code: "EMG-02",
    name: "Simulacro General de Evacuación y Evaluación de Tiempos de Respuesta",
    description: "Activación programada de alarma, evacuación total hacia zonas seguras y medición de tiempos con informe de lecciones aprendidas.",
    objective: "Poner a prueba la capacidad de respuesta y detectar oportunidades de mejora.",
    category: "Emergencias y Evacuación",
    startDate: "2026-06-10",
    endDate: "2026-06-25",
    periodicity: "Semestral",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "EMG-03",
    name: "Inspección Mensual de Extintores, Red Húmeda y Botiquines de Primeros Auxilios",
    description: "Chequeo de presurización, vencimiento de carga, accesibilidad y señalética de los equipos de extinción y primeros auxilios.",
    objective: "Asegurar la total disponibilidad operativa de los recursos de emergencia.",
    category: "Emergencias y Evacuación",
    startDate: "2026-03-05",
    endDate: "2026-03-20",
    periodicity: "Mensual",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [],
  },

  // 8. Vigilancia y Salud Ocupacional (Protocolos MINSAL)
  {
    code: "SAL-01",
    name: "Vigilancia de Agentes Físicos y Aplicación de Protocolo PREXOR (Ruido Ocupacional)",
    description: "Monitoreo cuantitativo y dosimetrías de ruido en puestos con maquinaria pesada y herramientas percutoras.",
    objective: "Prevenir hipoacusia neurosensorial laboral en personal expuesto a fuentes de ruido continuo.",
    category: "Vigilancia y Salud Ocupacional",
    startDate: "2026-03-01",
    endDate: "2026-04-15",
    periodicity: "Semestral",
    applicability: "Según aplicabilidad",
    status: "Atrasada",
    progress: 30,
    evidences: [],
    observations: "Pendiente informe de dosimetría de ruido emitido por el organismo administrador.",
  },
  {
    code: "SAL-02",
    name: "Vigilancia Ambiental y de Salud por Exposición a Sílice Libre (Protocolo PLANESI)",
    description: "Muestreo gravimétrico en tareas de corte de hormigón, demolición y picado de estructuras minerales.",
    objective: "Prevenir silicosis y validar efectividad de captadores de polvo y humectación.",
    category: "Vigilancia y Salud Ocupacional",
    startDate: "2026-05-05",
    endDate: "2026-06-15",
    periodicity: "Semestral",
    applicability: "Según aplicabilidad",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "SAL-03",
    name: "Evaluación Ergonómica de Puestos de Trabajo y Manejo Manual de Cargas (TMERT / MMC)",
    description: "Aplicación de listas de chequeo iniciales de extremidades superiores y evaluación de límites máximos de carga humana.",
    objective: "Reducir la incidencia de trastornos musculoesqueléticos en labores de carguío y montaje.",
    category: "Vigilancia y Salud Ocupacional",
    startDate: "2026-07-01",
    endDate: "2026-07-30",
    periodicity: "Semestral",
    applicability: "Según aplicabilidad",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "SAL-04",
    name: "Cuestionario de Evaluación de Ambientes Laborales CEAL-SM / SUSESO-ISTAS 21",
    description: "Aplicación bienal del instrumento de evaluación psicosocial, tabulación anónima de resultados y plan de mitigación.",
    objective: "Identificar y gestionar factores de riesgo psicosocial en las distintas áreas de la empresa.",
    category: "Vigilancia y Salud Ocupacional",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    periodicity: "Anual",
    applicability: "Según aplicabilidad",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "SAL-05",
    name: "Coordinación de Evaluaciones Médicas Ocupacionales con Organismo Administrador",
    description: "Programación de exámenes pre-ocupacionales y ocupacionales para trabajadores expuestos a riesgos de gran altura y ruido.",
    objective: "Verificar la aptitud laboral y resguardar la salud de los colaboradores.",
    category: "Vigilancia y Salud Ocupacional",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    periodicity: "Anual",
    applicability: "Según aplicabilidad",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },

  // 9. Inspecciones y Verificaciones
  {
    code: "INS-01",
    name: "Inspección Mensual de Andamios Modulares y Superficies de Trabajo (NCh 998)",
    description: "Revisión de tarjetas verde/roja, arriostramientos, rodapiés, barandas perimetrales y bases de nivelación.",
    objective: "Asegurar condiciones seguras para la ejecución de trabajos en altura física.",
    category: "Inspecciones y Verificaciones",
    startDate: "2026-03-10",
    endDate: "2026-03-24",
    periodicity: "Mensual",
    applicability: "Base",
    status: "En curso",
    progress: 60,
    evidences: [
      {
        id: "ev-ins-1",
        name: "Checklist_Andamios_Fase_A.pdf",
        type: "Registro",
        uploadedAt: "2026-03-18",
        fileSize: "850 KB",
      },
    ],
    observations: "Falta certificar el sector de torre B antes del viernes.",
  },
  {
    code: "INS-02",
    name: "Inspecciones Planeadas de Seguridad en Instalaciones y Frentes de Trabajo",
    description: "Verificación de orden y aseo, estado de herramientas eléctricas, protecciones de máquinas y cableado.",
    objective: "Identificar y corregir de manera proactiva condiciones físicas peligrosas.",
    category: "Inspecciones y Verificaciones",
    startDate: "2026-03-01",
    endDate: "2026-03-20",
    periodicity: "Mensual",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [],
  },
  {
    code: "INS-03",
    name: "Inspección Técnica de Tableros Eléctricos e Instalaciones Provisionales",
    description: "Revisión de disyuntores diferenciales, puestas a tierra, hermeticidad de gabinetes y cableado aéreo según SEC.",
    objective: "Prevenir contactos eléctricos directos, indirectos o incendios por sobrecarga.",
    category: "Inspecciones y Verificaciones",
    startDate: "2026-08-05",
    endDate: "2026-08-20",
    periodicity: "Trimestral",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "INS-04",
    name: "Programa Mensual de Observaciones Preventivas de Seguridad (OPS) en Terreno",
    description: "Observación estructurada del comportamiento de los trabajadores durante tareas operativas críticas.",
    objective: "Detectar actos inseguros, reforzar conductas correctas y retroalimentar oportunamente.",
    category: "Inspecciones y Verificaciones",
    startDate: "2026-03-01",
    endDate: "2026-12-31",
    periodicity: "Mensual",
    applicability: "Recomendada",
    status: "En curso",
    progress: 45,
    evidences: [],
  },

  // 10. Gestión de Incidentes
  {
    code: "INC-01",
    name: "Investigación Inmediata de Incidentes y Accidentes de Trabajo",
    description: "Aplicación de metodología de causa raíz ante la ocurrencia de accidentes del trabajo o cuasi-accidentes significativos.",
    objective: "Determinar las causas básicas y adoptar medidas correctivas para evitar su repetición.",
    category: "Gestión de Incidentes",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    periodicity: "Según necesidad",
    applicability: "Base",
    status: "En curso",
    progress: 80,
    evidences: [],
  },
  {
    code: "INC-02",
    name: "Seguimiento y Cierre de Medidas Correctivas Derivadas de Incidentes",
    description: "Comprobación de la implementación de acciones comprometidas en informes de investigación.",
    objective: "Garantizar el cierre efectivo de las no conformidades detectadas.",
    category: "Gestión de Incidentes",
    startDate: "2026-03-01",
    endDate: "2026-03-31",
    periodicity: "Mensual",
    applicability: "Base",
    status: "Cumplida",
    progress: 100,
    evidences: [],
  },

  // 11. Participación y CPHS
  {
    code: "PAR-01",
    name: "Reuniones Ordinarias Mensuales del Comité Paritario de Higiene y Seguridad",
    description: "Revisión de cartas de aviso, investigación de cuasi-accidentes y fiscalización de medidas DS 44.",
    objective: "Fomentar la participación activa de los trabajadores en la gestión de seguridad.",
    category: "Participación y CPHS",
    startDate: "2026-03-05",
    endDate: "2026-03-12",
    periodicity: "Mensual",
    applicability: "Según aplicabilidad",
    status: "Cumplida",
    progress: 100,
    evidences: [
      {
        id: "ev-cphs-1",
        name: "Acta_CPHS_Marzo_2026.pdf",
        type: "Documento",
        uploadedAt: "2026-03-10",
        fileSize: "920 KB",
      },
    ],
    observations: "Acta firmada y remitida al organismo administrador ACHS.",
  },
  {
    code: "PAR-02",
    name: "Inspecciones Conjuntas de Terreno con Integrantes del Comité Paritario",
    description: "Recorridos programados por las áreas operativas con representantes de los trabajadores para detectar condiciones subestándar.",
    objective: "Fortalecer la supervisión compartida y la cultura preventiva en terreno.",
    category: "Participación y CPHS",
    startDate: "2026-04-05",
    endDate: "2026-04-20",
    periodicity: "Mensual",
    applicability: "Recomendada",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },

  // 12. Gestión de Contratistas y Subcontratos
  {
    code: "CON-01",
    name: "Auditoría de Cumplimiento Preventivo a Empresas Contratistas y Subcontratos (Ley 20.123)",
    description: "Revisión documental de afiliación a mutualidad, programa preventivo, reglamento especial y matrices IPER de terceros.",
    objective: "Garantizar el estándar de seguridad integral en la cadena de subcontratación.",
    category: "Gestión de Contratistas",
    startDate: "2026-05-10",
    endDate: "2026-05-30",
    periodicity: "Trimestral",
    applicability: "Según aplicabilidad",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "CON-02",
    name: "Verificación de Fichas de Seguridad, EPP y Contratos de Trabajo de Personal Externo",
    description: "Control de acceso a obra validando entrega de EPP certificado y acreditación técnica de trabajadores contratistas.",
    objective: "Impedir el ingreso de personal no calificado o sin resguardos a faenas críticas.",
    category: "Gestión de Contratistas",
    startDate: "2026-10-01",
    endDate: "2026-10-20",
    periodicity: "Trimestral",
    applicability: "Según aplicabilidad",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },

  // 13. Documentación y Registros
  {
    code: "DOC-01",
    name: "Auditoría de Registros de Entrega de EPP y Certificados Técnicos",
    description: "Control de carpetas físicas y digitales de comprobantes de entrega de EPP y certificaciones de equipos.",
    objective: "Asegurar el respaldo documental y trazabilidad de los elementos asignados.",
    category: "Documentación y Registros",
    startDate: "2026-03-15",
    endDate: "2026-03-31",
    periodicity: "Trimestral",
    applicability: "Base",
    status: "En curso",
    progress: 50,
    evidences: [],
  },
  {
    code: "DOC-02",
    name: "Revisión de Procedimientos de Trabajo Seguro (PTS) y Permisos de Trabajo Especial",
    description: "Actualización de documentos operacionales para trabajos en caliente, espacios confinados y excavaciones.",
    objective: "Estandarizar métodos seguros de trabajo para tareas críticas.",
    category: "Documentación y Registros",
    startDate: "2026-04-01",
    endDate: "2026-04-25",
    periodicity: "Semestral",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },

  // 14. Cierre y Evaluación Anual
  {
    code: "CIE-01",
    name: "Evaluación Final de Cumplimiento de Metas del Programa Anual",
    description: "Cálculo consolidado de porcentaje de ejecución, tasa de accidentabilidad, índice de gravedad y metas alcanzadas.",
    objective: "Medir la eficacia del sistema preventivo y determinar el grado de éxito global.",
    category: "Cierre y Evaluación Anual",
    startDate: "2026-11-15",
    endDate: "2026-12-15",
    periodicity: "Anual",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
  {
    code: "CIE-02",
    name: "Elaboración de Informe Anual de Gestión y Definición de Metas para el Periodo Siguiente",
    description: "Consolidación de conclusiones, lecciones aprendidas y formulación del proyecto de programa para 2027.",
    objective: "Garantizar la mejora continua del sistema de gestión de riesgos laborales.",
    category: "Cierre y Evaluación Anual",
    startDate: "2026-12-01",
    endDate: "2026-12-30",
    periodicity: "Anual",
    applicability: "Base",
    status: "Pendiente",
    progress: 0,
    evidences: [],
  },
];

export const DEMO_PREVENTIVE_ACTIVITIES: ProgramActivity[] = BASE_ANNUAL_PROGRAM_TEMPLATES.map(
  (tpl, idx) => ({
    ...tpl,
    id: `act-demo-${idx + 1}`,
    areaName: idx % 2 === 0 ? "Montaje y Estructuras" : "Faena Principal",
    responsibleUserName: idx % 3 === 0 ? "Sergio A. Jara Astete" : idx % 3 === 1 ? "Patricio Gómez Valenzuela" : "Carlos Mendoza Riquelme",
    responsiblePositionName: idx % 3 === 0 ? "Experto en Prevención de Riesgos" : idx % 3 === 1 ? "Supervisor de Operaciones y Montaje" : "Jefe de Terreno",
  })
);

export function usePreventiveProgram() {
  const { currentUser, configurePreventivePlanningModule } = useLifeOnPreferences();
  const [activities, setActivities] = useState<ProgramActivity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const orgId = currentUser?.orgId || "org_demo";
  const storageKey = useMemo(
    () => getScopedStorageKey(PREVENTIVE_PROGRAM_STORAGE_KEY, orgId),
    [orgId]
  );

  // Cargar estado inicial según organización y sincronizar con Supabase
  useEffect(() => {
    let localActivities: ProgramActivity[] | null = null;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localActivities = parsed;
          setActivities(parsed);
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar el programa preventivo:", e);
    }

    if (!localActivities) {
      if (orgId !== "org_demo") {
        setActivities([]);
      } else {
        setActivities(DEMO_PREVENTIVE_ACTIVITIES);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(DEMO_PREVENTIVE_ACTIVITIES));
        } catch (_) {}
      }
    }

    // Hidratar desde Supabase como fuente definitiva de verdad
    fetchPreventiveActivitiesFromSupabase(orgId)
      .then((cloudActivities) => {
        if (cloudActivities && Array.isArray(cloudActivities) && cloudActivities.length > 0) {
          setActivities(cloudActivities);
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(cloudActivities));
          } catch (_) {}
        } else if (localActivities && localActivities.length > 0 && orgId !== "org_demo") {
          // Si teníamos datos locales no sincronizados en la nube, persistirlos
          savePreventiveActivitiesToSupabase(localActivities, orgId);
        }
      })
      .catch((err) => {
        console.warn("Error hidratando actividades preventivas de Supabase:", err);
      })
      .finally(() => {
        setIsLoaded(true);
      });

    const handleProgSync = (e: any) => {
      if (e?.detail?.activities) {
        if (!e.detail.orgId || e.detail.orgId === orgId) {
          setActivities(e.detail.activities);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("lifeon-preventive-program-change", handleProgSync);
      window.addEventListener("lifeon-session-change", handleProgSync);
      window.addEventListener("storage", handleProgSync);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("lifeon-preventive-program-change", handleProgSync);
        window.removeEventListener("lifeon-session-change", handleProgSync);
        window.removeEventListener("storage", handleProgSync);
      }
    };
  }, [storageKey, orgId]);

  // Persistir en localStorage y en Supabase
  const persistActivities = useCallback(
    (newActivities: ProgramActivity[]) => {
      setActivities(newActivities);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(newActivities));
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("lifeon-preventive-program-change", {
              detail: { orgId, activities: newActivities },
            })
          );
        }
      } catch (e) {
        console.warn("Error guardando programa preventivo en localStorage:", e);
      }
      savePreventiveActivitiesToSupabase(newActivities, orgId);
      if (newActivities.length > 0) {
        configurePreventivePlanningModule(true, "upload_existing");
      }
    },
    [storageKey, orgId, configurePreventivePlanningModule]
  );

  // CRUD Actividades
  const addActivity = useCallback(
    (item: Omit<ProgramActivity, "id" | "evidences"> & { evidences?: ActivityEvidence[] }) => {
      const newAct: ProgramActivity = {
        ...item,
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        evidences: item.evidences || [],
      };
      const updated = [...activities, newAct];
      persistActivities(updated);
      return newAct;
    },
    [activities, persistActivities]
  );

  const updateActivity = useCallback(
    (id: string, updates: Partial<ProgramActivity>) => {
      const updated = activities.map((a) => (a.id === id ? { ...a, ...updates } : a));
      persistActivities(updated);
    },
    [activities, persistActivities]
  );

  const deleteActivity = useCallback(
    (id: string) => {
      const updated = activities.filter((a) => a.id !== id);
      persistActivities(updated);
    },
    [activities, persistActivities]
  );

  // Gestión de Evidencias
  const addEvidence = useCallback(
    (activityId: string, evidence: Omit<ActivityEvidence, "id" | "uploadedAt">) => {
      const newEv: ActivityEvidence = {
        ...evidence,
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        uploadedAt: new Date().toISOString().split("T")[0],
      };

      const updated = activities.map((a) => {
        if (a.id === activityId) {
          return {
            ...a,
            evidences: [...a.evidences, newEv],
          };
        }
        return a;
      });

      persistActivities(updated);
      return newEv;
    },
    [activities, persistActivities]
  );

  const removeEvidence = useCallback(
    (activityId: string, evidenceId: string) => {
      const updated = activities.map((a) => {
        if (a.id === activityId) {
          return {
            ...a,
            evidences: a.evidences.filter((e) => e.id !== evidenceId),
          };
        }
        return a;
      });

      persistActivities(updated);
    },
    [activities, persistActivities]
  );

  // Generar Programa de Trabajo Base Anual Completo
  const generateBaseProgram = useCallback(
    (defaultAreaName?: string, defaultResponsibleName?: string) => {
      const area = defaultAreaName || "Área Operativa Principal";
      const resp = defaultResponsibleName || "Prevencionista de Riesgos";

      const baseProgram: ProgramActivity[] = BASE_ANNUAL_PROGRAM_TEMPLATES.map((tpl, idx) => ({
        ...tpl,
        id: `act-base-${Date.now()}-${idx + 1}`,
        areaName: area,
        responsibleUserName: resp,
        evidences: [],
        status: "Pendiente",
        progress: 0,
      }));

      persistActivities(baseProgram);
      return baseProgram;
    },
    [persistActivities]
  );

  // Cargar programa existente estructurado
  const importExistingProgramActivities = useCallback(
    (importedList: ProgramActivity[]) => {
      persistActivities(importedList);
    },
    [persistActivities]
  );

  // Métricas agregadas del programa
  const metrics: PreventiveProgramMetrics = useMemo(() => {
    const total = activities.length;
    if (total === 0) {
      return {
        totalActivities: 0,
        completedActivities: 0,
        inProgressActivities: 0,
        pendingActivities: 0,
        overdueActivities: 0,
        upcomingActivities: 0,
        compliancePercentage: 0,
        byCategory: {},
        byArea: {},
        byResponsible: {},
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const today = new Date();
    const fifteenDaysAhead = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let overdue = 0;
    let upcoming = 0;

    const byCat: Record<string, { total: number; completed: number; inProgress: number; pending: number; overdue: number }> = {};
    const byAr: Record<string, { total: number; completed: number; percentage: number }> = {};
    const byResp: Record<string, { total: number; completed: number; percentage: number }> = {};

    activities.forEach((a) => {
      const isCompl = a.status === "Cumplida";
      const isOver = a.status === "Atrasada" || (!isCompl && a.endDate < todayStr);
      const isInProg = a.status === "En curso" && !isOver;
      const isPend = a.status === "Pendiente" && !isOver;

      if (isCompl) completed++;
      else if (isOver) overdue++;
      else if (isInProg) inProgress++;
      else pending++;

      // Próximas a vencer: no cumplidas, con fecha de término entre hoy y 15 días más
      if (!isCompl && a.endDate >= todayStr && a.endDate <= fifteenDaysAhead) {
        upcoming++;
      }

      // Por categoría
      const cat = a.category || "Otras Actividades";
      if (!byCat[cat]) {
        byCat[cat] = { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 };
      }
      byCat[cat].total++;
      if (isCompl) byCat[cat].completed++;
      else if (isOver) byCat[cat].overdue++;
      else if (isInProg) byCat[cat].inProgress++;
      else byCat[cat].pending++;

      // Por área
      const ar = a.areaName || "General";
      if (!byAr[ar]) {
        byAr[ar] = { total: 0, completed: 0, percentage: 0 };
      }
      byAr[ar].total++;
      if (isCompl) byAr[ar].completed++;

      // Por responsable
      const resp = a.responsibleUserName || "No asignado";
      if (!byResp[resp]) {
        byResp[resp] = { total: 0, completed: 0, percentage: 0 };
      }
      byResp[resp].total++;
      if (isCompl) byResp[resp].completed++;
    });

    // Calcular porcentajes
    Object.keys(byAr).forEach((key) => {
      byAr[key].percentage = Math.round((byAr[key].completed / byAr[key].total) * 100);
    });
    Object.keys(byResp).forEach((key) => {
      byResp[key].percentage = Math.round((byResp[key].completed / byResp[key].total) * 100);
    });

    const compliance = Math.round((completed / total) * 100);

    return {
      totalActivities: total,
      completedActivities: completed,
      inProgressActivities: inProgress,
      pendingActivities: pending,
      overdueActivities: overdue,
      upcomingActivities: upcoming,
      compliancePercentage: compliance,
      byCategory: byCat,
      byArea: byAr,
      byResponsible: byResp,
    };
  }, [activities]);

  return {
    activities,
    metrics,
    isLoaded,
    addActivity,
    updateActivity,
    deleteActivity,
    addEvidence,
    removeEvidence,
    generateBaseProgram,
    importExistingProgramActivities,
  };
}

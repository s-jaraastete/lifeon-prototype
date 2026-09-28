import type { ArtpChangeCategory } from "@/types/artp";

export type ArtpChangeQuestionDef = {
  id: string;
  category: ArtpChangeCategory;
  question: string;
};

export type ArtpChangeSectionDef = {
  category: ArtpChangeCategory;
  title: string;
  description: string;
  questions: ArtpChangeQuestionDef[];
};

export const ARTP_CHANGE_SECTION_LABELS = [
  "Personas",
  "Entorno",
  "Herramientas y/o Equipos",
] as const;

export const ARTP_CHANGE_SECTIONS: ArtpChangeSectionDef[] = [
  {
    category: "personas",
    title: "Cambios en las personas",
    description:
      "Verifique que quienes ejecutarán la tarea coinciden con lo planificado y están en condiciones de realizarla.",
    questions: [
      {
        id: "personas_asignadas",
        category: "personas",
        question:
          "¿Las personas asignadas para ejecutar la tarea son las mismas que fueron consideradas en la planificación?",
      },
      {
        id: "personas_cantidad",
        category: "personas",
        question:
          "¿La cantidad de trabajadores es la adecuada para realizar la tarea de forma segura?",
      },
      {
        id: "personas_competencias",
        category: "personas",
        question:
          "¿Todos los trabajadores cuentan con las competencias, instrucción y autorización necesarias para la tarea?",
      },
      {
        id: "personas_aptitud",
        category: "personas",
        question:
          "¿Todos declaran encontrarse aptos (sin fatiga, alcohol, drogas u otras condiciones que afecten la seguridad)?",
      },
    ],
  },
  {
    category: "entorno",
    title: "Cambios en el entorno",
    description:
      "Confirme que el lugar y las condiciones ambientales son los previstos antes de iniciar.",
    questions: [
      {
        id: "entorno_lugar",
        category: "entorno",
        question:
          "¿El lugar específico de trabajo corresponde al planificado y se encuentra accesible y delimitado?",
      },
      {
        id: "entorno_condiciones",
        category: "entorno",
        question:
          "¿Las condiciones del entorno (iluminación, ventilación, clima, orden y aseo) son adecuadas para la tarea?",
      },
      {
        id: "entorno_interferencias",
        category: "entorno",
        question:
          "¿Se verificó que no existen interferencias con otras tareas, tránsito de personas o equipos en el área?",
      },
      {
        id: "entorno_permisos",
        category: "entorno",
        question:
          "¿Existen los permisos de trabajo, bloqueos o autorizaciones requeridas y se encuentran vigentes?",
      },
    ],
  },
  {
    category: "herramientas",
    title: "Cambios en herramientas y/o equipos esenciales",
    description:
      "Revise que los medios de la tarea sean los planificados y estén en condiciones de uso seguro.",
    questions: [
      {
        id: "herramientas_correspondencia",
        category: "herramientas",
        question:
          "¿Las herramientas y/o equipos a utilizar son los definidos en la planificación de la tarea?",
      },
      {
        id: "herramientas_disponibilidad",
        category: "herramientas",
        question: "¿Las herramientas y equipos necesarios están disponibles en el lugar de trabajo?",
      },
      {
        id: "herramientas_estado",
        category: "herramientas",
        question:
          "¿Las herramientas y equipos se encuentran en buen estado, con sus protecciones y sistemas de seguridad operativos?",
      },
      {
        id: "herramientas_epp",
        category: "herramientas",
        question:
          "¿El EPP requerido para la tarea está disponible, es el indicado y se utilizará según lo planificado?",
      },
    ],
  },
];

export const ARTP_CHANGE_QUESTIONS: ArtpChangeQuestionDef[] = ARTP_CHANGE_SECTIONS.flatMap(
  (s) => s.questions
);

export function buildInitialChangeAnswers() {
  return ARTP_CHANGE_QUESTIONS.map((q) => ({
    questionId: q.id,
    category: q.category,
    question: q.question,
    answer: null as boolean | null,
    changeDescription: "",
    undesiredEvent: "",
    additionalControl: "",
    implementationVerified: null as boolean | null,
  }));
}

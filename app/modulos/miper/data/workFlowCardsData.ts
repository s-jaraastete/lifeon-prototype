import type { WorkFlowCardProps } from '../../components/WorkFlowCard'


const workFlowCardsData: WorkFlowCardProps[] = [
  {
    id: "1",
    title: "Identificación de peligros",
    description: "Registra los peligros asociados a procesos, tareas o áreas de trabajo para comenzar la evaluación."
  },
  {
    id: "2",
    title: "Evaluación de riesgos",
    description: "Determina el nivel de riesgo utilizando la metodología definida por la organización."
  },
  {
    id: "3",
    title: "Priorización",
    description: "Identifica los riesgos que requieren una intervención inmediata según su nivel de criticidad."
  },
  {
    id: "4",
    title: "Medidas de control",
    description: "Define e implementa las acciones necesarias para reducir o eliminar los riesgos identificados."
  },
  {
    id: "5",
    title: "Seguimiento",
    description: "Monitorea el avance de las medidas implementadas y verifica su cumplimiento."
  },
  {
    id: "6",
    title: "Revisión continua",
    description: "Actualiza la matriz cuando cambien los procesos, aparezcan nuevos riesgos o se implementen mejoras."
  },
]

export default workFlowCardsData;
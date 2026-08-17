import { LuChartColumn, LuCircleCheck, LuMonitorSmartphone } from 'react-icons/lu';

import type { CardData } from "@/app/components/shared/InfoCardsSection";

const infoCardsData: CardData[] = [
  {
    title: "Toda tu gestión en un sólo lugar",
    description: "Centraliza procesos, documentos, evaluaciones y acciones de seguridad en una plataforma conectada y accesible para todos tus equipos.",
    icon: LuMonitorSmartphone
  },
  {
    title: "Procesos más ágiles y eficientes",
    description: "Reduce tareas manuales, evita la duplicidad de información y facilita el seguimiento de las actividades clave de tu operación.",
    icon: LuCircleCheck
  },
  {
    title: "Información confiable para decidir",
    description: "Accede a datos actualizados, trazables y auditables para detectar brechas, demostrar cumplimiento y mejorar continuamente.",
    icon: LuChartColumn
  },
];

export default infoCardsData;

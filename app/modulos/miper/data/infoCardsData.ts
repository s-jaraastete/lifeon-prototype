import {
  LuHardDriveDownload,
  LuUsersRound,
  LuListChecks,
  LuFileCheck,
  LuMonitorSmartphone,
  LuSearch,
} from "react-icons/lu";

import type { CardData } from "@/app/components/shared/InfoCardsSection";

const infoCardsData: CardData[] = [
  {
    title: "Información centralizada",
    description:
      "Administra todas tus matrices IPER desde un único lugar, evitando documentos duplicados y facilitando el acceso a la información.",
    icon: LuHardDriveDownload,
  },
  {
    title: "Trabajo colaborativo",
    description:
      "Permite que prevencionistas, supervisores y responsables participen en un mismo proceso con información siempre actualizada.",
    icon: LuUsersRound,
  },
  {
    title: "Trazabilidad completa",
    description:
      "Mantén un historial de cambios, responsables y evidencias para cada registro realizado dentro de la plataforma.",
    icon: LuListChecks,
  },
  {
    title: "Apoyo al cumplimiento normativo",
    description:
    "Organiza la información de forma consistente para facilitar revisiones internas y procesos de auditoría.",
    icon: LuFileCheck,
  },
  {
    title: "Gestión más ágil",
    description:
      "Reduce tareas administrativas y simplifica la actualización de la Matriz IPER mediante procesos digitales.",
    icon: LuMonitorSmartphone,
  },
  {
    title: "Información para la toma de decisiones",
    description:
      "Consulta el estado de los riesgos y las medidas implementadas para dar seguimiento a la gestión preventiva.",
    icon: LuSearch,
  },
];

export default infoCardsData;

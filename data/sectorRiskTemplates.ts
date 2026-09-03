export interface SectorControlSuggestion {
  type: "Eliminar / Sustituir" | "Controles de Ingeniería" | "Controles Administrativos" | "Elementos de Protección Personal (EPP)";
  description: string;
  isCritical?: boolean;
}

export interface SectorHazardSuggestion {
  id: string;
  hazardDescription: string;
  specificRiskCode: string;
  specificRiskName: string;
  riskFamily: string;
  riskClassification: "Seguridad" | "Emergencias" | "Higiénicos" | "Psicosociales" | "Músculo-esquelético";
  defaultProb: number; // 1, 2, 4 (DS 44)
  defaultSev: number;  // 1, 2, 4 (DS 44)
  prob5x5: number;     // 1 to 5
  sev5x5: number;      // 1 to 5
  recommendedControls: SectorControlSuggestion[];
  tags: string[];
}

export interface SectorProcessTemplate {
  name: string;
  workArea: string;
  subprocesses: string[];
}

export interface SectorTaskSuggestion {
  processName: string;
  taskName: string;
  taskType: "Rutinaria" | "No rutinaria";
  location: string;
  defaultPositions: {
    name: string;
    headcountMen: number;
    headcountWomen: number;
  }[];
}

export interface SectorRiskProfile {
  sector: string;
  sectorDisplayName: string;
  suggestedMatrixTitles: string[];
  recommendedProcesses: SectorProcessTemplate[];
  recommendedTasks: SectorTaskSuggestion[];
  suggestedHazards: SectorHazardSuggestion[];
}

export const SECTOR_RISK_PROFILES: Record<string, SectorRiskProfile> = {
  Minería: {
    sector: "Minería",
    sectorDisplayName: "Minería y Procesamiento de Minerales",
    suggestedMatrixTitles: [
      "Operación Rajo Abierto, Carguío y Transporte CAEX",
      "Perforación, Tronadura y Manejo de Explosivos",
      "Extracción y Fortificación en Interior Mina",
      "Mantenimiento Planta Concentradora y Molienda",
    ],
    recommendedProcesses: [
      {
        name: "Extracción y Transporte Mina",
        workArea: "Mina Rajo / Interior Mina",
        subprocesses: ["Perforación y tronadura", "Carguío de mineral con pala", "Transporte con camiones CAEX", "Acuñadura y fortificación"],
      },
      {
        name: "Procesamiento y Concentrado",
        workArea: "Planta de Beneficio",
        subprocesses: ["Chancado primario", "Molienda SAG y bolas", "Flotación", "Espesamiento y relaves"],
      },
      {
        name: "Mantenimiento Electromecánico",
        workArea: "Talleres y Faena",
        subprocesses: ["Mantenimiento equipo rodante", "Bloqueo de energía LOTO", "Soldadura en tolvas"],
      },
    ],
    recommendedTasks: [
      {
        processName: "Extracción y Transporte Mina",
        taskName: "Operación de camión de extracción CAEX en rampa y botadero",
        taskType: "Rutinaria",
        location: "Rampas y botaderos de estéril",
        defaultPositions: [{ name: "Operador CAEX", headcountMen: 4, headcountWomen: 1 }],
      },
      {
        processName: "Extracción y Transporte Mina",
        taskName: "Acuñadura mecanizada y fortificación con pernos y malla",
        taskType: "Rutinaria",
        location: "Frentes de avance y galerías",
        defaultPositions: [{ name: "Operador Jumbo / Acuñador", headcountMen: 2, headcountWomen: 0 }],
      },
      {
        processName: "Extracción y Transporte Mina",
        taskName: "Carguío de tiros con emulsión matriz y detonadores",
        taskType: "No rutinaria",
        location: "Banco de perforación fase 3",
        defaultPositions: [{ name: "Manipulador de Explosivos", headcountMen: 3, headcountWomen: 0 }],
      },
      {
        processName: "Procesamiento y Concentrado",
        workArea: "Planta de Beneficio",
        taskName: "Inspección y cambio de revestimientos de molino SAG",
        taskType: "No rutinaria",
        location: "Edificio de molienda",
        defaultPositions: [{ name: "Mecánico de Planta", headcountMen: 3, headcountWomen: 1 }],
      } as any,
    ],
    suggestedHazards: [
      {
        id: "min-1",
        hazardDescription: "Desprendimiento de roca o planchones en taludes o frentes de explotación",
        specificRiskCode: "B2",
        specificRiskName: "Caída de objetos / Carga suspendida",
        riskFamily: "Caídas a distinto nivel",
        riskClassification: "Seguridad",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 3,
        sev5x5: 5,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Acuñadura sistemática mecanizada y fortificación con pernos helicoidales y shotcrete con fibra", isCritical: true },
          { type: "Controles Administrativos", description: "Mapeo geomecánico diario e inspección de taludes con radar interferométrico", isCritical: true },
          { type: "Elementos de Protección Personal (EPP)", description: "Casco minero tipo ala completa con barbiquejo y visor antivapor" },
        ],
        tags: ["Crítico", "Geomecánica", "Terreno"],
      },
      {
        id: "min-2",
        hazardDescription: "Interacción de camiones de alto tonelaje CAEX con vehículos livianos o peatones en rampa",
        specificRiskCode: "B4",
        specificRiskName: "Atropello por vehículo o maquinaria en movimiento",
        riskFamily: "Atropello o colisión con maquinaria",
        riskClassification: "Seguridad",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 3,
        sev5x5: 5,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Segregación física de vías, sistema anticolisión CAS/CAM con alerta de proximidad por radar y GPS", isCritical: true },
          { type: "Controles de Ingeniería", description: "Pretiles de seguridad en bordes de rampa con altura no inferior a 1/2 diámetro de rueda de camión", isCritical: true },
          { type: "Controles Administrativos", description: "Protocolo de adelantamiento en rampa y prueba de frenos obligatoria en pretil de prueba" },
        ],
        tags: ["Crítico", "Tránsito", "Maquinaria"],
      },
      {
        id: "min-3",
        hazardDescription: "Exposición a sílice libre cristalizada en suspensión durante carguío, chancado y molienda",
        specificRiskCode: "H2",
        specificRiskName: "Exposición a Sílice Libre Cristalizada (PLANESI)",
        riskFamily: "Agentes químicos (Polvo sílice, Solventes, Gases)",
        riskClassification: "Higiénicos",
        defaultProb: 4,
        defaultSev: 4,
        prob5x5: 4,
        sev5x5: 4,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Supresión de polvo mediante humectación con cañones nebulizadores y encapsulamiento de correas transportadoras", isCritical: true },
          { type: "Controles de Ingeniería", description: "Cabinas de operadores presurizadas y climatizadas con sistema de doble filtración HEPA" },
          { type: "Controles Administrativos", description: "Programa de vigilancia médica PLANESI y dosimetría gravimétrica periódica" },
          { type: "Elementos de Protección Personal (EPP)", description: "Protector respiratorio medio rostro con filtro para partículas P100 certificado" },
        ],
        tags: ["PLANESI", "Salud Ocupacional", "Higiénico"],
      },
      {
        id: "min-4",
        hazardDescription: "Proyección de fragmentos y onda expansiva durante disparo o quema de tronadura",
        specificRiskCode: "E4",
        specificRiskName: "Colapso estructural / Derrumbe",
        riskFamily: "Colapso estructural / Derrumbe",
        riskClassification: "Emergencias",
        defaultProb: 1,
        defaultSev: 4,
        prob5x5: 2,
        sev5x5: 5,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Diseño de malla de perforación y amarre con detonadores electrónicos de retardo secuencial", isCritical: true },
          { type: "Controles Administrativos", description: "Cierre perimetral con loros vivos y señalización radial previa de radio de evacuación (mínimo 500m)", isCritical: true },
          { type: "Controles Administrativos", description: "Inspección de tiros quedados (TQ) post-disparo antes del reingreso del personal" },
        ],
        tags: ["Crítico", "Tronadura", "Explosivos"],
      },
      {
        id: "min-5",
        hazardDescription: "Exposición a gases de combustión diésel (CO, NO2) y déficit de oxígeno en galerías ciegas",
        specificRiskCode: "H4",
        specificRiskName: "Exposición a Vapores Orgánicos y Solventes",
        riskFamily: "Agentes químicos (Polvo sílice, Solventes, Gases)",
        riskClassification: "Higiénicos",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 2,
        sev5x5: 4,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Sistema de ventilación principal y mangas secundarias con caudal mínimo de 3 m³/min por HP de motor diésel", isCritical: true },
          { type: "Controles Administrativos", description: "Uso obligatorio de detector portátil multigas 4 gases (O2, CO, H2S, LEL) calibrado", isCritical: true },
          { type: "Controles Administrativos", description: "Filtros de partículas diésel (DPF) vigentes en toda la flota rodante interior mina" },
        ],
        tags: ["Ventilación", "Interior Mina", "Gases"],
      },
      {
        id: "min-6",
        hazardDescription: "Fatiga y somnolencia laboral en turnos extendidos de faena minera (7x7 / 4x3)",
        specificRiskCode: "PS1",
        specificRiskName: "Carga de trabajo y exigencias cuantitativas elevadas",
        riskFamily: "Organización y condiciones del trabajo",
        riskClassification: "Psicosociales",
        defaultProb: 4,
        defaultSev: 2,
        prob5x5: 4,
        sev5x5: 3,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Sensores de detección de parpadeo y somnolencia con alarma en cabinas de camiones CAEX", isCritical: true },
          { type: "Controles Administrativos", description: "Protocolo de gestión del sueño, pausas activas obligatorias y dormitorios aislados acústicamente" },
        ],
        tags: ["Fatiga", "Turnos", "Psicosocial"],
      },
    ],
  },

  Construcción: {
    sector: "Construcción",
    sectorDisplayName: "Construcción, Obras Civiles y Edificación",
    suggestedMatrixTitles: [
      "Montaje Estructural, Enfierradura y Trabajos en Altura",
      "Excavaciones Profundas, Zanjas y Entibaciones",
      "Instalaciones Eléctricas Provisorias y Faena Gruesa",
      "Operación de Grúa Torre y Maniobras de Izaje",
    ],
    recommendedProcesses: [
      {
        name: "Obra Gruesa y Estructuras",
        workArea: "Frente de Obra / Losa",
        subprocesses: ["Montaje de moldajes y enfierradura", "Hormigonado de losas y pilares", "Descimbre", "Instalación de barandas"],
      },
      {
        name: "Excavaciones y Movimiento de Suelos",
        workArea: "Subterráneos / Terreno",
        subprocesses: ["Excavación masiva con retroexcavadora", "Colocación de entibaciones", "Retiro de escombros con tolva"],
      },
      {
        name: "Terminaciones e Instalaciones",
        workArea: "Interiores de Edificio",
        subprocesses: ["Tabiquería y yeso cartón", "Instalaciones eléctricas", "Pintura y revestimientos"],
      },
    ],
    recommendedTasks: [
      {
        processName: "Obra Gruesa y Estructuras",
        taskName: "Montaje y afianzamiento de moldajes de muros y losas en altura",
        taskType: "Rutinaria",
        location: "Perímetro losa nivel +4",
        defaultPositions: [{ name: "Carpintero de Moldaje", headcountMen: 4, headcountWomen: 0 }],
      },
      {
        processName: "Excavaciones y Movimiento de Suelos",
        taskName: "Excavación manual y perfilamiento de zanjas para tuberías sanitarias",
        taskType: "Rutinaria",
        location: "Subterráneo -2 sector accesos",
        defaultPositions: [{ name: "Jornal de Excavación", headcountMen: 3, headcountWomen: 0 }],
      },
      {
        processName: "Obra Gruesa y Estructuras",
        taskName: "Izaje y posicionamiento de paquetes de fierro estriado con grúa torre",
        taskType: "Rutinaria",
        location: "Radio de giro de grúa torre",
        defaultPositions: [{ name: "Rigger de Faena", headcountMen: 1, headcountWomen: 0 }],
      },
    ],
    suggestedHazards: [
      {
        id: "con-1",
        hazardDescription: "Caída desde altura física en bordes de losa o andamios sin protección perimetral",
        specificRiskCode: "B1",
        specificRiskName: "Caída desde altura física (> 1.8m)",
        riskFamily: "Caídas a distinto nivel",
        riskClassification: "Seguridad",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 3,
        sev5x5: 5,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Instalación de barandas perimetrales dobles rígidas (1.0m y 0.5m) con rodapié de 15cm y mallas anticaídas", isCritical: true },
          { type: "Controles de Ingeniería", description: "Líneas de vida horizontales de cable de acero certificadas y puntos de anclaje fijos", isCritical: true },
          { type: "Controles Administrativos", description: "Permiso de Trabajo Seguro en Altura (PTS) y check-list de arnés previo al ascenso" },
          { type: "Elementos de Protección Personal (EPP)", description: "Arnés paracaidista de cuerpo entero con doble cabo de vida y amortiguador de impacto" },
        ],
        tags: ["Crítico", "Altura", "Construcción"],
      },
      {
        id: "con-2",
        hazardDescription: "Derrumbe o desprendimiento de paredes de tierra en excavaciones profundas y zanjas",
        specificRiskCode: "E4",
        specificRiskName: "Colapso estructural / Derrumbe",
        riskFamily: "Colapso estructural / Derrumbe",
        riskClassification: "Emergencias",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 2,
        sev5x5: 5,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Entibación metálica o de madera certificada para profundidades superiores a 1.2 metros o talud con ángulo de reposo natural", isCritical: true },
          { type: "Controles Administrativos", description: "Prohibición de acopio de material extraído o tránsito de maquinaria pesada a menos de 1.5 metros del borde de zanja" },
          { type: "Controles Administrativos", description: "Escalas de acceso y escape cada 15 metros que sobrepasen 1 metro la superficie" },
        ],
        tags: ["Crítico", "Excavación", "Derrumbe"],
      },
      {
        id: "con-3",
        hazardDescription: "Caída de materiales o herramientas desde niveles superiores sobre trabajadores en tránsito",
        specificRiskCode: "B2",
        specificRiskName: "Caída de objetos / Carga suspendida",
        riskFamily: "Caídas a distinto nivel",
        riskClassification: "Seguridad",
        defaultProb: 4,
        defaultSev: 2,
        prob5x5: 4,
        sev5x5: 3,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Instalación de viseras de protección en accesos peatonales y mallas mosquiteras en andamios perimetrales", isCritical: true },
          { type: "Controles de Ingeniería", description: "Amarras de seguridad (lanyard) para herramientas manuales utilizadas en altura" },
          { type: "Elementos de Protección Personal (EPP)", description: "Casco de seguridad de polietileno de alta densidad con barbiquejo certificado" },
        ],
        tags: ["Objetos", "Altura", "Protección"],
      },
      {
        id: "con-4",
        hazardDescription: "Contacto con cables energizados en instalaciones eléctricas provisorias de faena",
        specificRiskCode: "B5",
        specificRiskName: "Contacto con conductores eléctricos energizados",
        riskFamily: "Contacto con energía eléctrica",
        riskClassification: "Seguridad",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 2,
        sev5x5: 4,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Tableros eléctricos provisorios estancos IP65 con disyuntores diferenciales de alta sensibilidad (30mA)", isCritical: true },
          { type: "Controles de Ingeniería", description: "Líneas de distribución eléctrica aéreas a una altura no inferior a 2.5 metros en pasillos peatonales" },
          { type: "Controles Administrativos", description: "Inspección semanal con código de colores y mantenimiento exclusivo por instalador autorizado SEC" },
        ],
        tags: ["Eléctrico", "Faena", "Seguridad"],
      },
    ],
  },

  "Transporte y Logística": {
    sector: "Transporte y Logística",
    sectorDisplayName: "Transporte de Cargas, Flota y Centros de Distribución",
    suggestedMatrixTitles: [
      "Operación de Transporte Carretero y Rutas Interurbanas",
      "Centro de Distribución, Patio de Maniobras y Bodega",
      "Carguío, Estiba y Despacho con Grúas Horquilla",
    ],
    recommendedProcesses: [
      {
        name: "Transporte y Conducción en Ruta",
        workArea: "Rutas Carreteras y Faenas",
        subprocesses: ["Conducción en carretera", "Revisión pre-operacional", "Descarga en cliente"],
      },
      {
        name: "Operaciones de Bodega y Logística",
        workArea: "Centro de Distribución",
        subprocesses: ["Recepción de mercadería", "Almacenamiento en racks", "Preparación de pedidos (picking)"],
      },
    ],
    recommendedTasks: [
      {
        processName: "Transporte y Conducción en Ruta",
        taskName: "Conducción de camión articulado de larga distancia",
        taskType: "Rutinaria",
        location: "Ruta 5 Norte / Sur",
        defaultPositions: [{ name: "Conductor Profesional", headcountMen: 5, headcountWomen: 0 }],
      },
      {
        processName: "Operaciones de Bodega y Logística",
        taskName: "Movimiento de pallets en pasillos de racks con grúa horquilla",
        taskType: "Rutinaria",
        location: "Nave central bodega 2",
        defaultPositions: [{ name: "Operador de Grúa Horquilla", headcountMen: 2, headcountWomen: 1 }],
      },
    ],
    suggestedHazards: [
      {
        id: "tra-1",
        hazardDescription: "Colisión o volcamiento de vehículo en ruta por fatiga, exceso de velocidad o condiciones climáticas",
        specificRiskCode: "B4",
        specificRiskName: "Atropello por vehículo o maquinaria en movimiento",
        riskFamily: "Atropello o colisión con maquinaria",
        riskClassification: "Seguridad",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 3,
        sev5x5: 5,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Telemetría GPS con limitador de velocidad a 90 km/h y cámaras frontales de asistencia avanzada ADAS", isCritical: true },
          { type: "Controles Administrativos", description: "Cumplimiento estricto del Art. 25 bis del Código del Trabajo (máximo 5 horas continuas de conducción)", isCritical: true },
          { type: "Controles Administrativos", description: "Plan de mantenimiento preventivo de frenos, neumáticos y dirección" },
        ],
        tags: ["Crítico", "Ruta", "Tránsito"],
      },
      {
        id: "tra-2",
        hazardDescription: "Atropello a peatones durante maniobras de retroceso de grúas horquilla en pasillos de bodega",
        specificRiskCode: "B4",
        specificRiskName: "Atropello por vehículo o maquinaria en movimiento",
        riskFamily: "Atropello o colisión con maquinaria",
        riskClassification: "Seguridad",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 2,
        sev5x5: 4,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Luz de seguridad Blue Spot y alarma acústica de retroceso en grúas horquilla", isCritical: true },
          { type: "Controles de Ingeniería", description: "Segregación física peatonal con barreras antichoque en pasillos de alto tráfico", isCritical: true },
          { type: "Elementos de Protección Personal (EPP)", description: "Chaleco reflectante de alta visibilidad clase 2 o 3 obligatorio" },
        ],
        tags: ["Bodega", "Atropello", "Maquinaria"],
      },
      {
        id: "tra-3",
        hazardDescription: "Sobreesfuerzo por manipulación manual de cajas y bultos en operaciones de estiba y picking",
        specificRiskCode: "ME1",
        specificRiskName: "Manejo Manual de Cargas > 25 kg (Ley 20.001 / 20.949)",
        riskFamily: "Manejo manual de carga (MMC)",
        riskClassification: "Músculo-esquelético",
        defaultProb: 4,
        defaultSev: 2,
        prob5x5: 4,
        sev5x5: 2,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Uso de transpaletas eléctricas, cintas transportadoras y mesas elevadoras para paletizado", isCritical: true },
          { type: "Controles Administrativos", description: "Capacitación en técnicas correctas de levantamiento y límite de carga de 25 kg para hombres y 20 kg para mujeres" },
        ],
        tags: ["MMC", "Ergonomía", "Salud"],
      },
    ],
  },

  "Manufactura / Industrial": {
    sector: "Manufactura / Industrial",
    sectorDisplayName: "Manufactura, Producción Industrial y Maestranza",
    suggestedMatrixTitles: [
      "Línea de Envasado, Producción y Maquinaria Automatizada",
      "Taller de Maestranza, Mecanizado y Soldadura",
      "Almacenamiento y Manejo de Sustancias Químicas (SUSPEL)",
    ],
    recommendedProcesses: [
      {
        name: "Producción y Maquinaria",
        workArea: "Nave de Procesos",
        subprocesses: ["Alimentación de línea", "Operación de prensas", "Envasado automático"],
      },
      {
        name: "Mantenimiento Industrial",
        workArea: "Taller Mecánico",
        subprocesses: ["Torneado y fresado", "Corte con plasma y soldadura", "Intervención de motores"],
      },
    ],
    recommendedTasks: [
      {
        processName: "Producción y Maquinaria",
        taskName: "Operación de línea de envasado con cintas transportadoras continuas",
        taskType: "Rutinaria",
        location: "Línea 2 nave central",
        defaultPositions: [{ name: "Operador de Línea", headcountMen: 3, headcountWomen: 2 }],
      },
    ],
    suggestedHazards: [
      {
        id: "man-1",
        hazardDescription: "Atrapamiento de extremidades en rodillos, engranajes o transmisiones sin resguardo fijo",
        specificRiskCode: "B3",
        specificRiskName: "Contacto con partes móviles sin resguardo",
        riskFamily: "Atrapamiento por o entre objetos",
        riskClassification: "Seguridad",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 3,
        sev5x5: 5,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Instalación de resguardos fijos de policarbonato o malla electrosoldada y cortinas fotoeléctricas de seguridad", isCritical: true },
          { type: "Controles de Ingeniería", description: "Paradas de emergencia tipo hongo o cables perimetrales de detención rápida", isCritical: true },
          { type: "Controles Administrativos", description: "Procedimiento de Bloqueo y Etiquetado LOTO con candado personal durante limpieza o mantenimiento" },
        ],
        tags: ["Crítico", "Atrapamiento", "LOTO"],
      },
      {
        id: "man-2",
        hazardDescription: "Exposición prolongada a ruido continuo generado por compresores, prensas y motores",
        specificRiskCode: "H1",
        specificRiskName: "Exposición a Ruido Ocupacional (PREXOR)",
        riskFamily: "Agentes físicos (Ruido, Vibraciones, Radiación)",
        riskClassification: "Higiénicos",
        defaultProb: 4,
        defaultSev: 2,
        prob5x5: 4,
        sev5x5: 3,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Encapsulamiento acústico de compresores y soportes antivibratorios en bancadas de motores", isCritical: true },
          { type: "Controles Administrativos", description: "Programa de vigilancia PREXOR con audiometrías periódicas y mapa de ruido actualizado" },
          { type: "Elementos de Protección Personal (EPP)", description: "Protector auditivo tipo fono o tapones endoaurales con NRR superior a 25 dB" },
        ],
        tags: ["PREXOR", "Ruido", "Higiénico"],
      },
    ],
  },
};

// Obtener el perfil del sector o el predeterminado si no coincide exactamente
export function getSectorRiskProfile(sectorName?: string): SectorRiskProfile {
  if (!sectorName) return SECTOR_RISK_PROFILES["Minería"];

  // Búsqueda aproximada
  const key = Object.keys(SECTOR_RISK_PROFILES).find(
    (k) =>
      k.toLowerCase().includes(sectorName.toLowerCase()) ||
      sectorName.toLowerCase().includes(k.toLowerCase())
  );

  return key ? SECTOR_RISK_PROFILES[key] : SECTOR_RISK_PROFILES["Minería"];
}

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
        ],
        tags: ["Ruido", "PREXOR", "Salud"],
      },
    ],
  },
  "Servicios e Ingeniería": {
    sector: "Servicios e Ingeniería",
    sectorDisplayName: "Servicios Profesionales, Ingeniería y Consultoría Técnica",
    suggestedMatrixTitles: [
      "Matriz de Gestión de Riesgos en Oficina Técnica e Ingeniería",
      "Inspección Técnica de Obras (ITO) y Supervisión de Terreno",
      "Trabajos de Levantamiento Topográfico y Ensayos de Campo",
      "Operación de Laboratorio de Calidad y Ensayos de Materiales",
    ],
    recommendedProcesses: [
      {
        name: "Diseño y Cálculo de Ingeniería",
        workArea: "Oficina Central / Técnica",
        subprocesses: [
          "Modelamiento BIM y diseño asistido por computador (CAD)",
          "Cálculo y revisión estructural de proyectos",
          "Revisión de planos, especificaciones técnicas y memorias",
        ],
      },
      {
        name: "Inspección Técnica y Asesoría en Terreno",
        workArea: "Faena / Terreno de Obras",
        subprocesses: [
          "Recorrido visual e inspección de frentes activos",
          "Toma de muestras y ensayos de materiales",
          "Control de calidad y verificación de especificaciones técnicas",
          "Reuniones de coordinación y comités de obra",
        ],
      },
      {
        name: "Gestión de Proyectos y Administración",
        workArea: "Oficinas y Soporte",
        subprocesses: [
          "Planificación y control de avance físico-financiero",
          "Gestión documental y contractual",
          "Atención de clientes y reuniones técnicas",
        ],
      },
    ],
    recommendedTasks: [
      {
        processName: "Diseño y Cálculo de Ingeniería",
        taskName: "Modelamiento y cálculo estructural en estación de trabajo PVD",
        taskType: "Rutinaria",
        location: "Oficina Técnica",
        defaultPositions: [{ name: "Ingeniero de Proyectos", headcountMen: 2, headcountWomen: 1 }],
      },
      {
        processName: "Diseño y Cálculo de Ingeniería",
        taskName: "Revisión técnica de planos, memorias de cálculo y cubicaciones",
        taskType: "Rutinaria",
        location: "Oficina Central",
        defaultPositions: [{ name: "Proyectista / Diseñador CAD", headcountMen: 1, headcountWomen: 1 }],
      },
      {
        processName: "Inspección Técnica y Asesoría en Terreno",
        taskName: "Inspección visual de avances constructivos y estructuras en faena",
        taskType: "Rutinaria",
        location: "Frentes de Obra en Terreno",
        defaultPositions: [{ name: "Inspector Técnico de Obras (ITO)", headcountMen: 2, headcountWomen: 0 }],
      },
      {
        processName: "Inspección Técnica y Asesoría en Terreno",
        taskName: "Toma de muestras de testigos de hormigón y ensayos de compactación",
        taskType: "No rutinaria",
        location: "Frente de fundaciones y losas",
        defaultPositions: [{ name: "Técnico de Laboratorio", headcountMen: 1, headcountWomen: 0 }],
      },
      {
        processName: "Gestión de Proyectos y Administración",
        taskName: "Reuniones de coordinación con mandante y contratistas en faena",
        taskType: "Rutinaria",
        location: "Sala de reuniones de obra",
        defaultPositions: [{ name: "Jefe de Proyecto", headcountMen: 1, headcountWomen: 1 }],
      },
    ],
    suggestedHazards: [
      {
        id: "ing-1",
        hazardDescription: "Exposición continua a pantallas de visualización de datos (PVD) y posturas sedentes prolongadas",
        specificRiskCode: "ME2",
        specificRiskName: "Trastornos Musculoesqueléticos de Extremidad Superior (TMERT)",
        riskFamily: "Posturas forzadas y sedentes",
        riskClassification: "Músculo-esquelético",
        defaultProb: 4,
        defaultSev: 2,
        prob5x5: 3,
        sev5x5: 2,
        recommendedControls: [
          { type: "Controles de Ingeniería", description: "Puestos de trabajo ergonómicos: sillas con regulación lumbar, brazos ajustables y soporte para monitor a la altura de los ojos", isCritical: true },
          { type: "Controles Administrativos", description: "Programa de pausas activas programadas cada 2 horas de trabajo continuado en pantalla" },
        ],
        tags: ["Ergonomía", "Oficina", "PVD"],
      },
      {
        id: "ing-2",
        hazardDescription: "Tránsito peatonal en frentes de obra activos con presencia de maquinaria pesada, excavaciones y desniveles",
        specificRiskCode: "B4",
        specificRiskName: "Atropello por vehículo o maquinaria en movimiento",
        riskFamily: "Atropello o colisión con maquinaria",
        riskClassification: "Seguridad",
        defaultProb: 2,
        defaultSev: 4,
        prob5x5: 2,
        sev5x5: 4,
        recommendedControls: [
          { type: "Controles Administrativos", description: "Uso de sendas peatonales segregadas y autorización previa de ingreso con señalero rigger", isCritical: true },
          { type: "Elementos de Protección Personal (EPP)", description: "Casco de seguridad con barbiquejo, calzado de seguridad con plantilla anticlavo y chaleco reflectante clase 2", isCritical: true },
        ],
        tags: ["Terreno", "ITO", "Inspección"],
      },
      {
        id: "ing-3",
        hazardDescription: "Exposición a radiación ultravioleta de origen solar en visitas prolongadas de inspección técnica en terreno",
        specificRiskCode: "H3",
        specificRiskName: "Radiación Ultravioleta de Origen Solar (Guía UV)",
        riskFamily: "Agentes físicos (Ruido, Vibraciones, Radiación)",
        riskClassification: "Higiénicos",
        defaultProb: 4,
        defaultSev: 2,
        prob5x5: 3,
        sev5x5: 3,
        recommendedControls: [
          { type: "Controles Administrativos", description: "Publicación diaria del índice de radiación UV y planificación de inspecciones en horarios de menor radiación" },
          { type: "Elementos de Protección Personal (EPP)", description: "Bloqueador solar FPS 50+, cubre nuca tipo legionario para casco y lentes con filtro UV certificadas" },
        ],
        tags: ["Guía UV", "Terreno", "Salud"],
      },
      {
        id: "ing-4",
        hazardDescription: "Sobrecarga de trabajo cuantitativa y plazos perentorios de entrega de proyectos y cálculos",
        specificRiskCode: "PS1",
        specificRiskName: "Carga de trabajo y exigencias cuantitativas elevadas",
        riskFamily: "Organización y condiciones del trabajo",
        riskClassification: "Psicosociales",
        defaultProb: 3,
        defaultSev: 2,
        prob5x5: 3,
        sev5x5: 3,
        recommendedControls: [
          { type: "Controles Administrativos", description: "Planificación balanceada de entregas y dotación adecuada por proyecto según cronograma" },
          { type: "Controles Administrativos", description: "Vigilancia del protocolo de riesgos psicosociales CEAL-SM / SUSESO" },
        ],
        tags: ["Psicosocial", "Oficina", "Plazos"],
      },
    ],
  },
};

// Obtener el perfil del sector o el predeterminado si no coincide exactamente
export function getSectorRiskProfile(sectorName?: string): SectorRiskProfile {
  if (!sectorName) return SECTOR_RISK_PROFILES["Construcción"];

  const sLower = sectorName.toLowerCase().trim();
  if (sLower.includes("servicio") || sLower.includes("ingenier") || sLower.includes("consultor")) {
    return SECTOR_RISK_PROFILES["Servicios e Ingeniería"];
  }
  if (sLower.includes("miner")) {
    return SECTOR_RISK_PROFILES["Minería"];
  }
  if (sLower.includes("transp") || sLower.includes("logíst")) {
    return SECTOR_RISK_PROFILES["Transporte y Logística"];
  }
  if (sLower.includes("manuf") || sLower.includes("industr")) {
    return SECTOR_RISK_PROFILES["Manufactura / Industrial"];
  }
  if (sLower.includes("construc") || sLower.includes("obra") || sLower.includes("edific")) {
    return SECTOR_RISK_PROFILES["Construcción"];
  }

  // Búsqueda aproximada
  const key = Object.keys(SECTOR_RISK_PROFILES).find(
    (k) =>
      k.toLowerCase().includes(sLower) ||
      sLower.includes(k.toLowerCase())
  );

  return key ? SECTOR_RISK_PROFILES[key] : SECTOR_RISK_PROFILES["Construcción"];
}

/**
 * Propuestas contextuales de tareas basadas estrictamente en el Proceso y Subproceso seleccionado (Req 16).
 */
export function getContextualTasksForProcess(
  processName: string,
  subprocessName?: string,
  sectorName?: string
): string[] {
  const pLower = (processName || "").toLowerCase();
  const sLower = (subprocessName || "").toLowerCase();

  // 1. Si hay subproceso específico
  if (sLower.includes("viga") || sLower.includes("perno") || sLower.includes("anclaje")) {
    return [
      "Montaje, aplomado y conexión de vigas principales en altura física",
      "Fijación y torque calibrado de pernos estructurales sobre canastillo",
      "Recepción y desenganche controlado de perfiles con grúa",
      "Inspección de soldaduras y uniones de nudo estructural",
    ];
  }
  if (sLower.includes("loto") || sLower.includes("bloqueo") || sLower.includes("energía")) {
    return [
      "Aplicación de tarjeta y candado personal de bloqueo LOTO en sala eléctrica",
      "Verificación de energía cero mediante multímetro certificado",
      "Despresurización de líneas neumáticas e hidráulicas",
      "Desbloqueo coordinado y prueba en vacío de equipo intervenido",
    ];
  }
  if (sLower.includes("soldadura") || sLower.includes("corte") || sLower.includes("oxicorte")) {
    return [
      "Soldadura al arco manual con electrodo revestido en posición plana y sobrecabeza",
      "Corte térmico con equipo oxicorte y verificación de válvulas antirretroceso",
      "Desbaste y pulido de cordones de soldadura con esmeril angular de 7 pulgadas",
      "Inspección de biombos ignífugos y extintor PQS de 10 kg en zona de trabajo en caliente",
    ];
  }
  if (sLower.includes("bodega") || sLower.includes("acopio") || sLower.includes("sustancia") || sLower.includes("despacho")) {
    return [
      "Recepción, clasificación y almacenamiento de sustancias peligrosas según DS 43",
      "Operación de grúa horquilla para carga y descarga en patio de materiales",
      "Control de inventario de EPP y equipos de protección contra caídas",
      "Manejo manual de cajas y bultos de insumos en estanterías metálicas",
    ];
  }
  if (sLower.includes("excavación") || sLower.includes("zanja") || sLower.includes("tierra")) {
    return [
      "Excavación mecánica de zanja para fundaciones con retroexcavadora",
      "Instalación de entibaciones de madera o cajones modulares de contención",
      "Nivelación manual de fondo de excavación con pala y picos",
      "Compactación de suelo con placa vibradora de 90 kg",
    ];
  }

  // 2. Basado en Proceso general
  if (pLower.includes("montaje") || pLower.includes("estructura") || pLower.includes("altura")) {
    return [
      "Montaje de vigas y columnas estructurales sobre andamio multidireccional",
      "Instalación de pernos de anclaje de alta resistencia en altura",
      "Montaje de arriostramientos y tensores perimetrales",
      "Izaje y posicionamiento de paneles metálicos con grúa torre",
      "Colocación de líneas de vida provisionales y mallas de seguridad",
    ];
  }
  if (pLower.includes("excav") || pLower.includes("movimiento") || pLower.includes("tierra")) {
    return [
      "Excavación profunda de zanjas y pozos de fundación",
      "Instalación y revisión diaria de entibaciones de contención de talud",
      "Carguío de camiones tolva con material excedente mediante pala cargadora",
      "Compactación de terreno de fundación y pruebas de densímetro",
    ];
  }
  if (pLower.includes("mant") || pLower.includes("taller") || pLower.includes("repara")) {
    return [
      "Mantenimiento electromecánico preventivo con consignación LOTO",
      "Cambio de rodamientos, poleas y correas de transmisión en motores",
      "Corte y soldadura para refuerzo de estructuras metálicas en banco",
      "Prueba de funcionamiento y calibración de guardas de seguridad",
    ];
  }
  if (pLower.includes("almacen") || pLower.includes("bodega") || pLower.includes("faena")) {
    return [
      "Recepción y almacenamiento segregado de sustancias peligrosas",
      "Despacho diario de herramientas eléctricas y equipos de faena",
      "Inspección de estado de arneses y cabos de vida en pañol",
      "Apilamiento seguro de pallets de sacos de cemento y morteros",
    ];
  }
  if (pLower.includes("hormig") || pLower.includes("enfierr") || pLower.includes("moldaje")) {
    return [
      "Armado y colocación de enfierradura en losas y vigas de fundación",
      "Montaje y desmolde de placas metálicas de moldaje",
      "Vaciado y vibrado de hormigón fresco con sonda mecánica",
      "Curado de losas de hormigón con agua y membrana química",
    ];
  }

  // 3. Procesos de Servicios, Ingeniería, Consultoría e Inspección
  if (pLower.includes("diseño") || pLower.includes("cálculo") || pLower.includes("bim") || pLower.includes("cad") || pLower.includes("plano") || pLower.includes("ingenier")) {
    return [
      "Modelamiento y cálculo estructural en estación de trabajo",
      "Revisión técnica de planos de especialidades y arquitectura",
      "Elaboración de especificaciones técnicas y memorias de cálculo",
      "Detección y resolución de interferencias geométricas en modelo BIM",
      "Cubicación y estimación técnica de cantidades de obra",
    ];
  }
  if (pLower.includes("inspección") || pLower.includes("ito") || pLower.includes("supervis") || pLower.includes("terreno") || pLower.includes("campo")) {
    return [
      "Inspección visual de avances constructivos y estructuras en faena",
      "Control de calidad y verificación de especificaciones técnicas en terreno",
      "Toma de muestras de testigos de hormigón y ensayos de compactación",
      "Levantamiento de no conformidades y observaciones técnicas en obra",
      "Supervisión del cumplimiento de protocolos de seguridad y EPP",
    ];
  }
  if (pLower.includes("gestión") || pLower.includes("proyecto") || pLower.includes("administra") || pLower.includes("asesor") || pLower.includes("consultor")) {
    return [
      "Planificación y control de avance físico-financiero del proyecto",
      "Gestión documental, archivo técnico y control de versiones",
      "Reuniones de coordinación técnica con mandante y contratistas",
      "Atención y asesoría técnica especializada a clientes",
      "Elaboración de informes periódicos de estado y avance del proyecto",
    ];
  }

  // Fallback coherente con el perfil del sector
  const profile = getSectorRiskProfile(sectorName);
  const matchedFromProfile = profile.recommendedTasks
    .filter((t) => t.processName.toLowerCase().includes(pLower) || pLower.includes(t.processName.toLowerCase()))
    .map((t) => t.taskName);

  if (matchedFromProfile.length > 0) return matchedFromProfile;

  return [
    `Ejecución operacional estándar de ${processName}`,
    `Inspección previa de herramientas y área de trabajo para ${processName}`,
    `Mantenimiento básico y limpieza al finalizar ${processName}`,
  ];
}

/**
 * Propuestas contextuales de peligros y riesgos asociadas estrictamente a la TAREA seleccionada (Req 21).
 */
export function getContextualHazardsForTask(
  taskName: string,
  hazardsPool?: SectorHazardSuggestion[]
): SectorHazardSuggestion[] {
  const tLower = (taskName || "").toLowerCase();
  const pool = hazardsPool && hazardsPool.length > 0
    ? hazardsPool
    : Object.values(SECTOR_RISK_PROFILES).flatMap((p) => p.suggestedHazards);

  // Palabras clave de la tarea
  const keywords: string[] = [];
  if (tLower.includes("altura") || tLower.includes("andamio") || tLower.includes("viga") || tLower.includes("techo") || tLower.includes("escala")) {
    keywords.push("caída", "altura", "distinto nivel", "andamio", "caída de objetos");
  }
  if (tLower.includes("grúa") || tLower.includes("izaje") || tLower.includes("carga suspendida") || tLower.includes("eslinga")) {
    keywords.push("izaje", "grúa", "atrapamiento", "caída de objetos", "maniobra");
  }
  if (tLower.includes("excav") || tLower.includes("zanja") || tLower.includes("talud") || tLower.includes("tierra")) {
    keywords.push("derrumbe", "atrapamiento", "excavación", "sepultamiento", "volcamiento");
  }
  if (tLower.includes("eléctr") || tLower.includes("loto") || tLower.includes("tablero") || tLower.includes("cable") || tLower.includes("energía")) {
    keywords.push("eléctrico", "contacto", "arco", "loto", "energía");
  }
  if (tLower.includes("soldadura") || tLower.includes("oxicorte") || tLower.includes("caliente") || tLower.includes("llama")) {
    keywords.push("fuego", "quemadura", "caliente", "radiación uv", "humos");
  }
  if (tLower.includes("bodega") || tLower.includes("químic") || tLower.includes("suspel") || tLower.includes("inflamable") || tLower.includes("sustancia")) {
    keywords.push("químico", "derrame", "intoxicación", "incendio", "suspel");
  }
  if (tLower.includes("ruido") || tLower.includes("esmeril") || tLower.includes("compresor") || tLower.includes("placa")) {
    keywords.push("ruido", "prexor", "vibración", "proyección");
  }
  if (tLower.includes("manual") || tLower.includes("carga") || tLower.includes("levantamiento") || tLower.includes("postura")) {
    keywords.push("trastornos músculo", "sobreesfuerzo", "lumbar", "manejo manual");
  }

  // Filtrar sugerencias que coincidan con las palabras clave del riesgo
  const matched = pool.filter((h) => {
    const text = `${h.hazardDescription} ${h.specificRiskName} ${h.riskFamily} ${h.tags.join(" ")}`.toLowerCase();
    if (keywords.length > 0) {
      return keywords.some((k) => text.includes(k));
    }
    const words = tLower.split(/\s+/).filter((w) => w.length > 4);
    return words.some((w) => text.includes(w));
  });

  if (matched.length > 0) {
    const uniqueIds = new Set<string>();
    return matched.filter((h) => {
      if (uniqueIds.has(h.id)) return false;
      uniqueIds.add(h.id);
      return true;
    });
  }

  return pool.slice(0, 5);
}


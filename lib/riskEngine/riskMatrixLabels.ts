export const PROB_5X5 = [
  { val: 1, label: "1 - Muy baja", desc: "Altamente improbable / Rara ocurrencia" },
  { val: 2, label: "2 - Baja", desc: "Poco frecuente / Escenario controlado" },
  { val: 3, label: "3 - Media", desc: "Ocurrencia ocasional / Posible en el ciclo" },
  { val: 4, label: "4 - Alta", desc: "Frecuente / Condición subestándar recurrente" },
  { val: 5, label: "5 - Muy alta", desc: "Inminente / Exposición continua sin barreras" },
];

/** Etiquetas cortas para el eje Y (Probabilidad) del mapa de clasificación */
export const PROB_5X5_AXIS = [
  { val: 1, label: "Improbable" },
  { val: 2, label: "Probable" },
  { val: 3, label: "Ocasional" },
  { val: 4, label: "Posible" },
  { val: 5, label: "Altamente probable" },
];

export const SEV_5X5 = [
  { val: 1, label: "1 - Menor", desc: "Primeros auxilios / Molestias sin baja médica" },
  { val: 2, label: "2 - Moderada", desc: "Lesión con tiempo perdido leve o reversible" },
  { val: 3, label: "3 - Seria", desc: "Lesión grave con incapacidad temporal prolongada" },
  { val: 4, label: "4 - Mayor", desc: "Incapacidad permanente parcial o daño crítico" },
  { val: 5, label: "5 - Catastrófica", desc: "Fatalidad múltiple o invalidez total permanente" },
];

/** Etiquetas cortas para el eje X (Consecuencia) del mapa de clasificación */
export const SEV_5X5_AXIS = [
  { val: 1, label: "Muy bajo" },
  { val: 2, label: "Bajo" },
  { val: 3, label: "Medio" },
  { val: 4, label: "Alto" },
  { val: 5, label: "Crítico" },
];

export const PROB_VEP3X3 = [
  { val: 1, label: "1 - Bajo", desc: "Situación controlada / Poco frecuente" },
  { val: 2, label: "2 - Medio", desc: "Materialización posible / Ocurrencia media" },
  { val: 4, label: "4 - Alto", desc: "Situación deficiente / Exposición continua" },
];

export const SEV_VEP3X3 = [
  { val: 1, label: "1 - Bajo / Leve", desc: "Lesión menor / Primeros auxilios sin CTP" },
  { val: 2, label: "2 - Medio / Moderado", desc: "Lesión con incapacidad temporal (CTP)" },
  { val: 4, label: "4 - Alto / Grave", desc: "Incapacidad permanente o fatalidad" },
];

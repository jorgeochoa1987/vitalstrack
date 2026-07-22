export interface HealthTip {
  id: string;
  title: string;
  body: string;
}

/** Tips educativos (no sustituyen consejo médico). */
export const HEALTH_TIPS: HealthTip[] = [
  {
    id: "rest",
    title: "Siéntate 5 minutos antes",
    body: "Mide la tensión en reposo, con la espalda apoyada y los pies en el suelo. Hablar o cruzar las piernas puede alterar la lectura.",
  },
  {
    id: "cuff",
    title: "Brazalete a la altura del corazón",
    body: "El brazo debe estar apoyado, a la altura del pecho, sin ropa gruesa debajo del brazalete. Usa siempre el mismo brazo.",
  },
  {
    id: "timing",
    title: "Misma hora cada día",
    body: "Toma la presión a la hora que configuraste. Evita cafeína, ejercicio o fumar 30 minutos antes de medir.",
  },
  {
    id: "salt",
    title: "Menos sal, más control",
    body: "Reducir el sodio (sal de mesa, embutidos, snacks) ayuda a bajar la presión. Prefiere hierbas y especias al cocinar.",
  },
  {
    id: "walk",
    title: "Muévete un poco cada día",
    body: "Caminar 20–30 minutos la mayoría de los días fortalece el corazón y puede mejorar tus promedios semanales.",
  },
  {
    id: "numbers",
    title: "Qué miramos en los números",
    body: "Sistólica (arriba) es la presión al latir; diastólica (abajo), en reposo. En casa, valores altos repetidos merecen revisión con tu médico.",
  },
  {
    id: "meds",
    title: "No suspendas la medicación",
    body: "Si te recetaron pastillas para la tensión, tómalas como indiquen. VitalsTrack sirve para seguir, no para decidir dosis por tu cuenta.",
  },
  {
    id: "crisis",
    title: "Si ves cifras muy altas",
    body: "PAS ≥180 o PAD ≥120 con síntomas (dolor de pecho, dificultad para respirar, confusión) requiere atención urgente. Repite la toma en reposo y busca ayuda.",
  },
];

/** Tip del día estable según la fecha local. */
export function tipOfTheDay(date = new Date()): HealthTip {
  const day = Math.floor(date.getTime() / 86_400_000);
  return HEALTH_TIPS[day % HEALTH_TIPS.length]!;
}

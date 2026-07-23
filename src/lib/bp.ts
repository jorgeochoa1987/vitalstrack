import type { BpStatus, Measurement } from "../types";

/**
 * Clasificación 2025 AHA/ACC (Hipertensión Arterial 2026):
 * Normal: PAS <120 y PAD <80
 * Elevada: PAS 120–129 y PAD <80
 * Hipertensión Estadio 1: PAS 130–139 o PAD 80–89
 * Hipertensión Estadio 2: PAS ≥140 o PAD ≥90
 * Hipertensión severa: PAS ≥180 o PAD ≥120
 * Se clasifica según el valor más alto entre PAS o PAD.
 */
export function getBpStatus(systolic: number, diastolic: number): BpStatus {
  if (systolic >= 180 || diastolic >= 120) return "crisis";
  if (systolic >= 140 || diastolic >= 90) return "stage2";
  if (systolic >= 130 || diastolic >= 80) return "stage1";
  if (systolic >= 120 && diastolic < 80) return "elevated";
  return "normal";
}

export function statusLabel(status: BpStatus): string {
  switch (status) {
    case "normal":
      return "Normal";
    case "elevated":
      return "Elevada";
    case "stage1":
      return "Estadio 1";
    case "stage2":
      return "Estadio 2";
    case "crisis":
      return "HTA severa";
  }
}

/** Mensaje breve según la categoría (no sustituye consejo médico). */
export function statusAdvice(status: BpStatus): string {
  switch (status) {
    case "normal":
      return "Dentro del rango objetivo. Sigue midiendo con buena técnica.";
    case "elevated":
      return "Un poco por encima del ideal. Una toma aislada no es diagnóstico; vigila el promedio.";
    case "stage1":
      return "Cifras de estadio 1. Si se repiten en varios días, coméntalo con tu médico.";
    case "stage2":
      return "Cifras altas. Repite en reposo y consulta si se mantienen ≥140/90.";
    case "crisis":
      return "Cifras de alerta. Si hay síntomas (dolor de pecho, falta de aire), busca atención urgente.";
  }
}

export function statusBarClass(status: BpStatus): string {
  switch (status) {
    case "normal":
      return "bg-success";
    case "elevated":
      return "bg-warning";
    case "stage1":
      return "bg-stage1";
    case "stage2":
      return "bg-error";
    case "crisis":
      return "bg-crisis";
  }
}

export function statusValueClass(status: BpStatus): string {
  switch (status) {
    case "stage2":
    case "crisis":
      return "text-error";
    default:
      return "text-primary";
  }
}

export function statusContainerClass(status: BpStatus): string {
  switch (status) {
    case "normal":
      return "border border-success-border bg-success-container text-success";
    case "elevated":
      return "border border-warning/40 bg-warning-container text-warning-text";
    case "stage1":
      return "border border-stage1-border bg-stage1-container text-stage1";
    case "stage2":
      return "border border-error/30 bg-error-container text-on-error-container";
    case "crisis":
      return "border border-crisis/40 bg-crisis-container text-crisis";
  }
}

/** Escala AHA/ACC 2025 · guía clínica 2026 (slides). */
export const BP_SCALE_SLIDES: {
  status: BpStatus;
  title: string;
  range: string;
  body: string;
}[] = [
  {
    status: "normal",
    title: "Normal",
    range: "PAS <120 y PAD <80",
    body: "Mantén hábitos saludables y sigue midiendo según tu plan.",
  },
  {
    status: "elevated",
    title: "Elevada",
    range: "PAS 120–129 y PAD <80",
    body: "No es hipertensión aún, pero conviene reducir sal, moverte y vigilar.",
  },
  {
    status: "stage1",
    title: "Estadio 1",
    range: "PAS 130–139 o PAD 80–89",
    body: "Hipertensión estadio 1. Habla con tu médico sobre estilo de vida y seguimiento.",
  },
  {
    status: "stage2",
    title: "Estadio 2",
    range: "PAS ≥140 o PAD ≥90",
    body: "Hipertensión estadio 2. Suele requerir evaluación y, a menudo, tratamiento.",
  },
  {
    status: "crisis",
    title: "HTA severa",
    range: "PAS ≥180 o PAD ≥120",
    body: "Cifras de alerta. Si hay síntomas, busca atención urgente. Repite en reposo.",
  },
];


export function formatBp(systolic: number, diastolic: number): string {
  return `${systolic}/${diastolic}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const date = formatDateLong(iso);
  const time = formatTime(iso);
  return `${date} · ${time}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dayGroupLabel(iso: string, now = new Date()): string {
  const date = startOfDay(new Date(iso));
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.getTime() === today.getTime()) return "Hoy";
  if (date.getTime() === yesterday.getTime()) return "Ayer";

  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function groupByDay(measurements: Measurement[]): { label: string; items: Measurement[] }[] {
  const sorted = [...measurements].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );
  const map = new Map<string, Measurement[]>();

  for (const m of sorted) {
    const key = startOfDay(new Date(m.recordedAt)).toISOString();
    const list = map.get(key) ?? [];
    list.push(m);
    map.set(key, list);
  }

  return [...map.entries()].map(([, items]) => ({
    label: dayGroupLabel(items[0].recordedAt),
    items,
  }));
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function weekAgo(from = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - 7);
  return d;
}

export function inLastDays(iso: string, days: number, from = new Date()): boolean {
  const t = new Date(iso).getTime();
  const start = new Date(from);
  start.setDate(start.getDate() - days);
  return t >= start.getTime() && t <= from.getTime();
}

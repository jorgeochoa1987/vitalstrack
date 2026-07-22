export type ReportCadence =
  | "pre_cita_7"
  | "pre_cita_14"
  | "every_5"
  | "weekly"
  | "monthly"
  | "custom";

export interface Appointment {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm hora de la cita */
  time: string;
  /** Dirección / lugar de la cita */
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface ReportSchedule {
  cadence: ReportCadence;
  customDays: number;
  /** Hora preferida de la toma diaria de tensión (HH:mm) */
  measureTime: string;
  /** Próxima cita médica */
  nextAppointment: Appointment | null;
  /** Citas pasadas / realizadas */
  appointmentHistory: Appointment[];
}

export const DEFAULT_SCHEDULE: ReportSchedule = {
  cadence: "pre_cita_7",
  customDays: 5,
  measureTime: "08:00",
  nextAppointment: null,
  appointmentHistory: [],
};

const STORAGE_PREFIX = "vitalstrack.reportSchedule.";

export function todayIso(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(fromIso: string, to = new Date()): number {
  const from = startOfDay(
    new Date(fromIso.includes("T") ? fromIso : `${fromIso}T12:00:00`),
  );
  const toDay = startOfDay(to);
  return Math.floor((toDay.getTime() - from.getTime()) / 86_400_000);
}

export function calendarDaysUntil(targetIso: string, from = new Date()): number {
  if (!targetIso) return NaN;
  const target = startOfDay(new Date(`${targetIso}T12:00:00`));
  const fromDay = startOfDay(from);
  return Math.round((target.getTime() - fromDay.getTime()) / 86_400_000);
}

export function normalizeTime(value: string | undefined, fallback = "08:00"): string {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return fallback;
  const [h, m] = value.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return fallback;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatMeasureTime(hhmm: string): string {
  const [hRaw, mRaw] = normalizeTime(hhmm).split(":");
  const d = new Date();
  d.setHours(Number(hRaw), Number(mRaw), 0, 0);
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatAppointmentDate(iso: string): string {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatAppointmentFull(appt: Appointment): string {
  const base = `${formatAppointmentDate(appt.date)} · ${formatMeasureTime(appt.time)}`;
  const addr = appt.address?.trim();
  return addr ? `${base} · ${addr}` : base;
}

export function newAppointmentId(): string {
  return `apt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const CADENCE_OPTIONS: {
  value: ReportCadence;
  label: string;
  hint: string;
}[] = [
  {
    value: "pre_cita_7",
    label: "Cita · 1 semana",
    hint: "Toma diaria los 7 días previos a tu cita; luego 1 vez al mes",
  },
  {
    value: "pre_cita_14",
    label: "Cita · 2 semanas",
    hint: "Toma diaria los 14 días previos a tu cita; luego 1 vez al mes",
  },
  {
    value: "every_5",
    label: "Cada 5 días",
    hint: "Ideal para un seguimiento regular",
  },
  {
    value: "weekly",
    label: "Cada semana",
    hint: "Una medición cada 7 días",
  },
  {
    value: "monthly",
    label: "1 vez al mes",
    hint: "Mantenimiento a largo plazo",
  },
  {
    value: "custom",
    label: "Personalizado",
    hint: "Elige cada cuántos días te recordamos",
  },
];

/** Inicio de la ventana pre-cita = N días antes de la cita. */
export function preCitaStartDate(schedule: ReportSchedule): string | null {
  const appt = schedule.nextAppointment;
  if (!appt?.date) return null;
  if (schedule.cadence !== "pre_cita_7" && schedule.cadence !== "pre_cita_14") {
    return null;
  }
  const days = schedule.cadence === "pre_cita_7" ? 7 : 14;
  const d = new Date(`${appt.date}T12:00:00`);
  d.setDate(d.getDate() - days);
  return todayIso(d);
}

type LegacySchedule = {
  intensiveStartedAt?: string;
  appointmentDate?: string;
  measureTime?: string;
  cadence?: ReportCadence;
  customDays?: number;
  nextAppointment?: Appointment | null;
  appointmentHistory?: Appointment[];
};

function migrateLegacy(parsed: LegacySchedule): ReportSchedule {
  let nextAppointment = parsed.nextAppointment ?? null;
  let history = [...(parsed.appointmentHistory ?? [])];

  // Migración desde appointmentDate suelto
  if (!nextAppointment && parsed.appointmentDate) {
    nextAppointment = {
      id: newAppointmentId(),
      date: parsed.appointmentDate,
      time: normalizeTime(parsed.measureTime, "09:00"),
      createdAt: new Date().toISOString(),
    };
  }

  return {
    cadence: parsed.cadence ?? DEFAULT_SCHEDULE.cadence,
    customDays:
      typeof parsed.customDays === "number" && parsed.customDays > 0
        ? Math.min(90, Math.round(parsed.customDays))
        : DEFAULT_SCHEDULE.customDays,
    measureTime: normalizeTime(parsed.measureTime),
    nextAppointment,
    appointmentHistory: history,
  };
}

/** Si la próxima cita ya pasó, la mueve al histórico. */
export function archivePastAppointments(schedule: ReportSchedule): ReportSchedule {
  const next = schedule.nextAppointment;
  if (!next?.date) return schedule;
  if (calendarDaysUntil(next.date) >= 0) return schedule;

  return {
    ...schedule,
    nextAppointment: null,
    appointmentHistory: [next, ...schedule.appointmentHistory],
  };
}

export function loadSchedule(userId: string | undefined | null): ReportSchedule {
  if (!userId) return { ...DEFAULT_SCHEDULE, appointmentHistory: [] };
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (!raw) return { ...DEFAULT_SCHEDULE, appointmentHistory: [] };
    const parsed = JSON.parse(raw) as LegacySchedule;
    return archivePastAppointments(migrateLegacy(parsed));
  } catch {
    return { ...DEFAULT_SCHEDULE, appointmentHistory: [] };
  }
}

export function saveSchedule(
  userId: string,
  schedule: ReportSchedule,
): ReportSchedule {
  const archived = archivePastAppointments(schedule);
  const next: ReportSchedule = {
    cadence: archived.cadence,
    customDays: Math.max(1, Math.min(90, Math.round(archived.customDays || 5))),
    measureTime: normalizeTime(archived.measureTime),
    nextAppointment: archived.nextAppointment
      ? {
          ...archived.nextAppointment,
          date: archived.nextAppointment.date,
          time: normalizeTime(archived.nextAppointment.time, "09:00"),
          address: archived.nextAppointment.address?.trim() || undefined,
        }
      : null,
    appointmentHistory: archived.appointmentHistory,
  };
  localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(next));
  return next;
}

/**
 * Al guardar una nueva próxima cita: si la anterior es distinta, pasa al histórico.
 */
export function upsertNextAppointment(
  schedule: ReportSchedule,
  date: string,
  time: string,
  options?: { address?: string; notes?: string },
): ReportSchedule {
  if (!date) {
    return { ...schedule, nextAppointment: null };
  }

  const normalizedTime = normalizeTime(time, "09:00");
  const address = options?.address?.trim() || undefined;
  const notes = options?.notes;
  const current = schedule.nextAppointment;
  let history = [...schedule.appointmentHistory];

  if (
    current &&
    (current.date !== date || current.time !== normalizedTime)
  ) {
    history = [current, ...history];
  }

  const nextAppointment: Appointment =
    current && current.date === date && current.time === normalizedTime
      ? {
          ...current,
          address: address ?? current.address,
          notes: notes ?? current.notes,
        }
      : {
          id: newAppointmentId(),
          date,
          time: normalizedTime,
          address,
          notes,
          createdAt: new Date().toISOString(),
        };

  return {
    ...schedule,
    nextAppointment,
    appointmentHistory: history,
  };
}

export function completeCurrentAppointment(
  schedule: ReportSchedule,
): ReportSchedule {
  if (!schedule.nextAppointment) return schedule;
  return {
    ...schedule,
    nextAppointment: null,
    appointmentHistory: [schedule.nextAppointment, ...schedule.appointmentHistory],
  };
}

export function deleteHistoryAppointment(
  schedule: ReportSchedule,
  id: string,
): ReportSchedule {
  return {
    ...schedule,
    appointmentHistory: schedule.appointmentHistory.filter((a) => a.id !== id),
  };
}

export function effectiveIntervalDays(schedule: ReportSchedule): number {
  if (schedule.cadence === "pre_cita_7" || schedule.cadence === "pre_cita_14") {
    const start = preCitaStartDate(schedule);
    const appt = schedule.nextAppointment;
    if (!start || !appt) return 30;
    const daysToAppt = calendarDaysUntil(appt.date);
    // Antes de la ventana o después de la cita → mensual
    if (daysToAppt < 0) return 30;
    const daysSinceStart = daysBetween(start);
    if (daysSinceStart < 0) return 30; // aún no empieza la pre-cita
    return 1;
  }
  if (schedule.cadence === "every_5") return 5;
  if (schedule.cadence === "weekly") return 7;
  if (schedule.cadence === "monthly") return 30;
  return Math.max(1, schedule.customDays || 5);
}

export function isInIntensivePhase(schedule: ReportSchedule): boolean {
  return (
    (schedule.cadence === "pre_cita_7" || schedule.cadence === "pre_cita_14") &&
    effectiveIntervalDays(schedule) === 1
  );
}

export function cadenceShortLabel(schedule: ReportSchedule): string {
  if (isInIntensivePhase(schedule) && schedule.nextAppointment) {
    const left = Math.max(0, calendarDaysUntil(schedule.nextAppointment.date));
    return `Cita · diario (${left}d restantes)`;
  }
  if (schedule.cadence === "pre_cita_7" || schedule.cadence === "pre_cita_14") {
    return "Mantenimiento · mensual";
  }
  if (schedule.cadence === "custom") {
    return `Cada ${schedule.customDays} días`;
  }
  return CADENCE_OPTIONS.find((o) => o.value === schedule.cadence)?.label ?? "Personalizado";
}

export interface NextMeasureInfo {
  daysUntil: number;
  headline: string;
  detail: string;
  due: boolean;
}

export interface NextAppointmentInfo {
  configured: boolean;
  daysUntil: number;
  headline: string;
  detail: string;
}

export function getNextMeasure(
  schedule: ReportSchedule,
  lastRecordedAt: string | undefined,
  now = new Date(),
): NextMeasureInfo {
  const interval = effectiveIntervalDays(schedule);
  const timeLabel = formatMeasureTime(schedule.measureTime);
  const phaseLabel = cadenceShortLabel(schedule);

  if (!lastRecordedAt) {
    return {
      daysUntil: 0,
      headline: `Hoy · ${timeLabel}`,
      detail: `Primera toma · ${phaseLabel}`,
      due: true,
    };
  }

  const daysSince = daysBetween(lastRecordedAt, now);

  if (interval === 1) {
    if (daysSince === 0) {
      return {
        daysUntil: 1,
        headline: `Mañana · ${timeLabel}`,
        detail: `Ya registraste hoy · ${phaseLabel}`,
        due: false,
      };
    }
    return {
      daysUntil: 0,
      headline: `Hoy · ${timeLabel}`,
      detail: `Toca medir · ${phaseLabel}`,
      due: true,
    };
  }

  const daysUntil = Math.max(0, interval - daysSince);
  if (daysUntil === 0) {
    return {
      daysUntil: 0,
      headline: `Hoy · ${timeLabel}`,
      detail: `Toca medir · ${phaseLabel}`,
      due: true,
    };
  }
  if (daysUntil === 1) {
    return {
      daysUntil: 1,
      headline: `Mañana · ${timeLabel}`,
      detail: `Cada ${interval} días · ${phaseLabel}`,
      due: false,
    };
  }
  return {
    daysUntil,
    headline: `En ${daysUntil} días · ${timeLabel}`,
    detail: `Cada ${interval} días · ${phaseLabel}`,
    due: false,
  };
}

export function getNextAppointment(
  schedule: ReportSchedule,
): NextAppointmentInfo {
  const appt = schedule.nextAppointment;
  if (!appt?.date) {
    return {
      configured: false,
      daysUntil: NaN,
      headline: "Sin fecha",
      detail: "Configura tu cita en el perfil",
    };
  }

  const days = calendarDaysUntil(appt.date);
  const detail = formatAppointmentFull(appt);

  if (days < 0) {
    return { configured: true, daysUntil: days, headline: "Pasada", detail };
  }
  if (days === 0) {
    return { configured: true, daysUntil: 0, headline: "Hoy", detail };
  }
  if (days === 1) {
    return { configured: true, daysUntil: 1, headline: "Mañana", detail };
  }
  return {
    configured: true,
    daysUntil: days,
    headline: `En ${days} días`,
    detail,
  };
}

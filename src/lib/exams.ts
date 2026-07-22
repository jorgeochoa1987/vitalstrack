import { formatAppointmentDate, todayIso } from "./reportSchedule";

export type ExamStatus = "pending" | "done";

export interface Exam {
  id: string;
  title: string;
  /** Fecha límite para hacerse el examen (típicamente 15 días antes de la cita) */
  dueDate: string;
  /** Fecha en que lo realizó (opcional) */
  doneDate?: string;
  photoUrl?: string;
  status: ExamStatus;
  createdAt: string;
  /** @deprecated migrado a dueDate */
  date?: string;
}

const STORAGE_PREFIX = "vitalstrack.exams.";
export const EXAM_LEAD_DAYS = 15;

function newExamId(): string {
  return `exam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Fecha = appointmentDate − days (YYYY-MM-DD). */
export function dateDaysBefore(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() - days);
  return todayIso(d);
}

export function migrateExam(raw: Partial<Exam> & { date?: string }): Exam {
  const dueDate = raw.dueDate || raw.date || todayIso();
  return {
    id: raw.id || newExamId(),
    title: raw.title?.trim() || "Examen",
    dueDate,
    doneDate: raw.doneDate,
    photoUrl: raw.photoUrl,
    status: raw.status === "done" ? "done" : "pending",
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function loadExams(userId: string | undefined | null): Exam[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<Exam>>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(migrateExam)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  } catch {
    return [];
  }
}

export function saveExams(userId: string, exams: Exam[]): Exam[] {
  const sorted = [...exams]
    .map(migrateExam)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(sorted));
  return sorted;
}

export function addExam(
  userId: string,
  input: {
    title: string;
    dueDate: string;
    photoUrl?: string;
    status?: ExamStatus;
  },
): Exam[] {
  const current = loadExams(userId);
  const exam = migrateExam({
    id: newExamId(),
    title: input.title,
    dueDate: input.dueDate,
    photoUrl: input.photoUrl,
    status: input.status ?? "pending",
    createdAt: new Date().toISOString(),
  });
  return saveExams(userId, [...current, exam]);
}

export function addExamsBatch(
  userId: string,
  items: Array<{ title: string; dueDate: string; photoUrl?: string }>,
): Exam[] {
  let list = loadExams(userId);
  for (const item of items) {
    if (!item.title.trim() && !item.photoUrl) continue;
    list = [
      ...list,
      migrateExam({
        id: newExamId(),
        title: item.title.trim() || "Examen",
        dueDate: item.dueDate,
        photoUrl: item.photoUrl,
        status: "pending",
        createdAt: new Date().toISOString(),
      }),
    ];
  }
  return saveExams(userId, list);
}

export function markExamDone(
  userId: string,
  id: string,
  doneDate = todayIso(),
): Exam[] {
  return saveExams(
    userId,
    loadExams(userId).map((e) =>
      e.id === id ? { ...e, status: "done" as const, doneDate } : e,
    ),
  );
}

export function removeExam(userId: string, id: string): Exam[] {
  return saveExams(
    userId,
    loadExams(userId).filter((e) => e.id !== id),
  );
}

/** Si hay próxima cita, recalcula dueDate = cita − 15 días en pendientes. */
export function syncExamDueDatesToAppointment(
  userId: string,
  appointmentDate: string,
): Exam[] {
  if (!appointmentDate) return loadExams(userId);
  const due = dateDaysBefore(appointmentDate, EXAM_LEAD_DAYS);
  return saveExams(
    userId,
    loadExams(userId).map((e) =>
      e.status === "pending" ? { ...e, dueDate: due } : e,
    ),
  );
}

export function formatExamLabel(exam: Exam): string {
  const date = formatAppointmentDate(exam.dueDate);
  return `${exam.title} · antes del ${date}`;
}

export function pendingExams(exams: Exam[]): Exam[] {
  return exams.filter((e) => e.status !== "done");
}

export function doneExams(exams: Exam[]): Exam[] {
  return exams.filter((e) => e.status === "done");
}

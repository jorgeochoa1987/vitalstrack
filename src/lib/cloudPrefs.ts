import type { Exam } from "./exams";
import { loadExams, saveExams } from "./exams";
import {
  DEFAULT_SCHEDULE,
  loadSchedule,
  saveSchedule,
  type ReportSchedule,
} from "./reportSchedule";
import { supabase } from "./supabase";

function isMissingColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("schedule_json") ||
    message.includes("exams_json") ||
    message.includes("schema cache") ||
    message.includes("Could not find the") ||
    message.includes("PGRST204")
  );
}

function asSchedule(raw: unknown): ReportSchedule | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<ReportSchedule>;
  return {
    cadence: s.cadence ?? DEFAULT_SCHEDULE.cadence,
    customDays: s.customDays ?? DEFAULT_SCHEDULE.customDays,
    measureTime: s.measureTime ?? DEFAULT_SCHEDULE.measureTime,
    nextAppointment: s.nextAppointment ?? null,
    appointmentHistory: Array.isArray(s.appointmentHistory)
      ? s.appointmentHistory
      : [],
  };
}

function asExams(raw: unknown): Exam[] | null {
  if (!Array.isArray(raw)) return null;
  return raw as Exam[];
}

/**
 * Trae cita/exámenes de Supabase y los fusiona con local.
 * Si la nube está vacía y hay datos locales, sube lo local.
 */
export async function syncPrefsFromCloud(userId: string): Promise<{
  schedule: ReportSchedule;
  exams: Exam[];
  cloud: boolean;
  error?: string;
}> {
  const localSchedule = loadSchedule(userId);
  const localExams = loadExams(userId);

  const { data, error } = await supabase
    .from("profiles")
    .select("schedule_json, exams_json")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error.message)) {
      return {
        schedule: localSchedule,
        exams: localExams,
        cloud: false,
        error:
          "Falta ejecutar supabase/sync_prefs.sql en Supabase para sincronizar entre cel y PC.",
      };
    }
    return {
      schedule: localSchedule,
      exams: localExams,
      cloud: false,
      error: error.message,
    };
  }

  const cloudSchedule = asSchedule(data?.schedule_json);
  const cloudExams = asExams(data?.exams_json);

  const hasCloudSchedule = Boolean(
    cloudSchedule?.nextAppointment ||
      (cloudSchedule?.appointmentHistory?.length ?? 0) > 0,
  );
  const hasLocalSchedule = Boolean(
    localSchedule.nextAppointment ||
      localSchedule.appointmentHistory.length > 0,
  );
  const hasCloudExams = (cloudExams?.length ?? 0) > 0;
  const hasLocalExams = localExams.length > 0;

  let schedule = localSchedule;

  if (hasCloudSchedule && cloudSchedule) {
    // Nube gana para la próxima cita (así cel y PC ven lo mismo)
    schedule = saveSchedule(userId, {
      cadence: cloudSchedule.cadence || localSchedule.cadence,
      customDays: cloudSchedule.customDays || localSchedule.customDays,
      measureTime: cloudSchedule.measureTime || localSchedule.measureTime,
      nextAppointment: cloudSchedule.nextAppointment,
      appointmentHistory:
        cloudSchedule.appointmentHistory.length > 0
          ? cloudSchedule.appointmentHistory
          : localSchedule.appointmentHistory,
    });
  } else if (hasLocalSchedule) {
    await pushPrefsToCloud(userId, localSchedule, localExams);
  }

  if (hasCloudExams && cloudExams) {
    saveExams(userId, cloudExams);
  } else if (hasLocalExams) {
    await pushPrefsToCloud(userId, schedule, localExams);
  }

  return {
    schedule: loadSchedule(userId),
    exams: loadExams(userId),
    cloud: true,
  };
}

export async function pushPrefsToCloud(
  userId: string,
  schedule: ReportSchedule,
  exams: Exam[],
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("profiles")
    .update({
      schedule_json: schedule,
      exams_json: exams,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    if (isMissingColumnError(error.message)) {
      return {
        ok: false,
        error:
          "Falta ejecutar supabase/sync_prefs.sql en Supabase (cel ↔ PC).",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Guarda local + nube. */
export async function persistPrefs(
  userId: string,
  schedule: ReportSchedule,
  exams: Exam[],
): Promise<{ schedule: ReportSchedule; exams: Exam[]; error?: string }> {
  const savedSchedule = saveSchedule(userId, schedule);
  const savedExams = saveExams(userId, exams);
  const push = await pushPrefsToCloud(userId, savedSchedule, savedExams);
  return {
    schedule: savedSchedule,
    exams: savedExams,
    error: push.error,
  };
}

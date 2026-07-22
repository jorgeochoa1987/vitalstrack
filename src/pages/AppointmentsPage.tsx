import {
  Camera,
  Check,
  FloppyDisk,
  Image as ImageIcon,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { Toast } from "../components/Toast";
import { TopAppBar } from "../components/TopAppBar";
import { useAuth } from "../context/AuthContext";
import { useMeasurements } from "../context/MeasurementsContext";
import { persistPrefs, syncPrefsFromCloud } from "../lib/cloudPrefs";
import {
  EXAM_LEAD_DAYS,
  addExamsBatch,
  dateDaysBefore,
  doneExams,
  formatExamLabel,
  loadExams,
  markExamDone,
  pendingExams,
  removeExam,
  syncExamDueDatesToAppointment,
  type Exam,
} from "../lib/exams";
import { resolvePhotoUrl } from "../lib/photo";
import {
  CADENCE_OPTIONS,
  completeCurrentAppointment,
  formatAppointmentDate,
  formatAppointmentFull,
  formatMeasureTime,
  loadSchedule,
  todayIso,
  upsertNextAppointment,
  type Appointment,
  type ReportCadence,
} from "../lib/reportSchedule";

interface DraftExam {
  key: string;
  title: string;
  preview?: string;
  file: File | null;
}

function newDraft(): DraftExam {
  return {
    key: `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: "",
    preview: undefined,
    file: null,
  };
}

export function AppointmentsPage() {
  const { user } = useAuth();
  const { usingLocal } = useMeasurements();

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [appointmentAddress, setAppointmentAddress] = useState("");
  const [cadence, setCadence] = useState<ReportCadence>("pre_cita_7");
  const [customDays, setCustomDays] = useState(5);
  const [measureTime, setMeasureTime] = useState("08:00");
  const [history, setHistory] = useState<Appointment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const [showExamWizard, setShowExamWizard] = useState(false);
  const [drafts, setDrafts] = useState<DraftExam[]>([newDraft()]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const activeDraftKey = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      setSyncing(true);
      const result = await syncPrefsFromCloud(user.id);
      if (cancelled) return;
      setAppointmentDate(result.schedule.nextAppointment?.date ?? "");
      setAppointmentTime(result.schedule.nextAppointment?.time ?? "09:00");
      setAppointmentAddress(result.schedule.nextAppointment?.address ?? "");
      setCadence(result.schedule.cadence);
      setCustomDays(result.schedule.customDays);
      setMeasureTime(result.schedule.measureTime);
      setHistory(result.schedule.appointmentHistory);
      setExams(result.exams);
      setSyncNote(
        result.error
          ? result.error
          : result.cloud
            ? "Sincronizado con tu cuenta (cel y PC)"
            : null,
      );
      setSyncing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  function applyFromSchedule(
    schedule: ReturnType<typeof loadSchedule>,
    nextExams: Exam[],
  ) {
    setHistory(schedule.appointmentHistory);
    setAppointmentDate(schedule.nextAppointment?.date ?? "");
    setAppointmentTime(schedule.nextAppointment?.time ?? "09:00");
    setAppointmentAddress(schedule.nextAppointment?.address ?? "");
    setCadence(schedule.cadence);
    setCustomDays(schedule.customDays);
    setMeasureTime(schedule.measureTime);
    setExams(nextExams);
  }

  async function persistAll(
    schedule: ReturnType<typeof loadSchedule>,
    nextExams: Exam[],
  ) {
    if (!user?.id) throw new Error("Sin sesión");
    const result = await persistPrefs(user.id, schedule, nextExams);
    applyFromSchedule(result.schedule, result.exams);
    if (result.error) setSyncNote(result.error);
    else setSyncNote("Sincronizado con tu cuenta (cel y PC)");
    return result;
  }

  function showMsg(msg: string) {
    setToastMessage(msg);
    setToast(true);
    window.setTimeout(() => setToast(false), 2200);
  }

  function dueWithoutAppointment(): string {
    const d = new Date(`${todayIso()}T12:00:00`);
    d.setDate(d.getDate() + EXAM_LEAD_DAYS);
    return todayIso(d);
  }

  function resolvedDue(): string {
    return appointmentDate
      ? dateDaysBefore(appointmentDate, EXAM_LEAD_DAYS)
      : dueWithoutAppointment();
  }

  async function saveAppointment() {
    if (!user?.id) {
      setError("No hay sesión. Recarga la página e inicia sesión otra vez.");
      showMsg("Sin sesión — no se pudo guardar");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      let next = loadSchedule(user.id);
      next = {
        ...next,
        cadence,
        customDays: Math.max(1, Math.min(90, Math.round(customDays) || 5)),
        measureTime,
      };

      const date = appointmentDate.trim();
      if (date) {
        next = upsertNextAppointment(next, date, appointmentTime || "09:00", {
          address: appointmentAddress,
        });
        const examsAfter = syncExamDueDatesToAppointment(
          user.id,
          next.nextAppointment?.date ?? "",
        );
        const result = await persistAll(next, examsAfter);
        if (!result.schedule.nextAppointment?.date) {
          setError(
            "Se guardó pero no aparece como próxima. ¿La fecha ya pasó? Usa hoy o una fecha futura.",
          );
          showMsg("Revisa la fecha de la cita");
          return;
        }
        showMsg(`Guardado · cita ${result.schedule.nextAppointment.date}`);
      } else {
        const result = await persistAll(next, loadExams(user.id));
        showMsg(
          `Tomas guardadas · ${
            CADENCE_OPTIONS.find((o) => o.value === result.schedule.cadence)
              ?.label ?? "frecuencia"
          }`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la cita",
      );
      showMsg("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function markDone() {
    if (!user?.id) return;
    setSaving(true);
    try {
      const next = completeCurrentAppointment(loadSchedule(user.id));
      await persistAll(next, loadExams(user.id));
      setDrafts([newDraft()]);
      setShowExamWizard(true);
      showMsg("Cita pasada al histórico");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  function applyPhoto(key: string, file: File) {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        if (d.preview?.startsWith("blob:")) URL.revokeObjectURL(d.preview);
        return { ...d, file, preview: URL.createObjectURL(file) };
      }),
    );
  }

  function clearPhoto(key: string) {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        if (d.preview?.startsWith("blob:")) URL.revokeObjectURL(d.preview);
        return { ...d, file: null, preview: undefined };
      }),
    );
  }

  async function saveExamsFromWizard() {
    if (!user?.id) return;
    const due = resolvedDue();
    const useful = drafts.filter((d) => d.title.trim() || d.file);
    if (useful.length === 0) {
      setShowExamWizard(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const items: Array<{ title: string; dueDate: string; photoUrl?: string }> =
        [];
      for (let i = 0; i < useful.length; i++) {
        const d = useful[i]!;
        const photoUrl = await resolvePhotoUrl(user.id, d.file, usingLocal);
        items.push({
          title: d.title.trim() || `Examen ${i + 1}`,
          dueDate: due,
          photoUrl,
        });
      }
      const nextExams = addExamsBatch(user.id, items);
      await persistAll(loadSchedule(user.id), nextExams);
      for (const d of drafts) {
        if (d.preview?.startsWith("blob:")) URL.revokeObjectURL(d.preview);
      }
      setDrafts([newDraft()]);
      setShowExamWizard(false);
      showMsg("Exámenes guardados · 15 días antes de la cita");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron guardar los exámenes",
      );
    } finally {
      setSaving(false);
    }
  }

  const pending = pendingExams(exams);
  const completed = doneExams(exams);
  const dueHint = appointmentDate
    ? `Exámenes · hazlos antes del ${dateDaysBefore(appointmentDate, EXAM_LEAD_DAYS)}`
    : `Exámenes · plazo ${EXAM_LEAD_DAYS} días (define la cita)`;

  return (
    <>
      <TopAppBar title="Cita y exámenes" backTo="/" />
      <main className="mx-auto max-w-2xl space-y-3 px-container-margin py-stack-md pb-32">
        {/* Resumen aparte: qué cita tienes */}
        <section className="glass-tint rounded-xl p-4 text-on-primary-container">
          <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-on-primary-container/80">
            Tu próxima cita
          </p>
          {appointmentDate ? (
            <>
              <p className="mt-1 text-headline-md font-semibold text-white">
                {formatAppointmentDate(appointmentDate)}
              </p>
              <p className="mt-0.5 text-body-sm text-on-primary-container/90">
                {formatMeasureTime(appointmentTime || "09:00")}
                {appointmentAddress ? ` · ${appointmentAddress}` : ""}
              </p>
              {pending.length > 0 ? (
                <div className="mt-3 rounded-lg bg-black/15 px-3 py-2">
                  <p className="text-[11px] font-semibold text-white">
                    {pending.length === 1
                      ? "1 examen por entregar"
                      : `${pending.length} exámenes por entregar`}
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {pending.slice(0, 3).map((e) => (
                      <li
                        key={e.id}
                        className="truncate text-[11px] text-on-primary-container/85"
                      >
                        · {e.title}
                      </li>
                    ))}
                    {pending.length > 3 ? (
                      <li className="text-[11px] text-on-primary-container/70">
                        · y {pending.length - 3} más
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : exams.length > 0 ? (
                <p className="mt-3 text-[11px] font-medium text-on-primary-container/90">
                  Exámenes al día · listos para la cita
                </p>
              ) : (
                <p className="mt-3 text-[11px] text-on-primary-container/70">
                  Sin exámenes pendientes registrados
                </p>
              )}
              <p className="mt-2 text-[11px] text-on-primary-container/75">
                Toma de tensión:{" "}
                {CADENCE_OPTIONS.find((o) => o.value === cadence)?.label ??
                  cadence}{" "}
                · {formatMeasureTime(measureTime)}
              </p>
              <p className="mt-2 text-[11px] text-on-primary-container/70">
                {syncing
                  ? "Sincronizando…"
                  : syncNote || "Guardada en tu cuenta"}
                {" · "}
                <a
                  href="#editar-cita"
                  className="font-semibold underline decoration-white/40 underline-offset-2"
                >
                  Editar abajo
                </a>
              </p>
            </>
          ) : (
            <p className="mt-1 text-body-lg text-on-primary-container/90">
              Aún no tienes una cita programada. Completa el formulario abajo.
            </p>
          )}
        </section>

        <section
          id="editar-cita"
          className="glass scroll-mt-4 space-y-4 rounded-xl p-4"
        >
          <div>
            <h2 className="text-body-lg font-semibold text-on-surface">
              Editar cita
            </h2>
            <p className="mt-0.5 text-[11px] text-secondary">
              Cambia fecha, hora o lugar y pulsa Guardar.
            </p>
          </div>

          {/* En iPhone: una columna para que date/time no se desborden */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Fecha *" htmlFor="apt-date">
              <input
                id="apt-date"
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => {
                  setAppointmentDate(e.target.value);
                  setError(null);
                }}
                className="field-input !h-11 min-w-0 max-w-full !text-body-sm"
              />
            </Field>
            <Field label="Hora" htmlFor="apt-time">
              <input
                id="apt-time"
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="field-input !h-11 min-w-0 max-w-full !text-body-sm"
              />
            </Field>
          </div>

          <Field label="Dirección" htmlFor="apt-address">
            <input
              id="apt-address"
              type="text"
              value={appointmentAddress}
              onChange={(e) => setAppointmentAddress(e.target.value)}
              className="field-input !h-11 min-w-0 max-w-full !text-body-sm"
              placeholder="Clínica o consultorio"
            />
          </Field>

          <div className="border-t border-white/40 pt-3">
            <h3 className="text-body-sm font-semibold text-on-surface">
              Toma de tensión
            </h3>
            <p className="mt-0.5 text-[11px] text-secondary">
              Cada cuánto te recuerda medir y a qué hora.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {CADENCE_OPTIONS.map((opt) => {
                const selected = cadence === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCadence(opt.value)}
                    className={[
                      "rounded-lg border px-2.5 py-2 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/50 bg-white/35 text-on-surface",
                    ].join(" ")}
                  >
                    <span className="block text-[12px] font-semibold leading-tight">
                      {opt.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug opacity-75">
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>

            {cadence === "custom" ? (
              <div className="mt-3">
                <Field label="Cada cuántos días" htmlFor="custom-days">
                  <input
                    id="custom-days"
                    type="number"
                    min={1}
                    max={90}
                    value={customDays}
                    onChange={(e) =>
                      setCustomDays(Number(e.target.value) || 1)
                    }
                    className="field-input !h-11 min-w-0 max-w-full !text-body-sm"
                  />
                </Field>
              </div>
            ) : null}

            <div className="mt-3">
              <Field label="Hora preferida de la toma" htmlFor="measure-time">
                <input
                  id="measure-time"
                  type="time"
                  value={measureTime}
                  onChange={(e) => setMeasureTime(e.target.value)}
                  className="field-input !h-11 min-w-0 max-w-full !text-body-sm"
                />
              </Field>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-error-container/90 px-3 py-2 text-body-sm text-on-error-container backdrop-blur-sm">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void saveAppointment()}
              disabled={saving || syncing}
              className="flex h-11 w-full flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-body-sm font-semibold text-on-primary disabled:opacity-60"
            >
              <FloppyDisk size={18} />
              {saving ? "Guardando…" : "Guardar cita y tomas"}
            </button>
            {appointmentDate ? (
              <button
                type="button"
                onClick={() => void markDone()}
                disabled={saving}
                className="flex h-11 w-full items-center justify-center gap-1 rounded-lg border border-white/50 bg-white/35 px-3 text-body-sm font-semibold text-secondary backdrop-blur-sm disabled:opacity-60 sm:w-auto"
              >
                <Check size={16} weight="bold" />
                Ya fui
              </button>
            ) : null}
          </div>

          {/* Divisor */}
          <div className="border-t border-white/40 pt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-body-sm font-semibold text-on-surface">
                  Exámenes
                </h3>
                <p className="text-[11px] text-secondary">{dueHint}</p>
              </div>
              {!showExamWizard ? (
                <button
                  type="button"
                  onClick={() => {
                    setDrafts([newDraft()]);
                    setShowExamWizard(true);
                  }}
                  className="flex items-center gap-0.5 text-body-sm font-semibold text-primary"
                >
                  <Plus size={14} weight="bold" />
                  Añadir
                </button>
              ) : null}
            </div>

            {showExamWizard && (
              <div className="mb-3 space-y-2 rounded-lg border border-white/40 bg-white/30 p-3 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-primary">
                  ¿Te dieron exámenes? · foto de evidencia
                </p>
                {drafts.map((d, index) => (
                  <div key={d.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-secondary">
                        Examen {index + 1}
                      </span>
                      {drafts.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            clearPhoto(d.key);
                            setDrafts((prev) =>
                              prev.filter((x) => x.key !== d.key),
                            );
                          }}
                          className="text-secondary hover:text-error"
                          aria-label="Quitar"
                        >
                          <Trash size={14} />
                        </button>
                      ) : null}
                    </div>
                    <input
                      type="text"
                      value={d.title}
                      onChange={(e) =>
                        setDrafts((prev) =>
                          prev.map((x) =>
                            x.key === d.key
                              ? { ...x, title: e.target.value }
                              : x,
                          ),
                        )
                      }
                      className="field-input !h-10 !text-body-sm"
                      placeholder="Lab, ECG, orina…"
                    />
                    {d.preview ? (
                      <div className="relative overflow-hidden rounded-lg border border-white/40">
                        <img
                          src={d.preview}
                          alt=""
                          className="max-h-28 w-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => clearPhoto(d.key)}
                          className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-inverse-surface/80 text-inverse-on-surface"
                          aria-label="Quitar foto"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            activeDraftKey.current = d.key;
                            cameraRef.current?.click();
                          }}
                          className="flex h-12 items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/50 bg-white/25 text-[10px] font-semibold uppercase text-secondary"
                        >
                          <Camera size={16} className="text-primary" />
                          Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            activeDraftKey.current = d.key;
                            galleryRef.current?.click();
                          }}
                          className="flex h-12 items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/50 bg-white/25 text-[10px] font-semibold uppercase text-secondary"
                        >
                          <ImageIcon size={16} className="text-primary" />
                          Galería
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setDrafts((prev) => [...prev, newDraft()])}
                  className="flex h-9 w-full items-center justify-center gap-1 text-body-sm font-semibold text-secondary"
                >
                  <Plus size={14} weight="bold" />
                  Otro examen
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveExamsFromWizard()}
                    disabled={saving}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-body-sm font-semibold text-on-primary disabled:opacity-60"
                  >
                    <FloppyDisk size={16} />
                    {saving ? "…" : "Guardar exámenes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExamWizard(false)}
                    className="h-10 rounded-lg px-3 text-body-sm font-semibold text-secondary"
                  >
                    Listo
                  </button>
                </div>
              </div>
            )}

            {pending.length === 0 && !showExamWizard ? (
              <p className="text-body-sm text-outline">
                Tras “Ya fui”, añade los exámenes 1, 2, 3… con foto.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {pending.map((exam) => (
                  <li
                    key={exam.id}
                    className="flex items-center gap-2 rounded-lg border border-white/35 bg-white/30 px-2 py-1.5 backdrop-blur-sm"
                  >
                    {exam.photoUrl ? (
                      <img
                        src={exam.photoUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white/40 text-[10px] text-secondary">
                        —
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-semibold text-on-surface">
                        {exam.title}
                      </p>
                      <p className="truncate text-[10px] text-secondary">
                        {formatExamLabel(exam)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user?.id) return;
                        void (async () => {
                          const nextExams = markExamDone(user.id, exam.id);
                          await persistAll(loadSchedule(user.id), nextExams);
                          showMsg("Examen hecho");
                        })();
                      }}
                      className="shrink-0 text-[10px] font-semibold uppercase text-primary"
                    >
                      Hecho
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => {
                        if (!user?.id) return;
                        void (async () => {
                          const nextExams = removeExam(user.id, exam.id);
                          await persistAll(loadSchedule(user.id), nextExams);
                        })();
                      }}
                      className="shrink-0 p-1 text-secondary hover:text-error"
                    >
                      <Trash size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {completed.length > 0 && (
              <div className="mt-3 space-y-1 border-t border-white/30 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-outline">
                  Hechos
                </p>
                {completed.map((exam) => (
                  <div
                    key={exam.id}
                    className="flex items-center gap-2 text-[12px] text-secondary"
                  >
                    {exam.photoUrl ? (
                      <img
                        src={exam.photoUrl}
                        alt=""
                        className="h-6 w-6 rounded object-cover opacity-80"
                      />
                    ) : null}
                    <span className="truncate">{formatExamLabel(exam)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico compacto */}
          <div className="border-t border-white/40 pt-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-outline">
              Histórico de citas
            </p>
            {history.length === 0 ? (
              <p className="text-[12px] text-outline">Sin citas previas</p>
            ) : (
              <ul className="max-h-28 space-y-0.5 overflow-y-auto">
                {history.map((appt) => (
                  <li
                    key={appt.id}
                    className="truncate text-[12px] text-on-surface/80"
                  >
                    {formatAppointmentFull(appt)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            const key = activeDraftKey.current;
            if (file && key) applyPhoto(key, file);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            const key = activeDraftKey.current;
            if (file && key) applyPhoto(key, file);
            e.target.value = "";
          }}
        />
      </main>
      <Toast message={toastMessage} visible={toast} />
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold uppercase tracking-[0.04em] text-on-surface-variant"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

import { Check, FloppyDisk, SignOut, Trash } from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Toast } from "../components/Toast";
import { TopAppBar } from "../components/TopAppBar";
import { useAuth } from "../context/AuthContext";
import {
  CADENCE_OPTIONS,
  completeCurrentAppointment,
  deleteHistoryAppointment,
  formatAppointmentFull,
  loadSchedule,
  saveSchedule,
  upsertNextAppointment,
  type Appointment,
  type ReportCadence,
} from "../lib/reportSchedule";
import type { Sex } from "../types";

export function ProfilePage() {
  const { profile, user, updateProfile, signOut, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [cadence, setCadence] = useState<ReportCadence>("pre_cita_7");
  const [customDays, setCustomDays] = useState("5");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("09:00");
  const [appointmentAddress, setAppointmentAddress] = useState("");
  const [measureTime, setMeasureTime] = useState("08:00");
  const [history, setHistory] = useState<Appointment[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Perfil actualizado");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName ?? "");
    setBirthDate(profile.birthDate ?? "");
    setSex(profile.sex ?? "");
    setHeightCm(profile.heightCm != null ? String(profile.heightCm) : "");
    setWeightKg(profile.weightKg != null ? String(profile.weightKg) : "");
    setNotes(profile.notes ?? "");
  }, [profile]);

  useEffect(() => {
    if (!user?.id) {
      setHistory([]);
      return;
    }
    const s = saveSchedule(user.id, loadSchedule(user.id));
    setCadence(s.cadence);
    setCustomDays(String(s.customDays));
    setMeasureTime(s.measureTime);
    setAppointmentDate(s.nextAppointment?.date ?? "");
    setAppointmentTime(s.nextAppointment?.time ?? "09:00");
    setAppointmentAddress(s.nextAppointment?.address ?? "");
    setHistory(s.appointmentHistory);
  }, [user?.id]);

  function persistSchedule(
    mutate: (s: ReturnType<typeof loadSchedule>) => ReturnType<typeof loadSchedule>,
  ) {
    if (!user?.id) return;
    const next = mutate(loadSchedule(user.id));
    const saved = saveSchedule(user.id, next);
    setHistory(saved.appointmentHistory);
    setAppointmentDate(saved.nextAppointment?.date ?? "");
    setAppointmentTime(saved.nextAppointment?.time ?? "09:00");
    setAppointmentAddress(saved.nextAppointment?.address ?? "");
    return saved;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (user?.id) {
        let next = loadSchedule(user.id);
        next = {
          ...next,
          cadence,
          customDays: Number(customDays) || 5,
          measureTime,
        };
        next = upsertNextAppointment(next, appointmentDate, appointmentTime, {
          address: appointmentAddress,
        });
        const saved = saveSchedule(user.id, next);
        setHistory(saved.appointmentHistory);
        setAppointmentAddress(saved.nextAppointment?.address ?? "");
      }

      try {
        await updateProfile({
          fullName,
          birthDate: birthDate || undefined,
          sex: sex || "",
          heightCm: heightCm ? Number(heightCm) : null,
          weightKg: weightKg ? Number(weightKg) : null,
          notes,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? `Agenda guardada. Perfil: ${err.message}`
            : "Agenda guardada. El perfil en la nube no se pudo actualizar.",
        );
        setToastMessage("Agenda guardada");
        setToast(true);
        window.setTimeout(() => setToast(false), 2200);
        return;
      }

      setToastMessage("Perfil actualizado");
      setToast(true);
      window.setTimeout(() => setToast(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  function saveAppointmentOnly() {
    if (!user?.id) {
      setError("Inicia sesión para guardar la cita.");
      return;
    }
    if (!appointmentDate) {
      setError("Elige la fecha de tu próxima cita.");
      return;
    }
    setError(null);
    let next = loadSchedule(user.id);
    next = {
      ...next,
      cadence,
      customDays: Number(customDays) || 5,
      measureTime,
    };
    next = upsertNextAppointment(next, appointmentDate, appointmentTime, {
      address: appointmentAddress,
    });
    const saved = saveSchedule(user.id, next);
    setHistory(saved.appointmentHistory);
    setAppointmentDate(saved.nextAppointment?.date ?? "");
    setAppointmentTime(saved.nextAppointment?.time ?? "09:00");
    setAppointmentAddress(saved.nextAppointment?.address ?? "");
    setToastMessage("Cita guardada");
    setToast(true);
    window.setTimeout(() => setToast(false), 2200);
  }

  function markAppointmentDone() {
    persistSchedule(completeCurrentAppointment);
    setToastMessage("Cita pasada al histórico");
    setToast(true);
    window.setTimeout(() => setToast(false), 2200);
  }

  function removeHistoryItem(id: string) {
    persistSchedule((s) => deleteHistoryAppointment(s, id));
  }

  async function handleSignOut() {
    await signOut();
  }

  const initials =
    (fullName || profile?.email || "U")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <>
      <TopAppBar title="Mi perfil" backTo="/" />
      <main className="mx-auto max-w-2xl space-y-stack-md px-container-margin py-stack-md pb-32">
        <section className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-stack-md shadow-[var(--shadow-card)]">
          {profile?.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-full border border-outline-variant object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container text-headline-md font-semibold text-on-secondary-container">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-headline-md font-semibold text-on-surface">
              {fullName || "Sin nombre"}
            </p>
            <p className="truncate text-body-sm text-secondary">
              {profile?.email || user?.email}
            </p>
          </div>
        </section>

        <form className="space-y-stack-md" onSubmit={onSubmit}>
          <Field label="Nombre completo" htmlFor="fullName">
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="field-input"
              placeholder="Tu nombre"
            />
          </Field>

          <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
            <Field label="Fecha de nacimiento" htmlFor="birthDate">
              <input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="field-input"
              />
            </Field>

            <Field label="Sexo" htmlFor="sex">
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex | "")}
                className="field-input"
              >
                <option value="">Sin especificar</option>
                <option value="female">Mujer</option>
                <option value="male">Hombre</option>
                <option value="other">Otro</option>
                <option value="unspecified">Prefiero no decir</option>
              </select>
            </Field>

            <Field label="Altura (cm)" htmlFor="height">
              <input
                id="height"
                type="number"
                inputMode="decimal"
                min={50}
                max={250}
                step="0.1"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="field-input"
                placeholder="170"
              />
            </Field>

            <Field label="Peso (kg)" htmlFor="weight">
              <input
                id="weight"
                type="number"
                inputMode="decimal"
                min={20}
                max={400}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="field-input"
                placeholder="70"
              />
            </Field>
          </div>

          <section className="space-y-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
            <div>
              <h3 className="text-body-lg font-semibold text-on-surface">
                Cita y tomas
              </h3>
              <p className="mt-0.5 text-[11px] text-secondary">
                Define tu próxima cita (aún pendiente). Pulsa Guardar cita.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CompactField label="Próxima cita" htmlFor="appointmentDate">
                <input
                  id="appointmentDate"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="field-input !h-11 !text-body-sm"
                />
              </CompactField>
              <CompactField label="Hora cita" htmlFor="appointmentTime">
                <input
                  id="appointmentTime"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="field-input !h-11 !text-body-sm"
                />
              </CompactField>
              <CompactField label="Toma diaria" htmlFor="measureTime">
                <input
                  id="measureTime"
                  type="time"
                  value={measureTime}
                  onChange={(e) => setMeasureTime(e.target.value)}
                  className="field-input !h-11 !text-body-sm"
                />
              </CompactField>
              <CompactField label="Plan" htmlFor="cadence">
                <select
                  id="cadence"
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value as ReportCadence)}
                  className="field-input !h-11 !text-body-sm"
                >
                  {CADENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </CompactField>
            </div>

            <CompactField label="Dirección" htmlFor="appointmentAddress">
              <input
                id="appointmentAddress"
                type="text"
                value={appointmentAddress}
                onChange={(e) => setAppointmentAddress(e.target.value)}
                className="field-input !h-11 !text-body-sm"
                placeholder="Clínica, consultorio o dirección"
                autoComplete="street-address"
              />
            </CompactField>

            {cadence === "custom" && (
              <CompactField label="Cada N días" htmlFor="customDays">
                <input
                  id="customDays"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={90}
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="field-input !h-11 !text-body-sm"
                />
              </CompactField>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveAppointmentOnly}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-body-sm font-semibold text-on-primary transition-transform active:scale-[0.98]"
              >
                <FloppyDisk size={18} />
                Guardar cita
              </button>
              {appointmentDate ? (
                <button
                  type="button"
                  onClick={markAppointmentDone}
                  title="Solo cuando ya fuiste a la cita"
                  className="flex h-11 items-center justify-center gap-1 rounded-lg border border-outline-variant px-3 text-body-sm font-semibold text-secondary transition-colors hover:bg-surface-container-lowest"
                >
                  <Check size={16} weight="bold" />
                  Ya fui
                </button>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                Histórico
              </p>
              {history.length === 0 ? (
                <p className="text-body-sm text-outline">
                  Aquí aparecerán las citas cuando pulses “Ya fui” o cambies la
                  fecha.
                </p>
              ) : (
                <ul className="max-h-36 space-y-1 overflow-y-auto">
                  {history.map((appt) => (
                    <li
                      key={appt.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-surface-container-lowest"
                    >
                      <span className="truncate text-body-sm text-on-surface">
                        {formatAppointmentFull(appt)}
                      </span>
                      <button
                        type="button"
                        aria-label="Eliminar cita"
                        onClick={() => removeHistoryItem(appt.id)}
                        className="shrink-0 rounded p-1 text-secondary hover:text-error"
                      >
                        <Trash size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <Field label="Notas de salud (opcional)" htmlFor="notes">
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="field-input resize-none"
              placeholder="Medicación, antecedentes, etc."
            />
          </Field>

          <a
            href="/bienvenida"
            className="block text-center text-body-sm font-semibold text-primary"
            onClick={(e) => {
              e.preventDefault();
              if (user?.id) {
                localStorage.removeItem(`vitalstrack.onboarding.done.${user.id}`);
              }
              window.location.href = "/bienvenida";
            }}
          >
            Volver a hacer el cuestionario
          </a>

          {error && (
            <p className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-headline-md font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <FloppyDisk size={24} />
            {saving ? "Guardando..." : "Guardar perfil"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant text-body-lg font-semibold text-secondary transition-colors hover:bg-surface-container-low active:scale-[0.98]"
        >
          <SignOut size={22} />
          Cerrar sesión
        </button>
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
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function CompactField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
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

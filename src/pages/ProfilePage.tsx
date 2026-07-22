import { FloppyDisk, SignOut } from "@phosphor-icons/react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Toast } from "../components/Toast";
import { TopAppBar } from "../components/TopAppBar";
import { useAuth } from "../context/AuthContext";
import type { Sex } from "../types";

export function ProfilePage() {
  const { profile, user, updateProfile, signOut, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        fullName,
        birthDate: birthDate || undefined,
        sex: sex || "",
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        notes,
      });
      setToastMessage("Perfil actualizado");
      setToast(true);
      window.setTimeout(() => setToast(false), 2200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "El perfil no se pudo actualizar.",
      );
    } finally {
      setSaving(false);
    }
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
        <section className="glass flex items-center gap-4 rounded-xl p-stack-md">
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

          <Link
            to="/citas"
            className="block text-center text-body-sm font-semibold text-primary"
          >
            Gestionar citas y exámenes
          </Link>

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

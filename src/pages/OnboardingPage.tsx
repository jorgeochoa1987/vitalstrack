import { Check, CaretRight, Heartbeat } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Sex } from "../types";
import { isOnboardingDone, markOnboardingDone } from "../lib/onboarding";

export function OnboardingPage() {
  const { user, profile, updateProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [sex, setSex] = useState<Sex | "">("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [hasHta, setHasHta] = useState(false);
  const [hasDiabetes, setHasDiabetes] = useState(false);
  const [isSmoker, setIsSmoker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName((v) => v || profile.fullName || "");
    setBirthDate((v) => v || profile.birthDate || "");
    setSex((v) => v || profile.sex || "");
    setHeightCm((v) => v || (profile.heightCm != null ? String(profile.heightCm) : ""));
    setWeightKg((v) => v || (profile.weightKg != null ? String(profile.weightKg) : ""));
  }, [profile]);

  const steps = useMemo(
    () => [
      { title: "¿Cómo te llamas?", subtitle: "Así te saludamos en VitalsTrack" },
      { title: "Cuéntanos un poco de ti", subtitle: "Edad y sexo ayudan a contextualizar tus lecturas" },
      { title: "Tu cuerpo", subtitle: "Altura y peso (puedes cambiarlos después)" },
      { title: "Tu salud", subtitle: "Marca lo que aplique. No es un diagnóstico." },
    ],
    [],
  );

  if (!loading && user && isOnboardingDone(user.id, profile)) {
    return <Navigate to="/" replace />;
  }

  async function finish() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const healthBits = [
        hasHta ? "HTA conocida: sí" : null,
        hasDiabetes ? "Diabetes: sí" : null,
        isSmoker ? "Fumador: sí" : null,
      ].filter(Boolean);

      const existingNotes = profile?.notes?.trim();
      const notes = [existingNotes, healthBits.length ? healthBits.join(" · ") : null]
        .filter(Boolean)
        .join("\n");

      await updateProfile({
        fullName: fullName.trim() || profile?.fullName,
        birthDate: birthDate || undefined,
        sex: sex || "",
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        notes: notes || undefined,
      });
      markOnboardingDone(user.id);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar. Puedes completar tu perfil más tarde.",
      );
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (step === 0 && !fullName.trim()) {
      setError("Escribe tu nombre para continuar.");
      return;
    }
    setError(null);
    if (step >= steps.length - 1) {
      void finish();
      return;
    }
    setStep((s) => s + 1);
  }

  function skip() {
    if (!user) return;
    markOnboardingDone(user.id);
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="border-b border-outline-variant px-container-margin py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
            <Heartbeat size={22} weight="fill" />
          </div>
          <div>
            <p className="text-headline-md font-semibold text-primary">VitalsTrack</p>
            <p className="text-body-sm text-secondary">
              Paso {step + 1} de {steps.length}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-container-margin py-stack-md">
        <div className="mb-6 flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={[
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-surface-container",
              ].join(" ")}
            />
          ))}
        </div>

        <h1 className="text-headline-lg-mobile font-bold text-on-surface">
          {steps[step].title}
        </h1>
        <p className="mt-2 text-body-lg text-secondary">{steps[step].subtitle}</p>

        <div className="mt-stack-md flex-1 space-y-stack-md">
          {step === 0 && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="ob-name"
                className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
              >
                Nombre
              </label>
              <input
                id="ob-name"
                className="field-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre"
                autoFocus
              />
            </div>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="ob-birth"
                  className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
                >
                  Fecha de nacimiento
                </label>
                <input
                  id="ob-birth"
                  type="date"
                  className="field-input"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="ob-sex"
                  className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
                >
                  Sexo
                </label>
                <select
                  id="ob-sex"
                  className="field-input"
                  value={sex}
                  onChange={(e) => setSex(e.target.value as Sex | "")}
                >
                  <option value="">Sin especificar</option>
                  <option value="female">Mujer</option>
                  <option value="male">Hombre</option>
                  <option value="other">Otro</option>
                  <option value="unspecified">Prefiero no decir</option>
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-stack-md">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="ob-height"
                  className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
                >
                  Altura (cm)
                </label>
                <input
                  id="ob-height"
                  type="number"
                  inputMode="decimal"
                  className="field-input"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="170"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="ob-weight"
                  className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
                >
                  Peso (kg)
                </label>
                <input
                  id="ob-weight"
                  type="number"
                  inputMode="decimal"
                  className="field-input"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="70"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <CheckRow
                checked={hasHta}
                onChange={setHasHta}
                label="Me han dicho que tengo hipertensión"
              />
              <CheckRow
                checked={hasDiabetes}
                onChange={setHasDiabetes}
                label="Tengo diabetes"
              />
              <CheckRow
                checked={isSmoker}
                onChange={setIsSmoker}
                label="Fumo actualmente"
              />
              <p className="text-body-sm text-outline">
                Puedes editar todo después en Mi perfil.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {error}
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3 pb-8 pt-stack-md">
          <button
            type="button"
            onClick={next}
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-headline-md font-semibold text-on-primary shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {saving
              ? "Guardando..."
              : step >= steps.length - 1
                ? "Empezar en VitalsTrack"
                : "Continuar"}
            {!saving && step < steps.length - 1 && <CaretRight size={22} weight="bold" />}
            {!saving && step >= steps.length - 1 && <Check size={22} weight="bold" />}
          </button>
          <button
            type="button"
            onClick={skip}
            className="w-full py-2 text-body-sm font-semibold text-secondary"
          >
            Omitir por ahora
          </button>
        </div>
      </main>
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors",
        checked
          ? "border-primary bg-primary-fixed text-on-primary-fixed"
          : "border-outline-variant/40 bg-surface-container-lowest text-on-surface",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
          checked
            ? "border-primary bg-primary text-on-primary"
            : "border-outline-variant bg-white",
        ].join(" ")}
      >
        {checked && <Check size={14} weight="bold" />}
      </span>
      <span className="text-body-lg font-medium">{label}</span>
    </button>
  );
}

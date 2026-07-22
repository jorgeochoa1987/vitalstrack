import {
  CalendarBlank,
  Camera,
  Clock,
  FloppyDisk,
  Heart,
  Heartbeat,
  Image as ImageIcon,
  Pulse,
  X,
} from "@phosphor-icons/react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAuth } from "../context/AuthContext";
import { useMeasurements } from "../context/MeasurementsContext";
import { resolvePhotoUrl } from "../lib/photo";
import type { Measurement } from "../types";

function toDateInput(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function stampNow() {
  const stamp = new Date();
  return {
    date: toDateInput(stamp.toISOString()),
    time: toTimeInput(stamp.toISOString()),
  };
}

interface MeasurementFormProps {
  measurement?: Measurement;
  onSuccess?: () => void;
  compact?: boolean;
}

export function MeasurementForm({
  measurement,
  onSuccess,
  compact = false,
}: MeasurementFormProps) {
  const { user } = useAuth();
  const { addMeasurement, updateMeasurement, usingLocal } = useMeasurements();
  const isEdit = Boolean(measurement);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const initial = stampNow();
  const [systolic, setSystolic] = useState(
    measurement ? String(measurement.systolic) : "",
  );
  const [diastolic, setDiastolic] = useState(
    measurement ? String(measurement.diastolic) : "",
  );
  const [pulse, setPulse] = useState(
    measurement ? String(measurement.pulse) : "",
  );
  const [date, setDate] = useState(
    measurement ? toDateInput(measurement.recordedAt) : initial.date,
  );
  const [time, setTime] = useState(
    measurement ? toTimeInput(measurement.recordedAt) : initial.time,
  );
  const [notes, setNotes] = useState(measurement?.notes ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(
    measurement?.photoUrl,
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const now = stampNow();
    setSystolic(measurement ? String(measurement.systolic) : "");
    setDiastolic(measurement ? String(measurement.diastolic) : "");
    setPulse(measurement ? String(measurement.pulse) : "");
    setDate(measurement ? toDateInput(measurement.recordedAt) : now.date);
    setTime(measurement ? toTimeInput(measurement.recordedAt) : now.time);
    setNotes(measurement?.notes ?? "");
    setPhotoPreview(measurement?.photoUrl);
    setPhotoFile(null);
    setFormError(null);
  }, [measurement]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function applyPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setFormError("Selecciona una imagen válida.");
      return;
    }
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(url);
    // Al tomar la foto, fecha y hora = ahora (el usuario puede cambiarlas)
    const now = stampNow();
    setDate(now.date);
    setTime(now.time);
    setFormError(null);
  }

  function clearPhoto() {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(isEdit ? measurement?.photoUrl : undefined);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const sys = Number(systolic);
    const dia = Number(diastolic);
    const pul = Number(pulse);

    if (!sys || !dia || !pul || sys < 60 || sys > 250 || dia < 40 || dia > 150) {
      setFormError("Revisa los valores de tensión y pulso.");
      return;
    }

    if (!user?.id) {
      setFormError("Debes iniciar sesión.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      let photoUrl = measurement?.photoUrl;
      if (photoFile) {
        photoUrl = await resolvePhotoUrl(user.id, photoFile, usingLocal);
      } else if (!photoPreview) {
        photoUrl = undefined;
      }

      const payload = {
        systolic: sys,
        diastolic: dia,
        pulse: pul,
        recordedAt: combineDateTime(date, time),
        notes,
        photoUrl,
      };

      if (isEdit && measurement) {
        await updateMeasurement(measurement.id, payload);
      } else {
        await addMeasurement(payload);
      }
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar en Supabase.";
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  const fieldSize = compact ? 28 : 32;

  return (
    <form className="space-y-stack-md" onSubmit={onSubmit}>
      <section className="space-y-3">
        <p className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
          Foto del tensiómetro
        </p>

        {photoPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low">
            <img
              src={photoPreview}
              alt="Foto de la medición"
              className="max-h-56 w-full object-contain"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-inverse-surface/80 text-inverse-on-surface"
              aria-label="Quitar foto"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low text-secondary transition-colors hover:bg-surface-container active:scale-[0.98]"
            >
              <Camera size={28} className="text-primary" />
              <span className="text-label-bold font-semibold uppercase tracking-[0.05em]">
                Tomar foto
              </span>
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-low text-secondary transition-colors hover:bg-surface-container active:scale-[0.98]"
            >
              <ImageIcon size={28} className="text-primary" />
              <span className="text-label-bold font-semibold uppercase tracking-[0.05em]">
                Galería
              </span>
            </button>
          </div>
        )}

        <p className="text-body-sm text-secondary">
          Foto la pantalla del monitor, escribe los valores y guarda. Fecha y
          hora se rellenan con ahora; puedes cambiarlas.
        </p>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) applyPhoto(file);
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
            if (file) applyPhoto(file);
            e.target.value = "";
          }}
        />
      </section>

      <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
        <VitalField
          id="systolic"
          label="Tensión sistólica (mmHg)"
          icon={<Heartbeat size={fieldSize} className="text-primary" />}
          value={systolic}
          onChange={setSystolic}
          placeholder="120"
          focused={focused === "systolic"}
          onFocus={() => setFocused("systolic")}
          onBlur={() => setFocused(null)}
          compact={compact}
        />
        <VitalField
          id="diastolic"
          label="Tensión diastólica (mmHg)"
          icon={<Pulse size={fieldSize} className="text-primary" />}
          value={diastolic}
          onChange={setDiastolic}
          placeholder="80"
          focused={focused === "diastolic"}
          onFocus={() => setFocused("diastolic")}
          onBlur={() => setFocused(null)}
          compact={compact}
        />
        <VitalField
          id="pulse"
          label="Pulsaciones (bpm)"
          icon={
            <Heart size={fieldSize} weight="fill" className="text-error" />
          }
          value={pulse}
          onChange={setPulse}
          placeholder="72"
          className="md:col-span-2"
          focused={focused === "pulse"}
          onFocus={() => setFocused("pulse")}
          onBlur={() => setFocused(null)}
          compact={compact}
        />
      </div>

      <div className="grid grid-cols-1 gap-stack-md pt-stack-sm md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="date"
            className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
          >
            Fecha de medición
          </label>
          <div className="relative flex items-center">
            <CalendarBlank size={22} className="absolute left-4 text-secondary" />
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-14 w-full rounded-lg border-none bg-surface-container-low pr-4 pl-12 text-body-lg text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="time"
            className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
          >
            Hora de medición
          </label>
          <div className="relative flex items-center">
            <Clock size={22} className="absolute left-4 text-secondary" />
            <input
              id="time"
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-14 w-full rounded-lg border-none bg-surface-container-low pr-4 pl-12 text-body-lg text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-stack-sm">
        <label
          htmlFor="notes"
          className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant"
        >
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          rows={compact ? 3 : 4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej. Después de hacer ejercicio, me sentía algo cansado..."
          className="w-full resize-none rounded-lg border-none bg-surface-container-low p-4 text-body-lg text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>

      {formError && (
        <p className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {formError}
        </p>
      )}

      <div className="pt-stack-md">
        <button
          type="submit"
          disabled={saving}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-headline-md font-semibold text-on-primary shadow-lg transition-transform duration-200 active:scale-[0.98] disabled:opacity-60"
        >
          <FloppyDisk size={24} />
          {saving
            ? "Guardando..."
            : isEdit
              ? "Actualizar registro"
              : "Guardar registro"}
        </button>
      </div>
    </form>
  );
}

function VitalField({
  id,
  label,
  icon,
  value,
  onChange,
  placeholder,
  className = "",
  focused,
  onFocus,
  onBlur,
  compact,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-[var(--shadow-card)] transition-shadow",
        compact ? "p-4" : "p-stack-md",
        focused ? "ring-2 ring-primary/10" : "",
        className,
      ].join(" ")}
    >
      <label
        htmlFor={id}
        className="mb-2 block text-label-bold font-semibold uppercase tracking-[0.05em] text-secondary"
      >
        {label}
      </label>
      <div className="flex items-center gap-4">
        {icon}
        <input
          id={id}
          name={id}
          type="number"
          inputMode="numeric"
          required
          min={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className={[
            "w-full border-b-2 border-outline-variant bg-transparent p-0 font-bold transition-all focus:border-primary focus:outline-none",
            compact
              ? "h-12 text-[32px] tracking-tight"
              : "h-16 text-data-display",
          ].join(" ")}
        />
      </div>
    </div>
  );
}

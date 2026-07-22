import { X } from "@phosphor-icons/react";
import { useEffect } from "react";
import type { Measurement } from "../types";
import { MeasurementForm } from "./MeasurementForm";

interface RecordModalProps {
  open: boolean;
  measurement?: Measurement;
  onClose: () => void;
  onSaved: () => void;
}

export function RecordModal({
  open,
  measurement,
  onClose,
  onSaved,
}: RecordModalProps) {
  const isEdit = Boolean(measurement);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px] transition-opacity"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-modal-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_8px_40px_rgba(17,28,45,0.18)] sm:rounded-xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/40 px-container-margin py-4">
          <div>
            <h2
              id="record-modal-title"
              className="text-headline-md font-semibold text-primary"
            >
              {isEdit ? "Editar registro" : "Nuevo registro"}
            </h2>
            <p className="mt-0.5 text-body-sm text-secondary">
              {isEdit
                ? "Puedes actualizar valores, foto, fecha y hora."
                : "Toma una foto del monitor. Fecha y hora = ahora (editables)."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container active:scale-95"
            aria-label="Cerrar"
          >
            <X size={22} weight="bold" />
          </button>
        </div>

        <div className="overflow-y-auto px-container-margin py-stack-md">
          <MeasurementForm
            key={measurement?.id ?? "new"}
            measurement={measurement}
            compact
            onSuccess={onSaved}
          />
        </div>
      </div>
    </div>
  );
}

import { Trash, X } from "@phosphor-icons/react";
import { useEffect } from "react";
import type { Measurement } from "../types";
import { formatBp, formatDateTime } from "../lib/bp";

interface ConfirmDeleteDialogProps {
  measurement: Measurement | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteDialog({
  measurement,
  deleting,
  onCancel,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const open = Boolean(measurement);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!measurement) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <button
        type="button"
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-[2px]"
        aria-label="Cancelar"
        onClick={onCancel}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        className="relative z-10 w-full max-w-sm rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-stack-md shadow-[0_8px_40px_rgba(17,28,45,0.18)]"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-on-error-container">
            <Trash size={24} />
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container"
            aria-label="Cerrar"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <h2
          id="confirm-delete-title"
          className="mt-4 text-headline-md font-semibold text-on-surface"
        >
          ¿Eliminar esta medición?
        </h2>
        <p className="mt-2 text-body-sm text-secondary">
          {formatBp(measurement.systolic, measurement.diastolic)} mmHg ·{" "}
          {measurement.pulse} lpm
          <br />
          {formatDateTime(measurement.recordedAt)}
        </p>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Esta acción no se puede deshacer.
        </p>

        <div className="mt-stack-md flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-lg border border-outline-variant text-body-lg font-semibold text-secondary transition-colors hover:bg-surface-container-low active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-12 flex-1 rounded-lg bg-error text-body-lg font-semibold text-on-error shadow-lg transition-transform duration-200 active:scale-[0.98] disabled:opacity-60"
          >
            {deleting ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}

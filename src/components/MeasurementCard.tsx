import { CalendarBlank, Heart, PencilSimple, Trash } from "@phosphor-icons/react";
import type { Measurement } from "../types";
import {
  formatBp,
  formatDateShort,
  formatTime,
  getBpStatus,
  statusBarClass,
  statusValueClass,
} from "../lib/bp";

interface MeasurementCardProps {
  measurement: Measurement;
  onEdit?: (measurement: Measurement) => void;
  onDelete?: (measurement: Measurement) => void;
}

export function MeasurementCard({
  measurement,
  onEdit,
  onDelete,
}: MeasurementCardProps) {
  const status = getBpStatus(measurement.systolic, measurement.diastolic);
  const valueClass = statusValueClass(status);

  return (
    <div className="glass flex cursor-pointer items-center gap-4 rounded-xl p-5 transition-transform active:scale-[0.98]">
      <div className={`h-16 w-2 shrink-0 rounded-full ${statusBarClass(status)}`} />
      {measurement.photoUrl && (
        <img
          src={measurement.photoUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg border border-outline-variant/40 object-cover"
        />
      )}
      <div className="min-w-0 flex-grow">
        <div className="mb-1 flex items-center gap-1.5 text-outline">
          <CalendarBlank size={14} weight="regular" />
          <span className="text-[12px] font-semibold tracking-wide uppercase">
            {formatDateShort(measurement.recordedAt)}
          </span>
          <span className="text-[12px] opacity-60">·</span>
          <span className="text-[12px] font-medium normal-case tracking-normal">
            {formatTime(measurement.recordedAt)}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-data-display font-bold ${valueClass}`}>
            {formatBp(measurement.systolic, measurement.diastolic)}
          </span>
          <span className="text-label-bold font-semibold uppercase tracking-[0.05em] text-secondary">
            mmHg
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-secondary">
          <Heart size={18} weight="regular" />
          <span className="text-body-sm">{measurement.pulse} lpm</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container"
          aria-label="Editar medición"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(measurement);
          }}
        >
          <PencilSimple size={22} />
        </button>
        {onDelete && (
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-error-container hover:text-on-error-container"
            aria-label="Eliminar medición"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(measurement);
            }}
          >
            <Trash size={22} />
          </button>
        )}
      </div>
    </div>
  );
}

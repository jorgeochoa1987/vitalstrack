import { CheckCircle } from "@phosphor-icons/react";
import { MEASUREMENT_RULES } from "../data/measurementRules";

interface MeasurementRulesProps {
  compact?: boolean;
}

export function MeasurementRules({ compact = false }: MeasurementRulesProps) {
  return (
    <div
      className={[
        "rounded-xl border border-outline-variant/40 bg-surface-container-low",
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      <p className="mb-2 text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
        Antes de medir
      </p>
      <ul className={compact ? "space-y-1.5" : "space-y-2"}>
        {MEASUREMENT_RULES.map((rule) => (
          <li key={rule} className="flex gap-2 text-body-sm text-secondary">
            <CheckCircle
              size={compact ? 16 : 18}
              weight="fill"
              className="mt-0.5 shrink-0 text-primary"
            />
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

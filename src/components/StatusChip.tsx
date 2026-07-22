import { CheckCircle, Warning } from "@phosphor-icons/react";
import type { BpStatus } from "../types";
import { statusLabel } from "../lib/bp";

const styles: Record<BpStatus, string> = {
  normal: "bg-success-container text-success border-success-border",
  elevated: "bg-warning-container text-warning-text border-warning/40",
  stage1: "bg-stage1-container text-stage1 border-stage1-border",
  stage2: "bg-error-container text-on-error-container border-error/20",
  crisis: "bg-crisis-container text-crisis border-crisis/30",
};

export function StatusChip({ status }: { status: BpStatus }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 ${styles[status]}`}
    >
      {status === "normal" && <CheckCircle size={18} weight="fill" />}
      {(status === "stage2" || status === "crisis") && (
        <Warning size={18} weight="fill" />
      )}
      <span className="text-label-bold font-semibold uppercase tracking-[0.05em]">
        {statusLabel(status)}
      </span>
    </div>
  );
}

import { CheckCircle } from "@phosphor-icons/react";

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={[
        "fixed inset-x-0 bottom-24 z-50 mx-auto flex w-max items-center gap-3 rounded-full bg-inverse-surface px-6 py-3 text-inverse-on-surface shadow-2xl transition-transform duration-500",
        visible ? "translate-y-0" : "translate-y-32 pointer-events-none",
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <CheckCircle size={22} weight="fill" className="text-primary-fixed" />
      <span className="text-body-sm">{message}</span>
    </div>
  );
}

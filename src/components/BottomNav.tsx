import {
  ChartLine,
  CalendarBlank,
  ClockCounterClockwise,
  SquaresFour,
} from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Inicio", icon: SquaresFour, end: true },
  {
    to: "/historial",
    label: "Historial",
    icon: ClockCounterClockwise,
    end: false,
  },
  { to: "/citas", label: "Cita", icon: CalendarBlank, end: false },
  { to: "/graficos", label: "Gráficos", icon: ChartLine, end: false },
] as const;

export function BottomNav() {
  return (
    <nav className="glass-nav fixed bottom-0 z-50 w-full border-t pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-[4.75rem] w-full max-w-5xl items-stretch gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-transform duration-200 active:scale-[0.98]",
                isActive
                  ? "bg-white/65 text-primary shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7),0_2px_10px_rgb(17_28_45_/_0.06)] backdrop-blur-md"
                  : "bg-white/25 text-on-surface-variant hover:bg-white/40 hover:text-primary",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={24} weight={isActive ? "fill" : "regular"} />
                <span className="max-w-full truncate text-[10px] font-semibold uppercase tracking-[0.04em] sm:text-label-bold sm:tracking-[0.05em]">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

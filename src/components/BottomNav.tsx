import { ChartLine, CalendarBlank, ClockCounterClockwise, SquaresFour } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Inicio", icon: SquaresFour, end: true },
  { to: "/historial", label: "Historial", icon: ClockCounterClockwise, end: false },
  { to: "/citas", label: "Cita", icon: CalendarBlank, end: false },
  { to: "/graficos", label: "Gráficos", icon: ChartLine, end: false },
] as const;

export function BottomNav() {
  return (
    <nav className="glass-nav fixed bottom-0 z-50 w-full border-t">
      <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-around px-4">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex flex-col items-center justify-center rounded-lg px-2 py-1 transition-transform duration-200 active:scale-95 sm:px-4",
                isActive
                  ? "bg-white/55 text-primary shadow-sm backdrop-blur-sm"
                  : "text-on-surface-variant opacity-70 hover:text-primary",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={24} weight={isActive ? "fill" : "regular"} />
                <span className="text-label-bold font-semibold uppercase tracking-[0.05em]">
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

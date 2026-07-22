import { Plus } from "@phosphor-icons/react";
import { Link } from "react-router-dom";

interface FabProps {
  to?: string;
  onClick?: () => void;
}

export function Fab({ to = "/registro", onClick }: FabProps) {
  const className =
    "fixed bottom-28 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/90 text-on-primary shadow-[0_8px_28px_rgb(0_60_144_/_0.28)] backdrop-blur-md transition-transform duration-200 hover:scale-105 active:scale-95";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={className}
        aria-label="Nuevo registro"
      >
        <Plus size={32} weight="bold" />
      </button>
    );
  }

  return (
    <Link to={to} className={className} aria-label="Nuevo registro">
      <Plus size={32} weight="bold" />
    </Link>
  );
}

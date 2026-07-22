import { CaretLeft, Heartbeat } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface TopAppBarProps {
  title: string;
  showBrandIcon?: boolean;
  backTo?: string;
  trailing?: ReactNode;
  showProfile?: boolean;
}

export function TopAppBar({
  title,
  showBrandIcon = true,
  backTo,
  trailing,
  showProfile = true,
}: TopAppBarProps) {
  const { profile } = useAuth();
  const initials =
    (profile?.fullName || profile?.email || "U")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-container-margin">
        <div className="flex items-center gap-3">
          {backTo ? (
            <Link
              to={backTo}
              className="rounded-full p-2 text-primary transition-colors hover:bg-surface-container-low active:opacity-80"
              aria-label="Volver"
            >
              <CaretLeft size={24} weight="bold" />
            </Link>
          ) : showBrandIcon ? (
            <Heartbeat size={28} weight="regular" className="text-primary" />
          ) : null}
          <h1 className="text-headline-md font-semibold text-primary">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {trailing}
          {showProfile && (
            <Link
              to="/perfil"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-secondary-container transition-transform active:scale-95"
              aria-label="Mi perfil"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-label-bold font-semibold text-on-secondary-container">
                  {initials}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

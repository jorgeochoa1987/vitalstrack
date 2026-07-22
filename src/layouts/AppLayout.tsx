import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { Fab } from "../components/Fab";

export function AppLayout() {
  const { pathname } = useLocation();
  const isRegistro = pathname.startsWith("/registro");
  const showChrome = !isRegistro;
  const showGlobalFab =
    showChrome &&
    pathname !== "/historial" &&
    pathname !== "/perfil" &&
    pathname !== "/citas";

  return (
    <div className="relative min-h-[100dvh] bg-transparent">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-secondary-container/60 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-primary-fixed/50 blur-3xl" />
      </div>
      <Outlet />
      {showChrome && (
        <>
          {showGlobalFab && <Fab />}
          <BottomNav />
        </>
      )}
    </div>
  );
}

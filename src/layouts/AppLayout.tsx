import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { Fab } from "../components/Fab";

export function AppLayout() {
  const { pathname } = useLocation();
  const isRegistro = pathname.startsWith("/registro");
  const showChrome = !isRegistro;
  const showGlobalFab =
    showChrome && pathname !== "/historial" && pathname !== "/perfil";

  return (
    <div className="min-h-[100dvh] bg-background">
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

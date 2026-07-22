import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isOnboardingDone } from "../pages/OnboardingPage";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background text-body-sm text-secondary">
        Cargando sesión...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const onOnboarding = location.pathname.startsWith("/bienvenida");
  const needsOnboarding =
    Boolean(session.user) && !isOnboardingDone(session.user.id, profile);

  if (needsOnboarding && !onOnboarding) {
    return <Navigate to="/bienvenida" replace />;
  }

  if (!needsOnboarding && onOnboarding) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/** Layout helper if needed later */
export function ProtectedOutlet() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  );
}

import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { MeasurementsProvider } from "./context/MeasurementsContext";
import { AppLayout } from "./layouts/AppLayout";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { LoginPage } from "./pages/LoginPage";

const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const HistoryPage = lazy(() =>
  import("./pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
);
const AppointmentsPage = lazy(() =>
  import("./pages/AppointmentsPage").then((m) => ({
    default: m.AppointmentsPage,
  })),
);
const ChartsPage = lazy(() =>
  import("./pages/ChartsPage").then((m) => ({ default: m.ChartsPage })),
);
const NewRecordPage = lazy(() =>
  import("./pages/NewRecordPage").then((m) => ({ default: m.NewRecordPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const OnboardingPage = lazy(() =>
  import("./pages/OnboardingPage").then((m) => ({ default: m.OnboardingPage })),
);

function PageFallback() {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center text-body-sm text-secondary">
      Cargando…
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            <Route
              path="/bienvenida"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <MeasurementsProvider>
                    <AppLayout />
                  </MeasurementsProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="historial" element={<HistoryPage />} />
              <Route path="citas" element={<AppointmentsPage />} />
              <Route path="graficos" element={<ChartsPage />} />
              <Route path="registro" element={<NewRecordPage />} />
              <Route path="registro/:id" element={<NewRecordPage />} />
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { MeasurementsProvider } from "./context/MeasurementsContext";
import { AppLayout } from "./layouts/AppLayout";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { ChartsPage } from "./pages/ChartsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { NewRecordPage } from "./pages/NewRecordPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfilePage } from "./pages/ProfilePage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

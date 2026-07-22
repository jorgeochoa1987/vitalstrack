import { Heartbeat } from "@phosphor-icons/react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { session, loading, signInWithGoogle } = useAuth();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session) {
    return <Navigate to={from} replace />;
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión con Google",
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="relative flex flex-1 flex-col justify-center px-container-margin py-stack-lg">
        <div className="mx-auto w-full max-w-md space-y-stack-lg">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary-container text-on-primary-container">
              <Heartbeat size={36} weight="fill" />
            </div>
            <h1 className="text-headline-lg-mobile font-bold text-primary md:text-headline-lg">
              VitalsTrack
            </h1>
            <p className="text-body-lg text-secondary">
              Tu tensión, tu historial y tu evolución en un solo lugar.
            </p>
          </div>

          <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-stack-md shadow-[var(--shadow-card)]">
            <p className="mb-stack-md text-center text-body-sm text-on-surface-variant">
              Inicia sesión para guardar tu historial y perfil de forma segura.
            </p>

            <button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={busy || loading}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-outline-variant bg-white text-body-lg font-semibold text-on-surface shadow-sm transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              <GoogleIcon />
              {busy ? "Redirigiendo..." : "Continuar con Google"}
            </button>

            {error && (
              <p className="mt-3 rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">
                {error}
              </p>
            )}
          </div>

          <p className="text-center text-body-sm text-outline">
            Al continuar, aceptas el uso de tus datos de perfil de Google para
            identificar tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.1 4 9.2 8.5 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.1 39.4 16 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.5 7.1l.1.1 6.2 5.2C36.9 39.1 44 34 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { error } = await supabase.auth.getSession();
      if (cancelled) return;
      if (error) {
        navigate("/login", { replace: true });
        return;
      }
      navigate("/", { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background text-body-sm text-secondary">
      Completando inicio de sesión...
    </div>
  );
}

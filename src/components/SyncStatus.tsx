interface SyncStatusProps {
  loading: boolean;
  error: string | null;
  usingLocal?: boolean;
  onRetry?: () => void;
}

export function SyncStatus({
  loading,
  error,
  usingLocal = false,
  onRetry,
}: SyncStatusProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-body-sm text-secondary">
        Sincronizando con Supabase...
      </div>
    );
  }

  if (!error && !usingLocal) return null;

  const missingTable =
    Boolean(error) &&
    (error!.includes("schema cache") ||
      error!.includes("Could not find the table") ||
      error!.includes("aún no tiene la tabla") ||
      error!.includes("auth_schema") ||
      error!.includes("vincular mediciones"));

  if (usingLocal || missingTable) {
    return (
      <div className="space-y-3 rounded-lg border border-primary/20 bg-primary-fixed px-4 py-4 text-body-sm text-on-primary-fixed">
        <p className="font-semibold">Modo local activo</p>
        <p>
          Para guardar en la nube, ejecuta el SQL completo en Supabase (una sola
          vez):
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Abre el{" "}
            <a
              className="font-semibold underline"
              href="https://supabase.com/dashboard/project/xezaqveqrwprponiyzze/sql/new"
              target="_blank"
              rel="noreferrer"
            >
              SQL Editor
            </a>
          </li>
          <li>
            Copia todo el archivo{" "}
            <code className="rounded bg-white/50 px-1">supabase/setup_all.sql</code>{" "}
            del proyecto
          </li>
          <li>Pégalo y pulsa <strong>Run</strong> (debe decir Success)</li>
          <li>
            Confirma en{" "}
            <a
              className="font-semibold underline"
              href="https://supabase.com/dashboard/project/xezaqveqrwprponiyzze/editor"
              target="_blank"
              rel="noreferrer"
            >
              Table Editor
            </a>{" "}
            que existan <code>measurements</code> y <code>profiles</code>
          </li>
          <li>Vuelve aquí y pulsa reintentar (inicia sesión con Google)</li>
        </ol>
        {error && (
          <p className="rounded-md bg-white/40 px-3 py-2 text-body-sm opacity-90">
            Detalle: {error}
          </p>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-primary px-3 py-1.5 font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            Ya ejecuté el SQL, reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container sm:flex-row sm:items-center sm:justify-between">
      <p>{error}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-md bg-on-error-container/10 px-3 py-1.5 font-semibold transition-opacity hover:opacity-80"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

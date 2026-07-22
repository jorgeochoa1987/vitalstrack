import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { SEED_MEASUREMENTS } from "../data/seed";
import {
  inputToRow,
  rowToMeasurement,
  supabase,
  type MeasurementRow,
} from "../lib/supabase";
import type { Measurement, MeasurementInput } from "../types";

function storageKey(userId: string) {
  return `vitalstrack.measurements.${userId}`;
}

interface MeasurementsContextValue {
  measurements: Measurement[];
  loading: boolean;
  error: string | null;
  usingLocal: boolean;
  refresh: () => Promise<void>;
  addMeasurement: (input: MeasurementInput) => Promise<Measurement>;
  updateMeasurement: (id: string, input: MeasurementInput) => Promise<void>;
  removeMeasurement: (id: string) => Promise<void>;
  getById: (id: string) => Measurement | undefined;
}

const MeasurementsContext = createContext<MeasurementsContextValue | null>(null);

function sortByDate(items: Measurement[]): Measurement[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );
}

function isMissingTableError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes("PGRST205")
  );
}

function loadLocal(userId: string): Measurement[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return sortByDate(SEED_MEASUREMENTS);
    const parsed = JSON.parse(raw) as Measurement[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return sortByDate(SEED_MEASUREMENTS);
    }
    return sortByDate(parsed);
  } catch {
    return sortByDate(SEED_MEASUREMENTS);
  }
}

function saveLocal(userId: string, items: Measurement[]) {
  localStorage.setItem(storageKey(userId), JSON.stringify(items));
}

export function MeasurementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocal, setUsingLocal] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setMeasurements([]);
      return;
    }

    setError(null);
    const { data, error: queryError } = await supabase
      .from("measurements")
      .select("id, systolic, diastolic, pulse, recorded_at, notes, photo_url")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false });

    if (queryError) {
      if (isMissingTableError(queryError.message)) {
        const local = loadLocal(userId);
        setUsingLocal(true);
        setMeasurements(local);
        setError(
          "Supabase aún no tiene la tabla measurements. Mientras tanto usamos datos locales.",
        );
        return;
      }
      // Sin columna user_id / RLS: intentar sin filtro y caer a local
      if (
        queryError.message.includes("user_id") ||
        queryError.code === "42703"
      ) {
        setUsingLocal(true);
        setMeasurements(loadLocal(userId));
        setError(
          "Ejecuta supabase/auth_schema.sql para vincular mediciones a tu usuario.",
        );
        return;
      }
      setUsingLocal(false);
      setError(queryError.message);
      setMeasurements([]);
      return;
    }

    setUsingLocal(false);
    setMeasurements(
      sortByDate((data as MeasurementRow[]).map(rowToMeasurement)),
    );
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const addMeasurement = useCallback(
    async (input: MeasurementInput) => {
      if (!userId) throw new Error("Debes iniciar sesión");

      if (usingLocal) {
        const next: Measurement = {
          ...input,
          id: crypto.randomUUID(),
          notes: input.notes?.trim() || undefined,
          photoUrl: input.photoUrl,
        };
        setMeasurements((prev) => {
          const updated = sortByDate([next, ...prev]);
          saveLocal(userId, updated);
          return updated;
        });
        return next;
      }

      const { data, error: insertError } = await supabase
        .from("measurements")
        .insert(inputToRow(input, userId))
        .select("id, systolic, diastolic, pulse, recorded_at, notes, photo_url")
        .single();

      if (insertError) {
        // Columna photo_url aún no existe: reintentar sin foto en DB
        if (
          insertError.message.includes("photo_url") ||
          insertError.code === "42703" ||
          insertError.code === "PGRST204"
        ) {
          const { photo_url: _photo, ...rest } = inputToRow(input, userId);
          const retry = await supabase
            .from("measurements")
            .insert(rest)
            .select("id, systolic, diastolic, pulse, recorded_at, notes")
            .single();
          if (retry.error) {
            setError(retry.error.message);
            throw retry.error;
          }
          const next = rowToMeasurement({
            ...(retry.data as MeasurementRow),
            photo_url: input.photoUrl ?? null,
          });
          setMeasurements((prev) => sortByDate([next, ...prev]));
          return next;
        }

        if (isMissingTableError(insertError.message)) {
          setUsingLocal(true);
          const next: Measurement = {
            ...input,
            id: crypto.randomUUID(),
            notes: input.notes?.trim() || undefined,
            photoUrl: input.photoUrl,
          };
          setMeasurements((prev) => {
            const updated = sortByDate([next, ...prev]);
            saveLocal(userId, updated);
            return updated;
          });
          setError(
            "Supabase aún no tiene la tabla measurements. Guardado en local.",
          );
          return next;
        }
        setError(insertError.message);
        throw insertError;
      }

      const next = rowToMeasurement(data as MeasurementRow);
      setMeasurements((prev) => sortByDate([next, ...prev]));
      return next;
    },
    [usingLocal, userId],
  );

  const updateMeasurement = useCallback(
    async (id: string, input: MeasurementInput) => {
      if (!userId) throw new Error("Debes iniciar sesión");

      if (usingLocal) {
        setMeasurements((prev) => {
          const updated = sortByDate(
            prev.map((m) =>
              m.id === id
                ? { ...m, ...input, notes: input.notes?.trim() || undefined }
                : m,
            ),
          );
          saveLocal(userId, updated);
          return updated;
        });
        return;
      }

      const { data, error: updateError } = await supabase
        .from("measurements")
        .update({
          ...inputToRow(input, userId),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select("id, systolic, diastolic, pulse, recorded_at, notes, photo_url")
        .single();

      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }

      const updated = rowToMeasurement(data as MeasurementRow);
      setMeasurements((prev) =>
        sortByDate(prev.map((m) => (m.id === id ? updated : m))),
      );
    },
    [usingLocal, userId],
  );

  const removeMeasurement = useCallback(
    async (id: string) => {
      if (!userId) throw new Error("Debes iniciar sesión");

      if (usingLocal) {
        setMeasurements((prev) => {
          const updated = prev.filter((m) => m.id !== id);
          saveLocal(userId, updated);
          return updated;
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from("measurements")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }

      setMeasurements((prev) => prev.filter((m) => m.id !== id));
    },
    [usingLocal, userId],
  );

  const value = useMemo<MeasurementsContextValue>(
    () => ({
      measurements,
      loading,
      error,
      usingLocal,
      refresh,
      addMeasurement,
      updateMeasurement,
      removeMeasurement,
      getById: (id) => measurements.find((m) => m.id === id),
    }),
    [
      measurements,
      loading,
      error,
      usingLocal,
      refresh,
      addMeasurement,
      updateMeasurement,
      removeMeasurement,
    ],
  );

  return (
    <MeasurementsContext.Provider value={value}>
      {children}
    </MeasurementsContext.Provider>
  );
}

export function useMeasurements(): MeasurementsContextValue {
  const ctx = useContext(MeasurementsContext);
  if (!ctx) {
    throw new Error("useMeasurements must be used within MeasurementsProvider");
  }
  return ctx;
}

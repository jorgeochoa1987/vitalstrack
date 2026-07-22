import { Heart, TrendDown, TrendUp } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SyncStatus } from "../components/SyncStatus";
import { TopAppBar } from "../components/TopAppBar";
import { useMeasurements } from "../context/MeasurementsContext";
import { average, inLastDays } from "../lib/bp";

type Range = "semana" | "mes";

export function ChartsPage() {
  const { measurements, loading, error, usingLocal, refresh } =
    useMeasurements();
  const [range, setRange] = useState<Range>("semana");
  const days = range === "semana" ? 7 : 30;

  const filtered = useMemo(
    () =>
      measurements
        .filter((m) => inLastDays(m.recordedAt, days))
        .sort(
          (a, b) =>
            new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
        ),
    [measurements, days],
  );

  const bpData = useMemo(() => {
    if (range === "semana") {
      const labels = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
      const buckets = labels.map((label) => ({
        label,
        systolic: null as number | null,
        diastolic: null as number | null,
        pulse: null as number | null,
      }));

      for (const m of filtered) {
        const day = (new Date(m.recordedAt).getDay() + 6) % 7;
        buckets[day] = {
          label: labels[day],
          systolic: m.systolic,
          diastolic: m.diastolic,
          pulse: m.pulse,
        };
      }
      return buckets;
    }

    return filtered.map((m) => ({
      label: new Date(m.recordedAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      }),
      systolic: m.systolic,
      diastolic: m.diastolic,
      pulse: m.pulse,
    }));
  }, [filtered, range]);

  const pulseAvg = average(filtered.map((m) => m.pulse));
  const maxSys = filtered.length
    ? Math.max(...filtered.map((m) => m.systolic))
    : 0;
  const maxPulse = filtered.length
    ? Math.max(...filtered.map((m) => m.pulse))
    : 0;
  const minDia = filtered.length
    ? Math.min(...filtered.map((m) => m.diastolic))
    : 0;
  const minPulse = filtered.length
    ? Math.min(...filtered.map((m) => m.pulse))
    : 0;

  return (
    <>
      <TopAppBar title="Tendencias" />
      <main className="mx-auto max-w-4xl space-y-stack-lg px-container-margin pt-6 pb-32">
        <SyncStatus
          loading={loading}
          error={error}
          usingLocal={usingLocal}
          onRetry={() => void refresh()}
        />
        <section className="flex justify-center">
          <div className="flex w-full max-w-sm rounded-lg bg-surface-container-low p-1">
            {(["semana", "mes"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                className={[
                  "flex-1 rounded-md px-4 py-2 text-label-bold font-semibold uppercase tracking-[0.05em] transition-all",
                  range === key
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "text-secondary hover:bg-surface-container",
                ].join(" ")}
              >
                {key === "semana" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-headline-md font-semibold">Presión arterial</h2>
              <p className="text-body-sm text-secondary">
                Evolución de sístole y diástole
              </p>
            </div>
            <div className="flex gap-4">
              <LegendDot color="bg-primary" label="SIS" />
              <LegendDot
                color="bg-secondary-container border border-primary"
                label="DIA"
              />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bpData}>
                <defs>
                  <linearGradient id="sysFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f52ba" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#0f52ba" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#737784", fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[50, 180]}
                  tick={{ fill: "#737784", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #c3c6d5",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="systolic"
                  stroke="#003c90"
                  strokeWidth={3}
                  fill="url(#sysFill)"
                  connectNulls
                  name="Sistólica"
                />
                <Line
                  type="monotone"
                  dataKey="diastolic"
                  stroke="#505f76"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                  name="Diastólica"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-headline-md font-semibold">
                Frecuencia cardiaca
              </h2>
              <p className="text-body-sm text-secondary">
                Latidos por minuto (LPM)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Heart size={22} weight="fill" className="text-error" />
              <span className="text-label-bold font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
                {pulseAvg || "-"} LPM promedio
              </span>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bpData}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#737784", fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[40, 120]}
                  tick={{ fill: "#737784", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #c3c6d5",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="pulse"
                  stroke="#ba1a1a"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#ba1a1a" }}
                  connectNulls
                  name="Pulso"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
          <div className="rounded-lg border border-primary/10 bg-surface-container-high/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <TrendUp size={24} className="text-primary" />
              <h3 className="text-headline-md font-semibold text-on-primary-fixed-variant">
                Valores máximos
              </h3>
            </div>
            <div className="space-y-4">
              <StatRow label="Presión sistólica" value={maxSys || "-"} unit="mmHg" accent="text-primary" />
              <StatRow label="Frec. cardiaca" value={maxPulse || "-"} unit="LPM" accent="text-error" />
            </div>
          </div>

          <div className="rounded-lg border border-secondary/10 bg-surface-container-low p-6">
            <div className="mb-4 flex items-center gap-3">
              <TrendDown size={24} className="text-secondary" />
              <h3 className="text-headline-md font-semibold text-on-secondary-fixed-variant">
                Valores mínimos
              </h3>
            </div>
            <div className="space-y-4">
              <StatRow label="Presión diastólica" value={minDia || "-"} unit="mmHg" accent="text-secondary" />
              <StatRow label="Frec. cardiaca" value={minPulse || "-"} unit="LPM" accent="text-secondary" />
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-xl bg-primary-container p-6 text-on-primary-container">
          <div className="relative z-10 flex-1">
            <h4 className="mb-2 text-headline-md font-semibold">
              Resumen {range === "semana" ? "semanal" : "mensual"}
            </h4>
            <p className="text-body-sm opacity-90">
              {filtered.length === 0
                ? "Aún no hay datos suficientes en este periodo."
                : `Tu presión arterial se ha mantenido con ${filtered.length} registros en los últimos ${days} días.`}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-label-bold font-semibold uppercase tracking-[0.05em] text-secondary">
        {label}
      </span>
    </div>
  );
}

function StatRow({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number | string;
  unit: string;
  accent: string;
}) {
  return (
    <div className="flex items-end justify-between border-b border-outline-variant/30 pb-2">
      <span className="text-body-sm text-secondary">{label}</span>
      <div className="text-right">
        <span className={`text-headline-md font-bold ${accent}`}>{value}</span>
        <span className="ml-1 text-label-bold font-semibold uppercase tracking-[0.05em] text-secondary">
          {unit}
        </span>
      </div>
    </div>
  );
}

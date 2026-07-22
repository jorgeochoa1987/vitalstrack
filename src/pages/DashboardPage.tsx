import {
  CalendarBlank,
  ChartBar,
  Heart,
  Heartbeat,
  Lightbulb,
  TrendUp,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { StatusChip } from "../components/StatusChip";
import { SyncStatus } from "../components/SyncStatus";
import { TopAppBar } from "../components/TopAppBar";
import { useAuth } from "../context/AuthContext";
import { useMeasurements } from "../context/MeasurementsContext";
import { tipOfTheDay } from "../data/healthTips";
import {
  average,
  BP_SCALE_SLIDES,
  formatBp,
  formatDateTime,
  getBpStatus,
  inLastDays,
  statusContainerClass,
  weekAgo,
} from "../lib/bp";
import { syncPrefsFromCloud } from "../lib/cloudPrefs";
import { loadExams, pendingExams, type Exam } from "../lib/exams";
import {
  getNextAppointment,
  getNextMeasure,
  loadSchedule,
  type ReportSchedule,
} from "../lib/reportSchedule";

export function DashboardPage() {
  const { profile, user } = useAuth();
  const { measurements, loading, error, usingLocal, refresh } =
    useMeasurements();
  const [schedule, setSchedule] = useState<ReportSchedule>(() =>
    loadSchedule(user?.id),
  );
  const [exams, setExams] = useState<Exam[]>(() => loadExams(user?.id));

  useEffect(() => {
    if (!user?.id) {
      setSchedule(loadSchedule(null));
      setExams([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await syncPrefsFromCloud(user.id);
      if (!cancelled) {
        setSchedule(result.schedule);
        setExams(result.exams);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const latest = measurements[0];
  const status = latest
    ? getBpStatus(latest.systolic, latest.diastolic)
    : "normal";

  const firstName =
    profile?.fullName?.trim().split(/\s+/)[0] ||
    profile?.email?.split("@")[0] ||
    "";

  const nextMeasure = useMemo(
    () => getNextMeasure(schedule, latest?.recordedAt),
    [schedule, latest?.recordedAt],
  );
  const nextAppointment = useMemo(
    () => getNextAppointment(schedule),
    [schedule],
  );
  const pending = useMemo(() => pendingExams(exams), [exams]);
  const todayTip = useMemo(() => tipOfTheDay(), []);
  const swipeSlides = useMemo(
    () => [
      ...BP_SCALE_SLIDES.map((s) => ({ kind: "scale" as const, ...s })),
      {
        kind: "tip" as const,
        id: todayTip.id,
        title: todayTip.title,
        body: todayTip.body,
      },
    ],
    [todayTip],
  );
  const [tipIndex, setTipIndex] = useState(0);
  const tipsRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tipsRailRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const slide = el.querySelector<HTMLElement>("[data-tip-slide]");
      if (!slide) return;
      const gap = 12;
      const w = slide.offsetWidth + gap;
      const idx = Math.round(el.scrollLeft / w);
      setTipIndex(Math.max(0, Math.min(swipeSlides.length - 1, idx)));
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [swipeSlides.length]);

  function goToTip(index: number) {
    const el = tipsRailRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-tip-slide]");
    if (!slide) return;
    const gap = 12;
    el.scrollTo({ left: index * (slide.offsetWidth + gap), behavior: "smooth" });
  }

  const stats = useMemo(() => {
    const thisWeek = measurements.filter((m) => inLastDays(m.recordedAt, 7));
    const prevWeek = measurements.filter((m) => {
      const t = new Date(m.recordedAt).getTime();
      const end = weekAgo().getTime();
      const start = weekAgo(weekAgo()).getTime();
      return t >= start && t < end;
    });

    const sysAvg = average(thisWeek.map((m) => m.systolic));
    const diaAvg = average(thisWeek.map((m) => m.diastolic));
    const prevSys = average(prevWeek.map((m) => m.systolic));
    const prevDia = average(prevWeek.map((m) => m.diastolic));

    const sysDelta =
      prevSys === 0 ? 0 : Math.round(((sysAvg - prevSys) / prevSys) * 100);
    const diaDelta =
      prevDia === 0 ? 0 : Math.round(((diaAvg - prevDia) / prevDia) * 100);

    return { sysAvg, diaAvg, sysDelta, diaDelta };
  }, [measurements]);

  return (
    <>
      <TopAppBar title="VitalsTrack" />
      <main className="mx-auto max-w-5xl space-y-stack-lg px-container-margin py-stack-md pb-32">
        <SyncStatus
          loading={loading}
          error={error}
          usingLocal={usingLocal}
          onRetry={() => void refresh()}
        />
        <section className="space-y-2">
          <p className="text-label-bold font-semibold uppercase tracking-widest text-primary">
            Dashboard
          </p>
          <h2 className="text-headline-lg-mobile font-bold md:text-headline-lg">
            {firstName ? `Hola, ${firstName}` : "Hola"}
          </h2>
        </section>

        {latest ? (
          <section className="glass relative overflow-hidden rounded-xl p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary sm:text-label-bold sm:tracking-[0.05em]">
                  Última medición
                </h3>
                <p className="truncate text-[11px] text-on-surface-variant sm:text-body-sm">
                  {formatDateTime(latest.recordedAt)}
                </p>
              </div>
              <StatusChip status={status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                  <span className="text-[28px] font-bold leading-none text-primary sm:text-data-display">
                    {formatBp(latest.systolic, latest.diastolic)}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary">
                    mmHg
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.min(100, (latest.systolic / 180) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant sm:text-body-sm">
                  Presión
                </p>
              </div>

              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0">
                  <span className="text-[28px] font-bold leading-none text-secondary sm:text-data-display">
                    {latest.pulse}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary">
                    bpm
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{
                      width: `${Math.min(100, (latest.pulse / 140) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant sm:text-body-sm">
                  Pulso
                </p>
              </div>
            </div>

            <div className="pointer-events-none absolute right-[-20px] bottom-[-20px] opacity-[0.03]">
              <Heart size={140} weight="fill" />
            </div>
          </section>
        ) : (
          <section className="glass rounded-xl p-3 sm:p-4">
            <p className="text-body-sm text-secondary sm:text-body-lg">
              Aún no hay mediciones. Pulsa + para registrar la primera.
            </p>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-body-lg font-semibold sm:text-headline-md">
            Promedio semanal
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-xl p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-1">
                <div className="rounded-md bg-white/50 p-1.5 text-primary">
                  <TrendUp size={16} />
                </div>
                <DeltaBadge value={stats.sysDelta} betterWhen="down" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary sm:text-label-bold sm:tracking-[0.05em]">
                Sistólica
              </p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-[28px] font-bold leading-none text-on-surface sm:text-[32px]">
                  {stats.sysAvg || "-"}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary sm:text-label-bold">
                  mmHg
                </span>
              </div>
            </div>

            <div className="glass rounded-xl p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-1">
                <div className="rounded-md bg-white/50 p-1.5 text-secondary">
                  <ChartBar size={16} />
                </div>
                <DeltaBadge value={stats.diaDelta} betterWhen="down" />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary sm:text-label-bold sm:tracking-[0.05em]">
                Diastólica
              </p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-[28px] font-bold leading-none text-on-surface sm:text-[32px]">
                  {stats.diaAvg || "-"}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-secondary sm:text-label-bold">
                  mmHg
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link
            to="/citas"
            className="glass-tint flex min-h-0 flex-col gap-1 rounded-xl p-3 transition-opacity hover:opacity-95 sm:p-4"
          >
            <div className="flex items-center gap-1.5">
              <Heartbeat
                size={18}
                className="shrink-0 text-on-primary-container"
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-on-primary-container/80 sm:text-label-bold sm:tracking-[0.05em]">
                Próxima toma
              </p>
            </div>
            <p className="text-body-lg font-semibold leading-snug text-on-primary-container sm:text-headline-md">
              {nextMeasure.headline}
            </p>
            <p className="line-clamp-2 text-[11px] leading-snug text-on-primary-container/75 sm:text-body-sm">
              {nextMeasure.detail}
            </p>
          </Link>

          <Link
            to="/citas"
            className="glass flex min-h-0 flex-col gap-1 rounded-xl p-3 transition-colors hover:bg-white/60 sm:p-4"
          >
            <div className="flex items-center gap-1.5">
              <CalendarBlank size={18} className="shrink-0 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-primary sm:text-label-bold sm:tracking-[0.05em]">
                Próxima cita
              </p>
            </div>
            <p className="text-body-lg font-semibold leading-snug text-on-surface sm:text-headline-md">
              {nextAppointment.headline}
            </p>
            <p className="line-clamp-2 text-[11px] leading-snug text-secondary sm:text-body-sm">
              {nextAppointment.detail}
            </p>
            {pending.length > 0 ? (
              <p className="mt-1 text-[11px] font-semibold leading-snug text-warning-text sm:text-body-sm">
                {pending.length === 1
                  ? "1 examen por entregar"
                  : `${pending.length} exámenes por entregar`}
              </p>
            ) : exams.length > 0 ? (
              <p className="mt-1 text-[11px] font-medium leading-snug text-success sm:text-body-sm">
                Exámenes al día
              </p>
            ) : null}
          </Link>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lightbulb size={20} className="text-primary" weight="fill" />
              <h3 className="text-body-lg font-semibold sm:text-headline-md">
                Cómo se mide
              </h3>
            </div>
            <p className="text-[11px] text-outline">
              AHA/ACC 2026 · {tipIndex + 1}/{swipeSlides.length}
            </p>
          </div>

          <div
            ref={tipsRailRef}
            className="-mx-container-margin flex snap-x snap-mandatory gap-3 overflow-x-auto px-container-margin pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {swipeSlides.map((slide) =>
              slide.kind === "scale" ? (
                <article
                  key={slide.status}
                  data-tip-slide
                  className={`w-[min(100%,20rem)] shrink-0 snap-center rounded-xl p-3 sm:w-[22rem] sm:p-4 ${statusContainerClass(slide.status)}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.05em] opacity-80">
                    Escala 2026
                    {latest && status === slide.status ? " · tu última" : ""}
                  </p>
                  <h4 className="mt-1 text-body-lg font-semibold">{slide.title}</h4>
                  <p className="mt-0.5 text-[12px] font-semibold opacity-90">
                    {slide.range}
                  </p>
                  <p className="mt-1 text-body-sm leading-relaxed opacity-85">
                    {slide.body}
                  </p>
                </article>
              ) : (
                <article
                  key={slide.id}
                  data-tip-slide
                  className="glass w-[min(100%,20rem)] shrink-0 snap-center rounded-xl p-3 sm:w-[22rem] sm:p-4"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-primary">
                    Tip del día
                  </p>
                  <h4 className="mt-1 text-body-lg font-semibold text-on-surface">
                    {slide.title}
                  </h4>
                  <p className="mt-1 text-body-sm leading-relaxed text-secondary">
                    {slide.body}
                  </p>
                </article>
              ),
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            {swipeSlides.map((slide, i) => (
              <button
                key={slide.kind === "scale" ? slide.status : slide.id}
                type="button"
                aria-label={`Ir al tip ${i + 1}`}
                onClick={() => goToTip(i)}
                className={[
                  "h-1.5 rounded-full transition-all",
                  i === tipIndex
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-outline-variant",
                ].join(" ")}
              />
            ))}
          </div>

          <p className="text-center text-[11px] text-outline">
            Orientación general · no sustituye la consulta con tu médico
          </p>
        </section>
      </main>
    </>
  );
}

function DeltaBadge({
  value,
  betterWhen,
}: {
  value: number;
  betterWhen: "down" | "up";
}) {
  if (value === 0) {
    return (
      <span className="rounded bg-surface-container px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-secondary sm:px-2 sm:text-label-bold sm:tracking-[0.05em]">
        Igual
      </span>
    );
  }

  const improved =
    (betterWhen === "down" && value < 0) || (betterWhen === "up" && value > 0);
  const sign = value > 0 ? "+" : "";

  return (
    <span
      className={[
        "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] sm:px-2 sm:text-label-bold sm:tracking-[0.05em]",
        improved
          ? "bg-success-container text-success"
          : "bg-error-container text-on-error-container",
      ].join(" ")}
    >
      {sign}
      {value}%
    </span>
  );
}

import { CalendarBlank, MagnifyingGlass } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { Fab } from "../components/Fab";
import { MeasurementCard } from "../components/MeasurementCard";
import { RecordModal } from "../components/RecordModal";
import { SyncStatus } from "../components/SyncStatus";
import { Toast } from "../components/Toast";
import { TopAppBar } from "../components/TopAppBar";
import { useMeasurements } from "../context/MeasurementsContext";
import { formatBp, groupByDay } from "../lib/bp";
import type { Measurement } from "../types";

export function HistoryPage() {
  const { measurements, loading, error, usingLocal, refresh, removeMeasurement } =
    useMeasurements();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Measurement | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Measurement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToast(true);
    window.setTimeout(() => setToast(false), 2500);
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? measurements.filter((m) => {
          const hay = [
            formatBp(m.systolic, m.diastolic),
            String(m.pulse),
            m.notes ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      : measurements;
    return groupByDay(filtered);
  }, [measurements, query]);

  const openNew = useCallback(() => {
    setEditing(undefined);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((m: Measurement) => {
    setEditing(m);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(undefined);
  }, []);

  const handleSaved = useCallback(() => {
    const wasEdit = Boolean(editing);
    setModalOpen(false);
    setEditing(undefined);
    showToast(
      wasEdit
        ? "Registro actualizado correctamente"
        : "Registro guardado correctamente",
    );
  }, [editing, showToast]);

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeMeasurement(pendingDelete.id);
      setPendingDelete(null);
      showToast("Medición eliminada");
    } catch {
      showToast("No se pudo eliminar la medición");
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, removeMeasurement, showToast]);

  return (
    <>
      <TopAppBar title="Historial" />
      <main className="mx-auto max-w-2xl space-y-stack-md px-container-margin pt-stack-md pb-32">
        <SyncStatus
          loading={loading}
          error={error}
          usingLocal={usingLocal}
          onRetry={() => void refresh()}
        />
        <div className="mb-stack-lg">
          <div className="relative">
            <MagnifyingGlass
              size={22}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-outline"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar mediciones..."
              className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pr-4 pl-12 text-body-lg transition-all focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center opacity-60">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-surface-container">
              <CalendarBlank size={48} className="text-secondary" />
            </div>
            <p className="text-body-sm">
              No hay mediciones que coincidan con tu búsqueda.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-stack-sm">
            {groups.map((group) => (
              <div key={group.label} className="contents">
                <p className="mt-stack-md px-2 text-label-bold font-semibold tracking-wider text-secondary uppercase first:mt-0">
                  {group.label}
                </p>
                {group.items.map((m) => (
                  <MeasurementCard
                    key={m.id}
                    measurement={m}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            ))}

            <div className="mt-stack-lg flex flex-col items-center opacity-40">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-surface-container">
                <CalendarBlank size={48} className="text-secondary" />
              </div>
              <p className="text-center text-body-sm">
                Has llegado al final de tu historial reciente.
              </p>
            </div>
          </div>
        )}
      </main>

      <Fab onClick={openNew} />

      <RecordModal
        open={modalOpen}
        measurement={editing}
        onClose={closeModal}
        onSaved={handleSaved}
      />

      <ConfirmDeleteDialog
        measurement={pendingDelete}
        deleting={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />

      <Toast message={toastMessage} visible={toast} />
    </>
  );
}

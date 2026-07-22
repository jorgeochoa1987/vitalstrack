import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MeasurementForm } from "../components/MeasurementForm";
import { Toast } from "../components/Toast";
import { TopAppBar } from "../components/TopAppBar";
import { useMeasurements } from "../context/MeasurementsContext";

export function NewRecordPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getById } = useMeasurements();
  const existing = id ? getById(id) : undefined;
  const isEdit = Boolean(existing);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (id && !existing) {
      navigate("/registro", { replace: true });
    }
  }, [id, existing, navigate]);

  function handleSuccess() {
    setToast(true);
    window.setTimeout(() => {
      setToast(false);
      navigate(isEdit ? "/historial" : "/");
    }, 1200);
  }

  return (
    <>
      <TopAppBar
        title={isEdit ? "Editar registro" : "Nuevo registro"}
        showBrandIcon={false}
        backTo={isEdit ? "/historial" : "/"}
      />
      <main className="mx-auto max-w-2xl px-container-margin py-stack-md pb-32">
        <div className="mb-stack-lg">
          <h2 className="mb-base text-headline-lg-mobile font-bold">
            Introduce tus datos
          </h2>
          <p className="text-body-sm text-secondary">
            Asegúrate de estar en reposo al menos 5 minutos antes de realizar la
            medición para obtener resultados precisos.
          </p>
        </div>

        <MeasurementForm
          key={existing?.id ?? "new"}
          measurement={existing}
          onSuccess={handleSuccess}
        />
      </main>
      <Toast
        message={
          isEdit
            ? "Registro actualizado correctamente"
            : "Registro guardado correctamente"
        }
        visible={toast}
      />
    </>
  );
}

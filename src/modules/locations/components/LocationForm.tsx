import {
  ITButton,
  ITInput,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { getZones, Zone } from "../../zones/services/ZonesService";

interface Props {
  onSubmit: (data: any, keepOpen?: boolean) => void;
  onCancel: () => void;
  initialData?: any;
}

export const LocationForm = ({ onSubmit, onCancel, initialData }: Props) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [isSavingAndNew, setIsSavingAndNew] = useState(false);

  const formik = useFormik({
    initialValues: {
      zoneId: initialData?.zoneId || "",
      name: initialData?.name || "",
      reference: initialData?.reference || "",
    },
    validationSchema: Yup.object({
      zoneId: Yup.string().required("El recurrente es requerido"),
      name: Yup.string().required("El nombre de ubicación es requerido"),
      reference: Yup.string().optional(),
    }),
    onSubmit: (values, { resetForm }) => {
      const selectedZone = zones.find(
        (z) => String(z.id) === String(values.zoneId),
      );

      const zoneName = selectedZone?.name || "S/Z";

      const prefix = `${zoneName}-`;
      let finalName = values.name;

      if (!finalName.startsWith(prefix)) {
        finalName = `${prefix}${finalName}`;
      }

      onSubmit(
        {
          ...values,
          name: finalName,
          zoneId: values.zoneId,
          zoneName: zoneName,
        },
        isSavingAndNew,
      );

      if (isSavingAndNew) {
        resetForm({
          values: {
            ...values,
            name: "",
            reference: "",
          },
        });
      }
    },
  });

  useEffect(() => {
    if (initialData?.zoneId) {
      formik.setFieldValue("zoneId", initialData.zoneId);
    }
  }, [initialData?.zoneId]);

  useEffect(() => {
    setLoadingZones(true);
    getZones()
      .then((res) => {
        if (res.success) {
          setZones(res.data || []);
        }
      })
      .finally(() => setLoadingZones(false));
  }, []);

  return (
    <div className="flex flex-col bg-white overflow-hidden">
      <form onSubmit={formik.handleSubmit} className="flex flex-col h-full">
        <div className="p-10 space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Configuración de Ubicación
              </h4>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ITSelect
                  label="Recurrente (Zona)"
                  name="zoneId"
                  value={formik.values.zoneId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.zoneId as string}
                  touched={!!formik.touched.zoneId}
                  placeholder={
                    loadingZones ? "Cargando..." : "Seleccionar zona"
                  }
                  options={zones.map((z) => ({ label: z.name, value: z.id }))}
                  disabled={loadingZones}
                />

                <ITInput
                  label="Nombre de la Ubicación"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.name as string}
                  touched={!!formik.touched.name}
                  placeholder="Ej: Recepción, Oficina 101"
                />
              </div>

              <ITInput
                label="Referencia / Detalles"
                name="reference"
                value={formik.values.reference}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.reference as string}
                touched={!!formik.touched.reference}
                placeholder="Ej: Cerca de puerta principal"
              />
            </div>
          </section>
        </div>

        <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            type="button"
            variant="filled"
            onClick={onCancel}
            color="secondary"
          >
            Cancelar
          </ITButton>

          <ITButton
            type="submit"
            onClick={() => setIsSavingAndNew(true)}
            variant="filled"
            color="warning"
          >
            Guardar y Nueva
          </ITButton>
          <ITButton
            type="submit"
            onClick={() => setIsSavingAndNew(false)}
            color="primary"
          >
            Registrar Punto
          </ITButton>
        </div>
      </form>
    </div>
  );
};

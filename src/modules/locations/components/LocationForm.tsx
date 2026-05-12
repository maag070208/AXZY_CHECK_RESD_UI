import { useCatalog } from "@app/core/hooks/catalog.hook";
import {
  ITButton,
  ITInput,
  ITSearchSelect,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { getZonesByClient, Zone } from "../../zones/services/ZonesService";

interface Props {
  onSubmit: (data: any, keepOpen?: boolean) => void;
  onCancel: () => void;
  initialData?: any;
}

export const LocationForm = ({ onSubmit, onCancel, initialData }: Props) => {
  const { data: clients, loading: loadingClients } = useCatalog("client");
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [isSavingAndNew, setIsSavingAndNew] = useState(false);

  const formik = useFormik({
    initialValues: {
      clientId: initialData?.clientId || "",
      zoneId: initialData?.zoneId || "",
      name: initialData?.name || "",
      reference: initialData?.reference || "",
    },
    validationSchema: Yup.object({
      clientId: Yup.string().required("El cliente es requerido"),
      zoneId: Yup.string().required("El recurrente es requerido"),
      name: Yup.string().required("El nombre de ubicación es requerido"),
      reference: Yup.string().optional(),
    }),
    onSubmit: (values, { resetForm }) => {
      const selectedZone = zones.find(
        (z) => String(z.id) === String(values.zoneId),
      );
      const selectedClient = clients?.find(
        (c: any) => String(c.id) === String(values.clientId),
      );

      const clientName = selectedClient?.name || "S/C";
      const zoneName = selectedZone?.name || "S/Z";

      const prefix = `${clientName}-${zoneName}-`;
      let finalName = values.name;

      if (!finalName.startsWith(prefix)) {
        finalName = `${prefix}${finalName}`;
      }

      onSubmit(
        {
          ...values,
          name: finalName,
          clientId: values.clientId,
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
    if (formik.values.clientId) {
      setLoadingZones(true);
      getZonesByClient(String(formik.values.clientId))
        .then((data) => setZones(data))
        .finally(() => setLoadingZones(false));
    } else {
      setZones([]);
    }
  }, [formik.values.clientId]);

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-8 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ITSearchSelect
          label="Cliente Responsable"
          placeholder={
            loadingClients ? "Cargando clientes..." : "Buscar cliente..."
          }
          options={(clients || []).map((c: any) => ({
            label: c.name || c.label,
            value: c.id,
          }))}
          value={formik.values.clientId}
          onChange={(val) => formik.setFieldValue("clientId", val)}
          error={formik.errors.clientId as string}
          touched={!!formik.touched.clientId}
        />

        <ITSelect
          label="Recurrente (Zona)"
          name="zoneId"
          value={formik.values.zoneId}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.zoneId as string}
          touched={!!formik.touched.zoneId}
          placeholder={loadingZones ? "Cargando..." : "Selecciona zona"}
          options={zones.map((z) => ({ label: z.name, value: z.id }))}
          disabled={loadingZones || !formik.values.clientId}
        />
      </div>

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
      {/* 
      <ITInput
        label="Referencia o Instrucciones (Opcional)"
        name="reference"
        value={formik.values.reference}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.errors.reference}
        touched={formik.touched.reference}
        placeholder="Ej: A un lado del elevador principal"
      /> */}

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4 pt-6 border-t border-slate-50">
        <ITButton
          onClick={onCancel}
          type="button"
          variant="outlined"
          color="error"
        >
          Cancelar
        </ITButton>
        <ITButton
          type="submit"
          onClick={() => setIsSavingAndNew(true)}
          variant="outlined"
          color="warning"
        >
          Guardar y Nueva
        </ITButton>
        <ITButton
          type="submit"
          onClick={() => setIsSavingAndNew(false)}
          variant="outlined"
          color="primary"
        >
          Guardar Ubicación
        </ITButton>
      </div>
    </form>
  );
};

import { GoogleMapComponent } from "@app/core/components/GoogleMapComponent";
import {
  ITButton,
  ITInput,
  ITSlideToggle,
  ITText,
  ITBadget,
  ITLoader,
} from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { FaMapMarkerAlt, FaCrosshairs } from "react-icons/fa";
import * as Yup from "yup";

interface Props {
  propertyToEdit?: any;
  onSubmit: (data: any, keepOpen?: boolean) => void;
  onCancel: () => void;
}

export const PropertyForm: React.FC<Props> = ({
  propertyToEdit,
  onSubmit,
  onCancel,
}) => {
  const isEditing = !!propertyToEdit;
  const [isSavingAndNew, setIsSavingAndNew] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: propertyToEdit?.latitude ?? 19.4326,
    lng: propertyToEdit?.longitude ?? -99.1332,
  });
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!propertyToEdit?.latitude && !propertyToEdit?.longitude) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000, enableHighAccuracy: false },
      );
    }
  }, []);

  const handleMapLocationSelect = (lat: number, lng: number) => {
    formik.setFieldValue("latitude", lat);
    formik.setFieldValue("longitude", lng);
    setMapCenter({ lat, lng });
  };

  const handleLocateMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        handleMapLocationSelect(lat, lng);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const formik = useFormik({
    initialValues: {
      number: propertyToEdit?.number || "",
      street: propertyToEdit?.street || "",
      block: propertyToEdit?.block || "",
      reference: propertyToEdit?.reference || "",
      latitude: propertyToEdit?.latitude !== undefined && propertyToEdit?.latitude !== null ? propertyToEdit.latitude : "",
      longitude: propertyToEdit?.longitude !== undefined && propertyToEdit?.longitude !== null ? propertyToEdit.longitude : "",
      occupied: propertyToEdit ? propertyToEdit.occupied : false,
      active: propertyToEdit ? propertyToEdit.active : true,
    },
    validationSchema: Yup.object({
      number: Yup.string().required("El número de casa es requerido"),
      street: Yup.string().required("La calle o vialidad es requerida"),
      block: Yup.string().optional(),
      reference: Yup.string().optional(),
      latitude: Yup.number()
        .typeError("La latitud debe ser un número")
        .min(-90, "La latitud debe estar entre -90 y 90")
        .max(90, "La latitud debe estar entre -90 y 90")
        .optional()
        .nullable(),
      longitude: Yup.number()
        .typeError("La longitud debe ser un número")
        .min(-180, "La longitud debe estar entre -180 y 180")
        .max(180, "La longitud debe estar entre -180 y 180")
        .optional()
        .nullable(),
      occupied: Yup.boolean().optional(),
      active: Yup.boolean().optional(),
    }),
    onSubmit: (values, { resetForm }) => {
      const formattedValues = {
        ...values,
        latitude: values.latitude === "" ? null : Number(values.latitude),
        longitude: values.longitude === "" ? null : Number(values.longitude),
      };
      onSubmit(formattedValues, isSavingAndNew);
      if (isSavingAndNew && !isEditing) {
        resetForm({
          values: {
            number: "",
            street: "",
            block: "",
            reference: "",
            latitude: "",
            longitude: "",
            occupied: false,
            active: true,
          },
        });
      }
    },
  });

  return (
    <div className="flex flex-col bg-white overflow-hidden max-h-[75vh]">
      <form onSubmit={formik.handleSubmit} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {/* Section 1: Property Identification */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Identificación de Vivienda
              </ITText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ITInput
                label="Número / Código"
                name="number"
                value={formik.values.number}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.number ? String(formik.errors.number) : undefined}
                touched={!!formik.touched.number}
                placeholder="Ej. A-102"
              />

              <ITInput
                label="Manzana / Clúster"
                name="block"
                value={formik.values.block}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.block ? String(formik.errors.block) : undefined}
                touched={!!formik.touched.block}
                placeholder="Ej. Manzana 4"
              />
            </div>

            <div className="grid grid-cols-1 gap-8 mt-8">
              <ITInput
                label="Calle / Vialidad"
                name="street"
                value={formik.values.street}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.street ? String(formik.errors.street) : undefined}
                touched={!!formik.touched.street}
                placeholder="Ej. Av. de los Tulipanes"
              />
            </div>
          </section>

          {/* Section 2: References & Notes */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Referencias Adicionales
              </ITText>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <ITInput
                label="Referencias de Ubicación"
                name="reference"
                value={formik.values.reference}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.reference ? String(formik.errors.reference) : undefined}
                touched={!!formik.touched.reference}
                placeholder="Ej. Esquina con portón color café"
              />
            </div>

            <div className="space-y-4 mt-8">
              <div className="flex items-center justify-between">
                <ITText className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Ubicación en el Mapa
                </ITText>
                <ITButton
                  type="button"
                  size="small"
                  variant="outlined"
                  onClick={handleLocateMe}
                  disabled={locating}
                  className="!rounded-lg border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300"
                >
                  {locating ? (
                    <>
                      <ITLoader size="sm" className="mr-2" />
                      Localizando...
                    </>
                  ) : (
                    <>
                      <FaCrosshairs size={12} className="mr-2" />
                      Mi Ubicación
                    </>
                  )}
                </ITButton>
              </div>

              <GoogleMapComponent
                lat={mapCenter.lat}
                lng={mapCenter.lng}
                zoom={16}
                height="300px"
                isEditable
                onLocationSelect={handleMapLocationSelect}
                gestureHandling="greedy"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <FaMapMarkerAlt size={12} className="text-emerald-500 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <ITText className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      LATITUD
                    </ITText>
                    <ITText className="text-sm font-mono font-bold text-slate-700 truncate">
                      {formik.values.latitude || "—"}
                    </ITText>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                  <FaMapMarkerAlt size={12} className="text-indigo-500 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <ITText className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      LONGITUD
                    </ITText>
                    <ITText className="text-sm font-mono font-bold text-slate-700 truncate">
                      {formik.values.longitude || "—"}
                    </ITText>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Status toggles */}
          <section className="space-y-6">
            {isEditing && (
              <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <ITText className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Estado Habitada
                  </ITText>
                  <ITText className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    Indica si la vivienda se encuentra actualmente habitada (calculado por residentes)
                  </ITText>
                </div>
                <ITBadget color={formik.values.occupied ? "primary" : "secondary"} size="small">
                  {formik.values.occupied ? "HABITADA" : "NO HABITADA"}
                </ITBadget>
              </div>
            )}

            {isEditing && (
              <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <ITText className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Propiedad Activa
                  </ITText>
                  <ITText className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    Habilitar o suspender temporalmente el registro en el sistema
                  </ITText>
                </div>
                <ITSlideToggle
                  isOn={formik.values.active}
                  onToggle={(val) => formik.setFieldValue("active", val)}
                />
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            type="button"
            variant="filled"
            onClick={onCancel}
            color="secondary"
          >
            Cancelar
          </ITButton>

          {!isEditing && (
            <ITButton
              type="submit"
              onClick={() => setIsSavingAndNew(true)}
              variant="filled"
              color="warning"
              disabled={formik.isSubmitting}
            >
              Guardar y Nueva
            </ITButton>
          )}

          <ITButton
            type="submit"
            onClick={() => setIsSavingAndNew(false)}
            color="primary"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting
              ? "Procesando..."
              : isEditing
                ? "Actualizar Propiedad"
                : "Registrar Propiedad"}
          </ITButton>
        </div>
      </form>
    </div>
  );
};

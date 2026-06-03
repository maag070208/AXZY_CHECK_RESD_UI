import { AccessTicketOverlay } from "@app/core/components/AccessTicketOverlay";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  AccessResponse,
  createAccess,
} from "@app/modules/accesses/services/AccessesService";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useFormik } from "formik";
import QRCode from "qrcode";
import React, { useState } from "react";
import { FaTicketAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resident: any;
}

export const ResidentQuickAccessDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  resident,
}) => {
  const dispatch = useDispatch();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [createdAccess, setCreatedAccess] = useState<AccessResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      visitorName: "",
      visitorPhone: "",
      type: "TEMPORARY",
      validityUnit: "hours",
      validityAmount: 2,
    },
    validationSchema: Yup.object({
      visitorName: Yup.string().required("El nombre o motivo es requerido"),
      visitorPhone: Yup.string().optional(),
      type: Yup.string()
        .oneOf(["TEMPORARY", "RECURRING", "DELIVERY", "SERVICE"])
        .required("El tipo es requerido"),
      validityUnit: Yup.string().oneOf(["hours", "days"]).required("Requerido"),
      validityAmount: Yup.number().min(1, "Mínimo 1").required("Requerido"),
    }),
    onSubmit: async (values) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        const now = dayjs();
        const validUntil =
          values.validityUnit === "hours"
            ? now.add(values.validityAmount, "hour")
            : now.add(values.validityAmount, "day");

        const res = await createAccess({
          residentId: resident.id,
          type: values.type,
          validFrom: now.toISOString(),
          validUntil: validUntil.toISOString(),
          visitor: {
            name: values.visitorName.toUpperCase(),
            phone: values.visitorPhone || undefined,
          },
        });

        if (res.success && res.data) {
          const access = res.data;
          const payload = access.qrCode || "";

          const url = await QRCode.toDataURL(payload, {
            width: 512,
            margin: 2,
            color: {
              dark: "#0b0c10",
              light: "#ffffff",
            },
          });

          setQrCodeUrl(url);
          setCreatedAccess(access);
        } else {
          dispatch(
            showToast({
              message: "Error al generar el pase de acceso",
              type: "error",
            }),
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setCreatedAccess(null);
    setQrCodeUrl("");
    onClose();
  };

  const getDialogTitle = () => {
    return `Generar Pase - Casa ${resident?.house?.street} ${resident?.house?.number}`;
  };

  const accessTypes = [
    { label: "TEMPORAL / VISITA", value: "TEMPORARY" },
    { label: "RECURRENTE", value: "RECURRING" },
    { label: "DELIVERY / SERVICIO", value: "DELIVERY" },
    { label: "SERVICIOS PÚBLICOS", value: "SERVICE" },
  ];

  return (
    <>
      <ITDialog
        isOpen={isOpen && !createdAccess}
        onClose={handleClose}
        title={getDialogTitle()}
        className="!max-w-2xl !w-full"
      >
        <div className="flex flex-col bg-white overflow-hidden max-h-[80vh]">
          {/* Input Form */}
          <form
            onSubmit={formik.handleSubmit}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {/* Header Box */}
              <div className="flex items-center gap-3 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
                <FaTicketAlt className="text-slate-400" size={20} />
                <div>
                  <ITText className="text-xs font-black text-slate-700 uppercase tracking-tight block">
                    Pase de Acceso Rápido
                  </ITText>
                  <ITText className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">
                    Genera un pase instantáneo (contacto, delivery, paquete,
                    etc.)
                  </ITText>
                </div>
              </div>

              {/* Section 1: Datos de la visita */}
              <section>
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                    Datos de la Visita
                  </ITText>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <ITInput
                      label="Nombre o Motivo de Entrada"
                      name="visitorName"
                      value={formik.values.visitorName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.errors.visitorName && formik.touched.visitorName
                          ? formik.errors.visitorName
                          : undefined
                      }
                      required
                      placeholder="Ej. UBER EATS, REPARTIDOR AMAZON, SOFIA GARCIA"
                    />
                  </div>
                  <ITInput
                    label="Teléfono del Visitante (Opcional)"
                    name="visitorPhone"
                    value={formik.values.visitorPhone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.errors.visitorPhone && formik.touched.visitorPhone
                        ? formik.errors.visitorPhone
                        : undefined
                    }
                    placeholder="Ej. +52 5599887766"
                  />
                  <ITSelect
                    label="Tipo de Acceso"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    options={accessTypes}
                    error={
                      formik.errors.type && formik.touched.type
                        ? formik.errors.type
                        : undefined
                    }
                    required
                  />
                </div>
              </section>

              {/* Section 2: Vigencia del Pase */}
              <section>
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                  <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                    Vigencia del Pase
                  </ITText>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ITInput
                    label="Duración"
                    name="validityAmount"
                    type="number"
                    value={formik.values.validityAmount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.errors.validityAmount &&
                      formik.touched.validityAmount
                        ? formik.errors.validityAmount
                        : undefined
                    }
                    required
                    placeholder="Ej. 2"
                  />
                  <ITSelect
                    label="Unidad de Tiempo"
                    name="validityUnit"
                    value={formik.values.validityUnit}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    options={[
                      { label: "HORAS", value: "hours" },
                      { label: "DÍAS", value: "days" },
                    ]}
                    error={
                      formik.errors.validityUnit && formik.touched.validityUnit
                        ? formik.errors.validityUnit
                        : undefined
                    }
                    required
                  />
                </div>
              </section>
            </div>

            {/* Footer for Form */}
            <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-3">
              <ITButton
                variant="outlined"
                color="secondary"
                onClick={handleClose}
              >
                Cancelar
              </ITButton>
              <ITButton type="submit" color="primary" disabled={isSubmitting}>
                {isSubmitting ? "Generando..." : "Generar QR"}
              </ITButton>
            </div>
          </form>
        </div>
      </ITDialog>

      {/* Ticket Overlay Component */}
      <AccessTicketOverlay
        isOpen={!!createdAccess}
        onClose={handleClose}
        access={createdAccess}
        qrCodeUrl={qrCodeUrl}
      />
    </>
  );
};

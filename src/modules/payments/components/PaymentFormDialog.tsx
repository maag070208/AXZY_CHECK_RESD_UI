import { showToast } from "@app/core/store/toast/toast.slice";
import {
  getPaginatedResidents,
  ResidentResponse,
} from "@app/modules/residents/services/ResidentsService";
import {
  ITButton,
  ITDatePicker,
  ITDialog,
  ITInput,
  ITLoader,
  ITText,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import {
  createPayment,
  CreatePaymentDTO,
  FeeResponse,
  getFees,
} from "../services/PaymentsService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentFormDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useDispatch();
  const [fees, setFees] = useState<FeeResponse[]>([]);
  const [residents, setResidents] = useState<ResidentResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      formik.resetForm();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [feesRes, resRes] = await Promise.all([
        getFees(),
        getPaginatedResidents({ page: 1, limit: 1000 }),
      ]);
      if (feesRes.success && feesRes.data) setFees(feesRes.data);
      if (resRes.data) setResidents(resRes.data);
    } finally {
      setLoadingData(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      residentId: "",
      feeId: "",
      concept: "",
      amount: "",
      status: "PAID" as "PENDING" | "PAID",
      paidAt: dayjs().toDate(),
    },
    validationSchema: Yup.object({
      residentId: Yup.string().required("Selecciona un residente"),
      concept: Yup.string().when("feeId", {
        is: (feeId: string) => !feeId,
        then: (s) => s.required("Describe el concepto del cargo"),
      }),
      amount: Yup.number()
        .min(1, "Debe ser mayor a 0")
        .required("El monto es requerido"),
      status: Yup.string().required(),
      paidAt: Yup.date().when(["status", "feeId"], {
        is: (status: string, feeId: string) => status === "PAID" || !feeId,
        then: (s) => s.required("Selecciona la fecha de pago").nullable(),
      }),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const payload: CreatePaymentDTO = {
          residentId: values.residentId,
          amount: Number(values.amount),
          status: values.status,
          paidAt:
            values.status === "PAID" || isManual
              ? dayjs(values.paidAt).toISOString()
              : undefined,
        };
        if (values.feeId) {
          payload.feeId = values.feeId;
        } else {
          payload.concept = values.concept;
        }
        const res = await createPayment(payload);
        if (res.success) {
          dispatch(
            showToast({
              message: "Pago registrado exitosamente",
              type: "success",
            }),
          );
          onSuccess();
          onClose();
        } else {
          dispatch(
            showToast({ message: "Error al registrar pago", type: "error" }),
          );
        }
      } catch (error) {
        dispatch(showToast({ message: "Error en el servidor", type: "error" }));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const isManual = !formik.values.feeId;

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={isManual ? "Cargo Único" : "Registrar Pago"}
      className="!w-full !max-w-2xl"
    >
      <div className="flex flex-col bg-white overflow-hidden max-h-[75vh]">
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col h-full overflow-hidden relative"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <section>
              <div className="pb-3 border-b border-slate-100 mb-6">
                <ITText className="text-sm font-semibold text-slate-900">
                  {isManual
                    ? "Cargo Único Directo"
                    : "Asignación Manual de Cobro"}
                </ITText>
              </div>

              {loadingData ? (
                <div className="flex justify-center py-12 w-full">
                  <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <ITSearchSelect
                      label="Residente"
                      placeholder={
                        loadingData ? "Cargando..." : "Seleccionar residente..."
                      }
                      options={residents.map((r) => ({
                        label: `${r.user?.name} ${r.user?.lastName} - ${r.house ? `${r.house.street} #${r.house.number}` : "Sin Propiedad"}`,
                        value: r.id,
                      }))}
                      value={formik.values.residentId}
                      onChange={(val) =>
                        formik.setFieldValue("residentId", val)
                      }
                      error={
                        formik.errors.residentId
                          ? String(formik.errors.residentId)
                          : undefined
                      }
                      touched={!!formik.touched.residentId}
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <ITSearchSelect
                      label="Tipo de Pago / Cuota"
                      placeholder="Seleccionar cuota (opcional)"
                      options={fees.map((f) => ({
                        label: `${f.name} ($${f.amount} MXN)`,
                        value: f.id,
                      }))}
                      value={formik.values.feeId}
                      onChange={(val) => {
                        formik.setFieldValue("feeId", val);
                        if (val) {
                          const selectedFee = fees.find((f) => f.id === val);
                          if (selectedFee) {
                            formik.setFieldValue("amount", selectedFee.amount);
                          }
                        }
                      }}
                      touched={!!formik.touched.feeId}
                    />
                  </div>

                  {isManual && (
                    <div className="md:col-span-2">
                      <ITInput
                        label="Concepto del Cargo"
                        name="concept"
                        type="text"
                        value={formik.values.concept}
                        onChange={formik.handleChange}
                        error={formik.errors.concept as string}
                        placeholder="Ej. Multa por ruido, Reparación de ventana"
                      />
                    </div>
                  )}

                  <ITInput
                    label="Monto (MXN)"
                    name="amount"
                    type="number"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    error={formik.errors.amount as string}
                    placeholder="Ej. 500"
                  />

                  <div className="flex flex-col gap-2">
                    <ITText className="text-[13px] font-bold text-slate-500">
                      Estado del Pago
                    </ITText>
                    <select
                      name="status"
                      value={formik.values.status}
                      onChange={formik.handleChange}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-slate-900 transition-colors"
                    >
                      <option value="PAID">Pagado (Al corriente)</option>
                      <option value="PENDING">Pendiente (Por pagar)</option>
                    </select>
                  </div>

                  {(formik.values.status === "PAID" || isManual) && (
                    <div className="md:col-span-2">
                      <ITDatePicker
                        label="Fecha de Pago"
                        name="paidAt"
                        value={formik.values.paidAt}
                        onChange={(e) =>
                          formik.setFieldValue("paidAt", e.target.value)
                        }
                        error={formik.errors.paidAt as string}
                        touched={!!formik.touched.paidAt}
                      />
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <div className="flex-none flex justify-end items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-3">
            <ITButton
              type="button"
              variant="outlined"
              onClick={onClose}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 !rounded-lg font-medium"
            >
              Cancelar
            </ITButton>
            <ITButton
              type="submit"
              className="bg-slate-900 text-white hover:bg-slate-800 !rounded-lg font-medium"
            >
              {isManual ? "Registrar Cargo" : "Registrar Pago"}
            </ITButton>
          </div>
          {submitting && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-3">
                <ITLoader size="lg" />
                <ITText className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                  Procesando
                </ITText>
              </div>
            </div>
          )}
        </form>
      </div>
    </ITDialog>
  );
};

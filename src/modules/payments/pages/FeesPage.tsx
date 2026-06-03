import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDialog,
  ITInput,
  ITText,
  ITDataTable,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaCog, FaMoneyBill, FaPlus, FaStripe, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import {
  createFee,
  deleteFee,
  FeeResponse,
  getPaginatedFees,
  getSubscriptionPlans,
  SubscriptionPlanResponse,
} from "../services/PaymentsService";
import BulkAssignFeeDialog from "../components/BulkAssignFeeDialog";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const FeesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [feeToDeleteId, setFeeToDeleteId] = useState<string | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const plansRes = await getSubscriptionPlans();
      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      }
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Debounce search filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    return { search: searchTerm };
  }, [searchTerm]);

  const memoizedFetchFees = useCallback(
    async (params: any) => {
      const res = await getPaginatedFees({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
      return {
        data: res.data as (FeeResponse & Record<string, unknown>)[],
        total: res.total,
      };
    },
    [externalFilters],
  );

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      amount: 0,
      type: "ONE_TIME" as "ONE_TIME" | "MONTHLY",
      dueDate: dayjs().add(1, "month").format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      amount: Yup.number()
        .min(1, "Debe ser mayor a 0")
        .required("El monto es requerido"),
      type: Yup.string().required("El tipo es requerido"),
      dueDate: Yup.string().required("Fecha de vencimiento es requerida"),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const res = await createFee({
          ...values,
          amount: Number(values.amount),
          type: values.type,
        });
        if (res.success) {
          dispatch(
            showToast({
              message: "Cuota creada exitosamente",
              type: "success",
            }),
          );
          resetForm();
          setIsAdding(false);
          setRefreshKey((prev) => prev + 1);
        } else {
          dispatch(
            showToast({ message: "Error al crear cuota", type: "error" }),
          );
        }
      } catch (error) {
        dispatch(showToast({ message: "Error en el servidor", type: "error" }));
      }
    },
  });

  const handleDelete = (id: string) => {
    setFeeToDeleteId(id);
  };

  const confirmDeleteFee = async () => {
    if (!feeToDeleteId) return;
    const res = await deleteFee(feeToDeleteId);
    if (res.success) {
      dispatch(showToast({ message: "Cuota eliminada", type: "success" }));
      setRefreshKey((prev) => prev + 1);
    }
    setFeeToDeleteId(null);
  };

  const columns = [
    {
      key: "name",
      label: "Concepto / Nombre",
      type: "string" as const,
      render: (row: FeeResponse) => (
        <div className="flex flex-col">
          <ITText className="font-semibold text-slate-950 text-sm">
            {row.name}
          </ITText>
          <ITText className="text-xs text-slate-500 line-clamp-1">
            {row.description || "Cuota General"}
          </ITText>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Monto",
      type: "number" as const,
      render: (row: FeeResponse) => (
        <ITBadget color="primary" size="small" className="!font-medium">
          {formatCurrency(row.amount)}
        </ITBadget>
      ),
    },
    {
      key: "type",
      label: "Tipo",
      type: "string" as const,
      render: (row: FeeResponse) => (
        <ITBadget
          color={row.type === "MONTHLY" ? "success" : "secondary"}
          size="small"
        >
          {row.type === "MONTHLY" ? "MENSUAL" : "ÚNICO"}
        </ITBadget>
      ),
    },
    {
      key: "dueDate",
      label: "Vencimiento",
      type: "date" as const,
      render: (row: FeeResponse) => (
        <ITText className="text-xs text-slate-600">
          {dayjs(row.dueDate).format("DD/MM/YYYY")}
        </ITText>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions" as const,
      render: (row: FeeResponse) => (
        <ITButton
          size="small"
          variant="outlined"
          color="danger"
          onClick={() => handleDelete(row.id)}
          title="Eliminar"
        >
          <FaTrash size={12} />
        </ITButton>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-screen font-sans text-slate-800">
      <ModuleHeader
        title="Catálogo de Cuotas y Planes"
        subtitle="Configuración de cobros manuales y suscripciones"
        icon={FaCog}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR CUOTA...",
        }}
      />

      <div className="flex justify-end mb-4">
        <ITButton
          variant="outlined"
          className="border-slate-200 text-slate-600"
          size="small"
          onClick={() => setBulkAssignOpen(true)}
        >
          <FaPlus size={10} /> Asignación Masiva
        </ITButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* LADO IZQUIERDO: Tipos de Cuotas Manuales */}
        <div>
          {!isAdding ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                    <FaMoneyBill size={18} />
                  </div>
                  <div>
                    <ITText className="font-semibold text-slate-900 text-sm">
                      Cuotas Manuales
                    </ITText>
                    <ITText className="text-xs text-slate-500">
                      Configuración de cobros directos
                    </ITText>
                  </div>
                </div>
                <ITButton
                  onClick={() => setIsAdding(true)}
                  size="small"
                  variant="filled"
                  color="primary"
                >
                  <FaPlus size={10} /> Nueva Cuota
                </ITButton>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ITDataTable<FeeResponse & Record<string, unknown>>
                  key={refreshKey}
                  fetchData={memoizedFetchFees}
                  externalFilters={externalFilters}
                  defaultItemsPerPage={5}
                  title=""
                  columns={columns}
                />
              </div>
            </div>
          ) : (
            <form
              onSubmit={formik.handleSubmit}
              className="bg-white p-6 rounded-2xl border border-slate-100 space-y-5"
            >
              <div className="pb-3 border-b border-slate-100 mb-6">
                <ITText className="font-semibold text-slate-900 text-base">
                  Alta de Tipo de Pago
                </ITText>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <ITInput
                  label="Nombre (Ej. Mensualidad, Multa)"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.errors.name as string}
                  placeholder="Ej. Mantenimiento Mes 6"
                />
                <ITInput
                  label="Monto (MXN)"
                  name="amount"
                  type="number"
                  value={formik.values.amount}
                  onChange={formik.handleChange}
                  error={formik.errors.amount as string}
                  placeholder="0.00"
                />
                <ITInput
                  label="Descripción (Opcional)"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  placeholder="Ej. Cuota mensual ordinaria"
                />
                <div className="flex flex-col gap-1.5">
                  <ITText className="text-xs font-medium text-slate-700">
                    Tipo de Cuota
                  </ITText>
                  <select
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-slate-900 transition-colors"
                  >
                    <option value="ONE_TIME">Cargo Único (1 a 1)</option>
                    <option value="MONTHLY">Cargo Mensual (Recurrente)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <ITText className="text-xs font-medium text-slate-700">
                    Fecha de Vencimiento Base
                  </ITText>
                  <input
                    name="dueDate"
                    type="date"
                    value={formik.values.dueDate}
                    onChange={formik.handleChange}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-slate-900 transition-colors"
                  />
                  {formik.errors.dueDate && formik.touched.dueDate && (
                    <ITText className="text-rose-500 text-[10px] font-bold mt-1">
                      {formik.errors.dueDate as string}
                    </ITText>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-100">
                <ITButton
                  type="button"
                  variant="outlined"
                  onClick={() => setIsAdding(false)}
                  className="border-slate-200 text-slate-600 hover:bg-slate-50 !rounded-lg font-medium"
                >
                  Cancelar
                </ITButton>
                <ITButton
                  type="submit"
                  className="bg-slate-900 text-white hover:bg-slate-800 !rounded-lg font-medium"
                >
                  Guardar Cuota
                </ITButton>
              </div>
            </form>
          )}
        </div>

        {/* LADO DERECHO: Suscripciones de Stripe */}
        <div>
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                <FaStripe size={18} />
              </div>
              <div>
                <ITText className="font-semibold text-slate-900 text-sm">
                  Planes de Suscripción
                </ITText>
                <ITText className="text-xs text-slate-500">
                  {plans.length} Activos · Sincronizado con Stripe
                </ITText>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <ITText className="font-semibold text-slate-900 text-base">
                    {plan.name}
                  </ITText>
                  <ITBadget
                    color="primary"
                    className="!font-semibold uppercase tracking-wider text-[10px] !rounded-lg"
                  >
                    {plan.interval === "month" ? "MENSUAL" : plan.interval === "year" ? "ANUAL" : plan.interval}
                  </ITBadget>
                </div>
                <ITText className="text-xs text-slate-500 mb-4">
                  {plan.description || "Plan de suscripción automatizada"}
                </ITText>

                <div className="flex items-baseline gap-1">
                  <ITText className="font-bold text-2xl text-slate-900">
                    {formatCurrency(plan.amount)}
                  </ITText>
                  <ITText className="text-xs text-slate-400 font-medium">
                    /{plan.interval === "month" ? "mes" : plan.interval === "year" ? "año" : plan.interval}
                  </ITText>
                </div>
              </div>
            ))}
            {plans.length === 0 && !loadingPlans && (
              <div className="py-16 text-center flex flex-col items-center border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <ITText className="text-slate-400 font-medium text-sm">
                  Sin planes en Stripe
                </ITText>
              </div>
            )}
            {loadingPlans && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ITDialog
        isOpen={!!feeToDeleteId}
        onClose={() => setFeeToDeleteId(null)}
        title="Eliminar Cuota"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Tipo de Pago?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción eliminará permanentemente esta cuota del sistema.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setFeeToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDeleteFee}
            >
              ELIMINAR AHORA
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <BulkAssignFeeDialog
        isOpen={bulkAssignOpen}
        onClose={() => setBulkAssignOpen(false)}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
};

export default FeesPage;

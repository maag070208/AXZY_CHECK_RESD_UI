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
import { FaCog, FaMoneyBill, FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import {
  createFee,
  deleteFee,
  FeeResponse,
  getPaginatedFees,
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
  const [isAdding, setIsAdding] = useState(false);
  const [feeToDeleteId, setFeeToDeleteId] = useState<string | null>(null);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

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
      dueDate: Yup.string().when("type", {
        is: "ONE_TIME",
        then: (s) => s.required("Fecha de vencimiento requerida"),
        otherwise: (s) => s.notRequired(),
      }),
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
      render: (row: FeeResponse) =>
        row.type === "MONTHLY" ? (
          <ITText className="text-xs text-slate-400 italic">—</ITText>
        ) : (
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
        title="Catálogo de Cuotas"
        subtitle="Configuración de cobros manuales"
        icon={FaCog}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR CUOTA...",
        }}
      />

      <div className="flex items-center justify-between mb-6 -mt-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
            <FaMoneyBill size={14} className="text-slate-400" />
            <ITText className="text-xs font-medium text-slate-500">
              Tipos de Cuota
            </ITText>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ITButton
            variant="outlined"
            size="small"
            className="!flex !flex-row !items-center !gap-1.5 border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 !rounded-lg px-3"
            onClick={() => setBulkAssignOpen(true)}
          >
            <FaPlus size={9} /> Asignación Masiva
          </ITButton>
          <ITButton
            onClick={() => setIsAdding(true)}
            size="small"
            variant="filled"
            color="primary"
            className="!flex !flex-row !items-center !gap-1.5 !rounded-lg px-3 shadow-sm"
          >
            <FaPlus size={9} /> Nueva Cuota
          </ITButton>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<FeeResponse & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetchFees}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
          columns={columns}
        />
      </div>

      <ITDialog
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
          formik.resetForm();
        }}
        title="Alta de Tipo de Pago"
      >
        <form onSubmit={formik.handleSubmit} className="space-y-5 p-4">
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
            currencyFormat
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
          {formik.values.type === "ONE_TIME" && (
            <div className="flex flex-col gap-1.5">
              <ITText className="text-xs font-medium text-slate-700">
                Fecha de Vencimiento
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
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <ITButton
              type="button"
              variant="outlined"
              onClick={() => {
                setIsAdding(false);
                formik.resetForm();
              }}
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
      </ITDialog>

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

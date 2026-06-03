import { ModuleHeader } from "@app/core/components/ModuleHeader";

import { showToast } from "@app/core/store/toast/toast.slice";
import { AppState } from "@app/core/store/store";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITText,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState, useEffect } from "react";
import {
  FaMoneyBill,
  FaTrash,
  FaPlus,
  FaStripe,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  deletePayment,
  getPaginatedPayments,
  PaymentResponse,
  createPaymentCheckout,
  getPaymentSummary,
  PaymentSummaryResponse,
} from "../services/PaymentsService";
import { PaymentFormDialog } from "../components/PaymentFormDialog";

const PaymentsPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isResident = auth.role === "RESDN";
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(
    null,
  );
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [summary, setSummary] = useState<PaymentSummaryResponse | null>(null);

  useEffect(() => {
    loadSummary();
  }, [refreshKey]);

  const loadSummary = async () => {
    const res = await getPaymentSummary();
    if (res.success && res.data) {
      setSummary(res.data);
    }
  };

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};
    if (activeFilter === "PENDING") f.status = "PENDING";
    if (activeFilter === "PAID") f.status = "PAID";
    return f;
  }, [activeFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedPayments({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
    },
    [externalFilters],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const confirmDelete = async () => {
    if (!paymentToDeleteId) return;
    const res = await deletePayment(paymentToDeleteId);
    if (res.success) {
      dispatch(showToast({ message: "Pago cancelado", type: "success" }));
      refreshTable();
    }
    setPaymentToDeleteId(null);
  };

  const columns = useMemo(
    () => [
      {
        key: "resident",
        label: "RESIDENTE",
        render: (row: PaymentResponse) => (
          <div className="flex flex-col">
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.resident?.user?.name} {row.resident?.user?.lastName}
            </ITText>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {row.resident?.phone || "SIN TELÉFONO"}
              </ITText>
            </div>
          </div>
        ),
      },
      {
        key: "fee",
        label: "CUOTA",
        render: (row: PaymentResponse) => (
          <div className="flex flex-col">
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.fee?.name}
            </ITText>
            <ITText className="text-slate-400 text-[10px] font-bold">
              {new Intl.NumberFormat("es-MX", {
                style: "currency",
                currency: "MXN",
              }).format(row.amount)}
            </ITText>
          </div>
        ),
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: PaymentResponse) => {
          let color: any = "primary";
          if (row.status === "PAID") color = "success";
          if (row.status === "PENDING") color = "warning";
          if (row.status === "CANCELLED" || row.status === "FAILED")
            color = "danger";

          return (
            <ITBadget
              color={color}
              size="small"
              className="!text-[9px] tracking-widest font-black uppercase"
            >
              {row.status === "PAID"
                ? "PAGADO"
                : row.status === "PENDING"
                  ? "PENDIENTE"
                  : "CANCELADO"}
            </ITBadget>
          );
        },
      },
      {
        key: "date",
        label: "FECHA PAGO",
        render: (row: PaymentResponse) => (
          <ITText className="text-slate-700 text-[11px] font-black uppercase">
            {row.paidAt ? dayjs(row.paidAt).format("DD MMM YYYY") : "-"}
          </ITText>
        ),
      },
      {
        key: "actions",
        label: "ACCIONES",
        render: (row: PaymentResponse) => (
          <div className="flex items-center gap-2">
            {row.status === "PENDING" && (
              <ITButton
                onClick={async () => {
                  setLoadingCheckout(true);
                  const res = await createPaymentCheckout(row.id);
                  setLoadingCheckout(false);
                  if (res.success && res.data?.url) {
                    window.location.href = res.data.url;
                  } else {
                    dispatch(
                      showToast({
                        message: "Error al iniciar Stripe",
                        type: "error",
                      }),
                    );
                  }
                }}
                disabled={loadingCheckout}
                variant="outlined"
                size="small"
                title="Pagar con Stripe"
                className="!rounded-lg border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 !px-2.5 !py-1.5 !flex !items-center !gap-1.5"
              >
                <FaStripe size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Pagar</span>
              </ITButton>
            )}
            {!isResident && (
              <ITButton
                onClick={() => setPaymentToDeleteId(row.id)}
                variant="outlined"
                color="danger"
                size="small"
                title="Cancelar Pago"
              >
                <FaTrash size={12} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [isResident, loadingCheckout],
  );

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Control de Pagos"
        subtitle="Gestión de cuotas y mensualidades"
        icon={FaMoneyBill}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR PAGO...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        extraFilter={
          <div className="flex gap-2">
            <div className="w-full md:w-80">
              <ITTripleFilter
                value={activeFilter}
                onChange={setActiveFilter}
                options={[
                  { label: "TODOS", value: "all" },
                  { label: "PENDIENTES", value: "PENDING" },
                  { label: "PAGADOS", value: "PAID" },
                ]}
              />
            </div>
            {!isResident && (
              <ITButton
                variant="filled"
                color="primary"
                onClick={() => setIsPaymentFormOpen(true)}
                className="!flex !flex-row !items-center !gap-2"
              >
                <FaPlus size={12} /> Nuevo Pago
              </ITButton>
            )}
          </div>
        }
      />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 mt-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group">
            <div className="flex flex-col">
              <ITText className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                {isResident ? "Total Pagado" : "Total Recaudado"}
              </ITText>
              <ITText className="font-black text-3xl tracking-tighter text-slate-800">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(summary.paid.total)}
              </ITText>
              <ITText className="font-bold text-[10px] uppercase tracking-widest text-emerald-500 mt-2">
                {summary.paid.count} Pagos al corriente
              </ITText>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
              <FaArrowUp size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group">
            <div className="flex flex-col">
              <ITText className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">
                Total Pendiente
              </ITText>
              <ITText className="font-black text-3xl tracking-tighter text-slate-800">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(summary.pending.total)}
              </ITText>
              <ITText className="font-bold text-[10px] uppercase tracking-widest text-rose-500 mt-2">
                {summary.pending.count} Pagos atrasados
              </ITText>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300">
              <FaArrowDown size={24} />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<PaymentResponse & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      <ITDialog
        isOpen={!!paymentToDeleteId}
        onClose={() => setPaymentToDeleteId(null)}
        title="Cancelar Pago"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Cancelar este pago?
          </ITText>
          <div className="flex gap-4 justify-center mt-8">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setPaymentToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDelete}
            >
              CANCELAR PAGO
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <PaymentFormDialog
        isOpen={isPaymentFormOpen}
        onClose={() => {
          setIsPaymentFormOpen(false);
          refreshTable();
        }}
        onSuccess={refreshTable}
      />
    </div>
  );
};

export default PaymentsPage;

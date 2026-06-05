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

  FaDownload,
  FaCalendarAlt,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  deletePayment,
  downloadReceipt,
  getPaginatedPayments,
  PaymentResponse,
  createPaymentCheckout,
  getPaymentSummary,
  PaymentSummaryResponse,
} from "../services/PaymentsService";
import { PaymentFormDialog } from "../components/PaymentFormDialog";
import PaymentSummaryCards from "../components/PaymentSummaryCards";

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
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf("month").toDate(),
    dayjs().endOf("month").toDate(),
  ]);
  const [allPayments, setAllPayments] = useState<PaymentResponse[]>([]);
  const [allPaymentsLoading, setAllPaymentsLoading] = useState(false);

  const fetchAllPayments = useCallback(async () => {
    if (!isResident) return;
    setAllPaymentsLoading(true);
    try {
      const res = await getPaginatedPayments({ page: 1, limit: 200, filters: {} });
      setAllPayments(res.data || []);
    } finally {
      setAllPaymentsLoading(false);
    }
  }, [isResident]);

  useEffect(() => {
    loadSummary();
    fetchAllPayments();
    const qs = window.location.hash.includes("?")
      ? window.location.hash.split("?")[1]
      : window.location.search.replace("?", "");
    const params = new URLSearchParams(qs);
    const paymentResult = params.get("payment");
    const checkoutResult = params.get("checkout");
    if (paymentResult === "success" || checkoutResult === "success") {
      dispatch(showToast({ message: "Pago realizado con éxito", type: "success" }));
      window.history.replaceState({}, "", window.location.pathname + window.location.hash.split("?")[0]);
    } else if (paymentResult === "cancel" || checkoutResult === "cancelled") {
      dispatch(showToast({ message: "Pago cancelado", type: "info" }));
      window.history.replaceState({}, "", window.location.pathname + window.location.hash.split("?")[0]);
    }
  }, [refreshKey, dispatch, fetchAllPayments]);

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
    if (dateRange[0]) f.dateFrom = dateRange[0].toISOString();
    if (dateRange[1]) f.dateTo = dateRange[1].toISOString();
    if (searchTerm) f.search = searchTerm;
    return f;
  }, [activeFilter, dateRange, searchTerm]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedPayments({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
    },
    [externalFilters],
  );

  const refreshTable = () => {
    setRefreshKey((prev) => prev + 1);
    if (isResident) fetchAllPayments();
  };

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
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-0.5">
              {row.fee?.name}
              {row.period && (
                <span className="font-normal text-slate-400 ml-1.5 lowercase">
                  {dayjs(row.period, "YYYY-MM").format("MMMM YYYY")}
                </span>
              )}
            </ITText>
            <div className="flex items-center gap-1.5">
              <ITText className="text-slate-500 text-[10px] font-bold">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(row.amount)}
              </ITText>
              {row.fee?.type === "MONTHLY" && row.fee?.dueDate && (
                <>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <ITText className="text-slate-400 text-[10px] font-medium">
                    Vence {dayjs(row.fee.dueDate).format("DD/MM/YYYY")}
                  </ITText>
                </>
              )}
            </div>
            {row.status === "PAID" && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                <ITText className="text-emerald-600 text-[9px] font-bold font-mono tracking-widest uppercase">
                  Folio {row.id.slice(0, 8).toUpperCase()}
                </ITText>
              </div>
            )}
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
            {row.status === "PAID" && (
              <ITButton
                size="small"
                variant="outlined"
                onClick={async () => {
                  try {
                    await downloadReceipt(row.id);
                  } catch {
                    dispatch(showToast({ message: "Comprobante no disponible", type: "info" }));
                  }
                }}
                className="border-slate-200 text-slate-500"
                title="Descargar comprobante"
              >
                <FaDownload size={11} />
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
        dateRange={{
          value: dateRange,
          onChange: (val) => setDateRange(val),
          placeholder: "Filtrar por mes",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        extraFilter={
          <div className="flex items-center gap-2">
            <ITTripleFilter
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { label: "TODOS", value: "all" },
                { label: "PENDIENTES", value: "PENDING" },
                { label: "PAGADOS", value: "PAID" },
              ]}
            />
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
        <PaymentSummaryCards
          paid={summary.paid}
          pending={summary.pending}
          isResident={isResident}
        />
      )}

      {isResident ? (
        <div className="space-y-10 mt-6">
          {/* ══════════════════════════════════════════
             CARGOS ÚNICOS
          ══════════════════════════════════════════ */}
          <div>
            <div className="mb-4">
              <ITText className="text-sm font-semibold text-slate-900">
                Cargos Únicos
              </ITText>
              <ITText className="text-xs text-slate-400 mt-0.5">
                Cobros de una sola vez
              </ITText>
            </div>
            {allPaymentsLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : allPayments.filter((p) => p.fee?.type === "ONE_TIME").length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ITText className="text-slate-500 font-medium text-sm">
                  Sin cargos únicos
                </ITText>
              </div>
            ) : (
              <div className="space-y-3">
                {allPayments
                  .filter((p) => p.fee?.type === "ONE_TIME")
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            p.status === "PAID"
                              ? "bg-emerald-50 text-emerald-600"
                              : p.status === "PENDING"
                                ? "bg-amber-50 text-amber-600"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          <FaMoneyBill size={15} />
                        </div>
                        <div>
                          <ITText className="font-semibold text-slate-900 text-sm">
                            {p.fee?.name}
                          </ITText>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ITText className="text-sm font-bold text-slate-700">
                              {new Intl.NumberFormat("es-MX", {
                                style: "currency",
                                currency: "MXN",
                              }).format(p.amount)}
                            </ITText>
                            {p.status === "PAID" && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                <ITText className="text-emerald-600 text-[10px] font-bold font-mono tracking-widest uppercase">
                                  Folio {p.id.slice(0, 8).toUpperCase()}
                                </ITText>
                              </>
                            )}
                          </div>
                          <ITText className="text-[10px] text-slate-400 mt-0.5">
                            {p.paidAt
                              ? `Pagado ${dayjs(p.paidAt).format("DD MMM YYYY")}`
                              : "Pendiente"}
                          </ITText>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ITBadget
                          color={
                            p.status === "PAID"
                              ? "success"
                              : p.status === "PENDING"
                                ? "warning"
                                : "error"
                          }
                          size="small"
                          className="!rounded-full !px-2.5 font-medium text-[10px]"
                        >
                          {p.status === "PAID"
                            ? "Pagado"
                            : p.status === "PENDING"
                              ? "Pendiente"
                              : "Cancelado"}
                        </ITBadget>
                        {p.status === "PAID" && (
                          <ITButton
                            size="small"
                            variant="outlined"
                            onClick={async () => {
                              try {
                                await downloadReceipt(p.id);
                              } catch {
                                dispatch(showToast({ message: "Comprobante no disponible", type: "info" }));
                              }
                            }}
                            className="border-slate-200 text-slate-500 !px-2.5"
                            title="Descargar comprobante"
                          >
                            <FaDownload size={11} />
                          </ITButton>
                        )}
                        {p.status === "PENDING" && (
                          <ITButton
                            size="small"
                            onClick={async () => {
                              setLoadingCheckout(true);
                              const res = await createPaymentCheckout(p.id);
                              setLoadingCheckout(false);
                              if (res.success && res.data?.url) {
                                window.location.href = res.data.url;
                              } else {
                                dispatch(showToast({ message: "Error al iniciar Stripe", type: "error" }));
                              }
                            }}
                            disabled={loadingCheckout}
                            className="!rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium px-4 text-xs transition-colors"
                          >
                            Pagar ahora
                          </ITButton>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════
             CUOTAS POR MES
          ══════════════════════════════════════════ */}
          <div>
            <div className="mb-4">
              <ITText className="text-sm font-semibold text-slate-900">
                Cuotas por Mes
              </ITText>
              <ITText className="text-xs text-slate-400 mt-0.5">
                Mensualidades por período
              </ITText>
            </div>
            {(() => {
              const monthly = allPayments.filter((p) => p.fee?.type === "MONTHLY" || !p.fee?.type);
              const grouped: Record<string, { feeName: string; feeAmount: number; payments: PaymentResponse[] }> = {};
              monthly.forEach((p) => {
                const key = p.feeId || "other";
                if (!grouped[key]) {
                  grouped[key] = { feeName: p.fee?.name || "Cuota", feeAmount: p.amount, payments: [] };
                }
                grouped[key].payments.push(p);
              });
              const groups = Object.values(grouped);

              if (allPaymentsLoading) {
                return (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                );
              }
              if (groups.length === 0) {
                return (
                  <div className="py-12 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <ITText className="text-slate-500 font-medium text-sm">Sin cuotas mensuales</ITText>
                  </div>
                );
              }
              return (
                <div className="space-y-4">
                  {groups.map((g) => (
                    <div key={g.feeName} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <FaMoneyBill size={15} />
                        </div>
                        <div>
                          <ITText className="font-semibold text-slate-900 text-sm">{g.feeName}</ITText>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ITText className="font-bold text-slate-700 text-sm">
                              {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(g.feeAmount)}
                            </ITText>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <ITText className="text-[10px] text-slate-400 font-medium">Mensual</ITText>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {g.payments
                          .sort((a, b) => ((b.period || "") > (a.period || "") ? 1 : -1))
                          .map((p) => (
                            <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50/70">
                              <div className="flex items-center gap-3">
                                <ITText className="text-xs font-medium text-slate-600 min-w-[90px]">
                                  {p.period ? dayjs(p.period, "YYYY-MM").format("MMMM YYYY") : "—"}
                                </ITText>
                                <ITText className="text-xs font-bold text-slate-700">
                                  {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(p.amount)}
                                </ITText>
                                {p.status === "PAID" && (
                                  <ITText className="text-emerald-600 text-[9px] font-bold font-mono tracking-widest uppercase">
                                    Folio {p.id.slice(0, 8).toUpperCase()}
                                  </ITText>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <ITBadget
                                  color={p.status === "PAID" ? "success" : p.status === "PENDING" ? "warning" : "error"}
                                  size="small"
                                  className="!rounded-full !px-2 font-medium text-[9px]"
                                >
                                  {p.status === "PAID" ? "Pagado" : p.status === "PENDING" ? "Pendiente" : "Cancelado"}
                                </ITBadget>
                                {p.status === "PAID" && (
                                  <ITButton
                                    size="small"
                                    variant="outlined"
                                    onClick={async () => {
                                      try { await downloadReceipt(p.id); }
                                      catch { dispatch(showToast({ message: "Comprobante no disponible", type: "info" })); }
                                    }}
                                    className="border-slate-200 text-slate-500 !px-2"
                                    title="Descargar comprobante"
                                  >
                                    <FaDownload size={10} />
                                  </ITButton>
                                )}
                                {p.status === "PENDING" && (
                                  <ITButton
                                    size="small"
                                    onClick={async () => {
                                      setLoadingCheckout(true);
                                      const res = await createPaymentCheckout(p.id);
                                      setLoadingCheckout(false);
                                      if (res.success && res.data?.url) {
                                        window.location.href = res.data.url;
                                      } else {
                                        dispatch(showToast({ message: "Error al iniciar Stripe", type: "error" }));
                                      }
                                    }}
                                    disabled={loadingCheckout}
                                    className="!rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium px-3 text-[10px] transition-colors whitespace-nowrap"
                                  >
                                    Pagar ahora
                                  </ITButton>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
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
      )}

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

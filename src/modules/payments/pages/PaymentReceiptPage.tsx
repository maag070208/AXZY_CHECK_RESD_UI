import { ITBadget, ITButton, ITLoader, ITText, useITTheme } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaFileDownload, FaArrowLeft, FaStripe, FaCheckCircle } from "react-icons/fa";
import { getPaymentById, verifyPaymentSession, downloadReceipt, PaymentResponse } from "../services/PaymentsService";
import { buildShades, colorHex } from "../../home/utils/theme.utils";

const statusConfig: Record<string, { label: string; color: "success" | "warning" | "danger" }> = {
  PAID: { label: "PAGADO", color: "success" },
  PENDING: { label: "PENDIENTE", color: "warning" },
  CANCELLED: { label: "CANCELADO", color: "danger" },
  FAILED: { label: "FALLIDO", color: "danger" },
};

const actionLabels: Record<string, string> = {
  CREATE: "Creado",
  STATUS_CHANGE: "Cambio de estado",
};

const translateAction = (action: string) => actionLabels[action] || action;
const translateStatus = (status: string) => statusConfig[status]?.label || status;

const PaymentReceiptPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const sessionVerifyAttempted = useRef(false);

  const { palette } = useITTheme();
  const primaryShades = useMemo(() => buildShades(colorHex(palette, "primary")), [palette]);
  const warningShades = useMemo(() => buildShades(colorHex(palette, "warning")), [palette]);

  useEffect(() => {
    if (!id) return;

    const sessionId = searchParams.get("session_id");
    if (sessionId && !sessionVerifyAttempted.current) {
      sessionVerifyAttempted.current = true;
      verifyFromStripe(sessionId);
    } else {
      loadPayment();
    }

    const interval = setInterval(loadPayment, 5000);
    return () => clearInterval(interval);
  }, [id, searchParams]);

  const verifyFromStripe = async (sessionId: string) => {
    if (!id) return;
    setLoading(true);
    const res = await verifyPaymentSession(sessionId);
    if (res.success && res.data) {
      setPayment(res.data);
      setLoading(res.data.status !== "PAID");
    } else {
      loadPayment();
    }
  };

  const loadPayment = async () => {
    if (!id) return;
    try {
      const res = await getPaymentById(id);
      if (res.success && res.data) {
        setPayment(res.data);
        if (res.data.status === "PAID") setLoading(false);
      } else {
        if (!payment) setError("No se encontro el pago");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      await downloadReceipt(id);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex flex-col items-center justify-center gap-4">
        <ITLoader size="lg" />
        <div className="text-center">
          <ITText className="text-slate-500 text-sm font-bold uppercase tracking-widest block">
            Verificando pago...
          </ITText>
          <ITText className="text-slate-300 text-[10px] font-bold mt-1 block">
            Esto puede tomar unos segundos
          </ITText>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ITText className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4 block">
            {error || "Pago no encontrado"}
          </ITText>
          <ITButton variant="filled" onClick={() => navigate("/payments")} color="primary">
            Volver a Pagos
          </ITButton>
        </div>
      </div>
    );
  }

  const status = statusConfig[payment.status] || statusConfig.PENDING;
  const residentName = payment.resident?.user
    ? `${payment.resident.user.name} ${payment.resident.user.lastName || ""}`.trim()
    : "—";
  const feeName = payment.fee?.name || "Cuota";
  const amountFormatted = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(payment.amount);
  const periodLabel = payment.period
    ? dayjs(payment.period, "YYYY-MM").format("MMMM YYYY")
    : "";

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="max-w-2xl mx-auto p-4 md:p-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-4">
          <ITButton
            variant="filled"
            color="secondary"
            onClick={() => navigate("/payments")}
            className="!flex !flex-row !items-center !gap-2"
          >
            <FaArrowLeft size={12} /> Pagos
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={handleDownload}
            disabled={downloading}
            className="!flex !flex-row !items-center !gap-2"
          >
            {downloading ? (
              <ITLoader size="sm" />
            ) : (
              <><FaFileDownload size={14} /> Descargar</>
            )}
          </ITButton>
        </div>

        <div
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0"
        >
          <div
            className="p-6 md:p-8"
            style={{
              backgroundColor: payment.status === "PAID" ? primaryShades[600] : warningShades[600],
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <ITBadget color={status.color} size="medium" className="!text-[10px] tracking-widest font-black uppercase">
                {status.label}
              </ITBadget>
              <ITText className="text-[9px] font-mono font-black text-white/60 uppercase tracking-wider hidden md:block print:block">
                #{payment.id.slice(0, 8).toUpperCase()}
              </ITText>
            </div>

            {payment.status === "PAID" && (
              <div className="flex items-center gap-3">
                <FaCheckCircle size={24} style={{ color: "#ffffff" }} />
                <ITText className="text-2xl md:text-3xl font-black text-white tracking-tight block">
                  Comprobante de Pago
                </ITText>
              </div>
            )}
            {payment.status === "PENDING" && (
              <div className="flex items-center gap-3">
                <ITLoader size="sm" className="text-white" />
                <ITText className="text-xl md:text-2xl font-black text-white tracking-tight block">
                  Pago en Proceso
                </ITText>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center py-4">
              <ITText className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-1 block">
                {amountFormatted}
              </ITText>
              <ITText className="text-sm font-bold text-slate-400 uppercase tracking-widest block">
                {feeName}
              </ITText>
              {periodLabel && (
                <ITText className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mt-1 block">
                  {periodLabel}
                </ITText>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Section title="Residente">
                  <Row label="Nombre" value={residentName} />
                  <Row label="Telefono" value={payment.resident?.phone || "—"} />
                  <Row label="Email" value={payment.resident?.email || "—"} />
                </Section>
              </div>
              <div className="space-y-4">
                <Section title="Detalle del Pago">
                  <Row label="Folio" value={payment.id.slice(0, 8).toUpperCase()} />
                  <Row label="Concepto" value={feeName} />
                  <Row label="Referencia" value={payment.reference || "—"} />
                  <Row label="Fecha de Pago" value={payment.paidAt ? dayjs(payment.paidAt).format("DD/MMM/YYYY hh:mm A") : "—"} />
                  <Row label="Registrado" value={dayjs(payment.createdAt).format("DD/MMM/YYYY hh:mm A")} />
                </Section>
              </div>
            </div>

            {payment.status === "PAID" && (
              <div
                className="rounded-xl p-4 flex items-center gap-3"
                style={{ backgroundColor: primaryShades[600] }}
              >
                <FaCheckCircle size={20} style={{ color: "#ffffff" }} />
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider block text-white">
                    Pago confirmado
                  </span>
                  <span className="text-[10px] font-bold block text-white/70">
                    Este comprobante es valido para fines administrativos
                  </span>
                </div>
              </div>
            )}

            {payment.paymentLogs && payment.paymentLogs.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <Section title="Historial">
                  <div className="space-y-2">
                    {payment.paymentLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px] flex-wrap">
                        <span className="font-black text-slate-400 uppercase tracking-wider min-w-[100px]">
                          {dayjs(log.createdAt).format("DD/MMM HH:mm")}
                        </span>
                        <span className="text-slate-300">—</span>
                        <span className="font-bold text-slate-600">{translateAction(log.action)}</span>
                        {log.statusTo && (
                          <ITBadget color="success" size="small" className="!text-[7px]">{translateStatus(log.statusTo)}</ITBadget>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {payment.stripePaymentIntentId && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <FaStripe size={14} className="text-slate-400" />
                  <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    Verificado por Stripe &middot; {payment.stripePaymentIntentId.slice(0, 12)}...
                  </ITText>
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-5 text-center">
              <ITText className="text-[9px] font-bold text-slate-300 uppercase tracking-widest block">
                AXZY CHECK &mdash; Sistema de Administracion Residencial
              </ITText>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0.5in; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">{title}</ITText>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-4">
    <ITText className="text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[80px] block">{label}</ITText>
    <ITText className={`text-[11px] font-black text-slate-700 text-right ${mono ? "font-mono text-[10px]" : ""} block`}>
      {value}
    </ITText>
  </div>
);

export default PaymentReceiptPage;

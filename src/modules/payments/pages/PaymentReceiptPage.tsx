import { ITBadget, ITButton, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaFileDownload, FaArrowLeft, FaStripe } from "react-icons/fa";
import { getPaymentById, verifyPaymentSession, PaymentResponse } from "../services/PaymentsService";

const statusConfig = {
  PAID: { label: "PAGADO", color: "success" as const },
  PENDING: { label: "PENDIENTE", color: "warning" as const },
  CANCELLED: { label: "CANCELADO", color: "danger" as const },
  FAILED: { label: "FALLIDO", color: "danger" as const },
};

const PaymentReceiptPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sessionVerifyAttempted = useRef(false);

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
    const res = await getPaymentById(id);
    if (res.success && res.data) {
      setPayment(res.data);
      if (res.data.status === "PAID") setLoading(false);
    } else {
      if (!payment) setError("No se encontró el pago");
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <ITText className="text-slate-400 text-sm font-bold uppercase tracking-widest">Cargando comprobante...</ITText>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ITText className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-4">{error || "Pago no encontrado"}</ITText>
          <ITButton variant="filled" onClick={() => navigate("/payments")}>Volver a Pagos</ITButton>
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

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="max-w-3xl mx-auto p-4 md:p-6 print:p-0">
        <div className="print:hidden flex items-center justify-between mb-6">
          <ITButton
            variant="ghost"
            onClick={() => navigate("/payments")}
            className="!flex !flex-row !items-center !gap-2 text-slate-500"
          >
            <FaArrowLeft size={14} /> Volver a Pagos
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={handlePrint}
            className="!flex !flex-row !items-center !gap-2"
          >
            <FaFileDownload size={14} /> Descargar Comprobante
          </ITButton>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-0">
          <div className={`p-6 md:p-8 ${payment.status === "PAID" ? "bg-emerald-50" : "bg-amber-50"} print:bg-white`}>
            <div className="flex items-center justify-between">
              <div>
                <ITBadget color={status.color} size="medium" className="!text-[10px] tracking-widest font-black uppercase mb-3">
                  {status.label}
                </ITBadget>
                <ITText className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                  Comprobante de Pago
                </ITText>
              </div>
              <div className="hidden md:block print:block text-right">
                <ITText className="text-[9px] font-mono font-black text-slate-300 uppercase tracking-wider">
                  #{payment.id.slice(0, 8).toUpperCase()}
                </ITText>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            <div className="text-center py-6">
              <ITText className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-1">
                {amountFormatted}
              </ITText>
              <ITText className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {feeName}
              </ITText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Section title="Residente">
                  <Row label="Nombre" value={residentName} />
                  <Row label="Teléfono" value={payment.resident?.phone || "—"} />
                  <Row label="Email" value={payment.resident?.email || "—"} />
                </Section>
              </div>
              <div className="space-y-4">
                <Section title="Detalle del Pago">
                  <Row label="Folio" value={payment.id.slice(0, 8).toUpperCase()} />
                  <Row label="Concepto" value={feeName} />
                  <Row label="Referencia" value={payment.reference || "—"} />
                  <Row label="Fecha de Pago" value={payment.paidAt ? dayjs(payment.paidAt).format("DD/MMM/YYYY hh:mm A") : "—"} />
                  <Row label="Creado" value={dayjs(payment.createdAt).format("DD/MMM/YYYY hh:mm A")} />
                </Section>
              </div>
            </div>

            {payment.stripePaymentIntentId && (
              <div className="border-t border-slate-100 pt-6">
                <Section title="Auditoría Stripe">
                  <Row label="Payment Intent ID" value={payment.stripePaymentIntentId} mono />
                  {payment.stripeInvoiceId && <Row label="Invoice ID" value={payment.stripeInvoiceId} mono />}
                  <div className="flex items-center gap-2 mt-2">
                    <FaStripe size={16} className="text-slate-400" />
                    <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Transacción verificada por Stripe
                    </ITText>
                  </div>
                </Section>
              </div>
            )}

            {payment.paymentLogs && payment.paymentLogs.length > 0 && (
              <div className="border-t border-slate-100 pt-6">
                <Section title="Historial de Auditoría">
                  <div className="space-y-2">
                    {payment.paymentLogs.map((log, i) => (
                      <div key={i} className="flex items-center gap-3 text-[11px]">
                        <span className="font-black text-slate-400 uppercase tracking-wider min-w-[120px]">
                          {dayjs(log.createdAt).format("DD/MMM HH:mm")}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {log.statusFrom && (
                            <>
                              <ITBadget color="warning" size="small" className="!text-[8px]">{log.statusFrom}</ITBadget>
                              <span className="text-slate-300">→</span>
                            </>
                          )}
                          <ITBadget color="success" size="small" className="!text-[8px]">{log.statusTo}</ITBadget>
                        </div>
                        <span className="font-bold text-slate-400">{log.notes}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            <div className="border-t border-slate-100 pt-6 text-center print:block">
              <ITText className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                AXZY CHECK — Sistema de Administración Residencial
              </ITText>
              <ITText className="text-[8px] font-bold text-slate-200 uppercase tracking-wider mt-1">
                Este comprobante es válido para fines administrativos
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
    <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{title}</ITText>
    <div className="space-y-2">{children}</div>
  </div>
);

const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="flex items-start justify-between gap-4">
    <ITText className="text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[100px]">{label}</ITText>
    <ITText className={`text-[11px] font-black text-slate-700 text-right ${mono ? "font-mono text-[10px]" : ""}`}>
      {value}
    </ITText>
  </div>
);

export default PaymentReceiptPage;
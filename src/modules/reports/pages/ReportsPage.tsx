import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDatePicker,
  ITDialog,
  ITText,
  ITTripleFilter,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useState } from "react";
import {
  FaFilePdf,
  FaChartBar,
  FaMoneyBillWave,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  getPaymentReport,
  getPaymentReportPDF,
  getIncidentsComplaintsReport,
  getIncidentsComplaintsReportPDF,
  PaymentReportData,
  PaymentReportRow,
  IncidentsComplaintsReportData,
  IncidentsComplaintsRow,
} from "../services/ReportsService";

const STATUS_OPTIONS_COBRANZA = [
  { label: "TODOS", value: "ALL" },
  { label: "PAGADOS", value: "PAID" },
  { label: "PENDIENTES", value: "PENDING" },
];

const STATUS_OPTIONS_INCIDENTES = [
  { label: "TODAS", value: "ALL" },
  { label: "ABIERTAS", value: "OPEN" },
  { label: "CERRADAS", value: "CLOSED" },
];

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { palette } = useITTheme();
  const primaryHex = palette?.primary || "#065911";

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Reportes"
        subtitle="Generación y exportación de reportes operativos y financieros"
        icon={FaChartBar}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <button
          onClick={() => setPaymentModalOpen(true)}
          className="bg-white rounded-2xl border border-slate-100 p-8 text-left hover:border-slate-200 hover:shadow-md transition-all group"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: primaryHex + "12" }}
          >
            <FaMoneyBillWave size={24} style={{ color: primaryHex }} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Reporte de Cobranza
          </h3>
          <ITText className="text-xs text-slate-500 leading-relaxed">
            Resumen de pagos por período, estado y residente. Incluye montos
            cobrados, pendientes y totalizadores con exportación a PDF.
          </ITText>
        </button>

        <button
          onClick={() => setIncidentModalOpen(true)}
          className="bg-white rounded-2xl border border-slate-100 p-8 text-left hover:border-slate-200 hover:shadow-md transition-all group"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: primaryHex + "12" }}
          >
            <FaExclamationTriangle size={24} style={{ color: primaryHex }} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Incidencias y Quejas
          </h3>
          <ITText className="text-xs text-slate-500 leading-relaxed">
            Consolidado de incidencias y quejas vecinales. Filtra por estado,
            categoría y fecha. Incluye KPIs de resolución y exportación a PDF.
          </ITText>
        </button>
      </div>

      {paymentModalOpen && (
        <PaymentReportModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          dispatch={dispatch}
          primaryHex={primaryHex}
        />
      )}

      {incidentModalOpen && (
        <IncidentsComplaintsReportModal
          isOpen={incidentModalOpen}
          onClose={() => setIncidentModalOpen(false)}
          dispatch={dispatch}
          primaryHex={primaryHex}
        />
      )}
    </div>
  );
};

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatch: any;
  primaryHex: string;
}

const PaymentReportModal = ({ isOpen, onClose, dispatch, primaryHex }: ReportModalProps) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [data, setData] = useState<PaymentReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const [from, to] = dateRange;
    if (!from || !to) {
      dispatch(showToast({ message: "Selecciona un rango de fechas", type: "warning" }));
      return;
    }
    setLoading(true);
    setData(null);
    const res = await getPaymentReport({
      from: dayjs(from).format("YYYY-MM-DD"),
      to: dayjs(to).format("YYYY-MM-DD"),
      status: statusFilter === "ALL" ? undefined : statusFilter,
    });
    if (res.success && res.data) {
      setData(res.data);
    } else {
      dispatch(showToast({ message: "Error al generar el reporte", type: "error" }));
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    const [from, to] = dateRange;
    if (!from || !to) return;
    try {
      const blob = await getPaymentReportPDF({
        from: dayjs(from).format("YYYY-MM-DD"),
        to: dayjs(to).format("YYYY-MM-DD"),
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_Cobranza_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      dispatch(showToast({ message: "PDF descargado", type: "success" }));
    } catch {
      dispatch(showToast({ message: "Error al descargar PDF", type: "error" }));
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Reporte de Cobranza">
      <div className="flex flex-col w-[1000px]">
        <div className="px-6 py-4 flex items-end gap-6 border-b border-slate-100">
          <div className="flex-[2] max-w-[420px]">
            <ITDatePicker
              name="paymentDateRange"
              range
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as [Date | null, Date | null])}
              label="Período"
            />
          </div>
          <div className="flex-1">
            <ITText className="text-xs font-semibold text-slate-500 mb-1">Estado</ITText>
            <ITTripleFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS_COBRANZA}
            />
          </div>
          <div className="flex items-end pb-0.5">
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Generar"}
            </ITButton>
          </div>
        </div>

        {data && (
          <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
              <SummaryCard
                label="Cobrado"
                value={`$${data.summary.paidAmount.toFixed(2)}`}
                sub={`${data.summary.paidCount} pagos`}
                color={primaryHex}
              />
              <SummaryCard
                label="Pendiente"
                value={`$${data.summary.pendingAmount.toFixed(2)}`}
                sub={`${data.summary.pendingCount} pagos`}
                color="#f59e0b"
              />
              <SummaryCard
                label="Total"
                value={`$${data.summary.totalAmount.toFixed(2)}`}
                sub={`${data.summary.totalCount} registros`}
                color="#64748b"
              />
            </div>

            <div className="overflow-x-auto">
              <PaymentTable rows={data.rows} />
            </div>

            <div className="flex justify-end">
              <ITButton
                variant="outlined"
                color="primary"
                onClick={handleDownloadPDF}
              >
                <FaFilePdf size={14} className="mr-2" />
                Descargar PDF
              </ITButton>
            </div>
            </div>
          </div>
        )}
      </div>
    </ITDialog>
  );
};

const IncidentsComplaintsReportModal = ({ isOpen, onClose, dispatch, primaryHex }: ReportModalProps) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [data, setData] = useState<IncidentsComplaintsReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const [from, to] = dateRange;
    if (!from || !to) {
      dispatch(showToast({ message: "Selecciona un rango de fechas", type: "warning" }));
      return;
    }
    setLoading(true);
    setData(null);
    const res = await getIncidentsComplaintsReport({
      from: dayjs(from).format("YYYY-MM-DD"),
      to: dayjs(to).format("YYYY-MM-DD"),
      status: statusFilter === "ALL" ? undefined : statusFilter === "OPEN" ? "OPEN" : "CLOSED",
    });
    if (res.success && res.data) {
      setData(res.data);
    } else {
      dispatch(showToast({ message: "Error al generar el reporte", type: "error" }));
    }
    setLoading(false);
  };

  const handleDownloadPDF = async () => {
    const [from, to] = dateRange;
    if (!from || !to) return;
    try {
      const blob = await getIncidentsComplaintsReportPDF({
        from: dayjs(from).format("YYYY-MM-DD"),
        to: dayjs(to).format("YYYY-MM-DD"),
        status: statusFilter === "ALL" ? undefined : statusFilter === "OPEN" ? "OPEN" : "CLOSED",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_Incidencias_Quejas_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      dispatch(showToast({ message: "PDF descargado", type: "success" }));
    } catch {
      dispatch(showToast({ message: "Error al descargar PDF", type: "error" }));
    }
  };

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Incidencias y Quejas">
      <div className="flex flex-col w-[1000px]">
        <div className="px-6 py-4 flex items-end gap-6 border-b border-slate-100">
          <div className="flex-[2] max-w-[420px]">
            <ITDatePicker
              name="incidentDateRange"
              range
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as [Date | null, Date | null])}
              label="Período"
            />
          </div>
          <div className="flex-1">
            <ITText className="text-xs font-semibold text-slate-500 mb-1">Estado</ITText>
            <ITTripleFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS_INCIDENTES}
            />
          </div>
          <div className="flex items-end pb-0.5">
            <ITButton
              variant="filled"
              color="primary"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Cargando..." : "Generar"}
            </ITButton>
          </div>
        </div>

        {data && (
          <div className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
            <div className="p-6 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <SummaryCard
                label="Incidencias"
                value={String(data.summary.totalIncidents)}
                color={primaryHex}
              />
              <SummaryCard
                label="Quejas"
                value={String(data.summary.totalComplaints)}
                color="#8b5cf6"
              />
              <SummaryCard
                label="Abiertas"
                value={String(data.summary.openCount)}
                color="#f59e0b"
              />
              <SummaryCard
                label="Cerradas"
                value={String(data.summary.resolvedCount)}
                color="#10b981"
              />
            </div>

            <div className="grid grid-cols-1">
              <SummaryCard
                label="Tiempo Promedio de Resolución"
                value={`${Math.round(data.summary.avgResolutionHours)} horas`}
                color="#6366f1"
              />
            </div>

            <div className="overflow-x-auto">
              <IncidentComplaintTable rows={data.rows} />
            </div>

            <div className="flex justify-end">
              <ITButton
                variant="outlined"
                color="primary"
                onClick={handleDownloadPDF}
              >
                <FaFilePdf size={14} className="mr-2" />
                Descargar PDF
              </ITButton>
            </div>
            </div>
          </div>
        )}
      </div>
    </ITDialog>
  );
};

const SummaryCard = ({ label, value, sub, color }: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) => (
  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
    <ITText className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
      {label}
    </ITText>
    <div className="text-lg font-bold mt-1" style={{ color }}>
      {value}
    </div>
    {sub && (
      <ITText className="text-[10px] text-slate-400 mt-0.5">{sub}</ITText>
    )}
  </div>
);

const PaymentTable = ({ rows }: { rows: PaymentReportRow[] }) => (
  <table className="w-full text-xs border-collapse">
    <thead>
      <tr className="border-b border-slate-100">
        <Th>Residente</Th>
        <Th>Casa</Th>
        <Th>Cuota</Th>
        <Th>Monto</Th>
        <Th>Período</Th>
        <Th>Estado</Th>
        <Th>Fecha Pago</Th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
          <td className="py-2.5 px-3 font-semibold text-slate-700">{row.residentName}</td>
          <td className="py-2.5 px-3 text-slate-500">{row.house}</td>
          <td className="py-2.5 px-3 text-slate-500">{row.feeName}</td>
          <td className="py-2.5 px-3 font-bold text-slate-700">${row.amount.toFixed(2)}</td>
          <td className="py-2.5 px-3 text-slate-500">{row.period}</td>
          <td className="py-2.5 px-3">
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                row.status === "PAID"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {row.status === "PAID" ? "PAGADO" : "PENDIENTE"}
            </span>
          </td>
          <td className="py-2.5 px-3 text-slate-500">
            {row.paidAt ? dayjs(row.paidAt).format("DD/MM/YYYY") : "-"}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const IncidentComplaintTable = ({ rows }: { rows: IncidentsComplaintsRow[] }) => (
  <table className="w-full text-xs border-collapse">
    <thead>
      <tr className="border-b border-slate-100">
        <Th>Tipo</Th>
        <Th>Asunto</Th>
        <Th>Categoría</Th>
        <Th>Reportado por</Th>
        <Th>Estado</Th>
        <Th>Creado</Th>
        <Th>Resolución</Th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50">
          <td className="py-2.5 px-3">
            <span
              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                row.type === "INCIDENT"
                  ? "bg-red-50 text-red-600"
                  : "bg-purple-50 text-purple-600"
              }`}
            >
              {row.type === "INCIDENT" ? "INCIDENCIA" : "QUEJA"}
            </span>
          </td>
          <td className="py-2.5 px-3 font-semibold text-slate-700 max-w-[180px] truncate">
            {row.title}
          </td>
          <td className="py-2.5 px-3 text-slate-500">{row.category}</td>
          <td className="py-2.5 px-3 text-slate-500">{row.reportedBy}</td>
          <td className="py-2.5 px-3">
            <StatusBadge status={row.status} />
          </td>
          <td className="py-2.5 px-3 text-slate-500">
            {dayjs(row.createdAt).format("DD/MM/YYYY")}
          </td>
          <td className="py-2.5 px-3 text-slate-500">
            {row.resolvedAt ? dayjs(row.resolvedAt).format("DD/MM/YYYY") : "-"}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="py-3 px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-left">
    {children}
  </th>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: "PENDIENTE", className: "bg-amber-50 text-amber-600" },
    ATTENDED: { label: "ATENDIDA", className: "bg-emerald-50 text-emerald-600" },
    OPEN: { label: "ABIERTA", className: "bg-amber-50 text-amber-600" },
    IN_PROGRESS: { label: "EN PROCESO", className: "bg-blue-50 text-blue-600" },
    RESOLVED: { label: "RESUELTA", className: "bg-emerald-50 text-emerald-600" },
    CLOSED: { label: "CERRADA", className: "bg-slate-100 text-slate-500" },
  };
  const c = config[status] || { label: status, className: "bg-slate-50 text-slate-500" };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${c.className}`}>
      {c.label}
    </span>
  );
};

export default ReportsPage;

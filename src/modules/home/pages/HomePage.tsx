import { AppState } from "@app/core/store/store";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import {
  FaBook,
  FaBuilding,
  FaChartBar,
  FaChild,
  FaCheckCircle,
  FaClock,
  FaCogs,
  FaExclamationTriangle,
  FaKey,
  FaListAlt,
  FaMoneyBill,
  FaRoute,
  FaShieldAlt,
  FaTable,
  FaThLarge,
  FaUserShield,
  FaUsers,
  FaWrench,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HomeCardItem } from "../components/HomeCardItem";
import { AnalyticsTab } from "../components/tabs/AnalyticsTab";
import { OperationalDetailTab } from "../components/tabs/OperationalDetailTab";
import ResidentHomePanel from "../components/ResidentHomePanel";
import { ITBadget, ITLoader, useITTheme, ITDatePicker } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import {
  DashboardCounts,
  fetchDashboardCounts,
  fetchRecentIncidents,
  fetchRecentPayments,
  RecentIncident,
} from "../services/DashboardService";
import type { PaymentResponse } from "../../payments/services/PaymentsService";
import { buildShades, colorHex, ThemeColor } from "../utils/theme.utils";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

const formatTimeAgo = (iso?: string) => {
  if (!iso) return "—";
  const d = dayjs(iso);
  const diffMin = dayjs().diff(d, "minute");
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffMin < 1440) return `hace ${Math.floor(diffMin / 60)} h`;
  return d.format("DD MMM");
};

type KpiKey = "residents" | "overduePayments" | "activePasses" | "guards" | "pendingIncidents";
type KpiAccent = "primary" | "warning" | "info" | "success" | "danger";

const KPI_CONFIG: Array<{
  key: KpiKey;
  label: string;
  icon: any;
  accent: KpiAccent;
  format: (c: DashboardCounts) => string;
}> = [
  { key: "residents", label: "Residentes activos", icon: <FaUsers />, accent: "primary", format: (c) => String(c.residents) },
  { key: "overduePayments", label: "Cuotas vencidas", icon: <FaMoneyBill />, accent: "warning", format: (c) => String(c.overduePayments) },
  { key: "activePasses", label: "Pases activos", icon: <FaKey />, accent: "info", format: (c) => String(c.activePasses) },
  { key: "guards", label: "Guardias", icon: <FaUserShield />, accent: "success", format: (c) => String(c.guards) },
  { key: "pendingIncidents", label: "Incidencias pendientes", icon: <FaExclamationTriangle />, accent: "danger", format: (c) => String(c.pendingIncidents) },
];

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);
  const { palette } = useITTheme();
  const [homeCardItem, setHomeCardItem] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"nav" | "analytics" | "detail">("nav");
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<RecentIncident[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentResponse[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [paymentDateRange, setPaymentDateRange] = useState<[Date | null, Date | null]>([dayjs().startOf("month").toDate(), dayjs().endOf("month").startOf("day").toDate()]);
  const [committedPaymentRange, setCommittedPaymentRange] = useState<[Date | null, Date | null]>([dayjs().startOf("month").toDate(), dayjs().endOf("month").startOf("day").toDate()]);

  useEffect(() => {
    if (paymentDateRange[0] && paymentDateRange[1]) {
      setCommittedPaymentRange(paymentDateRange);
    }
  }, [paymentDateRange]);

  const canViewMetrics = user.role === "ADMIN" || user.role === "LIDER" || user.role === "SHIFT";

  if (user.role === "RESDN") {
    return <ResidentHomePanel />;
  }

  const currentDate = dayjs().format("DD MMM YYYY");
  const primaryHex = colorHex(palette, "primary");
  const primaryShades = useMemo(() => buildShades(primaryHex), [primaryHex]);

  const loadDashboard = useCallback(async (dateRange: [Date | null, Date | null]) => {
    if (!user?.token) return;
    setLoadingDashboard(true);
    const from = dateRange[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : undefined;
    const to = dateRange[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : undefined;
    const [countsRes, incidentsRes, paymentsRes] = await Promise.allSettled([
      fetchDashboardCounts(from, to),
      fetchRecentIncidents(4),
      fetchRecentPayments(4),
    ]);
    if (countsRes.status === "fulfilled") setCounts(countsRes.value);
    if (incidentsRes.status === "fulfilled") setRecentIncidents(incidentsRes.value);
    if (paymentsRes.status === "fulfilled") setRecentPayments(paymentsRes.value);
    setLoadingDashboard(false);
  }, [user?.token]);

  useEffect(() => {
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    const allCards: Array<{
      title: string;
      description: string;
      icon: ReactElement;
      action: () => void;
      roles: string[];
      accent: ThemeColor;
    }> = [
      { title: "Ubicaciones", description: "Espacios y locales", icon: <FaListAlt />, action: () => navigate("/locations"), roles: ["ADMIN", "LIDER", "SHIFT"], accent: "info" },
      { title: "Residentes", description: "Propietarios y viviendas", icon: <FaUsers />, action: () => navigate("/residents"), roles: ["ADMIN", "LIDER"], accent: "primary" },
      { title: "Propiedades", description: "Casas y habitabilidad", icon: <FaBuilding />, action: () => navigate("/properties"), roles: ["ADMIN", "LIDER"], accent: "secondary" },
      { title: "Accesos", description: "Pases y visitas", icon: <FaKey />, action: () => navigate("/accesses"), roles: ["ADMIN", "LIDER", "SHIFT", "RESDN"], accent: "warning" },
      { title: "Recorridos", description: "Rondas en vivo", icon: <FaClock />, action: () => navigate("/rounds"), roles: ["ADMIN", "LIDER", "SHIFT"], accent: "success" },
      { title: "Configuración de rondas", description: "Rutas de vigilancia", icon: <FaRoute />, action: () => navigate("/routes"), roles: ["ADMIN", "LIDER", "SHIFT"], accent: "info" },
      { title: "Incidencias", description: "Novedades y emergencias", icon: <FaExclamationTriangle />, action: () => navigate("/incidents"), roles: ["ADMIN", "LIDER", "SHIFT"], accent: "danger" },
      { title: "Mantenimiento", description: "Reportes técnicos", icon: <FaWrench />, action: () => navigate("/maintenances"), roles: ["ADMIN", "LIDER", "SHIFT"], accent: "warning" },
      { title: "Kardex", description: "Bitácora de movimientos", icon: <FaBook />, action: () => navigate("/kardex"), roles: ["ADMIN", "LIDER", "SHIFT"], accent: "secondary" },
      { title: "Guardias", description: "Personal operativo", icon: <FaUserShield />, action: () => navigate("/guards"), roles: ["ADMIN", "LIDER", "SHIFT"], accent: "success" },
      { title: "Horarios", description: "Turnos y roles", icon: <FaListAlt />, action: () => navigate("/schedules"), roles: ["ADMIN", "LIDER", "SHIFT"], accent: "info" },
      { title: "Usuarios", description: "Usuarios del sistema", icon: <FaChild />, action: () => navigate("/users"), roles: ["ADMIN", "LIDER"], accent: "primary" },
      { title: "Catálogos", description: "Tipos y ajustes", icon: <FaCogs />, action: () => navigate("/settings"), roles: ["ADMIN", "LIDER"], accent: "secondary" },
      { title: "Buzón", description: "Reportes y sugerencias", icon: <FaExclamationTriangle />, action: () => navigate("/complaints"), roles: ["ADMIN", "LIDER", "RESDN"], accent: "danger" },
      { title: user.role === "RESDN" ? "Mi cuenta" : "Pagos", description: user.role === "RESDN" ? "Saldos y pagos en línea" : "Cobros y cuotas", icon: <FaMoneyBill />, action: () => navigate("/payments"), roles: ["ADMIN", "LIDER", "RESDN"], accent: "success" },
      { title: "Contactos", description: "Red de visitas", icon: <FaUsers />, action: () => navigate("/contacts"), roles: ["RESDN"], accent: "primary" },
    ];

    setHomeCardItem(allCards.filter((c) => c.roles.includes(user.role || "")));
  }, [user, navigate]);

  useEffect(() => {
    loadDashboard(committedPaymentRange);
  }, [loadDashboard, committedPaymentRange]);

  const tabs = useMemo(() => {
    const items: Array<{ key: "nav" | "analytics" | "detail"; label: string; icon: ReactElement }> = [
      { key: "nav", label: "Módulos", icon: <FaThLarge /> },
    ];
    if (canViewMetrics) {
      items.push(
        { key: "analytics", label: "Security Analytics", icon: <FaChartBar /> },
        { key: "detail", label: "Detalle Operativo", icon: <FaTable /> },
      );
    }
    return items;
  }, [canViewMetrics]);

  const headerStyle = {
    backgroundImage: `linear-gradient(135deg, ${primaryShades[800]} 0%, ${primaryShades[700]} 50%, ${primaryShades[900]} 100%)`,
    color: "#ffffff",
  };

  return (
    <div className="min-h-screen font-sans bg-slate-100">
      {/* HEADER */}
      <div className="relative overflow-hidden shadow-sm" style={headerStyle}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 40 L 40 0' stroke='white' stroke-width='0.5' fill='none' /%3E%3C/svg%3E\")", backgroundSize: "40px 40px" }} />
        <div className="relative px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/10 shrink-0">
                <FaShieldAlt size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white leading-tight">Panel de Control</h1>
                  <span className="text-white/40 text-xs">·</span>
                  <span className="text-white/70 text-xs uppercase tracking-wider font-medium">AXZY CHECK</span>
                </div>
                <div className="text-white/60 text-[11px] font-medium">{currentDate}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive ? "bg-white shadow-md" : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                    style={isActive ? { color: primaryShades[800] } : undefined}
                  >
                    <span className="text-xs">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}


            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {activeTab === "nav" && (
          <>
            {/* KPI ROW */}
            <section>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {KPI_CONFIG.map((kpi) => {
                  const accentHex = colorHex(palette, kpi.accent);
                  const shades = buildShades(accentHex);
                  const value = counts ? kpi.format(counts) : "—";
                  return (
                    <div
                      key={kpi.key}
                      className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-base shrink-0"
                        style={{ backgroundColor: shades[100], color: shades[700] }}
                      >
                        {kpi.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                          {kpi.label}
                        </div>
                        <div className="text-xl font-black text-slate-800 leading-tight tabular-nums">
                          {loadingDashboard ? <span className="text-slate-300">…</span> : value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* INSIGHTS + SHORTCUTS */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pagos del mes */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Resumen de pagos</h2>
                    <p className="text-[13px] text-slate-600 font-medium">Estado de cuenta global</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ITDatePicker
                      name="paymentRange"
                      value={paymentDateRange}
                      range
                      onChange={(e: any) => setPaymentDateRange(e.target.value)}
                      className="!border !border-slate-200 !rounded-lg !bg-white !shadow-sm !px-3 !py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  <div
                    className="rounded-lg p-3 border"
                    style={{ backgroundColor: "var(--color-success-50)", borderColor: "var(--color-success-200)" }}
                  >
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Cobrado</div>
                    <div className="text-lg font-black text-slate-800 tabular-nums mt-0.5">
                      {loadingDashboard ? "…" : formatCurrency(counts?.paymentsPaidAmount ?? 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {counts?.paymentsPaid ?? 0} pagos registrados
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-3 border"
                    style={{ backgroundColor: "var(--color-warning-50)", borderColor: "var(--color-warning-200)" }}
                  >
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Por cobrar</div>
                    <div className="text-lg font-black text-slate-800 tabular-nums mt-0.5">
                      {loadingDashboard ? "…" : formatCurrency(counts?.paymentsPendingAmount ?? 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {counts?.paymentsPending ?? 0} pagos pendientes
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-3 border"
                    style={{ backgroundColor: "var(--color-danger-50)", borderColor: "var(--color-danger-200)" }}
                  >
                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Atrasado</div>
                    <div className="text-lg font-black text-slate-800 tabular-nums mt-0.5">
                      {loadingDashboard ? "…" : formatCurrency(counts?.overduePaymentsAmount ?? 0)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {counts?.overduePayments ?? 0} pagos vencidos
                    </div>
                  </div>
                </div>

                {/* Recent payments */}
                <div className="border-t border-slate-100">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Pagos recientes</h3>
                    <button
                      onClick={() => navigate("/payments")}
                      className="text-[10px] font-bold uppercase tracking-wider hover:underline"
                      style={{ color: primaryShades[600] }}
                    >
                      Ver todos →
                    </button>
                  </div>
                  {loadingDashboard ? (
                    <div className="px-4 py-6 flex justify-center">
                      <ITLoader size="sm" />
                    </div>
                  ) : recentPayments.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[11px] text-slate-400">Sin pagos recientes</div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {recentPayments.map((p) => (
                        <li key={p.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-800 truncate">
                              {p.resident?.user?.name ?? "Residente"} {p.resident?.user?.lastName ?? ""}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {p.resident?.house
                                ? `${p.resident.house.street} ${p.resident.house.number}`
                                : "Sin domicilio"} · {p.fee?.name ?? "Cuota"}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <div className="font-bold text-slate-800 tabular-nums">{formatCurrency(Number(p.amount ?? 0))}</div>
                            <div className="flex items-center justify-end gap-1 text-[10px] font-medium" style={{ color: primaryShades[600] }}>
                              <FaCheckCircle size={9} />
                              Pagado
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Incidencias recientes */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Incidencias</h2>
                    <p className="text-[11px] text-slate-500">Pendientes en curso</p>
                  </div>
                  <ITBadget color="danger" size="small" className="!text-[9px] !px-2 !py-0.5 !rounded-md font-bold uppercase tracking-wider">
                    {counts?.pendingIncidents ?? 0}
                  </ITBadget>
                </div>
                {loadingDashboard ? (
                  <div className="flex-1 flex items-center justify-center py-8">
                    <ITLoader size="sm" />
                  </div>
                ) : recentIncidents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
                    <FaCheckCircle className="text-emerald-400 mb-2" size={24} />
                    <div className="text-xs text-slate-500">Sin incidencias pendientes</div>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 flex-1">
                    {recentIncidents.map((inc) => {
                      const dangerShades = buildShades(colorHex(palette, "danger"));
                      return (
                        <li key={inc.id} className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer" onClick={() => navigate("/incidents")}>
                          <div className="flex items-start gap-2">
                            <div
                              className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0"
                              style={{ backgroundColor: dangerShades[500] }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-slate-800 line-clamp-1">{inc.title}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                <span>{inc.category?.name ?? "—"}</span>
                                {inc.guard?.name && (
                                  <>
                                    <span>·</span>
                                    <span>{inc.guard.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 shrink-0">{formatTimeAgo(inc.createdAt)}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="px-4 py-2 border-t border-slate-100">
                  <button
                    onClick={() => navigate("/incidents")}
                    className="w-full text-[10px] font-bold uppercase tracking-wider hover:underline"
                    style={{ color: primaryShades[600] }}
                  >
                    Ver módulo completo →
                  </button>
                </div>
              </div>
            </section>

            {/* MODULE GRID */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: primaryShades[500] }}
                  />
                  <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Módulos</h2>
                </div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full">
                  {homeCardItem.length} disponibles
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {homeCardItem.map((item, index) => (
                  <HomeCardItem key={index} item={item} index={index} />
                ))}
              </div>
            </section>
          </>
        )}

        {canViewMetrics && activeTab === "analytics" && <AnalyticsTab />}
        {canViewMetrics && activeTab === "detail" && <OperationalDetailTab />}
      </div>
    </div>
  );
};

export default HomePage;

import { AppState } from "@app/core/store/store";
import { useEffect, useMemo, useState } from "react";
import {
  FaBook,
  FaBuilding,
  FaChartBar,
  FaChild,
  FaClock,
  FaCogs,
  FaExclamationTriangle,
  FaListAlt,
  FaRoute,
  FaShieldAlt,
  FaTable,
  FaThLarge,
  FaUserShield,
  FaUsers,
  FaWrench,
  FaKey,
  FaMoneyBill,
  FaCalendarAlt,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { HomeCardItem } from "../components/HomeCardItem";
import { AnalyticsTab } from "../components/tabs/AnalyticsTab";
import { OperationalDetailTab } from "../components/tabs/OperationalDetailTab";
import { ITBadget } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  LIDER: "Supervisor",
  SHIFT: "Jefe de Guardias",
  RESDN: "Residente",
};

const ROLE_BADGE_COLORS: Record<string, any> = {
  ADMIN: "primary",
  LIDER: "info",
  SHIFT: "warning",
  RESDN: "secondary",
};

const HomePage = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);
  const [homeCardItem, setHomeCardItem] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"nav" | "analytics" | "detail">("nav");

  const canViewMetrics = user.role === "ADMIN" || user.role === "LIDER" || user.role === "SHIFT";
  const currentDate = dayjs().format("dddd, D [de] MMMM [del] YYYY").toUpperCase();
  const userName = user.name || "Usuario";
  const userRole = user.role || "";
  const roleLabel = ROLE_LABELS[userRole] || userRole;

  useEffect(() => {
    if (!user || !user.token) {
      navigate("/login");
      return;
    }

    const allCards = [
      {
        title: "Ubicaciones",
        description: "Espacios de estacionamiento y locales",
        icon: <FaListAlt />,
        action: () => navigate("/locations"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
      },
      {
        title: "Residentes",
        description: "Gestión de propietarios y viviendas",
        icon: <FaUsers />,
        action: () => navigate("/residents"),
        roles: ["ADMIN", "LIDER"],
      },
      {
        title: "Propiedades",
        description: "Control de casas and estado de habitabilidad",
        icon: <FaBuilding />,
        action: () => navigate("/properties"),
        roles: ["ADMIN", "LIDER"],
      },
      {
        title: "Control de Accesos",
        description: "Registro de pases generados y visitas",
        icon: <FaKey />,
        action: () => navigate("/accesses"),
        roles: ["ADMIN", "LIDER", "SHIFT", "RESDN"],
      },
      {
        title: "Recorridos",
        description: "Supervisión de rondas en tiempo real",
        icon: <FaClock />,
        action: () => navigate("/rounds"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
      },
      {
        title: "Configuración de rondas",
        description: "Configuración de rutas de vigilancia",
        icon: <FaRoute />,
        action: () => navigate("/routes"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
      },
      {
        title: "Incidencias",
        description: "Reportes de novedades y emergencias",
        icon: <FaExclamationTriangle />,
        action: () => navigate("/incidents"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
      },
      {
        title: "Mantenimiento",
        description: "Gestión de reportes técnicos",
        icon: <FaWrench />,
        action: () => navigate("/maintenances"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
      },
      {
        title: "Kardex",
        description: "Historial de movimientos y bitácora",
        icon: <FaBook />,
        action: () => navigate("/kardex"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
      },
      {
        title: "Guardias",
        description: "Gestión de personal operativo",
        icon: <FaUserShield />,
        action: () => navigate("/guards"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
      },
      {
        title: "Horarios",
        description: "Configuración de turnos y roles",
        icon: <FaListAlt />,
        action: () => navigate("/schedules"),
        roles: ["ADMIN", "LIDER", "SHIFT"],
      },
      {
        title: "Usuarios",
        description: "Administrar usuarios del sistema",
        icon: <FaChild />,
        action: () => navigate("/users"),
        roles: ["ADMIN", "LIDER"],
      },
      {
        title: "Catálogos",
        description: "Ajustes de incidentes y tipos",
        icon: <FaCogs />,
        action: () => navigate("/settings"),
        roles: ["ADMIN", "LIDER"],
      },
      {
        title: "Buzón de Quejas",
        description: "Reportes y sugerencias para la administración",
        icon: <FaExclamationTriangle />,
        action: () => navigate("/complaints"),
        roles: ["ADMIN", "LIDER", "RESDN"],
      },
      {
        title: user.role === "RESDN" ? "Estado de Cuenta" : "Control de Pagos",
        description: user.role === "RESDN" ? "Consulta tus saldos y realiza pagos en línea" : "Gestión de cobros, cuotas y pagos de residentes",
        icon: <FaMoneyBill />,
        action: () => navigate("/payments"),
        roles: ["ADMIN", "LIDER", "RESDN"],
      },
      {
        title: "Mis Contactos",
        description: "Administra tu red de contactos y visitas frecuentes",
        icon: <FaUsers />,
        action: () => navigate("/contacts"),
        roles: ["RESDN"],
      },
    ];

    const filteredCards = allCards.filter((card) =>
      card.roles.includes(user.role || ""),
    );

    setHomeCardItem(filteredCards);
  }, [user, navigate]);

  const tabs = useMemo(() => {
    const items = [
      { key: "nav" as const, label: "Navegación", icon: <FaThLarge /> },
    ];
    if (canViewMetrics) {
      items.push(
        { key: "analytics" as const, label: "Security Analytics", icon: <FaChartBar /> },
        { key: "detail" as const, label: "Detalle Operativo", icon: <FaTable /> },
      );
    }
    return items;
  }, [canViewMetrics]);

  return (
    <div className="min-h-screen font-sans bg-slate-50/50">
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 60 L 60 0' stroke='white' stroke-width='0.5' fill='none' /%3E%3C/svg%3E\")", backgroundSize: "60px 60px" }} />
        <div className="relative px-6 pt-10 pb-16">
          <div className="max-w-6xl mx-auto flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shadow-lg border border-white/10">
                    <FaShieldAlt size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                      Hola, {userName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <ITBadget
                        color={ROLE_BADGE_COLORS[userRole] || "secondary"}
                        size="small"
                        className="!text-[9px] !px-2.5 !py-0.5 !rounded-lg font-black uppercase tracking-widest"
                      >
                        {roleLabel}
                      </ITBadget>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-emerald-200/70 text-[11px] font-bold uppercase tracking-widest">
                  <FaCalendarAlt size={11} />
                  {currentDate}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 md:gap-2.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-white text-emerald-900 shadow-lg shadow-emerald-950/20"
                      : "text-emerald-100/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="text-sm md:text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="relative -mt-8 px-6 pb-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {activeTab === "nav" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {homeCardItem.map((item, index) => (
                <HomeCardItem key={index} item={item} index={index} />
              ))}
            </div>
          )}

          {canViewMetrics && activeTab === "analytics" && <AnalyticsTab />}

          {canViewMetrics && activeTab === "detail" && <OperationalDetailTab />}
        </div>
      </div>
    </div>
  );
};

export default HomePage;

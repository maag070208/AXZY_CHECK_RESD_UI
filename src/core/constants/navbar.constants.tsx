import { AppState } from "@app/core/store/store";
import LOGO from "@assets/logo.png";
import {
  FaBuilding,
  FaCogs,
  FaExclamationTriangle,
  FaHome,
  FaMoneyBill,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

export const useNavigationItems = (): any[] => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: AppState) => state.auth);

  const isRouteActive = (path: string, subroutes?: string[]) => {
    if (subroutes?.length) {
      return subroutes.some((subroute) =>
        location.pathname.startsWith(subroute),
      );
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const baseItems: any[] = [
    {
      id: "home",
      label: "Inicio",
      action: () => navigate("/home"),
      isActive: isRouteActive("/home"),
      icon: <FaHome />,
    },
    {
      id: "residencial",
      label: "Residencial",
      icon: <FaBuilding />,
      isActive: isRouteActive("/residents") || isRouteActive("/properties") || isRouteActive("/locations"),
      subitems: [
        {
          id: "residents",
          label: "Residentes",
          action: () => navigate("/residents"),
          isActive: isRouteActive("/residents"),
        },
        {
          id: "properties",
          label: "Propiedades",
          action: () => navigate("/properties"),
          isActive: isRouteActive("/properties"),
        },
        {
          id: "locations",
          label: "Ubicaciones",
          action: () => navigate("/locations"),
          isActive: isRouteActive("/locations"),
        },
      ]
    },
    {
      id: "operacion",
      label: "Operación",
      icon: <FaExclamationTriangle />,
      isActive: isRouteActive("/accesses") || isRouteActive("/incidents") || isRouteActive("/maintenances") || isRouteActive("/kardex") || isRouteActive("/complaints"),
      subitems: [
        {
          id: "accesses",
          label: "Control de Accesos",
          action: () => navigate("/accesses"),
          isActive: isRouteActive("/accesses"),
        },
        {
          id: "incidents",
          label: "Incidencias",
          action: () => navigate("/incidents"),
          isActive: isRouteActive("/incidents"),
        },
        {
          id: "maintenances",
          label: "Mantenimientos",
          action: () => navigate("/maintenances"),
          isActive: isRouteActive("/maintenances"),
        },
        {
          id: "kardex",
          label: "Kardex",
          action: () => navigate("/kardex"),
          isActive: isRouteActive("/kardex"),
        },
        {
          id: "complaints",
          label: "Buzón de Quejas",
          action: () => navigate("/complaints"),
          isActive: isRouteActive("/complaints"),
        },
      ]
    },
    {
      id: "vigilancia",
      label: "Vigilancia",
      icon: <FaShieldAlt />,
      isActive: isRouteActive("/routes") || isRouteActive("/rounds") || isRouteActive("/guards") || isRouteActive("/schedules"),
      subitems: [
        {
          id: "rounds",
          label: "Historial de Rondas",
          action: () => navigate("/rounds"),
          isActive: isRouteActive("/rounds"),
        },
        {
          id: "routes",
          label: "Configuración de Rutas",
          action: () => navigate("/routes"),
          isActive: isRouteActive("/routes"),
        },
        {
          id: "guards",
          label: "Guardias",
          action: () => navigate("/guards"),
          isActive: isRouteActive("/guards"),
        },
        {
          id: "schedules",
          label: "Horarios",
          action: () => navigate("/schedules"),
          isActive: isRouteActive("/schedules"),
        },
      ]
    },
    {
      id: "finanzas",
      label: "Finanzas",
      icon: <FaMoneyBill />,
      isActive: isRouteActive("/payments") || isRouteActive("/fees"),
      subitems: [
        {
          id: "payments",
          label: "Control de Pagos",
          action: () => navigate("/payments"),
          isActive: isRouteActive("/payments"),
        },
        {
          id: "fees",
          label: "Cuotas y Planes",
          action: () => navigate("/fees"),
          isActive: isRouteActive("/fees"),
        },
      ]
    },
  ];

  if (user?.role === "RESDN") {
    return [
      {
        id: "home",
        label: "Inicio",
        action: () => navigate("/home"),
        isActive: isRouteActive("/home"),
        icon: <FaHome />,
      },
      {
        id: "accesses",
        label: "Control de Accesos",
        action: () => navigate("/accesses"),
        isActive: isRouteActive("/accesses"),
        icon: <FaShieldAlt />,
      },
      {
        id: "complaints",
        label: "Buzón de Quejas",
        action: () => navigate("/complaints"),
        isActive: isRouteActive("/complaints"),
        icon: <FaExclamationTriangle />,
      },
      {
        id: "contacts",
        label: "Mis Contactos",
        action: () => navigate("/contacts"),
        isActive: isRouteActive("/contacts"),
        icon: <FaUsers />,
      },
      {
        id: "finanzas",
        label: "Estado de Cuenta",
        action: () => navigate("/payments"),
        isActive: isRouteActive("/payments"),
        icon: <FaMoneyBill />,
      },
    ];
  }

  if (user?.role === "ADMIN" || user?.role === "LIDER") {
    baseItems.push({
      id: "sistema",
      label: "Sistema",
      icon: <FaCogs />,
      isActive: isRouteActive("/users") || isRouteActive("/settings") || isRouteActive("/reports"),
      subitems: [
        {
          id: "reports",
          label: "Reportes",
          action: () => navigate("/reports"),
          isActive: isRouteActive("/reports"),
        },
        {
          id: "users",
          label: "Usuarios",
          action: () => navigate("/users"),
          isActive: isRouteActive("/users"),
        },
        {
          id: "settings",
          label: "Catálogos",
          action: () => navigate("/settings"),
          isActive: isRouteActive("/settings"),
        },
      ]
    });
  }

  return baseItems;
};

// ------------- NAVBAR (legacy) -----------------
export const Navbar = () => {
  const navigationItems = useNavigationItems();

  return (
    <div className="flex flex-row space-x-4">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          onClick={item.action}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            item.isActive
              ? "bg-blue-100 text-blue-700"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export const NAVBAR_LOGO = () => (
  <img src={LOGO} className="h-[80px] hidden md:flex" />
);

export const SIDEBAR_LOGO = () => (
  <img src={LOGO} className="mt-5 h-[40px] flex md:hidden" />
);

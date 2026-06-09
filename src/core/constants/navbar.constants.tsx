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
  FaWrench,
  FaRoute,
} from "react-icons/fa";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const ALL = ["ADMIN", "LIDER", "SHIFT", "GUARD", "MAINT", "RESDN"];
const ADMIN = ["ADMIN", "LIDER"];
const ADMIN_SHIFT = ["ADMIN", "LIDER", "SHIFT"];
const ADMIN_SHIFT_RESDN = ["ADMIN", "LIDER", "SHIFT", "RESDN"];
const RESDN = ["RESDN"];

export const useNavigationItems = (): any[] => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: AppState) => state.auth);
  const role = user?.role || "";

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

  const allItems: any[] = [
    {
      id: "home",
      label: "Inicio",
      action: () => navigate("/home"),
      isActive: isRouteActive("/home"),
      icon: <FaHome />,
      roles: ALL,
    },
    {
      id: "residencial",
      label: "Residencial",
      icon: <FaBuilding />,
      roles: ADMIN_SHIFT,
      isActive: isRouteActive("/residents") || isRouteActive("/properties") || isRouteActive("/locations"),
      subitems: [
        {
          id: "residents",
          label: "Residentes",
          action: () => navigate("/residents"),
          isActive: isRouteActive("/residents"),
          roles: ADMIN,
        },
        {
          id: "properties",
          label: "Propiedades",
          action: () => navigate("/properties"),
          isActive: isRouteActive("/properties"),
          roles: ADMIN,
        },
        {
          id: "locations",
          label: "Ubicaciones",
          action: () => navigate("/locations"),
          isActive: isRouteActive("/locations"),
          roles: ADMIN_SHIFT,
        },
      ],
    },
    {
      id: "operacion",
      label: "Operación",
      icon: <FaExclamationTriangle />,
      roles: ADMIN_SHIFT,
      isActive: isRouteActive("/accesses") || isRouteActive("/incidents") || isRouteActive("/maintenances") || isRouteActive("/kardex") || isRouteActive("/complaints"),
      subitems: [
        {
          id: "accesses",
          label: "Control de Accesos",
          action: () => navigate("/accesses"),
          isActive: isRouteActive("/accesses"),
          roles: ADMIN_SHIFT_RESDN,
        },
        {
          id: "incidents",
          label: "Incidencias",
          action: () => navigate("/incidents"),
          isActive: isRouteActive("/incidents"),
          roles: ADMIN_SHIFT,
        },
        {
          id: "maintenances",
          label: "Mantenimientos",
          action: () => navigate("/maintenances"),
          isActive: isRouteActive("/maintenances"),
          roles: ADMIN_SHIFT,
        },
        {
          id: "kardex",
          label: "Kardex",
          action: () => navigate("/kardex"),
          isActive: isRouteActive("/kardex"),
          roles: ADMIN_SHIFT,
        },
        {
          id: "complaints",
          label: "Buzón de Quejas",
          action: () => navigate("/complaints"),
          isActive: isRouteActive("/complaints"),
          roles: [...ADMIN, ...RESDN],
        },
      ],
    },
    {
      id: "vigilancia",
      label: "Vigilancia",
      icon: <FaShieldAlt />,
      roles: ADMIN_SHIFT,
      isActive: isRouteActive("/routes") || isRouteActive("/rounds") || isRouteActive("/guards") || isRouteActive("/schedules"),
      subitems: [
        {
          id: "rounds",
          label: "Historial de Rondas",
          action: () => navigate("/rounds"),
          isActive: isRouteActive("/rounds"),
          roles: ADMIN_SHIFT,
        },
        {
          id: "routes",
          label: "Configuración de Rutas",
          action: () => navigate("/routes"),
          isActive: isRouteActive("/routes"),
          roles: ADMIN_SHIFT,
        },
        {
          id: "guards",
          label: "Guardias",
          action: () => navigate("/guards"),
          isActive: isRouteActive("/guards"),
          roles: ADMIN_SHIFT_RESDN,
        },
        {
          id: "schedules",
          label: "Horarios",
          action: () => navigate("/schedules"),
          isActive: isRouteActive("/schedules"),
          roles: ADMIN,
        },
      ],
    },
    {
      id: "finanzas",
      label: "Finanzas",
      icon: <FaMoneyBill />,
      roles: ADMIN_SHIFT,
      isActive: isRouteActive("/payments") || isRouteActive("/fees"),
      subitems: [
        {
          id: "payments",
          label: "Control de Pagos",
          action: () => navigate("/payments"),
          isActive: isRouteActive("/payments"),
          roles: ADMIN_SHIFT_RESDN,
        },
        {
          id: "fees",
          label: "Cuotas y Planes",
          action: () => navigate("/fees"),
          isActive: isRouteActive("/fees"),
          roles: ADMIN,
        },
      ],
    },
  ];

  const sistemaItem = {
    id: "sistema",
    label: "Sistema",
    icon: <FaCogs />,
    roles: ADMIN,
    isActive: isRouteActive("/users") || isRouteActive("/settings") || isRouteActive("/reports"),
    subitems: [
      {
        id: "reports",
        label: "Reportes",
        action: () => navigate("/reports"),
        isActive: isRouteActive("/reports"),
        roles: ADMIN,
      },
      {
        id: "users",
        label: "Usuarios",
        action: () => navigate("/users"),
        isActive: isRouteActive("/users"),
        roles: ADMIN,
      },
      {
        id: "settings",
        label: "Catálogos",
        action: () => navigate("/settings"),
        isActive: isRouteActive("/settings"),
        roles: ADMIN,
      },
    ],
  };

  // RESDN gets their own simplified menu
  if (role === "RESDN") {
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

  // GUARD and MAINT get minimal sidebar
  if (role === "GUARD" || role === "MAINT") {
    const items = [
      {
        id: "home",
        label: "Inicio",
        action: () => navigate("/home"),
        isActive: isRouteActive("/home"),
        icon: <FaHome />,
      },
    ];
    if (role === "MAINT") {
      items.push({
        id: "maintenances",
        label: "Mantenimientos",
        action: () => navigate("/maintenances"),
        isActive: isRouteActive("/maintenances"),
        icon: <FaWrench />,
      });
    }
    if (role === "GUARD") {
      items.push({
        id: "rounds",
        label: "Historial de Rondas",
        action: () => navigate("/rounds"),
        isActive: isRouteActive("/rounds"),
        icon: <FaRoute />,
      });
    }
    return items;
  }

  // Filter items by role for ADMIN, LIDER, SHIFT
  const filterByRole = (items: any[], userRole: string): any[] => {
    return items
      .filter((item) => !item.roles || item.roles.includes(userRole))
      .map((item) => {
        if (item.subitems) {
          const filteredSubitems = item.subitems.filter(
            (sub: any) => !sub.roles || sub.roles.includes(userRole),
          );
          if (filteredSubitems.length === 0) return null;
          return { ...item, subitems: filteredSubitems };
        }
        return item;
      })
      .filter(Boolean);
  };

  const filtered = filterByRole(allItems, role);
  if (role === "ADMIN" || role === "LIDER") {
    filtered.push(sistemaItem);
  }
  return filtered;
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

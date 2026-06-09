import { ITLayout } from "@axzydev/axzy_ui_system";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { NAVBAR_LOGO, useNavigationItems } from "../constants/navbar.constants";
import { isAuthenticated } from "../store/auth/auth.slice";
import { AppState } from "../store/store";
import { useState } from "react";
import { ProfileModal } from "../components/ProfileModal";

const ROLE_SHORT: Record<string, string> = {
  ADMIN: "Admin",
  LIDER: "Lider",
  SHIFT: "Jefe Turno",
  GUARD: "Guardia",
  MAINT: "Mantenimiento",
  RESDN: "Residente",
};

export const PrivateRoutes = () => {
  const isAuth = useSelector(isAuthenticated);
  const user = useSelector((state: AppState) => state.auth);
  const navigate = useNavigate();
  const navigationItems = useNavigationItems();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const roleLabel = ROLE_SHORT[user.role || ""] || "";
  const userDisplay = [user.name, roleLabel].filter(Boolean).join(" · ");

  return isAuth ? (
    <>
      <ITLayout
        topBar={{
          logo: <NAVBAR_LOGO />,
          userMenu: {
            userName: userDisplay || "Usuario",
            userEmail: user.email || "",
            menuItems: [
              {
                label: "Perfil",
                onClick: () => setIsProfileOpen(true),
              },
              {
                label: "Cerrar Sesion",
                onClick: () => {
                  navigate("/login");
                },
              },
            ],
          },
        }}
        sidebar={{
          navigationItems: navigationItems,
          subitemConnector: "lines",
        }}
      >
        <Outlet />
      </ITLayout>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  ) : (
    <Navigate to="/login" />
  );
};

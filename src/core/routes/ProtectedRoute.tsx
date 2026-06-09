import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { AppState } from "../store/store";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const role = useSelector((state: AppState) => state.auth.role);

  if (!role || !allowedRoles.some((r) => r.toUpperCase() === role.toUpperCase())) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

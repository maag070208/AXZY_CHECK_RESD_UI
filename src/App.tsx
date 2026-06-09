import LoginPage from "@app/modules/auth/pages/LoginPage";
import RegisterPage from "@app/modules/auth/pages/RegisterPage";
import { ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { PrivateRoutes } from "./core/routes/PrivateRoutes";
import { ProtectedRoute } from "./core/routes/ProtectedRoute";
import { setAuth } from "./core/store/auth/auth.slice";
import { ROLES_ADMIN, ROLES_ADMIN_SHIFT, ROLES_ADMIN_SHIFT_RESDN } from "./core/constants/roles.constants";
import HomePage from "./modules/home/pages/HomePage";

import LocationsPage from "./modules/locations/pages/LocationsPage";
import ResidentsPage from "./modules/residents/pages/ResidentsPage";
import ResidentDetailPage from "./modules/residents/pages/ResidentDetailPage";
import ContactsPage from "./modules/residents/pages/ContactsPage";
import PropertiesPage from "./modules/properties/pages/PropertiesPage";
import AccessesPage from "./modules/accesses/pages/AccessesPage";

import UsersPage from "./modules/users/pages/UsersPage";
import PaymentsPage from "./modules/payments/pages/PaymentsPage";
import PaymentReceiptPage from "./modules/payments/pages/PaymentReceiptPage";
import FeesPage from "./modules/payments/pages/FeesPage";
import IncidentsPage from "./modules/incidents/pages/IncidentsPage";
import ComplaintsPage from "./modules/complaints/pages/ComplaintsPage";
import MaintenancesPage from "./modules/maintenances/pages/MaintenancesPage";
import KardexPage from "./modules/kardex/pages/KardexPage";
import RoundsPage from "./modules/rounds/pages/RoundsPage";
import RoundDetailPage from "./modules/rounds/pages/RoundDetailPage";
import SchedulesPage from "./modules/schedules/pages/SchedulesPage";
import GuardsPage from "./modules/guards/pages/GuardsPage";
import RoutesPage from "./modules/routes/pages/RoutesPage";
import CreateRoutePage from "./modules/routes/pages/CreateRoutePage";
import SettingsPage from "@app/modules/settings/pages/SettingsPage";
import ReportsPage from "./modules/reports/pages/ReportsPage";


function App() {
  const token = useSelector((state: { auth: { token: string | null } }) => state.auth.token);
  const loading = useSelector((state: { loader: { loading: boolean } }) => state.loader.loading);
  const dispatch = useDispatch();

  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && storedToken !== "null" && storedToken !== "undefined") {
      dispatch(setAuth(storedToken));
    }
    setIsAppReady(true);
  }, [dispatch]);

  if (!isAppReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <ITLoader size="lg" />
      </div>
    );
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<PrivateRoutes />}>
          <Route path="/home" element={<HomePage />} />

          <Route path="/guards" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT_RESDN]}><GuardsPage /></ProtectedRoute>} />
          <Route path="/locations" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><LocationsPage /></ProtectedRoute>} />
          <Route path="/residents" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN]}><ResidentsPage /></ProtectedRoute>} />
          <Route path="/residents/:id" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN]}><ResidentDetailPage /></ProtectedRoute>} />
          <Route path="/properties" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN]}><PropertiesPage /></ProtectedRoute>} />
          <Route path="/accesses" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT_RESDN]}><AccessesPage /></ProtectedRoute>} />
          <Route path="/routes" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><RoutesPage /></ProtectedRoute>} />
          <Route path="/routes/new" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><CreateRoutePage /></ProtectedRoute>} />
          <Route path="/routes/edit/:id" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><CreateRoutePage /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT_RESDN]}><PaymentsPage /></ProtectedRoute>} />
          <Route path="/payments/receipt/:id" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT_RESDN]}><PaymentReceiptPage /></ProtectedRoute>} />
          <Route path="/fees" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN]}><FeesPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN]}><UsersPage /></ProtectedRoute>} />
          <Route path="/incidents" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><IncidentsPage /></ProtectedRoute>} />
          <Route path="/complaints" element={<ProtectedRoute allowedRoles={['RESDN', ...ROLES_ADMIN]}><ComplaintsPage /></ProtectedRoute>} />
          <Route path="/contacts" element={<ProtectedRoute allowedRoles={['RESDN']}><ContactsPage /></ProtectedRoute>} />
          <Route path="/maintenances" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><MaintenancesPage /></ProtectedRoute>} />
          <Route path="/kardex" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><KardexPage /></ProtectedRoute>} />
          <Route path="/schedules" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN]}><SchedulesPage /></ProtectedRoute>} />
          <Route path="/rounds" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><RoundsPage /></ProtectedRoute>} />
          <Route path="/rounds/:id" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN_SHIFT]}><RoundDetailPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN]}><SettingsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={[...ROLES_ADMIN]}><ReportsPage /></ProtectedRoute>} />

        </Route>
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>

      {loading && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
            <ITLoader size="lg" />
            <span className="text-xs font-semibold text-slate-500">
              Procesando...
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default App;

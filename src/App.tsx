import LoginPage from "@app/modules/auth/pages/LoginPage";
import RegisterPage from "@app/modules/auth/pages/RegisterPage";
import { ITLoader } from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { PrivateRoutes } from "./core/routes/PrivateRoutes";
import { setAuth } from "./core/store/auth/auth.slice";
import HomePage from "./modules/home/pages/HomePage";

import LocationsPage from "./modules/locations/pages/LocationsPage";
import ResidentsPage from "./modules/residents/pages/ResidentsPage";
import ResidentDetailPage from "./modules/residents/pages/ResidentDetailPage";
import ContactsPage from "./modules/residents/pages/ContactsPage";
import PropertiesPage from "./modules/properties/pages/PropertiesPage";
import AccessesPage from "./modules/accesses/pages/AccessesPage";

import UsersPage from "./modules/users/pages/UsersPage";
import PaymentsPage from "./modules/payments/pages/PaymentsPage";
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
  const token = useSelector((state: any) => state.auth.token);
  const dispatch = useDispatch();

  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeunload", () => {});
    window.addEventListener("unload", handleTabClosing);
    return () => {
      window.removeEventListener("beforeunload", () => {});
      window.removeEventListener("unload", handleTabClosing);
    };
  });

  const handleTabClosing = () => {
    localStorage.setItem("token", token);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && storedToken !== "null") {
      dispatch(setAuth(storedToken));
    }
    setIsAppReady(true);
  }, [dispatch]);

  const loading = useSelector((state: any) => state.loader.loading);

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
          <Route path="/guards" element={<GuardsPage />} />
          
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/residents" element={<ResidentsPage />} />
          <Route path="/residents/:id" element={<ResidentDetailPage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/accesses" element={<AccessesPage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/routes/new" element={<CreateRoutePage />} />
          <Route path="/routes/edit/:id" element={<CreateRoutePage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/fees" element={<FeesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/maintenances" element={<MaintenancesPage />} />
          <Route path="/kardex" element={<KardexPage />} />
          <Route path="/schedules" element={<SchedulesPage />} />
          
          <Route path="/rounds" element={<RoundsPage />} />
          <Route path="/rounds/:id" element={<RoundDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />

        </Route>
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>

      {/* GLOBAL MODAL ACTION LOADER */}
      {loading && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px] transition-all">
          <div className="bg-white p-10 rounded-[32px] shadow-2xl border border-slate-100 flex flex-col items-center gap-6">
            <ITLoader size="lg" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">
                Procesando
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Por favor espere...
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;

import { AppState } from "@app/core/store/store";
import { useEffect, useState } from "react";
import { FaKey, FaExclamationTriangle, FaMoneyBill, FaUsers, FaHome, FaShieldAlt } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ITLoader, useITTheme } from "@axzydev/axzy_ui_system";
import { HomeCardItem } from "./HomeCardItem";
import { buildShades, colorHex } from "../utils/theme.utils";
import dayjs from "dayjs";

const ResidentHomePanel = () => {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.auth);
  const { palette } = useITTheme();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const primaryHex = colorHex(palette, "primary");
  const primaryShades = buildShades(primaryHex);

  useEffect(() => {
    const allCards = [
      { title: "Accesos", description: "Pases y visitas", icon: <FaKey />, action: () => navigate("/accesses"), accent: "warning" as const },
      { title: "Buzón", description: "Reportes y sugerencias", icon: <FaExclamationTriangle />, action: () => navigate("/complaints"), accent: "danger" as const },
      { title: "Mi cuenta", description: "Saldos y pagos en línea", icon: <FaMoneyBill />, action: () => navigate("/payments"), accent: "success" as const },
      { title: "Contactos", description: "Red de visitas", icon: <FaUsers />, action: () => navigate("/contacts"), accent: "primary" as const },
    ];
    setCards(allCards);
    setLoading(false);
  }, [navigate]);

  return (
    <div className="min-h-screen font-sans bg-slate-100">
      <div
        className="relative overflow-hidden shadow-sm"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primaryShades[800]} 0%, ${primaryShades[700]} 50%, ${primaryShades[900]} 100%)`,
          color: "#ffffff",
        }}
      >
        <div className="relative px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/10">
                <FaHome size={18} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  Bienvenido, {user.name || "Residente"}
                </h1>
                <p className="text-white/60 text-xs font-medium">
                  {dayjs().format("DD MMM YYYY")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <ITLoader size="md" />
          </div>
        ) : (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryShades[500] }} />
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Módulos</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {cards.map((item, index) => (
                <HomeCardItem key={index} item={item} index={index} />
              ))}
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <FaShieldAlt className="text-slate-400" size={20} />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Residencial AXZY CHECK</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Desde aquí puedes gestionar tus accesos, revisar tu estado de cuenta, enviar quejas y administrar tus contactos.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ResidentHomePanel;

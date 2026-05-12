import { setAuth } from "@app/core/store/auth/auth.slice";
import { AppDispatch } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { TResult } from "@app/core/types/TResult";
import Logo from "@assets/logo.png";
import { ITCard } from "@axzydev/axzy_ui_system";
import { IAuthLogin } from "@core/types/auth.types";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import LoginFormComponent from "../components/LoginForm";
import { login } from "../services/AuthService";

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: IAuthLogin) => {
    setLoading(true);
    try {
      const response = await login(values);

      if (!response.success) {
        dispatch(
          showToast({
            message: response.messages?.[0] || "Error al iniciar sesión",
            type: "error",
            position: "top-right",
          }),
        );
        return;
      }

      dispatch(setAuth(response.data));
      navigate("/home");
    } catch (error) {
      const result = error as TResult<void>;
      dispatch(
        showToast({
          message: result?.messages?.[0] || "Error de conexión",
          type: "error",
          position: "top-right",
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden">
      {/* Background decoration - Subtle and professional */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-transparent to-transparent z-0" />
      <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-slate-100 via-transparent to-transparent z-0" />

      <div className="relative z-10 w-full max-w-[440px] px-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
            <img src={Logo} alt="Logo" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AXZY Check <span className="text-emerald-600">Web</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Control Administrativo y Operativo
          </p>
        </div>

        {/* Login Card - Ultra Clean */}
        <ITCard
          className="!bg-white !border-slate-100 !rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-500 delay-150"
          contentClassName="p-8 sm:p-10"
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-800">Bienvenido</h2>
              <p className="text-slate-400 text-sm">
                Ingresa tus datos para continuar
              </p>
            </div>

            <LoginFormComponent onSubmit={handleSubmit} loading={loading} />
          </div>
        </ITCard>

        {/* Support/Footer */}
        <div className="mt-10 text-center animate-in fade-in duration-1000 delay-500">
          <p className="text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} AXZY Digital Systems • v1.2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import Logo from "@assets/logo.png";
import { IAuthRegister } from "@core/types/auth.types";
import { ITCard } from "@axzydev/axzy_ui_system";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import { register } from "../services/AuthService";
import { showToast } from "@app/core/store/toast/toast.slice";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (values: IAuthRegister) => {
    try {
      const response = await register(values);

      if (response?.success) {
        dispatch(
          showToast({
            message: "Registro exitoso, por favor inicie sesión",
            type: "success",
            position: "top-right",
          }),
        );
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      dispatch(
        showToast({
          message: "Error al registrarse",
          type: "error",
          position: "top-right",
        }),
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-emerald-50/30 via-transparent to-transparent z-0" />

      <div className="relative z-10 w-full max-w-[480px] px-6">
        {/* Branding */}
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-5">
            <img src={Logo} alt="Logo" className="h-10 w-auto object-contain" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Crear Cuenta
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Únete a la plataforma AXZY Check Web
          </p>
        </div>

        {/* Register Card */}
        <ITCard
          className="!bg-white !border-slate-100 !rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] animate-in fade-in zoom-in-95 duration-500 delay-150"
          contentClassName="p-8 sm:p-10"
        >
          <div className="flex flex-col space-y-6">
            <RegisterForm onSubmit={handleSubmit} />

            <div className="text-center text-xs text-slate-400 font-medium">
              ¿Ya tienes cuenta?{" "}
              <span
                className="text-emerald-600 cursor-pointer font-bold hover:underline"
                onClick={() => navigate("/login")}
              >
                Inicia sesión
              </span>
            </div>
          </div>
        </ITCard>

        {/* Footer */}
        <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} AXZY Digital Systems
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

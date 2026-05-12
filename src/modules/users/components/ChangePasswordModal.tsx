import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton, ITLoader } from "@axzydev/axzy_ui_system";
import { resetPassword, User } from "../services/UserService";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { FaKey, FaShieldAlt } from "react-icons/fa";

interface Props {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({
  user,
  onCancel,
  onSuccess,
}) => {
  const [loading, setLoading] = React.useState(false);
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      newPassword: Yup.string()
        .min(6, "Mínimo 6 caracteres")
        .required("Requerido"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Las contraseñas no coinciden")
        .required("Requerido"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const res = await resetPassword(user.id, values.newPassword);
        if (res.success) {
          dispatch(
            showToast({
              message: "Contraseña actualizada con éxito",
              type: "success",
            }),
          );
          onSuccess();
        } else {
          dispatch(
            showToast({
              message: res.messages?.[0] || "Error al actualizar",
              type: "error",
            }),
          );
        }
      } catch (error) {
        dispatch(
          showToast({ message: "Error de conexión", type: "error" }),
        );
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
          <FaKey size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            Seguridad de Cuenta
          </h3>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            @{user.username} • {user.name}
          </p>
        </div>
      </div>

      <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 flex gap-4 items-start">
        <div className="mt-1 text-amber-500">
          <FaShieldAlt size={16} />
        </div>
        <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider leading-relaxed">
          Estás asignando una nueva clave de acceso. El usuario deberá utilizar esta credencial en su siguiente inicio de sesión.
        </p>
      </div>

      <div className="space-y-6">
        <ITInput
          label="Nueva Contraseña"
          name="newPassword"
          type="password"
          value={formik.values.newPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.newPassword}
          touched={formik.touched.newPassword}
          placeholder="••••••••"
          className="!h-12 !rounded-2xl !bg-slate-50/50"
        />
        <ITInput
          label="Confirmar Contraseña"
          name="confirmPassword"
          type="password"
          value={formik.values.confirmPassword}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.errors.confirmPassword}
          touched={formik.touched.confirmPassword}
          placeholder="••••••••"
          className="!h-12 !rounded-2xl !bg-slate-50/50"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-10">
        <ITButton
          variant="ghost"
          className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400"
          onClick={onCancel}
        >
          Cancelar
        </ITButton>
        <ITButton
          variant="filled"
          color="primary"
          className="px-10 !rounded-2xl shadow-xl shadow-emerald-200"
          onClick={formik.submitForm}
          disabled={loading}
        >
          {loading ? <ITLoader size="sm" /> : "ACTUALIZAR CONTRASEÑA"}
        </ITButton>
      </div>
    </div>
  );
};

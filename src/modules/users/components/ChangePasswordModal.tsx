import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React from "react";
import { FaKey } from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { resetPassword, UserResponse } from "../services/UserService";

interface Props {
  user: UserResponse;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({
  user,
  onCancel,
  onSuccess,
}) => {
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
      dispatch(showLoader());
      try {
        const res = await resetPassword(user.id, values.newPassword);
        if (res.success) {
          dispatch(
            showToast({
              message: "Contraseña actualizada con éxito",
              type: "success",
              duration: 3000,
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
        dispatch(showToast({ message: "Error de conexión", type: "error" }));
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  return (
    <div className="flex flex-col bg-white overflow-hidden max-h-[85vh]">
      <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
        <section>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
            <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Seguridad de Cuenta
            </ITText>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100">
                <FaKey size={20} />
              </div>
              <div className="flex flex-col">
                <ITText className="text-sm font-black text-slate-800 uppercase tracking-tight">
                  @{user.username}
                </ITText>
                <ITText className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {user.name} {user.lastName}
                </ITText>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              />
            </div>
          </div>
        </section>
      </div>

      <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
        <ITButton
          type="button"
          variant="filled"
          onClick={onCancel}
          color="secondary"
        >
          Cancelar
        </ITButton>

        <ITButton onClick={() => formik.submitForm()} color="primary">
          {<ITLoader size="sm" />} Actualizar Clave
        </ITButton>
      </div>
    </div>
  );
};

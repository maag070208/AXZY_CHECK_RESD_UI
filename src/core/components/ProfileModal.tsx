import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import { AppState } from "@app/core/store/store";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITLoader,
  ITText,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import { useMemo } from "react";
import { FaKey, FaShieldAlt, FaUser } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { put, post } from "@app/core/axios/axios";
import { TResult } from "@app/core/types/TResult";

const resolveCssColor = (val: string) => {
  if (typeof val !== "string") return val;
  const v = val.trim();
  if (v.startsWith("var(")) {
    const m = v.match(/var\(([^,)]+)/);
    if (m) {
      const cssVar = m[1].trim();
      if (typeof document !== "undefined") {
        return getComputedStyle(document.documentElement)
          .getPropertyValue(cssVar)
          .trim() || "#065911";
      }
    }
    return "#065911";
  }
  return v.startsWith("#") ? v : `#${v}`;
};

const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

const lighten = (hex: string, amount: number) => {
  const [r, g, b] = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, amount));
  const mix = (c: number, w: number) => Math.round(c * (1 - a) + w * a);
  return `#${[mix(r, 255), mix(g, 255), mix(b, 255)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
};

const buildShadesLocal = (hex: string) => {
  const base = resolveCssColor(hex);
  return {
    50: lighten(base, 0.85),
    100: lighten(base, 0.7),
    500: base,
    600: lighten(base, -0.12),
  };
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  LIDER: "Lider",
  SHIFT: "Jefe de Turno",
  GUARD: "Guardia",
  MAINT: "Mantenimiento",
  RESDN: "Residente",
};

export const ProfileModal = ({ isOpen, onClose }: Props) => {
  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);
  const { palette } = useITTheme();
  const primaryShades = useMemo(() => buildShadesLocal(palette.primary), [palette]);

  const roleLabel = ROLE_LABELS[user.role || ""] || user.role || "Sin rol";

  const profileForm = useFormik({
    initialValues: { name: user.name || "" },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required("Nombre requerido"),
    }),
    onSubmit: async (values) => {
      dispatch(showLoader());
      try {
        const res: TResult<unknown> = await put(`/users/${user.id}`, {
          name: values.name,
        });
        if (res.success) {
          dispatch(showToast({ message: "Perfil actualizado. Cambios reflejados al reiniciar sesion.", type: "success" }));
        } else {
          dispatch(showToast({ message: res.messages?.[0] || "Error al actualizar perfil", type: "error" }));
        }
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  const passwordForm = useFormik({
    initialValues: { newPassword: "", confirmPassword: "" },
    validationSchema: Yup.object({
      newPassword: Yup.string().min(6, "Minimo 6 caracteres").required("Requerida"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "No coinciden")
        .required("Requerida"),
    }),
    onSubmit: async (values, { resetForm }) => {
      dispatch(showLoader());
      try {
        const res: TResult<unknown> = await post("/users/change-password", {
          userId: user.id,
          newPassword: values.newPassword,
        });
        if (res.success) {
          dispatch(showToast({ message: "Contrasena actualizada", type: "success" }));
          resetForm();
        } else {
          dispatch(showToast({ message: res.messages?.[0] || "Error al cambiar contrasena", type: "error" }));
        }
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  const initials = (user.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title="Perfil" className="!max-w-md !w-full">
      <div className="flex flex-col">
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100"
            style={{ backgroundColor: primaryShades[50] }}>
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0"
              style={{ backgroundColor: primaryShades[500] }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <ITText className="font-black text-slate-800 text-sm uppercase tracking-tight truncate block">
                {user.name}
              </ITText>
              <ITText className="text-[10px] text-slate-400 font-bold mt-0.5 truncate block">
                {user.email}
              </ITText>
              <div className="flex items-center gap-2 mt-1.5">
                <FaShieldAlt size={10} style={{ color: primaryShades[500] }} />
                <span className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: primaryShades[600] }}>
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <FaUser size={12} className="text-slate-400" />
              <ITText className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Editar Perfil
              </ITText>
            </div>

            <form onSubmit={profileForm.handleSubmit} className="space-y-3">
              <ITInput
                name="name"
                label="Nombre Completo"
                placeholder="Tu nombre"
                value={profileForm.values.name}
                onChange={profileForm.handleChange}
                onBlur={profileForm.handleBlur}
                error={profileForm.errors.name ? String(profileForm.errors.name) : undefined}
                touched={!!profileForm.touched.name}
              />
              <div className="flex justify-end pt-1">
                <ITButton type="submit" color="primary" size="small" disabled={profileForm.isSubmitting}>
                  {profileForm.isSubmitting ? <ITLoader size="sm" /> : "Guardar Cambios"}
                </ITButton>
              </div>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <FaKey size={12} className="text-slate-400" />
              <ITText className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                Cambiar Contrasena
              </ITText>
            </div>

            <form onSubmit={passwordForm.handleSubmit} className="space-y-3">
              <ITInput
                name="newPassword"
                type="password"
                label="Nueva Contrasena"
                placeholder="Minimo 6 caracteres"
                value={passwordForm.values.newPassword}
                onChange={passwordForm.handleChange}
                onBlur={passwordForm.handleBlur}
                error={passwordForm.errors.newPassword ? String(passwordForm.errors.newPassword) : undefined}
                touched={!!passwordForm.touched.newPassword}
              />
              <ITInput
                name="confirmPassword"
                type="password"
                label="Confirmar Contrasena"
                placeholder="Repite la contrasena"
                value={passwordForm.values.confirmPassword}
                onChange={passwordForm.handleChange}
                onBlur={passwordForm.handleBlur}
                error={passwordForm.errors.confirmPassword ? String(passwordForm.errors.confirmPassword) : undefined}
                touched={!!passwordForm.touched.confirmPassword}
              />
              <div className="flex justify-end pt-1">
                <ITButton type="submit" color="primary" size="small" disabled={passwordForm.isSubmitting}>
                  {passwordForm.isSubmitting ? <ITLoader size="sm" /> : "Actualizar"}
                </ITButton>
              </div>
            </form>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex justify-end">
          <ITButton type="button" variant="filled" color="secondary" onClick={onClose} size="small">
            Cerrar
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};

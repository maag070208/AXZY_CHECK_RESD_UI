import { useCatalog } from "@app/core/hooks/catalog.hook";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITInput,
  ITSelect,
  ITSlideToggle,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import { FaShieldAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import { createUser, updateUser, UserResponse } from "../services/UserService";

interface Props {
  userToEdit?: UserResponse;
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateUserWizard: React.FC<Props> = ({
  userToEdit,
  onCancel,
  onSuccess,
}) => {
  const isEditing = !!userToEdit;
  const dispatch = useDispatch();
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const { data: roles, loading: loadingRoles } = useCatalog("role");
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  useEffect(() => {
    getSchedules().then((data) => {
      setSchedules(data);
      setLoadingSchedules(false);
    });
  }, []);

  const roleOptions = useMemo(
    () =>
      roles
          .filter((r) => r.name !== "RESDN")
          .map((r) => ({ label: r.value, value: String(r.id) })),
    [roles],
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: userToEdit?.name || "",
      lastName: userToEdit?.lastName || "",
      username: userToEdit?.username || "",
      password: "",
      confirmPassword: "",
      roleId: userToEdit?.roleId
              ? String(userToEdit.roleId)
              : userToEdit?.role?.id
                      ? String(userToEdit.role.id)
                      : "",
      scheduleId: userToEdit?.scheduleId
              ? String(userToEdit.scheduleId)
              : userToEdit?.schedule?.id
                      ? String(userToEdit.schedule.id)
                      : "",
      active: userToEdit ? userToEdit.active : true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Requerido"),
      lastName: Yup.string().required("Requerido"),
      username: Yup.string().required("Requerido"),
      password: isEditing
              ? Yup.string().min(6, "Mínimo 6")
              : Yup.string().min(6, "Mínimo 6").required("Requerido"),
      confirmPassword: Yup.string()
              .oneOf([Yup.ref("password")], "No coinciden")
              .when("password", {
                is: (val: string) => val && val.length > 0,
                then: (schema) => schema.required("Requerido"),
              }),
      roleId: Yup.string().required("Selecciona un rol"),
      scheduleId: Yup.string().when("roleId", {
        is: (roleId: string) => {
          const role = roles.find((r) => String(r.id) === String(roleId));
          return ["GUARD", "SHIFT", "MAINT"].includes(role?.name || "");
        },
        then: () => Yup.string().required("Horario obligatorio"),
      }),
    }),
    onSubmit: async (values) => {
      dispatch(showLoader());
      try {
        const { confirmPassword, ...data } = values;
        const payload = {
          ...data,
          password: data.password || undefined,
          scheduleId: data.scheduleId || undefined,
        };
        const res =
                isEditing && userToEdit
                        ? await updateUser(userToEdit.id, payload)
                        : await createUser(payload);

        if (res.success) {
          dispatch(
                  showToast({
                    message: `Usuario ${isEditing ? "editado" : "creado"} con éxito`,
                    type: "success",
                  }),
          );
          onSuccess();
        } else {
          dispatch(
                  showToast({ message: res.messages?.[0] || "Error", type: "error" }),
          );
        }
      } catch (error: any) {
        dispatch(
                showToast({
                  message: error?.messages?.[0] || "Error inesperado",
                  type: "error",
                }),
        );
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  const isOperationalRole = useMemo(() => {
    const selectedRole = roles.find(
            (r) => String(r.id) === String(formik.values.roleId),
    );
    return ["GUARD", "SHIFT", "MAINT"].includes(selectedRole?.name || "");
  }, [roles, formik.values.roleId]);

  return (
          <div className="flex flex-col w-full bg-white max-h-[85vh]">
            <form
                    onSubmit={formik.handleSubmit}
                    className="flex flex-col h-full overflow-hidden"
            >
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                {/* SECTION 1: IDENTITY */}
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                    <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      Detalles del Perfil
                    </ITText>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ITInput
                            label="Nombre(s)"
                            name="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.name}
                            touched={formik.touched.name}
                            placeholder="Ej. Juan"
                    />
                    <ITInput
                            label="Apellido(s)"
                            name="lastName"
                            value={formik.values.lastName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.lastName}
                            touched={formik.touched.lastName}
                            placeholder="Ej. Pérez"
                    />
                  </div>
                </section>

                {/* SECTION 2: ACCESS CREDENTIALS */}
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      Credenciales de Acceso
                    </ITText>
                  </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ITInput
                  label="Nombre de Usuario"
                  name="username"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.username}
                  touched={formik.touched.username}
                  placeholder="Ej. rgarcia"
                />
                <ITSelect
                  label="Rol de Usuario"
                  name="roleId"
                  value={formik.values.roleId}
                  onChange={formik.handleChange}
                  options={roleOptions}
                  error={formik.errors.roleId}
                  touched={formik.touched.roleId}
                  placeholder={
                    loadingRoles ? "Cargando roles..." : "Seleccionar rol..."
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ITInput
                  label={
                    isEditing ? "Cambiar Contraseña (Opcional)" : "Contraseña"
                  }
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.password}
                  touched={formik.touched.password}
                  placeholder="••••••"
                  iconLeft={<FaShieldAlt className="text-slate-300" />}
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
                  placeholder="••••••"
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: OPERATIONAL ASSIGNMENT */}
          {isOperationalRole && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                  Asignación Operativa
                </ITText>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ITSelect
                  label="Horario Laboral"
                  name="scheduleId"
                  value={formik.values.scheduleId}
                  onChange={formik.handleChange}
                  options={schedules.map((s) => ({
                    label: `${s.name}`,
                    value: String(s.id),
                  }))}
                  error={formik.errors.scheduleId}
                  touched={formik.touched.scheduleId}
                  placeholder={
                    loadingSchedules
                      ? "Cargando horarios..."
                      : "Seleccionar horario..."
                  }
                />
              </div>
            </section>
          )}

          {/* SECTION 4: STATUS (ONLY IF EDITING) */}
          {isEditing && (
            <section>
              <div className="mt-8 flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <ITText className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Estado del usuario
                  </ITText>
                  <ITText className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    Habilitar o restringir acceso al sistema
                  </ITText>
                </div>
                <ITSlideToggle
                  isOn={formik.values.active}
                  onToggle={(val) => formik.setFieldValue("active", val)}
                />
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            type="button"
            variant="filled"
            onClick={onCancel}
            color="secondary"
          >
            Cancelar
          </ITButton>

          <ITButton
            type="submit"
            disabled={formik.isSubmitting}
            color="primary"
          >
            {formik.isSubmitting
              ? "Procesando..."
              : isEditing
                ? "Actualizar Usuario"
                : "Registrar Usuario"}
          </ITButton>
        </div>
      </form>
    </div>
  );
};

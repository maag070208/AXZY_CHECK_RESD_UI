import { ITStepper } from "@app/core/components/ITStepper";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import {
  FaClipboardCheck,
  FaClock,
  FaIdCard,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import { createUser, updateUser, User } from "../services/UserService";

interface Props {
  userToEdit?: User;
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
  const [currentStep, setCurrentStep] = useState(0);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const { data: roles, loading: loadingRoles } = useCatalog("role");
  const { data: clients, loading: loadingClients } = useCatalog("client");
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
      clientId: userToEdit?.clientId
        ? String(userToEdit.clientId)
        : userToEdit?.client?.id
          ? String(userToEdit.client.id)
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
      clientId: Yup.string().when("roleId", {
        is: (roleId: string) => {
          const role = roles.find((r) => String(r.id) === String(roleId));
          return ["GUARD", "SHIFT", "MAINT"].includes(role?.name || "");
        },
        then: () => Yup.string().required("Cliente obligatorio"),
      }),
    }),
    onSubmit: async (values) => {
      try {
        const { confirmPassword, ...data } = values;
        const payload = {
          ...data,
          password: data.password || undefined,
          scheduleId: data.scheduleId || undefined,
          clientId: data.clientId || undefined,
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
      }
    },
  });

  const isOperationalRole = useMemo(() => {
    const selectedRole = roles.find(
      (r) => String(r.id) === String(formik.values.roleId),
    );
    return ["GUARD", "SHIFT", "MAINT"].includes(selectedRole?.name || "");
  }, [roles, formik.values.roleId]);

  const steps = [
    {
      label: "Identidad",
      icon: <FaUser />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ITInput
              label="Nombre(s)"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.name}
              touched={formik.touched.name}
              placeholder="Ej. Roberto"
              className="!bg-slate-50 !border-slate-100 !h-12 !rounded-2xl"
            />
            <ITInput
              label="Apellidos"
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.lastName}
              touched={formik.touched.lastName}
              placeholder="Ej. García"
              className="!bg-slate-50 !border-slate-100 !h-12 !rounded-2xl"
            />
          </div>

          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-emerald-500">
                <FaIdCard size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Acceso
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Identificador del Sistema
                </span>
              </div>
            </div>
            <ITInput
              label="Nombre de Usuario"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.username}
              touched={formik.touched.username}
              placeholder="Ej. rgarcia"
              className="!bg-white !border-slate-100 !h-12 !rounded-2xl"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
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
                className="!bg-white !border-slate-100 !h-12 !rounded-2xl"
              />
              <ITInput
                label="Confirmar"
                name="confirmPassword"
                type="password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.confirmPassword}
                touched={formik.touched.confirmPassword}
                placeholder="••••••"
                className="!bg-white !border-slate-100 !h-12 !rounded-2xl"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Acceso y Seguridad",
      icon: <FaShieldAlt />,
      content: (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-50 shadow-sm space-y-6">
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
              className="!bg-slate-50 !border-none !h-12 !rounded-2xl"
            />
          </div>

          {isOperationalRole && (
            <div className="bg-emerald-50/40 p-6 rounded-3xl border border-emerald-100 space-y-5">
              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                Asignación Operativa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  className="!bg-white !border-none !h-12 !rounded-2xl"
                />
                <ITSelect
                  label="Cliente"
                  name="clientId"
                  value={formik.values.clientId}
                  onChange={formik.handleChange}
                  options={clients.map((c) => ({
                    label: c.name,
                    value: String(c.id),
                  }))}
                  error={formik.errors.clientId}
                  touched={formik.touched.clientId}
                  placeholder={
                    loadingClients
                      ? "Cargando clientes..."
                      : "Seleccionar cliente..."
                  }
                  className="!bg-white !border-none !h-12 !rounded-2xl"
                />
              </div>
            </div>
          )}

          {isEditing && (
            <div className="pt-0">
              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formik.values.active}
                    onChange={formik.handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">
                    Usuario habilitado
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Permitir el acceso a la plataforma
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Confirmación",
      icon: <FaClipboardCheck />,
      content: (
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-xl font-black">
                {formik.values.name.charAt(0)}
                {formik.values.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {formik.values.name} {formik.values.lastName}
                </h3>
                <p className="text-emerald-400 text-xs font-medium">
                  @{formik.values.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-white/10 pt-6">
              <SummaryItem
                label="Rol Asignado"
                value={
                  roles.find((r) => String(r.id) === formik.values.roleId)
                    ?.value
                }
                icon={<FaShieldAlt className="text-emerald-400" />}
              />
              {isOperationalRole && (
                <>
                  <SummaryItem
                    label="Turno"
                    value={
                      schedules.find(
                        (s) => String(s.id) === formik.values.scheduleId,
                      )?.name
                    }
                    icon={<FaClock className="text-emerald-400" />}
                  />
                  <SummaryItem
                    label="Cliente"
                    value={
                      clients.find(
                        (c) => String(c.id) === formik.values.clientId,
                      )?.name
                    }
                    icon={<FaUser className="text-emerald-400" />}
                  />
                </>
              )}
              <SummaryItem
                label="Estado"
                value={formik.values.active ? "Activo" : "Inactivo"}
                icon={
                  <div
                    className={`w-2 h-2 rounded-full ${formik.values.active ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                }
              />
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 font-medium">
            Verifica que los datos sean correctos antes de procesar el registro.
          </p>
        </div>
      ),
    },
  ];

  const handleNext = async () => {
    const errors = await formik.validateForm();
    const currentFields =
      currentStep === 0
        ? ["name", "lastName", "username"]
        : ["roleId", "password", "confirmPassword", "scheduleId", "clientId"];
    const hasErrors = currentFields.some((f) => (errors as any)[f]);

    if (hasErrors) {
      const touched = currentFields.reduce(
        (acc, f) => ({ ...acc, [f]: true }),
        {},
      );
      formik.setTouched({ ...formik.touched, ...touched });
      dispatch(
        showToast({
          message: "Completa los campos obligatorios",
          type: "error",
        }),
      );
      return;
    }

    currentStep < steps.length - 1
      ? setCurrentStep((prev) => prev + 1)
      : formik.submitForm();
  };

  return (
    <div className="flex flex-col h-[700px] w-full max-w-2xl mx-auto overflow-hidden bg-white">
      {/* Progress Stepper - Professional standard */}
      <div className="flex-none py-8 bg-white z-20">
        <ITStepper
          steps={steps.map((s) => ({ label: s.label, icon: s.icon }))}
          currentStep={currentStep}
        />
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-10 py-8 bg-[#fcfdfe]">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {steps[currentStep].content}
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-none flex justify-between items-center px-10 py-6 border-t border-slate-100 bg-white z-20">
        <ITButton
          type="button"
          variant="ghost"
          onClick={
            currentStep === 0
              ? onCancel
              : () => setCurrentStep((prev) => prev - 1)
          }
        >
          {currentStep === 0 ? "Cancelar" : "Volver atrás"}
        </ITButton>
        <ITButton
          type="button"
          onClick={handleNext}
          disabled={formik.isSubmitting}
        >
          {currentStep === steps.length - 1
            ? formik.isSubmitting
              ? "Procesando..."
              : "Confirmar registro"
            : "Siguiente paso"}
        </ITButton>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, icon }: any) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-semibold truncate">
        {value || "No definido"}
      </span>
    </div>
  </div>
);

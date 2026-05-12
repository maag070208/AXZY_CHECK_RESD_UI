import { TResult } from "@app/core/types/TResult";
import { ITStepper } from "@app/core/components/ITStepper";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useState } from "react";
import {
  FaBuilding,
  FaClipboardCheck,
  FaIdCard,
  FaMapMarkerAlt,
  FaPhone,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import {
  createClient,
  updateClient,
  Client,
  ClientCreate,
  ClientUpdate,
} from "../services/ClientsService";

interface Props {
  clientToEdit?: Client;
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateClientWizard: React.FC<Props> = ({
  clientToEdit,
  onCancel,
  onSuccess,
}) => {
  const isEditing = !!clientToEdit;
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);

  const formik = useFormik<ClientCreate & { active: boolean }>({
    enableReinitialize: true,
    initialValues: {
      name: clientToEdit?.name || "",
      address: clientToEdit?.address || "",
      rfc: clientToEdit?.rfc || "",
      contactName: clientToEdit?.contactName || "",
      contactPhone: clientToEdit?.contactPhone || "",
      appUsername: "",
      appPassword: "",
      active: clientToEdit ? clientToEdit.active : true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      address: Yup.string(),
      rfc: Yup.string(),
      contactName: Yup.string(),
      contactPhone: Yup.string()
        .matches(/^[0-9]+$/, "Solo números")
        .min(10, "Mínimo 10 dígitos")
        .max(10, "Máximo 10 dígitos"),
      appUsername: Yup.string().min(4, "Mínimo 4 caracteres"),
      appPassword: Yup.string().min(6, "Mínimo 6 caracteres"),
    }),
    onSubmit: async (values) => {
      try {
        const payload: ClientCreate & { active: boolean } = {
          ...values,
          appUsername: values.appUsername || undefined,
          appPassword: values.appPassword || undefined,
        };

        const res =
          isEditing && clientToEdit
            ? await updateClient(clientToEdit.id, payload as ClientUpdate)
            : await createClient(payload);

        if (res.success) {
          dispatch(
            showToast({
              message: `Cliente ${isEditing ? "actualizado" : "creado"} con éxito`,
              type: "success",
            }),
          );
          onSuccess();
        } else {
          dispatch(
            showToast({ message: res.messages?.[0] || "Error", type: "error" }),
          );
        }
      } catch (error) {
        const result = error as TResult<void>;
        dispatch(
          showToast({
            message: result?.messages?.[0] || "Error inesperado",
            type: "error",
          }),
        );
      }
    },
  });

  const steps = [
    {
      label: "Identidad",
      icon: <FaBuilding />,
      content: (
        <div className="space-y-8">
          <ITInput
            label="Nombre del Cliente / Razón Social"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.name}
            touched={formik.touched.name}
            placeholder="Ej. Corporativo AXZY S.A. de C.V."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ITInput
              label="RFC (Opcional)"
              name="rfc"
              value={formik.values.rfc}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.rfc}
              touched={formik.touched.rfc}
              placeholder="ABC123456XYZ"
            />
            <ITInput
              label="Dirección"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.address}
              touched={formik.touched.address}
              placeholder="Calle, Número, Col..."
              iconLeft={<FaMapMarkerAlt className="text-slate-400" />}
            />
          </div>

          <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100/50 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100">
                <FaUser size={14} />
              </div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Contacto Principal
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ITInput
                label="Nombre de Contacto"
                name="contactName"
                value={formik.values.contactName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.contactName}
                touched={formik.touched.contactName}
                iconLeft={<FaUser className="text-slate-400" />}
                placeholder="Juan Pérez"
              />
              <ITInput
                label="Teléfono Móvil (10 dígitos)"
                name="contactPhone"
                value={formik.values.contactPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  formik.setFieldValue("contactPhone", val.slice(0, 10));
                }}
                onBlur={formik.handleBlur}
                error={formik.errors.contactPhone}
                touched={formik.touched.contactPhone}
                placeholder="5500000000"
                maxLength={10}
                iconLeft={<FaPhone className="text-slate-400" />}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Acceso App",
      icon: <FaShieldAlt />,
      content: (
        <div className="space-y-8">
          <div className="bg-emerald-50/30 p-8 rounded-[32px] border border-emerald-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-emerald-100/50 pointer-events-none">
              <FaShieldAlt size={80} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm text-emerald-500">
                  <FaIdCard size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    Seguridad App
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    Credenciales Operativas
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-8 leading-relaxed max-w-md">
                Configure el acceso para que el personal asignado a este cliente
                pueda sincronizar sus actividades desde la aplicación móvil.
              </p>

              <div className="grid grid-cols-1 gap-6">
                <ITInput
                  label="Nombre de Usuario (App)"
                  name="appUsername"
                  value={formik.values.appUsername}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.appUsername}
                  touched={formik.touched.appUsername}
                  placeholder="cliente_admin"
                />
                <ITInput
                  label={
                    isEditing
                      ? "Cambiar Contraseña (Opcional)"
                      : "Contraseña de Acceso"
                  }
                  name="appPassword"
                  type="password"
                  value={formik.values.appPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.appPassword}
                  touched={formik.touched.appPassword}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="group p-1 bg-slate-100 rounded-[20px] transition-all hover:bg-slate-200/50">
              <label className="flex items-center justify-between p-4 px-6 bg-white rounded-[18px] cursor-pointer shadow-sm border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">
                    Estado del Cliente
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Determina si el cliente puede operar en el sistema
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formik.values.active}
                    onChange={formik.handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:border-emerald-600"></div>
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
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 rounded-[28px] bg-emerald-500 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-3xl font-black">
                {formik.values.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black truncate max-w-[300px]">
                  {formik.values.name}
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${formik.values.active ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    {formik.values.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-8 border-t border-white/5 pt-10">
              <SummaryItem
                label="Responsable"
                value={formik.values.contactName}
                icon={<FaUser className="text-emerald-400/60" />}
              />
              <SummaryItem
                label="Contacto"
                value={formik.values.contactPhone}
                icon={<FaPhone className="text-emerald-400/60" />}
              />
              <SummaryItem
                label="Identificador App"
                value={
                  formik.values.appUsername ||
                  (isEditing ? "Sin cambios" : "No definido")
                }
                icon={<FaShieldAlt className="text-emerald-400/60" />}
              />
              <SummaryItem
                label="RFC"
                value={formik.values.rfc}
                icon={<FaBuilding className="text-emerald-400/60" />}
              />
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4">
            Revise cuidadosamente antes de guardar
          </p>
        </div>
      ),
    },
  ];

  const handleNext = async () => {
    const errors = await formik.validateForm();
    const currentFields =
      currentStep === 0 ? ["name"] : ["appUsername", "appPassword"];

    const hasErrors = currentFields.some((f) => (errors as any)[f]);

    if (hasErrors) {
      const touched = currentFields.reduce(
        (acc, f) => ({ ...acc, [f]: true }),
        {},
      );
      formik.setTouched({ ...formik.touched, ...touched });
      dispatch(
        showToast({
          message: "Complete los campos requeridos",
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
    <div className="flex flex-col h-[750px] w-full max-w-2xl mx-auto overflow-hidden bg-white">
      <div className="flex-none py-10 bg-white z-20 border-b border-slate-50">
        <ITStepper
          steps={steps.map((s) => ({ label: s.label, icon: s.icon }))}
          currentStep={currentStep}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 bg-[#fcfdfe]">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {steps[currentStep].content}
        </div>
      </div>

      <div className="flex-none flex justify-between items-center px-12 py-8 border-t border-slate-100 bg-white z-20">
        <ITButton
          type="button"
          variant="ghost"
          onClick={
            currentStep === 0
              ? onCancel
              : () => setCurrentStep((prev) => prev - 1)
          }
        >
          <span className="text-slate-400 font-bold">
            {currentStep === 0 ? "Cancelar" : "Volver"}
          </span>
        </ITButton>
        <ITButton
          type="button"
          onClick={handleNext}
          disabled={formik.isSubmitting}
        >
          <div className="flex items-center gap-2 px-4">
            {currentStep === steps.length - 1
              ? formik.isSubmitting
                ? "Guardando..."
                : isEditing
                  ? "Actualizar Cliente"
                  : "Crear Cliente"
              : "Siguiente paso"}
          </div>
        </ITButton>
      </div>
    </div>
  );
};

interface SummaryItemProps {
  label: string;
  value?: string;
  icon: React.ReactNode;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, icon }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
      {label}
    </span>
    <div className="flex items-center gap-3">
      <div className="text-sm">{icon}</div>
      <span className="text-sm font-bold truncate">
        {value || "No especificado"}
      </span>
    </div>
  </div>
);

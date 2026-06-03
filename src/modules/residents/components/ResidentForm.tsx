import { useCatalog } from "@app/core/hooks/catalog.hook";
import {
  ITButton,
  ITInput,
  ITSearchSelect,
  ITSlideToggle,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";

interface Props {
  residentToEdit?: any;
  onSubmit: (data: any, keepOpen?: boolean) => void;
  onCancel: () => void;
}

export const ResidentForm: React.FC<Props> = ({
  residentToEdit,
  onSubmit,
  onCancel,
}) => {
  const isEditing = !!residentToEdit;
  const [isSavingAndNew, setIsSavingAndNew] = useState(false);

  const { data: houses, loading: loadingHouses } = useCatalog("house");

  const formik = useFormik({
    initialValues: {
      user: {
        name: "",
        lastName: "",
        username: "",
        password: "",
      },
      houseId: residentToEdit?.houseId || "",
      phone: residentToEdit?.phone || "",
      email: residentToEdit?.email || "",
      isOwner: residentToEdit ? residentToEdit.isOwner : false,
      active: residentToEdit ? residentToEdit.active : true,
    },
    validationSchema: Yup.object({
      user: !isEditing
        ? Yup.object({
            name: Yup.string().required("Nombre es requerido"),
            lastName: Yup.string().optional(),
            username: Yup.string()
              .required("Usuario es requerido")
              .min(3, "Mínimo 3 caracteres"),
            password: Yup.string()
              .required("Contraseña es requerida")
              .min(6, "Mínimo 6 caracteres"),
          })
        : Yup.object().optional(),
      houseId: Yup.string().required("La casa asignada es requerida"),
      phone: Yup.string().optional(),
      email: Yup.string().email("Formato de correo inválido").optional(),
      isOwner: Yup.boolean().optional(),
      active: Yup.boolean().optional(),
    }),
    onSubmit: (values, { resetForm }) => {
      const payload: any = {
        houseId: values.houseId,
        phone: values.phone,
        email: values.email,
        isOwner: values.isOwner,
        active: values.active,
      };

      if (!isEditing) {
        payload.user = {
          name: values.user.name,
          lastName: values.user.lastName || undefined,
          username: values.user.username,
          password: values.user.password,
        };
      }

      onSubmit(payload, isSavingAndNew);
      if (isSavingAndNew && !isEditing) {
        resetForm({
          values: {
            user: {
              name: "",
              lastName: "",
              username: "",
              password: "",
            },
            houseId: "",
            phone: "",
            email: "",
            isOwner: false,
            active: true,
          },
        });
      }
    },
  });

  return (
    <div className="flex flex-col bg-white overflow-hidden max-h-[75vh]">
      <form onSubmit={formik.handleSubmit} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10 pb-36 space-y-10 custom-scrollbar">
          {/* Section 1: Property Mapping */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Asignación de Propiedad
              </ITText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                  <div className="md:col-span-2">
                    <ITText className="text-xs font-bold text-slate-500 mb-4 block">
                      CREAR CREDENCIALES DE ACCESO
                    </ITText>
                  </div>
                  <ITInput
                    label="Nombre"
                    name="user.name"
                    value={formik.values.user.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.errors.user && (formik.errors.user as any).name
                        ? String((formik.errors.user as any).name)
                        : undefined
                    }
                    touched={
                      formik.touched.user && (formik.touched.user as any).name
                    }
                    placeholder="Ej. Carlos"
                  />
                  <ITInput
                    label="Apellido"
                    name="user.lastName"
                    value={formik.values.user.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.errors.user && (formik.errors.user as any).lastName
                        ? String((formik.errors.user as any).lastName)
                        : undefined
                    }
                    touched={
                      formik.touched.user &&
                      (formik.touched.user as any).lastName
                    }
                    placeholder="Ej. González"
                  />
                  <ITInput
                    label="Nombre de Usuario (Acceso)"
                    name="user.username"
                    value={formik.values.user.username}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.errors.user && (formik.errors.user as any).username
                        ? String((formik.errors.user as any).username)
                        : undefined
                    }
                    touched={
                      formik.touched.user &&
                      (formik.touched.user as any).username
                    }
                    placeholder="Ej. carlosg"
                  />
                  <ITInput
                    label="Contraseña"
                    name="user.password"
                    type="password"
                    value={formik.values.user.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.errors.user && (formik.errors.user as any).password
                        ? String((formik.errors.user as any).password)
                        : undefined
                    }
                    touched={
                      formik.touched.user &&
                      (formik.touched.user as any).password
                    }
                    placeholder="Contraseña de acceso"
                  />
                </div>
              ) : (
                <div className="md:col-span-2">
                  <div className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                      Usuario Asociado
                    </ITText>
                    <ITText className="font-bold text-slate-700 text-sm">
                      {residentToEdit.user?.name}{" "}
                      {residentToEdit.user?.lastName}
                    </ITText>
                    <ITText className="text-slate-400 text-xs mt-0.5">
                      @{residentToEdit.user?.username}
                    </ITText>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <ITSearchSelect
                  label="Casa / Vivienda"
                  placeholder={
                    loadingHouses ? "Cargando casas..." : "Seleccionar casa..."
                  }
                  options={(houses || []).map((h: any) => ({
                    label: h.value,
                    value: h.id,
                  }))}
                  value={formik.values.houseId}
                  onChange={(val) => formik.setFieldValue("houseId", val)}
                  error={
                    formik.errors.houseId
                      ? String(formik.errors.houseId)
                      : undefined
                  }
                  touched={!!formik.touched.houseId}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Contact Info */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                Información de Contacto
              </ITText>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ITInput
                label="Teléfono Móvil"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.errors.phone ? String(formik.errors.phone) : undefined
                }
                touched={!!formik.touched.phone}
                placeholder="Ej. +52 5512345678"
              />

              <ITInput
                label="Correo Electrónico"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.errors.email ? String(formik.errors.email) : undefined
                }
                touched={!!formik.touched.email}
                placeholder="Ej. residente@email.com"
              />
            </div>
          </section>

          {/* Section 3: Configuration */}
          <section className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
              <div>
                <ITText className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  Propietario Legal
                </ITText>
                <ITText className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                  Indica si esta persona es dueña de la propiedad
                </ITText>
              </div>
              <ITSlideToggle
                isOn={formik.values.isOwner}
                onToggle={(val) => formik.setFieldValue("isOwner", val)}
              />
            </div>

            {isEditing && (
              <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <ITText className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Estado del Residente
                  </ITText>
                  <ITText className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    Habilitar o suspender temporalmente los accesos y alertas
                  </ITText>
                </div>
                <ITSlideToggle
                  isOn={formik.values.active}
                  onToggle={(val) => formik.setFieldValue("active", val)}
                />
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            type="button"
            variant="filled"
            onClick={onCancel}
            color="secondary"
          >
            Cancelar
          </ITButton>

          {!isEditing && (
            <ITButton
              type="submit"
              onClick={() => setIsSavingAndNew(true)}
              variant="filled"
              color="warning"
              disabled={formik.isSubmitting}
            >
              Guardar y Nueva
            </ITButton>
          )}

          <ITButton
            type="submit"
            onClick={() => setIsSavingAndNew(false)}
            color="primary"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting
              ? "Procesando..."
              : isEditing
                ? "Actualizar Residente"
                : "Registrar Residente"}
          </ITButton>
        </div>
      </form>
    </div>
  );
};

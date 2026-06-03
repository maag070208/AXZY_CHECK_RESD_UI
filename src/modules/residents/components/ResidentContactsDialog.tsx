import { AccessTicketOverlay } from "@app/core/components/AccessTicketOverlay";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  AccessResponse,
  createAccess,
} from "@app/modules/accesses/services/AccessesService";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITSlideToggle,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useFormik } from "formik";
import QRCode from "qrcode";
import React, { useEffect, useState } from "react";
import {
  FaEdit,
  FaPlus,
  FaQrcode,
  FaShieldAlt,
  FaTimes,
  FaTrash,
  FaUserFriends,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import {
  createContact,
  deleteContact,
  getPaginatedContacts,
  ResidentContactResponse,
  updateContact,
} from "../services/ResidentsService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  resident: any;
}

export const ResidentContactsDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  resident,
}) => {
  const dispatch = useDispatch();
  const [contacts, setContacts] = useState<ResidentContactResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingContact, setEditingContact] = useState<ResidentContactResponse | null>(
    null,
  );
  const [isAdding, setIsAdding] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [configuringContact, setConfiguringContact] =
    useState<ResidentContactResponse | null>(null);
  const [createdAccess, setCreatedAccess] = useState<AccessResponse | null>(null);

  const fetchContacts = async () => {
    if (!resident?.id) return;
    setLoading(true);
    try {
      const res = await getPaginatedContacts({
        page: 1,
        limit: 100,
        filters: { residentId: resident.id },
      });
      setContacts(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && resident?.id) {
      fetchContacts();
      setIsAdding(false);
      setEditingContact(null);
    }
  }, [isOpen, resident]);

  const handleEdit = (contact: ResidentContactResponse) => {
    setEditingContact(contact);
    setIsAdding(true);
  };

  const handleDelete = async (contactId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este contacto?")) return;
    try {
      const res = await deleteContact(contactId);
      if (res.success) {
        dispatch(showToast({ message: "Contacto eliminado", type: "success" }));
        fetchContacts();
      }
    } catch (error) {
      dispatch(
        showToast({ message: "Error al eliminar contacto", type: "error" }),
      );
    }
  };

  const handleGenerateQR = (contact: ResidentContactResponse) => {
    setConfiguringContact(contact);
  };

  const validityFormik = useFormik({
    initialValues: {
      unit: "hours",
      amount: 1,
    },
    validationSchema: Yup.object({
      unit: Yup.string().oneOf(["hours", "days"]).required("Requerido"),
      amount: Yup.number().min(1, "Debe ser al menos 1").required("Requerido"),
    }),
    onSubmit: async (values) => {
      if (!configuringContact) return;
      try {
        const now = dayjs();
        const validUntil =
          values.unit === "hours"
            ? now.add(values.amount, "hour")
            : now.add(values.amount, "day");

        const res = await createAccess({
          residentId: resident.id,
          type: "TEMPORARY",
          validFrom: now.toISOString(),
          validUntil: validUntil.toISOString(),
          visitor: {
            name: configuringContact.name,
            phone: configuringContact.phone || undefined,
          },
        });

        if (res.success && res.data) {
          const access = res.data;
          const payload = access.qrCode || "";

          const url = await QRCode.toDataURL(payload, {
            width: 512,
            margin: 2,
            color: {
              dark: "#0b0c10", // Premium dark contrast
              light: "#ffffff",
            },
          });

          setQrCodeUrl(url);
          setCreatedAccess(access);
          setConfiguringContact(null);
          dispatch(
            showToast({
              message: "Pase de acceso generado con éxito",
              type: "success",
            }),
          );
        } else {
          dispatch(
            showToast({
              message: "Error al generar el pase de acceso",
              type: "error",
            }),
          );
        }
      } catch (error) {
        console.error(error);
        dispatch(
          showToast({
            message: "Error al generar el pase de acceso",
            type: "error",
          }),
        );
      }
    },
  });

  useEffect(() => {
    if (configuringContact) {
      validityFormik.resetForm();
    }
  }, [configuringContact]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingContact?.name || "",
      phone: editingContact?.phone || "",
      email: editingContact?.email || "",
      relationship: editingContact?.relationship || "",
      canGenerateAccess: editingContact
        ? editingContact.canGenerateAccess
        : false,
      active: editingContact ? editingContact.active : true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      phone: Yup.string().optional(),
      email: Yup.string().email("Correo inválido").optional(),
      relationship: Yup.string().required("El parentesco es requerido"),
      canGenerateAccess: Yup.boolean().optional(),
      active: Yup.boolean().optional(),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        let res;
        if (editingContact) {
          res = await updateContact(editingContact.id, values);
        } else {
          res = await createContact({
            ...values,
            residentId: resident.id,
          });
        }

        if (res.success) {
          dispatch(
            showToast({
              message: `Contacto ${editingContact ? "actualizado" : "creado"} con éxito`,
              type: "success",
            }),
          );
          resetForm();
          setIsAdding(false);
          setEditingContact(null);
          fetchContacts();
        }
      } catch (error) {
        dispatch(
          showToast({ message: "Error al guardar el contacto", type: "error" }),
        );
      }
    },
  });

  const dialogSizeClass = "!max-w-2xl !w-full";

  const getDialogTitle = () => {
    if (createdAccess) return "Pase de Acceso - CheckApp Security";
    if (configuringContact)
      return `Configurar Vigencia - ${configuringContact.name}`;
    if (isAdding) return editingContact ? "Editar Contacto" : "Nuevo Contacto";
    return `Contactos - Casa ${resident?.house?.street} ${resident?.house?.number}`;
  };

  return (
    <>
      <ITDialog
        isOpen={isOpen && !createdAccess}
        onClose={onClose}
        title={getDialogTitle()}
        className={dialogSizeClass}
      >
        <div className="flex flex-col bg-white overflow-hidden max-h-[80vh]">
          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            {configuringContact ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  validityFormik.handleSubmit();
                }}
                className="space-y-6"
              >
                <div className="flex gap-4 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      validityFormik.setFieldValue("unit", "hours")
                    }
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                      validityFormik.values.unit === "hours"
                        ? "bg-[#065911] text-white border-[#065911]"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-55"
                    }`}
                  >
                    Por Horas
                  </button>
                  <button
                    type="button"
                    onClick={() => validityFormik.setFieldValue("unit", "days")}
                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                      validityFormik.values.unit === "days"
                        ? "bg-[#065911] text-white border-[#065911]"
                        : "bg-white text-slate-500 border-slate-200 hover:bg-slate-55"
                    }`}
                  >
                    Por Día
                  </button>
                </div>

                <ITInput
                  label={
                    validityFormik.values.unit === "hours"
                      ? "Cantidad de Horas"
                      : "Cantidad de Días"
                  }
                  name="amount"
                  type="number"
                  value={validityFormik.values.amount}
                  onChange={validityFormik.handleChange}
                  onBlur={validityFormik.handleBlur}
                  error={validityFormik.errors.amount}
                  touched={validityFormik.touched.amount}
                  placeholder="Ej. 1"
                />
              </form>
            ) : isAdding ? (
              <section className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                    <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      {editingContact ? "Editar Contacto" : "Nuevo Contacto"}
                    </ITText>
                  </div>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setEditingContact(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ITInput
                      label="Nombre Completo"
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.errors.name}
                      touched={formik.touched.name}
                      placeholder="Ej. Sofia Garcia"
                    />

                    <ITInput
                      label="Parentesco / Relación"
                      name="relationship"
                      value={formik.values.relationship}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.errors.relationship}
                      touched={formik.touched.relationship}
                      placeholder="Ej. Esposa, Hijo, Empleado"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ITInput
                      label="Teléfono"
                      name="phone"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.errors.phone}
                      touched={formik.touched.phone}
                      placeholder="Ej. +52 5599887766"
                    />

                    <ITInput
                      label="Correo"
                      name="email"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.errors.email}
                      touched={formik.touched.email}
                      placeholder="Ej. contacto@email.com"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div>
                        <ITText className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                          Generar Códigos de Acceso (QR)
                        </ITText>
                        <ITText className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                          Permitir que este contacto cree invitaciones y códigos
                          temporales
                        </ITText>
                      </div>
                      <ITSlideToggle
                        isOn={formik.values.canGenerateAccess}
                        onToggle={(val) =>
                          formik.setFieldValue("canGenerateAccess", val)
                        }
                      />
                    </div>

                    {editingContact && (
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                        <div>
                          <ITText className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                            Estado Activo
                          </ITText>
                          <ITText className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                            Habilitar o deshabilitar contacto
                          </ITText>
                        </div>
                        <ITSlideToggle
                          isOn={formik.values.active}
                          onToggle={(val) =>
                            formik.setFieldValue("active", val)
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <ITButton
                      type="button"
                      variant="outlined"
                      onClick={() => {
                        setIsAdding(false);
                        setEditingContact(null);
                      }}
                      color="secondary"
                    >
                      Cancelar
                    </ITButton>
                    <ITButton type="submit" color="primary">
                      Guardar Contacto
                    </ITButton>
                  </div>
                </form>
              </section>
            ) : (
              <>
                <div className="flex justify-between items-center bg-slate-50/30 p-5 rounded-3xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <FaUserFriends className="text-slate-400" size={20} />
                    <div>
                      <ITText className="text-xs font-black text-slate-700 uppercase tracking-tight block">
                        Contactos del Residente
                      </ITText>
                      <ITText className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">
                        Contactos de emergencia o personas autorizadas
                      </ITText>
                    </div>
                  </div>
                  <ITButton
                    onClick={() => setIsAdding(true)}
                    variant="filled"
                    color="primary"
                  >
                    <div className="flex items-center gap-2">
                      <FaPlus size={10} />
                      <span className="uppercase text-[9px] font-black tracking-widest">
                        Nuevo Contacto
                      </span>
                    </div>
                  </ITButton>
                </div>

                <section className="space-y-4">
                  {loading ? (
                    <div className="flex justify-center py-10">
                      <ITText className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Cargando...
                      </ITText>
                    </div>
                  ) : contacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="group flex flex-col p-5 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 hover:shadow-md transition-all relative"
                        >
                          <div className="flex items-start justify-between min-w-0 mb-4">
                            <div className="flex flex-col min-w-0">
                              <ITText className="font-black text-slate-700 text-xs uppercase tracking-tight truncate">
                                {contact.name}
                              </ITText>
                              <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">
                                {contact.relationship}
                              </ITText>
                            </div>
                            <div className="flex gap-1.5 ml-3">
                              {contact.canGenerateAccess && (
                                <div
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm"
                                  title="Genera Accesos"
                                >
                                  <FaShieldAlt size={10} />
                                </div>
                              )}
                              <div
                                className={`px-2 py-0.5 rounded-md text-[8px] font-black border tracking-wider ${
                                  contact.active
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : "bg-slate-50 text-slate-400 border-slate-200"
                                }`}
                              >
                                {contact.active ? "ACTIVO" : "INACTIVO"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                            {contact.phone && (
                              <div className="truncate">
                                Tel: {contact.phone}
                              </div>
                            )}
                            {contact.email && (
                              <div className="truncate">
                                Email: {contact.email}
                              </div>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-50">
                            <ITButton
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleGenerateQR(contact)}
                              title="Generar QR"
                            >
                              <FaQrcode size={12} />
                            </ITButton>
                            <ITButton
                              size="small"
                              variant="outlined"
                              onClick={() => handleEdit(contact)}
                              title="Editar"
                            >
                              <FaEdit size={12} />
                            </ITButton>
                            <ITButton
                              size="small"
                              variant="outlined"
                              color="danger"
                              onClick={() => handleDelete(contact.id)}
                              title="Eliminar"
                            >
                              <FaTrash size={12} />
                            </ITButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4 bg-slate-50/10 rounded-3xl border border-dashed border-slate-200">
                      <FaUserFriends size={40} className="opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Sin contactos registrados
                      </span>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>

          <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-3">
            {configuringContact ? (
              <>
                <ITButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setConfiguringContact(null)}
                >
                  Cancelar
                </ITButton>
                <ITButton
                  onClick={() => validityFormik.handleSubmit()}
                  color="primary"
                >
                  Generar QR
                </ITButton>
              </>
            ) : (
              <ITButton variant="filled" onClick={onClose} color="secondary">
                Cerrar
              </ITButton>
            )}
          </div>
        </div>
      </ITDialog>

      <AccessTicketOverlay
        isOpen={!!createdAccess}
        onClose={() => {
          setCreatedAccess(null);
          setQrCodeUrl("");
        }}
        access={createdAccess}
        qrCodeUrl={qrCodeUrl}
      />
    </>
  );
};

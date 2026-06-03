import { AccessTicketOverlay } from "@app/core/components/AccessTicketOverlay";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  AccessResponse,
  createAccess,
} from "@app/modules/accesses/services/AccessesService";
import {
  ITButton,
  ITDialog,
  ITInput,
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
  FaTrash,
  FaUserFriends,
  FaUsers,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import {
  createContact,
  deleteContact,
  getPaginatedContacts,
  getMyResidentProfile,
  ResidentContactResponse,
  ResidentResponse,
  updateContact,
} from "../services/ResidentsService";

export const ContactsPage: React.FC = () => {
  const dispatch = useDispatch();

  const [resident, setResident] = useState<ResidentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Contacts State
  const [contacts, setContacts] = useState<ResidentContactResponse[]>([]);
  const [editingContact, setEditingContact] =
    useState<ResidentContactResponse | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [contactToDeleteId, setContactToDeleteId] = useState<string | null>(null);

  // QR State
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [configuringContact, setConfiguringContact] =
    useState<ResidentContactResponse | null>(null);
  const [createdAccess, setCreatedAccess] = useState<AccessResponse | null>(
    null,
  );

  const fetchContacts = async (resId: string) => {
    try {
      const res = await getPaginatedContacts({
        page: 1,
        limit: 100,
        filters: { residentId: resId },
      });
      setContacts(res.data || []);
    } catch (e) {
      //
    }
  };

  const loadProfileAndContacts = async () => {
    try {
      const res = await getMyResidentProfile();
      if (res.success && res.data) {
        setResident(res.data);
        await fetchContacts(res.data.id);
      } else {
        dispatch(
          showToast({ message: "Perfil de residente no encontrado", type: "error" }),
        );
      }
    } catch (error) {
      dispatch(
        showToast({ message: "Error al cargar perfil", type: "error" }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndContacts();
  }, []);

  const contactFormik = useFormik({
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
      relationship: Yup.string().required("Parentesco requerido"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!resident) return;
      try {
        let res;
        if (editingContact) {
          res = await updateContact(editingContact.id, values);
        } else {
          res = await createContact({ ...values, residentId: resident.id });
        }
        if (res.success) {
          dispatch(
            showToast({
              message: `Contacto ${editingContact ? "actualizado" : "creado"}`,
              type: "success",
            }),
          );
          resetForm();
          setIsAddingContact(false);
          setEditingContact(null);
          fetchContacts(resident.id);
        }
      } catch (error) {
        dispatch(
          showToast({ message: "Error al guardar contacto", type: "error" }),
        );
      }
    },
  });

  const handleDeleteContact = (contactId: string) => {
    setContactToDeleteId(contactId);
  };

  const confirmDeleteContact = async () => {
    if (!contactToDeleteId || !resident) return;
    const res = await deleteContact(contactToDeleteId);
    if (res.success) {
      dispatch(showToast({ message: "Contacto eliminado", type: "success" }));
      fetchContacts(resident.id);
    }
    setContactToDeleteId(null);
  };

  const validityFormik = useFormik({
    initialValues: { unit: "hours", amount: 1 },
    onSubmit: async (values) => {
      if (!configuringContact || !resident) return;
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
          const url = await QRCode.toDataURL(res.data.qrCode || "", {
            width: 512,
            margin: 2,
            color: { dark: "#0b0c10", light: "#ffffff" },
          });
          setQrCodeUrl(url);
          setCreatedAccess(res.data as any);
          setConfiguringContact(null);
          dispatch(showToast({ message: "Pase generado", type: "success" }));
        }
      } catch (error) {
        dispatch(
          showToast({ message: "Error al generar pase", type: "error" }),
        );
      }
    },
  });

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 min-h-screen font-sans text-slate-800">
      <ModuleHeader
        title="Mis Contactos"
        subtitle="Administra tu red de contactos y genera pases QR rápidamente"
        icon={FaUsers}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 overflow-hidden min-h-[60vh] p-6 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <ITText className="text-base font-semibold text-slate-900">
            Contactos Autorizados
          </ITText>
          {!isAddingContact && !configuringContact && (
                <ITButton
                  onClick={() => setIsAddingContact(true)}
                  size="small"
                  variant="filled"
                  color="primary"
                >
                  <FaPlus size={12} /> Nuevo Contacto
            </ITButton>
          )}
        </div>

        {isAddingContact || editingContact ? (
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200">
            <ITText className="font-semibold text-lg text-slate-900 mb-6">
              {editingContact ? "Editar Contacto" : "Nuevo Contacto"}
            </ITText>
            <form onSubmit={contactFormik.handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <ITText className="text-sm font-medium text-slate-700">
                    Nombre Completo
                  </ITText>
                  <ITInput
                    name="name"
                    placeholder="Ej. Carlos Martínez"
                    value={contactFormik.values.name}
                    onChange={contactFormik.handleChange}
                    onBlur={contactFormik.handleBlur}
                    error={contactFormik.errors.name as string}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <ITText className="text-sm font-medium text-slate-700">
                    Relación / Parentesco
                  </ITText>
                  <ITInput
                    name="relationship"
                    placeholder="Ej. Familiar, Proveedor"
                    value={contactFormik.values.relationship}
                    onChange={contactFormik.handleChange}
                    onBlur={contactFormik.handleBlur}
                    error={contactFormik.errors.relationship as string}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <ITButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingContact(false);
                    setEditingContact(null);
                  }}
                  className="px-6 text-slate-500 font-medium hover:bg-slate-50 !rounded-lg"
                >
                  Cancelar
                </ITButton>
                <ITButton
                  type="submit"
                  className="px-8 !rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium"
                >
                  Guardar Contacto
                </ITButton>
              </div>
            </form>
          </div>
        ) : configuringContact ? (
          <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validityFormik.handleSubmit();
              }}
            >
              <ITText className="font-semibold text-lg text-slate-900 mb-2">
                Generar Pase de Acceso (QR)
              </ITText>
              <ITText className="text-sm text-slate-500 mb-8 block">
                Configura la vigencia del pase para{" "}
                <span className="font-medium text-slate-800">
                  {configuringContact.name}
                </span>
                .
              </ITText>

              <div className="space-y-6 max-w-xl">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => validityFormik.setFieldValue("unit", "hours")}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors border ${
                      validityFormik.values.unit === "hours"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Por Horas
                  </button>
                  <button
                    type="button"
                    onClick={() => validityFormik.setFieldValue("unit", "days")}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors border ${
                      validityFormik.values.unit === "days"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    Por Días
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  <ITText className="text-sm font-medium text-slate-700">
                    Cantidad de{" "}
                    {validityFormik.values.unit === "hours" ? "Horas" : "Días"}
                  </ITText>
                  <ITInput
                    name="amount"
                    type="number"
                    value={validityFormik.values.amount}
                    onChange={validityFormik.handleChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <ITButton
                  variant="ghost"
                  onClick={() => setConfiguringContact(null)}
                  className="px-6 text-slate-500 font-medium hover:bg-slate-50 !rounded-lg"
                >
                  Cancelar
                </ITButton>
                <ITButton
                  type="submit"
                  className="px-8 !rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium"
                >
                  <div className="flex flex-row gap-2 items-center">
                    <FaQrcode /> Generar Pase
                  </div>
                </ITButton>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {contacts.length === 0 ? (
              <div className="col-span-full py-20 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <ITText className="text-slate-500 font-medium text-sm">
                  No hay contactos registrados
                </ITText>
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-xl border border-slate-100 flex flex-col hover:border-slate-300 transition-colors relative group"
                >
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingContact(c);
                        setIsAddingContact(true);
                      }}
                      className="w-8 h-8 rounded-md bg-white flex items-center justify-center text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-300 transition-colors"
                    >
                      <FaEdit size={14} />
                    </button>
                    <ITButton
                      onClick={() => handleDeleteContact(c.id)}
                      variant="outlined"
                      color="danger"
                      size="small"
                      title="Eliminar"
                    >
                      <FaTrash size={12} />
                    </ITButton>
                  </div>

                  <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                    <FaUserFriends size={20} />
                  </div>

                  <ITText className="font-semibold text-slate-900 text-base mb-1 line-clamp-1 pr-16">
                    {c.name}
                  </ITText>
                  <ITText className="text-sm text-slate-500 mb-6">
                    {c.relationship}
                  </ITText>

                <ITButton
                  onClick={() => setConfiguringContact(c)}
                  size="small"
                  variant="filled"
                  color="primary"
                  className="w-full"
                >
                  Crear Pase
                </ITButton>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <ITDialog
        isOpen={!!contactToDeleteId}
        onClose={() => setContactToDeleteId(null)}
        title="Eliminar Contacto"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Contacto?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción es permanente y no se puede deshacer.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setContactToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDeleteContact}
            >
              ELIMINAR AHORA
            </ITButton>
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
    </div>
  );
};

export default ContactsPage;

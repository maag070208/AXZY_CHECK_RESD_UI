import { AccessTicketOverlay } from "@app/core/components/AccessTicketOverlay";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  AccessResponse,
  createAccess,
} from "@app/modules/accesses/services/AccessesService";
import {
  ITBadget,
  ITButton,
  ITInput,
  ITTabs,
  ITText,
  ITDialog,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useFormik } from "formik";
import QRCode from "qrcode";
import React, { useEffect, useState } from "react";
import {
  FaBuilding,
  FaEdit,
  FaMapMarkerAlt,
  FaMoneyBill,
  FaPhoneAlt,
  FaPlus,
  FaQrcode,
  FaTrash,
  FaUser,
  FaDownload,
  FaUserFriends,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import * as Yup from "yup";
import { updateUser, resetPassword } from "../../users/services/UserService";
import {
  createFee,
  createPayment,
  createPaymentCheckout,
  getPaginatedPayments,
  PaymentResponse,
  ResidentFeeResponse,
  getResidentFees,
  createResidentFee,
  deleteResidentFee,
  getFees,
  FeeResponse,
  downloadReceipt,
} from "../../payments/services/PaymentsService";
import {
  createContact,
  deleteContact,
  getPaginatedContacts,
  getResidentById,
  ResidentContactResponse,
  ResidentResponse,
  updateContact,
} from "../services/ResidentsService";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

export const ResidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [resident, setResident] = useState<ResidentResponse | null>(null);
  const [loading, setLoading] = useState(true);


  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Contacts State
  const [contacts, setContacts] = useState<ResidentContactResponse[]>([]);
  const [editingContact, setEditingContact] =
    useState<ResidentContactResponse | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);

  // QR State
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [configuringContact, setConfiguringContact] =
    useState<ResidentContactResponse | null>(null);
  const [createdAccess, setCreatedAccess] = useState<AccessResponse | null>(
    null,
  );

  // Payments State
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  // Resident Fee Assignments
  const [residentFees, setResidentFees] = useState<ResidentFeeResponse[]>([]);
  const [feesList, setFeesList] = useState<FeeResponse[]>([]);
  const [isAssigningFee, setIsAssigningFee] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [feeToUnassignId, setFeeToUnassignId] = useState<string | null>(null);

  const paymentFormik = useFormik({
    initialValues: { name: "", amount: "" },
    validationSchema: Yup.object({
      name: Yup.string().required("Concepto requerido"),
      amount: Yup.number().required("Monto requerido").min(1, "Mínimo $1"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!resident) return;
      try {
        const feeRes = await createFee({
          name: values.name,
          amount: Number(values.amount),
          type: "ONE_TIME",
          dueDate: new Date().toISOString(),
          active: true,
        });
        if (feeRes.success && feeRes.data) {
          const payRes = await createPayment({
            residentId: resident.id,
            feeId: feeRes.data.id,
            amount: Number(values.amount),
            status: "PENDING",
          });
          if (payRes.success) {
            dispatch(
              showToast({
                message: "Cargo generado correctamente",
                type: "success",
              }),
            );
            resetForm();
            setIsAddingPayment(false);
            fetchPayments();
          } else {
            dispatch(
              showToast({
                message: payRes.messages?.[0] || "Error al crear el pago",
                type: "error",
              }),
            );
          }
        } else {
          dispatch(
            showToast({
              message: feeRes.messages?.[0] || "Error al crear la cuota",
              type: "error",
            }),
          );
        }
      } catch (error: any) {
        const apiMsg =
          error?.messages?.[0] || error?.message || "Error al generar cargo";
        dispatch(showToast({ message: apiMsg, type: "error" }));
      }
    },
  });

  // User Account Modals State
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);
  const [isConfirmActiveOpen, setIsConfirmActiveOpen] = useState(false);

  const editUserFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: resident?.user?.name || "",
      lastName: resident?.user?.lastName || "",
      username: resident?.user?.username || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      lastName: Yup.string().optional(),
      username: Yup.string()
        .required("El nombre de usuario es requerido")
        .min(3, "Mínimo 3 caracteres"),
    }),
    onSubmit: async (values) => {
      if (!resident?.user?.id) return;
      try {
        const res = await updateUser(resident.user.id, values);
        if (res.success) {
          dispatch(
            showToast({
              message: "Usuario actualizado correctamente",
              type: "success",
            }),
          );
          setIsEditUserOpen(false);
          fetchResident();
        } else {
          dispatch(
            showToast({
              message: res.messages?.[0] || "Error al actualizar usuario",
              type: "error",
            }),
          );
        }
      } catch (error) {
        dispatch(
          showToast({ message: "Error al actualizar usuario", type: "error" }),
        );
      }
    },
  });

  const resetPasswordFormik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, "Mínimo 6 caracteres")
        .required("Requerido"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
        .required("Requerido"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!resident?.user?.id) return;
      try {
        const res = await resetPassword(resident.user.id, values.password);
        if (res.success) {
          dispatch(
            showToast({
              message: "Contraseña restablecida correctamente",
              type: "success",
            }),
          );
          resetForm();
          setIsResetPasswordOpen(false);
        } else {
          dispatch(
            showToast({
              message: res.messages?.[0] || "Error al restablecer contraseña",
              type: "error",
            }),
          );
        }
      } catch (error) {
        dispatch(
          showToast({
            message: "Error al restablecer contraseña",
            type: "error",
          }),
        );
      }
    },
  });

  const handleToggleUserActive = () => {
    setIsConfirmActiveOpen(true);
  };

  const confirmToggleUserActive = async () => {
    if (!resident?.user) return;
    const newActiveState = !resident.user.active;
    const actionText = newActiveState ? "activar" : "desactivar";

    setTogglingActive(true);
    try {
      const res = await updateUser(resident.user.id, {
        active: newActiveState,
      });
      if (res.success) {
        dispatch(
          showToast({
            message: `Usuario ${newActiveState ? "activado" : "desactivado"} correctamente`,
            type: "success",
          }),
        );
        setIsConfirmActiveOpen(false);
        fetchResident();
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || `Error al ${actionText} usuario`,
            type: "error",
          }),
        );
      }
    } catch (error) {
      dispatch(
        showToast({ message: `Error al ${actionText} usuario`, type: "error" }),
      );
    } finally {
      setTogglingActive(false);
    }
  };

  useEffect(() => {
    if (!isResetPasswordOpen) {
      resetPasswordFormik.resetForm();
    }
  }, [isResetPasswordOpen]);

  useEffect(() => {
    if (isEditUserOpen) {
      editUserFormik.resetForm();
    }
  }, [isEditUserOpen]);

  // Fetch Data
  const fetchContacts = async () => {
    if (!resident?.id) return;
    try {
      const res = await getPaginatedContacts({
        page: 1,
        limit: 100,
        filters: { residentId: resident.id },
      });
      setContacts(res.data || []);
    } finally {
      //
    }
  };

  const fetchPayments = async () => {
    if (!resident?.id) return;
    setPaymentsLoading(true);
    try {
      const resPayments = await getPaginatedPayments({
        page: 1,
        limit: 100,
        filters: { residentId: resident.id },
      });
      setPayments(resPayments.data || []);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchResidentFees = async () => {
    if (!resident?.id) return;
    try {
      const res = await getResidentFees(resident.id);
      if (res.success && res.data) {
        setResidentFees(res.data);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchFeesList = async () => {
    try {
      const res = await getFees();
      if (res.success && res.data) {
        setFeesList(res.data);
      }
    } catch {
      /* ignore */
    }
  };

  const handleAssignFee = async () => {
    if (!resident?.id || !selectedFeeId) return;
    const res = await createResidentFee({
      residentId: resident.id,
      feeId: selectedFeeId,
    });
    if (res.success) {
      dispatch(
        showToast({ message: "Cuota asignada correctamente", type: "success" }),
      );
      setIsAssigningFee(false);
      setSelectedFeeId("");
      fetchResidentFees();
      fetchPayments();
    } else {
      dispatch(showToast({ message: "Error al asignar cuota", type: "error" }));
    }
  };

  const handleUnassignFee = async () => {
    if (!feeToUnassignId) return;
    const res = await deleteResidentFee(feeToUnassignId);
    if (res.success) {
      dispatch(showToast({ message: "Cuota desasignada", type: "success" }));
      setFeeToUnassignId(null);
      fetchResidentFees();
    } else {
      dispatch(
        showToast({ message: "Error al desasignar cuota", type: "error" }),
      );
    }
  };

  const handlePayFee = async (paymentId: string) => {
    setLoadingCheckout(true);
    try {
      const res = await createPaymentCheckout(paymentId);
      if (res.success && res.data?.url) {
        window.location.href = res.data.url;
      } else {
        dispatch(
          showToast({ message: "Error al iniciar Checkout", type: "error" }),
        );
      }
    } catch (error) {
      dispatch(showToast({ message: "Error en el servidor", type: "error" }));
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      await downloadReceipt(paymentId);
    } catch {
      dispatch(showToast({ message: "Comprobante no disponible", type: "info" }));
    }
  };

  const fetchResident = async () => {
    if (!id) return;
    try {
      const res = await getResidentById(id);
      if (res.success && res.data) {
        setResident(res.data);
      } else {
        dispatch(
          showToast({ message: "Residente no encontrado", type: "error" }),
        );
        navigate("/residents");
      }
    } catch (error) {
      dispatch(
        showToast({ message: "Error al cargar residente", type: "error" }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResident();
    }
  }, [id]);

  useEffect(() => {
    if (resident?.id) {
      fetchContacts();
      fetchPayments();
      fetchResidentFees();
      fetchFeesList();
      setIsAddingContact(false);
      setEditingContact(null);
    }
  }, [resident?.id]);

  // CONTACTS LOGIC
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
      try {
        let res;
        if (editingContact) {
          res = await updateContact(editingContact.id, values);
        } else {
          res = await createContact({ ...values, residentId: resident!.id });
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
          fetchContacts();
        }
      } catch (error) {
        dispatch(
          showToast({ message: "Error al guardar contacto", type: "error" }),
        );
      }
    },
  });

  const [contactToDeleteId, setContactToDeleteId] = useState<string | null>(
    null,
  );

  const handleDeleteContact = (contactId: string) => {
    setContactToDeleteId(contactId);
  };

  const confirmDeleteContact = async () => {
    if (!contactToDeleteId) return;
    const res = await deleteContact(contactToDeleteId);
    if (res.success) {
      dispatch(showToast({ message: "Contacto eliminado", type: "success" }));
      fetchContacts();
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
      <div className="p-8 flex justify-center items-center h-screen bg-slate-50/30">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!resident) return null;

  return (
    <div className="p-6 md:p-10 min-h-screen bg-slate-50/30 font-sans text-slate-800">
      <ModuleHeader
        title={`Visión 360° - ${resident.user?.name} ${resident.user?.lastName}`}
        subtitle={`@${resident.user?.username} • ${resident.email || "Sin Correo"}`}
        icon={FaUser}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 overflow-hidden min-h-[70vh]">
        <div className="p-4 md:p-8">
          <ITTabs
            variant="line"
            items={[
              {
                id: "info",
                label: "Información General",
                content: (
                  <div className="pt-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      {/* Propiedad Asignada */}
                      <div className="bg-white p-6 rounded-xl border border-slate-100 flex flex-col hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                            <FaBuilding size={18} />
                          </div>
                          <div>
                            <ITText className="text-sm font-semibold text-slate-900">
                              Propiedad Asignada
                            </ITText>
                            <ITText className="text-xs text-slate-500">
                              Dirección Principal
                            </ITText>
                          </div>
                        </div>

                        <div className="space-y-4 w-full flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                            <ITText className="text-xs text-slate-500">
                              Calle / Avenida
                            </ITText>
                            <ITText className="text-sm font-medium text-slate-900">
                              {resident.house?.street || "-"}
                            </ITText>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                            <ITText className="text-xs text-slate-500">
                              Número
                            </ITText>
                            <ITText className="text-sm font-medium text-slate-900">
                              {resident.house?.number
                                ? `#${resident.house.number}`
                                : "-"}
                            </ITText>
                          </div>
                          <div className="flex justify-between items-center pb-1">
                            <ITText className="text-xs text-slate-500">
                              Manzana / Block
                            </ITText>
                            <ITText className="text-sm font-medium text-slate-900">
                              {resident.house?.block || "-"}
                            </ITText>
                          </div>
                        </div>
                      </div>

                      {/* Datos de Contacto */}
                      <div className="bg-white p-6 rounded-xl border border-slate-100 flex flex-col hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                            <FaPhoneAlt size={16} />
                          </div>
                          <div>
                            <ITText className="text-sm font-semibold text-slate-900">
                              Datos de Contacto
                            </ITText>
                            <ITText className="text-xs text-slate-500">
                              Información de Usuario
                            </ITText>
                          </div>
                        </div>

                        <div className="space-y-4 w-full flex-1 flex flex-col justify-center">
                          <div className="flex flex-col gap-1 pb-3 border-b border-slate-50">
                            <ITText className="text-xs text-slate-500">
                              Teléfono Principal
                            </ITText>
                            <ITText className="text-sm font-medium text-slate-900">
                              {resident.phone || "No registrado"}
                            </ITText>
                          </div>
                          <div className="flex flex-col gap-1 pb-1">
                            <ITText className="text-xs text-slate-500">
                              Correo Electrónico
                            </ITText>
                            <ITText className="text-sm font-medium text-slate-900 break-all">
                              {resident.email || "No registrado"}
                            </ITText>
                          </div>
                        </div>
                      </div>

                      {/* Ubicación en el Mapa */}
                      <div className="bg-white p-6 rounded-xl border border-slate-100 flex flex-col hover:border-slate-300 transition-colors min-h-[250px]">
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                              <FaMapMarkerAlt size={18} />
                            </div>
                            <div>
                              <ITText className="text-sm font-semibold text-slate-900">
                                Ubicación
                              </ITText>
                              <ITText className="text-xs text-slate-500">
                                Geográfica
                              </ITText>
                            </div>
                          </div>

                          {resident.house?.latitude &&
                            resident.house?.longitude && (
                              <ITButton
                                onClick={() =>
                                  window.open(
                                    `https://www.google.com/maps/search/?api=1&query=${resident.house?.latitude},${resident.house?.longitude}`,
                                    "_blank",
                                  )
                                }
                                variant="outlined"
                                size="small"
                                className="!rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 !py-1.5 !px-3 !text-xs font-medium"
                              >
                                Abrir Mapa
                              </ITButton>
                            )}
                        </div>

                        {resident.house?.latitude &&
                        resident.house?.longitude ? (
                          <div className="w-full flex-1 rounded-lg overflow-hidden border border-slate-100 min-h-[160px] bg-slate-50">
                            <iframe
                              title="Ubicación de la propiedad"
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              src={`https://maps.google.com/maps?q=${resident.house.latitude},${resident.house.longitude}&z=16&output=embed`}
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg text-center flex-1 min-h-[160px]">
                            <FaMapMarkerAlt
                              className="text-slate-300 mb-3"
                              size={20}
                            />
                            <ITText className="text-sm font-medium text-slate-500 block">
                              Coordenadas no registradas
                            </ITText>
                            <ITText className="text-xs text-slate-400 mt-1 block max-w-[200px] mx-auto">
                              Registra la latitud y longitud en Propiedades.
                            </ITText>
                          </div>
                        )}
                      </div>

                      {/* Cuenta de Usuario */}
                      <div className="bg-white p-6 rounded-xl border border-slate-100 flex flex-col hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                              <FaUser size={18} />
                            </div>
                            <div>
                              <ITText className="text-sm font-semibold text-slate-900">
                                Cuenta de Usuario
                              </ITText>
                              <ITText className="text-xs text-slate-500">
                                Acceso al Portal
                              </ITText>
                            </div>
                          </div>

                          {resident.user && (
                            <ITBadget
                              color={resident.user.active ? "success" : "error"}
                              size="small"
                              className="!rounded-full !px-3 font-medium text-xs"
                            >
                              {resident.user.active ? "Activo" : "Inactivo"}
                            </ITBadget>
                          )}
                        </div>

                        {resident.user ? (
                          <div className="flex-1 flex flex-col justify-between gap-6">
                            <div className="space-y-4 w-full">
                              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                                <ITText className="text-xs text-slate-500">
                                  Usuario
                                </ITText>
                                <ITText className="text-sm font-semibold text-slate-900">
                                  @{resident.user.username}
                                </ITText>
                              </div>
                              <div className="flex justify-between items-center pb-1">
                                <ITText className="text-xs text-slate-500">
                                  Nombre Completo
                                </ITText>
                                <ITText className="text-sm font-medium text-slate-900">
                                  {resident.user.name}{" "}
                                  {resident.user.lastName || ""}
                                </ITText>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-auto">
                              <ITButton
                                onClick={() => setIsEditUserOpen(true)}
                                variant="outlined"
                                size="small"
                                className="!rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 !py-1.5 !px-3 !text-xs font-medium w-full"
                              >
                                Editar
                              </ITButton>
                              <ITButton
                                onClick={() => setIsResetPasswordOpen(true)}
                                variant="outlined"
                                size="small"
                                className="!rounded-md border-slate-200 text-slate-600 hover:bg-slate-50 !py-1.5 !px-3 !text-xs font-medium w-full"
                              >
                                Contraseña
                              </ITButton>
                              <ITButton
                                onClick={handleToggleUserActive}
                                disabled={togglingActive}
                                variant="outlined"
                                size="small"
                                className={`!rounded-md !py-1.5 !px-3 !text-xs font-medium w-full ${
                                  resident.user.active
                                    ? "border-red-200 text-red-600 hover:bg-red-50"
                                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {resident.user.active
                                  ? "Desactivar"
                                  : "Activar"}
                              </ITButton>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-lg text-center flex-1 min-h-[160px]">
                            <FaUser className="text-slate-300 mb-3" size={20} />
                            <ITText className="text-sm font-medium text-slate-500 block">
                              Sin cuenta vinculada
                            </ITText>
                            <ITText className="text-xs text-slate-400 mt-1 block max-w-[200px] mx-auto">
                              Este residente no tiene un usuario para acceder al
                              portal.
                            </ITText>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                id: "contacts",
                label: "Red de Contactos",
                content: (
                  <div className="pt-6 animate-in fade-in duration-300">
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
                          className="!flex !flex-row !items-center !gap-2"
                        >
                          <FaPlus size={12} /> Nuevo Contacto
                        </ITButton>
                      )}
                    </div>

                    {isAddingContact || editingContact ? (
                      <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200">
                        <ITText className="font-semibold text-lg text-slate-900 mb-6">
                          {editingContact
                            ? "Editar Contacto"
                            : "Nuevo Contacto"}
                        </ITText>
                        <form
                          onSubmit={contactFormik.handleSubmit}
                          className="space-y-5"
                        >
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
                                error={
                                  contactFormik.errors.relationship as string
                                }
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
                                onClick={() =>
                                  validityFormik.setFieldValue("unit", "hours")
                                }
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
                                onClick={() =>
                                  validityFormik.setFieldValue("unit", "days")
                                }
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
                                {validityFormik.values.unit === "hours"
                                  ? "Horas"
                                  : "Días"}
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
                ),
              },
              {
                id: "payments",
                label: "Estado de Cuenta",
                content: (
                  <div className="pt-6 animate-in fade-in duration-300">

                    {/* ════════════════════════════════════════════════
                       CARGOS ÚNICOS
                    ════════════════════════════════════════════════ */}
                    <div className="mb-12">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <ITText className="text-base font-semibold text-slate-900">
                            Cargos Únicos
                          </ITText>
                          <ITText className="text-xs text-slate-400 mt-0.5">
                            Cobros de una sola vez
                          </ITText>
                        </div>
                        {!isAddingPayment && (
                          <ITButton
                            onClick={() => setIsAddingPayment(true)}
                            size="small"
                            variant="filled"
                            color="primary"
                            className="!flex !flex-row !items-center !gap-2"
                          >
                            <FaPlus size={12} /> Nuevo Cargo
                          </ITButton>
                        )}
                      </div>

                      {isAddingPayment && (
                        <ITDialog
                          isOpen={isAddingPayment}
                          onClose={() => setIsAddingPayment(false)}
                          title="Generar Cargo Manual"
                        >
                          <form
                            onSubmit={paymentFormik.handleSubmit}
                            className="p-6 space-y-5"
                          >
                            <div className="flex flex-col gap-2">
                              <ITText className="text-sm font-medium text-slate-700">
                                Concepto
                              </ITText>
                              <ITInput
                                name="name"
                                placeholder="Ej. Cuota de Mantenimiento"
                                value={paymentFormik.values.name}
                                onChange={paymentFormik.handleChange}
                                onBlur={paymentFormik.handleBlur}
                                error={paymentFormik.errors.name as string}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <ITText className="text-sm font-medium text-slate-700">
                                Monto (MXN)
                              </ITText>
                              <ITInput
                                name="amount"
                                type="number"
                                placeholder="0.00"
                                currencyFormat
                                value={paymentFormik.values.amount}
                                onChange={paymentFormik.handleChange}
                                onBlur={paymentFormik.handleBlur}
                                error={paymentFormik.errors.amount as string}
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                              <ITButton
                                type="button"
                                variant="ghost"
                                onClick={() => setIsAddingPayment(false)}
                                className="px-6 text-slate-500 font-medium hover:bg-slate-50 !rounded-lg"
                              >
                                Cancelar
                              </ITButton>
                              <ITButton
                                type="submit"
                                className="px-8 !rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium"
                              >
                                Generar Cargo
                              </ITButton>
                            </div>
                          </form>
                        </ITDialog>
                      )}

                      {paymentsLoading ? (
                        <div className="flex justify-center py-20">
                          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : payments.filter((p) => p.fee?.type === "ONE_TIME").length === 0 ? (
                        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <ITText className="text-slate-500 font-medium text-sm">
                            Sin cargos únicos
                          </ITText>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {payments
                            .filter((p) => p.fee?.type === "ONE_TIME")
                            .map((p) => (
                              <div
                                key={p.id}
                                className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      p.status === "PAID"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : p.status === "PENDING"
                                          ? "bg-amber-50 text-amber-600"
                                          : "bg-red-50 text-red-600"
                                    }`}
                                  >
                                    <FaMoneyBill size={15} />
                                  </div>
                                  <div>
                                    <ITText className="font-semibold text-slate-900 text-sm">
                                      {p.fee?.name}
                                    </ITText>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <ITText className="text-sm font-bold text-slate-700">
                                        {formatCurrency(p.amount)}
                                      </ITText>
                                      {p.status === "PAID" && (
                                        <>
                                          <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                          <ITText className="text-emerald-600 text-[10px] font-bold font-mono tracking-widest uppercase">
                                            Folio {p.id.slice(0, 8).toUpperCase()}
                                          </ITText>
                                        </>
                                      )}
                                    </div>
                                    <ITText className="text-[10px] text-slate-400 mt-0.5">
                                      {p.paidAt
                                        ? `Pagado ${dayjs(p.paidAt).format("DD MMM YYYY")}`
                                        : "Pendiente"}
                                    </ITText>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ITBadget
                                    color={
                                      p.status === "PAID"
                                        ? "success"
                                        : p.status === "PENDING"
                                          ? "warning"
                                          : "error"
                                    }
                                    size="small"
                                    className="!rounded-full !px-2.5 font-medium text-[10px]"
                                  >
                                    {p.status === "PAID"
                                      ? "Pagado"
                                      : p.status === "PENDING"
                                        ? "Pendiente"
                                        : "Cancelado"}
                                  </ITBadget>
                                  {p.status === "PAID" && (
                                    <ITButton
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleDownloadReceipt(p.id)}
                                      className="border-slate-200 text-slate-500 !px-2.5"
                                      title="Descargar comprobante"
                                    >
                                      <FaDownload size={11} />
                                    </ITButton>
                                  )}
                                  {p.status === "PENDING" && (
                                    <ITButton
                                      size="small"
                                      onClick={() => handlePayFee(p.id)}
                                      disabled={loadingCheckout}
                                      className="!rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium px-4 text-xs transition-colors"
                                    >
                                      Pagar ahora
                                    </ITButton>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* ════════════════════════════════════════════════
                       CUOTAS RECURRENTES
                    ════════════════════════════════════════════════ */}
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <ITText className="text-base font-semibold text-slate-900">
                            Cuotas Recurrentes
                          </ITText>
                          <ITText className="text-xs text-slate-400 mt-0.5">
                            Mensualidades asignadas al residente
                          </ITText>
                        </div>
                        {!isAssigningFee && (
                          <ITButton
                            onClick={() => setIsAssigningFee(true)}
                            size="small"
                            variant="outlined"
                            className="!flex !flex-row !items-center !gap-2 border-slate-200 text-slate-600"
                          >
                            <FaPlus size={10} /> Asignar Cuota
                          </ITButton>
                        )}
                      </div>

                      {isAssigningFee && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex items-end gap-4">
                          <div className="flex-1 flex flex-col gap-1.5">
                            <ITText className="text-xs font-medium text-slate-700">
                              Seleccionar Cuota
                            </ITText>
                            <select
                              value={selectedFeeId}
                              onChange={(e) => setSelectedFeeId(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-slate-900 transition-colors"
                            >
                              <option value="">-- Seleccionar --</option>
                              {feesList.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name} - {formatCurrency(f.amount)} (
                                  {f.type === "MONTHLY" ? "Mensual" : "Único"})
                                </option>
                              ))}
                            </select>
                          </div>
                          <ITButton
                            onClick={handleAssignFee}
                            disabled={!selectedFeeId}
                            size="small"
                            variant="filled"
                            color="primary"
                          >
                            Guardar
                          </ITButton>
                          <ITButton
                            onClick={() => {
                              setIsAssigningFee(false);
                              setSelectedFeeId("");
                            }}
                            size="small"
                            variant="ghost"
                          >
                            Cancelar
                          </ITButton>
                        </div>
                      )}

                      {residentFees.length === 0 ? (
                        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <ITText className="text-slate-500 font-medium text-sm">
                            Sin cuotas recurrentes asignadas
                          </ITText>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {residentFees.map((rf) => {
                            const monthlyPays = payments.filter(
                              (p) => p.feeId === rf.feeId && p.fee?.type === "MONTHLY"
                            );
                            const latestPay = monthlyPays[0];

                            return (
                              <div
                                key={rf.id}
                                className="bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                      <FaMoneyBill size={15} />
                                    </div>
                                    <div>
                                      <ITText className="font-semibold text-slate-900 text-sm">
                                        {rf.fee?.name}
                                      </ITText>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <ITText className="font-bold text-slate-700 text-sm">
                                          {rf.fee ? formatCurrency(rf.fee.amount) : ""}
                                        </ITText>
                                        <span className="text-slate-300 text-[10px]">•</span>
                                        <ITText className="text-[10px] text-slate-400 font-medium">
                                          Mensual
                                        </ITText>
                                      </div>
                                    </div>
                                  </div>
                                  <ITButton
                                    size="small"
                                    variant="outlined"
                                    color="danger"
                                    onClick={() => setFeeToUnassignId(rf.id)}
                                    title="Desasignar"
                                  >
                                    <FaTrash size={10} />
                                  </ITButton>
                                </div>

                                {/* Monthly payments for this fee */}
                                {monthlyPays.length > 0 && (
                                  <div className="mt-4 pt-3 border-t border-slate-50 space-y-2">
                                    {monthlyPays.slice(0, 6).map((p) => (
                                      <div
                                        key={p.id}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50/70"
                                      >
                                        <div className="flex items-center gap-3">
                                          <ITText className="text-xs font-medium text-slate-600 min-w-[90px]">
                                            {p.period
                                              ? dayjs(p.period, "YYYY-MM").format("MMMM YYYY")
                                              : "—"}
                                          </ITText>
                                          <ITText className="text-xs font-bold text-slate-700">
                                            {formatCurrency(p.amount)}
                                          </ITText>
                                          {p.status === "PAID" && (
                                            <ITText className="text-emerald-600 text-[9px] font-bold font-mono tracking-widest uppercase">
                                              Folio {p.id.slice(0, 8).toUpperCase()}
                                            </ITText>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <ITBadget
                                            color={
                                              p.status === "PAID"
                                                ? "success"
                                                : p.status === "PENDING"
                                                  ? "warning"
                                                  : "error"
                                            }
                                            size="small"
                                            className="!rounded-full !px-2 font-medium text-[9px]"
                                          >
                                            {p.status === "PAID"
                                              ? "Pagado"
                                              : p.status === "PENDING"
                                                ? "Pendiente"
                                                : "Cancelado"}
                                          </ITBadget>
                                          {p.status === "PAID" && (
                                            <ITButton
                                              size="small"
                                              variant="outlined"
                                              onClick={() => handleDownloadReceipt(p.id)}
                                              className="border-slate-200 text-slate-500 !px-2"
                                              title="Descargar comprobante"
                                            >
                                              <FaDownload size={10} />
                                            </ITButton>
                                          )}
                                          {p.status === "PENDING" && (
                                            <ITButton
                                              size="small"
                                              onClick={() => handlePayFee(p.id)}
                                              disabled={loadingCheckout}
                                              className="!rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium px-3 text-[10px] transition-colors whitespace-nowrap"
                                            >
                                              Pagar ahora
                                            </ITButton>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <AccessTicketOverlay
        isOpen={!!createdAccess}
        onClose={() => {
          setCreatedAccess(null);
          setQrCodeUrl("");
        }}
        access={createdAccess}
        qrCodeUrl={qrCodeUrl}
      />

      {/* Modal Editar Usuario */}
      {resident.user && (
        <ITDialog
          isOpen={isEditUserOpen}
          onClose={() => setIsEditUserOpen(false)}
          title="Editar Usuario del Residente"
          className="!w-full !max-w-lg"
        >
          <form
            onSubmit={editUserFormik.handleSubmit}
            className="p-6 space-y-6"
          >
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <ITText className="text-sm font-medium text-slate-700">
                  Nombre
                </ITText>
                <ITInput
                  name="name"
                  placeholder="Ej. Juan"
                  value={editUserFormik.values.name}
                  onChange={editUserFormik.handleChange}
                  onBlur={editUserFormik.handleBlur}
                  error={
                    editUserFormik.touched.name
                      ? editUserFormik.errors.name
                      : undefined
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <ITText className="text-sm font-medium text-slate-700">
                  Apellidos
                </ITText>
                <ITInput
                  name="lastName"
                  placeholder="Ej. Pérez"
                  value={editUserFormik.values.lastName}
                  onChange={editUserFormik.handleChange}
                  onBlur={editUserFormik.handleBlur}
                  error={
                    editUserFormik.touched.lastName
                      ? editUserFormik.errors.lastName
                      : undefined
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <ITText className="text-sm font-medium text-slate-700">
                  Nombre de Usuario (Log-in)
                </ITText>
                <ITInput
                  name="username"
                  placeholder="Ej. juan.perez"
                  value={editUserFormik.values.username}
                  onChange={editUserFormik.handleChange}
                  onBlur={editUserFormik.handleBlur}
                  error={
                    editUserFormik.touched.username
                      ? editUserFormik.errors.username
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <ITButton
                type="button"
                variant="outlined"
                onClick={() => setIsEditUserOpen(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 !rounded-lg font-medium"
              >
                Cancelar
              </ITButton>
              <ITButton
                type="submit"
                className="bg-slate-900 text-white hover:bg-slate-800 !rounded-lg font-medium"
              >
                Guardar Cambios
              </ITButton>
            </div>
          </form>
        </ITDialog>
      )}

      {/* Modal Cambiar Contraseña */}
      {resident.user && (
        <ITDialog
          isOpen={isResetPasswordOpen}
          onClose={() => setIsResetPasswordOpen(false)}
          title="Cambiar Contraseña"
          className="!w-full !max-w-lg"
        >
          <form
            onSubmit={resetPasswordFormik.handleSubmit}
            className="p-6 space-y-6"
          >
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
              <ITText className="text-xs text-slate-500 block mb-1">
                Usuario objetivo:
              </ITText>
              <ITText className="text-sm font-semibold text-slate-900 block">
                @{resident.user.username} ({resident.user.name}{" "}
                {resident.user.lastName})
              </ITText>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <ITText className="text-sm font-medium text-slate-700">
                  Nueva Contraseña
                </ITText>
                <ITInput
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={resetPasswordFormik.values.password}
                  onChange={resetPasswordFormik.handleChange}
                  onBlur={resetPasswordFormik.handleBlur}
                  error={
                    resetPasswordFormik.touched.password
                      ? resetPasswordFormik.errors.password
                      : undefined
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <ITText className="text-sm font-medium text-slate-700">
                  Confirmar Contraseña
                </ITText>
                <ITInput
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={resetPasswordFormik.values.confirmPassword}
                  onChange={resetPasswordFormik.handleChange}
                  onBlur={resetPasswordFormik.handleBlur}
                  error={
                    resetPasswordFormik.touched.confirmPassword
                      ? resetPasswordFormik.errors.confirmPassword
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <ITButton
                type="button"
                variant="outlined"
                onClick={() => setIsResetPasswordOpen(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 !rounded-lg font-medium"
              >
                Cancelar
              </ITButton>
              <ITButton
                type="submit"
                className="bg-slate-900 text-white hover:bg-slate-800 !rounded-lg font-medium"
              >
                Actualizar Contraseña
              </ITButton>
            </div>
          </form>
        </ITDialog>
      )}

      {/* Modal Confirmación Activar/Desactivar */}
      {resident.user && (
        <ITDialog
          isOpen={isConfirmActiveOpen}
          onClose={() => setIsConfirmActiveOpen(false)}
          title="Confirmar Acción"
          className="!w-full !max-w-md"
        >
          <div className="p-6 space-y-6">
            <ITText className="text-sm text-slate-600">
              ¿Seguro de {resident.user.active ? "desactivar" : "activar"} a
              este usuario?
            </ITText>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <ITButton
                type="button"
                variant="outlined"
                onClick={() => setIsConfirmActiveOpen(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-50 !rounded-lg font-medium"
              >
                Cancelar
              </ITButton>
              <ITButton
                onClick={confirmToggleUserActive}
                disabled={togglingActive}
                className={`${
                  resident.user.active
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } text-white !rounded-lg font-medium px-6`}
              >
                Aceptar
              </ITButton>
            </div>
          </div>
        </ITDialog>
      )}

      <ITDialog
        isOpen={!!contactToDeleteId}
        onClose={() => setContactToDeleteId(null)}
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

      <ITDialog
        isOpen={!!feeToUnassignId}
        onClose={() => setFeeToUnassignId(null)}
        title="Desasignar Cuota"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Desasignar Cuota?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            El residente ya no tendrá esta cuota asignada.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setFeeToUnassignId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={handleUnassignFee}
            >
              DESASIGNAR
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};
export default ResidentDetailPage;

import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDataTableFetchParams,
  ITDialog,
  ITInput,
  ITText,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import QRCode from "qrcode";
import { useCallback, useState, useEffect } from "react";
import {
  FaCheck,
  FaKey,
  FaQrcode,
  FaSignOutAlt,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";
import { getMyResidentProfile } from "@app/modules/residents/services/ResidentsService";
import { ResidentQuickAccessDialog } from "@app/modules/residents/components/ResidentQuickAccessDialog";
import {
  AccessResponse,
  deleteAccess,
  getPaginatedAccesses,
  updateAccess,
} from "../services/AccessesService";
import { AccessTicketOverlay } from "@app/core/components/AccessTicketOverlay";

const AccessesPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isResident = auth.role === "RESDN";
  const [myResident, setMyResident] = useState<any>(null);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isResident) {
      loadMyResident();
    }
  }, [isResident]);

  const loadMyResident = async () => {
    const res = await getMyResidentProfile();
    if (res.success && res.data) {
      setMyResident(res.data);
    }
  };

  // Modal for viewing QR code pass details
  const [selectedAccess, setSelectedAccess] = useState<AccessResponse | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [accessToDeleteId, setAccessToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action states
  const [accessToValidate, setAccessToValidate] = useState<AccessResponse | null>(null);
  const [accessToReject, setAccessToReject] = useState<AccessResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [accessToExit, setAccessToExit] = useState<AccessResponse | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");

  const handleValidateEntry = async (access: AccessResponse) => {
    setAccessToValidate(access);
    setEnteredCode("AXZ-");
  };

  const handleCodeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    let val = e.target.value.toUpperCase();
    if (!val.startsWith("AXZ-")) {
      if (val.length < 4) {
        val = "AXZ-";
      } else {
        val = "AXZ-" + val.replace(/^AXZ-?/i, "");
      }
    }
    setEnteredCode(val);
  };

  const isCodeValid = enteredCode === accessToValidate?.qrCode;

  const handleRejectEntry = async (access: AccessResponse) => {
    setAccessToReject(access);
    setRejectionReason("");
  };

  const handleRegisterExit = async (access: AccessResponse) => {
    setAccessToExit(access);
  };

  const confirmValidateEntry = async () => {
    if (!accessToValidate || isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      const res = await updateAccess(accessToValidate.id, {
        status: "ACTIVE",
        used: true,
      });
      if (res.success) {
        dispatch(
          showToast({
            message: "Entrada registrada con éxito",
            type: "success",
          }),
        );
        refreshTable();
        setAccessToValidate(null);
      }
    } catch (error) {
      dispatch(
        showToast({ message: "Error al registrar entrada", type: "error" }),
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  const confirmRejectEntry = async () => {
    if (!accessToReject || isProcessingAction) return;
    if (!rejectionReason.trim()) {
      dispatch(
        showToast({
          message: "Debe ingresar un motivo de rechazo",
          type: "warning",
        }),
      );
      return;
    }
    setIsProcessingAction(true);
    try {
      const res = await updateAccess(accessToReject.id, {
        status: "REJECTED",
        rejectionReason: rejectionReason.trim(),
      });
      if (res.success) {
        dispatch(
          showToast({ message: "Pase rechazado con éxito", type: "success" }),
        );
        refreshTable();
        setAccessToReject(null);
        setRejectionReason("");
      }
    } catch (error) {
      dispatch(showToast({ message: "Error al rechazar pase", type: "error" }));
    } finally {
      setIsProcessingAction(false);
    }
  };

  const confirmRegisterExit = async () => {
    if (!accessToExit || isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      const res = await updateAccess(accessToExit.id, {
        status: "FINISHED",
      });
      if (res.success) {
        dispatch(
          showToast({
            message: "Salida registrada con éxito",
            type: "success",
          }),
        );
        refreshTable();
        setAccessToExit(null);
      }
    } catch (error) {
      dispatch(
        showToast({ message: "Error al registrar salida", type: "error" }),
      );
    } finally {
      setIsProcessingAction(false);
    }
  };

  const memoizedFetch = useCallback(
    async (params: ITDataTableFetchParams): Promise<any> => {
      const filters: Record<string, string | number | boolean> = {};
      if (searchTerm) filters.search = searchTerm;

      const res = await getPaginatedAccesses({
        ...params,
        filters: { ...params.filters, ...filters },
      });
      return { data: res.data, total: res.total };
    },
    [searchTerm],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleShowQR = async (access: AccessResponse) => {
    try {
      const payload = access.qrCode || "";

      const url = await QRCode.toDataURL(payload, {
        width: 512,
        margin: 2,
        color: {
          dark: "#0b0c10", // Dark Navy/Black
          light: "#ffffff",
        },
      });
      setQrCodeUrl(url);
      setSelectedAccess(access);
    } catch (e) {
      dispatch(
        showToast({ message: "Error al generar el código QR", type: "error" }),
      );
    }
  };

  const confirmDelete = async () => {
    if (!accessToDeleteId || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await deleteAccess(accessToDeleteId);
      if (res.success) {
        dispatch(
          showToast({ message: "Pase de acceso eliminado", type: "success" }),
        );
        refreshTable();
        setAccessToDeleteId(null);
      }
    } catch (error) {
      dispatch(
        showToast({
          message: "Error al eliminar pase de acceso",
          type: "error",
        }),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (row: AccessResponse) => {
    const now = dayjs();
    const until = dayjs(row.validUntil);

    if (row.status === "ACTIVE") {
      return <ITBadget color="success" size="small" label="DENTRO" />;
    }
    if (row.status === "FINISHED") {
      return <ITBadget color="secondary" size="small" label="COMPLETADO" />;
    }
    if (row.status === "REJECTED") {
      return <ITBadget color="danger" size="small" label="RECHAZADO" />;
    }
    if (row.status === "EXPIRED" || now.isAfter(until)) {
      return <ITBadget color="danger" size="small" label="EXPIRADO" />;
    }

    return <ITBadget color="primary" size="small" label="VÁLIDO" />;
  };

  const formatAccessType = (type: string) => {
    switch (type) {
      case "TEMPORARY":
        return "TEMPORAL";
      case "RECURRING":
        return "RECURRENTE";
      case "DELIVERY":
        return "DELIVERY / SERVICIO";
      case "SERVICE":
        return "SERVICIOS PÚBLICOS";
      default:
        return type;
    }
  };

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Control de Accesos"
        subtitle="Registro de pases generados, códigos QR activos y registros de entradas/salidas"
        icon={FaKey}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR VISITANTE...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        extraFilter={
          isResident ? (
            <ITButton
              variant="filled"
              onClick={() => setIsQuickAccessOpen(true)}
              className="!rounded-xl shadow-sm bg-indigo-500 !text-white hover:bg-indigo-600"
            >
              Generar Pase QR
            </ITButton>
          ) : undefined
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<AccessResponse & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetch}
          defaultItemsPerPage={10}
          title=""
          columns={[
            {
              key: "visitor",
              label: "INVITADO / VISITANTE",
              type: "string",
              render: (row: AccessResponse) => (
                <div className="flex flex-col">
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                    {row.visitor?.name || "SIN NOMBRE"}
                  </ITText>
                  <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                    TEL: {row.visitor?.phone || "S/T"}
                  </ITText>
                </div>
              ),
            },
            {
              key: "destination",
              label: "DESTINO / AUTORIZA",
              type: "string",
              render: (row: AccessResponse) => (
                <div className="flex flex-col">
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                    Casa {row.resident?.house?.street}{" "}
                    {row.resident?.house?.number}
                  </ITText>
                  <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                    Autorizó: {row.resident?.user?.name}{" "}
                    {row.resident?.user?.lastName || ""}
                  </ITText>
                </div>
              ),
            },
            {
              key: "type",
              label: "TIPO & CÓDIGO",
              type: "string",
              render: (row: AccessResponse) => (
                <div className="flex flex-col">
                  <ITText className="font-black text-slate-600 text-[11px] uppercase tracking-tight mb-1">
                    {formatAccessType(row.type)}
                  </ITText>
                  <ITText className="text-indigo-600 text-[9px] font-black uppercase tracking-widest">
                    CÓD: {row.qrCode || "SIN CÓDIGO"}
                  </ITText>
                </div>
              ),
            },
            {
              key: "validity",
              label: "VIGENCIA DEL PASE",
              type: "string",
              render: (row: AccessResponse) => (
                <div className="flex flex-col">
                  <ITText className="font-semibold text-slate-600 text-[10px] uppercase">
                    Inicio: {dayjs(row.validFrom).format("DD/MM/YYYY HH:mm")}
                  </ITText>
                  <ITText className="font-semibold text-slate-400 text-[10px] uppercase mt-0.5">
                    Fin: {dayjs(row.validUntil).format("DD/MM/YYYY HH:mm")}
                  </ITText>
                </div>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              type: "string",
              render: (row: AccessResponse) => (
                <div className="flex flex-col">
                  {getStatusBadge(row)}
                  {row.rejectionReason && (
                    <ITText className="text-red-500 text-[9px] font-black mt-1.5 max-w-[150px] leading-tight break-words uppercase">
                      Motivo: {row.rejectionReason}
                    </ITText>
                  )}
                </div>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              render: (row: AccessResponse) => (
                <div className="flex items-center gap-2">
                  <ITButton
                    onClick={() => handleShowQR(row)}
                    size="small"
                    variant="outlined"
                    color="success"
                    title="Ver Código QR"
                  >
                    <FaQrcode size={14} />
                  </ITButton>

                  {row.status === "PENDING" &&
                    !dayjs().isAfter(dayjs(row.validUntil)) &&
                    !isResident && (
                      <>
                        <ITButton
                          onClick={() => handleValidateEntry(row)}
                          size="small"
                          variant="outlined"
                          color="primary"
                          title="Validar Entrada"
                        >
                          <FaCheck size={14} />
                        </ITButton>
                        <ITButton
                          onClick={() => handleRejectEntry(row)}
                          size="small"
                          variant="outlined"
                          color="danger"
                          title="Rechazar Entrada"
                        >
                          <FaTimes size={14} />
                        </ITButton>
                      </>
                    )}

                  {row.status === "ACTIVE" && !isResident && (
                    <ITButton
                      onClick={() => handleRegisterExit(row)}
                      size="small"
                      variant="outlined"
                      color="warning"
                      title="Registrar Salida"
                    >
                      <FaSignOutAlt size={14} />
                    </ITButton>
                  )}

                  <ITButton
                    onClick={() => setAccessToDeleteId(row.id)}
                    size="small"
                    variant="outlined"
                    color="danger"
                    title="Eliminar Pase"
                  >
                    <FaTrash size={14} />
                  </ITButton>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* VIEW QR TICKET OVERLAY */}
      <AccessTicketOverlay
        isOpen={!!selectedAccess}
        onClose={() => {
          setSelectedAccess(null);
          setQrCodeUrl("");
        }}
        access={selectedAccess}
        qrCodeUrl={qrCodeUrl}
      />

      {/* DELETE DIALOG */}
      <ITDialog
        isOpen={!!accessToDeleteId}
        onClose={() => setAccessToDeleteId(null)}
        title="Eliminar Pase"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Pase de Acceso?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            El código QR asociado dejará de ser válido de inmediato.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setAccessToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "ELIMINAR AHORA"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* VALIDATE ENTRY DIALOG */}
      <ITDialog
        isOpen={!!accessToValidate}
        onClose={() => setAccessToValidate(null)}
        title="Confirmar Entrada"
      >
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <ITText className="text-slate-700 block text-sm font-semibold uppercase tracking-wide">
              ¿Estás seguro de registrar la entrada de{" "}
              <span className="font-black text-slate-800">
                {accessToValidate?.visitor?.name}
              </span>
              ?
            </ITText>
            <ITText className="text-slate-400 block text-xs">
              Para continuar, ingresa el código del pase de acceso.
            </ITText>
          </div>

          <ITInput
            name="validationCode"
            label="Código de Acceso"
            placeholder="Ej. AXZ-A0FC09"
            value={enteredCode}
            onChange={handleCodeChange}
            required
            error={
              enteredCode.length >= 10 && !isCodeValid
                ? "El código ingresado no coincide con el pase"
                : undefined
            }
            variant={isCodeValid ? "success" : "primary"}
          />

          <div className="flex justify-end gap-3 pt-2">
            <ITButton
              variant="outlined"
              onClick={() => setAccessToValidate(null)}
              color="secondary"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              onClick={confirmValidateEntry}
              disabled={isProcessingAction || !isCodeValid}
            >
              {isProcessingAction ? "Procesando..." : "Confirmar Entrada"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* REJECT ENTRY DIALOG */}
      <ITDialog
        isOpen={!!accessToReject}
        onClose={() => setAccessToReject(null)}
        title="Rechazar Entrada"
      >
        <div className="p-6 space-y-6">
          <ITText className="text-slate-700 block text-sm font-semibold uppercase tracking-wide">
            Especifica el motivo de rechazo para la visita de{" "}
            <span className="font-black text-slate-800">
              {accessToReject?.visitor?.name}
            </span>
            :
          </ITText>
          <ITInput
            name="rejectionReason"
            label="Motivo de Rechazo"
            placeholder="Ej. No coincide identificación, Propietario no autoriza, etc."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <ITButton
              variant="outlined"
              onClick={() => setAccessToReject(null)}
              color="secondary"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              onClick={confirmRejectEntry}
              disabled={isProcessingAction}
            >
              {isProcessingAction ? "Procesando..." : "Rechazar Entrada"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* REGISTER EXIT DIALOG */}
      <ITDialog
        isOpen={!!accessToExit}
        onClose={() => setAccessToExit(null)}
        title="Confirmar Salida"
      >
        <div className="p-6">
          <ITText className="text-slate-700 mb-6 block text-sm font-semibold uppercase tracking-wide">
            ¿Estás seguro de registrar la salida de{" "}
            <span className="font-black text-slate-800">
              {accessToExit?.visitor?.name}
            </span>
            ?
          </ITText>
          <div className="flex justify-end gap-3">
            <ITButton
              variant="outlined"
              onClick={() => setAccessToExit(null)}
              color="secondary"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="warning"
              onClick={confirmRegisterExit}
              disabled={isProcessingAction}
            >
              {isProcessingAction ? "Procesando..." : "Confirmar Salida"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {myResident && (
        <ResidentQuickAccessDialog
          isOpen={isQuickAccessOpen}
          onClose={() => {
            setIsQuickAccessOpen(false);
            refreshTable();
          }}
          resident={myResident}
        />
      )}
    </div>
  );
};

export default AccessesPage;

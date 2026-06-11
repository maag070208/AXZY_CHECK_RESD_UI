import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITText,
  ITTripleFilter,
  ITInput,
  ITSelect,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { FaPlus, FaEye, FaTrash, FaExclamationCircle, FaComment } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { showLoader, hideLoader } from "@app/core/store/loader/loader.slice";
import { useFormik } from "formik";
import * as Yup from "yup";
import Ably from "ably";
import {
  ComplaintResponse,
  ComplaintCategoryResponse,
  getPaginatedComplaints,
  getComplaintCategories,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintById,
} from "../services/ComplaintsService";
import ComplaintDetailModal, { getStatusBadge } from "../components/ComplaintDetailModal";

const ComplaintsPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isResident = auth.role === "RESDN";
  const isAdmin = auth.role === "ADMIN" || auth.role === "LIDER";

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categories, setCategories] = useState<ComplaintCategoryResponse[]>([]);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintResponse | null>(null);
  const [complaintToDeleteId, setComplaintToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const ablyClientRef = useRef<Ably.Realtime | null>(null);
  const selectedComplaintIdRef = useRef<string | null>(null);

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const { palette } = useITTheme();
  const primaryHex = palette?.primary || "#065911";

  const totalUnread = useMemo(() => {
    return Object.values(unreadCounts).reduce((acc, c) => acc + c, 0);
  }, [unreadCounts]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [statusFilter]);

  useEffect(() => {
    selectedComplaintIdRef.current = selectedComplaint?.id ?? null;
  }, [selectedComplaint?.id]);

  useEffect(() => {
    const ablyKey = import.meta.env.VITE_ABLY_KEY;
    if (!ablyKey) return;

    ablyClientRef.current = new Ably.Realtime({ key: ablyKey });
    const updatesChannel = ablyClientRef.current.channels.get("complaint:updates");

    const handler = (msg: any) => {
      const { complaintId } = msg.data;
      if (!complaintId) return;
      if (complaintId === selectedComplaintIdRef.current) return;

      setUnreadCounts((prev) => {
        const next = { ...prev };
        next[complaintId] = (next[complaintId] || 0) + 1;
        return next;
      });
    };

    updatesChannel.subscribe(handler);

    return () => {
      updatesChannel.unsubscribe();
      ablyClientRef.current?.close();
      ablyClientRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (selectedComplaint?.id) {
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[selectedComplaint.id];
        return next;
      });
    }
  }, [selectedComplaint?.id]);

  const loadCategories = async () => {
    const res = await getComplaintCategories();
    if (res.success && res.data) {
      setCategories(res.data);
    }
  };

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};
    if (searchTerm.trim()) f.search = searchTerm.trim();
    if (statusFilter !== "ALL") f.status = statusFilter;
    return f;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedComplaints({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
    },
    [externalFilters]
  );

  const handleCreateComplaint = async (values: {
    categoryId: string;
    title: string;
    description: string;
  }) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    dispatch(showLoader());
    const res = await createComplaint(values);
    dispatch(hideLoader());
    setIsSubmitting(false);
    if (res.success) {
      dispatch(
        showToast({ message: "Queja registrada con éxito", type: "success" })
      );
      setIsCreateOpen(false);
      createFormik.resetForm();
      refreshTable();
    } else {
      dispatch(
        showToast({
          message: res.messages[0] || "Error al registrar la queja",
          type: "error",
        })
      );
    }
  };

  const createFormik = useFormik({
    initialValues: {
      categoryId: "",
      title: "",
      description: "",
    },
    validationSchema: Yup.object({
      categoryId: Yup.string().required("La categoría es requerida"),
      title: Yup.string().required("El título es requerido"),
      description: Yup.string().required("La descripción es requerida"),
    }),
    onSubmit: handleCreateComplaint,
  });

  const handleUpdateStatus = async (status: string) => {
    if (!selectedComplaint || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    dispatch(showLoader());
    const res = await updateComplaint(selectedComplaint.id, { status: status as ComplaintResponse["status"] });
    dispatch(hideLoader());
    setIsUpdatingStatus(false);
    if (res.success && res.data) {
      dispatch(
        showToast({ message: "Estado de queja actualizado", type: "success" })
      );
      setSelectedComplaint(res.data);
      refreshTable();
    } else {
      dispatch(
        showToast({ message: "Error al actualizar estado", type: "error" })
      );
    }
  };

  const confirmDelete = async () => {
    if (!complaintToDeleteId || isDeleting) return;
    setIsDeleting(true);
    dispatch(showLoader());
    const res = await deleteComplaint(complaintToDeleteId);
    dispatch(hideLoader());
    setIsDeleting(false);
    if (res.success) {
      dispatch(
        showToast({ message: "Queja eliminada con éxito", type: "success" })
      );
      setComplaintToDeleteId(null);
      if (selectedComplaint?.id === complaintToDeleteId) {
        setSelectedComplaint(null);
      }
      refreshTable();
    } else {
      dispatch(
        showToast({ message: "Error al eliminar la queja", type: "error" })
      );
    }
  };

  const columns = useMemo(() => {
    const cols = [
      {
        key: "title",
        label: "ASUNTO / QUEJA",
        render: (row: ComplaintResponse) => (
          <div className="flex flex-col max-w-sm">
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 line-clamp-1">
              {row.title}
            </ITText>
            <div className="flex items-center gap-2">
              <ITBadget
                color="primary"
                variant="outlined"
                className="!text-[8px] !px-1.5 !py-0.5 !h-auto font-bold uppercase tracking-wider"
              >
                {row.category?.name || "CATEGORÍA"}
              </ITBadget>
              <ITText className="text-slate-400 text-[9px] font-bold">
                {dayjs(row.createdAt).format("DD/MM/YYYY HH:mm")}
              </ITText>
            </div>
          </div>
        ),
      },
    ];

    if (!isResident) {
      cols.push({
        key: "resident",
        label: "RESIDENTE",
        render: (row: ComplaintResponse) => (
          <div className="flex flex-col">
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.resident?.user?.name} {row.resident?.user?.lastName}
            </ITText>
            <ITText className="text-slate-400 text-[9px] font-bold">
              TEL: {row.resident?.phone || "S/T"}
            </ITText>
          </div>
        ),
      });
    }

    cols.push(
      {
        key: "status",
        label: "ESTADO",
        render: (row: ComplaintResponse) => getStatusBadge(row.status),
      },
      {
        key: "actions",
        label: "ACCIONES",
        render: (row: ComplaintResponse) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => setSelectedComplaint(row)}
              variant="outlined"
              size="small"
              title="Ver detalle"
              className="!rounded-xl !p-2 w-9 h-9 flex items-center justify-center"
            >
              <FaEye size={12} />
            </ITButton>
            {(isAdmin || (isResident && row.status === "OPEN")) && (
              <ITButton
                onClick={() => setComplaintToDeleteId(row.id)}
                variant="outlined"
                color="danger"
                size="small"
                title="Eliminar Queja"
                className="!rounded-xl !p-2 w-9 h-9 flex items-center justify-center"
              >
                <FaTrash size={12} />
              </ITButton>
            )}
          </div>
        ),
      }
    );

    return cols;
  }, [isResident, isAdmin]);

  const selectCategoriesOptions = useMemo(() => {
    return categories.map((c) => ({
      label: c.name.toUpperCase(),
      value: c.id,
    }));
  }, [categories]);

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Buzón de Quejas"
        subtitle="Espacio de atención y comunicación directa para reportes vecinales"
        icon={FaExclamationCircle}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR QUEJA...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        extraFilter={
          <div className="flex gap-2">
            <ITTripleFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "TODOS", value: "ALL" },
                { label: "PENDIENTES", value: "OPEN" },
                { label: "EN PROCESO", value: "IN_PROGRESS" },
                { label: "RESUELTAS", value: "RESOLVED" },
              ]}
            />
            {isResident && (
              <ITButton
                variant="filled"
                color="primary"
                onClick={() => setIsCreateOpen(true)}
                className="!flex !flex-row !items-center !gap-2"
              >
                <FaPlus size={12} /> Nueva Queja
              </ITButton>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<ComplaintResponse & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* CREATE DIALOG */}
      <ITDialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          createFormik.resetForm();
        }}
        title="Registrar Nueva Queja"
        className="!max-w-2xl !w-full"
      >
        <form onSubmit={createFormik.handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <ITSelect
              label="Categoría de Queja"
              name="categoryId"
              value={createFormik.values.categoryId}
              onChange={createFormik.handleChange}
              onBlur={createFormik.handleBlur}
              options={selectCategoriesOptions}
              error={
                createFormik.errors.categoryId && createFormik.touched.categoryId
                  ? createFormik.errors.categoryId
                  : undefined
              }
              required
              placeholder="Selecciona una categoría..."
            />

            <ITInput
              label="Asunto / Título de la queja"
              name="title"
              value={createFormik.values.title}
              onChange={createFormik.handleChange}
              onBlur={createFormik.handleBlur}
              error={
                createFormik.errors.title && createFormik.touched.title
                  ? createFormik.errors.title
                  : undefined
              }
              required
              placeholder="Ej. Luminaria fundida en calle principal"
            />

            <ITInput
              label="Descripción detallada"
              name="description"
              type="textarea"
              value={createFormik.values.description}
              onChange={createFormik.handleChange}
              onBlur={createFormik.handleBlur}
              error={
                createFormik.errors.description && createFormik.touched.description
                  ? createFormik.errors.description
                  : undefined
              }
              required
              placeholder="Explica detalladamente la problemática..."
              className="min-h-[120px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => {
                setIsCreateOpen(false);
                createFormik.resetForm();
              }}
            >
              Cancelar
            </ITButton>
            <ITButton type="submit" color="primary" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar Queja"}
            </ITButton>
          </div>
        </form>
      </ITDialog>

      {/* DETAIL DIALOG */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          isResident={isResident}
          isAdmin={isAdmin}
          authId={auth.id}
          primaryHex={primaryHex}
          totalUnread={totalUnread}
          onUpdateStatus={handleUpdateStatus}
          isUpdatingStatus={isUpdatingStatus}
        />
      )}

      {/* DELETE DIALOG */}
      <ITDialog
        isOpen={!!complaintToDeleteId}
        onClose={() => setComplaintToDeleteId(null)}
        title="Eliminar Queja"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-base font-bold text-slate-800 mb-2">
            ¿Eliminar Queja?
          </ITText>
          <ITText className="text-xs text-slate-500 mb-8 max-w-xs mx-auto">
            Esta acción no se puede deshacer. Se borrará del historial.
          </ITText>
          <div className="flex gap-3 justify-center">
            <ITButton
              variant="ghost"
              className="px-6 text-xs font-semibold text-slate-400"
              onClick={() => setComplaintToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-8 !rounded-xl shadow-lg shadow-rose-200"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "ELIMINAR AHORA"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {totalUnread > 0 && !selectedComplaint && (
        <button
          onClick={async () => {
            const firstUnreadId = Object.keys(unreadCounts)[0];
            if (firstUnreadId) {
              const res = await getComplaintById(firstUnreadId);
              if (res.success && res.data) {
                setSelectedComplaint(res.data);
              }
            }
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border border-white/20 text-white transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: primaryHex }}
        >
          <FaComment size={16} />
          <span className="font-bold text-sm">{totalUnread}</span>
          <span className="text-xs opacity-90">mensaje{totalUnread !== 1 ? "s" : ""} nuevo{totalUnread !== 1 ? "s" : ""}</span>
        </button>
      )}
    </div>
  );
};

export default ComplaintsPage;

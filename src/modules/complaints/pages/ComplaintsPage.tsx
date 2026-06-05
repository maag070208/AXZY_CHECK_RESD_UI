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
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState, useEffect } from "react";
import {
  FaPlus,
  FaEye,
  FaTrash,
  FaExclamationCircle,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  ComplaintResponse,
  ComplaintCategoryResponse,
  getPaginatedComplaints,
  getComplaintCategories,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} from "../services/ComplaintsService";

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

  useEffect(() => {
    loadCategories();
  }, []);

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
    const res = await createComplaint(values);
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

  const handleUpdateStatus = async (status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") => {
    if (!selectedComplaint || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    const res = await updateComplaint(selectedComplaint.id, { status });
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
    const res = await deleteComplaint(complaintToDeleteId);
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

  const getStatusBadge = (status: string) => {
    let color: any = "primary";
    let label = "ABIERTA";
    if (status === "IN_PROGRESS") {
      color = "warning";
      label = "EN PROCESO";
    } else if (status === "RESOLVED") {
      color = "success";
      label = "RESUELTA";
    } else if (status === "CLOSED") {
      color = "gray";
      label = "CERRADA";
    }
    return (
      <ITBadget
        color={color}
        size="small"
        className="!text-[9px] tracking-widest font-black uppercase"
      >
        {label}
      </ITBadget>
    );
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
      <ITDialog
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title="Detalle de Queja"
      >
        {selectedComplaint && (
          <div className="p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <ITText className="text-sm font-black text-slate-400 uppercase tracking-widest block">
                  {selectedComplaint.category?.name}
                </ITText>
                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-1">
                  {selectedComplaint.title}
                </h4>
              </div>
              <div>{getStatusBadge(selectedComplaint.status)}</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <ITText className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Descripción
              </ITText>
              <ITText className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                {selectedComplaint.description}
              </ITText>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Fecha Registro
                </ITText>
                <ITText className="text-slate-700 font-bold text-[11px] uppercase mt-1">
                  {dayjs(selectedComplaint.createdAt).format("DD/MM/YYYY HH:mm")}
                </ITText>
              </div>

              {!isResident && (
                <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                  <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Reportado por
                  </ITText>
                  <ITText className="text-slate-700 font-bold text-[11px] uppercase mt-1 line-clamp-1">
                    {selectedComplaint.resident?.user?.name}{" "}
                    {selectedComplaint.resident?.user?.lastName}
                  </ITText>
                </div>
              )}
            </div>

            {selectedComplaint.resolvedBy && (
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <ITText className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">
                    Atendido / Resuelto por
                  </ITText>
                  <ITText className="text-slate-700 font-bold text-[11px] uppercase mt-1">
                    {selectedComplaint.resolvedBy.name}{" "}
                    {selectedComplaint.resolvedBy.lastName}
                  </ITText>
                </div>
                {selectedComplaint.resolvedAt && (
                  <div className="text-right">
                    <ITText className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">
                      Fecha Resolución
                    </ITText>
                    <ITText className="text-slate-700 font-bold text-[11px] uppercase mt-1">
                      {dayjs(selectedComplaint.resolvedAt).format("DD/MM/YYYY")}
                    </ITText>
                  </div>
                )}
              </div>
            )}

            {/* Admin Controls */}
            {isAdmin && (
              <div className="border-t border-slate-100 pt-6">
                <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">
                  Acciones de Gestión (Administrador)
                </ITText>
                <div className="flex flex-wrap gap-2">
                  {selectedComplaint.status !== "IN_PROGRESS" && (
                    <ITButton
                      variant="outlined"
                      color="warning"
                      onClick={() => handleUpdateStatus("IN_PROGRESS")}
                      disabled={isUpdatingStatus}
                    >
                      En Progreso
                    </ITButton>
                  )}
                  {selectedComplaint.status !== "RESOLVED" && (
                    <ITButton
                      variant="filled"
                      color="success"
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      disabled={isUpdatingStatus}
                    >
                      Resolver
                    </ITButton>
                  )}
                  {selectedComplaint.status !== "CLOSED" && (
                    <ITButton
                      variant="outlined"
                      color="secondary"
                      onClick={() => handleUpdateStatus("CLOSED")}
                      disabled={isUpdatingStatus}
                    >
                      Cerrar
                    </ITButton>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <ITButton
                variant="outlined"
                color="secondary"
                onClick={() => setSelectedComplaint(null)}
              >
                Cerrar Ventana
              </ITButton>
            </div>
          </div>
        )}
      </ITDialog>

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
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar esta queja?
          </ITText>
          <ITText className="text-slate-500 text-xs font-semibold uppercase tracking-tight block">
            Esta acción no se puede deshacer. Se borrará del historial.
          </ITText>
          <div className="flex gap-4 justify-center mt-8">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setComplaintToDeleteId(null)}
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
              {isDeleting ? "ELIMINANDO..." : "ELIMINAR"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default ComplaintsPage;

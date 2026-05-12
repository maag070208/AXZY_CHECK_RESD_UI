import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
} from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { ITMediaGrid } from "@core/components/ITMediaGrid";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import {
  FaCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaFileAlt,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteIncident,
  getPaginatedIncidents,
  Incident,
  resolveIncident,
} from "../services/IncidentService";
import { AppState } from "@app/core/store/store";

const IncidentsPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isAdmin = auth.role === "ADMIN";

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [incidentToResolveId, setIncidentToResolveId] = useState<number | null>(
    null,
  );
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: guardsCatalog, loading: loadingGuards } = useCatalog("guard");

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number> = {};
    if (searchTerm.trim()) f.search = searchTerm.trim();
    if (statusFilter !== "ALL") f.status = statusFilter;
    return f;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: Record<string, unknown>) => {
      return getPaginatedIncidents({ ...params, ...externalFilters });
    },
    [externalFilters],
  );

  const handleResolve = (id: number) => setIncidentToResolveId(id);

  const confirmResolve = async () => {
    if (!incidentToResolveId) return;
    setResolvingId(incidentToResolveId);
    const res = await resolveIncident(incidentToResolveId as any);
    setResolvingId(null);
    setIncidentToResolveId(null);

    if (res.success) {
      setRefreshKey((p) => p + 1);
      if (viewingIncident?.id === (incidentToResolveId as any)) {
        setViewingIncident(null);
      }
      dispatch(showToast({ message: "Incidencia resuelta", type: "success" }));
    } else {
      dispatch(
        showToast({ message: "Error al resolver incidencia", type: "error" }),
      );
    }
  };

  const confirmDelete = async () => {
    if (!incidentToDelete) return;
    setDeletingId(incidentToDelete.id as any);
    const res = await deleteIncident(incidentToDelete.id);
    setDeletingId(null);
    setIncidentToDelete(null);

    if (res.success) {
      dispatch(showToast({ message: "Reporte eliminado", type: "success" }));
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "title",
        label: "Incidencia",
        render: (row: Incident) => (
          <div className="flex items-start gap-3">
            <div className="mt-1 w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100">
              <FaExclamationTriangle size={12} />
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1">
                {row.title}
              </p>
              <div className="flex gap-2 items-center mt-0.5">
                <ITBadget
                  label={row.category?.name || "GENERAL"}
                  color="primary"
                  variant="outlined"
                  className="!text-[8px] !px-1.5 !py-0.5 !h-auto"
                />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                  • {row.client?.name}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "createdAt",
        label: "Reportado",
        render: (row: Incident) => (
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-700 uppercase">
              {dayjs(row.createdAt).format("DD MMM YYYY")}
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">
              {dayjs(row.createdAt).format("HH:mm")} HRS
            </span>
          </div>
        ),
      },
      {
        key: "guardId",
        label: "Reportado Por",
        render: (row: Incident) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
              {row.guard?.name?.[0]}
              {row.guard?.lastName?.[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[120px]">
                {row.guard?.name} {row.guard?.lastName}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                @{row.guard?.username}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        label: "Estado",
        render: (row: Incident) => (
          <ITBadget
            color={row.status === "ATTENDED" ? "success" : "danger"}
            label={row.status === "ATTENDED" ? "ATENDIDA" : "PENDIENTE"}
          />
        ),
      },
      {
        key: "actions",
        label: "Control",
        render: (row: Incident) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => {
                console.log(row);
                setViewingIncident(row);
              }}
              variant="outlined"
              size="small"
              color="secondary"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && (
              <ITButton
                onClick={() => handleResolve(row.id as any)}
                variant="outlined"
                size="small"
                color="success"
                disabled={resolvingId === (row.id as any)}
              >
                {resolvingId === (row.id as any) ? (
                  <ITLoader />
                ) : (
                  <FaCheck size={14} />
                )}
              </ITButton>
            )}
            {isAdmin && (
              <ITButton
                onClick={() => setIncidentToDelete(row)}
                color="error"
                variant="outlined"
                size="small"
                disabled={deletingId === (row.id as any)}
              >
                <FaTrash size={12} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [isAdmin, resolvingId, deletingId],
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
      <ModuleHeader
        title="Gestión de Incidencias"
        subtitle="Monitoreo y respuesta inmediata a reportes de seguridad"
        icon={FaExclamationTriangle}
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full sm:justify-end">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <ITInput
                placeholder="BUSCAR REPORTE..."
                name="search"
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                onBlur={() => {}}
                className="!h-[42px] !pl-10 !rounded-xl border-slate-100 bg-white !text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>

            <ITTripleFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "TODOS", value: "ALL" },
                { label: "PENDIENTES", value: "PENDING" },
                { label: "ATENDIDAS", value: "ATTENDED" },
              ]}
            />

            <ITButton
              onClick={() => setRefreshKey((p) => p + 1)}
              variant="outline"
              className="!h-[42px] !rounded-xl !border-slate-100 !bg-white !text-slate-500 hover:!bg-slate-50"
            >
              <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                <FaSync
                  size={10}
                  className={loadingGuards ? "animate-spin" : ""}
                />
                Refrescar
              </div>
            </ITButton>
          </div>
        }
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <ITDataTable<Incident & Record<string, unknown>>
          key={`${refreshKey}-${guardsCatalog?.length || 0}`}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters as any}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* DETAIL MODAL - Versión Optimizada */}
      <ITDialog
        isOpen={!!viewingIncident}
        onClose={() => setViewingIncident(null)}
        className="!max-w-[95vw] md:!max-w-[90vw] lg:!max-w-[85vw] xl:!max-w-[80vw] !w-full"
      >
        {viewingIncident && (
          <div className="flex flex-col h-[90vh] w-full">
            {/* Contenido con scroll solo cuando es necesario */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Columna Principal - Contenido */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Tarjeta de Contenido */}
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                    {/* Header con badges */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <ITBadget
                          color={
                            viewingIncident.status === "ATTENDED"
                              ? "success"
                              : "danger"
                          }
                          label={
                            viewingIncident.status === "ATTENDED"
                              ? "ATENDIDA"
                              : "PENDIENTE"
                          }
                        />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          #{viewingIncident.id?.slice(0, 8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Cliente:
                        </span>
                        <span className="text-[10px] font-black text-slate-700 uppercase">
                          {viewingIncident.client?.name}
                        </span>
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 uppercase tracking-tight mb-4 break-words">
                      {viewingIncident.title}
                    </h3>

                    {/* Categoría y Tipo */}
                    <div className="flex flex-wrap gap-6 mb-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Categoría
                        </span>
                        <span className="text-[11px] font-black text-slate-600 uppercase">
                          {viewingIncident.category?.name}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-100 hidden sm:block" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Tipo
                        </span>
                        <span className="text-[11px] font-black text-slate-600 uppercase">
                          {viewingIncident.type?.name}
                        </span>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingIncident.description ||
                          "Sin descripción detallada disponible."}
                      </p>
                    </div>
                  </div>

                  {/* Multimedia */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      Evidencia Multimedia
                    </h4>
                    {viewingIncident.media &&
                    viewingIncident.media.length > 0 ? (
                      <ITMediaGrid
                        media={viewingIncident.media}
                        title={viewingIncident.title}
                        gridSize={280}
                      />
                    ) : (
                      <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 bg-white">
                        <FaFileAlt size={32} className="mb-3 opacity-10" />
                        <p className="font-black text-[10px] uppercase tracking-widest">
                          Sin archivos adjuntos
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Mapa */}
                  {viewingIncident.latitude && viewingIncident.longitude && (
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Localización del Reporte
                      </h4>
                      <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-md">
                        <GoogleMapComponent
                          lat={viewingIncident.latitude}
                          lng={viewingIncident.longitude}
                          height="300px"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Columna Lateral - Info y Acciones */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Guardia que reporta */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">
                      Reportado Por
                    </h5>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base font-black border border-emerald-100 shrink-0">
                        {viewingIncident.guard?.name?.[0]}
                        {viewingIncident.guard?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 uppercase truncate">
                          {viewingIncident.guard?.name}{" "}
                          {viewingIncident.guard?.lastName}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 truncate">
                          @{viewingIncident.guard?.username}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Fecha Reporte
                        </span>
                        <span className="text-[11px] font-black text-slate-700 uppercase">
                          {dayjs(viewingIncident.createdAt).format(
                            "DD MMM YYYY",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Hora Reporte
                        </span>
                        <span className="text-[11px] font-black text-slate-700 uppercase">
                          {dayjs(viewingIncident.createdAt).format("HH:mm")} HRS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información de Resolución */}
                  {viewingIncident.status === "ATTENDED" &&
                    viewingIncident.resolvedBy && (
                      <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-xl">
                        <h5 className="text-[9px] font-black text-emerald-200 uppercase tracking-widest mb-6">
                          Resolución
                        </h5>
                        <div className="flex items-center gap-3 mb-6">
                          <FaCheckCircle
                            className="text-emerald-300"
                            size={18}
                          />
                          <p className="text-xs font-black uppercase tracking-tight">
                            Incidencia Atendida
                          </p>
                        </div>
                        <div className="space-y-4 text-xs">
                          <div>
                            <p className="opacity-70 mb-1 uppercase tracking-widest text-[8px]">
                              Atendido por:
                            </p>
                            <p className="font-black uppercase text-xs">
                              {viewingIncident.resolvedBy.name}{" "}
                              {viewingIncident.resolvedBy.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="opacity-70 mb-1 uppercase tracking-widest text-[8px]">
                              Fecha resolución:
                            </p>
                            <p className="font-black uppercase text-xs">
                              {dayjs(viewingIncident.resolvedAt).format(
                                "DD MMM YYYY HH:mm",
                              )}{" "}
                              HRS
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Acción Pendiente */}
                  {viewingIncident.status === "PENDING" && (
                    <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                      <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3">
                        Acción Requerida
                      </h5>
                      <p className="text-[10px] text-rose-700 font-bold leading-relaxed mb-6 uppercase tracking-tight">
                        Este reporte requiere validación y resolución inmediata.
                      </p>
                      <ITButton
                        onClick={() => handleResolve(viewingIncident.id as any)}
                        variant="filled"
                        color="success"
                        className="w-full !rounded-xl !h-[48px] shadow-lg shadow-emerald-200"
                      >
                        <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                          <FaCheck size={12} /> Resolver Ahora
                        </div>
                      </ITButton>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer - Siempre visible */}
            <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <ITButton
                variant="ghost"
                className="!text-slate-400 font-black text-[10px] uppercase tracking-widest px-6"
                onClick={() => setViewingIncident(null)}
              >
                Cerrar
              </ITButton>
              {isAdmin && (
                <ITButton
                  variant="outline"
                  color="danger"
                  className="!rounded-xl !border-rose-100 !bg-rose-50/50 !text-rose-500 hover:!bg-rose-50 px-6"
                  onClick={() => setIncidentToDelete(viewingIncident)}
                >
                  <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                    <FaTrash size={12} /> Eliminar
                  </div>
                </ITButton>
              )}
            </div>
          </div>
        )}
      </ITDialog>
      {/* Confirmation Dialogs */}
      <ITDialog
        isOpen={!!incidentToResolveId}
        onClose={() => setIncidentToResolveId(null)}
        title="Confirmar Resolución"
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
            <FaCheckCircle size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
            ¿Confirmar Resolución?
          </h4>
          <p className="text-slate-500 text-xs font-medium mb-8 uppercase tracking-tight">
            Se registrará la incidencia como atendida permanentemente.
          </p>
          <div className="flex justify-center gap-3">
            <ITButton
              variant="ghost"
              className="px-8 !text-slate-400 font-black text-[10px] uppercase tracking-widest"
              onClick={() => setIncidentToResolveId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="success"
              className="px-10 !rounded-xl !h-[48px] shadow-lg shadow-emerald-200"
              onClick={confirmResolve}
            >
              <div className="font-black text-[10px] uppercase tracking-widest">
                Confirmar
              </div>
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!incidentToDelete}
        onClose={() => setIncidentToDelete(null)}
        title="Eliminar Incidencia"
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-sm">
            <FaTrash size={24} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
            ¿Eliminar Reporte?
          </h4>
          <p className="text-slate-500 text-xs font-medium mb-8 uppercase tracking-tight">
            Esta acción es irreversible. Se perderá toda la evidencia.
          </p>
          <div className="flex justify-center gap-3">
            <ITButton
              variant="ghost"
              className="px-8 !text-slate-400 font-black text-[10px] uppercase tracking-widest"
              onClick={() => setIncidentToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-xl !h-[48px] shadow-lg shadow-rose-200"
              onClick={confirmDelete}
            >
              <div className="font-black text-[10px] uppercase tracking-widest">
                Eliminar
              </div>
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default IncidentsPage;

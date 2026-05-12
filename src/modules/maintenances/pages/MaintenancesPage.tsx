import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { AppState } from "@app/core/store/store";
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
  FaEye,
  FaFileAlt,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash,
  FaWrench,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteMaintenance,
  getPaginatedMaintenances,
  Maintenance,
  resolveMaintenance,
} from "../services/MaintenanceService";

const MaintenancesPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isAdmin = auth.role === "ADMIN";

  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingMaintenance, setViewingMaintenance] =
    useState<Maintenance | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [maintenanceToResolveId, setMaintenanceToResolveId] = useState<
    number | null
  >(null);
  const [maintenanceToDelete, setMaintenanceToDelete] =
    useState<Maintenance | null>(null);
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
      return getPaginatedMaintenances({ ...params, ...externalFilters });
    },
    [externalFilters],
  );

  const handleResolve = (id: number) => setMaintenanceToResolveId(id);

  const confirmResolve = async () => {
    if (!maintenanceToResolveId) return;
    setResolvingId(maintenanceToResolveId);
    const res = await resolveMaintenance(maintenanceToResolveId as any);
    setResolvingId(null);
    setMaintenanceToResolveId(null);

    if (res.success) {
      setRefreshKey((p) => p + 1);
      if (viewingMaintenance?.id === (maintenanceToResolveId as any)) {
        setViewingMaintenance(null);
      }
      dispatch(
        showToast({ message: "Mantenimiento resuelto", type: "success" }),
      );
    } else {
      dispatch(
        showToast({
          message: "Error al resolver mantenimiento",
          type: "error",
        }),
      );
    }
  };

  const confirmDelete = async () => {
    if (!maintenanceToDelete) return;
    setDeletingId(maintenanceToDelete.id as any);
    const res = await deleteMaintenance(maintenanceToDelete.id);
    setDeletingId(null);
    setMaintenanceToDelete(null);

    if (res.success) {
      dispatch(showToast({ message: "Registro eliminado", type: "success" }));
      setRefreshKey((p) => p + 1);
    } else {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };


  const columns = useMemo(
    () => [
      {
        key: "title",
        label: "Mantenimiento",
        render: (row: Maintenance) => (
          <div className="flex items-start gap-3">
            <div className="mt-1 w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 border border-orange-100">
              <FaWrench size={12} />
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1">
                {row.title}
              </p>
              <div className="flex gap-2 items-center mt-0.5">
                <ITBadget
                  label={row.category || "GENERAL"}
                  color="warning"
                  variant="outlined"
                  className="!text-[8px] !px-1.5 !py-0.5 !h-auto"
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "createdAt",
        label: "Reportado",
        render: (row: Maintenance) => (
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
              {dayjs(row.createdAt).format("DD MMM YYYY")}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {dayjs(row.createdAt).format("HH:mm")} HRS
            </span>
          </div>
        ),
      },
      {
        key: "guardId",
        label: "Reportado por",
        render: (row: Maintenance) => (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-100 uppercase">
              {row.guard?.name?.[0]}
              {row.guard?.lastName?.[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate max-w-[120px]">
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
        render: (row: Maintenance) => (
          <ITBadget
            color={row.status === "ATTENDED" ? "success" : "danger"}
            variant="outlined"
            label={row.status === "ATTENDED" ? "ATENDIDA" : "PENDIENTE"}
            className="font-black text-[9px] tracking-widest"
          />
        ),
      },
      {
        key: "actions",
        label: "Control",
        render: (row: Maintenance) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => setViewingMaintenance(row)}
              variant="outlined"
              color="secondary"
              title="Ver detalle"
              size="small"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && (
              <ITButton
                onClick={() => handleResolve(row.id)}
                variant="outline"
                className="!p-2 !w-9 !h-9 !rounded-xl !border-emerald-100 !bg-emerald-50/30 !text-emerald-500 hover:!bg-emerald-50"
                title="Resolver"
                disabled={resolvingId === row.id}
              >
                {resolvingId === row.id ? (
                  <ITLoader size="sm" />
                ) : (
                  <FaCheck size={14} />
                )}
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
        title="Gestión de Mantenimientos"
        subtitle="Monitoreo y resolución de desperfectos en instalaciones"
        icon={FaWrench}
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
        <ITDataTable<Maintenance & Record<string, unknown>>
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
        isOpen={!!viewingMaintenance}
        onClose={() => setViewingMaintenance(null)}
        className="!max-w-[95vw] md:!max-w-[90vw] lg:!max-w-[85vw] xl:!max-w-[80vw] !w-full"
      >
        {viewingMaintenance && (
          <div className="flex flex-col h-[90vh] w-full">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Main Column */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <ITBadget
                          color={
                            viewingMaintenance.status === "ATTENDED"
                              ? "success"
                              : "danger"
                          }
                          variant="outlined"
                          className="font-black text-[9px] tracking-[0.2em]"
                          label={
                            viewingMaintenance.status === "ATTENDED"
                              ? "COMPLETADO"
                              : "PENDIENTE"
                          }
                        />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          #{viewingMaintenance.id.toString().slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-800 uppercase tracking-tight mb-4 break-words">
                      {viewingMaintenance.title}
                    </h3>

                    <div className="flex flex-wrap gap-6 mb-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Categoría
                        </span>
                        <span className="text-[11px] font-black text-slate-600 uppercase">
                          {viewingMaintenance.category || "GENERAL"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {viewingMaintenance.description ||
                          "Sin descripción detallada disponible."}
                      </p>
                    </div>
                  </div>

                  {/* Multimedia */}
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      Evidencia Multimedia
                    </h4>
                    {viewingMaintenance.media &&
                    viewingMaintenance.media.length > 0 ? (
                      <ITMediaGrid
                        media={viewingMaintenance.media}
                        title={viewingMaintenance.title}
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

                  {/* Map */}
                  {viewingMaintenance.latitude &&
                    viewingMaintenance.longitude && (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                          Localización del Reporte
                        </h4>
                        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-md">
                          <GoogleMapComponent
                            lat={viewingMaintenance.latitude}
                            lng={viewingMaintenance.longitude}
                            height="300px"
                          />
                        </div>
                      </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">
                      Reportado Por
                    </h5>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-base font-black border border-orange-100 shrink-0">
                        {viewingMaintenance.guard?.name?.[0]}
                        {viewingMaintenance.guard?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 uppercase truncate">
                          {viewingMaintenance.guard?.name}{" "}
                          {viewingMaintenance.guard?.lastName}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 truncate">
                          @{viewingMaintenance.guard?.username}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Fecha Reporte
                        </span>
                        <span className="text-[11px] font-black text-slate-700 uppercase">
                          {dayjs(viewingMaintenance.createdAt).format(
                            "DD MMM YYYY",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Hora Reporte
                        </span>
                        <span className="text-[11px] font-black text-slate-700 uppercase">
                          {dayjs(viewingMaintenance.createdAt).format("HH:mm")}{" "}
                          HRS
                        </span>
                      </div>
                    </div>
                  </div>

                  {viewingMaintenance.status === "ATTENDED" &&
                    viewingMaintenance.resolvedBy && (
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
                            Mantenimiento Atendido
                          </p>
                        </div>
                        <div className="space-y-4 text-xs">
                          <div>
                            <p className="opacity-70 mb-1 uppercase tracking-widest text-[8px]">
                              Resuelto por:
                            </p>
                            <p className="font-black uppercase text-xs">
                              {viewingMaintenance.resolvedBy.name}{" "}
                              {viewingMaintenance.resolvedBy.lastName}
                            </p>
                          </div>
                          <div>
                            <p className="opacity-70 mb-1 uppercase tracking-widest text-[8px]">
                              Fecha resolución:
                            </p>
                            <p className="font-black uppercase text-xs">
                              {dayjs(viewingMaintenance.resolvedAt).format(
                                "DD MMM YYYY HH:mm",
                              )}{" "}
                              HRS
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {viewingMaintenance.status === "PENDING" && (
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                      <h5 className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-3">
                        Acción Requerida
                      </h5>
                      <p className="text-[10px] text-orange-700 font-bold leading-relaxed mb-6 uppercase tracking-tight">
                        Este reporte requiere validación técnica inmediata.
                      </p>
                      <ITButton
                        onClick={() => handleResolve(viewingMaintenance.id)}
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

            <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              <ITButton
                variant="ghost"
                className="!text-slate-400 font-black text-[10px] uppercase tracking-widest px-6"
                onClick={() => setViewingMaintenance(null)}
              >
                Cerrar
              </ITButton>
              {isAdmin && (
                <ITButton
                  variant="outline"
                  color="danger"
                  className="!rounded-xl !border-rose-100 !bg-rose-50/50 !text-rose-500 hover:!bg-rose-50 px-6"
                  onClick={() => setMaintenanceToDelete(viewingMaintenance)}
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
        isOpen={!!maintenanceToResolveId}
        onClose={() => setMaintenanceToResolveId(null)}
        title="Confirmar Resolución"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-sm">
            <FaCheckCircle size={40} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Confirmar Resolución?
          </h4>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
            El estatus cambiará a "Atendido" y quedará registrado bajo su
            perfil.
          </p>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setMaintenanceToResolveId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="success"
              className="px-10 !rounded-2xl shadow-xl shadow-emerald-200"
              onClick={confirmResolve}
              disabled={!!resolvingId}
            >
              {resolvingId ? <ITLoader size="sm" /> : "SÍ, RESOLVER"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!maintenanceToDelete}
        onClose={() => setMaintenanceToDelete(null)}
        title="Eliminar Registro"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Reporte?
          </h4>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
            Esta acción es definitiva y borrará toda la evidencia asociada al
            registro #{maintenanceToDelete?.id.toString().slice(0, 8)}.
          </p>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setMaintenanceToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDelete}
              disabled={!!deletingId}
            >
              {deletingId ? <ITLoader size="sm" /> : "ELIMINAR AHORA"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default MaintenancesPage;

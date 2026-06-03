import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITText,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import {
  FaCheck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import IncidentDetailDialog from "../components/IncidentDetailDialog";
import {
  deleteIncident,
  getPaginatedIncidents,
  Incident,
  resolveIncident,
} from "../services/IncidentService";

const IncidentsPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isAdmin = auth.role === "ADMIN" || auth.role === "LIDER";
  const isClient = auth.role === "RESDN";

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

  const { data: guardsCatalog } = useCatalog("guard");

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
        label: "REPORTADO POR",
        render: (row: Incident) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.guard?.name} {row.guard?.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                @{row.guard?.username || "S/U"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: Incident) => (
          <ITBadget
            color={row.status === "ATTENDED" ? "success" : "danger"}
            size="small"
          >
            {row.status === "ATTENDED" ? "ATENDIDA" : "PENDIENTE"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: Incident) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => setViewingIncident(row)}
              variant="outlined"
              size="small"
              color="secondary"
              title="Ver detalle"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "PENDING" && !isClient && (
              <ITButton
                onClick={() => handleResolve(row.id as any)}
                variant="outlined"
                size="small"
                color="success"
                title="Resolver"
                disabled={resolvingId === (row.id as any)}
              >
                {resolvingId === (row.id as any) ? (
                  <ITLoader size="sm" />
                ) : (
                  <FaCheck size={14} />
                )}
              </ITButton>
            )}
            {isAdmin && (
              <ITButton
                onClick={() => setIncidentToDelete(row)}
                color="danger"
                variant="outlined"
                size="small"
                title="Eliminar"
                disabled={deletingId === (row.id as any)}
              >
                <FaTrash size={14} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [isAdmin, resolvingId, deletingId, isClient],
  );

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Gestión de Incidencias"
        subtitle="Monitoreo y respuesta inmediata a reportes de seguridad"
        icon={FaExclamationTriangle}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR REPORTE...",
        }}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "TODOS", value: "ALL" },
              { label: "PENDIENTES", value: "PENDING" },
              { label: "ATENDIDAS", value: "ATTENDED" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<Incident & Record<string, unknown>>
          key={`${refreshKey}-${guardsCatalog?.length || 0}`}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters as any}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* DETAIL MODAL - Versión Modularizada */}
      <IncidentDetailDialog
        isOpen={!!viewingIncident}
        onClose={() => setViewingIncident(null)}
        incident={viewingIncident}
        onResolve={handleResolve}
        onDelete={setIncidentToDelete}
        isAdmin={isAdmin}
        isClient={isClient}
      />
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
              className="px-10"
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
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Reporte?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción es irreversible. Se perderá toda la evidencia asociada.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setIncidentToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDelete}
            >
              ELIMINAR AHORA
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default IncidentsPage;

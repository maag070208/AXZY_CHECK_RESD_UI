import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaEdit,
  FaFilter,
  FaPlus,
  FaRoute,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteRoute, getPaginatedRoutes } from "../services/RoutesService";

const RoutesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [routeToDeleteId, setRouteToDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>("");

  const { data: clients } = useCatalog("client");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    return {
      title: searchTerm,
      clientId: selectedClientId,
    };
  }, [searchTerm, selectedClientId]);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedRoutes(params);
  }, []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleDelete = (id: number) => {
    setRouteToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!routeToDeleteId) return;
    const res = await deleteRoute(String(routeToDeleteId));
    setRouteToDeleteId(null);
    if (res.success) {
      dispatch(showToast({ message: "Ruta eliminada", type: "success" }));
      refreshTable();
    } else {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
  };

  const handleEdit = (route: any) => {
    navigate(`/routes/edit/${route.id}`);
  };

  const handleCreate = () => {
    navigate("/routes/new");
  };

  const columns = [
    {
      key: "client",
      label: "Cliente / Entidad",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <FaBuilding className="text-slate-400 text-[10px]" />
            <span className="font-black text-slate-700 uppercase text-[10px] tracking-widest">
              {row.recurringLocations?.[0]?.location?.client?.name ||
                "Sin Cliente"}
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
            ID:{" "}
            {row.recurringLocations?.[0]?.location?.client?.id?.slice(-8) ||
              "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "title",
      label: "Ruta / Referencia",
      type: "string",
      render: (row: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
            <FaRoute size={14} />
          </div>
          <div>
            <p className="font-black text-slate-800 uppercase text-[12px] tracking-tight leading-none mb-1.5">
              {row.title}
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-black text-[8px] uppercase tracking-[0.1em]">
                Servicio Operativo
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "locations",
      label: "Puntos de Control",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
            {row.recurringLocations?.length || 0} Puntos QR
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
              Ubicación:{" "}
              {row.recurringLocations?.[0]?.location?.name || "Multiple"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "active",
      label: "Estado",
      type: "string",
      render: (row: any) => (
        <span
          className={`px-3 py-1 rounded-full text-[9px] font-black tracking-[0.1em] border shadow-sm ${
            row.active
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : "bg-slate-50 text-slate-400 border-slate-100"
          }`}
        >
          {row.active ? "ACTIVO" : "INACTIVO"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => handleEdit(row)}
            variant="outlined"
            title="Editar Ruta"
            size="small"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => handleDelete(row.id)}
            variant="outlined"
            color="error"
            title="Eliminar Ruta"
            size="small"
          >
            <FaTrash size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-screen">
      <ModuleHeader
        title="Gestión de Rutas"
        subtitle="Configuración de recorridos y puntos de control para rondines"
        icon={FaRoute}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-3 w-full">
            <div className="w-full sm:w-64">
              <ITSearchSelect
                className="!z-20"
                placeholder="Filtrar por Cliente..."
                options={(clients || []).map((c: any) => ({
                  label: c.name,
                  value: c.id,
                }))}
                value={selectedClientId}
                onChange={(val) => {
                  setSelectedClientId(val);
                  setRefreshKey((prev) => prev + 1);
                }}
              />
            </div>
            <div className="w-full sm:w-64 relative">
              <ITInput
                placeholder="Buscar ruta..."
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onBlur={() => {}}
                className="!py-2.5 !h-[44px] !rounded-2xl border-slate-200 !pr-10 bg-white"
                iconLeft={<FaRoute className="text-slate-400" />}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <FaTimes size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {(searchTerm || selectedClientId) && (
                <ITButton
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedClientId("");
                    setRefreshKey((prev) => prev + 1);
                  }}
                  variant="ghost"
                  className="h-[44px] px-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 border border-red-100/50 transition-all"
                  title="Limpiar Filtros"
                >
                  <FaFilter size={12} />
                </ITButton>
              )}
              <ITButton
                onClick={refreshTable}
                size="small"
                variant="ghost"
                className="h-10 w-10 p-0 flex justify-center items-center bg-slate-50 rounded-xl hover:bg-slate-100 transition-all border border-slate-100/50"
              >
                <FaSync
                  className={`text-slate-400 ${refreshKey % 2 === 0 ? "" : "rotate-180"}`}
                />
              </ITButton>

              <ITButton
                onClick={handleCreate}
                color="primary"
                className="h-10 px-6 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
              >
                <FaPlus size={12} />
                Nueva Ruta
              </ITButton>
            </div>
          </div>
        }
      />

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
        />
      </div>

      <ITDialog
        isOpen={!!routeToDeleteId}
        onClose={() => setRouteToDeleteId(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <FaTrash className="text-red-500 text-3xl" />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">
            ¿Eliminar Ruta?
          </h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Esta acción eliminará permanentemente la ruta y todos sus puntos de
            control asociados.
            <br />
            <span className="font-bold text-red-500">
              Esta acción no se puede deshacer.
            </span>
          </p>
          <div className="flex gap-3">
            <ITButton
              variant="ghost"
              onClick={() => setRouteToDeleteId(null)}
              className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="primary"
              onClick={confirmDelete}
              className="flex-1 h-12 rounded-2xl bg-red-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
            >
              Confirmar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default RoutesPage;

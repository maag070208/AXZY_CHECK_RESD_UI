import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import { showLoader, hideLoader } from "@app/core/store/loader/loader.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDataTableFetchParams,
  ITDialog,
  ITText,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBuilding, FaEdit, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { PropertyForm } from "../components/PropertyForm";
import {
  createHouse,
  deleteHouse,
  getPaginatedHouses,
  HouseResponse,
  updateHouse,
} from "../services/PropertiesService";

const PropertiesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<HouseResponse | null>(null);
  const [propertyToDeleteId, setPropertyToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Immediate refresh for status
  useEffect(() => {
    setRefreshKey((prev) => prev + 1);
  }, [statusFilter]);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== "all") {
      filters.active = statusFilter === "active" ? "true" : "false";
    }
    return filters;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    async (params: ITDataTableFetchParams): Promise<any> => {
      const res = await getPaginatedHouses({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
      return { data: res.data, total: res.total };
    },
    [externalFilters]
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingHouse(null);
    refreshTable();
  };

  const handleCreateOrUpdate = async (data: any, keepOpen?: boolean) => {
    dispatch(showLoader());
    try {
      let res;
      if (editingHouse) {
        res = await updateHouse(editingHouse.id, data);
      } else {
        res = await createHouse(data);
      }

      if (res.success) {
        dispatch(
          showToast({
            message: `Propiedad ${editingHouse ? "actualizada" : "creada"} con éxito`,
            type: "success",
          })
        );
        if (!keepOpen) {
          handleFormSuccess();
        } else {
          refreshTable();
        }
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al procesar propiedad",
            type: "error",
          })
        );
      }
    } catch (error) {
      dispatch(showToast({ message: "Error inesperado", type: "error" }));
    } finally {
      dispatch(hideLoader());
    }
  };

  const confirmDelete = async () => {
    if (!propertyToDeleteId || isDeleting) return;
    setIsDeleting(true);
    dispatch(showLoader());
    try {
      const res = await deleteHouse(propertyToDeleteId);
      if (res.success) {
        dispatch(showToast({ message: "Propiedad eliminada", type: "success" }));
        refreshTable();
        setPropertyToDeleteId(null);
      }
    } catch (error) {
      dispatch(showToast({ message: "Error al eliminar propiedad", type: "error" }));
    } finally {
      setIsDeleting(false);
      dispatch(hideLoader());
    }
  };

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Control de Propiedades"
        subtitle="Gestión de viviendas, número de casas y estado de habitabilidad"
        icon={FaBuilding}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR PROPIEDAD...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        onCreate={() => setIsFormOpen(true)}
        createLabel="Nueva Propiedad"
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { label: "TODAS", value: "all" },
              { label: "ACTIVAS", value: "active" },
              { label: "INACTIVAS", value: "inactive" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<HouseResponse & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetch}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
          columns={[
            {
              key: "number",
              label: "CASA / IDENTIFICADOR",
              type: "string",
              render: (row: HouseResponse) => (
                <div className="flex flex-col">
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                    Número: {row.number}
                  </ITText>
                  {row.block && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                        Manzana: {row.block}
                      </ITText>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "street",
              label: "CALLE / VIALIDAD",
              type: "string",
              render: (row: HouseResponse) => (
                <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight">
                  {row.street}
                </ITText>
              ),
            },
            {
              key: "reference",
              label: "REFERENCIAS",
              type: "string",
              render: (row: HouseResponse) => (
                <ITText className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                  {row.reference || "SIN REFERENCIA"}
                </ITText>
              ),
            },
            {
              key: "occupied",
              label: "HABITADA",
              type: "string",
              render: (row: HouseResponse) => (
                <ITBadget color={row.occupied ? "primary" : "secondary"} size="small">
                  {row.occupied ? "SÍ" : "NO"}
                </ITBadget>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              type: "string",
              render: (row: HouseResponse) => (
                <ITBadget color={row.active ? "success" : "error"} size="small">
                  {row.active ? "ACTIVA" : "INACTIVA"}
                </ITBadget>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: HouseResponse) => (
                <div className="flex items-center gap-2">
                  <ITButton
                    onClick={() => {
                      setEditingHouse(row);
                      setIsFormOpen(true);
                    }}
                    size="small"
                    variant="outlined"
                    color="info"
                    title="Editar"
                  >
                    <FaEdit size={14} />
                  </ITButton>
                  <ITButton
                    onClick={() => setPropertyToDeleteId(row.id)}
                    size="small"
                    variant="outlined"
                    color="danger"
                    title="Eliminar"
                  >
                    <FaTrash size={14} />
                  </ITButton>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* CREATE/EDIT MODAL */}
      <ITDialog
        isOpen={isFormOpen || !!editingHouse}
        onClose={() => {
          setIsFormOpen(false);
          setEditingHouse(null);
        }}
        title={editingHouse ? "Editar Propiedad" : "Nueva Propiedad"}
        className="!w-full !max-w-2xl"
      >
        <PropertyForm
          propertyToEdit={editingHouse || undefined}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingHouse(null);
          }}
          onSubmit={handleCreateOrUpdate}
        />
      </ITDialog>

      {/* DELETE DIALOG */}
      <ITDialog
        isOpen={!!propertyToDeleteId}
        onClose={() => setPropertyToDeleteId(null)}
        title="Eliminar Propiedad"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Propiedad?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción borrará definitivamente el registro de la propiedad del sistema.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setPropertyToDeleteId(null)}
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
    </div>
  );
};

export default PropertiesPage;

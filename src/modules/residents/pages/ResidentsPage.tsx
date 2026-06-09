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
import { useNavigate } from "react-router-dom";
import { FaUserShield, FaEdit, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { ResidentForm } from "../components/ResidentForm";
import {
  createResident,
  deleteResident,
  getPaginatedResidents,
  ResidentResponse,
  updateResident,
} from "../services/ResidentsService";

const ResidentsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<ResidentResponse | null>(null);
  const [residentToDeleteId, setResidentToDeleteId] = useState<string | null>(null);
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
      const res = await getPaginatedResidents({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
      return { data: res.data, total: res.total };
    },
    [externalFilters],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingResident(null);
    refreshTable();
  };

  const handleCreateOrUpdate = async (data: any, keepOpen?: boolean) => {
    dispatch(showLoader());
    try {
      let res;
      if (editingResident) {
        res = await updateResident(editingResident.id, data);
      } else {
        res = await createResident(data);
      }

      if (res.success) {
        dispatch(
          showToast({
            message: `Residente ${editingResident ? "actualizado" : "creado"} con éxito`,
            type: "success",
          }),
        );
        if (!keepOpen) {
          handleFormSuccess();
        } else {
          refreshTable();
        }
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al procesar residente",
            type: "error",
          }),
        );
      }
    } catch (error) {
      dispatch(showToast({ message: "Error inesperado", type: "error" }));
    } finally {
      dispatch(hideLoader());
    }
  };

  const confirmDelete = async () => {
    if (!residentToDeleteId || isDeleting) return;
    setIsDeleting(true);
    dispatch(showLoader());
    try {
      const res = await deleteResident(residentToDeleteId);
      if (res.success) {
        dispatch(
          showToast({ message: "Residente eliminado", type: "success" }),
        );
        refreshTable();
        setResidentToDeleteId(null);
      }
    } catch (error) {
      dispatch(
        showToast({ message: "Error al eliminar residente", type: "error" }),
      );
    } finally {
      setIsDeleting(false);
      dispatch(hideLoader());
    }
  };

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Directorio de Residentes"
        subtitle="Gestión de viviendas, propietarios y contactos autorizados"
        icon={FaUserShield}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR RESIDENTE...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        onCreate={() => setIsFormOpen(true)}
        createLabel="Nuevo Residente"
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { label: "TODOS", value: "all" },
              { label: "ACTIVOS", value: "active" },
              { label: "INACTIVOS", value: "inactive" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<ResidentResponse & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetch}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
          columns={[
            {
              key: "user",
              label: "RESIDENTE",
              type: "string",
              render: (row: ResidentResponse) => (
                <div className="flex flex-col">
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                    {row.user?.name} {row.user?.lastName}
                  </ITText>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <ITText className="text-slate-400 text-[9px] font-black tracking-widest">
                      @{row.user?.username}
                    </ITText>
                  </div>
                </div>
              ),
            },
            {
              key: "house",
              label: "VIVIENDA / DIRECCIÓN",
              type: "string",
              render: (row: ResidentResponse) => (
                <div className="flex flex-col">
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                    Calle {row.house?.street} {row.house?.number}
                  </ITText>
                  {row.house?.block && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                        Manzana: {row.house?.block}
                      </ITText>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "contact",
              label: "CONTACTO",
              type: "string",
              render: (row: ResidentResponse) => (
                <div className="flex flex-col">
                  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                    {row.email || "SIN CORREO"}
                  </ITText>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      TEL: {row.phone || "SIN TELÉFONO"}
                    </ITText>
                  </div>
                </div>
              ),
            },
            {
              key: "isOwner",
              label: "TIPO",
              type: "string",
              render: (row: ResidentResponse) => (
                <ITBadget
                  color={row.isOwner ? "primary" : "secondary"}
                  size="small"
                >
                  {row.isOwner ? "PROPIETARIO" : "INQUILINO"}
                </ITBadget>
              ),
            },
            {
              key: "status",
              label: "ESTADO",
              type: "string",
              render: (row: ResidentResponse) => (
                <ITBadget color={row.active ? "success" : "error"} size="small">
                  {row.active ? "ACTIVO" : "INACTIVO"}
                </ITBadget>
              ),
            },
            {
              key: "actions",
              label: "ACCIONES",
              type: "actions",
              actions: (row: ResidentResponse) => (
                <div className="flex items-center gap-2">
                  <ITButton
                    onClick={() => navigate(`/residents/${row.id}`)}
                    size="small"
                    variant="outlined"
                    color="primary"
                    title="Ver Detalle 360°"
                  >
                    Ver Detalle
                  </ITButton>
                  <ITButton
                    onClick={() => {
                      setEditingResident(row);
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
                    onClick={() => setResidentToDeleteId(row.id)}
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
        isOpen={isFormOpen || !!editingResident}
        onClose={() => {
          setIsFormOpen(false);
          setEditingResident(null);
        }}
        title={editingResident ? "Editar Residente" : "Nuevo Residente"}
        className="!w-full !max-w-2xl"
      >
        {(isFormOpen || !!editingResident) && (
          <ResidentForm
            residentToEdit={editingResident || undefined}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingResident(null);
            }}
            onSubmit={handleCreateOrUpdate}
          />
        )}
      </ITDialog>

      {/* DELETE DIALOG */}
      <ITDialog
        isOpen={!!residentToDeleteId}
        onClose={() => setResidentToDeleteId(null)}
        title="Eliminar Residente"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Residente?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Se disociará su vinculación a la propiedad. Su usuario no será borrado del sistema.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setResidentToDeleteId(null)}
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

export default ResidentsPage;

import { post } from "@app/core/axios/axios";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
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
  FaMapMarkedAlt,
  FaPlus,
  FaPrint,
  FaQrcode,
  FaSearchLocation,
  FaSync,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { ZonesModal } from "../../zones/components/ZonesModal";
import { BulkPrintModal } from "../components/BulkPrintModal";
import { LocationForm } from "../components/LocationForm";
import {
  createLocation,
  deleteLocation,
  getPaginatedLocations,
  Location,
  updateLocation,
} from "../service/locations.service";

const LocationsPage = () => {
  const [searchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>(
    searchParams.get("clientId") || "",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZonesModalOpen, setIsZonesModalOpen] = useState(false);
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  useEffect(() => {
    const cid = searchParams.get("clientId");
    if (cid) {
      setSelectedClientId(cid);
    }
  }, [searchParams]);

  const { data: clients } = useCatalog("client");

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedClientId]);

  const dispatch = useDispatch();
  const user = useSelector((state: AppState) => state.auth);

  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(
    null,
  );

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedLocations(params);
  }, []);

  const externalFilters = useMemo(() => {
    return { name: searchTerm, clientId: selectedClientId };
  }, [searchTerm, selectedClientId]);

  const handleCreate = async (data: any, keepOpen?: boolean) => {
    const res = await createLocation(data);
    if (res.success) {
      dispatch(
        showToast({ message: "Ubicación creada con éxito", type: "success" }),
      );
      if (!keepOpen) {
        setIsModalOpen(false);
      }
      setRefreshKey((prev) => prev + 1);
    } else {
      dispatch(
        showToast({
          message: res?.messages?.join(", ") || "Error al crear",
          type: "error",
        }),
      );
    }
  };

  const handleEdit = async (data: any) => {
    if (!editingLocation) return;
    const res = await updateLocation(editingLocation.id, data);
    if (res.success) {
      dispatch(
        showToast({ message: "Ubicación actualizada", type: "success" }),
      );
      setEditingLocation(null);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    try {
      const res = await deleteLocation(locationToDelete.id);
      setLocationToDelete(null);
      if (res && res.success) {
        dispatch(
          showToast({ message: "Ubicación eliminada", type: "success" }),
        );
        setRefreshKey((prev) => prev + 1);
      } else {
        dispatch(
          showToast({
            message: res?.messages?.join(", ") || "Error al eliminar",
            type: "error",
          }),
        );
      }
    } catch (e: any) {
      dispatch(
        showToast({ message: e.message || "Error al eliminar", type: "error" }),
      );
    }
  };

  const handlePrintQR = async (location: Location) => {
    try {
      const res = await post<any>(
        "/locations/print-qrs",
        { ids: [location.id] },
        { responseType: "blob" },
      );
      const blob = new Blob([res as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      dispatch(
        showToast({ message: "Vista previa del QR generada", type: "success" }),
      );
    } catch (error) {
      dispatch(
        showToast({ message: "Error al generar el código QR", type: "error" }),
      );
    }
  };

  const handlePrintBulk = async (ids: string[]) => {
    try {
      const res = await post<any>(
        "/locations/print-qrs",
        { ids },
        { responseType: "blob" },
      );
      const blob = new Blob([res as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      dispatch(showToast({ message: "PDF de QRs generado", type: "success" }));
      setIsBulkPrintModalOpen(false);
    } catch (error) {
      dispatch(
        showToast({ message: "Error al generar el PDF", type: "error" }),
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Identificación de Ubicación",
        type: "string",
        sortable: true,
        render: (row: any) => (
          <div className="flex items-center gap-3 py-1">
            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:text-emerald-500 transition-all">
              <FaMapMarkedAlt size={16} />
            </div>
            <div>
              <div className="font-bold text-slate-800 tracking-tight">
                {row.name}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                <FaBuilding size={10} className="text-slate-300" />
                {row.client?.name || row.clientName || "Sin Cliente"}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "zone",
        label: "Zona / Recurrente",
        type: "string",
        render: (row: any) => (
          <div className="px-3 py-1.5 bg-emerald-50/50 text-emerald-600 border border-emerald-100/50 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {row.zone?.name || "Sin Zona"}
          </div>
        ),
      },
      {
        key: "actions",
        label: "Acciones",
        type: "actions",
        actions: (row: Location) => (
          <div className="flex items-center gap-1">
            <ITButton
              onClick={() => handlePrintQR(row)}
              size="small"
              variant="ghost"
              className="!p-2 text-slate-400 hover:text-emerald-600"
              title="Individual QR"
            >
              <FaQrcode size={14} />
            </ITButton>
            {user?.role !== "OPERATOR" && (
              <>
                <ITButton
                  onClick={() => setEditingLocation(row)}
                  size="small"
                  variant="ghost"
                  className="!p-2 text-slate-400 hover:text-slate-600"
                  title="Editar"
                >
                  <FaEdit size={14} />
                </ITButton>
                <ITButton
                  onClick={() => setLocationToDelete(row)}
                  size="small"
                  variant="ghost"
                  className="!p-2 text-red-200 hover:text-red-500"
                  title="Eliminar"
                >
                  <FaTrash size={14} />
                </ITButton>
              </>
            )}
          </div>
        ),
      },
    ],
    [user],
  );

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen">
      <ModuleHeader
        title="Directorio de Ubicaciones"
        subtitle="Gestión y control de puntos QR para rondines y asistencia"
        icon={FaSearchLocation}
        actions={
          <>
            <div className="bg-white/50 backdrop-blur-sm border border-slate-100 p-6 rounded-[32px] mb-6 shadow-sm w-full">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-4">
                  <ITSearchSelect
                    className="!z-20"
                    placeholder="Buscar por Cliente..."
                    options={(clients || []).map((c: any) => ({
                      label: c.name,
                      value: c.id,
                    }))}
                    value={selectedClientId}
                    onChange={(val: any) => setSelectedClientId(val)}
                  />
                </div>
                <div className="lg:col-span-4 relative">
                  <ITInput
                    placeholder="Identificación de ubicación..."
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {}}
                    className="!py-2.5 !h-[44px] !rounded-2xl border-slate-200 !pr-10 bg-white"
                    iconLeft={<FaSearchLocation className="text-slate-400" />}
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
                <div className="lg:col-span-4 flex items-center gap-3">
                  {selectedClientId && (
                    <ITButton
                      onClick={() => setIsZonesModalOpen(true)}
                      variant="ghost"
                      className="flex-1 h-[44px] bg-emerald-50 text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-emerald-100 transition-all border border-emerald-100"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <FaMapMarkedAlt size={12} />
                        Zonas del Cliente
                      </div>
                    </ITButton>
                  )}
                  {(searchTerm || selectedClientId) && (
                    <ITButton
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedClientId("");
                      }}
                      variant="ghost"
                      className="h-[44px] px-5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 border border-red-100 transition-all"
                      title="Limpiar Filtros"
                    >
                      <div className="flex items-center gap-2">
                        <FaFilter size={12} />
                        <span className="font-black text-[10px] uppercase tracking-widest hidden xl:inline">
                          Limpiar
                        </span>
                      </div>
                    </ITButton>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 w-full">
              <ITButton
                onClick={() => setRefreshKey((prev) => prev + 1)}
                size="small"
                variant="ghost"
                className="h-10 w-10 p-0 flex justify-center items-center bg-slate-50 rounded-xl hover:bg-slate-100"
              >
                <FaSync
                  className={`text-slate-400 ${refreshKey % 2 === 0 ? "" : "rotate-180"}`}
                />
              </ITButton>

              <ITButton
                onClick={() => setIsBulkPrintModalOpen(true)}
                variant="outline"
                className="h-10 px-6 rounded-xl font-black text-[11px] uppercase tracking-widest border-emerald-100 text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 shadow-sm transition-all"
              >
                <FaPrint size={12} />
                Imprimir
              </ITButton>

              {user?.role !== "OPERATOR" && (
                <ITButton
                  onClick={() => setIsModalOpen(true)}
                  color="primary"
                  className="h-10 px-6 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                >
                  <FaPlus size={12} />
                  Nueva Ubicación
                </ITButton>
              )}
            </div>
          </>
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

      <BulkPrintModal
        isOpen={isBulkPrintModalOpen}
        onClose={() => setIsBulkPrintModalOpen(false)}
        onConfirm={handlePrintBulk}
        initialClientId={selectedClientId as string}
      />

      <ZonesModal
        isOpen={isZonesModalOpen}
        onClose={() => setIsZonesModalOpen(false)}
        clientId={selectedClientId as string}
        clientName={
          clients?.find((c: any) => String(c.id) === String(selectedClientId))
            ?.name || "Cliente"
        }
      />

      <ITDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registro de Ubicación"
      >
        <LocationForm
          initialData={
            selectedClientId
              ? {
                  clientId: selectedClientId as string,
                  aisle: "",
                  spot: "",
                  number: "",
                  name: "",
                }
              : undefined
          }
          onSubmit={handleCreate}
          onCancel={() => setIsModalOpen(false)}
        />
      </ITDialog>

      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Actualizar Ubicación"
      >
        {editingLocation && (
          <LocationForm
            initialData={editingLocation}
            onSubmit={handleEdit}
            onCancel={() => setEditingLocation(null)}
          />
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!locationToDelete}
        onClose={() => setLocationToDelete(null)}
        title="Confirmar Eliminación"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
            <FaTrash size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            ¿Eliminar ubicación?
          </h3>
          <p className="text-slate-500 text-sm mb-8">
            Estás por borrar{" "}
            <span className="font-bold text-slate-700">
              {locationToDelete?.name}
            </span>
            .<br />
            Esta acción es permanente y no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-center">
            <ITButton
              variant="outlined"
              color="secondary"
              onClick={() => setLocationToDelete(null)}
              className="!rounded-xl px-8"
            >
              No, Mantener
            </ITButton>
            <ITButton
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white !rounded-xl px-8 border-none"
            >
              Sí, Eliminar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default LocationsPage;

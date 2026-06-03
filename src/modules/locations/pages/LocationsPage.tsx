import { post } from "@app/core/axios/axios";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaEdit,
  FaFilter,
  FaMapMarkedAlt,
  FaPrint,
  FaQrcode,
  FaSearchLocation,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZonesModalOpen, setIsZonesModalOpen] = useState(false);
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    return { name: searchTerm };
  }, [searchTerm]);

  const handleCreate = async (data: any, keepOpen?: boolean) => {
    dispatch(showLoader());
    try {
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
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleEdit = async (data: any) => {
    if (!editingLocation) return;
    dispatch(showLoader());
    try {
      const res = await updateLocation(editingLocation.id, data);
      if (res.success) {
        dispatch(
          showToast({ message: "Ubicación actualizada", type: "success" }),
        );
        setEditingLocation(null);
        setRefreshKey((prev) => prev + 1);
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const confirmDelete = async () => {
    if (!locationToDelete) return;
    dispatch(showLoader());
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
    } finally {
      dispatch(hideLoader());
    }
  };

  const handlePrintQR = async (location: Location) => {
    dispatch(showLoader());
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
        showToast({ message: "PDF generado con éxito", type: "success" }),
      );
    } catch (e) {
      dispatch(
        showToast({ message: "Error al generar el PDF", type: "error" }),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const handlePrintBulk = async (ids: string[]) => {
    dispatch(showLoader());
    try {
      const res = await post<any>(
        "/locations/print-qrs",
        { ids },
        { responseType: "blob" },
      );
      const blob = new Blob([res as any], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      dispatch(
        showToast({ message: "PDF generado con éxito", type: "success" }),
      );
      setIsBulkPrintModalOpen(false);
    } catch (e) {
      dispatch(
        showToast({ message: "Error al generar el PDF", type: "error" }),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "UBICACIÓN / IDENTIFICACIÓN",
        type: "string",
        sortable: true,
        render: (row: any) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight">
              {row.name}
            </span>
          </div>
        ),
      },
      {
        key: "zone",
        label: "ZONA / RECURRENTE",
        type: "string",
        render: (row: any) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.zone?.name || "SIN ZONA"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                PUNTO DE CONTROL
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        label: "ACCIONES",
        type: "actions",
        actions: (row: Location) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => handlePrintQR(row)}
              size="small"
              variant="outlined"
              color="success"
              title="Individual QR"
            >
              <FaQrcode size={14} />
            </ITButton>
            {user?.role !== "OPERATOR" && (
              <>
                <ITButton
                  onClick={() => setEditingLocation(row)}
                  size="small"
                  variant="outlined"
                  title="Editar"
                >
                  <FaEdit size={14} />
                </ITButton>
                <ITButton
                  onClick={() => setLocationToDelete(row)}
                  size="small"
                  variant="outlined"
                  color="danger"
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
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Directorio de Ubicaciones"
        subtitle="Gestión y control de puntos QR para rondines y asistencia"
        icon={FaSearchLocation}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR UBICACIÓN...",
          icon: FaSearchLocation,
        }}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        refreshKey={refreshKey}
        onCreate={
          user?.role !== "OPERATOR" ? () => setIsModalOpen(true) : undefined
        }
        createLabel="Nueva Ubicación"
        actions={
          <div className="flex items-center gap-3">
            <ITButton
              onClick={() => setIsZonesModalOpen(true)}
              variant="filled"
              color="secondary"
            >
              <div className="flex items-center gap-2">
                <FaMapMarkedAlt size={12} />
                <span className="hidden lg:inline">Zonas</span>
              </div>
            </ITButton>

            <ITButton
              onClick={() => setIsBulkPrintModalOpen(true)}
              variant="filled"
              color="secondary"
            >
              <div className="flex items-center gap-2">
                <FaPrint size={12} />
                <span className="hidden lg:inline">Imprimir</span>
              </div>
            </ITButton>

            {searchTerm && (
              <ITButton
                onClick={() => {
                  setSearchTerm("");
                }}
                variant="filled"
                color="error"
                size="small"
                title="Limpiar Filtros"
              >
                <FaFilter size={12} />
              </ITButton>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
      />

      <ZonesModal
        isOpen={isZonesModalOpen}
        onClose={() => setIsZonesModalOpen(false)}
      />

      <ITDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registro de Ubicación"
        className="!max-w-2xl !w-full"
      >
        {isModalOpen && (
          <LocationForm
            onSubmit={handleCreate}
            onCancel={() => setIsModalOpen(false)}
          />
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Actualizar Ubicación"
        className="!max-w-2xl !w-full"
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
        title="Eliminar Ubicación"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Ubicación?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Estás por borrar{" "}
            <span className="font-bold text-slate-700">
              {locationToDelete?.name}
            </span>
            . Esta acción es permanente y no se puede deshacer.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setLocationToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDelete}
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

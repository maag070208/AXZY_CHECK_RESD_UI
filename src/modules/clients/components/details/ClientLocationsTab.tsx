import { post } from "@app/core/axios/axios";
import { showToast } from "@app/core/store/toast/toast.slice";
import { BulkPrintModal } from "@app/modules/locations/components/BulkPrintModal";
import { LocationForm } from "@app/modules/locations/components/LocationForm";
import {
  Location,
  createLocation,
  deleteLocation,
  getPaginatedLocations,
  updateLocation,
} from "@app/modules/locations/service/locations.service";
import { ITButton, ITDataTable, ITDialog } from "@axzydev/axzy_ui_system";
import { useCallback, useState } from "react";
import {
  FaEdit,
  FaMapMarkerAlt,
  FaPlus,
  FaQrcode,
  FaSync,
  FaTrash,
} from "react-icons/fa";
import { useDispatch } from "react-redux";

interface Props {
  clientId: string;
}

export const ClientLocationsTab = ({ clientId }: Props) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkPrintOpen, setIsBulkPrintOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedLocations({
        ...params,
        filters: { ...params.filters, clientId },
      });
    },
    [clientId],
  );

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
      setIsBulkPrintOpen(false);
    } catch (error) {
      dispatch(
        showToast({ message: "Error al generar el PDF", type: "error" }),
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta ubicación?")) return;
    const res = await deleteLocation(id);
    if (res.success) {
      dispatch(showToast({ message: "Ubicación eliminada", type: "success" }));
      setRefreshKey((prev) => prev + 1);
    } else {
      dispatch(
        showToast({
          message: res.messages?.[0] || "Error al eliminar",
          type: "error",
        }),
      );
    }
  };

  const columns = [
    {
      key: "name",
      label: "Identificación de Ubicación",
      type: "string",
      render: (row: Location) => (
        <div className="flex items-center gap-3 py-1">
          <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-emerald-500 transition-colors">
            <FaMapMarkerAlt size={14} />
          </div>
          <div>
            <div className="font-bold text-slate-700 tracking-tight">
              {row.name}
            </div>
            {row.reference && (
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
                Ref: {row.reference}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "zone",
      label: "Zona / Recurrente",
      type: "string",
      render: (row: any) => (
        <div className="px-3 py-1 bg-emerald-50/50 text-emerald-600 border border-emerald-100/50 rounded-full text-[10px] font-black uppercase tracking-widest inline-block">
          {row.zone?.name || "Sin Zona"}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      actions: (row: Location) => (
        <div className="flex gap-1 justify-end">
          <ITButton
            onClick={() => {
              setIsBulkPrintOpen(true);
            }}
            size="small"
            variant="ghost"
            className="text-slate-400 hover:text-emerald-600 p-2"
            title="Asistente QR"
          >
            <FaQrcode size={14} />
          </ITButton>
          <ITButton
            onClick={() => setEditingLocation(row)}
            size="small"
            variant="ghost"
            className="text-slate-400 hover:text-slate-600 p-2"
            title="Editar"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => handleDelete(row.id)}
            size="small"
            variant="ghost"
            className="text-red-200 hover:text-red-500 p-2"
            title="Eliminar"
          >
            <FaTrash size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.1em]">
            Directorio de Ubicaciones
          </h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
            Gestión de puntos de control y códigos QR
          </p>
        </div>
        <div className="flex gap-2">
          <ITButton
            onClick={() => setRefreshKey((prev) => prev + 1)}
            size="small"
            variant="ghost"
            className="h-10 w-10 p-0 flex justify-center items-center bg-slate-50 rounded-xl hover:bg-slate-100"
          >
            <FaSync className="text-slate-400" />
          </ITButton>
          <ITButton
            onClick={() => setIsBulkPrintOpen(true)}
            variant="outline"
            className="h-10 px-6 rounded-xl font-black text-[11px] uppercase tracking-widest border-emerald-100 text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-all"
          >
            <FaQrcode size={12} />
            Imprimir
          </ITButton>
          <ITButton
            onClick={() => setIsCreateModalOpen(true)}
            color="primary"
            className="h-10 px-6 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <FaPlus size={12} />
            Nueva Ubicación
          </ITButton>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={5}
        />
      </div>

      <ITDialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Registrar Nueva Ubicación"
      >
        <div className="p-2">
          <LocationForm
            initialData={{
              clientId: String(clientId),
              aisle: "",
              spot: "",
              number: "",
              name: "",
            }}
            onSubmit={async (data, keepOpen) => {
              const res = await createLocation(data);
              if (res.success) {
                if (!keepOpen) {
                  setIsCreateModalOpen(false);
                }
                setRefreshKey((prev) => prev + 1);
                dispatch(
                  showToast({
                    message: "Ubicación creada con éxito",
                    type: "success",
                  }),
                );
              } else {
                dispatch(
                  showToast({
                    message: res.messages?.[0] || "Error al crear",
                    type: "error",
                  }),
                );
              }
            }}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!editingLocation}
        onClose={() => setEditingLocation(null)}
        title="Actualizar Información de Ubicación"
      >
        {editingLocation && (
          <div className="p-2">
            <LocationForm
              initialData={editingLocation}
              onSubmit={async (data) => {
                const res = await updateLocation(editingLocation.id, data);
                if (res.success) {
                  setEditingLocation(null);
                  setRefreshKey((prev) => prev + 1);
                  dispatch(
                    showToast({
                      message: "Ubicación actualizada",
                      type: "success",
                    }),
                  );
                } else {
                  dispatch(
                    showToast({
                      message: res.messages?.[0] || "Error al actualizar",
                      type: "error",
                    }),
                  );
                }
              }}
              onCancel={() => setEditingLocation(null)}
            />
          </div>
        )}
      </ITDialog>

      <BulkPrintModal
        isOpen={isBulkPrintOpen}
        onClose={() => setIsBulkPrintOpen(false)}
        onConfirm={handlePrintBulk}
        initialClientId={clientId}
      />
    </div>
  );
};

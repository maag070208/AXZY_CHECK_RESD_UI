import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITText,
} from "@axzydev/axzy_ui_system";
import { post } from "@app/core/axios/axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit, FaPrint, FaRoute, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteRoute, getPaginatedRoutes } from "../services/RoutesService";

const RoutesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [routeToDeleteId, setRouteToDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setRefreshKey((prev) => prev + 1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const externalFilters = useMemo(() => {
    return {
      title: searchTerm,
    };
  }, [searchTerm]);

  const memoizedFetch = useCallback((params: any) => {
    return getPaginatedRoutes(params);
  }, []);

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleDelete = (id: number) => {
    setRouteToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!routeToDeleteId) return;
    dispatch(showLoader());
    try {
      const res = await deleteRoute(String(routeToDeleteId));
      setRouteToDeleteId(null);
      if (res.success) {
        dispatch(showToast({ message: "Ruta eliminada", type: "success" }));
        refreshTable();
      } else {
        dispatch(showToast({ message: "Error al eliminar", type: "error" }));
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleEdit = (route: any) => {
    navigate(`/routes/edit/${route.id}`);
  };

  const handlePrintRouteQRs = async (row: any) => {
    const ids =
      row.recurringLocations
        ?.map((rl: any) => rl.locationId || rl.location?.id)
        .filter(Boolean) || [];

    if (ids.length === 0) {
      dispatch(
        showToast({
          message: "Esta ruta no tiene puntos de control para imprimir",
          type: "warning",
        }),
      );
      return;
    }

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
    } catch (e) {
      dispatch(
        showToast({ message: "Error al generar el PDF de QRs", type: "error" }),
      );
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleCreate = () => {
    navigate("/routes/new");
  };

  const columns = [
    {
      key: "title",
      label: "Ruta / Referencia",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col">
          <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
            {row.title}
          </ITText>
        </div>
      ),
    },
    {
      key: "locations",
      label: "PUNTOS DE CONTROL",
      type: "string",
      render: (row: any) => (
        <div className="flex flex-col">
          <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
            {row.recurringLocations?.length || 0} Puntos QR
          </ITText>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
              Ubicación:{" "}
              {row.recurringLocations?.[0]?.location?.name || "Multiple"}
            </ITText>
          </div>
        </div>
      ),
    },
    {
      key: "active",
      label: "ESTADO",
      type: "string",
      render: (row: any) => (
        <ITBadget color={row.active ? "success" : "error"} size="small">
          {row.active ? "ACTIVO" : "INACTIVO"}
        </ITBadget>
      ),
    },
    {
      key: "actions",
      label: "CONTROL",
      type: "actions",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => handlePrintRouteQRs(row)}
            variant="outlined"
            title="Imprimir QRs"
            size="small"
            color="secondary"
          >
            <FaPrint size={14} />
          </ITButton>
          <ITButton
            onClick={() => handleEdit(row)}
            variant="outlined"
            title="Editar Ruta"
            size="small"
            color="info"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => handleDelete(row.id)}
            variant="outlined"
            color="danger"
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
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Gestión de Rutas"
        subtitle="Configuración de recorridos and puntos de control para rondines"
        icon={FaRoute}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR RUTA...",
          icon: FaRoute,
        }}
        showClearFilters={!!searchTerm}
        onClearFilters={() => {
          setSearchTerm("");
          setRefreshKey((prev) => prev + 1);
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        onCreate={handleCreate}
        createLabel="Nueva Ruta"
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

      <ITDialog
        isOpen={!!routeToDeleteId}
        onClose={() => setRouteToDeleteId(null)}
        title="Eliminar Ruta"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Ruta Operativa?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Estás por borrar la ruta y sus puntos de control. Esta acción es permanente.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setRouteToDeleteId(null)}
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

export default RoutesPage;

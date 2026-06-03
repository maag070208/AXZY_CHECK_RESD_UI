import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITDataTable, ITDialog, ITText } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import {
  FaChartBar,
  FaEdit,
  FaExclamationTriangle,
  FaFilePdf,
  FaLockOpen,
  FaPlay,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { AperturaCierreReportModal } from "../components/AperturaCierreReportModal";
import {
  deleteReportConfiguration,
  getPaginatedReportConfigurations,
} from "../services/ReportConfigurationsService";
import { generateAdministrativeMatrixPDF } from "../services/ReportsService";

const ReportsPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [configToDeleteId, setConfigToDeleteId] = useState<string | null>(null);

  const [aperturaCierreOpen, setAperturaCierreOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [configToEdit, setConfigToEdit] = useState<any>(null);

  const fetchData = useCallback(
    async (params: any) => {
      const res = await getPaginatedReportConfigurations({
        ...params,
        searchTerm,
      });

      return res.success
        ? {
            data: res.data.rows,
            total: res.data.total,
          }
        : {
            data: [],
            total: 0,
          };
    },
    [searchTerm],
  );

  const handleGenerateSavedReport = async (configRow: any) => {
    setIsGenerating(configRow.id);
    try {
      if (configRow.reportType === "ADMINISTRATIVE_MATRIX") {
        const { recurringConfigurationIds, startDate, endDate } =
          configRow.configuration;
        const response = await generateAdministrativeMatrixPDF({
          recurringConfigurationIds,
          startDate,
          endDate,
        });

        const url = window.URL.createObjectURL(
          new Blob([response as any], { type: "application/pdf" }),
        );
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `${configRow.name.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD")}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        dispatch(
          showToast({
            message: "Reporte generado con éxito",
            type: "success",
          }),
        );
      } else {
        dispatch(
          showToast({
            message: "Tipo de reporte no soportado aún",
            type: "info",
          }),
        );
      }
    } catch (error) {
      dispatch(
        showToast({
          message: "Error al generar reporte",
          type: "error",
        }),
      );
    } finally {
      setIsGenerating(null);
    }
  };

  const handleEdit = (row: any) => {
    if (row.reportType === "ADMINISTRATIVE_MATRIX") {
      setConfigToEdit(row);
      setAperturaCierreOpen(true);
    } else {
      dispatch(
        showToast({
          message: "Este tipo de reporte no se puede editar",
          type: "info",
        }),
      );
    }
  };

  const handleDelete = (id: string) => {
    setConfigToDeleteId(id);
  };

  const confirmDeleteConfig = async () => {
    if (!configToDeleteId) return;
    const res = await deleteReportConfiguration(configToDeleteId);
    if (res.success) {
      dispatch(
        showToast({
          message: "Configuración eliminada",
          type: "success",
        }),
      );
      setRefreshKey((prev) => prev + 1);
    } else {
      dispatch(
        showToast({
          message: "Error al eliminar configuración",
          type: "error",
        }),
      );
    }
    setConfigToDeleteId(null);
  };

  const columns = [
    {
      label: "Configuración",
      key: "name",
      render: (row: any) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
            {row.name}
          </span>
        </div>
      ),
    },
    {
      label: "Tipo",
      key: "reportType",
      render: (row: any) => (
        <ITBadget color="primary" size="small">
          {row.reportType === "ADMINISTRATIVE_MATRIX"
            ? "APERTURA / CIERRE"
            : row.reportType}
        </ITBadget>
      ),
    },
    {
      label: "Detalles",
      key: "configuration",
      render: (row: any) => {
        const conf = row.configuration;
        return (
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {conf.startDate && conf.endDate
              ? `${dayjs(conf.startDate).format("DD/MM/YY")} - ${dayjs(conf.endDate).format("DD/MM/YY")}`
              : "Sin Rango"}
            {conf.recurringConfigurationIds && (
              <span className="block mt-0.5 text-slate-400">
                {conf.recurringConfigurationIds.length} Rutas
              </span>
            )}
          </div>
        );
      },
    },
    {
      label: "Acciones",
      key: "id",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <ITButton
            onClick={() => handleGenerateSavedReport(row)}
            variant="outlined"
            title="Generar PDF"
            size="small"
            color="success"
            disabled={isGenerating === row.id}
          >
            {isGenerating === row.id ? (
              <FaPlay className="animate-spin" size={14} />
            ) : (
              <FaFilePdf size={14} />
            )}
          </ITButton>
          <ITButton
            onClick={() => handleEdit(row)}
            variant="outlined"
            title="Editar"
            size="small"
          >
            <FaEdit size={14} />
          </ITButton>
          <ITButton
            onClick={() => handleDelete(row.id)}
            variant="outlined"
            color="danger"
            title="Eliminar"
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
        title="Reportes Guardados"
        subtitle="Generación de documentos y matrices de rendimiento"
        icon={FaChartBar}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR REPORTE...",
        }}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        refreshKey={refreshKey}
      />

      <div className="mb-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
          Tipos de Reportes Disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CARD: Apertura / Cierre */}
          <div
            onClick={() => setAperturaCierreOpen(true)}
            className="bg-white rounded-2xl p-6 cursor-pointer border border-slate-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-100 transition-all group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
              <FaLockOpen
                size={20}
                className="text-emerald-600 group-hover:text-white transition-colors"
              />
            </div>
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 mb-2">
              Apertura / Cierre
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
              Matriz de asistencia por punto de control. Valida evidencia
              obligatoria por día en un rango de fechas.
            </p>
            <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-widest gap-2">
              <span>CONFIGURAR REPORTE</span>
              <FaChartBar />
            </div>
          </div>

          {/* CARD: Incidencias Placeholder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
              <FaExclamationTriangle size={20} className="text-slate-400" />
            </div>
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 mb-2">
              Reporte de Incidencias
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
              (Próximamente) Resumen analítico de incidencias por zona y
              clasificación.
            </p>
          </div>

          {/* CARD: Rendimiento de Guardias Placeholder */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 opacity-60 cursor-not-allowed">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
              <FaUserShield size={20} className="text-slate-400" />
            </div>
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-800 mb-2">
              Rendimiento Guardia
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
              (Próximamente) Estadísticas de desempeño y carga de trabajo por
              guardia.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
          Configuraciones Guardadas
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <ITDataTable
            key={refreshKey}
            columns={columns as any}
            fetchData={fetchData}
          />
        </div>
      </div>

      <ITDialog
        isOpen={!!configToDeleteId}
        onClose={() => setConfigToDeleteId(null)}
        title="Eliminar Configuración"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Configuración?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción es permanente y no se puede deshacer.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setConfigToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDeleteConfig}
            >
              ELIMINAR AHORA
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* MODAL: CONFIGURACION APERTURA / CIERRE */}
      <AperturaCierreReportModal
        isOpen={aperturaCierreOpen}
        configToEdit={configToEdit}
        onClose={() => {
          setAperturaCierreOpen(false);
          setConfigToEdit(null);
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </div>
  );
};

export default ReportsPage;

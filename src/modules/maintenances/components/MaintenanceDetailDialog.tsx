import { ITBadget, ITButton, ITDialog } from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { ITMediaGrid } from "@core/components/ITMediaGrid";
import dayjs from "dayjs";
import { FaCheck, FaCheckCircle, FaFileAlt, FaTrash } from "react-icons/fa";
import { Maintenance } from "../services/MaintenanceService";

interface MaintenanceDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenance: Maintenance | null;
  onResolve: (id: number) => void;
  onDelete: (maintenance: Maintenance) => void;
  isAdmin: boolean;
  isClient: boolean;
}

const MaintenanceDetailDialog = ({
  isOpen,
  onClose,
  maintenance,
  onResolve,
  onDelete,
  isAdmin,
  isClient,
}: MaintenanceDetailDialogProps) => {
  if (!maintenance) return null;

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Mantenimiento"
      className="!max-w-[95vw] md:!max-w-[80vw] lg:!max-w-5xl !w-full"
    >
      <div className="flex flex-col h-[85vh] w-full bg-white overflow-hidden">
        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Columna Principal - Contenido */}
            <div className="lg:col-span-7 space-y-10">
              {/* Tarjeta de Contenido */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Información General
                    </h4>
                  </div>
                  <ITBadget
                    color={
                      maintenance.status === "ATTENDED" ? "success" : "danger"
                    }
                    label={
                      maintenance.status === "ATTENDED"
                        ? "ATENDIDA"
                        : "PENDIENTE"
                    }
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight break-words">
                    {maintenance.title}
                  </h3>

                  <div className="flex flex-wrap gap-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Categoría
                      </span>
                      <span className="text-[11px] font-black text-slate-600 uppercase">
                        {maintenance.category || "GENERAL"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        ID Reporte
                      </span>
                      <span className="text-[11px] font-black text-slate-400 uppercase">
                        #{maintenance.id.toString().slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-slate-600 text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                      {maintenance.description ||
                        "Sin descripción detallada disponible."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Multimedia */}
              <section>
                {maintenance.media && maintenance.media.length > 0 ? (
                  <ITMediaGrid
                    media={maintenance.media}
                    title={maintenance.title}
                    gridSize={220}
                  />
                ) : (
                  <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                    <FaFileAlt size={32} className="mb-3 opacity-10" />
                    <p className="font-black text-[10px] uppercase tracking-widest">
                      Sin archivos adjuntos
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Columna Lateral - Info y Acciones */}
            <div className="lg:col-span-5 space-y-6">
              {/* Guardia que reporta */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-3 bg-slate-200 rounded-full" />
                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Información del Reportante
                  </h5>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center text-base font-black shrink-0">
                    {maintenance.guard?.name?.[0]}
                    {maintenance.guard?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight truncate">
                      {maintenance.guard?.name} {maintenance.guard?.lastName}
                    </p>
                    <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-0.5 truncate">
                      @{maintenance.guard?.username}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Fecha
                    </span>
                    <span className="text-[10px] font-black text-slate-700 uppercase">
                      {dayjs(maintenance.createdAt).format("DD MMM YYYY")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Horario
                    </span>
                    <span className="text-[10px] font-black text-slate-700 uppercase">
                      {dayjs(maintenance.createdAt).format("HH:mm")} HRS
                    </span>
                  </div>
                </div>
              </div>

              {/* Mapa en Sidebar */}
              {maintenance.latitude && maintenance.longitude && (
                <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-2">
                    <div className="w-1 h-3 bg-blue-500 rounded-full" />
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Ubicación del Reporte
                    </h5>
                  </div>
                  <div className="rounded-2xl overflow-hidden h-48 border border-slate-50">
                    <GoogleMapComponent
                      lat={maintenance.latitude}
                      lng={maintenance.longitude}
                      height="100%"
                    />
                  </div>
                </div>
              )}

              {/* Información de Resolución */}
              {maintenance.status === "ATTENDED" && maintenance.resolvedBy && (
                <div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <FaCheckCircle size={60} />
                  </div>
                  <div className="relative z-10">
                    <h5 className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-6">
                      Atención Finalizada
                    </h5>
                    <div className="space-y-4 text-xs">
                      <div>
                        <p className="opacity-60 mb-1 uppercase tracking-widest text-[8px] font-black">
                          Gestionado por:
                        </p>
                        <p className="font-black uppercase text-[12px] tracking-tight">
                          {maintenance.resolvedBy.name}{" "}
                          {maintenance.resolvedBy.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="opacity-60 mb-1 uppercase tracking-widest text-[8px] font-black">
                          Fecha y Hora:
                        </p>
                        <p className="font-black uppercase text-[12px] tracking-tight">
                          {dayjs(maintenance.resolvedAt).format(
                            "DD MMM YYYY • HH:mm",
                          )}{" "}
                          HRS
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Acción Pendiente */}
              {maintenance.status === "PENDING" && !isClient && (
                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                  <h5 className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-3">
                    Respuesta Requerida
                  </h5>
                  <p className="text-[10px] text-orange-700 font-bold leading-relaxed mb-6 uppercase tracking-tight">
                    Este reporte requiere validación técnica inmediata.
                  </p>
                  <ITButton
                    onClick={() => onResolve(maintenance.id as any)}
                    variant="filled"
                    color="success"
                    className="w-full !rounded-xl !h-12 shadow-md shadow-emerald-500/10"
                  >
                    <div className="flex items-center justify-center gap-2 font-black text-[9px] tracking-widest uppercase">
                      <FaCheck size={12} /> Finalizar Atención
                    </div>
                  </ITButton>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Standardized Footer */}
        <div className="flex-none flex justify-end items-center px-8 py-6 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            variant="filled"
            color="secondary"
            className="px-6 font-black text-[10px] uppercase tracking-widest"
            onClick={onClose}
          >
            Cerrar Visor
          </ITButton>

          {isAdmin && (
            <ITButton
              variant="outlined"
              color="danger"
              className="px-6 !border-rose-100 !bg-white !text-rose-500 hover:!bg-rose-50"
              onClick={() => onDelete(maintenance)}
            >
              <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                <FaTrash size={12} /> Eliminar Reporte
              </div>
            </ITButton>
          )}
        </div>
      </div>
    </ITDialog>
  );
};

export default MaintenanceDetailDialog;

import { ITBadget, ITButton, ITDialog } from "@axzydev/axzy_ui_system";
import { GoogleMapComponent } from "@core/components/GoogleMapComponent";
import { ITMediaGrid } from "@core/components/ITMediaGrid";
import dayjs from "dayjs";
import { FaCheck, FaCheckCircle, FaFileAlt, FaTrash } from "react-icons/fa";
import { Incident } from "../services/IncidentService";

interface IncidentDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onResolve: (id: number) => void;
  onDelete: (incident: Incident) => void;
  isAdmin: boolean;
  isClient: boolean;
}

const IncidentDetailDialog = ({
  isOpen,
  onClose,
  incident,
  onResolve,
  onDelete,
  isAdmin,
  isClient,
}: IncidentDetailDialogProps) => {
  if (!incident) return null;

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Incidencia"
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
                    <div className="w-1.5 h-4 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Información General
                    </h4>
                  </div>
                  <ITBadget
                    color={
                      incident.status === "ATTENDED" ? "success" : "danger"
                    }
                    label={
                      incident.status === "ATTENDED" ? "ATENDIDA" : "PENDIENTE"
                    }
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight break-words">
                    {incident.title}
                  </h3>

                  <div className="flex flex-wrap gap-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Categoría
                      </span>
                      <span className="text-[11px] font-black text-slate-600 uppercase">
                        {incident.category?.name || "GENERAL"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Tipo
                      </span>
                      <span className="text-[11px] font-black text-slate-600 uppercase">
                        {incident.type?.name || "S/T"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-slate-600 text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                      {incident.description ||
                        "Sin descripción detallada disponible."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Multimedia */}
              <section>
                {incident.media && incident.media.length > 0 ? (
                  <ITMediaGrid
                    media={incident.media}
                    title={incident.title}
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
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-base font-black shrink-0">
                    {incident.guard?.name?.[0]}
                    {incident.guard?.lastName?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-slate-800 uppercase tracking-tight truncate">
                      {incident.guard?.name} {incident.guard?.lastName}
                    </p>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5 truncate">
                      @{incident.guard?.username}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Fecha
                    </span>
                    <span className="text-[10px] font-black text-slate-700 uppercase">
                      {dayjs(incident.createdAt).format("DD MMM YYYY")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Horario
                    </span>
                    <span className="text-[10px] font-black text-slate-700 uppercase">
                      {dayjs(incident.createdAt).format("HH:mm")} HRS
                    </span>
                  </div>
                </div>
              </div>

              {/* Mapa en Sidebar */}
              {incident.latitude && incident.longitude && (
                <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 flex items-center gap-2">
                    <div className="w-1 h-3 bg-blue-500 rounded-full" />
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Ubicación del Reporte
                    </h5>
                  </div>
                  <div className="rounded-2xl overflow-hidden h-48 border border-slate-50">
                    <GoogleMapComponent
                      lat={incident.latitude}
                      lng={incident.longitude}
                      height="100%"
                    />
                  </div>
                </div>
              )}

              {/* Información de Resolución */}
              {incident.status === "ATTENDED" && incident.resolvedBy && (
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
                          {incident.resolvedBy.name}{" "}
                          {incident.resolvedBy.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="opacity-60 mb-1 uppercase tracking-widest text-[8px] font-black">
                          Fecha y Hora:
                        </p>
                        <p className="font-black uppercase text-[12px] tracking-tight">
                          {dayjs(incident.resolvedAt).format(
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
              {incident.status === "PENDING" && !isClient && (
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                  <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3">
                    Respuesta Requerida
                  </h5>
                  <p className="text-[10px] text-rose-700 font-bold leading-relaxed mb-6 uppercase tracking-tight">
                    Este reporte requiere validación inmediata.
                  </p>
                  <ITButton
                    onClick={() => onResolve(incident.id as any)}
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
              onClick={() => onDelete(incident)}
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

export default IncidentDetailDialog;

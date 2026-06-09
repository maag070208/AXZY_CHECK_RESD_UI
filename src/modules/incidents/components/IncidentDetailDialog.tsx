import { ITBadget, ITButton, ITDialog, ITText } from "@axzydev/axzy_ui_system";
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
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <ITText className="text-sm font-semibold text-gray-900">
                    Información General
                  </ITText>
                  <ITBadget
                    color={
                      incident.status === "ATTENDED" ? "success" : "danger"
                    }
                    label={
                      incident.status === "ATTENDED" ? "ATENDIDA" : "PENDIENTE"
                    }
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight break-words">
                    {incident.title}
                  </h3>

                  <div className="flex flex-wrap gap-6">
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

                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <p className="text-slate-600 text-[13px] leading-relaxed whitespace-pre-wrap font-medium">
                      {incident.description ||
                        "Sin descripción detallada disponible."}
                    </p>
                  </div>
                </div>
              </section>

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

            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <ITText className="text-sm font-semibold text-gray-900 mb-4">
                  Información del Reportante
                </ITText>

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

                <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
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

              {incident.latitude && incident.longitude && (
                <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-3">
                    <ITText className="text-sm font-semibold text-gray-900 mb-3">
                      Ubicación del Reporte
                    </ITText>
                  </div>
                  <div className="rounded-xl overflow-hidden h-48 border border-slate-50">
                    <GoogleMapComponent
                      lat={incident.latitude}
                      lng={incident.longitude}
                      height="100%"
                    />
                  </div>
                </div>
              )}

              {incident.status === "ATTENDED" && incident.resolvedBy && (
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FaCheckCircle size={16} className="text-emerald-500" />
                    <ITText className="text-sm font-semibold text-gray-900">
                      Atención Finalizada
                    </ITText>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Gestionado por:
                      </p>
                      <p className="font-black uppercase text-[12px] tracking-tight text-slate-800">
                        {incident.resolvedBy.name}{" "}
                        {incident.resolvedBy.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Fecha y Hora:
                      </p>
                      <p className="font-black uppercase text-[12px] tracking-tight text-slate-800">
                        {dayjs(incident.resolvedAt).format(
                          "DD MMM YYYY • HH:mm",
                        )}{" "}
                        HRS
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {incident.status === "PENDING" && !isClient && (
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                  <ITText className="text-sm font-semibold text-gray-900 mb-2">
                    Respuesta Requerida
                  </ITText>
                  <p className="text-[10px] text-slate-600 font-bold leading-relaxed mb-4 uppercase tracking-tight">
                    Este reporte requiere validación inmediata.
                  </p>
                  <ITButton
                    onClick={() => onResolve(incident.id as any)}
                    variant="filled"
                    color="success"
                    className="w-full !rounded-lg !h-10"
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

        <div className="flex-none flex justify-end items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 gap-3">
          <ITButton
            variant="outlined"
            className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
            onClick={onClose}
          >
            Cerrar Visor
          </ITButton>

          {isAdmin && (
            <ITButton
              variant="filled"
              color="danger"
              className="!rounded-lg"
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

import {
  ITBadget,
  ITButton,
  ITDialog,
  ITLoader,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaCheckDouble,
  FaChevronRight,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaSync,
  FaUserShield,
} from "react-icons/fa";
import {
  getAllAssignmentsByGuard,
  updateAssignmentStatus,
} from "../service/guards.service";
import { Assignment, AssignmentStatus } from "../types/guards.types";
import dayjs from "dayjs";
import { ITMediaGrid } from "@app/core/components/ITMediaGrid";

// Fallback for API Base URL if constant is missing
const API_BASE_URL = "http://localhost:4444";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: any;
  guardName: string;
  guard: any;
  onReassignClient: () => void;
  onReassignSchedule: () => void;
}

const statusTranslations: Record<AssignmentStatus, string> = {
  [AssignmentStatus.PENDING]: "PENDIENTE",
  [AssignmentStatus.CHECKING]: "EN PROCESO",
  [AssignmentStatus.UNDER_REVIEW]: "BAJO REVISIÓN",
  [AssignmentStatus.REVIEWED]: "REVISADO",
  [AssignmentStatus.ANOMALY]: "ANOMALÍA",
  [AssignmentStatus.COMPLETED]: "COMPLETADO",
  [AssignmentStatus.CANCELLED]: "CANCELADO",
  [AssignmentStatus.ACTIVE]: "ACTIVO",
};

export const ViewAssignmentsModal = ({
  isOpen,
  onClose,
  guardId,
  guardName,
  guard,
  onReassignClient,
  onReassignSchedule,
}: Props) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const fetchAssignments = async () => {
    setLoading(true);
    const res = await getAllAssignmentsByGuard(guardId);
    if (res.success && res.data) {
      setAssignments(res.data);
      if (selectedAssignment) {
        const updated = res.data.find((a) => a.id === selectedAssignment.id);
        if (updated) setSelectedAssignment(updated);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssignments();
    } else {
      setSelectedAssignment(null);
    }
  }, [isOpen, guardId]);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    const res = await updateAssignmentStatus(id, AssignmentStatus.REVIEWED);
    if (res.success) {
      await fetchAssignments();
    }
    setApprovingId(null);
  };

  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.REVIEWED:
        return "success";
      case AssignmentStatus.PENDING:
        return "warning";
      case AssignmentStatus.ANOMALY:
        return "danger";
      case AssignmentStatus.CHECKING:
        return "primary";
      case AssignmentStatus.UNDER_REVIEW:
        return "success";
      default:
        return "secondary";
    }
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-6xl !w-full"
    >
      <div className="flex flex-col h-[85vh] bg-[#F8FAFC]">
        {/* Profile Header */}
        <div className="flex-none p-8 bg-white border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 shadow-sm">
                {guardName.charAt(0)}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                  {guardName}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                    <FaUserShield size={10} />
                    {guard?.client?.name || "Sin Cliente"}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
                    <FaClock size={10} />
                    {guard?.schedule?.name || "Sin Turno"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ITButton
                onClick={onReassignSchedule}
                variant="outline"
                className="!rounded-xl !h-11 !px-5 !border-slate-100 !bg-white !text-amber-500 hover:!bg-amber-50"
              >
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                  <FaClock /> Turno
                </div>
              </ITButton>
              <ITButton
                onClick={onReassignClient}
                variant="outline"
                className="!rounded-xl !h-11 !px-5 !border-slate-100 !bg-white !text-indigo-500 hover:!bg-indigo-50"
              >
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                  <FaUserShield /> Cliente
                </div>
              </ITButton>
              <div className="w-px h-8 bg-slate-100 mx-1" />
              <ITButton
                onClick={fetchAssignments}
                variant="ghost"
                className="!w-11 !h-11 !rounded-xl !text-slate-400"
              >
                <FaSync className={loading ? "animate-spin" : ""} />
              </ITButton>
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading && !selectedAssignment && !assignments.length ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <ITLoader />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Cargando expediente...</p>
            </div>
          ) : selectedAssignment ? (
            /* DETAIL VIEW - 8/4 Layout */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-8">
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:border-emerald-100 transition-all shadow-sm"
                >
                  <FaArrowLeft size={14} />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      Reporte de Ubicación
                    </h4>
                    <ITBadget
                      color={getStatusColor(selectedAssignment.status)}
                      variant="outlined"
                      className="font-black text-[9px] px-3 tracking-widest"
                    >
                      {statusTranslations[selectedAssignment.status]}
                    </ITBadget>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    ID #{selectedAssignment.id} • {selectedAssignment.location?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (8): Evidence and Checklist */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Evidence Card */}
                  <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Evidencia Multimedia
                      </h5>
                    </div>
                    
                    {selectedAssignment.kardex?.flatMap((k: any) => k.media || []).length ? (
                      <ITMediaGrid
                        media={selectedAssignment.kardex
                          .flatMap((k: any) => k.media || [])
                          .map((m: any) => ({
                            ...m,
                            url: m.url.startsWith("http")
                              ? m.url
                              : `${API_BASE_URL}${m.url.replace("/api/v1", "")}`,
                          }))}
                        gridSize={280}
                      />
                    ) : (
                      <div className="py-20 bg-slate-50/50 rounded-[24px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <FaFileAlt className="text-slate-200 text-4xl mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sin registros visuales</p>
                      </div>
                    )}
                  </div>

                  {/* Checklist Card */}
                  <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Consignas Operativas
                    </h5>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {selectedAssignment.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                            task.completed 
                              ? "bg-emerald-50/30 border-emerald-100" 
                              : "bg-slate-50/30 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow-sm transition-all ${
                              task.completed ? "bg-emerald-500 text-white" : "bg-white text-slate-200 border border-slate-100"
                            }`}>
                              <FaCheckCircle />
                            </div>
                            <span className={`text-[11px] font-black uppercase tracking-tight ${task.completed ? "text-emerald-700" : "text-slate-600"}`}>
                              {task.description}
                            </span>
                          </div>
                          {task.completed && (
                            <div className="text-right">
                              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Completada</p>
                              <p className="text-[9px] font-bold text-slate-400">{dayjs(task.completedAt).format("HH:mm")} hrs</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {selectedAssignment.notes && (
                      <div className="mt-8 pt-8 border-t border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Observaciones del Guardia</p>
                        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100/50">
                          <p className="text-xs text-slate-600 font-bold italic leading-relaxed">
                            "{selectedAssignment.notes}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (4): Info and Status */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm sticky top-8">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Información General</h5>
                    
                    <div className="space-y-8">
                      <DetailItem
                        icon={<FaMapMarkerAlt className="text-emerald-500" />}
                        label="Ubicación"
                        value={selectedAssignment.location?.name}
                        subValue={`Zona ${selectedAssignment.location?.aisle || "N/A"}`}
                      />
                      <DetailItem
                        icon={<FaCalendarAlt className="text-indigo-500" />}
                        label="Fecha de Inicio"
                        value={dayjs(selectedAssignment.createdAt).format("DD/MM/YYYY")}
                        subValue={dayjs(selectedAssignment.createdAt).format("HH:mm [hrs]")}
                      />
                      <DetailItem
                        icon={<FaLayerGroup className="text-amber-500" />}
                        label="Prioridad"
                        value="Especial"
                        subValue="Asignación Directa"
                      />
                    </div>

                    {selectedAssignment.status === AssignmentStatus.UNDER_REVIEW && (
                      <div className="mt-12">
                        <ITButton
                          onClick={() => handleApprove(selectedAssignment.id)}
                          disabled={approvingId === selectedAssignment.id}
                          className="w-full !h-14 !rounded-2xl shadow-xl shadow-emerald-100"
                        >
                          <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest">
                            {approvingId === selectedAssignment.id ? (
                              <ITLoader size="sm" />
                            ) : (
                              <>
                                <FaCheckDouble size={16} /> Aprobar Reporte
                              </>
                            )}
                          </div>
                        </ITButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : assignments.length > 0 ? (
            /* LIST VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-500">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(assignment)}
                  className="group bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                  
                  <div className="relative space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 transition-all duration-300">
                        <FaMapMarkerAlt size={20} />
                      </div>
                      <ITBadget
                        color={getStatusColor(assignment.status)}
                        variant="outlined"
                        className="font-black text-[8px] px-2 tracking-widest"
                      >
                        {statusTranslations[assignment.status]}
                      </ITBadget>
                    </div>

                    <div>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                        {assignment.location?.name || "Sin Ubicación"}
                      </h5>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {dayjs(assignment.createdAt).format("DD/MM/YYYY HH:mm")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {assignment.tasks.slice(0, 3).map((_, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-emerald-600">
                              <FaCheckCircle size={10} />
                            </div>
                          ))}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {assignment.tasks.length} Tareas
                        </span>
                      </div>
                      <FaChevronRight size={12} className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 rounded-[40px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                <FaExclamationTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h5 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sin Historial</h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xs">No se han registrado asignaciones operativas para este guardia.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none px-8 py-6 bg-white border-t border-slate-100 flex justify-end">
          <ITButton
            variant="ghost"
            onClick={onClose}
            className="px-10 font-black text-[10px] uppercase tracking-widest text-slate-400"
          >
            Cerrar Expediente
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};

const DetailItem = ({ icon, label, value, subValue }: any) => (
  <div className="flex items-start gap-4">
    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{value}</p>
      {subValue && <p className="text-[9px] font-bold text-slate-400 mt-0.5">{subValue}</p>}
    </div>
  </div>
);

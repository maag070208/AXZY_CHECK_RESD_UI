import {
  ITBadget,
  ITButton,
  ITDialog,
  ITLoader,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fa";
import {
  getAllAssignmentsByGuard,
  updateAssignmentStatus,
} from "../service/guards.service";
import { Assignment, AssignmentStatus } from "../types/guards.types";
import dayjs from "dayjs";
import { ITMediaGrid } from "@app/core/components/ITMediaGrid";
import { UserResponse } from "../../users/services/UserService";
import { buildShades, colorHex } from "../../home/utils/theme.utils";

const API_ORIGIN = (import.meta.env.VITE_BASE_URL as string)?.replace(/\/api\/v\d*$/, "") || "http://localhost:4444";

interface MediaItem {
  id: string | number;
  url: string;
  type?: "IMAGE" | "VIDEO";
  [key: string]: unknown;
}

interface KardexEntry {
  id: string | number;
  media?: MediaItem[];
  [key: string]: unknown;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: string | number;
  guardName: string;
  guard: UserResponse | null;
  onReassignSchedule: () => void;
  isClient?: boolean;
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
  onReassignSchedule,
  isClient,
}: Props) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const { palette } = useITTheme();
  const primaryShades = useMemo(() => buildShades(colorHex(palette, "primary")), [palette]);
  const warningShades = useMemo(() => buildShades(colorHex(palette, "warning")), [palette]);

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
      title="Expediente de Asignaciones"
      className="!max-w-6xl !w-full"
    >
      <div className="flex flex-col h-[85vh]">
        {/* Profile Header */}
        <div className="flex-none p-5 bg-white border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg font-black text-slate-400 shadow-sm">
                {guardName.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {guardName}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-[10px] font-black uppercase tracking-widest">
                    <FaClock size={10} />
                    {guard?.schedule?.name || "Sin Turno"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isClient && (
                <>
                  <ITButton
                    onClick={onReassignSchedule}
                    variant="outline"
                    className="!rounded-xl !h-11 !px-5 !border-slate-100 !bg-white !text-amber-500 hover:!bg-amber-50"
                  >
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                      <FaClock /> Turno
                    </div>
                  </ITButton>
                  <div className="w-px h-8 bg-slate-100 mx-1" />
                </>
              )}
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
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {loading && !selectedAssignment && !assignments.length ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
              <ITLoader />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                Cargando expediente...
              </p>
            </div>
          ) : selectedAssignment ? (
            /* DETAIL VIEW - 8/4 Layout */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-6">
                <ITButton
                  onClick={() => setSelectedAssignment(null)}
                  variant="icon-only"
                  color="gray"
                  className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 transition-all shadow-sm"
                >
                  <FaArrowLeft size={12} />
                </ITButton>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                      Reporte de Ubicacion
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
                    ID #{selectedAssignment.id} •{" "}
                    {selectedAssignment.location?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{" "}
                        Evidencia Multimedia
                      </h5>
                    </div>

                    {selectedAssignment.kardex?.flatMap(
                      (k: KardexEntry) => k.media || [],
                    ).length ? (
                      <ITMediaGrid
                        media={(selectedAssignment.kardex as KardexEntry[])
                          .flatMap((k) => k.media || [])
                          .map((m) => ({
                            type: m.type || "IMAGE",
                            url: m.url.startsWith("http")
                              ? m.url
                              : `${API_ORIGIN}${m.url.replace("/api/v1", "")}`,
                          }))}
                        gridSize={280}
                      />
                    ) : (
                      <div className="py-12 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                        <FaFileAlt className="text-slate-200 text-4xl mb-4" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                          Sin registros visuales
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Checklist Card */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: primaryShades[500] }}
                      />{" "}
                      Consignas Operativas
                    </h5>

                    <div className="grid grid-cols-1 gap-3">
                      {selectedAssignment.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 rounded-xl border transition-all"
                          style={{
                            backgroundColor: task.completed
                              ? `${primaryShades[50]}4d`
                              : "",
                            borderColor: task.completed
                              ? primaryShades[100]
                              : "",
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shadow-sm transition-all"
                              style={{
                                backgroundColor: task.completed
                                  ? primaryShades[500]
                                  : "",
                                color: task.completed ? "#fff" : "",
                              }}
                            >
                              <FaCheckCircle />
                            </div>
                            <span
                              className={`text-[11px] font-black uppercase tracking-tight`}
                              style={{
                                color: task.completed
                                  ? primaryShades[700]
                                  : "",
                              }}
                            >
                              {task.description}
                            </span>
                          </div>
                          {task.completed && (
                            <div className="text-right">
                              <p
                                className="text-[9px] font-black uppercase tracking-widest"
                                style={{ color: primaryShades[500] }}
                              >
                                Completada
                              </p>
                              <p className="text-[9px] font-bold text-slate-400">
                                {dayjs(task.completedAt).format("HH:mm")} hrs
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {selectedAssignment.notes && (
                      <div className="mt-6 pt-6 border-t border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                          Observaciones del Guardia
                        </p>
                        <div className="p-6 rounded-2xl border"
                          style={{
                            backgroundColor: `${warningShades[50]}80`,
                            borderColor: `${warningShades[100]}80`,
                          }}>
                          <p className="text-xs text-slate-600 font-bold italic leading-relaxed">
                            "{selectedAssignment.notes}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (4): Info and Status */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                      Informacion General
                    </h5>

                    <div className="space-y-6">
                      <DetailItem
                        icon={<FaMapMarkerAlt style={{ color: primaryShades[500] }} />}
                        label="Ubicación"
                        value={selectedAssignment.location?.name}
                        subValue={`Zona ${selectedAssignment.location?.aisle || "N/A"}`}
                      />
                      <DetailItem
                        icon={<FaCalendarAlt className="text-indigo-500" />}
                        label="Fecha de Inicio"
                        value={dayjs(selectedAssignment.createdAt).format(
                          "DD/MM/YYYY",
                        )}
                        subValue={dayjs(selectedAssignment.createdAt).format(
                          "HH:mm [hrs]",
                        )}
                      />
                      <DetailItem
                        icon={<FaLayerGroup style={{ color: warningShades[500] }} />}
                        label="Prioridad"
                        value="Especial"
                        subValue="Asignación Directa"
                      />
                    </div>

                    {selectedAssignment.status ===
                      AssignmentStatus.UNDER_REVIEW &&
                      !isClient && (
                        <div className="mt-8">
                          <ITButton
                            onClick={() => handleApprove(selectedAssignment.id)}
                            disabled={approvingId === selectedAssignment.id}
                            className="w-full !h-12 !rounded-xl shadow-lg"
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
                  className="group bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-700"
                    style={{ backgroundColor: `${primaryShades[50]}4d` }}
                  />

                  <div className="relative space-y-5">
                    <div className="flex justify-between items-start">
                      <div
                        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 transition-all duration-300"
                        style={{}}
                      >
                        <FaMapMarkerAlt size={16} />
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
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight transition-colors">
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
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
                              style={{
                                backgroundColor: primaryShades[100],
                                color: primaryShades[600],
                              }}
                            >
                              <FaCheckCircle size={10} />
                            </div>
                          ))}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {assignment.tasks.length} Tareas
                        </span>
                      </div>
                      <FaChevronRight
                        size={10}
                        className="text-slate-300 group-hover:translate-x-1 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                <FaExclamationTriangle size={28} />
              </div>
              <div className="space-y-1.5">
                <h5 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  Sin Historial
                </h5>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-xs">
                  No se han registrado asignaciones operativas para este
                  guardia.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Standardized Footer */}
        <div className="flex-none flex justify-end items-center px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            variant="filled"
            color="secondary"
            className="px-8 font-black text-[10px] uppercase tracking-widest"
            onClick={onClose}
          >
            Cerrar Expediente
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  subValue?: string | number | null;
}

const DetailItem = ({ icon, label, value, subValue }: DetailItemProps) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
        {value}
      </p>
      {subValue && (
        <p className="text-[9px] font-bold text-slate-400 mt-0.5">{subValue}</p>
      )}
    </div>
  </div>
);

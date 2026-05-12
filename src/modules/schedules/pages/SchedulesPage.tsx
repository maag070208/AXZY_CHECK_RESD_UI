import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
  ITTimePicker,
} from "@axzydev/axzy_ui_system";
import { useCallback, useMemo, useState } from "react";
import {
  FaClock,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  Schedule,
  createSchedule,
  deleteSchedule,
  getPaginatedSchedules,
  getUsersBySchedule,
  updateSchedule,
} from "../SchedulesService";

const SchedulesPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [scheduleToDeleteId, setScheduleToDeleteId] = useState<number | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewingUsers, setViewingUsers] = useState(false);
  const [selectedScheduleUsers, setSelectedScheduleUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [viewingScheduleName, setViewingScheduleName] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("15:00");
  const [isSaving, setIsSaving] = useState(false);

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};
    if (searchTerm.trim()) f.name = searchTerm.trim();
    if (statusFilter === "ACTIVE") f.active = true;
    if (statusFilter === "INACTIVE") f.active = false;
    return f;
  }, [searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedSchedules({ ...params, ...externalFilters });
    },
    [externalFilters],
  );

  const openModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setName(schedule.name);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
    } else {
      setEditingSchedule(null);
      setName("");
      setStartTime("07:00");
      setEndTime("15:00");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSave = async () => {
    if (!name || !startTime || !endTime) return;
    setIsSaving(true);
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, { name, startTime, endTime });
        dispatch(
          showToast({ message: "Horario actualizado", type: "success" }),
        );
      } else {
        await createSchedule({ name, startTime, endTime });
        dispatch(showToast({ message: "Horario creado", type: "success" }));
      }
      setRefreshKey((p) => p + 1);
      closeModal();
    } catch (error: any) {
      const msg =
        error.response?.data?.messages?.[0] || "Error al guardar horario";
      dispatch(showToast({ message: msg, type: "error" }));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!scheduleToDeleteId) return;
    try {
      await deleteSchedule(scheduleToDeleteId);
      setScheduleToDeleteId(null);
      setRefreshKey((p) => p + 1);
      dispatch(showToast({ message: "Horario eliminado", type: "success" }));
    } catch (error: any) {
      const msg =
        error.response?.data?.messages?.[0] || "Error al eliminar horario";
      dispatch(showToast({ message: msg, type: "error" }));
    }
  };

  const viewUsers = async (schedule: Schedule) => {
    setViewingScheduleName(schedule.name);
    setViewingUsers(true);
    setLoadingUsers(true);
    try {
      const users = await getUsersBySchedule(schedule.id);
      setSelectedScheduleUsers(users);
    } catch (error) {
      dispatch(
        showToast({ message: "Error al cargar usuarios", type: "error" }),
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Turno",
        render: (row: Schedule) => (
          <div className="flex items-start gap-3">
            <div className="mt-1 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100">
              <FaClock size={12} />
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1">
                {row.name}
              </p>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                ID: #{row.id.toString().padStart(4, "0")}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "startTime",
        label: "Entrada",
        render: (row: Schedule) => (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
              {row.startTime} HRS
            </span>
          </div>
        ),
      },
      {
        key: "endTime",
        label: "Salida",
        render: (row: Schedule) => (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
              {row.endTime} HRS
            </span>
          </div>
        ),
      },
      {
        key: "users_count",
        label: "Personal",
        render: (row: any) => (
          <button
            onClick={() => viewUsers(row)}
            className="flex items-center gap-2 group hover:scale-105 transition-transform"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
              <FaUser size={10} />
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-dashed border-slate-200">
              {row._count?.users || 0} ASIGNADOS
            </span>
          </button>
        ),
      },
      {
        key: "active",
        label: "Estado",
        render: (row: Schedule) => (
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${row.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-slate-300"}`}
            />
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${row.active ? "text-emerald-600" : "text-slate-400"}`}
            >
              {row.active ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>
        ),
      },
      {
        key: "actions",
        label: "Control",
        render: (row: Schedule) => (
          <div className="flex items-center gap-1">
            <ITButton
              onClick={() => openModal(row)}
              variant="outline"
              className="!p-2 !w-9 !h-9 !rounded-xl !border-slate-100 hover:!bg-slate-50 !text-slate-400 hover:!text-slate-600"
              title="Editar"
            >
              <FaEdit size={14} />
            </ITButton>
            <ITButton
              onClick={() => setScheduleToDeleteId(row.id)}
              variant="outline"
              className="!p-2 !w-9 !h-9 !rounded-xl !border-rose-100 !bg-rose-50/30 !text-rose-500 hover:!bg-rose-50"
              title="Eliminar"
            >
              <FaTrash size={12} />
            </ITButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
      <ModuleHeader
        title="Directorio de Horarios"
        subtitle="Gestión de turnos operativos y controles de asistencia"
        icon={FaClock}
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full sm:justify-end">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <ITInput
                placeholder="BUSCAR HORARIO..."
                name="search"
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                onBlur={() => {}}
                className="!h-[42px] !pl-10 !rounded-xl border-slate-100 bg-white !text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>

            <ITTripleFilter
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "TODOS", value: "ALL" },
                { label: "ACTIVOS", value: "ACTIVE" },
                { label: "INACTIVOS", value: "INACTIVE" },
              ]}
            />

            <ITButton
              onClick={() => openModal()}
              color="primary"
              className="!h-[42px] !rounded-xl shadow-lg shadow-emerald-100"
            >
              <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                <FaPlus size={10} /> Nuevo Horario
              </div>
            </ITButton>
          </div>
        }
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <ITDataTable
          key={refreshKey}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* CREATE/EDIT MODAL */}
      <ITDialog
        isOpen={isModalOpen}
        onClose={closeModal}
        className="!max-w-md !w-full"
      >
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <FaClock size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                {editingSchedule ? "Editar Turno" : "Nuevo Turno"}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Configuración de horarios operativos
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <ITInput
              label="Nombre del Horario"
              name="name"
              placeholder="EJ. MATUTINO 12X12"
              value={name}
              onChange={(e: any) => setName(e.target.value.toUpperCase())}
              onBlur={() => {}}
              className="!h-12 !rounded-2xl !bg-slate-50/50"
            />

            <div className="grid grid-cols-2 gap-4">
              <ITTimePicker
                label="Entrada"
                name="startTime"
                value={startTime}
                onChange={(e: any) => setStartTime(e.target.value)}
                onBlur={() => {}}
                className="!h-12 !rounded-2xl !bg-slate-50/50"
              />
              <ITTimePicker
                label="Salida"
                name="endTime"
                value={endTime}
                onChange={(e: any) => setEndTime(e.target.value)}
                onBlur={() => {}}
                className="!h-12 !rounded-2xl !bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-10">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400"
              onClick={closeModal}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              className="px-10 !rounded-2xl shadow-xl shadow-emerald-200"
              onClick={handleSave}
              disabled={isSaving || !name || !startTime || !endTime}
            >
              {isSaving ? <ITLoader size="sm" /> : "GUARDAR CAMBIOS"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* DELETE DIALOG */}
      <ITDialog
        isOpen={!!scheduleToDeleteId}
        onClose={() => setScheduleToDeleteId(null)}
        title="Eliminar Registro"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Horario?
          </h4>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
            Esta acción es definitiva y podría afectar la asignación de personal
            activo.
          </p>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setScheduleToDeleteId(null)}
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

      {/* USER LIST MODAL */}
      <ITDialog
        isOpen={viewingUsers}
        onClose={() => setViewingUsers(false)}
        className="!w-full !max-w-lg"
      >
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
              <FaUser size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Personal Asignado
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {viewingScheduleName}
              </p>
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <ITLoader size="lg" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                Sincronizando...
              </p>
            </div>
          ) : selectedScheduleUsers.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 border border-slate-100">
                <FaUser size={24} />
              </div>
              <div>
                <p className="text-slate-900 font-black text-sm uppercase tracking-tight">
                  Sin personal asignado
                </p>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">
                  No hay usuarios vinculados a este turno
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {selectedScheduleUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors uppercase">
                      {user.name?.[0]}
                      {user.lastName?.[0]}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        {user.name} {user.lastName}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${user.active ? "bg-emerald-500 shadow-lg shadow-emerald-200" : "bg-slate-300"}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <ITButton
              onClick={() => setViewingUsers(false)}
              variant="ghost"
              className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400"
            >
              Cerrar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default SchedulesPage;

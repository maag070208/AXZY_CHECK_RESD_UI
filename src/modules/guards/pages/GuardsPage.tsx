import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITLoader,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaClock,
  FaEye,
  FaPowerOff,
  FaSearch,
  FaSync,
  FaTimes,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getSchedules } from "../../schedules/SchedulesService";
import {
  getPaginatedUsers,
  updateUser,
  User,
} from "../../users/services/UserService";
import { AssignmentModal } from "../components/AssignmentModal";
import { ViewAssignmentsModal } from "../components/ViewAssignmentsModal";

const GuardsPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedGuard, setSelectedGuard] = useState<User | null>(null);
  const [guardToToggle, setGuardToToggle] = useState<User | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [changingClientUser, setChangingClientUser] = useState<User | null>(
    null,
  );
  const [changingScheduleUser, setChangingScheduleUser] = useState<User | null>(
    null,
  );

  const { data: clients } = useCatalog("client");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const externalFilters = useMemo(() => {
    const filters: any = {
      name: searchTerm.trim(),
      role: {
        name: {
          in: ["GUARD", "SHIFT", "MAINT"],
        },
      },
    };

    if (activeFilter === "active") filters.active = true;
    if (activeFilter === "inactive") filters.active = false;

    return filters;
  }, [searchTerm, activeFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedUsers({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
    },
    [externalFilters],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const confirmToggleStatus = async () => {
    if (!guardToToggle) return;
    setIsUpdating(true);
    const res = await updateUser(guardToToggle.id, {
      active: !guardToToggle.active,
    });
    setIsUpdating(false);
    if (res.success) {
      dispatch(
        showToast({
          message: `Guardia ${!guardToToggle.active ? "activado" : "desactivado"}`,
          type: "success",
        }),
      );
      refreshTable();
    } else {
      dispatch(
        showToast({ message: "Error al actualizar estado", type: "error" }),
      );
    }
    setGuardToToggle(null);
  };

  const handleOpenAssignment = (guard: User) => {
    setSelectedGuard(guard);
    setIsAssignmentModalOpen(true);
  };

  const handleViewAssignments = (guard: User) => {
    setSelectedGuard(guard);
    setIsViewModalOpen(true);
  };

  const handleSuccess = () => {
    setIsAssignmentModalOpen(false);
    refreshTable();
  };

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "Guardia",
        render: (row: User) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm">
              {row.name?.[0]}
              {row.lastName?.[0]}
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1">
                {row.name} {row.lastName}
              </p>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                @{row.username}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        label: "Categoría",
        render: (row: User) => {
          const roleValue = row.role?.value || "S/R";
          const roleName = row.role?.name || "";
          let color: any = "primary";
          if (roleName === "GUARD") color = "success";
          if (roleName === "SHIFT") color = "warning";
          if (roleName === "MAINT") color = "danger";

          return (
            <ITBadget
              label={roleValue}
              color={color}
              variant="outlined"
              className="font-black text-[9px] tracking-widest"
            />
          );
        },
      },
      {
        key: "client",
        label: "Asignación",
        render: (row: User) => (
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
              {row.client?.name || "Sin Asignar"}
            </span>
            {row.schedule && (
              <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 flex items-center gap-1">
                <FaClock size={8} /> {row.schedule.name} (
                {row.schedule.startTime}-{row.schedule.endTime})
              </span>
            )}
          </div>
        ),
      },
      {
        key: "status",
        label: "Estado",
        render: (row: User) => (
          <div className="flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${row.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-red-300"}`}
            />
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${row.active ? "text-emerald-600" : "text-red-400"}`}
            >
              {row.active ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>
        ),
      },
      {
        key: "activity",
        label: "Operatividad",
        render: (row: User) => (
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
              {row.assignmentLogs?.length || 0} Tareas
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
              Control Diario
            </span>
          </div>
        ),
      },
      {
        key: "actions",
        label: "Control",
        render: (row: User) => (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 mr-2">
              <ITButton
                onClick={() => setChangingScheduleUser(row)}
                variant="ghost"
                className="!p-2 !w-8 !h-8 !rounded-lg !text-amber-500 hover:!bg-amber-50"
                title="Horario"
              >
                <FaClock size={12} />
              </ITButton>
              <ITButton
                onClick={() => setChangingClientUser(row)}
                variant="ghost"
                className="!p-2 !w-8 !h-8 !rounded-lg !text-indigo-500 hover:!bg-indigo-50"
                title="Cliente"
              >
                <FaUserShield size={12} />
              </ITButton>
            </div>
            <ITButton
              onClick={() => setGuardToToggle(row)}
              variant="outline"
              className={`!p-2 !w-9 !h-9 !rounded-xl ${row.active ? "!border-rose-100 !bg-rose-50/30 !text-rose-500 hover:!bg-rose-50" : "!border-emerald-100 !text-emerald-500 hover:!bg-emerald-50"}`}
              title={row.active ? "Desactivar" : "Activar"}
            >
              <FaPowerOff size={12} />
            </ITButton>
            <ITButton
              onClick={() => handleViewAssignments(row)}
              variant="outlined"
              color="secondary"
              size="small"
              title="Ver Tareas"
            >
              <FaEye size={14} />
            </ITButton>
            <ITButton
              onClick={() => handleOpenAssignment(row)}
              variant="outlined"
              color="secondary"
              title="Asignar"
              size="small"
            >
              <FaClipboardList size={12} />
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
        title="Directorio de Guardias"
        subtitle="Gestión de personal operativo, asignaciones y controles de turno"
        icon={FaUserShield}
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full sm:justify-end">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <ITInput
                placeholder="BUSCAR GUARDIA..."
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
              value={activeFilter}
              onChange={setActiveFilter}
              options={[
                { label: "TODOS", value: "all" },
                { label: "ACTIVOS", value: "active" },
                { label: "INACTIVOS", value: "inactive" },
              ]}
            />

            <ITButton
              onClick={refreshTable}
              variant="outline"
              color="secondary"
              className="!h-[42px] !rounded-xl border-slate-200"
            >
              <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase text-slate-500">
                <FaSync
                  className={
                    refreshKey % 2 !== 0 ? "rotate-180 transition-all" : ""
                  }
                />
              </div>
            </ITButton>
          </div>
        }
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <ITDataTable<User & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* CLIENT REASSIGN DIALOG */}
      <ITDialog
        isOpen={!!changingClientUser}
        onClose={() => setChangingClientUser(null)}
        className="!max-w-md !w-full"
      >
        <div className="p-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
              <FaUserShield size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Reasignar Cliente
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                {changingClientUser?.name} {changingClientUser?.lastName}
              </p>
            </div>
          </div>

          <ITSelect
            label="Seleccionar Cliente Destino"
            name="clientId"
            placeholder="BUSCAR CLIENTE..."
            options={
              clients.map((c) => ({ label: c.name, value: c.id })) as any
            }
            value={changingClientUser?.clientId || ""}
            onChange={(e: any) => {
              const val = e.target.value;
              if (!changingClientUser) return;
              updateUser(changingClientUser.id, {
                clientId: val as string,
              }).then((res) => {
                if (res.success) {
                  dispatch(
                    showToast({
                      message: "Cliente reasignado",
                      type: "success",
                    }),
                  );
                  refreshTable();
                  setChangingClientUser(null);
                }
              });
            }}
            className="!h-14 !rounded-2xl !bg-slate-50/50"
          />

          <div className="flex justify-center pt-4">
            <ITButton
              variant="ghost"
              onClick={() => setChangingClientUser(null)}
              className="px-10 font-black text-[10px] uppercase tracking-widest text-slate-400"
            >
              Cancelar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* SCHEDULE REASSIGN DIALOG */}
      <ITDialog
        isOpen={!!changingScheduleUser}
        onClose={() => setChangingScheduleUser(null)}
        className="!max-w-md !w-full"
      >
        <div className="p-10 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm">
              <FaClock size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Cambiar Turno
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                {changingScheduleUser?.name} {changingScheduleUser?.lastName}
              </p>
            </div>
          </div>

          <ITSelect
            label="Horario Operativo"
            name="scheduleId"
            placeholder="SELECCIONAR TURNO..."
            options={schedules.map((s) => ({
              label: `${s.name} (${s.startTime} - ${s.endTime})`,
              value: s.id,
            }))}
            value={changingScheduleUser?.scheduleId || ""}
            onChange={(e: any) => {
              const val = e.target.value;
              if (!changingScheduleUser) return;
              updateUser(changingScheduleUser.id, {
                scheduleId: val as string,
              }).then((res) => {
                if (res.success) {
                  dispatch(
                    showToast({
                      message: "Horario actualizado",
                      type: "success",
                    }),
                  );
                  refreshTable();
                  setChangingScheduleUser(null);
                }
              });
            }}
            className="!h-14 !rounded-2xl !bg-slate-50/50"
          />

          <div className="flex justify-center pt-4">
            <ITButton
              variant="ghost"
              onClick={() => setChangingScheduleUser(null)}
              className="px-10 font-black text-[10px] uppercase tracking-widest text-slate-400"
            >
              Cancelar
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* TOGGLE STATUS DIALOG */}
      <ITDialog
        isOpen={!!guardToToggle}
        onClose={() => setGuardToToggle(null)}
        title="Confirmar Acción"
      >
        <div className="p-10 text-center">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 border shadow-sm ${guardToToggle?.active ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-emerald-50 text-emerald-500 border-emerald-100"}`}
          >
            <FaPowerOff size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            {guardToToggle?.active
              ? "¿Desactivar Guardia?"
              : "¿Activar Guardia?"}
          </h4>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
            {guardToToggle?.active
              ? "El guardia perderá el acceso a la aplicación móvil y sus turnos activos serán suspendidos."
              : "El guardia recuperará el acceso y podrá retomar sus tareas y turnos asignados."}
          </p>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setGuardToToggle(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color={guardToToggle?.active ? "danger" : "primary"}
              className={`px-10 !rounded-2xl shadow-xl ${guardToToggle?.active ? "shadow-rose-200" : "shadow-emerald-200"}`}
              onClick={confirmToggleStatus}
              disabled={isUpdating}
            >
              {isUpdating ? <ITLoader size="sm" /> : "CONFIRMAR ACCIÓN"}
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {selectedGuard && (
        <>
          <AssignmentModal
            isOpen={isAssignmentModalOpen}
            onClose={() => setIsAssignmentModalOpen(false)}
            guardId={selectedGuard.id as any}
            guardName={`${selectedGuard.name} ${selectedGuard.lastName}`}
            onSuccess={handleSuccess}
          />
          <ViewAssignmentsModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            guardId={selectedGuard.id}
            guardName={`${selectedGuard.name} ${selectedGuard.lastName}`}
            guard={selectedGuard}
            onReassignClient={() => setChangingClientUser(selectedGuard)}
            onReassignSchedule={() => setChangingScheduleUser(selectedGuard)}
          />
        </>
      )}
    </div>
  );
};

export default GuardsPage;

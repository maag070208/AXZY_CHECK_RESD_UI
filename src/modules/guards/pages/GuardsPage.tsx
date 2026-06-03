import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITSelect,
  ITText,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaClipboardList,
  FaClock,
  FaEye,
  FaPowerOff,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { getSchedules } from "../../schedules/SchedulesService";
import {
  getPaginatedUsers,
  updateUser,
  UserResponse,
} from "../../users/services/UserService";
import { AssignmentModal } from "../components/AssignmentModal";
import { ViewAssignmentsModal } from "../components/ViewAssignmentsModal";

const GuardsPage = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state: AppState) => state.auth);
  const isClient = auth.role === "RESDN";

  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedGuard, setSelectedGuard] = useState<UserResponse | null>(null);
  const [guardToToggle, setGuardToToggle] = useState<UserResponse | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [changingScheduleUser, setChangingScheduleUser] = useState<UserResponse | null>(
    null,
  );

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

  const handleOpenAssignment = (guard: UserResponse) => {
    setSelectedGuard(guard);
    setIsAssignmentModalOpen(true);
  };

  const handleViewAssignments = (guard: UserResponse) => {
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
        render: (row: UserResponse) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm">
              {row.name?.[0]}
              {row.lastName?.[0]}
            </div>
            <div>
              <ITText className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1 block">
                {row.name} {row.lastName}
              </ITText>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                @{row.username}
              </ITText>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        label: "ROL / CATEGORÍA",
        render: (row: UserResponse) => {
          const roleValue = row.role?.value || "S/R";
          const roleName = row.role?.name || "";
          let color: any = "primary";
          if (roleName === "GUARD") color = "success";
          if (roleName === "SHIFT") color = "warning";
          if (roleName === "MAINT") color = "danger";

          return (
            <ITBadget color={color} size="small">
              {roleValue}
            </ITBadget>
          );
        },
      },
      {
        key: "schedule",
        label: "HORARIO / TURNO",
        render: (row: UserResponse) => (
          <div className="flex flex-col">
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
              {row.schedule ? row.schedule.name : "SIN HORARIO"}
            </ITText>
            {row.schedule && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
                  {row.schedule.startTime} - {row.schedule.endTime}
                </ITText>
              </div>
            )}
          </div>
        ),
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: UserResponse) => (
          <ITBadget color={row.active ? "success" : "error"} size="small">
            {row.active ? "ACTIVO" : "INACTIVO"}
          </ITBadget>
        ),
      },
      {
        key: "activity",
        label: "OPERATIVIDAD",
        render: (row: UserResponse) => (
          <div className="flex flex-col">
            <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
              {row.assignmentLogs?.length || 0} Tareas
            </ITText>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
                CONTROL DIARIO
              </ITText>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: UserResponse) => (
          <div className="flex items-center gap-2">
            {!isClient && (
              <>
                <ITButton
                  onClick={() => setChangingScheduleUser(row)}
                  variant="outlined"
                  size="small"
                  title="Horario"
                  color="warning"
                >
                  <FaClock size={14} />
                </ITButton>
                <ITButton
                  onClick={() => setGuardToToggle(row)}
                  variant="outlined"
                  color={row.active ? "error" : "success"}
                  size="small"
                  title={row.active ? "Desactivar" : "Activar"}
                >
                  <FaPowerOff size={14} />
                </ITButton>
              </>
            )}
            <ITButton
              onClick={() => handleViewAssignments(row)}
              variant="outlined"
              color="secondary"
              size="small"
              title="Ver Tareas"
            >
              <FaEye size={14} />
            </ITButton>
            {!isClient && (
              <ITButton
                onClick={() => handleOpenAssignment(row)}
                variant="outlined"
                color="secondary"
                title="Asignar"
                size="small"
              >
                <FaClipboardList size={14} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [isClient],
  );

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Directorio de Guardias"
        subtitle="Gestión de personal operativo, asignaciones y controles de turno"
        icon={FaUserShield}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR GUARDIA...",
        }}
        onRefresh={refreshTable}
        refreshKey={refreshKey}
        extraFilter={
          <ITTripleFilter
            value={activeFilter}
            onChange={setActiveFilter}
            options={[
              { label: "TODOS", value: "all" },
              { label: "ACTIVOS", value: "active" },
              { label: "INACTIVOS", value: "inactive" },
            ]}
          />
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ITDataTable<UserResponse & Record<string, unknown>>
          key={refreshKey}
          fetchData={memoizedFetch as any}
          columns={columns as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

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
              <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight block">
                Cambiar Turno
              </ITText>
              <ITText className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 block">
                {changingScheduleUser?.name} {changingScheduleUser?.lastName}
              </ITText>
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
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3 block">
            {guardToToggle?.active
              ? "¿Desactivar Guardia?"
              : "¿Activar Guardia?"}
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            {guardToToggle?.active
              ? "El guardia perderá el acceso a la application móvil y sus turnos activos serán suspendidos."
              : "El guardia recuperará el acceso y podrá retomar sus tareas y turnos asignados."}
          </ITText>
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
            guardId={selectedGuard.id}
            guardName={`${selectedGuard.name} ${selectedGuard.lastName}`}
            onSuccess={handleSuccess}
          />
          <ViewAssignmentsModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            guardId={selectedGuard.id}
            guardName={`${selectedGuard.name} ${selectedGuard.lastName}`}
            guard={selectedGuard}
            onReassignSchedule={() => setChangingScheduleUser(selectedGuard)}
            isClient={isClient}
          />
        </>
      )}
    </div>
  );
};

export default GuardsPage;

import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDataTable,
  ITDialog,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { FaClock, FaSync, FaTimes, FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getSchedules } from "../../../schedules/SchedulesService";
import {
  getPaginatedUsers,
  updateUser,
  User,
} from "../../../users/services/UserService";
import { TResult } from "@app/core/types/TResult";

interface Props {
  clientId: string | number;
}

export const ClientGuardsTab = ({ clientId }: Props) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [changingScheduleUser, setChangingScheduleUser] = useState<User | null>(
    null,
  );
  const [removingUser, setRemovingUser] = useState<User | null>(null);

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedUsers({
        ...params,
        filters: {
          ...params.filters,
          clientId,
          role: { name: { in: ["GUARD", "SHIFT", "MAINT"] } },
        },
      });
    },
    [clientId],
  );

  const handleRemoveFromClient = async (user: User) => {
    try {
      const res = await updateUser(user.id, { clientId: null as any });
      if (res.success) {
        dispatch(
          showToast({
            message: "Guardia removido del cliente con éxito",
            type: "success",
          }),
        );
        setRefreshKey((prev) => prev + 1);
        setRemovingUser(null);
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se pudo remover al guardia",
            type: "error",
          }),
        );
      }
    } catch (error) {
      const err = error as TResult<any>;
      dispatch(showToast({ message: err.messages?.[0] || "Error de conexión", type: "error" }));
    }
  };

  const columns = [
    {
      key: "user",
      label: "Perfil del Operativo",
      type: "string",
      render: (row: User) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm shadow-sm">
            {row.name.charAt(0)}
            {row.lastName?.charAt(0) || ""}
          </div>
          <div>
            <div className="font-black text-slate-800 text-sm uppercase tracking-tight">
              {row.name} {row.lastName}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              @{row.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado Operativo",
      type: "string",
      render: (row: User) => {
        const lastLog = row.assignmentLogs?.[0];
        const status = lastLog 
            ? (lastLog.type === "ASIGNADO" ? "ACTIVO" : "BAJA") 
            : (row.clientId ? "ACTIVO" : "BAJA");

        return (
          <div
            className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${
              status === "ACTIVO" 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                : "bg-red-50 text-red-600 border-red-100"
            }`}
          >
            {status}
          </div>
        );
      },
    },
    {
      key: "schedule",
      label: "Jornada Asignada",
      type: "string",
      render: (row: User) =>
        row.schedule ? (
          <div className="py-1">
            <div className="flex items-center gap-2 font-black text-slate-700 text-[10px] uppercase tracking-widest">
              <FaClock className="text-emerald-500" />
              {row.schedule.name}
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-1 ml-5">
              {row.schedule.startTime} - {row.schedule.endTime}
            </div>
          </div>
        ) : (
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Sin Horario</span>
        ),
    },
    {
      key: "actions",
      label: "Acciones",
      type: "actions",
      actions: (row: User) => (
        <div className="flex items-center gap-2 justify-end">
          <ITButton
            onClick={() => setChangingScheduleUser(row)}
            size="small"
            variant="ghost"
            className="text-amber-500 hover:bg-amber-50 p-2 rounded-xl"
            title="Reasignar Horario"
          >
            <FaClock size={14} />
          </ITButton>
          <ITButton
            onClick={() => setRemovingUser(row)}
            size="small"
            variant="ghost"
            className="text-red-200 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl"
            title="Remover de Cliente"
          >
            <FaTimes size={14} />
          </ITButton>
        </div>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.1em]">
            Personal Asignado
          </h3>
          <p className="text-[11px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
            Control de guardias y personal operativo en sitio
          </p>
        </div>
        <ITButton
          onClick={() => setRefreshKey((prev) => prev + 1)}
          size="small"
          variant="ghost"
          className="h-10 w-10 p-0 flex justify-center items-center bg-slate-50 rounded-xl hover:bg-slate-100"
        >
          <FaSync className="text-slate-400" />
        </ITButton>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <ITDataTable
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          defaultItemsPerPage={5}
        />
      </div>

      <ITDialog
        isOpen={!!changingScheduleUser}
        onClose={() => setChangingScheduleUser(null)}
        title={`Gestión de Horario`}
      >
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-[28px] bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
              <FaClock size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Cambiar Horario
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                {changingScheduleUser?.name} {changingScheduleUser?.lastName}
              </p>
            </div>
          </div>

          <ITSelect
            label="Seleccionar Nueva Jornada"
            name="scheduleId"
            placeholder="Seleccionar horario..."
            options={schedules.map((s) => ({
              label: `${s.name} (${s.startTime} - ${s.endTime})`,
              value: s.id,
            }))}
            value={changingScheduleUser?.scheduleId || ""}
            onChange={async (e: any) => {
              const val = e.target.value;
              if (!changingScheduleUser) return;
              const res = await updateUser(changingScheduleUser.id, {
                scheduleId: val as string,
              });
              if (res.success) {
                dispatch(
                  showToast({
                    message: "Horario actualizado con éxito",
                    type: "success",
                  }),
                );
                setRefreshKey((prev) => prev + 1);
                setChangingScheduleUser(null);
              } else {
                dispatch(showToast({ message: res.messages?.[0] || "Error al actualizar", type: "error" }));
              }
            }}
          />

          <div className="flex justify-center pt-4">
            <ITButton
              variant="ghost"
              onClick={() => setChangingScheduleUser(null)}
              className="text-slate-400 font-bold uppercase text-[10px] tracking-widest"
            >
              Cerrar Ventana
            </ITButton>
          </div>
        </div>
      </ITDialog>

      <ITDialog
        isOpen={!!removingUser}
        onClose={() => setRemovingUser(null)}
        title={`Confirmar Desasignación`}
      >
        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-[28px] bg-red-50 text-red-500 flex items-center justify-center shadow-inner">
              <FaUserShield size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                Remover Guardia
              </h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed mt-2">
                ¿Está seguro que desea desvincular a <span className="text-slate-800 font-black">{removingUser?.name} {removingUser?.lastName}</span> de este cliente?
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <ITButton
              variant="ghost"
              onClick={() => setRemovingUser(null)}
              className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex-1 h-12"
            >
              Cancelar
            </ITButton>
            <ITButton
              onClick={() => removingUser && handleRemoveFromClient(removingUser)}
              className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl flex-1 h-12 shadow-lg shadow-red-500/10"
            >
              Confirmar Baja
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};


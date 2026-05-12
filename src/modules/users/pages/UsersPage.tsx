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
  FaClock,
  FaEdit,
  FaKey,
  FaPlus,
  FaSearch,
  FaTimes,
  FaTrash,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getSchedules } from "../../schedules/SchedulesService";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { CreateUserWizard } from "../components/CreateUserWizard";
import {
  deleteUser,
  getPaginatedUsers,
  updateUser,
  User,
} from "../services/UserService";

const UsersPage = () => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useCatalog("role");
  const { data: clients } = useCatalog("client");
  const [schedules, setSchedules] = useState<any[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(
    null,
  );
  const [changingClientUser, setChangingClientUser] = useState<User | null>(
    null,
  );
  const [changingScheduleUser, setChangingScheduleUser] = useState<User | null>(
    null,
  );
  const [userToDeleteId, setUserToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const externalFilters = useMemo(() => {
    const f: Record<string, string | number | boolean> = {};
    if (searchTerm.trim()) f.name = searchTerm.trim();
    if (activeFilter === "active") f.active = true;
    if (activeFilter === "inactive") f.active = false;
    return f;
  }, [searchTerm, activeFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedUsers({ ...params, ...externalFilters });
    },
    [externalFilters],
  );

  const refreshTable = () => setRefreshKey((prev) => prev + 1);

  const handleSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingUser(null);
    setChangingPasswordUser(null);
    refreshTable();
  };

  const confirmDelete = async () => {
    if (!userToDeleteId || isDeleting) return;
    setIsDeleting(true);
    const res = await deleteUser(userToDeleteId.toString());
    setIsDeleting(false);
    setUserToDeleteId(null);
    if (res.success) {
      dispatch(showToast({ message: "Usuario eliminado", type: "success" }));
      refreshTable();
    } else {
      dispatch(
        showToast({ message: "Error al eliminar usuario", type: "error" }),
      );
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "Usuario",
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
        key: "roleId",
        label: "Rol / Categoría",
        render: (row: User) => {
          const roleValue = row.role?.value || "S/R";
          const roleName = row.role?.name || "";

          let color: any = "primary";
          if (roleName === "ADMIN") color = "primary";
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
        render: (row: User) => {
          const roleName = row.role?.name || "";
          const isOp = ["GUARD", "SHIFT", "MAINT"].includes(roleName);
          if (!isOp)
            return (
              <span className="text-[10px] text-slate-300 font-black tracking-widest italic">
                N/A
              </span>
            );

          return (
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">
                {row.client?.name || "Sin Asignar"}
              </span>
              {row.schedule && (
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                  {row.schedule.name} ({row.schedule.startTime}-
                  {row.schedule.endTime})
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: "active",
        label: "Estado",
        render: (row: User) => (
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
              onClick={() => setChangingPasswordUser(row)}
              variant="outline"
              className="!p-2 !w-9 !h-9 !rounded-xl !border-emerald-100 !text-emerald-500 hover:!bg-emerald-50"
              title="Seguridad"
            >
              <FaKey size={12} />
            </ITButton>
            <ITButton
              onClick={() => setEditingUser(row)}
              variant="outline"
              className="!p-2 !w-9 !h-9 !rounded-xl !border-slate-100 hover:!bg-slate-50 !text-slate-400 hover:!text-slate-600"
              title="Editar"
            >
              <FaEdit size={14} />
            </ITButton>
            <ITButton
              onClick={() => setUserToDeleteId(row.id as any)}
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
        title="Directorio de Usuarios"
        subtitle="Gestión de expedientes operativos y controles de acceso"
        icon={FaUserShield}
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full sm:justify-end">
            <div className="relative w-full sm:w-64">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <ITInput
                placeholder="BUSCAR USUARIO..."
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
              onClick={() => setIsCreateModalOpen(true)}
              color="primary"
              className="!h-[42px] !rounded-xl shadow-lg shadow-emerald-100"
            >
              <div className="flex items-center gap-2 font-black text-[10px] tracking-widest uppercase">
                <FaPlus size={10} /> Nuevo Usuario
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

      {/* CREATE/EDIT WIZARD DIALOG */}
      <ITDialog
        isOpen={isCreateModalOpen || !!editingUser}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingUser(null);
        }}
        className="!max-w-2xl !w-full"
      >
        <CreateUserWizard
          userToEdit={editingUser || undefined}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setEditingUser(null);
          }}
          onSuccess={handleSuccess}
        />
      </ITDialog>

      {/* PASSWORD DIALOG */}
      <ITDialog
        isOpen={!!changingPasswordUser}
        onClose={() => setChangingPasswordUser(null)}
        className="!max-w-lg !w-full"
      >
        {changingPasswordUser && (
          <ChangePasswordModal
            user={changingPasswordUser}
            onCancel={() => setChangingPasswordUser(null)}
            onSuccess={handleSuccess}
          />
        )}
      </ITDialog>

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
                  handleSuccess();
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
                  handleSuccess();
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

      {/* DELETE DIALOG */}
      <ITDialog
        isOpen={!!userToDeleteId}
        onClose={() => setUserToDeleteId(null)}
        title="Eliminar Registro"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Inhabilitar Usuario?
          </h4>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
            Esta acción es definitiva y revocaría todos los permisos de acceso
            de forma inmediata.
          </p>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setUserToDeleteId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <ITLoader size="sm" /> : "ELIMINAR AHORA"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default UsersPage;

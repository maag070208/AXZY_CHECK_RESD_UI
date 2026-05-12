import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITSearchSelect,
  ITLoader,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaCheck,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaRoute,
  FaTrash,
  FaBuilding,
  FaLayerGroup,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  getLocations,
  Location,
} from "../../locations/service/locations.service";
import { getUsers, User } from "../../users/services/UserService";
import {
  createRoute,
  ILocationCreate,
  updateRoute,
  getRouteById,
} from "../services/RoutesService";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { post } from "@app/core/axios/axios";

interface CreateRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editConfig?: any; // If editing
}

export const CreateRouteModal = ({
  isOpen,
  onClose,
  onSuccess,
  editConfig,
}: CreateRouteModalProps) => {
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [addedLocations, setAddedLocations] = useState<ILocationCreate[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);

  // Data sources
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [allGuards, setAllGuards] = useState<User[]>([]);
  const [clientZones, setClientZones] = useState<any[]>([]);

  // UI Local State
  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | number>("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const { data: clients } = useCatalog("client");

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedClientId) {
      fetchZones(String(selectedClientId));
    } else {
      setClientZones([]);
      setSelectedZoneId("");
    }
  }, [selectedClientId]);

  const fetchZones = async (clientId: string) => {
    try {
      const res = await post<any>("/zones/datatable", {
        filters: { clientId },
      });
      if (res.success && res.data) {
        setClientZones(res.data.rows || []);
      }
    } catch (error) {
      console.error("Error fetching zones", error);
    }
  };

  useEffect(() => {
    if (isOpen && editConfig) {
      fetchFullData(editConfig.id);
    } else if (isOpen) {
      setTitle("");
      setAddedLocations([]);
      setSelectedClientId("");
      setSelectedZoneId("");
      setSelectedGuards([]);
    }
  }, [isOpen, editConfig, allGuards]);

  const fetchFullData = async (id: string) => {
    setFetchingData(true);
    try {
      const res = await getRouteById(id);
      if (res.success && res.data) {
        const data = res.data;
        setTitle(data.title);
        const mapped = (data.recurringLocations || []).map((rl: any) => ({
          locationId: rl.location?.id,
          locationName: rl.location?.name,
          tasks: (rl.tasks || []).map((t: any) => ({
            description: t.description,
            reqPhoto: t.reqPhoto,
          })),
        }));
        setAddedLocations(mapped);
        if (data.guards) {
          setSelectedGuards(data.guards.map((g: any) => g.id));
        } else {
          setSelectedGuards([]);
        }
        if (data.recurringLocations?.[0]?.location?.clientId) {
          setSelectedClientId(data.recurringLocations[0].location.clientId);
        }
        if (data.recurringLocations?.[0]?.location?.zoneId) {
          setSelectedZoneId(data.recurringLocations[0].location.zoneId);
        }
      }
    } catch (e) {
      dispatch(
        showToast({
          message: "Error al cargar datos completos",
          type: "error",
        }),
      );
    } finally {
      setFetchingData(false);
    }
  };

  const fetchInitialData = async () => {
    const [locRes, usersRes] = await Promise.all([getLocations(), getUsers()]);

    if (locRes.success && locRes.data) {
      setAllLocations(locRes.data);
    }

    if (usersRes.success && usersRes.data) {
      const guards = usersRes.data.filter((u) => {
        const roleName = typeof u.role === "object" ? u.role.name : u.role;
        return (
          (roleName === "GUARD" ||
            roleName === "SHIFT" ||
            roleName === "MAINT") &&
          u.active
        );
      });
      setAllGuards(guards);
    }
  };

  const handleAddLocation = () => {
    if (addedLocations.find((l) => l.locationId === selectedLocId)) {
      dispatch(
        showToast({
          message: "La ubicación ya está en la lista",
          type: "warning",
        }),
      );
      return;
    }
    const locObj = allLocations.find(
      (l) => String(l.id) === String(selectedLocId),
    );
    if (!locObj) return;
    setAddedLocations([
      ...addedLocations,
      {
        locationId: selectedLocId,
        locationName: locObj.name,
        tasks: [],
      },
    ]);
    setSelectedLocId("");
  };

  const handleBulkAddByZone = () => {
    if (!selectedZoneId) return;

    const zoneLocations = allLocations.filter(
      (l) =>
        String(l.zoneId) === String(selectedZoneId) &&
        !addedLocations.find((al) => al.locationId === (l.id as any)),
    );

    if (zoneLocations.length === 0) {
      dispatch(
        showToast({
          message: "No hay nuevas ubicaciones para añadir en esta zona",
          type: "info",
        }),
      );
      return;
    }

    const newLocations: any[] = zoneLocations.map((l) => ({
      locationId: l.id,
      locationName: l.name,
      tasks: [],
    }));

    setAddedLocations([...addedLocations, ...newLocations]);
    dispatch(
      showToast({
        message: `Se añadieron ${newLocations.length} ubicaciones`,
        type: "success",
      }),
    );
    setSelectedZoneId("");
  };

  const handleRemoveLocation = (index: number) => {
    const copy = [...addedLocations];
    copy.splice(index, 1);
    setAddedLocations(copy);
  };

  const handleAddTask = (locIndex: number) => {
    const copy = [...addedLocations];
    copy[locIndex].tasks.push({ description: "", reqPhoto: false });
    setAddedLocations(copy);
  };

  const handleRemoveTask = (locIndex: number, taskIndex: number) => {
    const copy = [...addedLocations];
    copy[locIndex].tasks.splice(taskIndex, 1);
    setAddedLocations(copy);
  };

  const handleTaskChange = (
    locIndex: number,
    taskIndex: number,
    val: string,
  ) => {
    const copy = [...addedLocations];
    copy[locIndex].tasks[taskIndex].description = val;
    setAddedLocations(copy);
  };

  const toggleGuard = (guardId: string) => {
    if (selectedGuards.includes(guardId)) {
      setSelectedGuards(selectedGuards.filter((id) => id !== guardId));
    } else {
      setSelectedGuards([...selectedGuards, guardId]);
    }
  };

  const toggleAllGuards = () => {
    if (selectedGuards.length === filteredGuards.length) {
      setSelectedGuards([]);
    } else {
      setSelectedGuards(filteredGuards.map((g) => g.id));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      dispatch(
        showToast({
          message: "Ingresa un nombre para la ruta",
          type: "warning",
        }),
      );
      return;
    }
    if (addedLocations.length === 0) {
      dispatch(
        showToast({
          message: "Agrega al menos una ubicación",
          type: "warning",
        }),
      );
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title,
        locations: addedLocations,
        guardIds: selectedGuards,
      };
      let res = editConfig
        ? await updateRoute(editConfig.id, payload)
        : await createRoute(payload);
      if (res.success) {
        dispatch(
          showToast({ message: "Guardado correctamente", type: "success" }),
        );
        onSuccess();
        onClose();
      } else {
        dispatch(
          showToast({
            message: "Error al guardar: " + (res.messages?.join(", ") || ""),
            type: "error",
          }),
        );
      }
    } catch (e) {
      dispatch(showToast({ message: "Error de conexión", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  const filteredGuards = allGuards.filter(
    (g) => !selectedClientId || String(g.clientId) === String(selectedClientId),
  );

  const availableLocations = allLocations.filter((l) => {
    const alreadyAdded = addedLocations.find(
      (al) => al.locationId === (l.id as any),
    );
    if (alreadyAdded) return false;
    if (selectedClientId && String(l.clientId) !== String(selectedClientId))
      return false;
    if (selectedZoneId && String(l.zoneId) !== String(selectedZoneId))
      return false;
    return true;
  });

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        editConfig ? "Ajustar Parámetros de Ruta" : "Configurar Nueva Ruta"
      }
      className="!w-full !max-w-6xl !rounded-3xl"
    >
      {fetchingData ? (
        <div className="p-20 flex flex-col items-center justify-center gap-4">
          <ITLoader size="lg" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
            Sincronizando información...
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-10 max-h-[80vh] lg:max-h-[75vh] overflow-y-auto lg:overflow-hidden p-1 custom-scrollbar">
          {/* Left Side: General Info & Guards */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8 lg:border-r border-slate-100 lg:pr-6 lg:overflow-hidden">
            {/* Fixed Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#065911] rounded-full" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                  Información Base
                </h3>
              </div>
              <ITInput
                name="title"
                label="Nombre identificador"
                placeholder="Ej: Ronda Perimetral Nocturna"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {}}
                className="!rounded-xl"
              />

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                  <FaBuilding className="text-[9px]" /> Cliente Propietario
                </label>
                <ITSearchSelect
                  placeholder="Selecciona cliente..."
                  options={(clients || []).map((c: any) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  value={selectedClientId}
                  onChange={(val) => {
                    setSelectedClientId(val);
                    setSelectedZoneId("");
                    setSelectedLocId("");
                    setSelectedGuards([]); // Reset guards when client changes
                  }}
                />
              </div>
            </div>

            {/* Scrollable Guards List */}
            <div className="flex-1 flex flex-col overflow-hidden mt-2">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#065911] rounded-full" />
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                    Personal
                  </h3>
                </div>
                <button
                  onClick={toggleAllGuards}
                  className="text-[9px] font-black uppercase tracking-widest text-[#065911] hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-emerald-100"
                >
                  {selectedGuards.length === filteredGuards.length &&
                  filteredGuards.length > 0
                    ? "Limpiar Selección"
                    : "Marcar Todos"}
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto lg:max-h-none max-h-[300px] pr-2 custom-scrollbar">
                {filteredGuards.length > 0 ? (
                  filteredGuards.map((guard) => (
                    <div
                      key={guard.id}
                      onClick={() => toggleGuard(guard.id)}
                      className={`
                                              group cursor-pointer p-3 rounded-2xl border flex items-center justify-between transition-all duration-200
                                              ${
                                                selectedGuards.includes(
                                                  guard.id,
                                                )
                                                  ? "bg-emerald-50/50 border-[#065911] shadow-sm"
                                                  : "bg-white border-slate-100 hover:border-slate-200"
                                              }
                                          `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] transition-colors ${selectedGuards.includes(guard.id) ? "bg-[#065911] text-white" : "bg-slate-100 text-slate-400"}`}
                        >
                          {guard.name[0]}
                          {guard.lastName?.[0] || ""}
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-black tracking-tight ${selectedGuards.includes(guard.id) ? "text-slate-900" : "text-slate-500"}`}
                          >
                            {guard.name} {guard.lastName}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedGuards.includes(guard.id) ? "bg-[#065911] border-[#065911] scale-100" : "border-slate-200 bg-white scale-90 opacity-50 group-hover:opacity-100 group-hover:scale-100"}`}
                      >
                        {selectedGuards.includes(guard.id) && (
                          <FaCheck className="text-white text-[8px]" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      {selectedClientId
                        ? "Sin guardias asignados"
                        : "Selecciona un cliente"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Locations & Tasks */}
          <div className="lg:w-2/3 flex flex-col gap-8 overflow-hidden">
            <div className="flex flex-col gap-6 items-end pb-8 border-b border-slate-100">
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-[#065911] rounded-full" />
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                    Vincular Puntos de Control
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <FaLayerGroup className="text-[9px]" /> Recurrente (Zona)
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <ITSearchSelect
                          placeholder="Selecciona zona..."
                          options={clientZones.map((z) => ({
                            label: z.name,
                            value: z.id,
                          }))}
                          value={selectedZoneId}
                          onChange={(val) => {
                            setSelectedZoneId(val);
                            setSelectedLocId("");
                          }}
                          disabled={!selectedClientId}
                        />
                      </div>
                      <ITButton
                        onClick={handleBulkAddByZone}
                        disabled={!selectedZoneId}
                        variant="outlined"
                        className="h-[42px] px-3 !rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 !p-0 w-[42px] flex items-center justify-center shadow-sm"
                        title="Añadir todas las ubicaciones de esta zona"
                      >
                        <FaPlus className="text-xs" />
                      </ITButton>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-[9px]" /> Ubicación
                      Individual
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <ITSearchSelect
                          placeholder="Buscar por nombre..."
                          noResultsMessage="No hay más ubicaciones"
                          value={selectedLocId}
                          onChange={(val) => setSelectedLocId(String(val))}
                          options={availableLocations.map((l) => ({
                            label: `${l.name}`,
                            value: String(l.id),
                          }))}
                          className="!rounded-xl"
                          disabled={!selectedClientId}
                        />
                      </div>
                      <ITButton
                        onClick={handleAddLocation}
                        disabled={!selectedLocId}
                        color="primary"
                        variant="filled"
                        className="h-[42px] !p-0 w-[42px] flex items-center justify-center !rounded-xl shadow-md shadow-emerald-50"
                      >
                        <FaPlus className="text-xs" />
                      </ITButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto lg:max-h-none max-h-[500px] pr-4 space-y-6 pb-6 custom-scrollbar">
              {addedLocations.map((loc, idx) => (
                <div
                  key={loc.locationId}
                  className="group bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 transition-all"
                >
                  <div className="flex justify-between items-center p-4 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#065911] font-black border border-slate-200 shadow-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-base">
                          {loc.locationName}
                        </h4>
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-[#065911] text-[10px]" />
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            Punto de Control Activo
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLocation(idx)}
                      className="w-10 h-10 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>

                  <div className="p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#065911] rounded-full" />{" "}
                        Consignas
                      </span>
                      <button
                        onClick={() => handleAddTask(idx)}
                        className="text-[10px] font-black text-[#065911] uppercase tracking-widest flex items-center gap-2 hover:underline"
                      >
                        <FaPlus className="text-[8px]" /> Nueva Tarea
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {loc.tasks.map((task, tIdx) => (
                        <div
                          key={tIdx}
                          className="bg-white p-3.5 rounded-xl border-2 border-slate-100 flex items-center gap-3"
                        >
                          <div className="flex-1">
                            <ITInput
                              name={`task-${idx}-${tIdx}`}
                              placeholder="Instrucción..."
                              value={task.description}
                              onChange={(e) =>
                                handleTaskChange(idx, tIdx, e.target.value)
                              }
                              onBlur={() => {}}
                              className="!bg-slate-50 !rounded-xl !border-transparent focus:!bg-white focus:!border-[#065911]"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveTask(idx, tIdx)}
                            className="text-slate-200 hover:text-rose-500 transition-colors"
                          >
                            <FaMinus size={14} />
                          </button>
                        </div>
                      ))}
                      {loc.tasks.length === 0 && (
                        <div className="col-span-2 py-4 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic opacity-60">
                            Sin consignas asignadas
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {addedLocations.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-16">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                    <FaRoute size={40} />
                  </div>
                  <h5 className="text-slate-800 font-black text-xl mb-2 tracking-tight">
                    Ruta Vacía
                  </h5>
                  <p className="text-slate-400 text-sm max-w-xs font-medium leading-relaxed">
                    Agrega los puntos de control necesarios para este recorrido.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
        <ITButton
          onClick={onClose}
          variant="outlined"
          color="secondary"
          className="!px-6 !py-2.5 !rounded-xl font-bold text-xs uppercase tracking-widest !border-slate-200 !text-slate-400 hover:!bg-slate-50 transition-colors w-full sm:w-auto"
        >
          Descartar
        </ITButton>
        <ITButton
          onClick={handleSave}
          color="primary"
          disabled={
            loading || fetchingData || !title || addedLocations.length === 0
          }
          className="!px-8 !py-2.5 !rounded-xl !bg-[#065911] font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-50 hover:!bg-[#04400c] transition-all active:scale-95 disabled:!opacity-30 w-full sm:w-auto"
        >
          {loading
            ? "Sincronizando..."
            : editConfig
              ? "Actualizar"
              : "Guardar Ruta"}
        </ITButton>
      </div>
    </ITDialog>
  );
};

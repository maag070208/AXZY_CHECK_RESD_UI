import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
  ITSlideToggle,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardCheck,
  FaCopy,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaPlus,
  FaRoute,
  FaSearch,
  FaTrash,
  FaUserFriends,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLocations,
  Location,
} from "../../locations/service/locations.service";
import { CreateUserWizard } from "../../users/components/CreateUserWizard";
import { getUsers, UserResponse } from "../../users/services/UserService";
import { getZones, Zone } from "../../zones/services/ZonesService";
import {
  createRoute,
  getRouteById,
  ILocationCreate,
  ITaskCreate,
  updateRoute,
} from "../services/RoutesService";
import { buildShades, colorHex } from "../../home/utils/theme.utils";

interface RecurringTaskData {
  description: string;
  reqPhoto: boolean;
}

interface RecurringLocationData {
  location?: { id: string; name: string };
  tasks: RecurringTaskData[];
}

interface RecurringGuardData {
  id: string;
}

interface RouteData {
  title: string;
  active?: boolean;
  recurringLocations?: RecurringLocationData[];
  guards?: RecurringGuardData[];
}

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "").trim();
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CreateRoutePage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { palette } = useITTheme();
  const primaryHex = colorHex(palette, "primary");
  const primaryShades = useMemo(() => buildShades(primaryHex), [primaryHex]);

  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [addedLocations, setAddedLocations] = useState<ILocationCreate[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [allGuards, setAllGuards] = useState<UserResponse[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | number>("");
  const [fetchingData, setFetchingData] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [active, setActive] = useState(true);
  const [guardSearch, setGuardSearch] = useState("");

  useEffect(() => {
    fetchInitialData();
    if (isEditing) fetchFullData(id!);
  }, [id]);

  const fetchFullData = async (routeId: string) => {
    setFetchingData(true);
    try {
      const res = await getRouteById(routeId);
      if (res.success && res.data) {
        const data = res.data as RouteData;
        setTitle(data.title);
        setActive(data.active ?? true);
        setAddedLocations(
          (data.recurringLocations || []).map((rl: RecurringLocationData) => ({
            locationId: rl.location?.id ?? "",
            locationName: rl.location?.name,
            tasks: (rl.tasks || []).map((t: RecurringTaskData) => ({
              description: t.description,
              reqPhoto: t.reqPhoto,
            })),
          })),
        );
        setSelectedGuards(data.guards?.map((g: RecurringGuardData) => g.id) || []);
      }
    } catch (_e) {
      dispatch(showToast({ message: "Error al cargar datos", type: "error" }));
    } finally {
      setFetchingData(false);
    }
  };

  const fetchInitialData = async () => {
    const [locRes, usersRes, zonesRes] = await Promise.all([getLocations(), getUsers(), getZones()]);
    if (locRes.success) setAllLocations(locRes.data);
    if (zonesRes.success) setZones(zonesRes.data || []);
    if (usersRes.success) {
      setAllGuards(
        (usersRes.data || []).filter((u: UserResponse) => {
          const role = typeof u.role === "object" ? u.role.name : u.role;
          return ["GUARD", "SHIFT", "MAINT"].includes(role) && u.active;
        }),
      );
    }
  };

  const handleAddLocation = () => {
    if (addedLocations.find((l) => l.locationId === selectedLocId)) return;
    const locObj = allLocations.find(
      (l) => String(l.id) === String(selectedLocId),
    );
    if (!locObj) return;
    setAddedLocations([
      ...addedLocations,
      { locationId: selectedLocId, locationName: locObj.name, tasks: [] },
    ]);
    setSelectedLocId("");
  };

  const handleBulkAddByZone = () => {
    const zoneLocs = allLocations.filter(
      (l) =>
        String(l.zoneId) === String(selectedZoneId) &&
        !addedLocations.find((al) => al.locationId === String(l.id)),
    );
    if (zoneLocs.length === 0) return;
    setAddedLocations([
      ...addedLocations,
      ...zoneLocs.map((l) => ({
        locationId: String(l.id),
        locationName: l.name,
        tasks: [] as ITaskCreate[],
      })),
    ]);
    setSelectedZoneId("");
  };

  const handleTaskChange = (locIdx: number, taskIdx: number, val: string) => {
    const copy = [...addedLocations];
    copy[locIdx].tasks[taskIdx].description = val;
    setAddedLocations(copy);
  };

  const handleAddTask = (idx: number) => {
    const copy = [...addedLocations];
    copy[idx].tasks.push({ description: "", reqPhoto: false });
    setAddedLocations(copy);
  };

  const handleCloneTasks = (idx: number) => {
    const sourceTasks = [...addedLocations[idx].tasks];
    setAddedLocations(
      addedLocations.map((loc) => ({
        ...loc,
        tasks: sourceTasks.map((t) => ({ ...t })),
      })),
    );
    dispatch(
      showToast({
        message: "Tareas clonadas a todos los puntos",
        type: "info",
      }),
    );
  };

  const toggleGuard = (id: string) => {
    setSelectedGuards((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const filteredGuards = useMemo(
    () =>
      allGuards.filter(
        (g) =>
          g.name.toLowerCase().includes(guardSearch.toLowerCase()) ||
          (g.lastName ?? "").toLowerCase().includes(guardSearch.toLowerCase()),
      ),
    [allGuards, guardSearch],
  );

  const availableLocations = useMemo(
    () =>
      allLocations.filter(
        (l) =>
          !addedLocations.find((al) => al.locationId === String(l.id)),
      ),
    [allLocations, addedLocations],
  );

  const handleSave = async () => {
    dispatch(showLoader());
    try {
      const payload = {
        title,
        locations: addedLocations,
        guardIds: selectedGuards,
        active,
      };
      const res = isEditing
        ? await updateRoute(id!, payload)
        : await createRoute(payload);
      if (res.success) {
        dispatch(showToast({ message: "Ruta guardada", type: "success" }));
        navigate("/routes");
      }
    } finally {
      dispatch(hideLoader());
    }
  };

  const steps = [
    {
      title: "Identificacion",
      subtitle: "Nombre de Recorrido",
      icon: <FaInfoCircle />,
      isValid: !!title,
    },
    {
      title: "Puntos de Control",
      subtitle: "Secuencia QR",
      icon: <FaMapMarkerAlt />,
      isValid: addedLocations.length > 0,
    },
    {
      title: "Asignacion",
      subtitle: "Personal",
      icon: <FaUserFriends />,
      isValid: selectedGuards.length > 0,
    },
    {
      title: "Resumen",
      subtitle: "Verificacion",
      icon: <FaClipboardCheck />,
      isValid: true,
    },
  ];

  if (fetchingData)
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <ITLoader size="lg" />
        <p className="mt-6 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
          Sincronizando configuracion operativa...
        </p>
      </div>
    );

  return (
    <div className="h-full flex overflow-hidden">
      {/* SIDEBAR STEPS */}
      <aside className="w-[280px] bg-white border-r border-slate-100 flex flex-col p-6 shrink-0 shadow-xl shadow-slate-200/40 relative z-20">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg text-white flex items-center justify-center shadow-md"
              style={{
                backgroundColor: primaryShades[500],
                boxShadow: `0 4px 6px -1px ${hexToRgba(primaryShades[100], 0.4)}`,
              }}
            >
              <FaRoute size={14} />
            </div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
              Asistente{" "}
              <span style={{ color: primaryShades[500] }}>Rutas</span>
            </h1>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {steps.map((step, idx) => {
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;
            return (
              <div
                key={idx}
                className={`flex items-center gap-4 p-4 rounded-[20px] transition-all duration-300 ${isActive ? "" : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100"}`}
                style={
                  isActive
                    ? {
                        backgroundColor: primaryShades[50],
                        borderColor: primaryShades[100],
                        borderWidth: 1,
                        boxShadow: `0 4px 6px -1px ${hexToRgba(primaryShades[100], 0.2)}`,
                      }
                    : {}
                }
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: isActive
                      ? primaryShades[500]
                      : isCompleted
                        ? primaryShades[100]
                        : "",
                    color: isActive
                      ? "#fff"
                      : isCompleted
                        ? primaryShades[600]
                        : "",
                  }}
                >
                  {isCompleted ? <FaCheck size={12} /> : step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-[10px] font-black uppercase tracking-widest leading-none"
                    style={{ color: isActive ? primaryShades[700] : "" }}
                  >
                    {step.title}
                  </h4>
                  <p
                    className="text-[8px] font-bold mt-1 uppercase tracking-tight"
                    style={{
                      color: isActive
                        ? hexToRgba(primaryShades[600], 0.6)
                        : "",
                    }}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-10 border-t border-slate-100">
          <div className="flex items-center gap-3 text-slate-400">
            <FaInfoCircle size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">
              ID: {isEditing ? id!.slice(-8) : "NUEVA_RUTA"}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0">
            {/* STEP 0: IDENTITY */}
            {currentStep === 0 && (
              <div className="h-full overflow-y-auto p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-1 h-3 rounded-full"
                        style={{ backgroundColor: primaryShades[500] }}
                      />
                      <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">
                        Identidad
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ITInput
                        label="Nombre del Recorrido"
                        placeholder="Ej. Ronda Perimetral Nocturna"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        name="title"
                        onBlur={() => {}}
                      />
                    </div>

                    {isEditing && (
                      <div className="mt-6 flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div>
                          <h5 className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                            Estado Operativo
                          </h5>
                        </div>
                        <ITSlideToggle
                          isOn={active}
                          onToggle={(val) => setActive(val)}
                        />
                      </div>
                    )}
                  </section>

                  <div className="bg-slate-50 p-5 rounded-2xl flex items-start gap-3 border border-slate-100">
                    <div
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0"
                      style={{ color: primaryShades[500] }}
                    >
                      <FaInfoCircle size={14} />
                    </div>
                    <div>
                      <h5 className="text-[9px] font-black text-slate-700 uppercase tracking-tight">
                        Validacion de Seguridad
                      </h5>
                      <p className="text-[9px] text-slate-500 leading-tight font-medium">
                        Datos del recorrido operativo para la comunidad.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: LOCATIONS */}
            {currentStep === 1 && (
              <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
                <div className="shrink-0 p-6 lg:px-8 border-b border-slate-50 bg-white">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-4 rounded-full"
                        style={{ backgroundColor: primaryShades[500] }}
                      />
                      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                        Puntos de Control
                      </h2>
                    </div>

                    <div className="flex flex-1 flex-col md:flex-row items-end gap-4 max-w-3xl">
                      <div className="flex-1 w-full grid grid-cols-2 gap-3">
                        <ITSearchSelect
                          label="Cargar Zona"
                          placeholder="Zona..."
                          options={zones.map((z) => ({
                            label: z.name,
                            value: z.id,
                          }))}
                          value={selectedZoneId}
                          onChange={setSelectedZoneId}
                        />
                        <ITSearchSelect
                          label="Punto Individual"
                          placeholder="Punto..."
                          options={availableLocations.map((l) => ({
                            label: l.name,
                            value: l.id,
                          }))}
                          value={selectedLocId}
                          onChange={(val) => setSelectedLocId(String(val))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <ITButton
                          onClick={handleBulkAddByZone}
                          disabled={!selectedZoneId}
                          variant="outlined"
                        >
                          Importar Zona
                        </ITButton>
                        <ITButton
                          onClick={handleAddLocation}
                          disabled={!selectedLocId}
                          color="primary"
                        >
                          Agregar
                        </ITButton>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/30">
                  <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        Secuencia ({addedLocations.length})
                      </h4>
                      {addedLocations.length > 0 && (
                        <ITButton
                          onClick={() => setAddedLocations([])}
                          variant="text"
                          color="error"
                          size="small"
                        >
                          Limpiar
                        </ITButton>
                      )}
                    </div>

                    {addedLocations.length === 0 ? (
                      <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[24px] bg-white gap-3">
                        <FaMapMarkerAlt size={20} className="text-slate-200" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Agrega puntos de control.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {addedLocations.map((loc, idx) => (
                          <div
                            key={loc.locationId}
                            className="bg-white min-h-[100px] border border-slate-100 p-4 rounded-[24px] shadow-sm hover:shadow-md transition-all"
                          >
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-lg text-white flex items-center justify-center text-[10px] font-black"
                                  style={{
                                    backgroundColor: primaryShades[500],
                                  }}
                                >
                                  {idx + 1}
                                </div>
                                <span className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[200px] text-wrap">
                                  {loc.locationName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {loc.tasks.length > 0 && (
                                  <ITButton
                                    onClick={() => handleCloneTasks(idx)}
                                    variant="icon-only"
                                    size="small"
                                  >
                                    <FaCopy size={10} />
                                  </ITButton>
                                )}
                                <ITButton
                                  onClick={() =>
                                    setAddedLocations(
                                      addedLocations.filter(
                                        (_, i) => i !== idx,
                                      ),
                                    )
                                  }
                                  variant="icon-only"
                                  color="danger"
                                  size="small"
                                >
                                  <FaTrash size={10} />
                                </ITButton>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              {loc.tasks.map((task, tIdx) => (
                                <div
                                  key={tIdx}
                                  className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100"
                                >
                                  <ITInput
                                    name={`task-${idx}-${tIdx}`}
                                    placeholder="Tarea..."
                                    value={task.description}
                                    onChange={(e) =>
                                      handleTaskChange(
                                        idx,
                                        tIdx,
                                        e.target.value,
                                      )
                                    }
                                    onBlur={() => {}}
                                    className="!text-[9px] !py-0 !px-1 !border-0 !shadow-none"
                                  />
                                  <ITButton
                                    onClick={() => {
                                      const copy = [...addedLocations];
                                      copy[idx].tasks.splice(tIdx, 1);
                                      setAddedLocations(copy);
                                    }}
                                    variant="icon-only"
                                    size="small"
                                    color="error"
                                  >
                                    <FaPlus
                                      size={12}
                                      className="rotate-45"
                                    />
                                  </ITButton>
                                </div>
                              ))}
                              <ITButton
                                onClick={() => handleAddTask(idx)}
                                variant="outlined"
                                size="small"
                              >
                                <FaPlus size={7} /> Tarea
                              </ITButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: GUARDS */}
            {currentStep === 2 && (
              <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-300">
                <div className="shrink-0 p-6 lg:px-8 border-b border-slate-50 bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-4 rounded-full"
                        style={{ backgroundColor: primaryShades[500] }}
                      />
                      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">
                        Personal Operativo
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <ITInput
                        name="guardSearch"
                        placeholder="Filtrar..."
                        value={guardSearch}
                        onChange={(e) => setGuardSearch(e.target.value)}
                        onBlur={() => {}}
                        iconLeft={<FaSearch size={10} />}
                        className="!w-[200px]"
                      />
                      <ITButton
                        size="small"
                        variant="outlined"
                        color="secondary"
                        className="!rounded-xl !h-[36px]"
                        onClick={() => {
                          const allIds = filteredGuards.map((g) => g.id);
                          const isAllSelected = allIds.every((id) =>
                            selectedGuards.includes(id),
                          );
                          setSelectedGuards(isAllSelected ? [] : allIds);
                        }}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest px-2">
                          {filteredGuards.every((g) =>
                            selectedGuards.includes(g.id),
                          )
                            ? "Quitar"
                            : "Todos"}
                        </span>
                      </ITButton>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredGuards.map((guard) => {
                      const isSelected = selectedGuards.includes(guard.id);
                      return (
                        <div
                          key={guard.id}
                          onClick={() => toggleGuard(guard.id)}
                          className="cursor-pointer p-4 rounded-[24px] border-2 transition-all flex items-center gap-3"
                          style={{
                            borderColor: isSelected
                              ? primaryShades[500]
                              : "",
                            backgroundColor: isSelected
                              ? hexToRgba(primaryShades[50], 0.3)
                              : "",
                          }}
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all"
                            style={{
                              backgroundColor: isSelected
                                ? primaryShades[500]
                                : "",
                              color: isSelected ? "#fff" : "",
                            }}
                          >
                            {guard.name[0]}
                            {guard.lastName?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-800 uppercase truncate">
                              {guard.name} {guard.lastName}
                            </p>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              ID: {guard.id.slice(-6)}
                            </span>
                          </div>
                          {isSelected && (
                            <FaCheck
                              style={{ color: primaryShades[500] }}
                              size={10}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: SUMMARY */}
            {currentStep === 3 && (
              <div className="h-full overflow-y-auto p-6 lg:p-8">
                <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
                  <section
                    className="bg-white rounded-[32px] border border-slate-100 p-10 relative overflow-hidden"
                    style={{
                      boxShadow: `0 20px 25px -5px ${hexToRgba(primaryShades[100], 0.15)}`,
                    }}
                  >
                    <div className="relative z-10 space-y-10">
                      <div className="border-b border-slate-50 pb-8">
                        <span
                          className="font-black uppercase text-[9px] tracking-[0.3em] block mb-3"
                          style={{ color: primaryShades[600] }}
                        >
                          Resumen Final
                        </span>
                        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">
                          {title}
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-1">
                          <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Puntos
                          </h4>
                          <p className="text-base font-black text-slate-800 uppercase">
                            {addedLocations.length} Ubicaciones
                          </p>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            Personal
                          </h4>
                          <p className="text-base font-black text-slate-800 uppercase">
                            {selectedGuards.length} Guardia(s)
                          </p>
                        </div>
                      </div>

                      <div
                        className="p-6 rounded-[24px] flex items-center gap-4"
                        style={{ backgroundColor: primaryShades[50] }}
                      >
                        <div
                          className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0"
                          style={{ color: primaryShades[500] }}
                        >
                          <FaCheck size={14} />
                        </div>
                        <p
                          className="text-[9px] font-black uppercase tracking-tight"
                          style={{ color: primaryShades[700] }}
                        >
                          Configuracion validada exitosamente. <br />
                          Listo para el despliegue.
                        </p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* STANDARDIZED FOOTER */}
        <footer className="bg-white border-t border-slate-100 p-4 lg:px-8 flex justify-between items-center relative z-20 shadow-sm shrink-0">
          <ITButton
            onClick={() =>
              currentStep === 0
                ? navigate("/routes")
                : setCurrentStep((prev) => prev - 1)
            }
            variant="filled"
            color="secondary"
            className="!rounded-lg !px-4 !h-9"
          >
            <div className="flex items-center gap-2">
              <FaChevronLeft size={7} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {currentStep === 0 ? "Salir" : "Atras"}
              </span>
            </div>
          </ITButton>

          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <ITButton
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={!steps[currentStep].isValid}
                color="primary"
                className="!rounded-lg !px-6 !h-9"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Siguiente
                  </span>
                  <FaChevronRight size={7} />
                </div>
              </ITButton>
            ) : (
              <ITButton
                onClick={handleSave}
                color="primary"
                className="!rounded-lg !px-8 !h-9"
              >
                <div className="flex items-center gap-2">
                  <FaClipboardCheck size={10} />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    {isEditing ? "Guardar" : "Activar"}
                  </span>
                </div>
              </ITButton>
            )}
          </div>
        </footer>
      </div>

      <ITDialog
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Registro Rapido de Guardia"
      >
        <CreateUserWizard
          onCancel={() => setShowUserModal(false)}
          onSuccess={() => {
            fetchInitialData();
            setShowUserModal(false);
          }}
        />
      </ITDialog>
    </div>
  );
};

export default CreateRoutePage;

import { post } from "@app/core/axios/axios";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import { ITStepper } from "@app/core/components/ITStepper";
import { CreateUserWizard } from "../../users/components/CreateUserWizard";
import { useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaChevronLeft,
  FaClipboardCheck,
  FaInfoCircle,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaRoute,
  FaTrash,
  FaUserFriends,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  getLocations,
  Location,
} from "../../locations/service/locations.service";
import { getUsers, User } from "../../users/services/UserService";
import {
  createRoute,
  getRouteById,
  ILocationCreate,
  updateRoute,
} from "../services/RoutesService";

const CreateRoutePage = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- States ---
  const [currentStep, setCurrentStep] = useState(0);
  const [title, setTitle] = useState("");
  const [addedLocations, setAddedLocations] = useState<ILocationCreate[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [allGuards, setAllGuards] = useState<User[]>([]);
  const [clientZones, setClientZones] = useState<any[]>([]);
  const [selectedLocId, setSelectedLocId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string | number>("");
  const [selectedZoneId, setSelectedZoneId] = useState<string | number>("");
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  const { data: clients } = useCatalog("client");

  // --- Logic (Mantenida igual) ---
  useEffect(() => {
    fetchInitialData();
    if (isEditing) fetchFullData(id);
  }, [id]);

  useEffect(() => {
    if (selectedClientId) fetchZones(String(selectedClientId));
    else {
      setClientZones([]);
      setSelectedZoneId("");
    }
  }, [selectedClientId]);

  const fetchZones = async (clientId: string) => {
    try {
      const res = await post<any>("/zones/datatable", {
        filters: { clientId },
      });
      if (res.success && res.data) setClientZones(res.data.rows || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchFullData = async (routeId: string) => {
    setFetchingData(true);
    try {
      const res = await getRouteById(routeId);
      if (res.success && res.data) {
        const data = res.data;
        setTitle(data.title);
        setAddedLocations(
          (data.recurringLocations || []).map((rl: any) => ({
            locationId: rl.location?.id,
            locationName: rl.location?.name,
            tasks: (rl.tasks || []).map((t: any) => ({
              description: t.description,
              reqPhoto: t.reqPhoto,
            })),
          })),
        );
        setSelectedGuards(data.guards?.map((g: any) => g.id) || []);
        if (data.recurringLocations?.[0]?.location?.clientId)
          setSelectedClientId(data.recurringLocations[0].location.clientId);
        if (data.recurringLocations?.[0]?.location?.zoneId)
          setSelectedZoneId(data.recurringLocations[0].location.zoneId);
      }
    } catch (e) {
      dispatch(showToast({ message: "Error al cargar datos", type: "error" }));
    } finally {
      setFetchingData(false);
    }
  };

  const fetchInitialData = async () => {
    const [locRes, usersRes] = await Promise.all([getLocations(), getUsers()]);
    if (locRes.success) setAllLocations(locRes.data);
    if (usersRes.success) {
      setAllGuards(
        usersRes.data.filter((u) => {
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
        !addedLocations.find((al) => al.locationId === (l.id as any)),
    );
    if (zoneLocs.length === 0) return;
    setAddedLocations([
      ...addedLocations,
      ...zoneLocs.map((l) => ({
        locationId: l.id as any,
        locationName: l.name,
        tasks: [],
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

  const toggleGuard = (id: string) => {
    setSelectedGuards((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const filteredGuards = useMemo(
    () =>
      allGuards.filter(
        (g) =>
          !selectedClientId ||
          String(g.clientId) === String(selectedClientId) ||
          !g.clientId,
      ),
    [allGuards, selectedClientId],
  );

  const availableLocations = useMemo(
    () =>
      allLocations.filter(
        (l) =>
          !addedLocations.find((al) => al.locationId === (l.id as any)) &&
          (!selectedClientId ||
            String(l.clientId) === String(selectedClientId)),
      ),
    [allLocations, addedLocations, selectedClientId],
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        title,
        clientId: selectedClientId,
        locations: addedLocations,
        guardIds: selectedGuards,
      };
      const res = isEditing
        ? await updateRoute(id!, payload)
        : await createRoute(payload);
      if (res.success) {
        dispatch(showToast({ message: "Ruta guardada", type: "success" }));
        navigate("/routes");
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Identificación",
      icon: <FaInfoCircle />,
      isValid: !!title && !!selectedClientId,
    },
    {
      title: "Puntos de Control",
      icon: <FaMapMarkerAlt />,
      isValid: addedLocations.length > 0,
    },
    {
      title: "Asignación",
      icon: <FaUserFriends />,
      isValid: selectedGuards.length > 0,
    },
    { title: "Resumen", icon: <FaClipboardCheck />, isValid: true },
  ];

  if (fetchingData)
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <ITLoader size="lg" />
        <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">
          Sincronizando datos...
        </p>
      </div>
    );

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      {/* Cabecera Compacta */}
      <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/routes")}
            className="w-8 h-8 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors"
          >
            <FaChevronLeft size={14} />
          </button>
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">
              {isEditing ? "Editar Ruta" : "Nueva Ruta"}
            </h1>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-12">
          <ITStepper
            steps={steps.map((s) => ({
              label: s.title,
              icon: s.icon,
            }))}
            currentStep={currentStep}
          />
        </div>

        <div className="w-32 flex justify-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Operaciones
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-hidden flex flex-col min-h-0">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
          <div className="max-h-[calc(100vh-280px)] bg-white rounded-[20px] shadow-xl shadow-slate-200/20 border border-slate-100 flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Contenido SIN SCROLL - Usando grid responsive */}
            <div className="flex-1 p-6 min-h-0">
              {/* STEP 1: IDENTIFICACIÓN */}
              {currentStep === 0 && (
                <div className="h-full flex items-center justify-center">
                  <div className="max-w-4xl w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                      <div className="space-y-4">
                        <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                          <FaInfoCircle size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                            Identidad
                          </h2>
                          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                            Nombre operativo y cliente responsable.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100 space-y-4">
                        <ITInput
                          label="Nombre de Referencia"
                          placeholder="Ej. Perímetro Planta Norte"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          name="title"
                          onBlur={() => {}}
                          className="!h-[44px] !rounded-xl !bg-white"
                          iconLeft={<FaRoute className="text-slate-400" />}
                        />
                        <ITSearchSelect
                          label="Cliente Responsable"
                          placeholder="Seleccionar cliente..."
                          options={
                            clients?.map((c: any) => ({
                              label: c.name,
                              value: c.id,
                            })) || []
                          }
                          value={selectedClientId}
                          onChange={(val) => {
                            setSelectedClientId(val);
                            setSelectedZoneId("");
                            setAddedLocations([]);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PUNTOS DE CONTROL - Layout horizontal sin scroll */}
              {currentStep === 1 && (
                <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-auto">
                  {/* Panel izquierdo - fijo */}
                  <div className="lg:col-span-4 h-full">
                    <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-200/50 h-full flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.2em] mb-1">
                          Operación
                        </h3>
                        <p className="text-lg font-black">Puntos QR</p>
                      </div>

                      <div className="space-y-6 flex-1">
                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-emerald-100 uppercase tracking-widest ml-1">
                            Carga por Zona
                          </label>
                          <ITSearchSelect
                            label=""
                            options={clientZones.map((z) => ({
                              label: z.name,
                              value: z.id,
                            }))}
                            value={selectedZoneId}
                            onChange={setSelectedZoneId}
                            className="dark-select"
                          />
                          <ITButton
                            onClick={handleBulkAddByZone}
                            disabled={!selectedZoneId}
                            className="w-full !rounded-xl !h-[40px] !bg-white/10 hover:!bg-white/20 !border-white/10 !text-white font-black text-[9px] uppercase tracking-widest"
                          >
                            Importar Zona
                          </ITButton>
                        </div>

                        <div className="h-px bg-white/10" />

                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-emerald-100 uppercase tracking-widest ml-1">
                            Punto Individual
                          </label>
                          <ITSearchSelect
                            label=""
                            options={availableLocations.map((l) => ({
                              label: l.name,
                              value: l.id,
                            }))}
                            value={selectedLocId}
                            onChange={setSelectedLocId as any}
                          />
                          <ITButton
                            onClick={handleAddLocation}
                            disabled={!selectedLocId}
                            className="w-full !rounded-xl !h-[40px] !bg-white !text-emerald-600 hover:!bg-emerald-50 shadow-lg shadow-emerald-700/20 !border-none font-black text-[9px] uppercase tracking-widest"
                          >
                            Vincular Punto
                          </ITButton>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-center">
                          <span className="text-2xl font-black">
                            {addedLocations.length}
                          </span>
                          <span className="text-[9px] block text-emerald-200">
                            Puntos agregados
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel derecho - Grid de ubicaciones con scroll controlado */}
                  <div className="lg:col-span-8 h-full flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                          Secuencia Operativa
                        </h3>
                      </div>
                      {addedLocations.length > 0 && (
                        <button
                          onClick={() => setAddedLocations([])}
                          className="text-[10px] font-black text-rose-500 uppercase hover:text-rose-600 transition-colors tracking-widest"
                        >
                          Limpiar todo
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                      {addedLocations.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                          <div className="text-center">
                            <FaMapMarkerAlt
                              size={48}
                              className="mb-4 opacity-10 mx-auto"
                            />
                            <p className="font-black text-[10px] uppercase tracking-[0.2em]">
                              Sin puntos de control
                            </p>
                            <p className="text-[8px] mt-2 text-slate-400">
                              Selecciona ubicaciones del panel izquierdo
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`grid gap-4 pb-4 ${
                            addedLocations.length === 1
                              ? "grid-cols-1 max-w-2xl mx-auto"
                              : "grid-cols-1 md:grid-cols-2"
                          }`}
                        >
                          {addedLocations.map((loc, idx) => (
                            <div
                              key={loc.locationId}
                              className="bg-white border border-slate-100 rounded-[1.5rem] p-5 hover:border-emerald-200 transition-all shadow-sm hover:shadow-md group"
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-black border border-emerald-100 shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                                    {idx + 1}
                                  </div>
                                  <p className="font-black text-slate-800 uppercase text-xs tracking-tight line-clamp-1">
                                    {loc.locationName}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    setAddedLocations(
                                      addedLocations.filter(
                                        (_, i) => i !== idx,
                                      ),
                                    )
                                  }
                                  className="w-7 h-7 rounded-full bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center shrink-0"
                                >
                                  <FaTrash size={10} />
                                </button>
                              </div>

                              <div className="space-y-2">
                                {loc.tasks.map((task, tIdx) => (
                                  <div
                                    key={tIdx}
                                    className="flex items-center gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50 group/task"
                                  >
                                    <input
                                      className="flex-1 bg-transparent text-[10px] outline-none px-1 font-black text-slate-600 uppercase placeholder:text-slate-300"
                                      placeholder="Definir tarea..."
                                      value={task.description}
                                      onChange={(e) =>
                                        handleTaskChange(
                                          idx,
                                          tIdx,
                                          e.target.value,
                                        )
                                      }
                                    />
                                    <button
                                      onClick={() => {
                                        const copy = [...addedLocations];
                                        copy[idx].tasks.splice(tIdx, 1);
                                        setAddedLocations(copy);
                                      }}
                                      className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover/task:opacity-100"
                                    >
                                      <FaMinus size={8} />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleAddTask(idx)}
                                  className="w-full border border-dashed border-slate-200 rounded-xl py-2.5 text-[9px] font-black text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
                                >
                                  <FaPlus size={8} /> AGREGAR TAREA
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PERSONAL ASIGNADO - Grid sin scroll */}
              {currentStep === 2 && (
                <div className="h-full flex flex-col space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] text-slate-800 shadow-xl shadow-slate-200/50 border border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-800">
                        Equipo Responsable
                      </h2>
                      <p className="text-slate-500 text-xs mt-1">
                        Habilita al personal para este recorrido.
                      </p>
                    </div>
                    <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100 text-center min-w-[100px]">
                      <span className="block text-2xl font-black text-emerald-600">
                        {selectedGuards.length}
                      </span>
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                        Seleccionados
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredGuards.length === 0 ? (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem]">
                          <FaUserFriends
                            size={48}
                            className="text-slate-200 mb-4"
                          />
                          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mb-4">
                            No hay personal disponible
                          </p>
                          <ITButton
                            onClick={() => setShowUserModal(true)}
                            className="!bg-white !text-slate-900 !border-slate-200 !rounded-xl !h-[40px] font-black uppercase text-[10px] tracking-widest px-6"
                          >
                            Alta Rápida de Guardia
                          </ITButton>
                        </div>
                      ) : (
                        filteredGuards.map((guard) => {
                          const isSelected = selectedGuards.includes(guard.id);
                          return (
                            <div
                              key={guard.id}
                              onClick={() => toggleGuard(guard.id)}
                              className={`cursor-pointer p-3 rounded-[1.5rem] border-2 transition-all flex items-center gap-3 ${
                                isSelected
                                  ? "bg-emerald-50 border-emerald-500"
                                  : "bg-white border-slate-50 hover:border-slate-100 shadow-sm"
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border-2 border-white shadow-sm shrink-0 ${
                                  isSelected
                                    ? "bg-emerald-500 text-white"
                                    : "bg-slate-100 text-slate-400"
                                }`}
                              >
                                {guard.name[0]}
                                {guard.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-700 uppercase truncate">
                                  {guard.name} {guard.lastName}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  ID: {guard.id.slice(-6)}
                                </p>
                              </div>
                              {isSelected && (
                                <FaCheck
                                  className="text-emerald-500 shrink-0"
                                  size={10}
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: RESUMEN FINAL */}
              {currentStep === 3 && (
                <div className="h-full flex items-center justify-center">
                  <div className="max-w-3xl w-full">
                    <div className="bg-white border-2 border-slate-50 shadow-2xl shadow-slate-200/60 rounded-[2.5rem] p-8 relative overflow-hidden">
                      <div className="absolute -top-10 -right-10 text-emerald-50 opacity-20 rotate-12">
                        <FaRoute size={180} />
                      </div>

                      <div className="space-y-8 relative z-10">
                        <div className="border-b border-slate-100 pb-6">
                          <span className="text-emerald-600 font-black uppercase text-[9px] tracking-[0.4em] mb-2 block">
                            Validación Final
                          </span>
                          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter break-words">
                            {title}
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Cliente
                            </h4>
                            <p className="font-black text-slate-700 uppercase tracking-tight text-sm">
                              {
                                clients?.find(
                                  (c) =>
                                    String(c.id) === String(selectedClientId),
                                )?.name
                              }
                            </p>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Infraestructura
                            </h4>
                            <p className="font-black text-slate-700 uppercase tracking-tight text-sm">
                              {addedLocations.length} Ubicaciones
                            </p>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Efectivos
                            </h4>
                            <p className="font-black text-slate-700 uppercase tracking-tight text-sm">
                              {selectedGuards.length} Asignados
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navegación - Siempe visible sin scroll */}
            <div className="bg-slate-50/80 border-t border-slate-100 p-4 flex justify-between items-center shrink-0 mt-4">
              <ITButton
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={currentStep === 0}
                variant="ghost"
                className="!text-slate-400 !bg-transparent hover:!text-slate-800 disabled:!opacity-0"
              >
                <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest">
                  <FaChevronLeft /> Anterior
                </div>
              </ITButton>

              <div className="flex gap-3">
                {currentStep < steps.length - 1 ? (
                  <ITButton
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    disabled={!steps[currentStep].isValid}
                    className="!rounded-xl !px-8 !h-[42px] !bg-slate-900 font-black text-[10px] uppercase tracking-widest"
                  >
                    Siguiente Paso
                  </ITButton>
                ) : (
                  <ITButton
                    onClick={handleSave}
                    disabled={loading}
                    className="!rounded-xl !px-10 !h-[42px] !bg-emerald-600 font-black text-[10px] uppercase tracking-widest"
                  >
                    {loading ? "GUARDANDO..." : "FINALIZAR RUTA"}
                  </ITButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ITDialog
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Registro Rápido de Guardia"
      >
        <div className="p-2">
          <CreateUserWizard
            onCancel={() => setShowUserModal(false)}
            onSuccess={() => {
              fetchInitialData();
              setShowUserModal(false);
            }}
          />
        </div>
      </ITDialog>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        .dark-select .axzy-select-trigger { background: rgba(255,255,255,0.05) !important; border-color: rgba(255,255,255,0.1) !important; color: white !important; }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `,
        }}
      />
    </div>
  );
};

export default CreateRoutePage;

import { ITMediaGrid } from "@app/core/components/ITMediaGrid";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITBadget, ITButton, ITLoader } from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowLeft,
  FaBuilding,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaMapMarkedAlt,
  FaPlay,
  FaQrcode,
  FaRoute,
  FaStopwatch,
  FaUserShield,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMapComponent } from "../../../core/components/GoogleMapComponent";
import { getRoutesList } from "../../routes/services/RoutesService";
import { getRoundDetail, IRoundDetail } from "../services/RoundsService";

const API_BASE_URL = "http://localhost:4444";

const RoundDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [data, setData] = useState<IRoundDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeTitle, setRouteTitle] = useState("");


  const metrics = useMemo(() => {
    if (!data) return null;

    const start = new Date(data.round.startTime);
    const end = data.round.endTime
      ? new Date(data.round.endTime)
      : data.round.status === "COMPLETED"
        ? new Date()
        : null;
    const effectiveEnd = end || new Date();

    const durationMs = effectiveEnd.getTime() - start.getTime();
    const durationMinutes = Math.floor(durationMs / 60000);
    const durationSeconds = Math.floor((durationMs % 60000) / 1000);

    const scans = data.timeline
      .filter((e) => e.type === "SCAN")
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const visitedLocations = new Set<string>();
    let validScansCount = 0;

    const mapNodes: any[] = [];
    let previousTime = start;

    mapNodes.push({
      type: "START",
      label: "Inicio",
      status: "START",
      timeDiff: null,
    });

    scans.forEach((scan) => {
      const current = new Date(scan.timestamp);
      const diff = current.getTime() - previousTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      const locId = String(scan.data?.location?.id);
      const isDuplicate = visitedLocations.has(locId);
      visitedLocations.add(locId);

      const hasEvidence =
        scan.data?.media &&
        Array.isArray(scan.data.media) &&
        scan.data.media.length > 0;
      let status = hasEvidence ? "SUCCESS" : "INCOMPLETE";

      if (isDuplicate && hasEvidence) {
        const alreadyHadSuccess = mapNodes.some(
          (n) =>
            n.label === scan.data?.location?.name && n.status === "SUCCESS",
        );
        if (alreadyHadSuccess) status = "DUPLICATE";
      }

      if (status === "SUCCESS" && !isDuplicate) validScansCount++;

      mapNodes.push({
        type: "POINT",
        label: scan.data?.location?.name || "Punto",
        status,
        timeDiff: `${mins}m ${secs}s`,
        diffMs: diff,
      });
      previousTime = current;
    });

    const expectedLocs =
      data.round.recurringConfiguration?.recurringLocations ||
      data.round.client?.locations?.map((l: any) => ({ location: l })) ||
      [];
    const missingLocs = expectedLocs.filter(
      (l: any) => !visitedLocations.has(String(l.location.id)),
    );

    missingLocs.forEach((loc: any) => {
      mapNodes.push({
        type: "POINT",
        label: loc.location.name,
        status: data.round.status === "COMPLETED" ? "MISSING" : "PENDING",
        timeDiff: "--",
        diffMs: 0,
      });
    });

    if (data.round.endTime) {
      const current = new Date(data.round.endTime);
      const diff = current.getTime() - previousTime.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      mapNodes.push({
        type: "END",
        label: "Fin",
        status: "END",
        timeDiff: `${mins}m ${secs}s`,
      });
    }

    const avgTime =
      scans.length > 0
        ? durationMs / (scans.length + (data.round.endTime ? 1 : 0))
        : 0;
    const avgMins = Math.floor(avgTime / 60000);
    const avgSecs = Math.floor((avgTime % 60000) / 1000);

    return {
      duration: `${durationMinutes}m ${durationSeconds}s`,
      totalScans: validScansCount,
      totalRawScans: scans.length,
      expectedScans: expectedLocs.length,
      mapNodes,
      avgTime: `${avgMins}m ${avgSecs}s`,
    };
  }, [data]);

  useEffect(() => {
    if (id) getData(id);
  }, [id]);

  const getData = async (roundId: string) => {
    setLoading(true);
    const res = await getRoundDetail(roundId);
    if (res.success && res.data) {
      setData(res.data);
      if (res.data.round.recurringConfiguration) {
        setRouteTitle(res.data.round.recurringConfiguration.title);
      } else if (res.data.round.recurringConfigurationId) {
        getRoutesList().then((routesRes) => {
          if (routesRes.success && routesRes.data) {
            const match = routesRes.data.find(
              (r: any) => r.id === res.data.round.recurringConfigurationId,
            );
            if (match) setRouteTitle(match.title);
          }
        });
      }
    }
    setLoading(false);
  };

  const handleOpenRouteMap = () => {
    if (!data) return;
    const scansWithCoords = data.timeline
      .filter((e) => e.type === "SCAN" && e.data?.latitude && e.data?.longitude)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    if (scansWithCoords.length === 0) {
      dispatch(
        showToast({
          message: "No hay puntos con coordenadas GPS para trazar una ruta.",
          type: "warning",
        }),
      );
      return;
    }

    if (scansWithCoords.length === 1) {
      const url = `https://www.google.com/maps/search/?api=1&query=${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
      window.open(url, "_blank");
      return;
    }

    const origin = `${scansWithCoords[0].data.latitude},${scansWithCoords[0].data.longitude}`;
    const destination = `${scansWithCoords[scansWithCoords.length - 1].data.latitude},${scansWithCoords[scansWithCoords.length - 1].data.longitude}`;
    const waypoints = scansWithCoords
      .slice(1, -1)
      .map((s) => `${s.data.latitude},${s.data.longitude}`)
      .join("|");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
    window.open(url, "_blank");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <ITLoader />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Sincronizando ruta...
        </p>
      </div>
    );

  if (!data)
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-[32px] shadow-xl p-12 max-w-md border border-slate-100">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100">
            <FaExclamationTriangle className="text-rose-500 text-3xl" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
            Ronda no encontrada
          </h3>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-8">
            El registro solicitado no existe o fue removido.
          </p>
          <ITButton
            onClick={() => navigate(-1)}
            className="w-full !h-14 !rounded-2xl shadow-xl shadow-emerald-100"
          >
            VOLVER AL HISTORIAL
          </ITButton>
        </div>
      </div>
    );

  const title =
    routeTitle ||
    data.round.recurringConfiguration?.title ||
    `Ronda #${data.round.id}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all text-slate-400 border border-slate-100 group-hover:border-emerald-400 shadow-sm">
              <FaArrowLeft size={14} />
            </div>
            <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-widest transition-colors">
              Volver
            </span>
          </button>

          <div className="flex items-center gap-3">
            <ITButton
              onClick={() => {
                const token = localStorage.getItem("token");
                window.open(
                  `${import.meta.env.VITE_BASE_URL}/rounds/${id}/report?token=${token}`,
                  "_blank",
                );
              }}
              variant="outline"
              className="!h-11 !px-6 !rounded-xl !border-slate-100 !bg-white !text-slate-600"
            >
              <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                <FaFileAlt className="text-emerald-500" /> Exportar PDF
              </div>
            </ITButton>
            <ITBadget
              color={data.round.status === "COMPLETED" ? "success" : "warning"}
              className="font-black text-[9px] px-4 tracking-widest"
            >
              {data.round.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
            </ITBadget>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Header Content */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-slate-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                <FaRoute size={20} />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight">
                {title}
              </h1>
            </div>

            <div className="flex flex-wrap gap-6">
              <HeaderMetric
                icon={<FaUserShield className="text-blue-500" />}
                label="Guardia"
                value={`${data.round.guard.name} ${data.round.guard.lastName}`}
              />
              <HeaderMetric
                icon={<FaBuilding className="text-slate-500" />}
                label="Cliente"
                value={data.round.client?.name || "Sin Cliente"}
              />
              <HeaderMetric
                icon={<FaCalendarAlt className="text-emerald-500" />}
                label="Fecha"
                value={dayjs(data.round.startTime).format("DD/MM/YYYY")}
              />
            </div>
          </div>
        </div>

        {/* Dash Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              icon={<FaClock />}
              color="indigo"
              label="Duración Total"
              value={metrics.duration}
              subValue="Tiempo efectivo de recorrido"
            />
            <MetricCard
              icon={<FaQrcode />}
              color="emerald"
              label="Puntos Cubiertos"
              value={`${metrics.totalScans} / ${metrics.expectedScans || metrics.totalRawScans}`}
              subValue="Progreso de la ruta"
            />
            <MetricCard
              icon={<FaStopwatch />}
              color="amber"
              label="Promedio por Punto"
              value={metrics.avgTime}
              subValue="Ritmo operativo detectado"
            />
          </div>
        )}

        {/* Visual Route Visualizer */}
        {metrics && (
          <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <FaMapMarkedAlt size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    Esquema de Recorrido
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                    Visualización secuencial de la ruta
                  </p>
                </div>
              </div>
              <ITButton
                onClick={handleOpenRouteMap}
                variant="outline"
                className="!h-12 !px-6 !rounded-2xl !border-slate-100 !bg-slate-50 !text-slate-600"
              >
                <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest">
                  <FaMapMarkedAlt className="text-blue-500" /> Trazar en Google
                  Maps
                </div>
              </ITButton>
            </div>

            <div className="overflow-x-auto pb-6 scrollbar-hide">
              <div className="flex items-start min-w-max px-4">
                {metrics.mapNodes.map((node: any, idx: number) => (
                  <div key={idx} className="flex items-center">
                    {idx > 0 && (
                      <div className="flex flex-col items-center mx-4">
                        <div className="w-16 h-1 bg-slate-100 rounded-full relative overflow-hidden">
                          {node.diffMs > 0 && (
                            <div className="absolute inset-0 bg-emerald-500/20" />
                          )}
                        </div>
                        {node.timeDiff && node.timeDiff !== "--" && (
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 bg-white px-2 py-0.5 rounded-lg border border-slate-100 shadow-sm">
                            {node.timeDiff}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col items-center w-32 group">
                      <div
                        className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl transition-all duration-500 group-hover:scale-110 border-4 border-white
                          ${node.status === "START" ? "bg-indigo-600 text-white shadow-indigo-200" : ""}
                          ${node.status === "END" ? "bg-slate-800 text-white shadow-slate-300" : ""}
                          ${node.status === "SUCCESS" ? "bg-emerald-500 text-white shadow-emerald-200" : ""}
                          ${node.status === "DUPLICATE" ? "bg-rose-500 text-white shadow-rose-200" : ""}
                          ${node.status === "INCOMPLETE" ? "bg-amber-500 text-white shadow-amber-200" : ""}
                          ${node.status === "MISSING" ? "bg-rose-50 text-rose-500 border-rose-100 shadow-none" : ""}
                          ${node.status === "PENDING" ? "bg-slate-50 text-slate-300 border-slate-100 shadow-none" : ""}
                        `}
                      >
                        {node.status === "START" && (
                          <FaPlay size={18} className="ml-1" />
                        )}
                        {node.status === "END" && <FaCheckCircle size={22} />}
                        {node.status === "SUCCESS" && (
                          <FaCheckCircle size={22} />
                        )}
                        {node.status === "DUPLICATE" && (
                          <span className="font-black text-2xl">!</span>
                        )}
                        {node.status === "INCOMPLETE" && (
                          <FaExclamationTriangle size={20} />
                        )}
                        {node.status === "MISSING" && (
                          <span className="font-black text-xl">?</span>
                        )}
                        {node.status === "PENDING" && <FaClock size={20} />}
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-tight line-clamp-2">
                          {node.label}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Timeline Refined */}
        <div className="space-y-8">
          <div className="flex items-center gap-4 ml-2">
            <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              Expediente de Tiempo
            </h2>
          </div>

          <div className="relative border-l-2 border-slate-100 ml-6 space-y-12 pb-10">
            {data.timeline.map((event, index) => (
              <div
                key={index}
                className="relative pl-12 animate-in fade-in slide-in-from-left-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TimelineIcon type={event.type} />

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-lg shadow-slate-200/40 p-8 hover:shadow-xl transition-all group overflow-hidden relative">
                  <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                          {dayjs(event.timestamp).format("HH:mm:ss [HRS]")}
                        </span>
                        <div className="w-px h-3 bg-slate-200" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {dayjs(event.timestamp).format("DD MMMM, YYYY")}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-slate-600 transition-colors">
                        {event.description}
                      </h3>
                    </div>
                  </div>

                  {event.type === "SCAN" && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Evidence Column */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Registros de Campo
                            </p>
                          </div>
                          {event.data?.media?.length > 0 ? (
                            <ITMediaGrid
                              media={event.data.media}
                              gridSize={240}
                            />
                          ) : (
                            <div className="py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                              <FaFileAlt className="text-slate-200 text-3xl mb-3" />
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                Sin evidencia fotográfica
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Location/Map Column */}
                        <div className="space-y-6">
                          <div className="flex items-center gap-3 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Geoposicionamiento
                            </p>
                          </div>
                          {event.data?.latitude ? (
                            <div className="rounded-[24px] overflow-hidden border border-slate-100 shadow-sm">
                              <GoogleMapComponent
                                lat={Number(event.data.latitude)}
                                lng={Number(event.data.longitude)}
                                height="240px"
                                zoom={18}
                              />
                            </div>
                          ) : (
                            <div className="h-[240px] bg-slate-50 rounded-[24px] border border-slate-100 flex items-center justify-center">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                GPS no disponible
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dynamic Task List or Notes */}
                      {(event.data?.notes || event.data?.assignment?.tasks) && (
                        <div className="pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
                          {event.data?.notes && (
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Observaciones
                              </p>
                              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-600 font-bold italic leading-relaxed">
                                  "{event.data.notes}"
                                </p>
                              </div>
                            </div>
                          )}
                          {event.data?.assignment?.tasks && (
                            <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                Tareas Asignadas
                              </p>
                              <div className="space-y-2">
                                {event.data.assignment.tasks.map(
                                  (task: any) => (
                                    <div
                                      key={task.id}
                                      className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
                                    >
                                      <div
                                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] transition-all ${task.completed ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-200 border border-slate-100"}`}
                                      >
                                        <FaCheckCircle />
                                      </div>
                                      <span
                                        className={`text-[10px] font-black uppercase tracking-tight ${task.completed ? "text-emerald-700" : "text-slate-500"}`}
                                      >
                                        {task.description}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {event.type === "INCIDENT" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <ITBadget
                            color="danger"
                            variant="outlined"
                            className="font-black text-[9px] px-3 tracking-widest"
                          >
                            INCIDENTE: {event.data?.category}
                          </ITBadget>
                        </div>
                        <p className="text-sm text-slate-600 font-bold leading-relaxed">
                          {event.data?.description}
                        </p>
                        {event.data?.media?.length > 0 && (
                          <ITMediaGrid
                            media={event.data.media.map((m: any) => ({
                              ...m,
                              url: m.url.startsWith("http")
                                ? m.url
                                : `${API_BASE_URL}${m.url.replace("/api/v1", "")}`,
                            }))}
                            gridSize={240}
                          />
                        )}
                      </div>
                      <div>
                        {event.data?.latitude && (
                          <div className="rounded-[24px] overflow-hidden border-2 border-rose-100 shadow-sm">
                            <GoogleMapComponent
                              lat={Number(event.data.latitude)}
                              lng={Number(event.data.longitude)}
                              height="300px"
                              zoom={18}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const HeaderMetric = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
        {value}
      </p>
    </div>
  </div>
);

const MetricCard = ({ icon, color, label, value, subValue }: any) => {
  const colors: any = {
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-100",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-100",
    amber: "from-amber-500 to-amber-600 shadow-amber-100",
  };

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-lg shadow-slate-200/40 relative overflow-hidden group">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-[0.03] rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`}
      />
      <div className="relative space-y-4">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white shadow-lg`}
        >
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            {label}
          </p>
          <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">
            {value}
          </p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {subValue}
          </p>
        </div>
      </div>
    </div>
  );
};

const TimelineIcon = ({ type }: { type: string }) => {
  const styles: any = {
    START: {
      bg: "bg-indigo-600",
      icon: <FaPlay className="ml-1" />,
      border: "border-indigo-100 shadow-indigo-100",
    },
    SCAN: {
      bg: "bg-emerald-500",
      icon: <FaQrcode />,
      border: "border-emerald-100 shadow-emerald-100",
    },
    INCIDENT: {
      bg: "bg-rose-500",
      icon: <FaExclamationTriangle />,
      border: "border-rose-100 shadow-rose-100",
    },
    END: {
      bg: "bg-slate-800",
      icon: <FaCheckCircle />,
      border: "border-slate-100 shadow-slate-100",
    },
  };

  const config = styles[type] || {
    bg: "bg-slate-300",
    icon: null,
    border: "border-slate-50",
  };

  return (
    <div
      className={`absolute -left-[19px] top-0 w-9 h-9 rounded-xl ${config.bg} ${config.border} border-4 text-white flex items-center justify-center z-10 shadow-lg text-xs transition-transform group-hover:scale-110`}
    >
      {config.icon}
    </div>
  );
};

export default RoundDetailPage;

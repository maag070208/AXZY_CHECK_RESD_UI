import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITLoader,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaEye, FaRoute, FaStop, FaUser } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getRoutesList } from "../../routes/services/RoutesService";
import {
  endRound,
  getPaginatedRounds,
  IRound,
} from "../services/RoundsService";

dayjs.extend(utc);
dayjs.extend(timezone);

const RoundsPage = () => {
  const [selectedDate, setSelectedDate] = useState<any>([
    dayjs().tz("America/Tijuana").toDate(),
    dayjs().tz("America/Tijuana").toDate(),
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state: any) => state.auth);
  const isResident = user?.role === "RESDN";

  const [routesMap, setRoutesMap] = useState<Record<string, string>>({});
  const [roundToFinishId, setRoundToFinishId] = useState<string | null>(null);

  useEffect(() => {
    getRoutesList().then((res) => {
      if (res.success && res.data) {
        const map: Record<string, string> = {};
        res.data.forEach((r: any) => {
          map[r.id] = r.title;
        });
        setRoutesMap(map);
      }
    });
  }, []);

  const externalFilters = useMemo(() => {
    const filters: any = {};

    if (Array.isArray(selectedDate) && selectedDate[0] && selectedDate[1]) {
      filters.date = [
        dayjs(selectedDate[0]).tz("America/Tijuana").startOf("day").format(),
        dayjs(selectedDate[1]).tz("America/Tijuana").endOf("day").format(),
      ];
    }

    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }

    if (statusFilter !== "ALL") {
      filters.status = statusFilter;
    }

    return filters;
  }, [selectedDate, searchTerm, statusFilter]);

  const memoizedFetch = useCallback(
    async (params: any) => {
      const res = await getPaginatedRounds({
        ...params,
        filters: { ...params.filters, ...externalFilters },
        sort: params.sort || { key: "startTime", direction: "desc" },
      });
      return res;
    },
    [externalFilters],
  );

  const confirmEndRound = async () => {
    if (!roundToFinishId || isFinishing) return;
    setIsFinishing(true);
    const res = await endRound(roundToFinishId);
    setIsFinishing(false);
    setRoundToFinishId(null);
    if (res.success) {
      dispatch(showToast({ message: "Ronda finalizada", type: "success" }));
      setRefreshKey((prev) => prev + 1);
    } else {
      dispatch(showToast({ message: "Error al finalizar", type: "error" }));
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "recurringConfiguration",
        label: "RUTA / REFERENCIA",
        render: (row: IRound) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.recurringConfiguration?.title ||
                routesMap[row.recurringConfigurationId] ||
                "Ronda General"}
            </span>
          </div>
        ),
      },
      {
        key: "guard",
        label: "PERSONAL OPERATIVO",
        render: (row: IRound) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.guard.name} {row.guard.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                @{row.guard.name || "S/U"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "times",
        label: "CRONOLOGÍA",
        render: (row: IRound) => {
          const isActive = !row.endTime;
          const startDate = dayjs(row.startTime);
          const endDate = row.endTime ? dayjs(row.endTime) : null;

          return (
            <div className="flex flex-col gap-1.5">
              {/* INICIO - destacado */}
              <div className="flex items-center gap-2">
                <div className="w-5 text-center">
                  <span className="text-[10px] font-black text-indigo-500">
                    ▶
                  </span>
                </div>
                <div>
                  <span className="text-[12px] font-mono font-bold text-slate-800">
                    {startDate.format("DD MMM · HH:mm:ss")}
                  </span>
                </div>
              </div>

              {/* FIN / EN PROCESO - dinámico */}
              <div className="flex items-center gap-2">
                <div className="w-5 text-center">
                  {isActive ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-200" />
                  ) : (
                    <span className="text-[10px] text-slate-400">■</span>
                  )}
                </div>
                <div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isActive ? "text-emerald-600" : "text-slate-500"
                    }`}
                  >
                    {isActive ? "EN PROCESO" : ""}
                  </span>
                  <div
                    className={`text-[12px] font-mono font-bold ${
                      isActive ? "text-emerald-600" : "text-slate-500"
                    }`}
                  >
                    {isActive
                      ? "— en curso —"
                      : endDate?.format("DD MMM · HH:mm:ss")}
                  </div>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "ESTADO",
        render: (row: IRound) => (
          <ITBadget
            size="small"
            color={row.status === "COMPLETED" ? "success" : "warning"}
          >
            {row.status === "COMPLETED" ? "FINALIZADA" : "EN CURSO"}
          </ITBadget>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: IRound) => (
          <div className="flex items-center gap-2">
            <ITButton
              onClick={() => navigate(`/rounds/${row.id}`)}
              variant="outlined"
              size="small"
              title="Detalles"
            >
              <FaEye size={14} />
            </ITButton>
            {row.status === "IN_PROGRESS" && !isResident && (
              <ITButton
                onClick={() => setRoundToFinishId(row.id)}
                variant="outlined"
                size="small"
                color="error"
                title="Finalizar"
              >
                <FaStop size={14} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [navigate, routesMap, isResident],
  );

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Historial de Rondas"
        subtitle="Supervisión y cronología de recorridos operativos en tiempo real"
        icon={FaRoute}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR GUARDIA...",
          icon: FaUser,
        }}
        dateRange={{
          value: selectedDate as [Date | null, Date | null],
          onChange: (val) => {
            setSelectedDate(val);
            setRefreshKey((prev) => prev + 1);
          },
        }}
        extraFilter={
          <ITTripleFilter
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setRefreshKey((prev) => prev + 1);
            }}
            options={[
              { label: "TODAS", value: "ALL" },
              { label: "ACTIVAS", value: "IN_PROGRESS" },
              { label: "HISTORIAL", value: "COMPLETED" },
            ]}
          />
        }
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
        refreshKey={refreshKey}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <ITDataTable<IRound & Record<string, unknown>>
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
          title=""
        />
      </div>

      {/* FINISH ROUND DIALOG */}
      <ITDialog
        isOpen={!!roundToFinishId}
        onClose={() => setRoundToFinishId(null)}
        title="Finalizar Recorrido"
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaStop size={32} />
          </div>
          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Forzar Cierre de Ronda?
          </h4>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto">
            Esta acción detendrá el seguimiento en tiempo real y marcará el
            registro como finalizado de forma definitiva.
          </p>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setRoundToFinishId(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmEndRound}
              disabled={isFinishing}
            >
              {isFinishing ? <ITLoader size="sm" /> : "FINALIZAR AHORA"}
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

export default RoundsPage;

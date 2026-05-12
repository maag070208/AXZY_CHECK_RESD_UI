import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDatePicker,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaEye,
  FaRoute,
  FaStop,
  FaSync,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getRoutesList } from "../../routes/services/RoutesService";
import {
  endRound,
  getPaginatedRounds,
  IRound,
} from "../services/RoundsService";

dayjs.extend(utc);
dayjs.extend(timezone);

const RoundsPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<any>([
    dayjs().tz("America/Tijuana").toDate(),
    dayjs().tz("America/Tijuana").toDate(),
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClientId, setSelectedClientId] = useState<string | number>(
    searchParams.get("clientId") || "",
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: clients } = useCatalog("client");
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

    if (selectedClientId) {
      filters.clientId = selectedClientId;
    } else if (isResident && user?.clientId) {
      filters.clientId = user.clientId;
    }

    return filters;
  }, [
    selectedDate,
    searchTerm,
    statusFilter,
    selectedClientId,
    isResident,
    user?.clientId,
  ]);

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
        label: "Ruta de Servicio",
        render: (row: IRound) => (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
              <FaRoute size={16} />
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1">
                {row.recurringConfiguration?.title ||
                  routesMap[row.recurringConfigurationId] ||
                  "Ronda General"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <FaBuilding className="text-slate-400 text-[9px]" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {row.recurringConfiguration?.client?.name ||
                    row.client?.name ||
                    "Sin Cliente"}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "guard",
        label: "Personal Asignado",
        render: (row: IRound) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-[10px]">
              {row.guard.name?.[0]}
              {row.guard.lastName?.[0]}
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[10px] tracking-tight line-clamp-1">
                {row.guard.name} {row.guard.lastName}
              </p>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                ID: {row.guard.id.substring(0, 8)}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "times",
        label: "Cronología",
        render: (row: IRound) => (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-slate-700 font-black text-[10px] uppercase tracking-tight">
                {dayjs(row.startTime).format("DD MMM, HH:mm")}
              </span>
            </div>
            {row.endTime && (
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-red-500 font-bold text-[10px] uppercase tracking-tight">
                  {dayjs(row.endTime).format("DD MMM, HH:mm")}
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        key: "status",
        label: "Estado",
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
        label: "Control",
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
            {row.status === "IN_PROGRESS" && (
              <ITButton
                onClick={() => setRoundToFinishId(row.id)}
                variant="outlined"
                size="small"
                color="error"
                title="Finalizar"
              >
                <FaStop size={12} />
              </ITButton>
            )}
          </div>
        ),
      },
    ],
    [navigate, routesMap],
  );

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
      <ModuleHeader
        title="Historial de Rondas"
        subtitle="Supervisión y cronología de recorridos operativos en tiempo real"
        icon={FaRoute}
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full sm:justify-end">
            {!isResident && (
              <div className="w-full sm:w-56">
                <ITSearchSelect
                  placeholder="FILTRAR POR CLIENTE..."
                  options={(clients || []).map((c: any) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  value={selectedClientId}
                  onChange={(val) => {
                    setSelectedClientId(val);
                    setRefreshKey((prev) => prev + 1);
                  }}
                  className="!h-[44px] !rounded-xl"
                />
              </div>
            )}

            <div className="relative w-full sm:w-56">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <ITInput
                placeholder="BUSCAR GUARDIA..."
                name="search"
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                onBlur={() => {}}
                className="!h-[44px] !pl-10 !rounded-xl border-slate-100 bg-white !text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300"
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

            <ITDatePicker
              label=""
              name="date"
              value={selectedDate as any}
              range
              onChange={(e) => {
                const val = e.target.value as any;
                if (Array.isArray(val) && val[0] && val[1]) {
                  setSelectedDate(val.map((d) => (d ? new Date(d) : null)));
                  setRefreshKey((prev) => prev + 1);
                }
              }}
              className="!h-[44px] !rounded-xl !w-full sm:!w-64"
            />

            <ITButton
              onClick={() => setRefreshKey((prev) => prev + 1)}
              variant="outline"
              color="secondary"
              className="!h-[44px] !rounded-xl border-slate-200"
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

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mt-6">
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

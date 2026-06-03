import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { translateScanType } from "@app/core/utils/status.utils";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITTripleFilter,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { FaBook, FaEye, FaUser } from "react-icons/fa";
import KardexDetailDialog from "../components/KardexDetailDialog";
import { getPaginatedKardex, KardexEntry } from "../services/KardexService";

const KardexPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [scanTypeFilter, setScanTypeFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState<any>([
    dayjs().tz("America/Tijuana").toDate(),
    dayjs().tz("America/Tijuana").toDate(),
  ]);
  const [viewingEntry, setViewingEntry] = useState<KardexEntry | null>(null);

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
    if (scanTypeFilter !== "ALL") {
      filters.scanType = scanTypeFilter;
    }
    return filters;
  }, [selectedDate, searchTerm, scanTypeFilter]);

  const memoizedFetch = useCallback(
    (params: any) => {
      return getPaginatedKardex({
        ...params,
        filters: { ...params.filters, ...externalFilters },
      });
    },
    [externalFilters],
  );

  const columns = useMemo(
    () => [
      {
        key: "user",
        label: "RESPONSABLE / GUARDIA",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.user?.name} {row.user?.lastName}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                @{row.user?.username || "S/U"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "location",
        label: "PUNTO DE CONTROL",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.location?.name || "UBICACIÓN DESCONOCIDA"}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                QR ESCANEADO
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "timestamp",
        label: "CRONOMETRÍA",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {dayjs(row.timestamp).format("HH:mm:ss [HRS]")}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {dayjs(row.timestamp).format("DD MMM, YYYY")}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "scanType",
        label: "CLASIFICACIÓN",
        render: (row: KardexEntry) => (
          <ITBadget
            color={
              row.scanType === "ASSIGNMENT"
                ? "success"
                : row.scanType === "RECURRING"
                  ? "warning"
                  : "primary"
            }
            size="small"
          >
            {translateScanType(row.scanType)}
          </ITBadget>
        ),
      },
      {
        key: "multimedia",
        label: "EVIDENCIA",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
              {row.media?.length || 0} Archivos
            </span>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${row.media?.length ? "bg-emerald-400" : "bg-slate-200"}`}
              />
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                {row.media?.length ? "CON MULTIMEDIA" : "SIN EVIDENCIA"}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "actions",
        label: "CONTROL",
        render: (row: KardexEntry) => (
          <ITButton
            onClick={() => setViewingEntry(row)}
            variant="outlined"
            size="small"
            color="secondary"
            title="Ver Detalle"
          >
            <FaEye size={14} />
          </ITButton>
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-6 min-h-screen font-sans">
      <ModuleHeader
        title="Expediente Kardex"
        subtitle="Registro histórico de marcajes, evidencias y reportes de campo"
        icon={FaBook}
        search={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: "BUSCAR RESPONSABLE...",
          icon: FaUser,
        }}
        extraFilter={
          <ITTripleFilter
            value={scanTypeFilter}
            onChange={(val) => {
              setScanTypeFilter(val);
              setRefreshKey((prev) => prev + 1);
            }}
            options={[
              { label: "TODOS", value: "ALL" },
              { label: "ASIGNACIÓN", value: "ASSIGNMENT" },
              { label: "RECURRENTE", value: "RECURRING" },
            ]}
          />
        }
        dateRange={{
          value: selectedDate as [Date | null, Date | null],
          onChange: (val) => {
            setSelectedDate(val);
            setRefreshKey((prev) => prev + 1);
          },
        }}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <ITDataTable<KardexEntry & Record<string, unknown>>
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
        />
        <KardexDetailDialog
          isOpen={!!viewingEntry}
          onClose={() => setViewingEntry(null)}
          entry={viewingEntry}
        />
      </div>
    </div>
  );
};

export default KardexPage;

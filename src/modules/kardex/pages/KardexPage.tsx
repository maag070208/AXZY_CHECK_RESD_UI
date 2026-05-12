import { ITMediaGrid } from "@app/core/components/ITMediaGrid";
import { ITTripleFilter } from "@app/core/components/ITTripleFilter";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { translateScanType } from "@app/core/utils/status.utils";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDatePicker,
  ITDialog,
  ITInput,
} from "@axzydev/axzy_ui_system";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import {
  FaBook,
  FaCalendarAlt,
  FaCheckCircle,
  FaEye,
  FaFileAlt,
  FaMapMarkerAlt,
  FaSync,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { GoogleMapComponent } from "../../../core/components/GoogleMapComponent";
import {
  getPaginatedKardex,
  KardexEntry,
} from "../services/KardexService";

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
        label: "Responsable",
        render: (row: KardexEntry) => (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-[10px]">
              {row.user?.name?.[0]}
              {row.user?.lastName?.[0]}
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[10px] tracking-tight line-clamp-1">
                {row.user?.name} {row.user?.lastName}
              </p>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                @{row.user?.username}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "location",
        label: "Punto de Control",
        render: (row: KardexEntry) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
              <FaMapMarkerAlt size={12} />
            </div>
            <div>
              <p className="font-black text-slate-700 uppercase text-[10px] tracking-tight">
                {row.location?.name}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "timestamp",
        label: "Cronometría",
        render: (row: KardexEntry) => (
          <div className="flex flex-col">
            <span className="text-slate-700 font-black text-[10px] uppercase tracking-tight">
              {dayjs(row.timestamp).format("HH:mm:ss [HRS]") || "00:00:00"}
            </span>
            <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">
              {dayjs(row.timestamp).format("DD MMM, YYYY")}
            </span>
          </div>
        ),
      },
      {
        key: "scanType",
        label: "Clasificación",
        render: (row: KardexEntry) => (
          <ITBadget
            color={
              row.scanType === "ASSIGNMENT"
                ? "success"
                : row.scanType === "RECURRING"
                  ? "warning"
                  : "primary"
            }
            variant="outlined"
            className="font-black text-[9px] tracking-widest !px-3"
          >
            {translateScanType(row.scanType)}
          </ITBadget>
        ),
      },
      {
        key: "multimedia",
        label: "Evidencia",
        render: (row: KardexEntry) => (
          <div className="flex items-center gap-2">
            {row.media && row.media.length > 0 ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <FaFileAlt size={10} />
                <span className="text-[10px] font-black">
                  {row.media.length}
                </span>
              </div>
            ) : (
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                Sin Archivos
              </span>
            )}
          </div>
        ),
      },
      {
        key: "actions",
        label: "Control",
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
    <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans">
      <ModuleHeader
        title="Expediente Kardex"
        subtitle="Registro histórico de marcajes, evidencias y reportes de campo"
        icon={FaBook}
        actions={
          <div className="flex flex-wrap items-center gap-3 w-full sm:justify-end">
            <div className="relative w-full sm:w-64">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <ITInput
                placeholder="BUSCAR RESPONSABLE..."
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
              className="!h-[44px] !rounded-xl border-slate-200"
            >
              <FaSync className="text-slate-400" />
            </ITButton>
          </div>
        }
      />

      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden mt-6">
        <ITDataTable<KardexEntry & Record<string, unknown>>
          key={refreshKey}
          columns={columns as any}
          fetchData={memoizedFetch as any}
          externalFilters={externalFilters}
          defaultItemsPerPage={10}
        />
      </div>

      <ITDialog
        isOpen={!!viewingEntry}
        onClose={() => setViewingEntry(null)}
        title="Detalle del Registro"
        className="!max-w-5xl !max-h-[90vh] !overflow-y-auto"
      >
        {viewingEntry && (
          <div className="p-8 space-y-10">
            {/* Header Detail */}
            <div className="flex flex-col lg:flex-row justify-between gap-8 pb-8 border-b border-slate-100">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 shadow-sm text-xl font-black uppercase">
                  {viewingEntry.user?.name?.[0]}
                  {viewingEntry.user?.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                      {viewingEntry.user?.name} {viewingEntry.user?.lastName}
                    </h2>
                    <ITBadget
                      color={
                        viewingEntry.scanType === "ASSIGNMENT"
                          ? "success"
                          : "warning"
                      }
                      variant="outlined"
                      className="font-black text-[9px] tracking-widest px-3"
                    >
                      {translateScanType(viewingEntry.scanType)}
                    </ITBadget>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="text-indigo-400" />
                      {dayjs(viewingEntry.timestamp).format("DD MMMM, YYYY")}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaSync className="text-emerald-400" />
                      {dayjs(viewingEntry.timestamp).format("HH:mm:ss [HRS]")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 h-fit self-end lg:self-center">
                {/* <ITButton
                  variant="outline"
                  className="!h-11 !px-5 !rounded-xl border-slate-100 !text-slate-400 hover:!text-rose-500 hover:!bg-rose-50"
                  onClick={handleDeleteEntry}
                  disabled={isDeleting}
                >
                  {isDeleting ? <ITLoader size="sm" /> : <FaTrash />}
                </ITButton> */}
                <ITButton
                  variant="filled"
                  onClick={() => setViewingEntry(null)}
                  className="!h-11 !px-8 !rounded-xl shadow-xl shadow-emerald-100"
                >
                  CERRAR EXPEDIENTE
                </ITButton>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Evidence & Notes */}
              <div className="lg:col-span-7 space-y-10">
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Evidencia Fotográfica
                    </h4>
                  </div>
                  {viewingEntry.media && viewingEntry.media.length > 0 ? (
                    <ITMediaGrid media={viewingEntry.media} gridSize={240} />
                  ) : (
                    <div className="py-16 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                      <FaFileAlt className="text-slate-200 text-4xl mb-4" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Sin material adjunto
                      </p>
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Reporte y Observaciones
                    </h4>
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    {viewingEntry.notes ? (
                      <div className="space-y-4">
                        {viewingEntry.notes.split("\n").map((line, i) => {
                          const trimmed = line.trim();
                          if (
                            trimmed.startsWith("[ ]") ||
                            trimmed.startsWith("[x]")
                          ) {
                            const isChecked = trimmed.startsWith("[x]");
                            return (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:border-slate-100"
                              >
                                <div
                                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] ${isChecked ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-white text-slate-200 border border-slate-100"}`}
                                >
                                  <FaCheckCircle />
                                </div>
                                <span
                                  className={`text-[11px] font-black uppercase tracking-tight ${isChecked ? "text-slate-300 line-through" : "text-slate-600"}`}
                                >
                                  {trimmed.replace(/\[.\]/, "").trim()}
                                </span>
                              </div>
                            );
                          }
                          if (trimmed.startsWith("---"))
                            return (
                              <div
                                key={i}
                                className="border-t border-slate-50 my-6"
                              />
                            );
                          if (!trimmed) return <div key={i} className="h-2" />;
                          return (
                            <p
                              key={i}
                              className="text-[12px] font-bold text-slate-600 leading-relaxed pl-4 border-l-2 border-indigo-100 italic"
                            >
                              "{trimmed}"
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          No se registraron notas adicionales
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Column: Context & Map */}
              <div className="lg:col-span-5 space-y-8">
                <section className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 space-y-8">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                      Ubicación del Evento
                    </h4>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-100 flex-shrink-0">
                        <FaMapMarkerAlt size={18} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">
                          {viewingEntry.location?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {viewingEntry.latitude && (
                    <div className="rounded-[24px] overflow-hidden border-4 border-white shadow-xl shadow-slate-200/50">
                      <GoogleMapComponent
                        lat={Number(viewingEntry.latitude)}
                        lng={Number(viewingEntry.longitude)}
                        height="280px"
                        zoom={17}
                        gestureHandling="cooperative"
                      />
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Clasificación
                      </p>
                      <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                        {translateScanType(viewingEntry.scanType)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        ID Transacción
                      </p>
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-tight truncate">
                        #{viewingEntry.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </ITDialog>
    </div>
  );
};

export default KardexPage;

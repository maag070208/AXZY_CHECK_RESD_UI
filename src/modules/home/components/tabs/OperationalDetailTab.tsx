import { useEffect, useMemo, useState } from 'react';
import {
  ITCard,
  ITDatePicker,
  ITButton,
  ITBadget,
  ITDialog,
  ITLoader,
  ITText,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import { FaSync, FaClock, FaEye, FaExclamationCircle, FaMapMarkerAlt } from 'react-icons/fa';
import * as ReportService from '../../services/ReportService';
import dayjs from 'dayjs';
import { buildShades, colorHex } from '../../utils/theme.utils';

const hexToRgba = (hex: string, alpha: number) => {
  const h = hex.replace("#", "").trim();
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ROLE_TRANSLATIONS: Record<string, string> = {
  SHIFT_GUARD: 'Jefe de Guardias',
  GUARD: 'Guardia',
  MANTENIMIENTO: 'Mantenimiento',
};

export const OperationalDetailTab = () => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf('month').toDate(),
    dayjs().endOf('month').startOf('day').toDate(),
  ]);
  const [committedDateRange, setCommittedDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf('month').toDate(),
    dayjs().endOf('month').startOf('day').toDate(),
  ]);
  const [detail, setDetail] = useState<ReportService.IGuardDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<ReportService.IGuardDetail | null>(null);
  const [breakdown, setBreakdown] = useState<ReportService.IGuardDetailBreakdown | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  const { palette } = useITTheme();
  const primaryShades = useMemo(() => buildShades(colorHex(palette, "primary")), [palette]);
  const warningShades = useMemo(() => buildShades(colorHex(palette, "warning")), [palette]);
  const dangerShades = useMemo(() => buildShades(colorHex(palette, "danger")), [palette]);
  const infoShades = useMemo(() => buildShades(colorHex(palette, "info")), [palette]);

  const roleShades: Record<string, Record<string, string>> = useMemo(() => ({
    SHIFT_GUARD: infoShades,
    GUARD: primaryShades,
    MANTENIMIENTO: warningShades,
  }), [infoShades, primaryShades, warningShades]);

  const roleBadgeColor: Record<string, "info" | "primary" | "warning"> = {
    SHIFT_GUARD: 'info',
    GUARD: 'primary',
    MANTENIMIENTO: 'warning',
  };

  const getInitials = (name: string, lastName?: string) =>
    `${name.charAt(0)}${lastName?.charAt(0) || ''}`.toUpperCase();

  const getCompliance = (item: ReportService.IGuardDetail) => {
    const total = item.totalScans + item.missedScans;
    if (total === 0) return 0;
    return Math.round((item.totalScans / total) * 100);
  };

  const getComplianceShades = (percent: number) => {
    if (percent < 50) return dangerShades;
    if (percent < 80) return warningShades;
    return primaryShades;
  };

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      setCommittedDateRange(dateRange);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [committedDateRange]);

  const fetchData = async () => {
    if (!committedDateRange[0] || !committedDateRange[1]) return;
    setLoading(true);
    const filters = {
      startDate: dayjs(committedDateRange[0]).format('YYYY-MM-DD'),
      endDate: dayjs(committedDateRange[1]).format('YYYY-MM-DD'),
    };
    const res = await ReportService.getDetailedReport(filters);
    if (res.success) {
      setDetail(
        (res.data || []).sort((a, b) => {
          const ca = getCompliance(a);
          const cb = getCompliance(b);
          if (a.totalRounds !== b.totalRounds) return b.totalRounds - a.totalRounds;
          return cb - ca;
        }),
      );
    }
    setLoading(false);
  };

  const handleViewDetail = async (guard: ReportService.IGuardDetail) => {
    setSelectedGuard(guard);
    setIsModalOpen(true);
    setLoadingBreakdown(true);
    const filters = {
      startDate: dayjs(committedDateRange[0]).format('YYYY-MM-DD'),
      endDate: dayjs(committedDateRange[1]).format('YYYY-MM-DD'),
    };
    const res = await ReportService.getGuardDetailBreakdown(guard.guardId, filters);
    if (res.success) setBreakdown(res.data || null);
    setLoadingBreakdown(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex justify-end gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 w-fit ml-auto">
        <ITDatePicker
          name="range"
          value={dateRange as any}
          range
          onChange={(e: any) => setDateRange(e.target.value)}
          className="!border-none !bg-transparent !shadow-none !p-0 px-2"
        />
        <ITButton
          onClick={fetchData}
          size="small"
          variant="filled"
          color="primary"
          className="!rounded-lg !h-9 !w-9 !p-0 flex items-center justify-center"
        >
          <FaSync className={loading ? 'animate-spin' : ''} size={12} />
        </ITButton>
      </div>

      <ITCard className="shadow-md shadow-slate-100/30 border border-slate-100 bg-white rounded-2xl overflow-hidden relative">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <ITText className="text-base font-black text-slate-800 tracking-tight block">
              Detalle Operativo
            </ITText>
            <ITText className="text-[11px] text-slate-400 font-medium mt-0.5 block">
              Rendimiento por personal operativo
            </ITText>
          </div>
          <ITBadget color="primary" variant="outlined" size="small" className="!px-3 !py-0.5 !rounded-full font-bold text-[10px]">
            {detail.length} activos
          </ITBadget>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3">
            <ITLoader size="md" />
            <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Actualizando registros...
            </ITText>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Personal</th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center w-[70px]">Rondas</th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center w-[80px]">Escaneos</th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center w-[80px]">Omitidos</th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center w-[100px]">Cumpl.</th>
                <th className="px-3 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-center w-[80px]">Efic.</th>
                <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] text-right w-[100px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {detail.map((item) => {
                const compliance = getCompliance(item);
                const shades = roleShades[item.role] || primaryShades;
                const badgeColor = roleBadgeColor[item.role] || 'primary';
                const compShades = getComplianceShades(compliance);
                const hasActivity = item.totalScans + item.missedScans > 0;

                return (
                  <tr key={item.guardId} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-[10px]"
                          style={{
                            backgroundColor: hexToRgba(shades[500], 0.12),
                            color: shades[600],
                          }}
                        >
                          {getInitials(item.name, item.lastName)}
                        </div>
                        <div className="min-w-0">
                          <ITText className="font-bold text-slate-700 text-[11px] tracking-tight truncate block">
                            {item.name} {item.lastName}
                          </ITText>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <ITBadget
                              color={badgeColor}
                              size="small"
                              variant="filled"
                              className="!text-[7px] !px-1 !py-0 !rounded font-bold uppercase border-none"
                            >
                              {ROLE_TRANSLATIONS[item.role] || item.role}
                            </ITBadget>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="font-mono text-sm font-black text-slate-600 tabular-nums">
                        {item.totalRounds}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className="font-mono text-sm font-black tabular-nums"
                        style={{ color: primaryShades[600] }}>
                        {item.totalScans}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span
                        className="font-mono text-sm font-black tabular-nums"
                        style={{ color: item.missedScans > 0 ? dangerShades[500] : 'var(--color-slate-300, #cbd5e1)' }}
                      >
                        {item.missedScans}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-10 h-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${hasActivity ? compliance : 0}%`,
                              backgroundColor: hasActivity ? compShades[500] : 'transparent',
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-black tabular-nums w-8 text-right"
                          style={{ color: hasActivity ? compShades[500] : 'var(--color-slate-300, #cbd5e1)' }}
                        >
                          {hasActivity ? `${compliance}` : '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500"
                        style={{ backgroundColor: hexToRgba(shades[50], 0.6), color: shades[600] }}
                      >
                        <FaClock size={9} />
                        {item.avgRoundTimeMinutes}m
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ITButton
                        size="small"
                        variant="outlined"
                        className="!rounded-lg !py-1.5 !px-3 !border-slate-200 !text-slate-500 hover:!bg-slate-50 hover:!border-slate-300 flex items-center gap-1.5 ml-auto !text-[10px]"
                        onClick={() => handleViewDetail(item)}
                      >
                        <FaEye size={10} />
                        <span className="font-bold uppercase tracking-wider text-[9px]">Ver</span>
                      </ITButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ITCard>

      <ITDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Historial: ${selectedGuard?.name}`}
        className="!max-w-4xl w-full"
      >
        <div className="flex flex-col h-[70vh]">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {loadingBreakdown ? (
              <div className="h-full flex flex-col items-center justify-center gap-4">
                <ITLoader size="md" />
                <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Consolidando historial...
                </ITText>
              </div>
            ) : (
              <>
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: warningShades[500] }} />
                      <ITText className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                        Rondas Incompletas
                      </ITText>
                    </div>
                    <ITBadget color="warning" variant="filled" size="small" className="!rounded-lg !text-[9px]">
                      {breakdown?.incompleteRounds.length || 0}
                    </ITBadget>
                  </div>
                  {breakdown?.incompleteRounds.length === 0 ? (
                    <div className="p-8 bg-white rounded-xl border border-slate-100 text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: primaryShades[50], color: primaryShades[500] }}>
                        <FaClock size={20} />
                      </div>
                      <ITText className="text-sm font-black text-slate-700 uppercase block">Rendimiento Perfecto</ITText>
                      <ITText className="text-[11px] text-slate-400 mt-1 block">100% de rondas completadas.</ITText>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {breakdown?.incompleteRounds.map((round) => (
                        <div key={round.roundId} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: warningShades[50], color: warningShades[500] }}>
                                <FaExclamationCircle size={14} />
                              </div>
                              <div>
                                <ITText className="text-[9px] font-black text-slate-400 tracking-widest block">#{round.roundId}</ITText>
                                <ITText className="text-xs font-black text-slate-800 uppercase block">
                                  {dayjs(round.startTime).format("DD MMM")}
                                </ITText>
                              </div>
                            </div>
                            <ITBadget color="warning" variant="outlined" size="small" className="font-black !text-[8px] !rounded-lg">CRITICO</ITBadget>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-400 uppercase flex items-center gap-1.5">
                                <FaClock size={9} className="text-slate-300" />
                                {dayjs(round.startTime).format("HH:mm")} – {dayjs(round.endTime).format("HH:mm")}
                              </span>
                            </div>
                            <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${((round.totalLocations - round.missedCount) / round.totalLocations) * 100}%`,
                                  backgroundColor: warningShades[500],
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-bold uppercase"
                              style={{ color: warningShades[600] }}>
                              <span>{round.missedCount} omitidos</span>
                              <span>{Math.round(((round.totalLocations - round.missedCount) / round.totalLocations) * 100)}% efect.</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: dangerShades[500] }} />
                      <ITText className="text-xs font-black text-slate-700 uppercase tracking-wide block">
                        Puntos Omitidos
                      </ITText>
                    </div>
                    <ITBadget color="danger" variant="filled" size="small" className="!rounded-lg !text-[9px]">
                      {breakdown?.missedPoints.length || 0}
                    </ITBadget>
                  </div>
                  {breakdown?.missedPoints.length === 0 ? (
                    <div className="p-8 bg-white rounded-xl border border-slate-100 text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ backgroundColor: primaryShades[50], color: primaryShades[500] }}>
                        <FaMapMarkerAlt size={20} />
                      </div>
                      <ITText className="text-sm font-black text-slate-700 uppercase block">Cobertura Total</ITText>
                      <ITText className="text-[11px] text-slate-400 mt-1 block">Sin puntos omitidos en el periodo.</ITText>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-50">
                            <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Ubicacion</th>
                            <th className="px-3 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Fecha</th>
                            <th className="px-4 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em] text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {breakdown?.missedPoints.map((point, index) => (
                            <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: dangerShades[50], color: dangerShades[500] }}>
                                    <FaMapMarkerAlt size={12} />
                                  </div>
                                  <div>
                                    <ITText className="font-bold text-slate-700 text-[11px] tracking-tight block">{point.locationName}</ITText>
                                    <ITText className="text-[9px] text-slate-400 font-medium tracking-wide block">Pasillo {point.aisle}</ITText>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <ITText className="font-bold text-slate-600 text-[10px] uppercase block">
                                  {dayjs(point.startTime).format("DD/MM/YY")}
                                </ITText>
                                <ITText className="text-[9px] text-slate-400 mt-0.5 block">R#{point.roundId}</ITText>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="inline-block text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-wider"
                                  style={{ backgroundColor: dangerShades[50], color: dangerShades[600] }}>
                                  Omision
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex justify-end">
            <ITButton
              variant="filled"
              color="secondary"
              onClick={() => setIsModalOpen(false)}
              className="!rounded-lg px-6 py-2 font-bold text-[10px] uppercase tracking-wider"
            >
              Cerrar
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};

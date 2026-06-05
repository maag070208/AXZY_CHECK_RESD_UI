import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITDialog, ITText } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaSearch, FaUser } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { getPaginatedResidents } from "../../residents/services/ResidentsService";
import {
  bulkAssignResidentFees,
  bulkUnassignResidentFees,
  FeeResponse,
  getFees,
  getResidentFeesByFeeId,
} from "../services/PaymentsService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkAssignFeeDialog = ({ isOpen, onClose, onSuccess }: Props) => {
  const dispatch = useDispatch();
  const [fees, setFees] = useState<FeeResponse[]>([]);
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [residents, setResidents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [originalIds, setOriginalIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const loadingFeeRef = useRef("");

  const fetchResidents = useCallback(async (search: string) => {
    const res = await getPaginatedResidents({
      page: 1,
      limit: 1000,
      filters: { search },
    });
    setResidents(res.data || []);
  }, []);

  useEffect(() => {
    if (isOpen) {
      getFees().then((res) => {
        if (res.success && res.data) setFees(res.data);
      });
      setSelectedFeeId("");
      setSelectedIds(new Set());
      setOriginalIds(new Set());
      setSearchTerm("");
      fetchResidents("");
    }
  }, [isOpen, fetchResidents]);

  const loadAssignments = useCallback(async (feeId: string) => {
    loadingFeeRef.current = feeId;
    setLoadingAssignments(true);
    const res = await getResidentFeesByFeeId(feeId);
    if (loadingFeeRef.current !== feeId) {
      setLoadingAssignments(false);
      return;
    }
    const ids = new Set<string>();
    if (res.success && res.data) {
      res.data.forEach((rf) => {
        if (rf.residentId) ids.add(rf.residentId);
      });
    }
    setSelectedIds(ids);
    setOriginalIds(new Set(ids));
    setLoadingAssignments(false);
  }, []);

  useEffect(() => {
    if (selectedFeeId) {
      loadAssignments(selectedFeeId);
    } else {
      setSelectedIds(new Set());
      setOriginalIds(new Set());
    }
  }, [selectedFeeId, loadAssignments]);

  useEffect(() => {
    const timer = setTimeout(() => fetchResidents(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchResidents]);

  const toggleResident = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === residents.length) {
      setSelectedIds(new Set(originalIds));
    } else {
      setSelectedIds(new Set(residents.map((r) => r.id)));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFeeId) return;
    setSubmitting(true);

    const selected = Array.from(selectedIds);
    const original = Array.from(originalIds);
    const toAdd = selected.filter((id) => !original.includes(id));
    const toRemove = original.filter((id) => !selected.includes(id));

    let success = true;

    if (toAdd.length > 0) {
      const res = await bulkAssignResidentFees({
        residentIds: toAdd,
        feeId: selectedFeeId,
      });
      if (!res.success) success = false;
    }

    if (toRemove.length > 0) {
      const res = await bulkUnassignResidentFees({
        residentIds: toRemove,
        feeId: selectedFeeId,
      });
      if (!res.success) success = false;
    }

    if (success) {
      dispatch(
        showToast({
          message: "Cuotas actualizadas correctamente",
          type: "success",
        }),
      );
      onSuccess();
      onClose();
    } else {
      dispatch(
        showToast({
          message: "Error al actualizar cuotas",
          type: "error",
        }),
      );
    }
    setSubmitting(false);
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Asignación Masiva de Cuotas"
    >
      <div className="p-6 space-y-5 min-w-[500px]">
        <div className="flex flex-col gap-1.5">
          <ITText className="text-xs font-medium text-slate-700">
            Seleccionar Cuota
          </ITText>
          <select
            value={selectedFeeId}
            onChange={(e) => setSelectedFeeId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 outline-none focus:border-slate-900 transition-colors"
          >
            <option value="">-- Seleccionar --</option>
            {fees.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} -{" "}
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(f.amount)}{" "}
                ({f.type === "MONTHLY" ? "Mensual" : "Único"})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <ITText className="text-xs font-medium text-slate-700">
            Buscar Residentes
          </ITText>
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-slate-900 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <ITText className="text-xs text-slate-500">
            {selectedIds.size} de {residents.length} seleccionados
          </ITText>
          <ITButton
            size="small"
            variant="ghost"
            onClick={selectAll}
            className="text-xs"
          >
            {selectedIds.size === residents.length
              ? "Deseleccionar todos"
              : "Seleccionar todos"}
          </ITButton>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {residents.map((r) => (
            <label
              key={r.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedIds.has(r.id)
                  ? "bg-emerald-50 border border-emerald-200"
                  : "hover:bg-slate-50 border border-transparent"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(r.id)}
                onChange={() => toggleResident(r.id)}
                className="w-4 h-4 accent-emerald-600"
              />
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                <FaUser size={12} />
              </div>
              <div>
                <ITText className="text-sm font-medium text-slate-900">
                  {r.user?.name} {r.user?.lastName || ""}
                </ITText>
                <ITText className="text-xs text-slate-400">
                  {r.house?.number} {r.house?.street || ""}
                </ITText>
              </div>
            </label>
          ))}
          {residents.length === 0 && (
            <ITText className="text-sm text-slate-400 text-center py-8">
              No se encontraron residentes
            </ITText>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <ITButton
            variant="outlined"
            onClick={onClose}
            className="border-slate-200 text-slate-600"
          >
            Cancelar
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={handleSubmit}            disabled={!selectedFeeId || submitting}
          >
            {submitting
              ? "Guardando..."
              : "Guardar cambios"}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};

export default BulkAssignFeeDialog;

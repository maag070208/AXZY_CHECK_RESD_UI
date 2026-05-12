import { AppState } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import {
  FaClipboardList,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  getLocations,
  Location,
} from "../../locations/service/locations.service";
import { createAssignment } from "../service/guards.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: number;
  guardName: string;
  onSuccess: () => void;
}

export const AssignmentModal = ({
  isOpen,
  onClose,
  guardId,
  guardName,
  onSuccess,
}: Props) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<
    string | number | undefined
  >(undefined);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [tasks, setTasks] = useState<{ description: string; reqPhoto: boolean }[]>(
    [],
  );
  const [tempTaskDesc, setTempTaskDesc] = useState("");

  const dispatch = useDispatch();
  const currentUser = useSelector((state: AppState) => state.auth);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedLocationId(undefined);
      setNotes("");
      setTasks([]);
      setTempTaskDesc("");
    }
  }, [isOpen]);

  const fetchData = async () => {
    const res = await getLocations();
    if (res.success && res.data) {
      setLocations(res.data);
    }
  };

  const addTask = () => {
    if (!tempTaskDesc.trim()) return;
    setTasks([...tasks, { description: tempTaskDesc, reqPhoto: false }]);
    setTempTaskDesc("");
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedLocationId) {
      dispatch(
        showToast({ message: "Selecciona una ubicación", type: "error" }),
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAssignment({
        guardId,
        locationId: Number(selectedLocationId),
        assignedBy: Number(currentUser.id) || 1,
        notes,
        tasks: tasks.length > 0 ? tasks : undefined,
      });

      if (res.success) {
        dispatch(
          showToast({
            message: "Asignación creada correctamente",
            type: "success",
          }),
        );
        onSuccess();
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "Error al crear asignación",
            type: "error",
          }),
        );
      }
    } catch (error: any) {
      dispatch(
        showToast({
          message: error.message || "Error al crear asignación",
          type: "error",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const locationOptions = locations.map((loc) => ({
    label: `${loc.name} (${loc.aisle}-${loc.number})`,
    value: loc.id,
  }));

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      className="!max-w-2xl !w-full"
    >
      <div className="p-10 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
            <FaClipboardList size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
              Asignación Especial
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Personal: {guardName}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Location Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <FaMapMarkerAlt className="text-emerald-500" /> Punto de Control
            </label>
            <ITSearchSelect
              label=""
              placeholder="BUSCAR UBICACIÓN..."
              options={locationOptions}
              value={selectedLocationId}
              onChange={(val) => setSelectedLocationId(val)}
              className="!h-14 !rounded-2xl !bg-slate-50/50"
            />
          </div>

          {/* Consignas Section */}
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FaClipboardList className="text-emerald-500" /> Consignas Especiales
              </label>
              {tasks.length > 0 && (
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase">
                  {tasks.length} {tasks.length === 1 ? "Tarea" : "Tareas"}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <ITInput
                name="tempTaskDesc"
                placeholder="DESCRIBE LA TAREA..."
                value={tempTaskDesc}
                onChange={(e) => setTempTaskDesc(e.target.value)}
                onBlur={() => {}}
                className="flex-1 !h-12 !rounded-xl !bg-white !border-slate-100 font-bold !text-[11px] uppercase tracking-wide"
              />
              <ITButton
                onClick={addTask}
                disabled={!tempTaskDesc.trim()}
                className="!w-12 !h-12 !rounded-xl shadow-lg shadow-emerald-100"
              >
                <FaPlus size={14} />
              </ITButton>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                        {index + 1}
                      </div>
                      <span className="text-[11px] text-slate-600 font-black uppercase tracking-tight">
                        {task.description}
                      </span>
                    </div>
                    <button
                      onClick={() => removeTask(index)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">
                  Sin tareas definidas
                </p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Instrucciones Adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="NOTAS U OBSERVACIONES GENERALES..."
              className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-5 py-4 text-[11px] font-black uppercase tracking-wide text-slate-600 h-28 resize-none outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-center gap-4 pt-4">
          <ITButton
            variant="ghost"
            onClick={onClose}
            className="px-10 font-black text-[10px] uppercase tracking-widest text-slate-400"
          >
            Cancelar
          </ITButton>
          <ITButton
            onClick={handleSubmit}
            disabled={!selectedLocationId || submitting}
            className="px-12 !h-14 !rounded-2xl shadow-xl shadow-emerald-100"
          >
            {submitting ? (
              <ITLoader size="sm" />
            ) : (
              <span className="font-black text-[10px] uppercase tracking-[0.2em]">
                Generar Asignación
              </span>
            )}
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};

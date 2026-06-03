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
import { FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  getLocations,
  Location,
} from "../../locations/service/locations.service";
import { createAssignment } from "../service/guards.service";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: string | number;
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
    string | undefined
  >(undefined);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [tasks, setTasks] = useState<
    { description: string; reqPhoto: boolean }[]
  >([]);
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
        locationId: selectedLocationId,
        assignedBy: currentUser.id || 1,
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
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : "Error al crear asignación";
      dispatch(
        showToast({
          message: errMsg,
          type: "error",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const locationOptions = locations.map((loc) => {
    const cleanAisle =
      loc.aisle && loc.aisle !== "null" && loc.aisle !== "undefined"
        ? loc.aisle
        : null;
    const cleanNumber =
      loc.number && loc.number !== "null" && loc.number !== "undefined"
        ? loc.number
        : null;

    const details = [
      cleanAisle ? `Pasillo ${cleanAisle}` : null,
      cleanNumber ? `No. ${cleanNumber}` : null,
    ]
      .filter(Boolean)
      .join(" - ");

    return {
      label: details ? `${loc.name} (${details})` : loc.name,
      value: loc.id,
    };
  });

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Asignación Especial"
      className="!max-w-2xl !w-full"
    >
      <div className="flex flex-col bg-white overflow-hidden max-h-[85vh]">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {/* Header Guard Card */}
          <div className="flex items-center gap-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-lg font-black uppercase">
              {guardName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Personal Asignado
              </p>
              <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                {guardName}
              </h4>
            </div>
          </div>

          {/* Punto de Control */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Punto de Control
              </h4>
            </div>
            <ITSearchSelect
              label=""
              placeholder="BUSCAR UBICACIÓN..."
              options={locationOptions}
              value={selectedLocationId}
              onChange={(val: any) => {
                setSelectedLocationId(val);
              }}
              className="!h-14 !rounded-2xl !bg-slate-50/50"
            />
          </section>

          {/* Consignas Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Consignas Especiales
                </h4>
              </div>
              {tasks.length > 0 && (
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase">
                  {tasks.length} {tasks.length === 1 ? "Tarea" : "Tareas"}
                </span>
              )}
            </div>

            <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
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
                      <ITButton
                        onClick={() => removeTask(index)}
                        variant="icon-only"
                        color="danger"
                        className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                      >
                        <FaTrash size={12} />
                      </ITButton>
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
          </section>

          {/* Notes Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Instrucciones Adicionales
              </h4>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="NOTAS U OBSERVACIONES GENERALES..."
              className="w-full bg-slate-50/50 border border-slate-100 rounded-3xl px-5 py-4 text-[11px] font-black uppercase tracking-wide text-slate-600 h-28 resize-none outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
            />
          </section>
        </div>

        {/* Standardized Footer */}
        <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            variant="ghost"
            onClick={onClose}
            className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400"
          >
            Cancelar
          </ITButton>
          <ITButton
            onClick={handleSubmit}
            disabled={!selectedLocationId || submitting}
            className="px-10 !h-12 !rounded-xl shadow-lg shadow-emerald-100"
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

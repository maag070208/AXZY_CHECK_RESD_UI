import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITLoader,
  ITSearchSelect,
  ITText,
  useITTheme,
} from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import {
  getLocations,
  Location,
} from "../../locations/service/locations.service";
import { createAssignment } from "../service/guards.service";
import { CreateAssignmentDTO } from "../types/guards.types";
import { buildShades, colorHex } from "../../home/utils/theme.utils";
import * as Yup from "yup";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  guardId: string | number;
  guardName: string;
  onSuccess: () => void;
  assignedBy: string | number;
}

export const AssignmentModal = ({
  isOpen,
  onClose,
  guardId,
  guardName,
  onSuccess,
  assignedBy,
}: Props) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [tasks, setTasks] = useState<CreateAssignmentDTO["tasks"]>([]);

  const dispatch = useDispatch();
  const { palette } = useITTheme();
  const primaryHex = colorHex(palette, "primary");
  const primaryShades = useMemo(() => buildShades(primaryHex), [primaryHex]);

  const guardInitials = guardName
    .split(" ")
    .map((n) => n[0])
    .join("");

  const formik = useFormik({
    initialValues: {
      locationId: "",
      notes: "",
      tempTask: "",
    },
    validationSchema: Yup.object({
      locationId: Yup.string().required("Selecciona una ubicacion"),
      notes: Yup.string().optional(),
      tempTask: Yup.string().optional(),
    }),
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        const payload: CreateAssignmentDTO = {
          guardId,
          locationId: values.locationId,
          assignedBy,
          notes: values.notes || undefined,
          tasks: tasks && tasks.length > 0 ? tasks : undefined,
        };

        const res = await createAssignment(payload);

        if (res.success) {
          dispatch(
            showToast({
              message: "Asignacion creada correctamente",
              type: "success",
            }),
          );
          onSuccess();
        } else {
          dispatch(
            showToast({
              message: res.messages?.[0] || "Error al crear asignacion",
              type: "error",
            }),
          );
        }
      } catch (_e) {
        dispatch(
          showToast({
            message: "Error al crear asignacion",
            type: "error",
          }),
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      formik.resetForm();
      setTasks([]);
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    const res = await getLocations();
    if (res.success && res.data) {
      setLocations(res.data);
    }
  };

  const addTask = () => {
    const desc = formik.values.tempTask.trim();
    if (!desc) return;
    setTasks([...(tasks || []), { description: desc, reqPhoto: false }]);
    formik.setFieldValue("tempTask", "");
  };

  const removeTask = (index: number) => {
    setTasks((tasks || []).filter((_, i) => i !== index));
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
      title="Asignacion Especial"
      className="!max-w-2xl !w-full"
    >
      <div className="flex flex-col bg-white overflow-hidden max-h-[85vh]">
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col h-full overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div
              className="flex items-center gap-4 p-6 rounded-3xl border border-slate-100"
              style={{ backgroundColor: primaryShades[50] }}
            >
              <div
                className="w-14 h-14 rounded-2xl text-white flex items-center justify-center text-lg font-black uppercase"
                style={{ backgroundColor: primaryShades[500] }}
              >
                {guardInitials}
              </div>
              <div>
                <ITText className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Personal Asignado
                </ITText>
                <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                  {guardName}
                </h4>
              </div>
            </div>

            <section>
              <div className="flex items-center gap-2 mb-6">
                <div
                  className="w-1.5 h-4 rounded-full"
                  style={{ backgroundColor: primaryShades[500] }}
                />
                <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Punto de Control
                </ITText>
              </div>
              <ITSearchSelect
                label=""
                placeholder="BUSCAR UBICACION..."
                options={locationOptions}
                value={formik.values.locationId}
                onChange={(val) =>
                  formik.setFieldValue("locationId", String(val))
                }
                error={
                  formik.errors.locationId
                    ? String(formik.errors.locationId)
                    : undefined
                }
                touched={!!formik.touched.locationId}
                className="!h-14 !rounded-2xl !bg-slate-50/50"
              />
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-4 rounded-full"
                    style={{ backgroundColor: primaryShades[500] }}
                  />
                  <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Consignas Especiales
                  </ITText>
                </div>
                {tasks && tasks.length > 0 && (
                  <span
                    className="text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase"
                    style={{
                      color: primaryShades[600],
                      backgroundColor: primaryShades[50],
                      borderColor: primaryShades[100],
                    }}
                  >
                    {tasks.length}{" "}
                    {tasks.length === 1 ? "Tarea" : "Tareas"}
                  </span>
                )}
              </div>

              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex gap-2">
                  <ITInput
                    name="tempTask"
                    placeholder="DESCRIBE LA TAREA..."
                    value={formik.values.tempTask}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="flex-1 !h-12 !rounded-xl !bg-white !border-slate-100 font-bold !text-[11px] uppercase tracking-wide"
                  />
                  <ITButton
                    onClick={addTask}
                    disabled={!formik.values.tempTask.trim()}
                    color="primary"
                    type="button"
                  >
                    <FaPlus size={14} />
                  </ITButton>
                </div>

                {tasks && tasks.length > 0 ? (
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
                          size="small"
                          type="button"
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

            <section>
              <div className="flex items-center gap-2 mb-6">
                <div
                  className="w-1.5 h-4 rounded-full"
                  style={{ backgroundColor: primaryShades[500] }}
                />
                <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Instrucciones Adicionales
                </ITText>
              </div>
              <ITInput
                name="notes"
                type="textarea"
                placeholder="NOTAS U OBSERVACIONES GENERALES..."
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="!rounded-3xl !bg-slate-50/50 !border-slate-100 !text-[11px] !py-4 !px-5 !h-28 font-bold uppercase tracking-wide"
              />
            </section>
          </div>

          <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
            <ITButton
              type="button"
              variant="filled"
              onClick={onClose}
              color="secondary"
            >
              Cancelar
            </ITButton>
            <ITButton
              type="submit"
              color="primary"
              disabled={!formik.values.locationId || submitting}
            >
              {submitting ? (
                <ITLoader size="sm" />
              ) : (
                "Generar Asignacion"
              )}
            </ITButton>
          </div>
        </form>
      </div>
    </ITDialog>
  );
};

import { useState, useEffect } from "react";
import { ITButton, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { FaPlus, FaTrash, FaEdit, FaTimes, FaLayerGroup } from "react-icons/fa";
import { getZones, createZone, updateZone, deleteZone, Zone } from "../services/ZonesService";
import { showToast } from "@app/core/store/toast/toast.slice";
import { showLoader, hideLoader } from "@app/core/store/loader/loader.slice";
import { useDispatch } from "react-redux";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ZonesModal = ({ isOpen, onClose }: Props) => {
  const dispatch = useDispatch();
  const [zones, setZones] = useState<Zone[]>([]);
  const [newZoneName, setNewZoneName] = useState("");
  const [editingZone, setEditingZone] = useState<Zone | null>(null);

  const fetchZones = async () => {
    try {
      const res = await getZones();
      if (res.success) {
        setZones(res.data || []);
      }
    } catch (error) {
      console.error("Error fetching zones", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchZones();
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newZoneName.trim()) return;
    dispatch(showLoader());
    try {
      await createZone({ name: newZoneName });
      setNewZoneName("");
      await fetchZones();
      dispatch(showToast({ message: "Zona registrada con éxito", type: "success" }));
    } catch (error) {
      dispatch(showToast({ message: "Error al crear", type: "error" }));
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleUpdate = async () => {
    if (!editingZone || !editingZone.name.trim()) return;
    dispatch(showLoader());
    try {
      await updateZone(editingZone.id, { name: editingZone.name });
      setEditingZone(null);
      await fetchZones();
      dispatch(showToast({ message: "Zona actualizada", type: "success" }));
    } catch (error) {
      dispatch(showToast({ message: "Error al actualizar", type: "error" }));
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este recurrente?")) return;
    dispatch(showLoader());
    try {
      await deleteZone(id);
      await fetchZones();
      dispatch(showToast({ message: "Zona eliminada", type: "success" }));
    } catch (error) {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    } finally {
      dispatch(hideLoader());
    }
  };

  return (
    <ITDialog 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Administración de Zonas / Recurrentes"
    >
      <div className="flex flex-col bg-white overflow-hidden max-h-[85vh]">
        <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
          {/* Create Section */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Nueva Zona / Recurrente
              </h4>
            </div>
            
            <div className="flex gap-4 p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <ITInput
                placeholder="Ej. Sótano 1, Ala Norte..."
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                name="newZone"
                onBlur={() => {}}
                className="flex-1 !bg-white"
              />
              <ITButton 
                onClick={handleCreate} 
                color="primary"
                disabled={!newZoneName.trim()}
                className="shadow-lg shadow-emerald-100"
              >
                <div className="flex items-center gap-2 px-2">
                  <FaPlus size={10} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Agregar</span>
                </div>
              </ITButton>
            </div>
          </section>

          {/* List Section */}
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Zonas Registradas ({zones.length})
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {zones.map((zone) => (
                <div 
                  key={zone.id} 
                  className={`group flex items-center justify-between p-5 rounded-2xl border transition-all ${
                    editingZone?.id === zone.id 
                      ? "border-emerald-500 bg-emerald-50/20 shadow-sm" 
                      : "border-slate-100 bg-white hover:border-slate-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-xl transition-colors ${
                      editingZone?.id === zone.id ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <FaLayerGroup size={14} />
                    </div>
                    
                    {editingZone?.id === zone.id ? (
                      <input
                        type="text"
                        value={editingZone.name}
                        onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                        className="flex-1 bg-transparent border-b-2 border-emerald-500 text-sm font-black text-slate-700 outline-none py-1 uppercase tracking-tight"
                        autoFocus
                      />
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-tight">
                          {zone.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className={`w-1 h-1 rounded-full ${zone.active ? "bg-emerald-400" : "bg-slate-300"}`} />
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            {zone.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {editingZone?.id === zone.id ? (
                      <>
                        <ITButton 
                          size="small" 
                          variant="ghost" 
                          className="!text-emerald-600 !p-2" 
                          onClick={handleUpdate}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest px-2">Guardar</span>
                        </ITButton>
                        <button 
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors" 
                          onClick={() => setEditingZone(null)}
                        >
                          <FaTimes size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <ITButton 
                          size="small" 
                          variant="outlined" 
                          className="!border-slate-100 hover:!border-slate-300" 
                          onClick={() => setEditingZone(zone)}
                        >
                          <FaEdit size={12} className="text-slate-400" />
                        </ITButton>
                        <ITButton 
                          size="small" 
                          variant="outlined" 
                          color="danger"
                          className="!border-slate-100 hover:!border-red-200" 
                          onClick={() => handleDelete(zone.id)}
                        >
                          <FaTrash size={12} />
                        </ITButton>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {zones.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-4 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200">
                  <FaLayerGroup size={40} className="opacity-20" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sin zonas registradas</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </ITDialog>
  );
};

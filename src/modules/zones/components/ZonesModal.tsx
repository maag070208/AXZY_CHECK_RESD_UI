import { useState, useEffect } from "react";
import { ITButton, ITDialog, ITInput } from "@axzydev/axzy_ui_system";
import { FaPlus, FaTrash, FaEdit, FaTimes } from "react-icons/fa";
import { getZonesByClient, createZone, updateZone, deleteZone, Zone } from "../services/ZonesService";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useDispatch } from "react-redux";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
    clientName: string;
}

export const ZonesModal = ({ isOpen, onClose, clientId, clientName }: Props) => {
    const dispatch = useDispatch();
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(false);
    const [newZoneName, setNewZoneName] = useState("");
    const [editingZone, setEditingZone] = useState<Zone | null>(null);

    const fetchZones = async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const data = await getZonesByClient(clientId);
            setZones(data);
        } catch (error) {
            console.error("Error fetching zones", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && clientId) {
            fetchZones();
        }
    }, [isOpen, clientId]);

    const handleCreate = async () => {
        if (!newZoneName.trim()) return;
        try {
            await createZone({ clientId, name: newZoneName });
            setNewZoneName("");
            fetchZones();
            dispatch(showToast({ message: "Recurrente creado", type: "success" }));
        } catch (error) {
            dispatch(showToast({ message: "Error al crear", type: "error" }));
        }
    };

    const handleUpdate = async () => {
        if (!editingZone || !editingZone.name.trim()) return;
        try {
            await updateZone(editingZone.id, { name: editingZone.name });
            setEditingZone(null);
            fetchZones();
            dispatch(showToast({ message: "Recurrente actualizado", type: "success" }));
        } catch (error) {
            dispatch(showToast({ message: "Error al actualizar", type: "error" }));
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Estás seguro de eliminar este recurrente?")) return;
        try {
            await deleteZone(id);
            fetchZones();
            dispatch(showToast({ message: "Recurrente eliminado", type: "success" }));
        } catch (error) {
            dispatch(showToast({ message: "Error al eliminar", type: "error" }));
        }
    };

    return (
        <ITDialog isOpen={isOpen} onClose={onClose} title={`Administrar Zonas - ${clientName}`}>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                    <ITInput
                        placeholder="Nombre del nuevo recurrente (ej: BAJA, NIVEL 1)"
                        value={newZoneName}
                        onChange={(e) => setNewZoneName(e.target.value)}
                        name="newZone"
                        onBlur={() => {}}
                        className="flex-1"
                    />
                    <ITButton onClick={handleCreate} className="bg-emerald-600 text-white w-full sm:w-auto flex justify-center items-center">
                        <FaPlus className="sm:mr-2" /> 
                        <span className="sm:hidden font-bold">Agregar Recurrente</span>
                    </ITButton>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {zones.map((zone) => (
                                <tr key={zone.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3">
                                        {editingZone?.id === zone.id ? (
                                            <input
                                                type="text"
                                                value={editingZone.name}
                                                onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                                                className="w-full px-2 py-1 border border-emerald-500 rounded outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-medium text-slate-700">{zone.name}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            {editingZone?.id === zone.id ? (
                                                <>
                                                    <ITButton size="small" variant="ghost" className="text-emerald-600" onClick={handleUpdate}>
                                                        Guardar
                                                    </ITButton>
                                                    <ITButton size="small" variant="ghost" className="text-slate-400" onClick={() => setEditingZone(null)}>
                                                        <FaTimes />
                                                    </ITButton>
                                                </>
                                            ) : (
                                                <>
                                                    <ITButton size="small" variant="ghost" className="text-slate-400" onClick={() => setEditingZone(zone)}>
                                                        <FaEdit />
                                                    </ITButton>
                                                    <ITButton size="small" variant="ghost" className="text-red-300 hover:text-red-500" onClick={() => handleDelete(zone.id)}>
                                                        <FaTrash />
                                                    </ITButton>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {zones.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">
                                        No hay Zonas registrados para este cliente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </ITDialog>
    );
};

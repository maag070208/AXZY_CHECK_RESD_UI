import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITInput,
  ITTabs,
  ITTabItem,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import { CirclePicker } from "react-color";
import {
  FaCogs,
  FaEdit,
  FaGlobe,
  FaLayerGroup,
  FaPlus,
  FaTags,
  FaTrash,
} from "react-icons/fa";
import {
  MdAccessTime,
  MdBuild,
  MdCameraAlt,
  MdCleaningServices,
  MdComment,
  MdDescription,
  MdDirectionsCar,
  MdError,
  MdFlashOn,
  MdMedicalServices,
  MdPeople,
  MdPerson,
  MdPlace,
  MdShield,
  MdVideocam,
  MdWaterDrop,
  MdWhatshot,
} from "react-icons/md";
import { useDispatch } from "react-redux";
import * as SettingsService from "../services/SettingsService";

const COMMON_ICONS = [
  { name: "shield-alert", icon: <MdShield /> },
  { name: "account-group", icon: <MdPeople /> },
  { name: "alert-circle", icon: <MdError /> },
  { name: "shield-check", icon: <MdShield /> },
  { name: "fire", icon: <MdWhatshot /> },
  { name: "water", icon: <MdWaterDrop /> },
  { name: "flash", icon: <MdFlashOn /> },
  { name: "account-alert", icon: <MdPerson /> },
  { name: "cctv", icon: <MdVideocam /> },
  { name: "car-emergency", icon: <MdDirectionsCar /> },
  { name: "medical-bag", icon: <MdMedicalServices /> },
  { name: "tools", icon: <MdBuild /> },
  { name: "broom", icon: <MdCleaningServices /> },
  { name: "clock-outline", icon: <MdAccessTime /> },
  { name: "map-marker", icon: <MdPlace /> },
  { name: "camera", icon: <MdCameraAlt /> },
  { name: "file-document", icon: <MdDescription /> },
  { name: "comment-text", icon: <MdComment /> },
];

const SettingsPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<
    "CATEGORIES" | "TYPES" | "SYSCONFIG"
  >("CATEGORIES");
  const [refreshKey, setRefreshKey] = useState(0);

  // Search Filters
  const [searchCat, setSearchCat] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchConfig, setSearchConfig] = useState("");

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryTypes, setCategoryTypes] = useState<any[]>([]);
  const [isAddingSubtype, setIsAddingSubtype] = useState(false);
  const [newSubtypeForm, setNewSubtypeForm] = useState({ name: "", value: "" });

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  // Form States
  const [categoryForm, setCategoryForm] = useState<any>({
    name: "",
    value: "",
    type: "INCIDENT",
    color: "",
    icon: "alert-circle",
  });
  const [typeForm, setTypeForm] = useState<any>({
    categoryId: "",
    name: "",
    value: "",
  });
  const [configForm, setConfigForm] = useState<any>({ key: "", value: "" });
  
  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "type" | "config" | "subtype";
    id: any;
  } | null>(null);

  // Open Modal Handlers
  const openCategoryModal = (cat: any = null) => {
    setEditingCategory(cat);
    setCategoryForm(
      cat || {
        name: "",
        value: "",
        type: "INCIDENT",
        color: "",
        icon: "alert-circle",
      },
    );
    setIsCategoryModalOpen(true);
    setIsAddingSubtype(false);
  };

  const openTypeModal = (type: any = null) => {
    setEditingType(type);
    setTypeForm(
      type || {
        categoryId: categoriesCatalog?.[0]?.id || "",
        name: "",
        value: "",
      },
    );
    setIsTypeModalOpen(true);
  };

  const openConfigModal = (config: any = null) => {
    setEditingConfig(config);
    setConfigForm(config || { key: "", value: "" });
    setIsConfigModalOpen(true);
  };

  const { data: categoriesCatalog, refresh: refreshCatalog } =
    useCatalog("incident_category");

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
    refreshCatalog();
  };

  // Sub-types fetcher
  useEffect(() => {
    if (editingCategory) {
      fetchCategorySubtypes();
    } else {
      setCategoryTypes([]);
    }
  }, [editingCategory]);

  const fetchCategorySubtypes = async () => {
    if (!editingCategory) return;
    const res = await SettingsService.getPaginatedIncidentTypes({
      filters: { categoryId: editingCategory.id },
      limit: 100,
      page: 1,
    });
    setCategoryTypes(res.data);
  };

  const handleAddSubtype = async (e: any) => {
    e.preventDefault();
    try {
      await SettingsService.createIncidentType({
        categoryId: editingCategory.id,
        ...newSubtypeForm,
      });
      dispatch(showToast({ message: "Sub-tipo agregado", type: "success" }));
      setNewSubtypeForm({ name: "", value: "" });
      setIsAddingSubtype(false);
      fetchCategorySubtypes();
      refresh();
    } catch (err) {
      dispatch(
        showToast({ message: "Error al agregar sub-tipo", type: "error" }),
      );
    }
  };

  const [subtypeToDelete, setSubtypeToDelete] = useState<number | null>(null);

  const handleDeleteSubtype = (id: number) => {
    setSubtypeToDelete(id);
  };

  const confirmDeleteSubtype = async () => {
    if (subtypeToDelete === null) return;
    try {
      await SettingsService.deleteIncidentType(subtypeToDelete);
      dispatch(showToast({ message: "Sub-tipo eliminado", type: "success" }));
      fetchCategorySubtypes();
      refresh();
    } catch (err) {
      dispatch(showToast({ message: "Error al eliminar", type: "error" }));
    }
    setSubtypeToDelete(null);
  };

  // CATEGORIES
  const fetchCategories = useCallback(
    (params: any) => {
      const p = {
        ...params,
        filters: { ...params.filters, search: searchCat },
      };
      return SettingsService.getPaginatedIncidentCategories(p);
    },
    [searchCat],
  );

  const handleSaveCategory = async (e: any) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await SettingsService.updateIncidentCategory(
          editingCategory.id,
          categoryForm,
        );
        dispatch(
          showToast({ message: "Categoría actualizada", type: "success" }),
        );
      } else {
        await SettingsService.createIncidentCategory(categoryForm);
        dispatch(showToast({ message: "Categoría creada", type: "success" }));
      }
      setIsCategoryModalOpen(false);
      refresh();
    } catch (err: any) {
      dispatch(
        showToast({
          message: err.response?.data?.messages?.[0] || "Error al guardar",
          type: "error",
        }),
      );
    }
  };

  // TYPES
  const fetchTypes = useCallback(
    (params: any) => {
      const p = {
        ...params,
        filters: { ...params.filters, search: searchType },
      };
      return SettingsService.getPaginatedIncidentTypes(p);
    },
    [searchType],
  );

  const handleSaveType = async (e: any) => {
    e.preventDefault();
    try {
      const data = { ...typeForm, categoryId: Number(typeForm.categoryId) };
      if (editingType) {
        await SettingsService.updateIncidentType(editingType.id, data);
        dispatch(showToast({ message: "Tipo actualizado", type: "success" }));
      } else {
        await SettingsService.createIncidentType(data);
        dispatch(showToast({ message: "Tipo creado", type: "success" }));
      }
      setIsTypeModalOpen(false);
      refresh();
    } catch (err: any) {
      dispatch(
        showToast({
          message: err.response?.data?.messages?.[0] || "Error al guardar",
          type: "error",
        }),
      );
    }
  };

  // SYSCONFIG
  const fetchSysConfig = useCallback(
    (params: any) => {
      const p = {
        ...params,
        filters: { ...params.filters, search: searchConfig },
      };
      return SettingsService.getPaginatedSysConfig(p);
    },
    [searchConfig],
  );

  const handleSaveConfig = async (e: any) => {
    e.preventDefault();
    try {
      await SettingsService.updateSysConfig(configForm.key, configForm.value);
      dispatch(
        showToast({ message: "Configuración guardada", type: "success" }),
      );
      setIsConfigModalOpen(false);
      refresh();
    } catch (err: any) {
      dispatch(
        showToast({
          message: err.response?.data?.messages?.[0] || "Error al guardar",
          type: "error",
        }),
      );
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => refresh(), 500);
    return () => clearTimeout(timer);
  }, [searchCat, searchType, searchConfig]);

  // Tab configuration
  const tabs: ITTabItem[] = [
    {
      id: "CATEGORIES",
      label: "Categorías",
      icon: <FaLayerGroup />,
      content: (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <ITDataTable
            key={`cat-${refreshKey}`}
            fetchData={fetchCategories as any}
            columns={[
              {
                key: "name",
                label: "IDENTIFICACIÓN / VALOR",
                type: "string",
                render: (row: any) => (
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                      {row.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                        VALOR: {row.value}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "type",
                label: "CLASIFICACIÓN",
                type: "string",
                render: (row: any) => (
                  <ITBadget
                    color={row.type === "INCIDENT" ? "warning" : "info"}
                    size="small"
                  >
                    {row.type === "INCIDENT" ? "INCIDENTE" : "MANTENIMIENTO"}
                  </ITBadget>
                ),
              },
              {
                key: "actions",
                label: "CONTROL",
                type: "actions",
                actions: (row: any) => (
                  <div className="flex items-center gap-2">
                    <ITButton
                      size="small"
                      variant="outlined"
                      onClick={() => openCategoryModal(row)}
                      title="Editar"
                    >
                      <FaEdit size={14} />
                    </ITButton>
                    <ITButton
                      size="small"
                      variant="outlined"
                      color="danger"
                      onClick={() => setDeleteTarget({ type: "category", id: row.id })}
                      title="Eliminar"
                    >
                      <FaTrash size={14} />
                    </ITButton>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      id: "TYPES",
      label: "Tipos de Incidentes",
      icon: <FaTags />,
      content: (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <ITDataTable
            key={`type-${refreshKey}`}
            fetchData={fetchTypes as any}
            columns={[
              {
                key: "name",
                label: "TIPO / CATEGORÍA",
                type: "string",
                render: (row: any) => (
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                      {row.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                        CAT: {row.category?.name || "SIN CATEGORÍA"}
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "actions",
                label: "CONTROL",
                type: "actions",
                actions: (row: any) => (
                  <div className="flex items-center gap-2">
                    <ITButton
                      size="small"
                      variant="outlined"
                      onClick={() => openTypeModal(row)}
                      title="Editar"
                    >
                      <FaEdit size={14} />
                    </ITButton>
                    <ITButton
                      size="small"
                      variant="outlined"
                      color="danger"
                      onClick={() => setDeleteTarget({ type: "type", id: row.id })}
                      title="Eliminar"
                    >
                      <FaTrash size={14} />
                    </ITButton>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ),
    },
    {
      id: "SYSCONFIG",
      label: "Configuración Global",
      icon: <FaGlobe />,
      content: (
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <ITDataTable
            key={`sys-${refreshKey}`}
            fetchData={fetchSysConfig as any}
            columns={[
              {
                key: "key",
                label: "PARÁMETRO / CLAVE",
                type: "string",
                render: (row: any) => (
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1">
                      {row.key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">
                        CONFIGURACIÓN INTERNA
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                key: "value",
                label: "VALOR ACTUAL",
                type: "string",
                render: (row: any) => (
                  <code className="bg-slate-50 px-2.5 py-1.5 rounded-lg text-emerald-600 text-[11px] font-bold border border-slate-100">
                    {row.value}
                  </code>
                ),
              },
              {
                key: "actions",
                label: "CONTROL",
                type: "actions",
                actions: (row: any) => (
                  <div className="flex items-center gap-2">
                    <ITButton
                      size="small"
                      variant="outlined"
                      onClick={() => openConfigModal(row)}
                      title="Editar"
                    >
                      <FaEdit size={14} />
                    </ITButton>
                    <ITButton
                      size="small"
                      variant="outlined"
                      color="danger"
                      onClick={() => setDeleteTarget({ type: "config", id: row.key })}
                      title="Eliminar"
                    >
                      <FaTrash size={14} />
                    </ITButton>
                  </div>
                ),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-10 min-h-screen bg-slate-50/50">
      <ModuleHeader
        title="Configuración del Sistema"
        subtitle="Administración de catálogos y parámetros globales"
        icon={FaCogs}
        search={{
          value:
            activeTab === "CATEGORIES"
              ? searchCat
              : activeTab === "TYPES"
                ? searchType
                : searchConfig,
          onChange: (val) => {
            if (activeTab === "CATEGORIES") setSearchCat(val);
            else if (activeTab === "TYPES") setSearchType(val);
            else setSearchConfig(val);
          },
          placeholder: "BUSCAR...",
        }}
        onRefresh={() => setRefreshKey((p) => p + 1)}
        refreshKey={refreshKey}
        onCreate={() => {
          if (activeTab === "CATEGORIES") openCategoryModal();
          else if (activeTab === "TYPES") openTypeModal();
          else openConfigModal();
        }}
        createLabel="Agregar"
      />

      <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-slate-200/40 border border-white">
        <ITTabs
          items={tabs}
          defaultActiveId={activeTab}
          onChange={(id: string) => setActiveTab(id as any)}
        />
      </div>

      {/* Modals Improvements */}
      <ITDialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
        className="!w-full !max-w-4xl"
      >
        <div className="flex flex-col h-[650px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-hidden flex-1">
            {/* Form Left Side */}
            <div className="space-y-6 border-r border-slate-100 pr-6 overflow-y-auto custom-scrollbar pb-6">
              <ITInput
                label="Nombre Interno (Mayúsculas)"
                name="name"
                value={categoryForm.name}
                onChange={(e: any) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                onBlur={() => {}}
                placeholder="EJ: SEGURIDAD"
                required
              />
              <ITInput
                label="Valor (Nombre a mostrar)"
                name="value"
                value={categoryForm.value}
                onChange={(e: any) =>
                  setCategoryForm({ ...categoryForm, value: e.target.value })
                }
                onBlur={() => {}}
                placeholder="EJ: Seguridad"
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tipo de Aplicación
                </label>
                <select
                  name="type"
                  className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm font-bold text-slate-700"
                  value={categoryForm.type}
                  onChange={(e: any) =>
                    setCategoryForm({ ...categoryForm, type: e.target.value })
                  }
                >
                  <option value="INCIDENT">Incidente</option>
                  <option value="MAINTENANCE">Mantenimiento</option>
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ícono (App Móvil)
                </label>
                <div className="grid grid-cols-8 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                  {COMMON_ICONS.map((ico) => (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() =>
                        setCategoryForm({ ...categoryForm, icon: ico.name })
                      }
                      className={`flex items-center justify-center p-2 rounded-xl transition-all ${categoryForm.icon === ico.name ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 border border-slate-100"}`}
                      title={ico.name}
                    >
                      <span className="text-xl">{ico.icon}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Seleccionado:
                  </span>
                  <code className="text-xs font-black text-emerald-600">
                    {categoryForm.icon || "alert-circle"}
                  </code>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Color de la Categoría
                </label>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-center shadow-inner">
                  <CirclePicker
                    color={categoryForm.color}
                    onChangeComplete={(color) =>
                      setCategoryForm({ ...categoryForm, color: color.hex })
                    }
                    width="100%"
                    circleSize={26}
                    circleSpacing={14}
                  />
                </div>
              </div>
            </div>

            {/* Sub-types Right Side (Only when editing) */}
            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 pb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FaTags className="text-emerald-600" />
                  Sub-tipos Asociados
                </h3>
                {editingCategory && !isAddingSubtype && (
                  <ITButton
                    size="small"
                    variant="outlined"
                    onClick={() => setIsAddingSubtype(true)}
                    className="text-emerald-600 font-bold text-xs p-1"
                  >
                    <FaPlus />
                  </ITButton>
                )}
              </div>

              {!editingCategory ? (
                <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <FaLayerGroup className="text-slate-200 text-4xl mb-3" />
                  <p className="text-slate-400 text-sm">
                    Crea la categoría primero para gestionar sus sub-tipos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {isAddingSubtype && (
                    <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <form onSubmit={handleAddSubtype} className="space-y-3">
                        <ITInput
                          label="Nombre del Sub-tipo"
                          name="st_name"
                          value={newSubtypeForm.name}
                          onChange={(e: any) =>
                            setNewSubtypeForm({
                              ...newSubtypeForm,
                              name: e.target.value,
                            })
                          }
                          onBlur={() => {}}
                          required
                        />
                        <ITInput
                          label="Valor/Código"
                          name="st_value"
                          value={newSubtypeForm.value}
                          onChange={(e: any) =>
                            setNewSubtypeForm({
                              ...newSubtypeForm,
                              value: e.target.value,
                            })
                          }
                          onBlur={() => {}}
                          required
                        />
                        <div className="flex justify-end gap-2">
                          <ITButton
                            type="button"
                            size="small"
                            variant="ghost"
                            onClick={() => setIsAddingSubtype(false)}
                          >
                            Cancelar
                          </ITButton>
                          <ITButton
                            type="submit"
                            size="small"
                            color="primary"
                            className="rounded-xl"
                          >
                            Confirmar
                          </ITButton>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="pr-2 space-y-2">
                    {categoryTypes.length === 0 && !isAddingSubtype ? (
                      <p className="text-slate-400 text-xs italic text-center py-4">
                        No hay sub-tipos registrados.
                      </p>
                    ) : (
                      categoryTypes.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl group hover:border-emerald-200 transition-all shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {t.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400">
                              {t.value}
                            </p>
                          </div>
                          <ITButton
                            size="small"
                            variant="outlined"
                            onClick={() => handleDeleteSubtype(t.id)}
                            color="danger"
                          >
                            <FaTrash size={12} />
                          </ITButton>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Action Footer outside of scrollable columns */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
            <ITButton
              type="button"
              variant="outlined"
              onClick={() => setIsCategoryModalOpen(false)}
              className="rounded-2xl font-bold border-slate-200 h-[46px] px-8 bg-white"
            >
              Cancelar
            </ITButton>
            <ITButton
              onClick={handleSaveCategory as any}
              color="primary"
              className="rounded-2xl font-bold px-10 shadow-xl shadow-emerald-100/50 h-[46px]"
            >
              Guardar Cambios
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Type Modal */}
      <ITDialog
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title={editingType ? "Editar Tipo" : "Nuevo Tipo"}
      >
        <form onSubmit={handleSaveType} className="p-6 space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Categoría Padre
            </label>
            <select
              name="categoryId"
              className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm font-bold text-slate-700"
              value={typeForm.categoryId}
              onChange={(e: any) =>
                setTypeForm({ ...typeForm, categoryId: e.target.value })
              }
              required
            >
              <option value="">Selecciona categoría</option>
              {(categoriesCatalog || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <ITInput
            label="Nombre del Tipo"
            name="name"
            value={typeForm.name}
            onChange={(e: any) =>
              setTypeForm({ ...typeForm, name: e.target.value })
            }
            onBlur={() => {}}
            required
          />
          <ITInput
            label="Valor (Símbolo)"
            name="value"
            value={typeForm.value}
            onChange={(e: any) =>
              setTypeForm({ ...typeForm, value: e.target.value })
            }
            onBlur={() => {}}
            required
          />
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <ITButton
              type="button"
              variant="outlined"
              onClick={() => setIsTypeModalOpen(false)}
              className="rounded-2xl font-bold border-slate-200"
            >
              Cancelar
            </ITButton>
            <ITButton
              type="submit"
              color="primary"
              className="rounded-2xl font-bold px-8 shadow-xl shadow-emerald-100/50"
            >
              Guardar Tipo
            </ITButton>
          </div>
        </form>
      </ITDialog>

      {/* Config Modal */}
      <ITDialog
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title={editingConfig ? "Editar Parámetro" : "Nuevo Parámetro"}
      >
        <form onSubmit={handleSaveConfig} className="p-6 space-y-5">
          <ITInput
            label="Clave del Sistema"
            name="key"
            value={configForm.key}
            onChange={(e: any) =>
              setConfigForm({ ...configForm, key: e.target.value })
            }
            onBlur={() => {}}
            required
            readOnly={!!editingConfig}
          />
          <ITInput
            label="Valor Configurado"
            name="value"
            value={configForm.value}
            onChange={(e: any) =>
              setConfigForm({ ...configForm, value: e.target.value })
            }
            onBlur={() => {}}
            required
          />
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <ITButton
              type="button"
              variant="outlined"
              onClick={() => setIsConfigModalOpen(false)}
              className="rounded-2xl font-bold border-slate-200"
            >
              Cancelar
            </ITButton>
            <ITButton
              type="submit"
              color="primary"
              className="rounded-2xl font-bold px-8 shadow-xl shadow-emerald-100/50"
            >
              Guardar Parámetro
            </ITButton>
          </div>
        </form>
      </ITDialog>

      {/* Delete Confirm Dialog - Categories */}
      <ITDialog
        isOpen={deleteTarget?.type === "category"}
        onClose={() => setDeleteTarget(null)}
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Categoría?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción es permanente y no se puede deshacer.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={async () => {
                if (!deleteTarget) return;
                await SettingsService.deleteIncidentCategory(deleteTarget.id);
                refresh();
                setDeleteTarget(null);
              }}
            >
              ELIMINAR AHORA
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Delete Confirm Dialog - Types */}
      <ITDialog
        isOpen={deleteTarget?.type === "type"}
        onClose={() => setDeleteTarget(null)}
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Tipo de Incidente?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción es permanente y no se puede deshacer.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={async () => {
                if (!deleteTarget) return;
                await SettingsService.deleteIncidentType(deleteTarget.id);
                refresh();
                setDeleteTarget(null);
              }}
            >
              ELIMINAR AHORA
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Delete Confirm Dialog - Config */}
      <ITDialog
        isOpen={deleteTarget?.type === "config"}
        onClose={() => setDeleteTarget(null)}
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Configuración?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción es permanente y no se puede deshacer.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setDeleteTarget(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={async () => {
                if (!deleteTarget) return;
                await SettingsService.deleteSysConfig(deleteTarget.id);
                refresh();
                setDeleteTarget(null);
              }}
            >
              ELIMINAR AHORA
            </ITButton>
          </div>
        </div>
      </ITDialog>

      {/* Delete Confirm Dialog - Subtypes */}
      <ITDialog
        isOpen={subtypeToDelete !== null}
        onClose={() => setSubtypeToDelete(null)}
      >
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
            <FaTrash size={32} />
          </div>
          <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">
            ¿Eliminar Sub-tipo?
          </ITText>
          <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
            Esta acción es permanente y no se puede deshacer.
          </ITText>
          <div className="flex gap-4 justify-center">
            <ITButton
              variant="ghost"
              className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400"
              onClick={() => setSubtypeToDelete(null)}
            >
              Cancelar
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              className="px-10 !rounded-2xl shadow-xl shadow-rose-200"
              onClick={confirmDeleteSubtype}
            >
              ELIMINAR AHORA
            </ITButton>
          </div>
        </div>
      </ITDialog>
    </div>
  );
};
export default SettingsPage;

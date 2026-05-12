export const ASSIGNMENT_STATUS = {
    PENDING: "PENDING",
    CHECKING: "CHECKING",
    UNDER_REVIEW: "UNDER_REVIEW",
    REVIEWED: "REVIEWED",
    COMPLETED: "COMPLETED",
    ANOMALY: "ANOMALY",
    CANCELLED: "CANCELLED",
    ACTIVE: "ACTIVE", // Added to overlap if needed, or used as a logic flag
} as const;

export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
    [ASSIGNMENT_STATUS.PENDING]: "Pendiente",
    [ASSIGNMENT_STATUS.CHECKING]: "En Proceso",
    [ASSIGNMENT_STATUS.UNDER_REVIEW]: "Bajo Revisión",
    [ASSIGNMENT_STATUS.REVIEWED]: "Revisado",
    [ASSIGNMENT_STATUS.COMPLETED]: "Finalizado",
    [ASSIGNMENT_STATUS.ANOMALY]: "Anomalía",
    [ASSIGNMENT_STATUS.CANCELLED]: "Cancelado",
    [ASSIGNMENT_STATUS.ACTIVE]: "Activo",
};

export const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
    [ASSIGNMENT_STATUS.PENDING]: "bg-slate-100 text-slate-600",
    [ASSIGNMENT_STATUS.CHECKING]: "bg-blue-100 text-blue-700",
    [ASSIGNMENT_STATUS.ACTIVE]: "bg-emerald-100 text-emerald-700",
    [ASSIGNMENT_STATUS.COMPLETED]: "bg-slate-100 text-slate-500",
    [ASSIGNMENT_STATUS.CANCELLED]: "bg-red-100 text-red-700",
};

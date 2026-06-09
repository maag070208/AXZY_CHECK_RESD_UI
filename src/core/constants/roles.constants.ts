export const ROLE_ADMIN = 'ADMIN';
export const ROLE_LIDER = 'LIDER';
export const ROLE_SHIFT = 'SHIFT';
export const ROLE_GUARD = 'GUARD';
export const ROLE_MAINT = 'MAINT';
export const ROLE_RESDN = 'RESDN';

export const ROLES_ADMIN = [ROLE_ADMIN, ROLE_LIDER] as const;
export const ROLES_ADMIN_SHIFT = [ROLE_ADMIN, ROLE_LIDER, ROLE_SHIFT] as const;
export const ROLES_ADMIN_SHIFT_RESDN = [ROLE_ADMIN, ROLE_LIDER, ROLE_SHIFT, ROLE_RESDN] as const;

export const ROLE_ALL = [ROLE_ADMIN, ROLE_LIDER, ROLE_SHIFT, ROLE_GUARD, ROLE_MAINT, ROLE_RESDN] as const;

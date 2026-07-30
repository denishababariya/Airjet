export const normalizeRole = (role) => String(role || '').trim().toLowerCase();

export const isAdminRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'super admin';
};

export const isManagerRole = (role) => normalizeRole(role).includes('manager');

export const isHeadRole = (role) => normalizeRole(role).includes('head');

export const isHRRole = (role) => normalizeRole(role) === 'hr' || normalizeRole(role).includes('hr');

export const canTakeAttendance = (role) =>
  isAdminRole(role) || isManagerRole(role) || isHeadRole(role);

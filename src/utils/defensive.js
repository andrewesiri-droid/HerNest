// Defensive data access — prevents all undefined crashes
export const safe = (val, fallback = []) => {
  if (val === null || val === undefined) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return fallback;
  return fallback;
};

export const safeObj = (val, fallback = {}) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object' && !Array.isArray(val)) return val;
  return fallback;
};

export const num = (val, fallback = 0) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return Number(val.value || val.score || fallback);
  return Number(val) || fallback;
};

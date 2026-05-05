
// HerNest Quiet Mode
// "I can't deal with anything" → silence everything for 24 hours

const QUIET_KEY = "hn_quiet_until";

export function setQuietMode(hours = 24) {
  const until = Date.now() + hours * 60 * 60 * 1000;
  try { localStorage.setItem(QUIET_KEY, String(until)); } catch(e) {}
}

export function isQuietMode() {
  try {
    const until = parseInt(localStorage.getItem(QUIET_KEY) || "0");
    return Date.now() < until;
  } catch(e) { return false; }
}

export function clearQuietMode() {
  try { localStorage.removeItem(QUIET_KEY); } catch(e) {}
}

export function quietModeEndsIn() {
  try {
    const until = parseInt(localStorage.getItem(QUIET_KEY) || "0");
    const ms = until - Date.now();
    if (ms <= 0) return null;
    const hours = Math.ceil(ms / (1000 * 60 * 60));
    return hours;
  } catch(e) { return null; }
}

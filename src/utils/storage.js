// ─── HerNest localStorage Key Registry ───────────────────────────
// Single source of truth for all localStorage/sessionStorage keys.
// Never use raw strings like "hn_tasks" anywhere else in the codebase.

export const STORAGE_KEYS = {
  // Auth
  UID:              "hn_uid",
  GTOKEN:           "hn_gtoken",         // sessionStorage only

  // App state
  APP_CONTEXT:      "hn_app_context",
  STREAK:           "hn_streak",
  ONBOARDING_STEP:  "hn_ob_step",

  // Nora
  NORA_MSGS:        "hn_nora_msgs",      // sessionStorage only
  NORA_MEMORY:      "hn_nora_memory_v2",
  NORA_MEMORY_OLD:  "hn_nora_memory",    // legacy
  DEBRIEF_CHAT:     "hn_debrief_chat",

  // Wellness
  WATER:            "hn_water",
  SLEEP_ARR:        "hn_sleep_arr",
  MOODS:            "hn_moods",
  MOOD_LOG_DATE:    "hn_mood_log_date",
  WEEKLY_SCORE:     "hn_weekly_score",
  WEEKLY_CHECKIN:   "hn_weekly_checkin",
  WELLNESS_CHAT:    "hn_wellness_chat",
  HABITS:           "hn_habits",

  // Budget
  EXPENSES:         "hn_expenses",
  BUDGET_CATS:      "hn_budget_cats",
  BUDGET_CHAT:      "hn_budget_chat",
  MONTH_HISTORY:    "hn_month_history",
  SAVINGS_HIST:     "hn_savings_hist",

  // Style
  WISHLIST:         "hn_wishlist",
  OUTFITS:          "hn_outfits",

  // Calendar
  CAL_CONNECTED:    "hn_cal_connected",  // sessionStorage only
  SCHOOL_EVENTS:    "hn_school_events",

  // Notifications
  BRIEF_CACHE:      "hn_brief_cache",
  BRIEF_DATE:       "hn_brief_date",
  BRIEF_HOUR:       "hn_brief_hour",
  BRIEF_MIN:        "hn_brief_min",

  // Usage
  DAILY_USAGE:      "hn_daily_usage",
} as const;

// Helper — safe get with JSON parse
export function getStored(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

// Helper — safe set with JSON stringify
export function setStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("[HerNest] Storage write failed:", key, e?.message);
  }
}

// Helper — safe remove
export function removeStored(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

// Clear all HerNest keys on sign out
export function clearAllStorage() {
  Object.values(STORAGE_KEYS).forEach(key => {
    try { localStorage.removeItem(key); } catch (e) {}
    try { sessionStorage.removeItem(key); } catch (e) {}
  });
}

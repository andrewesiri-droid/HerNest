// HerNest Analytics — tracks key user events
// Uses localStorage for now, ready for Firebase Analytics or Segment

const EVENTS = {
  // Onboarding
  ONBOARDING_STARTED:    "onboarding_started",
  ONBOARDING_COMPLETED:  "onboarding_completed",
  ONBOARDING_STEP:       "onboarding_step",

  // Briefing
  BRIEFING_VIEWED:       "briefing_viewed",
  BRIEFING_SHARED:       "briefing_shared",
  BRIEFING_REFRESHED:    "briefing_refreshed",
  BRIEFING_SPOKEN:       "briefing_spoken",

  // Nora
  NORA_MESSAGE_SENT:     "nora_message_sent",
  NORA_MEMORY_ADDED:     "nora_memory_added",
  NORA_MEMORY_REMOVED:   "nora_memory_removed",
  NORA_TASK_CREATED:     "nora_task_created",
  NORA_CRISIS_DETECTED:  "nora_crisis_detected",

  // Features
  TRIP_CREATED:          "trip_created",
  TRIP_PLAN_GENERATED:   "trip_plan_generated",
  RECEIPT_SCANNED:       "receipt_scanned",
  CSV_IMPORTED:          "csv_imported",
  OUTFIT_GENERATED:      "outfit_generated",
  OUTFIT_SAVED:          "outfit_saved",
  SCHOOL_CALENDAR_ADDED: "school_calendar_added",
  WELLNESS_SCORE_GENERATED: "wellness_score_generated",
  WELLNESS_SCORE_SHARED: "wellness_score_shared",
  GIFT_SUGGESTED:        "gift_suggested",

  // Subscription intent (before Stripe)
  UPGRADE_PROMPT_SHOWN:  "upgrade_prompt_shown",
  UPGRADE_TAPPED:        "upgrade_tapped",
  FEATURE_LIMIT_HIT:     "feature_limit_hit",

  // Feature adoption
  FEATURE_FIRST_USE:     "feature_first_use",
  FEATURE_ABANDONED:     "feature_abandoned",

  // Retention
  STREAK_UPDATED:        "streak_updated",
  HABIT_COMPLETED:       "habit_completed",
  WATER_LOGGED:          "water_logged",
  PARTNER_VIEW_SHARED:   "partner_view_shared",
  DATA_EXPORTED:         "data_exported",
  ACCOUNT_DELETED:       "account_deleted",

  // Circle
  CIRCLE_MSG_SENT:       "circle_msg_sent",
  CIRCLE_MATCH_VIEWED:   "circle_match_viewed",
};

// Log an analytics event
// Firebase Analytics (lazy loaded)
let _analytics = null;
async function getFirebaseAnalytics() {
  if(_analytics) return _analytics;
  try{
    const {getAnalytics,isSupported}=await import("firebase/analytics");
    const {app}=await import("./firebase");
    if(await isSupported()){_analytics=getAnalytics(app);return _analytics;}
  }catch(e){}
  return null;
}

export function logEvent(event, params = {}) {
  try {
    const entry = {
      event,
      params,
      timestamp: new Date().toISOString(),
      session: sessionStorage.getItem("hn_session_id") || "unknown",
      version: "2.0.1",
    };

    // Store locally (ring buffer of last 100 events)
    const stored = JSON.parse(localStorage.getItem("hn_analytics") || "[]");
    stored.push(entry);
    if (stored.length > 100) stored.shift();
    localStorage.setItem("hn_analytics", JSON.stringify(stored));

    // Fire to Firebase Analytics async (non-blocking)
    getFirebaseAnalytics().then(analytics=>{
      if(analytics){
        import("firebase/analytics").then(({logEvent:fbLog})=>{
          fbLog(analytics, event, {...params, app_version:"2.0.1"});
        }).catch(()=>{});
      }
    });
  } catch(e) { /* silent */ }
}

// Get session ID (new each app open)
export function initSession() {
  const id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem("hn_session_id", id);
  logEvent("app_opened", { url: window.location.href });
  return id;
}

// Get analytics summary (for debugging)
export function getAnalyticsSummary() {
  try {
    const events = JSON.parse(localStorage.getItem("hn_analytics") || "[]");
    const counts = {};
    events.forEach(e => { counts[e.event] = (counts[e.event] || 0) + 1; });
    return counts;
  } catch(e) { return {}; }
}

export { EVENTS };

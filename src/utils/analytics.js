import posthog from "posthog-js";

// ─── Init ─────────────────────────────────────────────────────────
posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host:          "https://us.i.posthog.com",
  person_profiles:   "identified_only",
  capture_pageview:  false, // we handle this manually
  capture_pageleave: true,
});

// ─── Event names ──────────────────────────────────────────────────
export const EVENTS = {
  // Onboarding
  ONBOARDING_STARTED:       "onboarding_started",
  ONBOARDING_COMPLETED:     "onboarding_completed",
  ONBOARDING_STEP:          "onboarding_step",

  // Nora
  NORA_MESSAGE_SENT:        "nora_message_sent",
  NORA_MEMORY_ADDED:        "nora_memory_added",
  NORA_MEMORY_REMOVED:      "nora_memory_removed",
  NORA_DEBRIEF_STARTED:     "nora_debrief_started",
  NORA_TASK_CONFIRMED:      "nora_task_confirmed",

  // Features
  FEATURE_FIRST_USE:        "feature_first_use",
  FEATURE_LIMIT_HIT:        "feature_limit_hit",
  AI_REQUEST_SUCCESS:       "ai_request_success",
  AI_REQUEST_FAILED:        "ai_request_failed",

  // Wellness
  WELLNESS_CHECKIN:         "wellness_checkin",
  WELLNESS_SCORE_GENERATED: "wellness_score_generated",

  // Budget
  EXPENSE_LOGGED:           "expense_logged",
  RECEIPT_SCANNED:          "receipt_scanned",
  CSV_IMPORTED:             "csv_imported",

  // Style
  OUTFIT_GENERATED:         "outfit_generated",
  OUTFIT_SAVED:             "outfit_saved",

  // Engagement
  STREAK_UPDATED:           "streak_updated",
  CALENDAR_CONNECTED:       "calendar_connected",
  PWA_INSTALLED:            "pwa_installed",
};

// ─── Identify user ────────────────────────────────────────────────
export function identifyUser(uid, properties = {}) {
  if (!uid) return;
  posthog.identify(uid, properties);
}

// ─── Reset on sign out ────────────────────────────────────────────
export function resetUser() {
  posthog.reset();
}

// ─── Track page/tab views ─────────────────────────────────────────
export function trackPage(tabName) {
  posthog.capture("$pageview", { tab: tabName, path: "/" + tabName });
}

// ─── Track session start ──────────────────────────────────────────
export function initSession() {
  posthog.capture("session_started", {
    timestamp: new Date().toISOString(),
    day_of_week: new Date().toLocaleDateString("en-US", { weekday: "long" }),
    hour_of_day: new Date().getHours(),
  });
}

// ─── Main event logger ────────────────────────────────────────────
export function logEvent(eventName, properties = {}) {
  posthog.capture(eventName, properties);
}

export default posthog;

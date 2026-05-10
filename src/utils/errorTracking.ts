// ─── HerNest Error Tracking ───────────────────────────────────────
// Lightweight error tracking — logs to console in dev, 
// ready to wire to Highlight.io or Sentry in production.

export function initErrorTracking() {
  // Global JS errors
  window.onerror = (msg, src, line, col, err) => {
    const error = { msg, src, line, col, stack: err?.stack, ts: new Date().toISOString() };
    if (import.meta.env.DEV) {
      console.error("[HerNest Error]", error);
    } else {
      // Production: send to your error tracking service
      // e.g. Highlight.H.consumeError(err)
      // e.g. Sentry.captureException(err)
      try {
        const errors = JSON.parse(sessionStorage.getItem("hn_errors") || "[]");
        errors.push(error);
        sessionStorage.setItem("hn_errors", JSON.stringify(errors.slice(-10)));
      } catch (e) {}
    }
    return false; // don't suppress default handling
  };

  // Unhandled promise rejections
  window.onunhandledrejection = (event) => {
    if (import.meta.env.DEV) {
      console.error("[HerNest Unhandled Promise]", event.reason);
    }
  };
}

// Call this to get stored errors (for support/debugging)
export function getStoredErrors() {
  try { return JSON.parse(sessionStorage.getItem("hn_errors") || "[]"); } catch (e) { return []; }
}

// HerNest Retention Metrics — Simple daily dashboard
// Access at: window.hernestMetrics() in browser console

export function calculateRetentionMetrics() {
  const events = JSON.parse(localStorage.getItem("hn_analytics") || "[]");
  const today = new Date().toDateString();
  const todayEvents = events.filter(e => new Date(e.timestamp).toDateString() === today);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const featureUsage = {};
  events.forEach(e => {
    if(e.event) featureUsage[e.event] = (featureUsage[e.event] || 0) + 1;
  });

  const metrics = {
    today: {
      app_opens: todayEvents.filter(e => e.event === "app_opened").length,
      briefing_views: todayEvents.filter(e => e.event === "briefing_viewed").length,
      nora_messages: todayEvents.filter(e => e.event === "nora_message_sent").length,
      circle_messages: todayEvents.filter(e => e.event === "circle_msg_sent").length,
      feature_limits_hit: todayEvents.filter(e => e.event === "feature_limit_hit").length,
    },
    week: {
      app_opens: events.filter(e => e.event === "app_opened" && e.timestamp > weekAgo).length,
      briefing_views: events.filter(e => e.event === "briefing_viewed" && e.timestamp > weekAgo).length,
      memory_facts_added: events.filter(e => e.event === "nora_memory_added" && e.timestamp > weekAgo).length,
    },
    all_time: {
      total_events: events.length,
      feature_usage: featureUsage,
      onboarding_completions: events.filter(e => e.event === "onboarding_completed").length,
      data_exports: events.filter(e => e.event === "data_exported").length,
    },
    ai_usage: {
      daily_count: parseInt(JSON.parse(localStorage.getItem("hn_daily_usage") || "{}").count || 0),
      daily_limit: 10,
      daily_remaining: 10 - parseInt(JSON.parse(localStorage.getItem("hn_daily_usage") || "{}").count || 0),
    }
  };

  return metrics;
}

// Expose globally for easy console access
if(typeof window !== "undefined") {
  window.hernestMetrics = calculateRetentionMetrics;
}

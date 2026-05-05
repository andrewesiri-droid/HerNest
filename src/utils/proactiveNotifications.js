
// HerNest Proactive Notifications
// Client-side checks — runs on app open
// Server-side scheduling needs Cloud Functions (Month 2)

import { isQuietMode } from "./quietMode.js";

const LAST_CHECK_KEY = "hn_last_proactive_check";
const NOTIF_HISTORY_KEY = "hn_notif_history";

// Quiet hours: 10 PM - 7 AM
function isQuietHours() {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 7;
}

// Check if we already sent this notification today
function alreadySentToday(type) {
  try {
    const today = new Date().toDateString();
    const history = JSON.parse(localStorage.getItem(NOTIF_HISTORY_KEY) || "{}");
    return history[type] === today;
  } catch(e) { return false; }
}

function markSent(type) {
  try {
    const today = new Date().toDateString();
    const history = JSON.parse(localStorage.getItem(NOTIF_HISTORY_KEY) || "{}");
    history[type] = today;
    localStorage.setItem(NOTIF_HISTORY_KEY, JSON.stringify(history));
  } catch(e) {}
}

// Request push permission (call on first meaningful interaction)
export async function requestPushPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Send browser notification
function sendNotification(title, body, tag, url = "/") {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (isQuietMode()) return;
  if (isQuietHours()) return;
  
  try {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag,
        data: { url },
        requireInteraction: false,
      });
    });
  } catch(e) {}
}

// Main check — run on app open
export function checkProactiveNotifications(context, profile) {
  if (!context || !profile) return;
  if (isQuietMode()) return;
  if (isQuietHours()) return;

  const hour = new Date().getHours();
  const day = new Date().getDay();
  const name = profile.name?.split(" ")[0] || "lovely";

  // 1. Morning briefing (7-9 AM, not viewed today)
  if (hour >= 7 && hour <= 9 && !context.briefing?.viewedToday && !alreadySentToday("morning_briefing")) {
    sendNotification(
      "Good morning, " + name + " ✨",
      "Your briefing is ready. Focus word incoming.",
      "morning_briefing",
      "/?open=briefing"
    );
    markSent("morning_briefing");
  }

  // 2. School prep reminder (evening before urgent event)
  const urgentSchool = context.school?.urgentEvents?.[0];
  if (urgentSchool && urgentSchool.daysUntil <= 1 && hour >= 18 && hour <= 21 && !alreadySentToday("school_prep")) {
    sendNotification(
      "Tomorrow: " + urgentSchool.title,
      "Nora has questions ready for you. 2 minutes tonight saves stress tomorrow.",
      "school_prep",
      "/?open=plan"
    );
    markSent("school_prep");
  }

  // 3. Birthday today
  if (context.birthdays?.hasTodayBirthday && !alreadySentToday("birthday")) {
    const bday = context.birthdays.todayBirthday;
    sendNotification(
      "Today is " + bday.name + "'s birthday 🎂",
      "Don't forget to reach out. Nora has gift ideas.",
      "birthday",
      "/?open=profile"
    );
    markSent("birthday");
  }

  // 4. Weekly wellness check-in (Sunday 6-8 PM)
  if (day === 0 && hour >= 18 && hour <= 20 && context.wellness?.needsCheckIn && !alreadySentToday("wellness_checkin")) {
    sendNotification(
      "Sunday check-in, " + name,
      "One tap to tell Nora how your week went. Takes 2 seconds.",
      "wellness_checkin",
      "/?open=wellness"
    );
    markSent("wellness_checkin");
  }

  // 5. Trip excitement (7 days out)
  if (context.trips?.nextTrip && context.trips.daysUntilNext === 7 && !alreadySentToday("trip_prep")) {
    sendNotification(
      context.trips.nextTrip.dest + " in 7 days ✈️",
      "Packing list ready. Nora sorted the itinerary.",
      "trip_prep",
      "/?open=trips"
    );
    markSent("trip_prep");
  }

  // 6. Budget alert (near limit, morning)
  if (context.budget?.isNearLimit && hour >= 9 && hour <= 10 && !alreadySentToday("budget_alert")) {
    sendNotification(
      "Budget check",
      Math.round(context.budget.remaining) + " left this month. Nora can help.",
      "budget_alert",
      "/?open=budget"
    );
    markSent("budget_alert");
  }
}

// Genuine concern — quiet mode exit check-in (24hrs after quiet mode set)
export function checkQuietModeExit(profile) {
  try {
    const until = parseInt(localStorage.getItem("hn_quiet_until") || "0");
    const now = Date.now();
    // Within 30 mins of quiet mode expiring
    if (until > 0 && now > until - 30 * 60 * 1000 && now < until + 60 * 60 * 1000) {
      const name = profile?.name?.split(" ")?.[0] || "lovely";
      sendNotification(
        "Hey " + name,
        "How are you doing? Nora is here when you're ready.",
        "quiet_exit",
        "/"
      );
    }
  } catch(e) {}
}

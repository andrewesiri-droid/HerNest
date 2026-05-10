import { useState, useEffect, useMemo } from "react";
import { buildContextLayer } from "../utils/contextLayer";
import { isQuietMode } from "../utils/quietMode";
import { checkProactiveNotifications, checkQuietModeExit } from "../utils/proactiveNotifications";

export function useAppContext(uid, profileName, calEvents) {
  const [appContext, setAppContext] = useState(null);

  const build = (uid, profileName, calEvents) => {
    if (!uid || !profileName) return;
    buildContextLayer(uid, { name: profileName }, calEvents).then(ctx => {
      if (!ctx) return;
      setAppContext(ctx);
      if (!isQuietMode()) checkProactiveNotifications(ctx, { name: profileName });
      checkQuietModeExit({ name: profileName });
      try {
        localStorage.setItem("hn_app_context", JSON.stringify({
          wellness: ctx.wellness, school: ctx.school, tasks: ctx.tasks,
          budget: ctx.budget, trips: ctx.trips, calendar: ctx.calendar,
        }));
      } catch (e) {}
    }).catch(() => {});
  };

  useEffect(() => {
    build(uid, profileName, calEvents);
  }, [uid, profileName, calEvents.length]);

  useEffect(() => {
    let lastRun = Date.now();
    const refresh = () => {
      if (Date.now() - lastRun < 60000) return; // 60s debounce
      lastRun = Date.now();
      build(uid, profileName, calEvents);
    };
    const interval = setInterval(refresh, 300000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [uid, profileName]);

  return appContext;
}

import { useState, useEffect } from "react";
import { saveData, loadData } from "../utils/firebase";

export function useStreak(screen, uid) {
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    if (screen !== "app") return;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const applyStreak = (s) => {
      if (s?.lastDate === today) {
        setStreak(s.count || 1);
      } else if (s?.lastDate === yesterday) {
        const newCount = (s.count || 1) + 1;
        setStreak(newCount);
        const updated = { count: newCount, lastDate: today };
        try { localStorage.setItem("hn_streak", JSON.stringify(updated)); } catch (e) {}
        if (uid) saveData(uid, "streak", updated).catch(() => {});
      } else {
        const updated = { count: 1, lastDate: today };
        try { localStorage.setItem("hn_streak", JSON.stringify(updated)); } catch (e) {}
        if (uid) saveData(uid, "streak", updated).catch(() => {});
        setStreak(1);
      }
    };

    // Try Firestore first, fallback to localStorage
    if (uid) {
      loadData(uid, "streak").then(d => {
        if (d?.lastDate) {
          applyStreak(d);
        } else {
          try { applyStreak(JSON.parse(localStorage.getItem("hn_streak") || "{}")); } catch(e) {}
        }
      }).catch(() => {
        try { applyStreak(JSON.parse(localStorage.getItem("hn_streak") || "{}")); } catch(e) {}
      });
    } else {
      try { applyStreak(JSON.parse(localStorage.getItem("hn_streak") || "{}")); } catch(e) {}
    }
  }, [screen, uid]);

  return streak;
}

import { useState, useEffect } from "react";

export function useStreak(screen) {
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    if (screen !== "app") return;
    const today = new Date().toDateString();
    try {
      const s = JSON.parse(localStorage.getItem("hn_streak") || "{}");
      if (s.lastDate === today) {
        setStreak(s.count || 1);
      } else if (s.lastDate === new Date(Date.now() - 86400000).toDateString()) {
        const newCount = (s.count || 1) + 1;
        setStreak(newCount);
        localStorage.setItem("hn_streak", JSON.stringify({ count: newCount, lastDate: today }));
      } else {
        localStorage.setItem("hn_streak", JSON.stringify({ count: 1, lastDate: today }));
        setStreak(1);
      }
    } catch (e) {}
  }, [screen]);

  return streak;
}

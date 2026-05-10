// ─── useSyncedStore ───────────────────────────────────────────────
// Unified sync pattern: Firestore = source of truth, localStorage = offline cache.
// Usage: const [data, setData, loading] = useSyncedStore("budget", uid, defaultValue);

import { useState, useEffect, useRef } from "react";
import { saveData, loadData } from "../utils/firebase";

export function useSyncedStore(key, uid, defaultValue = null) {
  const [data, setDataRaw] = useState(() => {
    try {
      const cached = localStorage.getItem(`hn_${key}`);
      return cached ? JSON.parse(cached) : defaultValue;
    } catch (e) { return defaultValue; }
  });
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

  // Load from Firestore on mount
  useEffect(() => {
    if (!uid) { setLoading(false); hasLoaded.current = true; return; }
    loadData(uid, key).then(d => {
      if (d !== null && d !== undefined) {
        setDataRaw(d);
        try { localStorage.setItem(`hn_${key}`, JSON.stringify(d)); } catch (e) {}
      }
    }).catch(() => {}).finally(() => {
      setLoading(false);
      hasLoaded.current = true;
    });
  }, [uid, key]);

  // Save to Firestore + localStorage on change (only after first load)
  const setData = (updater) => {
    setDataRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem(`hn_${key}`, JSON.stringify(next)); } catch (e) {}
      if (uid && hasLoaded.current) {
        saveData(uid, key, next).catch(() => {});
      }
      return next;
    });
  };

  return [data, setData, loading];
}


// HerNest Follow-up System
// Tracks nudges viewed but not acted on
// Resurfaces gently at 4hrs and 24hrs

import { saveData, loadData } from "./firebase";

const FOLLOWUP_KEY = "hn_followups";

export async function recordNudgeViewed(nudgeId, nudgeType, uid) {
  const followUp = {
    id: nudgeId,
    type: nudgeType,
    viewedAt: Date.now(),
    actedOn: false,
    followUpAt4h: Date.now() + 4 * 60 * 60 * 1000,
    followUpAt24h: Date.now() + 24 * 60 * 60 * 1000,
    closed: false,
  };
  try {
    const existing = JSON.parse(localStorage.getItem(FOLLOWUP_KEY) || "[]");
    const updated = [...existing.filter(f => f.id !== nudgeId), followUp];
    localStorage.setItem(FOLLOWUP_KEY, JSON.stringify(updated.slice(-20)));
    if (uid) await saveData(uid, "followUps", { items: updated.slice(-20) }).catch(() => {});
  } catch(e) {}
}

export function recordNudgeActedOn(nudgeId) {
  try {
    const existing = JSON.parse(localStorage.getItem(FOLLOWUP_KEY) || "[]");
    const updated = existing.map(f => f.id === nudgeId ? { ...f, actedOn: true, actedAt: Date.now() } : f);
    localStorage.setItem(FOLLOWUP_KEY, JSON.stringify(updated));
  } catch(e) {}
}

export function getPendingFollowUp() {
  try {
    const now = Date.now();
    const items = JSON.parse(localStorage.getItem(FOLLOWUP_KEY) || "[]");
    
    // Find nudge that was viewed but not acted on, and follow-up time has passed
    const pending = items.find(f =>
      !f.actedOn &&
      !f.closed &&
      (now > f.followUpAt4h || now > f.followUpAt24h)
    );
    
    if (!pending) return null;
    
    const is24h = Date.now() > pending.followUpAt24h;
    
    return {
      nudgeId: pending.id,
      nudgeType: pending.type,
      is24h,
      message: is24h
        ? "Want Nora to handle this differently?"
        : "Still need help with that?",
      icon: "💛",
    };
  } catch(e) { return null; }
}

export function closeFollowUp(nudgeId) {
  try {
    const existing = JSON.parse(localStorage.getItem(FOLLOWUP_KEY) || "[]");
    const updated = existing.map(f => f.id === nudgeId ? { ...f, closed: true } : f);
    localStorage.setItem(FOLLOWUP_KEY, JSON.stringify(updated));
  } catch(e) {}
}

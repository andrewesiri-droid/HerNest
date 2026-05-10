// ─── Cross-module tracking confirmations ─────────────────────────
// Call these after saving data in any module to show Nora noticed

export function showNoraTracking(message, duration = 2500) {
  const el = document.createElement("div");
  el.style.cssText = `
    position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
    background:#2E1F14;color:#fff;border-radius:20px;padding:10px 18px;
    font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;
    display:flex;align-items:center;gap:8px;z-index:9999;
    animation:fadeUp .3s ease both;box-shadow:0 4px 20px rgba(0,0,0,.25);
    white-space:nowrap;
  `;
  el.innerHTML = `<span style="font-size:16px">⭐</span> ${message}`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// Specific tracking messages
export const TRACKING = {
  expenseLogged:    (cat, amt) => showNoraTracking(`Nora tracked $${amt} in ${cat}`),
  habitDone:        (name)     => showNoraTracking(`Nora noted: ${name} ✓`),
  tripAdded:        (dest)     => showNoraTracking(`Nora added ${dest} to your briefing`),
  taskAdded:        (text)     => showNoraTracking(`Nora added "${text.slice(0,20)}${text.length>20?"...":""}" to your plan`),
  profileSaved:     ()         => showNoraTracking(`Nora updated her knowledge about you`),
  schoolEvent:      (title)    => showNoraTracking(`Nora added "${title}" to your calendar`),
  waterLogged:      (count)    => showNoraTracking(`${count}/8 glasses — Nora is tracking 💧`),
  mealPlanned:      ()         => showNoraTracking(`Nora added meals to your weekly plan`),
};

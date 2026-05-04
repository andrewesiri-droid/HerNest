import React, { useState, useEffect } from "react";
import { T, FD, FB } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { Card, H2, Pill } from "../components/shared";

const SOURCE_COLORS = {
  school:   "#1a5a9e",
  birthday: "#D4826A",
  google:   "#4A9E9E",
  trip:     "#6B9E7A",
  task:     "#C49A3C",
  family:   "#8B7EC8",
};

const SOURCE_EMOJI = {
  school:   "🎒",
  birthday: "🎂",
  google:   "📅",
  trip:     "✈️",
  task:     "✅",
  family:   "🏠",
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export function CalendarScreen({ profile, calEvents = [], uid }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [selectedSource, setSelectedSource] = useState("All");
  const [expandedEvent, setExpandedEvent] = useState(null);

  // ─── Gather all events from all sources ───────────────────────
  const allEvents = [];

  // 1. Google Calendar events
  (calEvents || []).forEach(e => {
    const d = new Date(e.start);
    allEvents.push({
      id: e.id || Math.random(),
      title: e.title,
      date: e.start?.split("T")[0] || e.start,
      time: e.start?.includes("T") ? new Date(e.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "All day",
      source: "google",
      location: e.location || "",
      allDay: e.allDay,
    });
  });

  // 2. School events
  try {
    const schoolRaw = localStorage.getItem("hn_school_events");
    const schoolEvents = schoolRaw ? JSON.parse(schoolRaw) : [];
    schoolEvents.forEach(e => {
      allEvents.push({
        id: e.title + e.date,
        title: e.title,
        date: e.date,
        time: "School",
        source: "school",
        child: e.child,
        prep: e.prep,
        type: e.type,
        requiresAction: e.requiresAction,
        priority: e.priority,
      });
    });
  } catch(e) { /* silent */ }

  // 3. Birthdays
  const allPeople = [
    ...(profile?.kids || []),
    ...(profile?.parents || []),
    ...(profile?.inlaws || []),
    ...(profile?.friends || []),
    ...(profile?.partner ? [{ name: profile.partner, bday: profile.partnerBday }] : []),
  ];
  allPeople.forEach(p => {
    if (!p?.bday) return;
    const parts = p.bday.split("/");
    if (parts.length !== 2) return;
    // Add for current and next year
    [viewYear, viewYear + 1].forEach(yr => {
      const dateStr = `${yr}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`;
      allEvents.push({
        id: `bday-${p.name}-${yr}`,
        title: `${p.name}'s Birthday 🎂`,
        date: dateStr,
        time: "All day",
        source: "birthday",
        person: p.name,
      });
    });
  });

  // 4. Trips
  try {
    const tripsRaw = localStorage.getItem("hn_trips");
    const trips = tripsRaw ? JSON.parse(tripsRaw) : [];
    trips.forEach(t => {
      if (t.date) {
        allEvents.push({
          id: `trip-${t.id}`,
          title: `✈️ ${t.dest}`,
          date: t.date,
          time: "Trip",
          source: "trip",
          nights: t.nights,
        });
      }
    });
  } catch(e) { /* silent */ }

  // 5. Tasks with due dates
  try {
    const tasksRaw = localStorage.getItem("hn_tasks");
    const tasks = tasksRaw ? JSON.parse(tasksRaw) : [];
    tasks.filter(t => t.dueDate && !t.done).forEach(t => {
      allEvents.push({
        id: `task-${t.id}`,
        title: t.text,
        date: t.dueDate,
        time: "Task",
        source: "task",
        tag: t.tag,
      });
    });
  } catch(e) { /* silent */ }

  // ─── Filter by source ──────────────────────────────────────────
  const filtered = selectedSource === "All"
    ? allEvents
    : allEvents.filter(e => e.source === selectedSource);

  // ─── Events for current month ──────────────────────────────────
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const monthEvents = filtered.filter(e => e.date?.startsWith(monthStr));

  // ─── Events for selected day ───────────────────────────────────
  const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  const dayEvents = filtered.filter(e => e.date === dayStr);

  // ─── Events by date map ────────────────────────────────────────
  const eventsByDate = {};
  monthEvents.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
    eventsByDate[e.date].push(e);
  });

  // ─── Conflict detection ────────────────────────────────────────
  const conflicts = [];
  Object.entries(eventsByDate).forEach(([date, evts]) => {
    if (evts.length >= 2) {
      const actionRequired = evts.filter(e => e.requiresAction || e.source === "google");
      if (actionRequired.length >= 2) {
        conflicts.push({ date, events: evts });
      }
    }
  });

  // ─── Upcoming important events (next 30 days) ─────────────────
  const upcoming = filtered
    .filter(e => {
      const d = new Date(e.date);
      const diff = (d - today) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDay(1);
  };

  const sources = ["All", "google", "school", "birthday", "trip", "task"];

  return (
    <div style={{ paddingBottom: 20, animation: "fadeUp .4s ease both" }}>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 600, color: T.esp, fontStyle: "italic", margin: "0 0 2px" }}>HerNest Calendar</h2>
        <p style={{ fontFamily: FB, fontSize: 12, color: T.taupe, margin: 0 }}>Everything in one place</p>
      </div>

      {/* Conflicts alert with resolution suggestions */}
      {conflicts.length > 0 && (
        <div style={{ background: `linear-gradient(135deg,${T.blush}20,${T.blushP})`, borderRadius: 14, padding: "12px 14px", marginBottom: 12, border: `1.5px solid ${T.blush}40` }}>
          <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, color: T.blush, marginBottom: 8 }}>⚠️ {conflicts.length} scheduling conflict{conflicts.length > 1 ? "s" : ""} this month</div>
          {conflicts.slice(0, 2).map((c, i) => {
            const types = c.events.map(e => e.source);
            const hasWork = types.includes("google");
            const hasSchool = types.includes("school");
            const hasTrip = types.includes("trip");
            const hasBirthday = types.includes("birthday");
            let suggestion = null;
            let action = null;
            if(hasWork && hasSchool){
              suggestion = "Parent meeting clashes with your calendar";
              action = {label:"Draft reschedule email", onClick:()=>{
                const txt=`Hi,

I have a parent-teacher conference on ${new Date(c.date).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})} and need to reschedule our meeting. Could we find another time that week?

Thank you for your understanding.`;
                navigator.clipboard.writeText(txt).catch(()=>{});
                alert("Email draft copied to clipboard 📋");
              }};
            } else if(hasTrip && hasSchool){
              suggestion = "Your trip overlaps with a school event";
              action = {label:"Review trip dates", onClick:()=>{}};
            } else if(hasBirthday && hasWork){
              suggestion = "Birthday falls on a busy work day";
              action = {label:"Add reminder to plan gift", onClick:()=>{
                navigator.clipboard.writeText(`Don't forget — it's ${c.events.find(e=>e.source==="birthday")?.title} on ${new Date(c.date).toLocaleDateString()}`).catch(()=>{});
                alert("Reminder copied 📋");
              }};
            } else {
              suggestion = "Two important events on the same day";
            }
            return(
              <div key={i} style={{ marginBottom: i < conflicts.length-1 ? 10 : 0 }}>
                <div style={{ fontFamily: FB, fontSize: 11, color: T.bark, marginBottom: 4 }}>
                  {new Date(c.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} — {c.events.map(e => e.title).join(" & ")}
                </div>
                {suggestion && <div style={{ fontFamily: FB, fontSize: 10, color: T.blush, fontStyle:"italic", marginBottom: 4 }}>💡 {suggestion}</div>}
                {action && <button onClick={action.onClick} style={{ background: T.blush, border: "none", borderRadius: 8, padding: "4px 10px", fontFamily: FB, fontSize: 10, fontWeight: 700, color: "#fff", cursor: "pointer" }}>{action.label}</button>}
              </div>
            );
          })}
        </div>
      )}

      {/* Source filter pills */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4, scrollbarWidth: "none" }}>
        {sources.map(s => (
          <button key={s} onClick={() => setSelectedSource(s)} style={{
            flexShrink: 0, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${selectedSource === s ? (SOURCE_COLORS[s] || T.esp) : T.linen}`,
            background: selectedSource === s ? (SOURCE_COLORS[s] || T.esp) : "#fff",
            fontFamily: FB, fontSize: 11, fontWeight: 700,
            color: selectedSource === s ? "#fff" : T.bark, cursor: "pointer"
          }}>
            {s === "All" ? "All" : `${SOURCE_EMOJI[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Calendar grid */}
      <Card ch={
        <div>
          {/* Month nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <Ic.Back s={18} c={T.bark} w={2} />
            </button>
            <span style={{ fontFamily: FD, fontSize: 18, fontWeight: 600, color: T.esp, fontStyle: "italic" }}>{monthName}</span>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <Ic.Arrow s={18} c={T.bark} w={2} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <div key={d} style={{ textAlign: "center", fontFamily: FB, fontSize: 10, fontWeight: 700, color: T.taupe, letterSpacing: 0.5 }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvts = eventsByDate[dStr] || [];
              const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const isSelected = day === selectedDay;
              const hasConflict = conflicts.some(c => c.date === dStr);

              return (
                <div key={day} onClick={() => setSelectedDay(day)} style={{
                  borderRadius: 10, padding: "6px 2px", textAlign: "center", cursor: "pointer",
                  background: isSelected ? T.esp : isToday ? T.goldP : "transparent",
                  border: hasConflict ? `1.5px solid ${T.blush}` : "1.5px solid transparent",
                  position: "relative",
                }}>
                  <div style={{ fontFamily: FB, fontSize: 12, fontWeight: isToday || isSelected ? 700 : 400, color: isSelected ? "#fff" : isToday ? T.gold : T.esp }}>
                    {day}
                  </div>
                  {/* Event dots */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2, flexWrap: "wrap", minHeight: 8 }}>
                    {dayEvts.slice(0, 3).map((e, ei) => (
                      <div key={ei} style={{ width: 5, height: 5, borderRadius: "50%", background: SOURCE_COLORS[e.source] || T.bark, flexShrink: 0 }} />
                    ))}
                    {dayEvts.length > 3 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.taupe }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      } />

      {/* Selected day events */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: T.bark, marginBottom: 10 }}>
          {new Date(viewYear, viewMonth, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
        {dayEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", background: T.sand, borderRadius: 14 }}>
            <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 14, color: T.taupe, margin: 0 }}>A clear day ✨</p>
          </div>
        ) : (
          dayEvents.map((e, i) => (
            <div key={i}>
              <div onClick={() => setExpandedEvent(expandedEvent === i ? null : i)} style={{
                display: "flex", alignItems: "center", gap: 10, background: "#fff",
                borderRadius: 14, padding: "12px 14px", marginBottom: 6,
                border: `1px solid ${T.linen}`, boxShadow: "0 2px 8px rgba(0,0,0,.05)", cursor: "pointer",
                borderLeft: `4px solid ${SOURCE_COLORS[e.source] || T.bark}`
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{SOURCE_EMOJI[e.source]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FB, fontSize: 13, fontWeight: 700, color: T.esp, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 2, alignItems: "center" }}>
                    <span style={{ fontFamily: FB, fontSize: 10, color: T.taupe }}>{e.time}</span>
                    {e.location && <span style={{ fontFamily: FB, fontSize: 10, color: T.taupe }}>· 📍 {e.location}</span>}
                    {e.child && e.child !== "All" && <span style={{ fontFamily: FB, fontSize: 9, color: "#1a5a9e", background: "#1a5a9e11", borderRadius: 20, padding: "1px 6px" }}>{e.child}</span>}
                  </div>
                </div>
                {e.requiresAction && <span style={{ fontFamily: FB, fontSize: 9, fontWeight: 700, color: T.blush, background: T.blushP, borderRadius: 20, padding: "2px 7px", flexShrink: 0 }}>Action</span>}
              </div>
              {expandedEvent === i && (
                <div style={{ background: T.sand, borderRadius: 12, padding: "12px 14px", margin: "-2px 0 8px", borderLeft: `3px solid ${SOURCE_COLORS[e.source]}` }}>
                  {e.prep && <p style={{ fontFamily: FB, fontSize: 12, color: T.bark, margin: "0 0 6px" }}>📋 {e.prep}</p>}
                  {e.nights && <p style={{ fontFamily: FB, fontSize: 12, color: T.bark, margin: "0 0 6px" }}>🌙 {e.nights} nights</p>}
                  {e.tag && <p style={{ fontFamily: FB, fontSize: 12, color: T.bark, margin: "0 0 6px" }}>🏷️ {e.tag}</p>}
                  <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, color: SOURCE_COLORS[e.source], textTransform: "capitalize" }}>{e.source} event</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Upcoming 30 days */}
      {upcoming.length > 0 && (
        <Card ch={
          <div>
            <H2 t="Coming up" sub="Next 30 days" />
            {upcoming.slice(0, 10).map((e, i) => {
              const diff = Math.ceil((new Date(e.date) - today) / (1000 * 60 * 60 * 24));
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < Math.min(upcoming.length, 10) - 1 ? `1px solid ${T.linen}` : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: (SOURCE_COLORS[e.source] || T.bark) + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                    {SOURCE_EMOJI[e.source]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FB, fontSize: 12, fontWeight: 600, color: T.esp, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                    <div style={{ fontFamily: FB, fontSize: 10, color: T.taupe, marginTop: 1 }}>
                      {new Date(e.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, color: diff <= 3 ? T.blush : diff <= 7 ? T.gold : T.taupe, flexShrink: 0 }}>
                    {diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `${diff}d`}
                  </div>
                </div>
              );
            })}
          </div>
        } />
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8, paddingTop: 12, borderTop: `1px solid ${T.linen}` }}>
        {Object.entries(SOURCE_COLORS).map(([src, color]) => (
          <div key={src} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <span style={{ fontFamily: FB, fontSize: 10, color: T.taupe, textTransform: "capitalize" }}>{src}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { T, FD, FB, AIGRAD } from "../constants/theme";
import { Ic } from "../constants/icons.jsx";
import { saveData, loadData } from "../utils/firebase";
import { Card, H2, AIBadge, Tag } from "../components/shared";

const FACT_TYPE_META = {
  dietary:   { label: "Diet",       emoji: "🥗", color: T.sage  },
  medical:   { label: "Health",     emoji: "💊", color: T.blush },
  family:    { label: "Family",     emoji: "👨‍👩‍👧", color: T.gold  },
  preference:{ label: "Preference", emoji: "✨", color: T.lav   },
  goal:      { label: "Goal",       emoji: "🎯", color: T.teal  },
  schedule:  { label: "Schedule",   emoji: "📅", color: T.sky   },
  event:     { label: "Event",      emoji: "🎉", color: T.blush },
  temporary: { label: "Temporary",  emoji: "⏳", color: T.taupe },
};

export function NoraMemoryScreen({ uid }) {
  const [memory, setMemory] = useState([]);
  const [newFact, setNewFact] = useState("");
  const [newType, setNewType] = useState("preference");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");

  // Load memory — Firestore first, localStorage fallback
  useEffect(() => {
    if (uid) {
      loadData(uid, "nora_memory").then(d => {
        if (d?.facts?.length) {
          setMemory(d.facts);
          try { localStorage.setItem("hn_nora_memory_v2", JSON.stringify(d.facts)); } catch(e) {}
        } else {
          // fallback to localStorage if Firestore empty
          try {
            const s = localStorage.getItem("hn_nora_memory_v2");
            if (s) setMemory(JSON.parse(s));
          } catch (e) {}
        }
      }).catch(() => {
        try {
          const s = localStorage.getItem("hn_nora_memory_v2");
          if (s) setMemory(JSON.parse(s));
        } catch (e) {}
      });
    } else {
      try {
        const s = localStorage.getItem("hn_nora_memory_v2");
        if (s) setMemory(JSON.parse(s));
      } catch (e) {}
    }
  }, [uid]);

  const saveMemory = (updated) => {
    setMemory(updated);
    try { localStorage.setItem("hn_nora_memory_v2", JSON.stringify(updated)); } catch (e) {}
    if (uid) saveData(uid, "nora_memory", { facts: updated }).catch(() => {});
  };

  const addFact = () => {
    if (!newFact.trim()) return;
    const fact = {
      id: `fact_${Date.now()}`,
      fact: newFact.trim(),
      type: newType,
      confidence: 1.0,
      createdAt: new Date().toISOString(),
      expiresAt: null,
      useCount: 0,
      source: "user_explicit",
    };
    saveMemory([...memory, fact]);
    setNewFact("");
    setShowAdd(false);
  };

  const deleteFact = (id) => {
    saveMemory(memory.filter(f => f.id !== id));
  };

  const activeMemory = memory.filter(f => !f.expiresAt || new Date(f.expiresAt) > new Date());
  const filtered = filter === "all" ? activeMemory : activeMemory.filter(f => f.type === filter);

  return (
    <div style={{ animation: "fadeUp .4s ease both" }}>
      {/* Header */}
      <div style={{ background: AIGRAD, borderRadius: 22, padding: "20px", marginBottom: 14 }}>
        <AIBadge t="Nora's Memory"/>
        <h2 style={{ fontFamily: FD, fontStyle: "italic", fontSize: 22, color: "#fff", margin: "10px 0 4px", fontWeight: 400 }}>What Nora knows about you</h2>
        <p style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,.45)", margin: 0 }}>
          {activeMemory.length} thing{activeMemory.length !== 1 ? "s" : ""} remembered · Tap × to forget
        </p>
      </div>

      {/* Add new fact */}
      <button onClick={() => setShowAdd(!showAdd)} style={{ width: "100%", background: showAdd ? T.esp : T.sand, border: `1.5px solid ${showAdd ? T.esp : T.linen}`, borderRadius: 14, padding: "11px 16px", fontFamily: FB, fontSize: 13, color: showAdd ? "#fff" : T.bark, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Ic.Plus s={18} c={showAdd ? "#fff" : T.bark} w={2}/>{showAdd ? "Cancel" : "Teach Nora something new"}
      </button>

      {showAdd && (
        <div style={{ background: "#fff", borderRadius: 18, padding: "16px", marginBottom: 14, border: `1.5px solid ${T.gold}` }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {Object.entries(FACT_TYPE_META).map(([type, meta]) => (
              <button key={type} onClick={() => setNewType(type)} style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${newType === type ? meta.color : T.linen}`, background: newType === type ? meta.color + "18" : "transparent", fontFamily: FB, fontSize: 11, color: newType === type ? meta.color : T.bark, cursor: "pointer" }}>
                {meta.emoji} {meta.label}
              </button>
            ))}
          </div>
          <input
            placeholder={`e.g. ${newType === "dietary" ? "I'm gluten free" : newType === "goal" ? "I want to run a 5K" : newType === "family" ? "My daughter loves swimming" : "I prefer morning workouts"}`}
            value={newFact}
            onChange={e => setNewFact(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addFact()}
            style={{ width: "100%", fontFamily: FB, fontSize: 13, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${T.linen}`, color: T.esp, marginBottom: 12 }}
          />
          <button onClick={addFact} disabled={!newFact.trim()} style={{ width: "100%", background: newFact.trim() ? T.esp : T.linen, color: newFact.trim() ? "#fff" : T.taupe, border: "none", borderRadius: 12, padding: "11px", fontFamily: FB, fontSize: 13, fontWeight: 700, cursor: newFact.trim() ? "pointer" : "default" }}>
            Save to Nora's memory
          </button>
        </div>
      )}

      {/* Filter by type */}
      {activeMemory.length > 3 && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
          <button onClick={() => setFilter("all")} style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${filter === "all" ? T.esp : T.linen}`, background: filter === "all" ? T.esp : "transparent", fontFamily: FB, fontSize: 11, color: filter === "all" ? "#fff" : T.bark, cursor: "pointer" }}>All</button>
          {[...new Set(activeMemory.map(f => f.type))].map(type => {
            const meta = FACT_TYPE_META[type] || { label: type, emoji: "•", color: T.taupe };
            return (
              <button key={type} onClick={() => setFilter(type)} style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${filter === type ? meta.color : T.linen}`, background: filter === type ? meta.color + "18" : "transparent", fontFamily: FB, fontSize: 11, color: filter === type ? meta.color : T.bark, cursor: "pointer" }}>
                {meta.emoji} {meta.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Memory list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: T.sand, borderRadius: 18 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
          <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 18, color: T.esp, margin: "0 0 8px" }}>Nora's memory is empty</p>
          <p style={{ fontFamily: FB, fontSize: 13, color: T.taupe, margin: "0 0 16px", lineHeight: 1.6 }}>Tell Nora things about you and she'll remember them forever. The more she knows, the better she helps.</p>
          <button onClick={() => setShowAdd(true)} style={{ background: T.esp, color: "#fff", border: "none", borderRadius: 12, padding: "10px 20px", fontFamily: FB, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Teach Nora something</button>
        </div>
      ) : (
        <div>
          {filtered.map(fact => {
            const meta = FACT_TYPE_META[fact.type] || { label: fact.type, emoji: "•", color: T.taupe };
            return (
              <div key={fact.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#fff", borderRadius: 14, padding: "13px 14px", marginBottom: 8, border: `1px solid ${T.linen}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{meta.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: FB, fontSize: 13, color: T.esp, lineHeight: 1.5 }}>{fact.fact}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{ fontFamily: FB, fontSize: 10, color: meta.color, background: meta.color + "18", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>{meta.label}</span>
                    {fact.source === "user_explicit" && <span style={{ fontFamily: FB, fontSize: 10, color: T.taupe }}>You told Nora</span>}
                    {fact.source !== "user_explicit" && <span style={{ fontFamily: FB, fontSize: 10, color: T.taupe }}>Nora learned this</span>}
                  </div>
                </div>
                <button onClick={() => deleteFact(fact.id)} aria-label="Forget this" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                  <Ic.Close s={14} c={T.taupe} w={2}/>
                </button>
              </div>
            );
          })}
          <p style={{ fontFamily: FB, fontSize: 11, color: T.taupe, textAlign: "center", marginTop: 8, lineHeight: 1.6 }}>
            Nora uses these in every conversation 💛
          </p>
        </div>
      )}
    </div>
  );
}

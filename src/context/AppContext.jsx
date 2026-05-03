import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "../utils/firebase";
import { saveData, loadData } from "../utils/firebase";

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar.readonly");

export const AppContext = createContext(null);

export function useApp() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    name:"",avatar:"👩",city:"",role:"",kids:[],partner:"",parents:[],
    inlaws:[],priorities:[],tripGoal:"",fitnessGoal:"",savingsGoal:"",challenge:""
  });
  const [calEvents, setCalEvents] = useState([]);
  const [calConnected, setCalConnected] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [aiTasks, setAiTasks] = useState([]);
  const [streak, setStreak] = useState(1);

  const saveProfile = async (uid, prof) => {
    await saveData(uid, "profile", prof);
  };

  const upd = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const handleAI = (p) => {
    if (p?.tasks) setAiTasks(prev => [...prev, ...p.tasks]);
  };

  const connectCalendar = async () => {
    const token = sessionStorage.getItem("hn_gtoken") || localStorage.getItem("hn_gtoken");
    if (!token) return;
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=20`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      const events = (data.items || []).map(e => ({
        id: e.id, title: e.summary || "Untitled",
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location || "", allDay: !e.start?.dateTime,
      }));
      setCalEvents(events);
      setCalConnected(true);
      sessionStorage.setItem("hn_cal_connected", "1");
    } catch (e) { console.log("Calendar error:", e); }
  };

  const reset = async () => {
    try { await signOut(auth); } catch (e) {}
    setProfile({ avatar: "👩", name: "", city: "", role: "", partner: "", kids: [], parents: [], inlaws: [], siblings: [], priorities: [], tripGoal: "", fitnessGoal: "", savingsGoal: "", challenge: "" });
    setAiTasks([]);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{
      user, setUser, profile, setProfile, upd,
      calEvents, setCalEvents, calConnected, setCalConnected,
      connectCalendar, authChecked, setAuthChecked,
      aiTasks, setAiTasks, handleAI, streak, setStreak,
      saveProfile, reset, auth, googleProvider
    }}>
      {children}
    </AppContext.Provider>
  );
}

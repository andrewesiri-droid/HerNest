import { initializeApp } from "firebase/app";
import type { UserProfile, MemoryFact } from "../types";
import { getFirestore, doc, setDoc, getDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

function deriveSummaryFields(key, data) {
  const u = { lastUpdated: serverTimestamp() };
  if (key === "profile") {
    if (data.name)       u.name       = data.name;
    if (data.avatar)     u.avatar     = data.avatar;
    if (data.role)       u.role       = data.role;
    if (data.priorities) u.priorities = data.priorities?.slice(0, 3);
    const allPeople = [...(data.kids||[]),...(data.parents||[]),...(data.inlaws||[]),...(data.friends||[])];
    const today = new Date();
    u.upcomingBirthdays = allPeople.filter(p => {
      if (!p?.bday) return false;
      const parts = p.bday.split("/"); if (parts.length !== 2) return false;
      const d = new Date(today.getFullYear(), parseInt(parts[0])-1, parseInt(parts[1]));
      if (d < today) d.setFullYear(today.getFullYear()+1);
      return Math.round((d-today)/86400000) <= 14;
    }).map(p => {
      const parts = p.bday.split("/");
      const d = new Date(today.getFullYear(), parseInt(parts[0])-1, parseInt(parts[1]));
      if (d < today) d.setFullYear(today.getFullYear()+1);
      return { name: p.name, daysUntil: Math.round((d-today)/86400000), type: "birthday" };
    }).sort((a,b) => a.daysUntil-b.daysUntil).slice(0,3);
  }
  if (key === "tasks") {
    const pending = (data.tasks||[]).filter(t => !t.done);
    u.pendingTasks  = pending.length;
    u.upcomingTasks = pending.sort((a,b) => (a.dueDay||99)-(b.dueDay||99)).slice(0,3).map(t => ({title:t.text,priority:t.priority,tag:t.tag,type:"task",daysUntil:t.dueDay||0}));
  }
  if (key === "wellness") { const m=data.moods||[]; u.wellnessScore=m.length?Math.round(m.reduce((a,b)=>a+b,0)/m.length*10)/10:0; u.waterToday=data.water||0; }
  if (key === "budget") { const now=new Date(); const ex=(data.expenses||[]).filter(e=>{try{const d=new Date(e.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}catch{return false;}}); u.expensesThisMonth=ex.reduce((s,e)=>s+(e.amount||0),0); }
  if (key === "school") {
    const today=new Date(); const events=data.events||[];
    u.schoolUrgentCount=events.filter(e=>{try{const diff=(new Date(e.date)-today)/864e5;return diff>=0&&diff<=14&&e.requiresAction;}catch{return false;}}).length;
    u.upcomingSchool=events.filter(e=>{try{const diff=(new Date(e.date)-today)/864e5;return diff>=0&&diff<=7;}catch{return false;}}).slice(0,3).map(e=>({title:e.title,date:e.date,child:e.child,type:"school",daysUntil:Math.round((new Date(e.date)-today)/864e5)}));
  }
  if (key === "nora_memory") { u.memoryFactCount=(data.facts||[]).length; }
  return u;
}

export const saveData = async (uid: string, key: string, data: Record<string, unknown>): Promise<void> => {
  if (!uid) return;
  try {
    const summaryFields = deriveSummaryFields(key, data);
    const batch = writeBatch(db);
    batch.set(doc(db,"users",uid,"data",key), data, {merge:true});
    batch.set(doc(db,"users",uid,"summary","latest"), summaryFields, {merge:true});
    await batch.commit();
    try { const cached=JSON.parse(localStorage.getItem(`hn_summary_${uid}`)||"{}"); localStorage.setItem(`hn_summary_${uid}`,JSON.stringify({...cached,...summaryFields,lastUpdated:new Date().toISOString()})); } catch(e) {}
  } catch(e) { console.error("[HerNest] saveData failed:", key, e?.message); }
};

export const loadData = async (uid: string, key: string): Promise<Record<string, unknown> | null> => {
  if (!uid) return null;
  try { const snap = await getDoc(doc(db,"users",uid,"data",key)); return snap.exists() ? snap.data() : null; }
  catch(e) { console.error("[HerNest] loadData failed:", key, e?.message); return null; }
};

export const updateSummary = async (uid: string, updates: Record<string, unknown>): Promise<void> => {
  if (!uid) return;
  try { await setDoc(doc(db,"users",uid,"summary","latest"), {...updates, lastUpdated:new Date().toISOString()}, {merge:true}); }
  catch(e) { console.error("[HerNest] updateSummary failed:", e?.message); }
};

export const loadSummary = async (uid: string): Promise<Record<string, unknown> | null> => {
  if (!uid) return null;
  try { const snap = await getDoc(doc(db,"users",uid,"summary","latest")); return snap.exists() ? snap.data() : null; }
  catch(e) { console.error("[HerNest] loadSummary failed:", e?.message); return null; }
};

export { db, app, auth };

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxUCbZT4sJbsu7tjiJPQSLpFCfhr9gUJg",
  authDomain: "hernest-af2e0.firebaseapp.com",
  projectId: "hernest-af2e0",
  storageBucket: "hernest-af2e0.firebasestorage.app",
  messagingSenderId: "910407116452",
  appId: "1:910407116452:web:376e23e5a8230a0d166831"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Derive summary fields from changed collection
function deriveSummaryFields(key, data) {
  const u = { lastUpdated: new Date().toISOString() };
  if(key==="profile"){if(data.name)u.name=data.name;if(data.avatar)u.avatar=data.avatar;if(data.role)u.role=data.role;}
  if(key==="tasks"){u.pendingTasks=(data.tasks||[]).filter(t=>!t.done).length;}
  if(key==="wellness"){const m=data.moods||[];u.wellnessScore=m.length?Math.round(m.reduce((a,b)=>a+b,0)/m.length*10)/10:0;u.waterToday=data.water||0;}
  if(key==="budget"){const now=new Date();const ex=(data.expenses||[]).filter(e=>{try{const d=new Date(e.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}catch{return false;}});u.expensesThisMonth=ex.reduce((s,e)=>s+(e.amount||0),0);}
  if(key==="school"){const today=new Date();u.schoolUrgentCount=(data.events||[]).filter(e=>{try{const diff=(new Date(e.date)-today)/864e5;return diff>=0&&diff<=14&&e.requiresAction;}catch{return false;}}).length;}
  if(key==="nora_memory"){u.memoryFactCount=(data.facts||[]).length;}
  return u;
}

export const saveData = async (uid, key, data) => {
  if (!uid) return;
  try {
    const summaryFields = deriveSummaryFields(key, data);
    await Promise.all([
      setDoc(doc(db,"users",uid,"data",key), data, {merge:true}),
      setDoc(doc(db,"users",uid,"summary","latest"), summaryFields, {merge:true})
    ]);
    try{const cached=JSON.parse(localStorage.getItem(`hn_summary_${uid}`)||"{}");localStorage.setItem(`hn_summary_${uid}`,JSON.stringify({...cached,...summaryFields}));}catch(e){}
  } catch(e) { /* silent */ }
};

export const loadData = async (uid, key) => {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "users", uid, "data", key));
  return snap.exists() ? snap.data() : null;
};

// Summary document — lightweight home screen data
// Updates key metrics without loading all collections
export const updateSummary = async (uid, updates) => {
  if (!uid) return;
  try {
    await setDoc(doc(db, "users", uid, "summary", "latest"), {
      ...updates,
      lastUpdated: new Date().toISOString(),
    }, { merge: true });
  } catch(e) { /* silent */ }
};

export const loadSummary = async (uid) => {
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, "users", uid, "summary", "latest"));
    return snap.exists() ? snap.data() : null;
  } catch(e) { return null; }
};

export { db, app };

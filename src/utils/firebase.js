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

export const saveData = async (uid, key, data) => {
  if (!uid) return;
  await setDoc(doc(db, "users", uid, "data", key), data, { merge: true });
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

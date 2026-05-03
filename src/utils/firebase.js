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

export { db, app };

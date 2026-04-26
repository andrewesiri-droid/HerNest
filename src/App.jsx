import { useState, useRef, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxUCbZT4sJbsu7tjiJPQSLpFCfhr9gUJg",
  authDomain: "hernest-af2e0.firebaseapp.com",
  projectId: "hernest-af2e0",
  storageBucket: "hernest-af2e0.firebasestorage.app",
  messagingSenderId: "910407116452",
  appId: "1:910407116452:web:376e23e5a8230a0d166831"
};
const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);
const googleProvider = new GoogleAuthProvider();

const saveProfile = async (uid, profile) => {
  try { await setDoc(doc(db,"users",uid),{profile,updatedAt:serverTimestamp()},{merge:true}); } catch(e) {}
};
const loadProfile = async (uid) => {
  try { const s=await getDoc(doc(db,"users",uid)); return s.exists()?s.data().profile:null; } catch(e) { return null; }
};
const saveData = async (uid, key, data) => {
  try { await setDoc(doc(db,"users",uid,"data",key),{...data,updatedAt:serverTimestamp()},{merge:true}); } catch(e) {}
};
const loadData = async (uid, key) => {
  try { const s=await getDoc(doc(db,"users",uid,"data",key)); return s.exists()?s.data():null; } catch(e) { return null; }
};

// ─── FONTS ────────────────────────────────────────────────────────
const fl = document.createElement("link");
fl.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;700&display=swap";
fl.rel = "stylesheet";
document.head.appendChild(fl);

const gs = document.createElement("style");
gs.textContent = `
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
  body{margin:0;background:#1a1410;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}}
  @keyframes breathe{0%,100%{transform:scale(1);opacity:.8;}50%{transform:scale(1.08);opacity:1;}}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
  @keyframes dot{0%,80%,100%{transform:scale(0);opacity:0;}40%{transform:scale(1);opacity:1;}}
  @keyframes slideRight{from{opacity:0;transform:translateX(28px);}to{opacity:1;transform:translateX(0);}}
  @keyframes pop{0%{transform:scale(.9);opacity:0;}100%{transform:scale(1);opacity:1;}}
  @keyframes tabIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  .lift{transition:transform .18s,box-shadow .18s;}
  .lift:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.12)!important;}
  .tab-content{animation:tabIn .22s ease both;}
  input:focus,textarea:focus{border-color:#C49A3C!important;outline:none;}
  ::-webkit-scrollbar{width:0;}
  textarea{resize:none;}
  input{outline:none;}
`;
document.head.appendChild(gs);

// ─── TOKENS ──────────────────────────────────────────────────────
const T={cream:"#FAF6EF",sand:"#F2EBE0",linen:"#E5D9C9",taupe:"#B8A898",bark:"#7A6A5A",esp:"#2E1F14",sage:"#6B9E7A",sageP:"#C8E0CE",gold:"#C49A3C",goldP:"#F0E2B8",blush:"#D4826A",blushP:"#F2D4CA",sky:"#5E9AB8",skyP:"#C4DCEA",teal:"#4A9E9E",tealP:"#C4E8E8",lav:"#8B7EC8",lavP:"#E0DCF5"};
const FD="'Cormorant Garamond','Georgia',serif";
const FB="'DM Sans','Helvetica Neue',sans-serif";
const ESPG="linear-gradient(145deg,#2E1F14,#4a2e18)";
const AIGRAD="linear-gradient(135deg,#1a0e28,#2d1654,#0e1e28)";

// ─── ICONS ───────────────────────────────────────────────────────
const Ic={
  Star:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7H22l-6.2 4.5 2.4 7.2L12 17l-6.2 3.7 2.4-7.2L2 9h7.6L12 2z" stroke={p.c||T.gold} strokeWidth={p.w||1.4} strokeLinejoin="round"/></svg>,
  Home:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H5a1 1 0 01-1-1V10.5z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><path d="M9 22V12h6v10" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/></svg>,
  Sun:     p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke={p.c||T.gold} strokeWidth={p.w||1.5}/>{[0,45,90,135,180,225,270,315].map((a,i)=>{const r=a*Math.PI/180;return<line key={i} x1={12+6.5*Math.cos(r)} y1={12+6.5*Math.sin(r)} x2={12+9*Math.cos(r)} y2={12+9*Math.sin(r)} stroke={p.c||T.gold} strokeWidth={p.w||1.5} strokeLinecap="round"/>})}</svg>,
  Plan:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><line x1="3" y1="10" x2="21" y2="10" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><line x1="8" y1="3" x2="8" y2="7" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><line x1="16" y1="3" x2="16" y2="7" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><circle cx="8" cy="15" r="1.2" fill={p.c||T.esp}/><circle cx="12" cy="15" r="1.2" fill={p.c||T.esp}/><circle cx="16" cy="15" r="1.2" fill={p.c||T.esp} opacity=".35"/></svg>,
  Compass: p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M16 8l-2.5 6L8 16l2.5-6L16 8z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><circle cx="12" cy="12" r="1.5" fill={p.c||T.esp}/></svg>,
  Budget:  p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><line x1="3" y1="20" x2="21" y2="20" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><rect x="4" y="13" width="4" height="7" rx="1" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><rect x="10" y="9" width="4" height="11" rx="1" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><rect x="16" y="5" width="4" height="15" rx="1" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/></svg>,
  Hanger:  p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 4a2 2 0 012 2c0 1.5-2 2.5-2 4" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M12 10L4.5 16.5a2.5 2.5 0 002.5 3.5h10a2.5 2.5 0 002.5-3.5L12 10z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><circle cx="12" cy="4" r="1.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/></svg>,
  People:  p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><circle cx="17" cy="8" r="2.8" stroke={p.c||T.esp} strokeWidth={p.w||1.5} opacity=".5"/><path d="M17 14c2.5.5 5 2.2 5 5.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" opacity=".5"/></svg>,
  Leaf:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 22V12" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M12 12C9 12 5 10 5 5c4 0 7 3 7 7z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><path d="M12 12C15 12 19 10 19 5c-4 0-7 3-7 7z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/></svg>,
  Bell:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M6 10a6 6 0 0112 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><path d="M10 20a2 2 0 004 0" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/></svg>,
  Plus:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round"/></svg>,
  Send:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><line x1="12" y1="19" x2="12" y2="5" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round"/><polyline points="5,12 12,5 19,12" stroke={p.c||"#fff"} strokeWidth={p.w||2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Check:   p=><svg width={p.s||14} height={p.s||14} viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke={p.c||"#fff"} strokeWidth={p.w||2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Back:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><line x1="19" y1="12" x2="5" y2="12" stroke={p.c||T.bark} strokeWidth={p.w||2} strokeLinecap="round"/><polyline points="12,19 5,12 12,5" stroke={p.c||T.bark} strokeWidth={p.w||2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Heart:   p=><svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill={p.filled?p.c||T.blush:"none"}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={p.c||T.blush} strokeWidth={p.w||1.8} strokeLinejoin="round"/></svg>,
  Clock:   p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><polyline points="12,7 12,12 16,14" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Drop:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" stroke={p.c||T.sky} strokeWidth={p.w||1.5} strokeLinejoin="round"/><path d="M8.5 16a3.5 3.5 0 003.5-3" stroke={p.c||T.sky} strokeWidth={p.w||1.5} strokeLinecap="round" opacity=".5"/></svg>,
  Bag:     p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M16 10a4 4 0 01-8 0" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/></svg>,
  Dumbbell:p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5h-2a1 1 0 00-1 1v9a1 1 0 001 1h2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M17.5 6.5h2a1 1 0 011 1v9a1 1 0 01-1 1h-2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><rect x="6.5" y="9" width="11" height="6" rx="1.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><line x1="12" y1="6.5" x2="12" y2="17.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/></svg>,
  Suitcase:p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><rect x="2" y="8" width="20" height="13" rx="2.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M9 8V6a3 3 0 016 0v2" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><line x1="2" y1="13" x2="22" y2="13" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/></svg>,
  Kids:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="3" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M7 22v-5a5 5 0 0110 0v5" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><circle cx="5" cy="10" r="2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} opacity=".45"/><circle cx="19" cy="10" r="2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} opacity=".45"/></svg>,
  Fork:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M3 2v6a3 3 0 006 0V2" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><line x1="6" y1="8" x2="6" y2="22" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M20 2c0 0 1 4 1 7s-2 5-4 5v8" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Trend:   p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/><polyline points="17,6 23,6 23,12" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Flower:  p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/><ellipse cx="12" cy="6.5" rx="2.5" ry="3.5" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/><ellipse cx="12" cy="17.5" rx="2.5" ry="3.5" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/><ellipse cx="6.5" cy="12" rx="3.5" ry="2.5" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/><ellipse cx="17.5" cy="12" rx="3.5" ry="2.5" stroke={p.c||T.blush} strokeWidth={p.w||1.5}/></svg>,
  Moon:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={p.c||T.sky} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Bulb:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M9 21h6M12 3a6 6 0 00-3 11.2V17h6v-2.8A6 6 0 0012 3z" stroke={p.c||T.gold} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Refresh: p=><svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none"><polyline points="23,4 23,10 17,10" stroke={p.c||T.bark} strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" stroke={p.c||T.bark} strokeWidth={p.w||1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Mail:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2.5" stroke={p.c||T.bark} strokeWidth={p.w||1.5}/><polyline points="2,4 12,13 22,4" stroke={p.c||T.bark} strokeWidth={p.w||1.5} strokeLinejoin="round"/></svg>,
  Lock:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2.5" stroke={p.c||T.bark} strokeWidth={p.w||1.5}/><path d="M7 11V7a5 5 0 0110 0v4" stroke={p.c||T.bark} strokeWidth={p.w||1.5} strokeLinecap="round"/><circle cx="12" cy="16" r="1.5" fill={p.c||T.bark}/></svg>,
  Close:   p=><svg width={p.s||16} height={p.s||16} viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke={p.c||T.bark} strokeWidth={p.w||2} strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke={p.c||T.bark} strokeWidth={p.w||2} strokeLinecap="round"/></svg>,
  User:    p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round"/></svg>,
  LogOut:  p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke={p.c||T.blush} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/><polyline points="16,17 21,12 16,7" stroke={p.c||T.blush} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke={p.c||T.blush} strokeWidth={p.w||1.5} strokeLinecap="round"/></svg>,
  Save:    p=><svg width={p.s||20} height={p.s||20} viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke={p.c||"#fff"} strokeWidth={p.w||1.5} strokeLinejoin="round"/><polyline points="17,21 17,13 7,13 7,21" stroke={p.c||"#fff"} strokeWidth={p.w||1.5} strokeLinejoin="round"/><polyline points="7,3 7,8 15,8" stroke={p.c||"#fff"} strokeWidth={p.w||1.5} strokeLinejoin="round"/></svg>,
  Edit:    p=><svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={p.c||T.bark} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={p.c||T.bark} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Trash:   p=><svg width={p.s||18} height={p.s||18} viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke={p.c||T.blush} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke={p.c||T.blush} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke={p.c||T.blush} strokeWidth={p.w||1.5} strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke={p.c||T.blush} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Run:     p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><circle cx="13" cy="4" r="2" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><path d="M7 22l2-6 3 3 4-8" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/><path d="M14 9l2-3 3 1" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Pin:     p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/><circle cx="12" cy="9" r="2.5" stroke={p.c||T.esp} strokeWidth={p.w||1.5}/></svg>,
  Arrow:   p=><svg width={p.s||22} height={p.s||22} viewBox="0 0 24 24" fill="none"><polyline points="9,18 15,12 9,6" stroke={p.c||T.esp} strokeWidth={p.w||1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─── SHARED COMPONENTS ───────────────────────────────────────────
function Card({ch,sx={}}){return <div className="lift" style={{background:"#fff",borderRadius:20,padding:"16px",boxShadow:"0 2px 14px rgba(30,20,10,.07)",border:`1px solid ${T.linen}`,marginBottom:12,...sx}}>{ch}</div>;}
function H2({t,sub,light}){return <div style={{marginBottom:14}}><h2 style={{fontFamily:FD,fontWeight:600,fontSize:20,color:light?"#fff":T.esp,margin:0}}>{t}</h2>{sub&&<p style={{fontFamily:FB,fontSize:12,color:light?"rgba(255,255,255,.45)":T.taupe,margin:"3px 0 0"}}>{sub}</p>}</div>;}
function Pill({ch,on,active,color}){return <button onClick={on} style={{flexShrink:0,border:"none",cursor:"pointer",padding:"7px 14px",borderRadius:20,fontFamily:FB,fontSize:12,fontWeight:500,background:active?(color||T.esp):T.sand,color:active?"#fff":T.bark,transition:"all .15s"}}>{ch}</button>;}
function Tag({ch,c=T.bark}){return <span style={{fontSize:10,fontFamily:FB,fontWeight:700,letterSpacing:1.1,textTransform:"uppercase",color:c,padding:"2px 8px",background:c+"18",borderRadius:20}}>{ch}</span>;}
function AIBadge({t}){return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",color:T.gold,background:T.goldP,padding:"3px 10px",borderRadius:20}}><Ic.Star s={10} c={T.gold} w={1.4}/> {t}</span>;}
function Tile({ic:IC,c=T.bark,bg=T.sand,s=18,ts=36,r=11}){return <div style={{width:ts,height:ts,borderRadius:r,background:bg,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><IC s={s} c={c} w={1.5}/></div>;}
function Spinner(){return <div style={{width:18,height:18,border:"2.5px solid rgba(255,255,255,.25)",borderTop:"2.5px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>;}
function Dots(){return <div style={{display:"flex",gap:4,padding:"4px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(255,255,255,.4)",animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>;}
function FInput({label,placeholder,value,onChange,type="text",icon:IC}){return <div style={{marginBottom:14}}>{label&&<label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>{label}</label>}<div style={{position:"relative"}}>{IC&&<div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",display:"flex"}}><IC s={16} c={T.taupe} w={1.5}/></div>}<input type={type} placeholder={placeholder} value={value} onChange={onChange} style={{width:"100%",fontFamily:FB,fontSize:14,padding:IC?"12px 14px 12px 42px":"12px 16px",borderRadius:14,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,transition:"border-color .15s"}}/></div></div>;}
function ProgressBar({value,max,color=T.sage}){const pct=Math.min(Math.round((value/max)*100),100);return <div style={{background:T.linen,borderRadius:10,height:8,overflow:"hidden"}}><div style={{background:pct>90?T.blush:pct>70?T.gold:color,height:"100%",width:`${pct}%`,borderRadius:10,transition:"width .5s"}}/></div>;}

// ─── API ─────────────────────────────────────────────────────────
async function claude(sys,msg,hist=[]){
  try{
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:sys,messages:[...hist,{role:"user",content:msg}]})
    });
    if(!res.ok) throw new Error(`API error ${res.status}`);
    const d=await res.json();
    if(d.error) throw new Error(d.error.message||"API error");
    return d.content?.map(b=>b.text||"").join("")||"";
  }catch(e){
    console.error("Claude API error:",e);
    throw e;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 1. PLAN / TASK MANAGER — fully interactive
// ═══════════════════════════════════════════════════════════════════
function PlanScreen({aiTasks,profile,uid}){
  const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today=new Date();
  const [selectedDay,setSelectedDay]=useState(today.getDay());
  const DEFAULT_TASKS=[];
  const [tasks,setTasks]=useState(()=>{
    try{const s=sessionStorage.getItem("hn_tasks");return s?JSON.parse(s):DEFAULT_TASKS;}catch(e){return DEFAULT_TASKS;}
  });
  const [inp,setInp]=useState("");
  const [selTag,setSelTag]=useState("Family");
  const [selPri,setSelPri]=useState("medium");
  const [filter,setFilter]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const [selRecur,setSelRecur]=useState("none");
  const [meals,setMeals]=useState({Mon:{b:"Greek yoghurt & berries",l:"Salmon quinoa bowl",d:"Chicken stir-fry"},Tue:{b:"Avocado toast & eggs",l:"Caesar salad wrap",d:"Pasta primavera"},Wed:{b:"Overnight oats",l:"Sushi platter",d:"Grilled sea bass"}});
  const [editMeal,setEditMeal]=useState(null);
  const [mealDay,setMealDay]=useState("Mon");

  // Save tasks to session storage whenever they change
  useEffect(()=>{
    try{sessionStorage.setItem("hn_tasks",JSON.stringify(tasks));}catch(e){}
    if(uid) saveData(uid,"tasks",{tasks}).catch(()=>{});
  },[tasks]);

  // Load tasks from Firebase on mount
  useEffect(()=>{
    if(!uid)return;
    loadData(uid,"tasks").then(d=>{
      if(d?.tasks?.length) setTasks(d.tasks);
    }).catch(()=>{});
  },[uid]);

  useEffect(()=>{
    if(aiTasks?.length){
      setTasks(prev=>{const ex=prev.map(t=>t.text);const nw=aiTasks.filter(t=>!ex.includes(t.text)).map((t,i)=>({id:Date.now()+i,...t,done:false,priority:"medium",dueDay:today.getDay()}));return [...prev,...nw];});
    }
  },[aiTasks]);

  const add=()=>{
    if(!inp.trim())return;
    const base={id:Date.now(),text:inp,done:false,tag:selTag,priority:selPri,dueDay:selectedDay,recur:selRecur};
    if(selRecur==="daily"){
      const newTasks=[0,1,2,3,4,5,6].map((d,i)=>({...base,id:Date.now()+i,dueDay:d}));
      setTasks(p=>[...p,...newTasks]);
    } else if(selRecur==="weekdays"){
      const newTasks=[1,2,3,4,5].map((d,i)=>({...base,id:Date.now()+i,dueDay:d}));
      setTasks(p=>[...p,...newTasks]);
    } else if(selRecur==="weekly"){
      setTasks(p=>[...p,base]);
    } else {
      setTasks(p=>[...p,base]);
    }
    setInp("");setShowAdd(false);setSelRecur("none");
  };
  const toggle=id=>setTasks(p=>p.map(t=>t.id===id?{...t,done:!t.done}:t));
  const del=id=>setTasks(p=>p.filter(t=>t.id!==id));
  const tC=t=>t==="Work"?T.sky:t==="Family"?T.sage:t==="Me"?T.blush:t==="Travel"?T.teal:T.gold;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Family"?Ic.Kids:t==="Me"?Ic.Leaf:t==="Travel"?Ic.Suitcase:Ic.Home;
  const pColor=p=>p==="high"?T.blush:p==="medium"?T.gold:T.sage;
  const dayTasks=tasks.filter(t=>t.dueDay===selectedDay);
  const visible=filter==="All"?dayTasks:dayTasks.filter(t=>t.tag===filter);
  const donePct=tasks.length?Math.round((tasks.filter(t=>t.done).length/tasks.length)*100):0;

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Header */}
      <div style={{background:ESPG,borderRadius:22,padding:"20px 20px 18px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)",letterSpacing:2,textTransform:"uppercase",margin:0}}>Command Centre</p>
            <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:"#fff",margin:"4px 0 2px",fontWeight:400}}>Today's Plan</h2>
          </div>
          <div style={{textAlign:"center",background:"rgba(255,255,255,.1)",borderRadius:14,padding:"10px 14px"}}>
            <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:T.gold}}>{donePct}%</div>
            <div style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>done</div>
          </div>
        </div>
        <div style={{marginTop:14,background:"rgba(255,255,255,.08)",borderRadius:10,height:6}}>
          <div style={{background:`linear-gradient(90deg,${T.gold},${T.sage})`,height:"100%",borderRadius:10,width:`${donePct}%`,transition:"width .5s"}}/>
        </div>
      </div>

      {/* Day selector */}
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto"}}>
        {Array.from({length:7},(_,i)=>{
          const d=new Date(today);d.setDate(today.getDate()-today.getDay()+i);
          const isT=i===today.getDay();const isSel=i===selectedDay;
          const cnt=tasks.filter(t=>t.dueDay===i&&!t.done).length;
          return(
            <div key={i} onClick={()=>setSelectedDay(i)} style={{flexShrink:0,width:48,borderRadius:14,padding:"8px 0",textAlign:"center",cursor:"pointer",background:isSel?T.esp:isT?T.goldP:T.sand,border:isSel?"none":`1px solid ${T.linen}`,position:"relative"}}>
              <div style={{fontFamily:FB,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:isSel?T.gold:T.bark}}>{DAYS[i]}</div>
              <div style={{fontFamily:FD,fontSize:18,fontWeight:600,color:isSel?"#fff":T.esp,marginTop:2}}>{d.getDate()}</div>
              {cnt>0&&<div style={{position:"absolute",top:4,right:6,width:16,height:16,borderRadius:"50%",background:T.blush,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,fontSize:9,fontWeight:700,color:"#fff"}}>{cnt}</div>}
            </div>
          );
        })}
      </div>

      {/* Add task */}
      <button onClick={()=>setShowAdd(!showAdd)} style={{width:"100%",background:showAdd?T.esp:T.sand,border:`1.5px solid ${showAdd?T.esp:T.linen}`,borderRadius:14,padding:"11px 16px",fontFamily:FB,fontSize:13,color:showAdd?"#fff":T.bark,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:10,transition:"all .15s"}}>
        <Ic.Plus s={18} c={showAdd?"#fff":T.bark} w={2}/>{showAdd?"Cancel":"Add a task"}
      </button>

      {showAdd&&(
        <div style={{background:"#fff",borderRadius:18,padding:"16px",marginBottom:12,border:`1.5px solid ${T.gold}`,animation:"pop .2s ease both"}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="What needs to get done?" autoFocus
            style={{width:"100%",fontFamily:FB,fontSize:14,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:12}}/>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {["Family","Work","Me","Home","Travel"].map(t=>(
              <button key={t} onClick={()=>setSelTag(t)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${selTag===t?tC(t):T.linen}`,background:selTag===t?tC(t)+"18":"transparent",fontFamily:FB,fontSize:11,color:selTag===t?tC(t):T.bark,cursor:"pointer"}}>{t}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {["high","medium","low"].map(p=>(
              <button key={p} onClick={()=>setSelPri(p)} style={{flex:1,padding:"6px",borderRadius:10,border:`1.5px solid ${selPri===p?pColor(p):T.linen}`,background:selPri===p?pColor(p)+"18":"transparent",fontFamily:FB,fontSize:11,color:selPri===p?pColor(p):T.bark,cursor:"pointer",textTransform:"capitalize"}}>{p}</button>
            ))}
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Repeat</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["none","Once"],["weekdays","Weekdays"],["daily","Every day"],["weekly","Weekly"]].map(([v,lb])=>(
                <button key={v} onClick={()=>setSelRecur(v)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${selRecur===v?T.teal:T.linen}`,background:selRecur===v?T.tealP:"#fff",fontFamily:FB,fontSize:11,color:selRecur===v?T.teal:T.bark,cursor:"pointer"}}>{lb}</button>
              ))}
            </div>
          </div>
          <button onClick={add} disabled={!inp.trim()} style={{width:"100%",background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",opacity:inp.trim()?1:.4}}>Add Task{selRecur!=="none"?" (Recurring)":""}</button>
        </div>
      )}

      {/* Filters */}
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:12}}>
        {["All","Family","Work","Me","Home","Travel"].map(t=><Pill key={t} ch={t} active={filter===t} on={()=>setFilter(t)}/>)}
      </div>

      {/* Tasks */}
      {visible.length===0?(
        <div style={{textAlign:"center",padding:"32px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>✨</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp,margin:"0 0 8px"}}>Your day is clear</p>
          <p style={{fontFamily:FB,fontSize:13,color:T.taupe,margin:"0 0 16px",lineHeight:1.6}}>Add a task above or ask Nora to plan your day</p>
          <button onClick={()=>setShowAdd(true)} style={{background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add your first task</button>
        </div>
      ):visible.map(t=>{
        const tc=tC(t.tag);const TIC=tIC(t.tag);
        return(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1.5px solid ${t.done?T.sageP:T.linen}`,transition:"all .2s"}}>
            <button onClick={()=>toggle(t.id)} style={{width:26,height:26,borderRadius:"50%",flexShrink:0,background:t.done?T.sage:T.linen,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
              {t.done&&<Ic.Check s={13} c="#fff" w={2.5}/>}
            </button>
            <Tile ic={TIC} c={tc} bg={tc+"18"} s={15} ts={30} r={9}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,color:t.done?T.taupe:T.esp,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
              <div style={{display:"flex",gap:6,marginTop:4}}>
                <Tag ch={t.tag} c={tc}/>
                {t.recur&&t.recur!=="none"&&<span style={{fontFamily:FB,fontSize:9,color:T.teal,background:T.tealP,borderRadius:10,padding:"2px 7px"}}>🔁</span>}
                <Tag ch={t.priority} c={pColor(t.priority)}/>
              </div>
            </div>
            <button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",padding:4,flexShrink:0}}><Ic.Trash s={15} c={T.taupe} w={1.5}/></button>
          </div>
        );
      })}

      {/* Meal Planner */}
      <div style={{marginTop:20}}>
        <H2 t="Meal Planner" sub="Tap any meal to edit"/>
        <div style={{display:"flex",gap:6,marginBottom:12,overflowX:"auto"}}>
          {Object.keys(meals).map(d=><Pill key={d} ch={d} active={mealDay===d} on={()=>setMealDay(d)}/>)}
          <button onClick={()=>{const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];const next=days[days.indexOf(mealDay)+1]||days[0];if(!meals[next])setMeals(p=>({...p,[next]:{b:"",l:"",d:""}}));setMealDay(next);}} style={{flexShrink:0,border:`1px dashed ${T.linen}`,background:"transparent",borderRadius:20,padding:"7px 14px",fontFamily:FB,fontSize:12,color:T.taupe,cursor:"pointer"}}>+ Day</button>
        </div>
        <Card ch={
          <div>
            {[["🌅","Breakfast",meals[mealDay]?.b||""],["☀️","Lunch",meals[mealDay]?.l||""],["🌙","Dinner",meals[mealDay]?.d||""]].map(([em,lb,val])=>(
              <div key={lb} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:lb!=="Dinner"?`1px solid ${T.linen}`:"none"}}>
                <span style={{fontSize:18,flexShrink:0}}>{em}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.taupe,marginBottom:3}}>{lb}</div>
                  {editMeal===`${mealDay}-${lb}`?(
                    <input autoFocus defaultValue={val} onBlur={e=>{setMeals(p=>({...p,[mealDay]:{...p[mealDay],[lb==="Breakfast"?"b":lb==="Lunch"?"l":"d"]:e.target.value}}));setEditMeal(null);}} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"6px 10px",borderRadius:8,border:`1.5px solid ${T.gold}`,color:T.esp}}/>
                  ):(
                    <div onClick={()=>setEditMeal(`${mealDay}-${lb}`)} style={{fontFamily:FB,fontSize:13,color:val?T.esp:T.taupe,fontStyle:val?"normal":"italic",cursor:"pointer"}}>{val||"Tap to add meal…"}</div>
                  )}
                </div>
                <button onClick={()=>setEditMeal(`${mealDay}-${lb}`)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Edit s={15} c={T.taupe} w={1.5}/></button>
              </div>
            ))}
          </div>
        }/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. TRIP PLANNER — fully interactive with AI
// ═══════════════════════════════════════════════════════════════════
function TripsScreen({uid,profile}){
  const [trips,setTrips]=useState([]);
  const [activeTrip,setActiveTrip]=useState(0);
  const [showNewTrip,setShowNewTrip]=useState(false);
  const [editMode,setEditMode]=useState(false);
  const [planning,setPlanning]=useState(false);
  const [planData,setPlanData]=useState({});

  // New trip form state
  const [newDest,setNewDest]=useState("");
  const [newDate,setNewDate]=useState("");
  const [newNights,setNewNights]=useState("");
  const [newBudget,setNewBudget]=useState("");
  const [newStatus,setNewStatus]=useState("Planning");
  const [newTravellers,setNewTravellers]=useState(2);

  // Load/save Firebase
  useEffect(()=>{
    if(!uid)return;
    loadData(uid,"trips").then(d=>{if(d?.trips?.length){setTrips(d.trips);if(d.planData)setPlanData(d.planData);}}).catch(()=>{});
  },[uid]);
  useEffect(()=>{
    if(uid&&trips.length)saveData(uid,"trips",{trips,planData}).catch(()=>{});
  },[trips,planData,uid]);

  const trip=trips[activeTrip];
  const updateTrip=(f,v)=>setTrips(p=>p.map((t,i)=>i===activeTrip?{...t,[f]:v}:t));
  const deleteTrip=()=>{if(trips.length<=1){setTrips([]);setActiveTrip(0);}else{setTrips(p=>p.filter((_,i)=>i!==activeTrip));setActiveTrip(0);}};

  const addTrip=async()=>{
    if(!newDest.trim())return;
    const who=[profile?.name?.split(" ")[0]||"Me",...(profile?.partner?[profile.partner]:[]),...(profile?.kids||[]).map(k=>k.name)];
    const t={id:Date.now(),dest:newDest,flag:"🌍",nights:parseInt(newNights)||7,travellers:newTravellers,budget:parseInt(newBudget)||5000,spent:0,status:newStatus,departDate:newDate,whosComing:who.slice(0,newTravellers),checklist:[{item:"Book flights",done:false},{item:"Book accommodation",done:false},{item:"Travel insurance",done:false},{item:"Visas and passports",done:false},{item:"Kids vaccinations check",done:false}],packing:{Mum:[],Kids:[],Everyone:[]}};
    const newIdx=trips.length;
    setTrips(p=>[...p,t]);
    setActiveTrip(newIdx);
    setShowNewTrip(false);
    setNewDest("");setNewDate("");setNewNights("");setNewBudget("");setNewStatus("Planning");
    // Auto-plan immediately
    await planTrip(t);
  };

  const planTrip=async(t)=>{
    const tripData=t||trip;
    if(!tripData)return;
    setPlanning(true);
    const who=(tripData.whosComing||[]).join(", ")||`${tripData.travellers||2} travellers`;
    const kids=(profile?.kids||[]);
    const kidsCtx=kids.length?`Kids: ${kids.map(k=>`${k.name} (${k.age||"?"})`).join(", ")}.`:"";
    const sys=`You are Nora, expert family travel concierge. Return ONLY valid JSON:
{"overview":"2 sentence exciting trip summary","familyTip":"one practical family travel tip","highlights":["","",""],"days":[{"day":1,"title":"","plan":"full day description in 2 sentences","highlight":"best moment of the day","kidsFriendly":"best activity for kids"}],"packing":{"Mum":["","","","",""],"Kids":["","","","",""],"Everyone":["","","",""]},"checklist":["","","","","",""],"budget":[{"cat":"","amount":"","tip":""}],"bookingTips":"one sentence on best way to book this trip"}`;
    const prompt=`Plan a ${tripData.nights||7} night trip to ${tripData.dest} for ${who}. ${kidsCtx} Total budget: $${tripData.budget||5000}. Departure: ${tripData.departDate||"soon"}. Make it family-friendly, practical and exciting. Include specific local recommendations.`;
    try{
      const raw=await claude(sys,prompt);
      const data=JSON.parse(raw.replace(/```json|```/g,"").trim());
      setPlanData(p=>({...p,[tripData.id]:data}));
    }catch(e){
      setPlanData(p=>({...p,[tripData.id]:{overview:`An incredible ${tripData.nights||7}-night adventure to ${tripData.dest} awaits! Get ready for memories that will last a lifetime.`,familyTip:"Book accommodation with a kitchen to save on meals and give kids a home base.",highlights:["Explore local markets","Family beach days","Cultural experiences"],days:[{day:1,title:"Arrival & Explore",plan:"Arrive and settle into your accommodation. Take a gentle walk to get your bearings and find a great local restaurant for dinner.",highlight:"First sunset in a new place",kidsFriendly:"Let kids pick dinner from a local menu"},{day:2,title:"Adventure Day",plan:"Full day exploring the main attractions. Start early to beat the crowds and take a midday break for naps or swimming.",highlight:"Main attraction visit",kidsFriendly:"Look for playgrounds near major sites"}],packing:{Mum:["Swimwear","Sunscreen SPF50","Linen dresses","Comfortable walking shoes","Power bank"],Kids:["Rashvests","Sunhats","Snacks","Favourite toy","Sandals"],Everyone:["Passports","Travel insurance docs","First aid kit","Reusable water bottles"]},checklist:["Book flights","Book accommodation","Purchase travel insurance","Check visa requirements","See doctor for vaccinations","Download offline maps"],budget:[{cat:"Flights",amount:`$${Math.round((tripData.budget||5000)*0.35).toLocaleString()}`,tip:"Book 3+ months ahead for best prices"},{cat:"Accommodation",amount:`$${Math.round((tripData.budget||5000)*0.3).toLocaleString()}`,tip:"Look for family rooms or apartments"},{cat:"Food & Dining",amount:`$${Math.round((tripData.budget||5000)*0.2).toLocaleString()}`,tip:"Mix local restaurants with self-catering"},{cat:"Activities",amount:`$${Math.round((tripData.budget||5000)*0.15).toLocaleString()}`,tip:"Book popular attractions in advance"}],bookingTips:"Use Skyscanner for flights and Booking.com for family-friendly accommodation with free cancellation."}}));
    }
    setPlanning(false);
  };

  const plan=planData[trip?.id];
  const checkDone=(trip?.checklist||[]).filter(c=>c.done).length;
  const budgetPct=Math.round(((trip?.spent||0)/(trip?.budget||5000))*100);
  const familyMembers=[
    {name:profile?.name?.split(" ")[0]||"Me",emoji:"👩"},
    ...(profile?.partner?[{name:profile.partner,emoji:"👨"}]:[]),
    ...(profile?.kids||[]).map(k=>({name:k.name,emoji:"👧"})),
    ...(profile?.parents||[]).map(p=>({name:p.name,emoji:"👴"})),
  ];

  if(!trips.length) return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{background:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",borderRadius:22,padding:"28px 24px",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>✈️</div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:"#fff",margin:"0 0 8px",fontWeight:400}}>Where to next?</h2>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.5)",margin:"0 0 20px",lineHeight:1.6}}>Add your first trip and Nora will plan every detail — itinerary, packing list, budget and more.</p>
        <button onClick={()=>setShowNewTrip(true)} style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:14,padding:"13px 24px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
          <Ic.Plus s={18} c="#fff" w={2}/>Add Your First Trip
        </button>
      </div>
      {showNewTrip&&<NewTripForm profile={profile} familyMembers={familyMembers} onAdd={addTrip} onCancel={()=>setShowNewTrip(false)} newDest={newDest} setNewDest={setNewDest} newDate={newDate} setNewDate={setNewDate} newNights={newNights} setNewNights={setNewNights} newBudget={newBudget} setNewBudget={setNewBudget} newStatus={newStatus} setNewStatus={setNewStatus} newTravellers={newTravellers} setNewTravellers={setNewTravellers}/>}
    </div>
  );

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Trip selector */}
      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:12,paddingBottom:4}}>
        {trips.map((t,i)=>(
          <button key={t.id} onClick={()=>{setActiveTrip(i);setEditMode(false);}} style={{flexShrink:0,background:activeTrip===i?"linear-gradient(135deg,#0e2a1e,#1a5a3a)":"#fff",border:`1.5px solid ${activeTrip===i?"transparent":T.linen}`,borderRadius:12,padding:"8px 14px",fontFamily:FB,fontSize:12,fontWeight:700,color:activeTrip===i?"#fff":T.bark,cursor:"pointer"}}>
            {t.flag} {t.dest.split(",")[0]}
          </button>
        ))}
        <button onClick={()=>setShowNewTrip(true)} style={{flexShrink:0,background:T.sand,border:`1.5px dashed ${T.linen}`,borderRadius:12,padding:"8px 14px",fontFamily:FB,fontSize:12,color:T.taupe,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
          <Ic.Plus s={14} c={T.taupe} w={2}/>New
        </button>
      </div>

      {showNewTrip&&<NewTripForm profile={profile} familyMembers={familyMembers} onAdd={addTrip} onCancel={()=>setShowNewTrip(false)} newDest={newDest} setNewDest={setNewDest} newDate={newDate} setNewDate={setNewDate} newNights={newNights} setNewNights={setNewNights} newBudget={newBudget} setNewBudget={setNewBudget} newStatus={newStatus} setNewStatus={setNewStatus} newTravellers={newTravellers} setNewTravellers={setNewTravellers}/>}

      {/* Trip hero */}
      <div style={{background:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",borderRadius:22,padding:"20px",marginBottom:14,color:"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.4)",letterSpacing:2,textTransform:"uppercase"}}>{trip.status}</span>
              {trip.departDate&&<span style={{fontFamily:FB,fontSize:10,color:T.gold}}>· {new Date(trip.departDate).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"})}</span>}
            </div>
            <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:"#fff",margin:"0 0 4px",fontWeight:400}}>{trip.dest}</h2>
            <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.5)",margin:0}}>
              {(trip.whosComing||[]).join(" · ")||`${trip.travellers} travellers`} · {trip.nights} nights
            </p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div style={{textAlign:"center",background:"rgba(255,255,255,.1)",borderRadius:14,padding:"10px 12px"}}>
              <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:T.gold}}>{trip.nights}</div>
              <div style={{fontFamily:FB,fontSize:8,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>nights</div>
            </div>
            <button onClick={()=>setEditMode(!editMode)} style={{width:40,height:40,borderRadius:12,background:editMode?"rgba(196,154,60,.2)":"rgba(255,255,255,.1)",border:`1px solid ${editMode?"rgba(196,154,60,.4)":"rgba(255,255,255,.15)"}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic.Edit s={16} c={editMode?T.gold:"rgba(255,255,255,.7)"} w={1.5}/>
            </button>
          </div>
        </div>

        {/* Edit panel */}
        {editMode&&<div style={{background:"rgba(255,255,255,.08)",borderRadius:14,padding:"14px",marginBottom:12,border:"1px solid rgba(255,255,255,.1)"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <label style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:4}}>Destination</label>
              <input value={trip.dest} onChange={e=>updateTrip("dest",e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"9px 10px",borderRadius:9,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff"}}/>
            </div>
            <div>
              <label style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:4}}>Depart date</label>
              <input type="date" value={trip.departDate||""} onChange={e=>updateTrip("departDate",e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:12,padding:"9px 10px",borderRadius:9,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff"}}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div>
              <label style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:4}}>Nights</label>
              <input type="text" inputMode="numeric" defaultValue={trip.nights||7} onBlur={e=>updateTrip("nights",parseInt(e.target.value)||7)} placeholder="e.g. 7" style={{width:"100%",fontFamily:FB,fontSize:14,fontWeight:700,padding:"9px 10px",borderRadius:9,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff"}}/>
            </div>
            <div>
              <label style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:4}}>Budget ($)</label>
              <input type="text" inputMode="numeric" defaultValue={trip.budget||5000} onBlur={e=>updateTrip("budget",parseInt(e.target.value)||5000)} placeholder="e.g. 5000" style={{width:"100%",fontFamily:FB,fontSize:14,fontWeight:700,padding:"9px 10px",borderRadius:9,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff"}}/>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase",display:"block",marginBottom:6}}>Who is coming</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {familyMembers.map((person,i)=>{
                const coming=(trip.whosComing||[]).includes(person.name);
                return(
                  <button key={i} onClick={()=>{
                    const current=trip.whosComing||[];
                    const updated=coming?current.filter(n=>n!==person.name):[...current,person.name];
                    updateTrip("whosComing",updated);
                    updateTrip("travellers",Math.max(1,updated.length));
                  }} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${coming?"rgba(196,154,60,.8)":"rgba(255,255,255,.2)"}`,background:coming?"rgba(196,154,60,.2)":"transparent",cursor:"pointer"}}>
                    <span style={{fontSize:14}}>{person.emoji}</span>
                    <span style={{fontFamily:FB,fontSize:11,color:coming?T.gold:"rgba(255,255,255,.5)"}}>{person.name}</span>
                    {coming&&<Ic.Check s={10} c={T.gold} w={2.5}/>}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {["Dreaming","Planning","Booked","Completed"].map(s=><button key={s} onClick={()=>updateTrip("status",s)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${trip.status===s?"rgba(196,154,60,.8)":"rgba(255,255,255,.2)"}`,background:trip.status===s?"rgba(196,154,60,.2)":"transparent",fontFamily:FB,fontSize:11,color:trip.status===s?T.gold:"rgba(255,255,255,.5)",cursor:"pointer"}}>{s}</button>)}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setEditMode(false);planTrip();}} style={{flex:2,background:`linear-gradient(135deg,${T.gold},#8B6914)`,border:"none",borderRadius:10,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>✨ Re-plan with Nora</button>
            <button onClick={()=>{if(window.confirm("Delete this trip?"))deleteTrip();}} style={{flex:1,background:"rgba(212,130,106,.15)",border:"1px solid rgba(212,130,106,.3)",borderRadius:10,padding:"10px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.blush,cursor:"pointer"}}>Delete</button>
          </div>
        </div>}

        {/* Budget bar */}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)"}}>Budget used</span>
          <span style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.7)"}}>${(trip.spent||0).toLocaleString()} / ${(trip.budget||5000).toLocaleString()}</span>
        </div>
        <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,height:6}}>
          <div style={{background:T.gold,borderRadius:10,height:6,width:`${Math.min(budgetPct,100)}%`,transition:"width .5s"}}/>
        </div>
      </div>

      {/* Planning loader */}
      {planning&&<div style={{textAlign:"center",padding:"32px 20px",background:T.sand,borderRadius:18,marginBottom:14}}>
        <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",animation:"breathe 2s ease-in-out infinite"}}><Ic.Compass s={22} c="#fff" w={1.4}/></div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 4px"}}>Nora is planning your trip…</p>
        <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:0}}>Building your itinerary, packing list and budget</p>
      </div>}

      {/* AI Plan — full overview */}
      {plan&&!planning&&<div>
        {/* Overview */}
        <div style={{background:"linear-gradient(135deg,#1a3a2e,#2d6a54)",borderRadius:18,padding:"18px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <AIBadge t="Nora's Plan"/>
            <button onClick={()=>{const ls=[];ls.push("✈️ "+trip.dest+" — "+trip.nights+" nights");ls.push("");(plan.highlights||[]).forEach((h,i)=>ls.push((i+1)+". "+h));ls.push("");(plan.days||[]).forEach(d=>ls.push("Day "+d.day+": "+d.title));ls.push("");(plan.budget||[]).forEach(b=>ls.push(b.cat+": "+b.amount));ls.push("");ls.push("Mum: "+(plan.packing?.Mum||[]).join(", "));ls.push("Kids: "+(plan.packing?.Kids||[]).join(", "));ls.push("HerNest ✨");const txt=ls.join("\n");if(navigator.share){navigator.share({title:trip.dest,text:txt}).catch(()=>{});}else{navigator.clipboard.writeText(txt).catch(()=>{});alert("Copied to clipboard!");}}} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",borderRadius:10,padding:"6px 14px",fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>📤 Share</button>
          </div>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.8)",margin:"0 0 10px",lineHeight:1.7}}>{plan.overview}</p>
          {plan.familyTip&&<div style={{background:"rgba(255,255,255,.1)",borderRadius:10,padding:"8px 12px",display:"flex",gap:8}}>
            <span>👨‍👩‍👧</span><p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.75)",margin:0,lineHeight:1.5}}>{plan.familyTip}</p>
          </div>}
        </div>

        {/* Book now */}
        <div style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,borderRadius:16,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>Ready to book?</div>
            <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.75)"}}>{plan.bookingTips||"Start with flights, then accommodation"}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {[{lb:"Flights",url:"https://www.skyscanner.com",emoji:"✈️"},{lb:"Hotels",url:"https://www.booking.com",emoji:"🏨"},{lb:"Activities",url:"https://www.viator.com",emoji:"🎡"}].map(b=>(
              <button key={b.lb} onClick={()=>window.open(b.url,"_blank")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",borderRadius:10,padding:"8px 10px",textAlign:"center",cursor:"pointer"}}>
                <div style={{fontSize:16}}>{b.emoji}</div>
                <div style={{fontFamily:FB,fontSize:9,color:"#fff",fontWeight:700,marginTop:2}}>{b.lb}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Share plan button */}
        <button onClick={()=>{
          const lines=[];
          lines.push("✈️ "+trip.dest+" — "+trip.nights+" nights");
          lines.push("");
          lines.push("📋 HIGHLIGHTS");
          (plan.highlights||[]).forEach((h,i)=>lines.push((i+1)+". "+h));
          lines.push("");
          lines.push("📅 ITINERARY");
          (plan.days||[]).forEach(d=>lines.push("Day "+d.day+": "+d.title));
          lines.push("");
          lines.push("💰 BUDGET");
          (plan.budget||[]).forEach(b=>lines.push(b.cat+": "+b.amount));
          lines.push("");
          lines.push("🎒 PACKING");
          lines.push("Mum: "+(plan.packing?.Mum||[]).join(", "));
          lines.push("Kids: "+(plan.packing?.Kids||[]).join(", "));
          lines.push("Everyone: "+(plan.packing?.Everyone||[]).join(", "));
          lines.push("");
          lines.push("Planned by Nora via HerNest ✨");
          const txt=lines.join("\n");

          if(navigator.share){navigator.share({title:trip.dest+" Trip Plan",text:txt}).catch(()=>{});}
          else{navigator.clipboard.writeText(txt).then(()=>alert("Copied to clipboard!")).catch(()=>{});}
        }} style={{width:"100%",background:"#fff",border:`1.5px solid ${T.linen}`,borderRadius:14,padding:"12px",fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke={T.esp} strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke={T.esp} strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke={T.esp} strokeWidth="1.8"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={T.esp} strokeWidth="1.8" strokeLinecap="round"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={T.esp} strokeWidth="1.8" strokeLinecap="round"/></svg>
          Share Trip Plan
        </button>

        {/* Highlights */}
        {plan.highlights?.length>0&&<Card ch={<div>
          <H2 t="Trip Highlights"/>
          {plan.highlights.map((h,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<plan.highlights.length-1?`1px solid ${T.linen}`:"none"}}>
              <span style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold,flexShrink:0}}>{i+1}.</span>
              <span style={{fontFamily:FB,fontSize:13,color:T.bark,lineHeight:1.5}}>{h}</span>
            </div>
          ))}
        </div>}/>}

        {/* Day by day */}
        <H2 t="Day by Day" sub="Your full itinerary"/>
        {plan.days?.map((d,i)=>(
          <Card key={i} ch={<div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:T.goldP,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FD,fontSize:15,fontWeight:700,color:T.gold,flexShrink:0}}>{d.day}</div>
              <span style={{fontFamily:FD,fontSize:16,fontWeight:600,color:T.esp}}>{d.title}</span>
            </div>
            <FieldEditor value={d.plan} onChange={v=>setPlanData(p=>({...p,[trip.id]:{...p[trip.id],days:p[trip.id].days.map((day,di)=>di===i?{...day,plan:v}:day)}}))}/>
            {d.highlight&&<div style={{background:T.goldP,borderRadius:10,padding:"7px 12px",marginBottom:6,display:"flex",gap:8}}>
              <span>⭐</span><p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,fontStyle:"italic"}}>{d.highlight}</p>
            </div>}
            {d.kidsFriendly&&<div style={{background:T.sageP,borderRadius:10,padding:"7px 12px",display:"flex",gap:8}}>
              <span>👧</span><p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,fontStyle:"italic"}}>Kids: {d.kidsFriendly}</p>
            </div>}
          </div>}/>
        ))}

        {/* Budget breakdown */}
        {plan.budget?.length>0&&<Card ch={<div>
          <H2 t="Budget Breakdown"/>
          {plan.budget.map((b,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom:i<plan.budget.length-1?`1px solid ${T.linen}`:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                <span style={{fontFamily:FB,fontSize:13,color:T.esp,fontWeight:600}}>{b.cat}</span>
                <span style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold}}>{b.amount}</span>
              </div>
              {b.tip&&<p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:0,fontStyle:"italic"}}>{b.tip}</p>}
            </div>
          ))}
        </div>}/>}

        {/* Packing list */}
        {plan.packing&&<Card ch={<div>
          <H2 t="Packing List" sub="Everything you need"/>
          {Object.entries(plan.packing).map(([person,items])=>(
            <div key={person} style={{marginBottom:14}}>
              <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:8}}>{person}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {items.map((item,i)=>(
                  <span key={i} style={{fontFamily:FB,fontSize:12,color:T.esp,background:T.sand,borderRadius:20,padding:"4px 12px",border:`1px solid ${T.linen}`}}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>}/>}

        {/* Checklist */}
        <Card ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <H2 t="Before You Go"/>
            <span style={{fontFamily:FB,fontSize:11,color:T.sage}}>{checkDone}/{(trip.checklist||[]).length} done</span>
          </div>
          {(trip.checklist||[]).map((item,i)=>(
            <div key={i} onClick={()=>setTrips(p=>p.map((t,ti)=>ti===activeTrip?{...t,checklist:t.checklist.map((c,ci)=>ci===i?{...c,done:!c.done}:c)}:t))} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:i<trip.checklist.length-1?`1px solid ${T.linen}`:"none",cursor:"pointer"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:item.done?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}>
                {item.done&&<Ic.Check s={12} c="#fff" w={2.5}/>}
              </div>
              <span style={{fontFamily:FB,fontSize:13,color:item.done?T.taupe:T.esp,textDecoration:item.done?"line-through":"none"}}>{item.item}</span>
            </div>
          ))}
        </div>}/>
      </div>}

      {/* No plan yet */}
      {!plan&&!planning&&<div style={{textAlign:"center",padding:"24px 20px",background:T.sand,borderRadius:18}}>
        <div style={{fontSize:36,marginBottom:10}}>✨</div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 6px"}}>Let Nora plan this trip</p>
        <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"0 0 14px",lineHeight:1.6}}>Nora will build your full itinerary, packing list, budget and checklist</p>
        <button onClick={()=>planTrip()} style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:13,padding:"12px 24px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
          <Ic.Compass s={16} c="#fff" w={1.5}/>Plan This Trip with Nora
        </button>
      </div>}
    </div>
  );
}

function FieldEditor({value,onChange,dark,inline}){
  const [editing,setEditing]=useState(false);
  const [val,setVal]=useState(value);
  useEffect(()=>setVal(value),[value]);
  if(inline) return(
    <button onClick={()=>setEditing(!editing)} style={{background:dark?"rgba(255,255,255,.15)":"rgba(0,0,0,.06)",border:"none",borderRadius:8,padding:"4px 10px",fontFamily:FB,fontSize:11,color:dark?"rgba(255,255,255,.8)":T.bark,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
      ✏️ Edit
    </button>
  );
  return(
    <div style={{marginBottom:10}}>
      <p style={{fontFamily:FB,fontSize:13,color:dark?"rgba(255,255,255,.8)":T.bark,margin:"0 0 8px",lineHeight:1.7}}>{val}</p>
      {editing?(
        <div>
          <textarea value={val} onChange={e=>setVal(e.target.value)} rows={3} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"8px 10px",borderRadius:10,border:`1.5px solid ${dark?"rgba(255,255,255,.3)":T.gold}`,background:dark?"rgba(255,255,255,.08)":"#fff",color:dark?"#fff":T.esp,lineHeight:1.6,resize:"none"}}/>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            <button onClick={()=>{onChange(val);setEditing(false);}} style={{background:T.sage,border:"none",borderRadius:8,padding:"6px 14px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>Save</button>
            <button onClick={()=>{setVal(value);setEditing(false);}} style={{background:"none",border:`1px solid ${dark?"rgba(255,255,255,.2)":T.linen}`,borderRadius:8,padding:"6px 14px",fontFamily:FB,fontSize:11,color:dark?"rgba(255,255,255,.5)":T.bark,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setEditing(true)} style={{background:dark?"rgba(255,255,255,.1)":T.sand,border:`1px solid ${dark?"rgba(255,255,255,.15)":T.linen}`,borderRadius:8,padding:"5px 12px",fontFamily:FB,fontSize:11,color:dark?"rgba(255,255,255,.6)":T.bark,cursor:"pointer"}}>✏️ Edit this section</button>
      )}
    </div>
  );
}

function NewTripForm({profile,familyMembers,onAdd,onCancel,newDest,setNewDest,newDate,setNewDate,newNights,setNewNights,newBudget,setNewBudget,newStatus,setNewStatus,newTravellers,setNewTravellers}){
  return(
    <div style={{background:"#fff",borderRadius:18,padding:"18px",marginBottom:14,border:`1.5px solid ${T.gold}`,animation:"pop .2s ease both"}}>
      <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp,margin:"0 0 16px"}}>Plan a new trip ✈️</p>
      <div style={{marginBottom:12}}>
        <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Where to?</label>
        <input value={newDest} onChange={e=>setNewDest(e.target.value)} placeholder="e.g. Bali, Indonesia" style={{width:"100%",fontFamily:FB,fontSize:15,padding:"12px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
        <div>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Depart date</label>
          <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,background:"#fff"}}/>
        </div>
        <div>
          <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Nights</label>
          <input type="text" inputMode="numeric" value={newNights} onChange={e=>setNewNights(e.target.value)} placeholder="e.g. 7" style={{width:"100%",fontFamily:FB,fontSize:15,fontWeight:700,padding:"10px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp}}/>
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:6}}>Total budget ($)</label>
        <input type="text" inputMode="numeric" value={newBudget} onChange={e=>setNewBudget(e.target.value)} placeholder="e.g. 6000" style={{width:"100%",fontFamily:FB,fontSize:15,fontWeight:700,padding:"10px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp}}/>
      </div>
      <div style={{marginBottom:12}}>
        <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Who is coming</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {familyMembers.map((person,i)=>{
            const selected=newTravellers>i;
            return(
              <button key={i} onClick={()=>setNewTravellers(selected?i:i+1)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:`1.5px solid ${selected?T.gold:T.linen}`,background:selected?T.goldP:"#fff",cursor:"pointer"}}>
                <span style={{fontSize:14}}>{person.emoji}</span>
                <span style={{fontFamily:FB,fontSize:12,color:selected?T.esp:T.bark}}>{person.name}</span>
                {selected&&<Ic.Check s={11} c={T.gold} w={2.5}/>}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Status</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["Dreaming","Planning","Booked"].map(s=><button key={s} onClick={()=>setNewStatus(s)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${newStatus===s?T.gold:T.linen}`,background:newStatus===s?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:newStatus===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>)}
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onCancel} style={{flex:1,background:T.sand,border:"none",borderRadius:12,padding:"12px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer"}}>Cancel</button>
        <button onClick={onAdd} disabled={!newDest.trim()} style={{flex:2,background:newDest.trim()?`linear-gradient(135deg,${T.gold},#8B6914)`:T.linen,border:"none",borderRadius:12,padding:"12px",fontFamily:FB,fontSize:13,fontWeight:700,color:newDest.trim()?"#fff":T.taupe,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Ic.Compass s={16} c={newDest.trim()?"#fff":T.taupe} w={1.5}/>Add Trip & Plan with Nora
        </button>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// 3. BUDGET COACH — fully interactive
// ═══════════════════════════════════════════════════════════════════
function BudgetScreen({uid}){
  const [categories,setCategories]=useState([
    {lb:"Groceries",spent:620,budget:700,IC:Ic.Bag,c:T.sage,month:"Apr"},
    {lb:"Kids",spent:380,budget:400,IC:Ic.Kids,c:T.sky,month:"Apr"},
    {lb:"Fitness",spent:95,budget:120,IC:Ic.Dumbbell,c:T.blush,month:"Apr"},
    {lb:"Travel",spent:2100,budget:6400,IC:Ic.Suitcase,c:T.teal,month:"Apr"},
    {lb:"Shopping",spent:340,budget:500,IC:Ic.Hanger,c:T.lav,month:"Apr"},
    {lb:"Dining",spent:215,budget:300,IC:Ic.Fork,c:T.gold,month:"Apr"},
  ]);
  const [savingsGoal,setSavingsGoal]=useState({name:"Bali Trip",target:6400,saved:3200});
  const [inp,setInp]=useState("");
  const [hist,setHist]=useState([]);
  const [loading,setLoading]=useState(false);
  const [activeTab,setActiveTab]=useState("overview");
  const [editCat,setEditCat]=useState(null);
  const [editVal,setEditVal]=useState("");
  const [showAddExp,setShowAddExp]=useState(false);
  const [newExp,setNewExp]=useState({cat:"Groceries",amount:"",note:""});
  const [expenses,setExpenses]=useState(()=>{
    try{const s=sessionStorage.getItem("hn_expenses");return s?JSON.parse(s):[];}catch(e){return [];}
  });

  // Save expenses to session on change
  useEffect(()=>{
    try{sessionStorage.setItem("hn_expenses",JSON.stringify(expenses));}catch(e){}
    if(uid) saveData(uid,"budget",{expenses,categories,savingsGoal}).catch(()=>{});
  },[expenses,uid]);

  // Load budget from Firebase
  useEffect(()=>{
    if(!uid)return;
    loadData(uid,"budget").then(d=>{
      if(d?.expenses) setExpenses(d.expenses);
      if(d?.categories) setCategories(d.categories.map(c=>({...c,IC:Ic[c.ICname]||Ic.Bag})));
      if(d?.savingsGoal) setSavingsGoal(d.savingsGoal);
    }).catch(()=>{});
  },[uid]);

  const totalBudget=categories.reduce((a,c)=>a+c.budget,0);
  const totalSpent=categories.reduce((a,c)=>a+c.spent,0);
  const savingsPct=Math.round((savingsGoal.saved/savingsGoal.target)*100);

  const addExpense=()=>{
    if(!newExp.amount)return;
    const amt=parseFloat(newExp.amount);
    setExpenses(p=>[{id:Date.now(),cat:newExp.cat,amount:amt,note:newExp.note,date:"Just now"},...p]);
    setCategories(p=>p.map(c=>c.lb===newExp.cat?{...c,spent:c.spent+amt}:c));
    setNewExp({cat:"Groceries",amount:"",note:""});
    setShowAddExp(false);
  };

  const ask=async()=>{
    if(!inp.trim()||loading)return;
    const msg=inp.trim();setInp("");setLoading(true);
    const h=hist.map(m=>({role:m.role,content:m.content}));
    const overBudget=categories.filter(c=>c.spent>c.budget*0.9).map(c=>`${c.lb} (${Math.round((c.spent/c.budget)*100)}%)`).join(", ")||"none";
    const recentExp=expenses.slice(0,5).map(e=>`${e.cat} $${e.amount}${e.note?` (${e.note})`:""}`).join(", ");
    const ctx=`Real budget data: total budget $${totalBudget}, spent $${totalSpent} (${Math.round((totalSpent/totalBudget)*100)}%). Categories: ${categories.map(c=>`${c.lb}: $${c.spent}/$${c.budget}`).join(", ")}. Savings goal: ${savingsGoal.name} $${savingsGoal.saved}/$${savingsGoal.target} (${Math.round((savingsGoal.saved/savingsGoal.target)*100)}%). Near budget limit: ${overBudget}. Recent expenses: ${recentExp}.`;
    const guiltFree=totalBudget-totalSpent>0?`She has $${(totalBudget-totalSpent).toLocaleString()} remaining — this is guilt-free money she CAN spend without any worry.`:"She has reached her budget this month.";
    try{const raw=await claude(`You are Nora, a warm and supportive financial companion inside HerNest. You are NEVER judgmental about spending — money is for living. ${ctx} ${guiltFree}
Your tone is like a brilliant, encouraging best friend who happens to be a CFO. Celebrate wins first. Never use words like "overspending", "too much" or "should cut back" — instead say things like "you have room to play with", "guilt-free spending", "you are doing great". Be specific with her numbers. 3-4 sentences max.`,msg,h);setHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:raw}]);}
    catch(e){setHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"Something went quiet on my end — but your question was a great one. Give me another go in a moment. 💳"}]);}
    setLoading(false);
  };

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      <div style={{background:"linear-gradient(135deg,#1a1400,#3a2e00)",borderRadius:22,padding:"20px",marginBottom:14}}>
        <AIBadge t="Budget Coach"/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:10}}>
          <div>
            <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:"#fff",margin:"0 0 4px",fontWeight:400}}>Financial Pulse</h2>
            <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:0}}>{new Date().toLocaleDateString("en-AU",{month:"long",year:"numeric"})} {totalSpent<totalBudget*0.8?"· 🎉 On track!":totalSpent<totalBudget?"· ✓ Looking good":""}</p>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:T.gold}}>${totalSpent.toLocaleString()}</div>
            <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)"}}>of ${totalBudget.toLocaleString()}</div>
          </div>
        </div>
        <div style={{marginTop:14,background:"rgba(255,255,255,.12)",borderRadius:10,height:6}}>
          <div style={{background:`linear-gradient(90deg,${T.sage},${T.gold})`,height:"100%",borderRadius:10,width:`${Math.min((totalSpent/totalBudget)*100,100)}%`,transition:"width .5s"}}/>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14}}>
        {["overview","expenses","savings","coach"].map(t=><Pill key={t} ch={t.charAt(0).toUpperCase()+t.slice(1)} active={activeTab===t} on={()=>setActiveTab(t)} color={T.gold}/>)}
      </div>

      {/* Overview */}
      {activeTab==="overview"&&<div style={{animation:"slideRight .3s ease both"}}>
        <H2 t="Category Breakdown" sub="Tap amount to edit budget"/>
        {categories.map((s,idx)=>{
          const pct=Math.round((s.spent/s.budget)*100);
          return(
            <div key={s.lb} style={{marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <Tile ic={s.IC} c={s.c} bg={s.c+"18"} s={16} ts={32} r={9}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontFamily:FB,fontSize:13,color:T.esp,fontWeight:700}}>{s.lb}</span>
                    {editCat===idx?(
                      <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                        onBlur={()=>{const v=parseFloat(editVal);if(!isNaN(v))setCategories(p=>p.map((c,i)=>i===idx?{...c,budget:v}:c));setEditCat(null);}}
                        style={{width:80,fontFamily:FB,fontSize:12,padding:"2px 8px",borderRadius:8,border:`1.5px solid ${T.gold}`,textAlign:"right",color:T.esp}}/>
                    ):(
                      <span onClick={()=>{setEditCat(idx);setEditVal(String(s.budget));}} style={{fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer"}}>${s.spent}<span style={{color:T.taupe}}>/${s.budget}</span></span>
                    )}
                  </div>
                  <ProgressBar value={s.spent} max={s.budget} color={s.c}/>
                </div>
              </div>
            </div>
          );
        })}
        <Card sx={{background:`linear-gradient(135deg,${T.esp},#5a3a22)`,border:"none"}} ch={<div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Ic.Bulb s={16} c={T.gold} w={1.5}/><span style={{fontFamily:FB,fontSize:10,color:T.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Nora Says</span></div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:"rgba(255,255,255,.8)",margin:"0 0 14px",lineHeight:1.75}}>"You are doing better than you think. ${totalSpent>0?`You have tracked $${totalSpent.toLocaleString()} this month — that awareness alone puts you ahead of most people.`:`Start tracking your spending and watch your financial confidence grow.`}"</p>
          <button onClick={()=>{if(window.confirm("Reset budget for a new month? This will clear your expenses."))setExpenses([]);}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:10,padding:"7px 14px",fontFamily:FB,fontSize:11,fontWeight:700,color:"rgba(255,255,255,.6)",cursor:"pointer"}}>Start fresh month →</button>
        </div>}/>
      </div>}

      {/* Expenses */}
      {activeTab==="expenses"&&<div style={{animation:"slideRight .3s ease both"}}>
        <button onClick={()=>setShowAddExp(!showAddExp)} style={{width:"100%",background:showAddExp?T.esp:T.sand,border:`1.5px solid ${showAddExp?T.esp:T.linen}`,borderRadius:14,padding:"11px 16px",fontFamily:FB,fontSize:13,color:showAddExp?"#fff":T.bark,cursor:"pointer",display:"flex",alignItems:"center",gap:8,marginBottom:12,transition:"all .15s"}}>
          <Ic.Plus s={18} c={showAddExp?"#fff":T.bark} w={2}/>{showAddExp?"Cancel":"Log an expense"}
        </button>
        {showAddExp&&(
          <div style={{background:"#fff",borderRadius:18,padding:"16px",marginBottom:14,border:`1.5px solid ${T.gold}`,animation:"pop .2s ease both"}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {categories.map(c=><button key={c.lb} onClick={()=>setNewExp(p=>({...p,cat:c.lb}))} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${newExp.cat===c.lb?c.c:T.linen}`,background:newExp.cat===c.lb?c.c+"18":"transparent",fontFamily:FB,fontSize:11,color:newExp.cat===c.lb?c.c:T.bark,cursor:"pointer"}}>{c.lb}</button>)}
            </div>
            <input type="number" placeholder="Amount $" value={newExp.amount} onChange={e=>setNewExp(p=>({...p,amount:e.target.value}))} style={{width:"100%",fontFamily:FB,fontSize:14,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:10}}/>
            <input placeholder="Note (optional)" value={newExp.note} onChange={e=>setNewExp(p=>({...p,note:e.target.value}))} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:12}}/>
            <button onClick={addExpense} style={{width:"100%",background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>Log Expense</button>
          </div>
        )}
        <H2 t="Recent Expenses"/>
        {expenses.length===0&&<div style={{textAlign:"center",padding:"28px 20px",background:T.sand,borderRadius:16,marginBottom:12}}>
          <div style={{fontSize:36,marginBottom:10}}>💳</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 6px"}}>No expenses logged yet</p>
          <p style={{fontFamily:FB,fontSize:12,color:T.bark,margin:"0 0 14px",lineHeight:1.5}}>Start tracking your spending and Nora will give you CFO-level insights</p>
          <button onClick={()=>setShowAddExp(true)} style={{background:T.esp,color:"#fff",border:"none",borderRadius:12,padding:"10px 20px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Log First Expense</button>
        </div>}
        {expenses.map((e,i)=>(
          <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1px solid ${T.linen}`}}>
            <Tile ic={categories.find(c=>c.lb===e.cat)?.IC||Ic.Budget} c={categories.find(c=>c.lb===e.cat)?.c||T.bark} bg={(categories.find(c=>c.lb===e.cat)?.c||T.bark)+"18"} s={16} ts={34} r={10}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{e.cat}</div>
              {e.note&&<div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:2}}>{e.note}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.esp}}>${e.amount}</div>
              <div style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{e.date}</div>
            </div>
          </div>
        ))}
      </div>}

      {/* Savings */}
      {activeTab==="savings"&&<div style={{animation:"slideRight .3s ease both"}}>
        <Card sx={{background:`linear-gradient(135deg,#1a1400,#3a2e00)`,border:"none"}} ch={<div>
          <p style={{fontFamily:FB,fontSize:11,color:T.gold,letterSpacing:1.5,textTransform:"uppercase",fontWeight:700,margin:"0 0 6px"}}>Goal — {savingsGoal.name}</p>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:12}}>
            <div style={{fontFamily:FD,fontSize:36,fontWeight:700,color:"#fff"}}>{savingsPct}%</div>
            <div style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.5)"}}>${savingsGoal.saved.toLocaleString()} / ${savingsGoal.target.toLocaleString()}</div>
          </div>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:10,height:10}}>
            <div style={{background:`linear-gradient(90deg,${T.gold},${T.sage})`,height:"100%",borderRadius:10,width:`${savingsPct}%`,transition:"width .5s"}}/>
          </div>
          <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:"10px 0 0"}}>At $800/month you'll reach your goal in {Math.ceil((savingsGoal.target-savingsGoal.saved)/800)} months</p>
        </div>}/>
        <Card ch={<div>
          <H2 t="Add to Savings"/>
          <div style={{display:"flex",gap:8}}>
            {[100,200,500,1000].map(amt=>(
              <button key={amt} onClick={()=>setSavingsGoal(p=>({...p,saved:Math.min(p.saved+amt,p.target)}))} style={{flex:1,background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:12,padding:"10px 0",fontFamily:FD,fontSize:16,fontWeight:700,color:T.esp,cursor:"pointer"}}>+${amt}</button>
            ))}
          </div>
        </div>}/>
        <Card ch={<div>
          <H2 t="Savings Milestones"/>
          {[25,50,75,100].map(pct=>(
            <div key={pct} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderBottom:pct!==100?`1px solid ${T.linen}`:"none"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:savingsPct>=pct?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {savingsPct>=pct?<Ic.Check s={14} c="#fff" w={2.5}/>:<span style={{fontFamily:FD,fontSize:13,fontWeight:700,color:T.taupe}}>{pct}</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{pct}% — ${Math.round(savingsGoal.target*pct/100).toLocaleString()}</div>
                <div style={{fontFamily:FB,fontSize:11,color:T.taupe}}>{savingsPct>=pct?"✓ Reached":"Upcoming"}</div>
              </div>
            </div>
          ))}
        </div>}/>
      </div>}

      {/* Coach */}
      {activeTab==="coach"&&<div style={{animation:"slideRight .3s ease both"}}>

        {/* Guilt-free spending card */}
        {totalSpent<totalBudget&&<div style={{background:`linear-gradient(135deg,${T.sage},#4a7a5a)`,borderRadius:18,padding:"16px 18px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <span style={{fontSize:28}}>✅</span>
            <div>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>Guilt-free money this month</div>
              <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.7)"}}>You can spend this without any worry</div>
            </div>
          </div>
          <div style={{fontFamily:FD,fontSize:36,fontWeight:700,color:"#fff",marginBottom:4}}>${(totalBudget-totalSpent).toLocaleString()}</div>
          <div style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.6)"}}>That is ${Math.round((totalBudget-totalSpent)/30)} a day to enjoy guilt-free 💛</div>
        </div>}

        <div style={{background:AIGRAD,borderRadius:18,padding:"16px",marginBottom:14}}>
          <AIBadge t="Financial Companion"/>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.6)",margin:"8px 0 0",lineHeight:1.6}}>I am on your side. Ask me anything — I will celebrate your wins and help you make the most of what you have.</p>
        </div>
        {["How much can I spend guilt-free?","What are my biggest wins this month?","Help me save for my trip","What should I treat myself to?"].map((q,i)=>(
          <div key={i} onClick={()=>setInp(q)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:11,padding:"9px 14px",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:8,fontFamily:FB,fontSize:12,color:T.bark}}>
            <Ic.Budget s={13} c={T.taupe} w={1.5}/>{q}
          </div>
        ))}
        <div style={{maxHeight:280,overflowY:"auto",marginBottom:10}}>
          {hist.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}>
              <div style={{maxWidth:"85%",background:m.role==="user"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#fff",borderRadius:16,padding:"10px 14px",border:m.role==="assistant"?`1px solid ${T.linen}`:"none"}}>
                <p style={{fontFamily:FB,fontSize:13,color:m.role==="user"?"rgba(255,255,255,.9)":T.bark,margin:0,lineHeight:1.6}}>{m.content}</p>
              </div>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:4,padding:"8px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.taupe,animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ask anything about your finances…" style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          <button onClick={ask} style={{background:T.esp,border:"none",borderRadius:13,padding:"0 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Send s={16} c="#fff" w={2}/></button>
        </div>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. STYLE STYLIST — fully interactive
// ═══════════════════════════════════════════════════════════════════
function StyleScreen({profile}){
  const [prompt,setPrompt]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [saved,setSaved]=useState([]);
  const [activeTab,setActiveTab]=useState("stylist");
  const [mood,setMood]=useState("");
  const [occasion,setOccasion]=useState("");
  const [wishlist,setWishlist]=useState(()=>{
    try{const s=sessionStorage.getItem("hn_wishlist");return s?JSON.parse(s):[
      {id:1,name:"Lululemon Align HR",cat:"Activewear",price:128,color:T.sage},
      {id:2,name:"Reformation Linen Slip",cat:"Style",price:195,color:T.blush},
      {id:3,name:"Bala Bangles 1lb",cat:"Fitness",price:55,color:T.sky},
    ];}catch(e){return [];}
  });
  const [savedOutfits,setSavedOutfits]=useState(()=>{
    try{const s=sessionStorage.getItem("hn_outfits");return s?JSON.parse(s):[];}catch(e){return [];}
  });

  useEffect(()=>{try{sessionStorage.setItem("hn_wishlist",JSON.stringify(wishlist));}catch(e){};},[wishlist]);
  useEffect(()=>{try{sessionStorage.setItem("hn_outfits",JSON.stringify(savedOutfits));}catch(e){};},[savedOutfits]);

  const OCCASIONS=[
    {lb:"Board meeting",emoji:"👔"},
    {lb:"School run",emoji:"🚗"},
    {lb:"Date night",emoji:"✨"},
    {lb:"Weekend casual",emoji:"☀️"},
    {lb:"Gym",emoji:"💪"},
    {lb:"Girls dinner",emoji:"🥂"},
    {lb:"Holiday",emoji:"🌴"},
    {lb:"Working from home",emoji:"💻"},
  ];
  const MOODS=["Powerful","Relaxed","Playful","Elegant","Sporty","Romantic"];

  const run=async(autoPrompt)=>{
    if(!occasion&&!mood&&!prompt.trim()&&!autoPrompt)return;
    setLoading(true);setResult(null);
    const profileCtx=profile?`User is a ${profile.role||"working mum"}, has ${(profile.kids||[]).length} kids.`:"";
    const finalPrompt=autoPrompt||((occasion?"Occasion: "+occasion+". ":"")+(mood?"Mood: "+mood+". ":"")+prompt+" "+profileCtx).trim();
      const sys=`You are a personal stylist. Return ONLY valid JSON with no extra text: {"styleInsight":"one sentence","outfits":[{"name":"outfit name","occasion":"","mood":"","whyThisWorks":"","totalEstimate":"","note":"","items":[{"piece":"","brand":"","priceRange":"","why":"","searchQuery":""}]}]}. Return 2 outfits with 3 items each.`;
    try{
      const raw=await claude(sys,finalPrompt);
      const cleaned=raw.replace(/```json|```/g,"").trim();
      setResult(JSON.parse(cleaned));
    }catch(e){
      console.log("Style error:",e);
      setResult({error:true});
    }
    setLoading(false);
  };

  const saveOutfit=(o)=>{
    setSavedOutfits(p=>[{...o,savedAt:new Date().toLocaleDateString("en-AU",{day:"numeric",month:"short"})},...p.filter(s=>s.name!==o.name)]);
  };

  const saveItem=(item)=>{
    const newItem={id:Date.now(),name:item.piece,cat:"Style",price:parseInt(item.priceRange?.replace(/[^0-9]/g,"")||"0"),color:T.blush};
    setWishlist(p=>[newItem,...p.filter(w=>w.name!==newItem.name)]);
  };

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,#2d1428,#4a1a3a)`,borderRadius:22,padding:"20px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(242,212,202,.06)"}}/>
        <AIBadge t="Style Stylist"/>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:24,color:"#fff",margin:"10px 0 4px",fontWeight:400}}>Your Style, Elevated</h2>
        <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.45)",margin:0}}>Nora styles you for every moment of your life</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {["stylist","saved","wishlist"].map(t=>(
          <Pill key={t} ch={t==="stylist"?"Style Me":t==="saved"?"Saved Outfits":"Wishlist"} active={activeTab===t} on={()=>setActiveTab(t)} color={T.blush}/>
        ))}
      </div>

      {/* STYLIST TAB */}
      {activeTab==="stylist"&&<div>
        {/* Occasion quick picks */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:10}}>What's the occasion?</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {OCCASIONS.map(o=>(
              <button key={o.lb} onClick={()=>{setOccasion(occasion===o.lb?"":o.lb);}} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 12px",borderRadius:20,border:`1.5px solid ${occasion===o.lb?T.blush:T.linen}`,background:occasion===o.lb?T.blushP:"#fff",cursor:"pointer",transition:"all .15s"}}>
                <span style={{fontSize:14}}>{o.emoji}</span>
                <span style={{fontFamily:FB,fontSize:12,color:occasion===o.lb?T.esp:T.bark,fontWeight:occasion===o.lb?700:400}}>{o.lb}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood selector */}
        <div style={{marginBottom:14}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:10}}>How do you want to feel?</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {MOODS.map(m=>(
              <button key={m} onClick={()=>setMood(mood===m?"":m)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${mood===m?T.lav:T.linen}`,background:mood===m?T.lavP:"#fff",fontFamily:FB,fontSize:12,color:mood===m?T.esp:T.bark,cursor:"pointer",fontWeight:mood===m?700:400}}>
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Custom prompt */}
        <div style={{marginBottom:12}}>
          <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:8}}>Add more detail (optional)</div>
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. I need to look authoritative but approachable…" style={{width:"100%",fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,color:T.esp,background:"#fff"}}/>
        </div>

        <button onClick={()=>run()} disabled={!occasion&&!mood&&!prompt.trim()||loading} style={{width:"100%",background:occasion||mood||prompt.trim()?`linear-gradient(135deg,#2d1428,#4a1a3a)`:T.linen,color:occasion||mood||prompt.trim()?"#fff":T.taupe,border:"none",borderRadius:14,padding:"13px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14,opacity:loading?.7:1}}>
          {loading?<><Spinner/>Styling you…</>:<>✨ Style Me</>}
        </button>

        {result&&!result.error&&<div style={{animation:"fadeUp .4s ease both"}}>
          {result.styleInsight&&<div style={{background:T.blushP,borderRadius:14,padding:"12px 16px",marginBottom:14,borderLeft:`4px solid ${T.blush}`}}>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.esp,margin:0,lineHeight:1.7}}>"{result.styleInsight}"</p>
          </div>}
          {result.outfits?.map((o,i)=>(
            <Card key={i} ch={<div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontFamily:FD,fontSize:18,fontWeight:600,color:T.esp}}>{o.name}</div>
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    {o.occasion&&<span style={{fontFamily:FB,fontSize:10,color:T.blush,background:T.blushP,borderRadius:20,padding:"2px 8px"}}>{o.occasion}</span>}
                    {o.mood&&<span style={{fontFamily:FB,fontSize:10,color:T.lav,background:T.lavP,borderRadius:20,padding:"2px 8px"}}>{o.mood}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>saveOutfit(o)} style={{background:savedOutfits.find(s=>s.name===o.name)?T.blushP:T.sand,border:`1px solid ${savedOutfits.find(s=>s.name===o.name)?T.blush:T.linen}`,borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:11,color:savedOutfits.find(s=>s.name===o.name)?T.blush:T.bark,cursor:"pointer"}}>
                    {savedOutfits.find(s=>s.name===o.name)?"❤️ Saved":"🤍 Save"}
                  </button>
                </div>
              </div>
              {o.whyThisWorks&&<p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"0 0 10px",lineHeight:1.6,fontStyle:"italic"}}>{o.whyThisWorks}</p>}
              {o.items?.map((item,j)=>(
                <div key={j} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:j<o.items.length-1?`1px solid ${T.linen}`:"none",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{item.piece}</div>
                    <div style={{fontFamily:FB,fontSize:11,color:T.blush,marginTop:1}}>{item.brand}</div>
                    <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1,fontStyle:"italic"}}>{item.why}</div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",flexShrink:0}}>
                    <span style={{fontFamily:FD,fontSize:14,fontWeight:700,color:T.gold}}>{item.priceRange}</span>
                    <button onClick={()=>{window.open("https://www.google.com/search?q="+encodeURIComponent((item.searchQuery||item.piece+" "+item.brand)+" buy"),"_blank");}} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"3px 8px",fontFamily:FB,fontSize:10,fontWeight:700,color:T.gold,cursor:"pointer"}}>Shop →</button>
                    <button onClick={()=>saveItem(item)} style={{background:T.blushP,border:`1px solid ${T.blush}30`,borderRadius:8,padding:"3px 8px",fontFamily:FB,fontSize:10,color:T.blush,cursor:"pointer"}}>+ Wishlist</button>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:10,padding:"8px 0",borderTop:`1px solid ${T.linen}`}}>
                <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>Total estimate</span>
                <span style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold}}>{o.totalEstimate}</span>
              </div>
              {o.note&&<p style={{fontFamily:FB,fontSize:11,color:T.taupe,margin:"6px 0 0",fontStyle:"italic"}}>{o.note}</p>}
            </div>}/>
          ))}
        </div>}
        {result?.error&&<Card ch={<p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Something went quiet — tap Style Me again 💛</p>}/>}
      </div>}

      {/* SAVED OUTFITS TAB */}
      {activeTab==="saved"&&<div>
        {savedOutfits.length===0?(
          <div style={{textAlign:"center",padding:"32px 20px",background:T.sand,borderRadius:16}}>
            <div style={{fontSize:36,marginBottom:10}}>👗</div>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 6px"}}>No saved outfits yet</p>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:0}}>Style yourself and tap 🤍 Save on outfits you love</p>
          </div>
        ):savedOutfits.map((o,i)=>(
          <Card key={i} ch={<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontFamily:FD,fontSize:16,fontWeight:600,color:T.esp}}>{o.name}</div>
                <div style={{fontFamily:FB,fontSize:10,color:T.taupe,marginTop:2}}>Saved {o.savedAt}</div>
              </div>
              <button onClick={()=>setSavedOutfits(p=>p.filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
            </div>
            {o.items?.slice(0,3).map((item,j)=>(
              <div key={j} style={{fontFamily:FB,fontSize:12,color:T.bark,padding:"4px 0",borderBottom:j<2?`1px solid ${T.linen}`:"none"}}>
                <span style={{fontWeight:600}}>{item.piece}</span> · {item.brand} · <span style={{color:T.gold}}>{item.priceRange}</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={()=>{setOccasion(o.occasion||"");setActiveTab("stylist");run(`Style me like this outfit: ${o.name} — ${o.items?.map(i=>i.piece).join(", ")}`);}} style={{flex:1,background:T.blushP,border:`1px solid ${T.blush}30`,borderRadius:10,padding:"8px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.blush,cursor:"pointer"}}>Re-style this</button>
              <button onClick={()=>window.open("https://www.pinterest.com/search/pins/?q="+encodeURIComponent(o.name+" outfit"),"_blank")} style={{flex:1,background:T.sand,border:`1px solid ${T.linen}`,borderRadius:10,padding:"8px",fontFamily:FB,fontSize:11,color:T.bark,cursor:"pointer"}}>Pinterest →</button>
            </div>
          </div>}/>
        ))}
      </div>}

      {/* WISHLIST TAB */}
      {activeTab==="wishlist"&&<div>
        {wishlist.length===0?(
          <div style={{textAlign:"center",padding:"32px 20px",background:T.sand,borderRadius:16}}>
            <div style={{fontSize:36,marginBottom:10}}>🛍️</div>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:T.esp,margin:"0 0 6px"}}>Your wishlist is empty</p>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:0}}>Tap "+ Wishlist" on any item while styling</p>
          </div>
        ):wishlist.map((item,i)=>(
          <div key={item.id} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1px solid ${T.linen}`}}>
            <div style={{width:40,height:40,borderRadius:12,background:item.color+"22",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:20}}>🛍️</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{item.name}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1}}>{item.cat}{item.price>0?` · $${item.price}`:""}</div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>window.open("https://www.google.com/search?q="+encodeURIComponent(item.name+" buy online"),"_blank")} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"5px 10px",fontFamily:FB,fontSize:11,fontWeight:700,color:T.gold,cursor:"pointer"}}>Buy →</button>
              <button onClick={()=>setWishlist(p=>p.filter(w=>w.id!==item.id))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// 5. CIRCLE COMMUNITY — fully interactive
// ═══════════════════════════════════════════════════════════════════
function CircleScreen({profile}){
  const [activeTab,setActiveTab]=useState("myCircle");
  const [myCircle,setMyCircle]=useState([
    {id:1,name:"Priya M",av:"👩🏽",role:"Marketing Director",kids:"Arjun 5, Isla 8",sharedInterests:["Working mums","Family travel","Pilates"],status:"online",lastMsg:"Just dropped the kids — finally some quiet!",time:"2m"},
    {id:2,name:"Sophie L",av:"👩🏼",role:"Teacher",kids:"Noah 6",sharedInterests:["Meal prep","Fitness","School stuff"],status:"online",lastMsg:"That meal prep tip you shared was a game changer",time:"1h"},
    {id:3,name:"Amara K",av:"👩🏿",role:"Lawyer",kids:"Zara 3, Leo 7",sharedInterests:["Back to work","Work-life balance","Travel"],status:"away",lastMsg:"How do you manage the mum guilt?",time:"3h"},
    {id:4,name:"Mei Zhang",av:"👩",role:"Entrepreneur",kids:"Lily 4",sharedInterests:["Business","Family travel","Wellness"],status:"away",lastMsg:"Bali recommendations?",time:"5h"},
  ]);
  const [activeMember,setActiveMember]=useState(null);
  const [chatMsg,setChatMsg]=useState("");
  const [chats,setChats]=useState({});
  const [aiMatch,setAiMatch]=useState(null);
  const [matchLoading,setMatchLoading]=useState(false);
  const [weeklyQ,setWeeklyQ]=useState({q:"What is one thing you did just for YOU this week?",answers:[{av:"👩🏽",name:"Priya",txt:"Booked a massage — first one in 6 months!"},{av:"👩🏼",name:"Sophie",txt:"Read an actual book. Not a kids book. A real one."}]});
  const [myAnswer,setMyAnswer]=useState("");

  const sendChat=(memberId)=>{
    if(!chatMsg.trim())return;
    const msg={from:"me",txt:chatMsg,time:"Just now"};
    setChats(p=>({...p,[memberId]:[...(p[memberId]||[]),msg]}));
    setChatMsg("");
    // Simulate reply
    setTimeout(()=>{
      const replies=["That is so relatable!","You are doing amazing.","Tell me more!","I needed to hear this today.","Same! How do you handle it?"];
      const reply={from:"them",txt:replies[Math.floor(Math.random()*replies.length)],time:"Just now"};
      setChats(p=>({...p,[memberId]:[...(p[memberId]||[]),reply]}));
    },2000);
  };

  const findMatch=async()=>{
    setMatchLoading(true);
    const sys=`You are Nora, AI community matcher for HerNest. Return ONLY valid JSON: {"match":{"name":"","avatar":"👩🏽","role":"","kids":"","sharedInterests":["","",""],"icebreaker":"","whyMatch":""},"reason":""}`;
    const userCtx=`User: ${profile?.name||"Sarah"}, ${profile?.role||"Working Mum"}, kids: ${profile?.kids?.map(k=>k.name).join(",")||"2 kids"}, priorities: ${profile?.priorities?.join(",")||"family,career"}`;
    try{
      const raw=await claude(sys,`Find a perfect Circle match: ${userCtx}. Create a realistic mum profile.`);
      setAiMatch(JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g,"").trim()));
    }catch(e){
      setAiMatch({match:{name:"Rachel T",avatar:"👩🏻",role:"CFO",kids:"2 kids aged 6 & 9",sharedInterests:["Executive mums","Family travel","Wellness"],icebreaker:"You both balance C-suite careers with school runs!",whyMatch:"Rachel gets exactly what it is like to be the most senior person in the room AND the one doing the school run."},reason:"Perfect match."});
    }
    setMatchLoading(false);
  };

  const addToCircle=()=>{
    if(!aiMatch||myCircle.length>=8)return;
    const m=aiMatch.match;
    setMyCircle(p=>[...p,{id:Date.now(),name:m.name,av:m.avatar,role:m.role,kids:m.kids,sharedInterests:m.sharedInterests,status:"online",lastMsg:"Just joined your Circle! 👋",time:"Just now"}]);
    setAiMatch(null);
  };

  const member=myCircle.find(m=>m.id===activeMember);

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0e1428,#1a2a4e)",borderRadius:22,padding:"22px 20px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"rgba(100,160,255,.05)"}}/>
        <AIBadge t="AI Community"/>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:"#fff",margin:"10px 0 6px",fontWeight:400}}>The Circle</h2>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.45)",margin:"0 0 14px"}}>Your curated group of mums who get it 💛</p>
        <div style={{display:"flex",gap:16}}>
          {[[myCircle.length,`of 8`,"Members"],[myCircle.filter(m=>m.status==="online").length,"online","Active now"],["5⭐","","Vibe"]].map(([v,sub,lb],i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:"#fff"}}>{v}<span style={{fontSize:12,color:"rgba(255,255,255,.4)",marginLeft:2}}>{sub}</span></div>
              <div style={{fontFamily:FB,fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>{lb}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {["myCircle","weekly","match"].map(t=>(
          <Pill key={t} ch={t==="myCircle"?"My Circle":t==="weekly"?"This Week":"Find Match"} active={activeTab===t} on={()=>setActiveTab(t)} color={T.sky}/>
        ))}
      </div>

      {/* My Circle tab */}
      {activeTab==="myCircle"&&<div>
        {activeMember?(
          <div>
            {/* Chat view */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <button onClick={()=>setActiveMember(null)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Back s={20} c={T.bark} w={2}/></button>
              <span style={{fontSize:28}}>{member?.av}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:14,fontWeight:700,color:T.esp}}>{member?.name}</div>
                <div style={{fontFamily:FB,fontSize:11,color:T.sage}}>{member?.status==="online"?"● Online":"○ Away"}</div>
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:16,padding:"14px",marginBottom:12,minHeight:200,maxHeight:320,overflowY:"auto",border:`1px solid ${T.linen}`}}>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{display:"inline-flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
                  {member?.sharedInterests?.map((i,idx)=><span key={idx} style={{fontFamily:FB,fontSize:11,color:T.sky,background:T.skyP,borderRadius:20,padding:"3px 10px"}}>{i}</span>)}
                </div>
                <p style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:8}}>You have {member?.sharedInterests?.length} things in common</p>
              </div>
              {(chats[activeMember]||[]).map((msg,i)=>(
                <div key={i} style={{display:"flex",justifyContent:msg.from==="me"?"flex-end":"flex-start",marginBottom:8}}>
                  <div style={{maxWidth:"78%",background:msg.from==="me"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#f5f5f5",borderRadius:msg.from==="me"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 13px"}}>
                    <p style={{fontFamily:FB,fontSize:13,color:msg.from==="me"?"rgba(255,255,255,.9)":T.esp,margin:0,lineHeight:1.5}}>{msg.txt}</p>
                  </div>
                </div>
              ))}
              {!(chats[activeMember]||[]).length&&<p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.taupe,textAlign:"center",margin:"20px 0"}}>Start the conversation 💛</p>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat(activeMember)} placeholder="Say something kind…" style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
              <button onClick={()=>sendChat(activeMember)} style={{background:`linear-gradient(135deg,${T.esp},#4a3020)`,border:"none",borderRadius:13,padding:"0 16px",cursor:"pointer",display:"flex",alignItems:"center"}}><Ic.Send s={16} c="#fff" w={2}/></button>
            </div>
          </div>
        ):(
          <div>
            <p style={{fontFamily:FB,fontSize:12,color:T.taupe,marginBottom:12}}>Your Circle · {myCircle.length}/8 members · Tap to chat</p>
            {myCircle.map(m=>(
              <div key={m.id} onClick={()=>setActiveMember(m.id)} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:16,padding:"13px 14px",marginBottom:8,cursor:"pointer",border:`1px solid ${T.linen}`,transition:"all .15s"}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <span style={{fontSize:32}}>{m.av}</span>
                  <div style={{position:"absolute",bottom:0,right:0,width:10,height:10,borderRadius:"50%",background:m.status==="online"?T.sage:T.taupe,border:"2px solid #fff"}}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{m.name}</span>
                    <span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>{m.time}</span>
                  </div>
                  <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1}}>{m.role}</div>
                  <div style={{fontFamily:FB,fontSize:12,color:T.bark,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.lastMsg}</div>
                </div>
                <Ic.Arrow s={16} c={T.linen} w={1.5}/>
              </div>
            ))}
            {myCircle.length<8&&<button onClick={()=>setActiveTab("match")} style={{width:"100%",background:T.sand,border:`1.5px dashed ${T.linen}`,borderRadius:14,padding:"12px",fontFamily:FB,fontSize:13,color:T.taupe,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <Ic.Plus s={16} c={T.taupe} w={2}/>Add more mums ({8-myCircle.length} spots left)
            </button>}
          </div>
        )}
      </div>}

      {/* Weekly question tab */}
      {activeTab==="weekly"&&<div>
        <div style={{background:`linear-gradient(135deg,${T.esp},#4a2e18)`,borderRadius:18,padding:"20px",marginBottom:14}}>
          <div style={{fontFamily:FB,fontSize:10,color:T.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:8}}>This Week's Question</div>
          <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:"#fff",margin:"0 0 4px",lineHeight:1.5}}>"{weeklyQ.q}"</p>
          <p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)",margin:0}}>Answer anonymously or with your name</p>
        </div>
        {weeklyQ.answers.map((a,i)=>(
          <Card key={i} ch={<div style={{display:"flex",gap:10}}>
            <span style={{fontSize:26,flexShrink:0}}>{a.av}</span>
            <div><span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>{a.name} · </span><span style={{fontFamily:FB,fontSize:13,color:T.bark,lineHeight:1.6}}>{a.txt}</span></div>
          </div>}/>
        ))}
        {!myAnswer?(
          <div style={{background:"#fff",borderRadius:16,padding:"16px",border:`1.5px solid ${T.gold}`}}>
            <textarea value={chatMsg} onChange={e=>setChatMsg(e.target.value)} placeholder="Share your answer with your Circle…" rows={3} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,lineHeight:1.6,marginBottom:10}}/>
            <button onClick={()=>{if(!chatMsg.trim())return;setMyAnswer(chatMsg);setWeeklyQ(p=>({...p,answers:[...p.answers,{av:"👩",name:profile?.name||"You",txt:chatMsg}]}));setChatMsg("");}} style={{width:"100%",background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none",borderRadius:10,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer"}}>Share with my Circle</button>
          </div>
        ):(
          <Card sx={{background:T.sageP,border:`1px solid ${T.sage}`}} ch={<div style={{display:"flex",gap:10}}>
            <Ic.Check s={18} c={T.sage} w={2.5}/>
            <p style={{fontFamily:FB,fontSize:13,color:T.esp,margin:0,lineHeight:1.6}}>You shared your answer this week. Your Circle loved it 💛</p>
          </div>}/>
        )}
      </div>}

      {/* Match tab */}
      {activeTab==="match"&&<div>
        <div style={{background:AIGRAD,borderRadius:18,padding:"16px 18px",marginBottom:14}}>
          <AIBadge t="AI Matcher"/>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.6)",margin:"8px 0 0",lineHeight:1.6}}>Nora finds mums who truly get your life — same stage, same challenges, same vibe.</p>
        </div>
        {myCircle.length>=8&&<Card sx={{background:T.sageP,border:`1px solid ${T.sage}`}} ch={<div style={{display:"flex",gap:10}}>
          <span style={{fontSize:24}}>✨</span>
          <p style={{fontFamily:FB,fontSize:13,color:T.esp,margin:0,lineHeight:1.6}}>Your Circle is full (8/8). You can remove a member to add someone new.</p>
        </div>}/>}
        {myCircle.length<8&&!aiMatch&&<button onClick={findMatch} disabled={matchLoading} style={{width:"100%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:14,padding:"14px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:matchLoading?.7:1}}>
          {matchLoading?<><Spinner/>Finding your match…</>:<><Ic.Star s={18} c="#fff" w={1.4}/>Find My Next Circle Member</>}
        </button>}
        {aiMatch&&<Card sx={{border:`2px solid ${T.sky}30`,background:`linear-gradient(135deg,${T.skyP},#fff)`}} ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <AIBadge t="Perfect Match"/>
            <button onClick={()=>setAiMatch(null)} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:44}}>{aiMatch.match.avatar}</div>
            <div>
              <div style={{fontFamily:FB,fontSize:15,fontWeight:700,color:T.esp}}>{aiMatch.match.name}</div>
              <div style={{fontFamily:FB,fontSize:12,color:T.bark,marginTop:2}}>{aiMatch.match.role}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1}}>{aiMatch.match.kids}</div>
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {aiMatch.match.sharedInterests?.map((i,idx)=><span key={idx} style={{fontFamily:FB,fontSize:11,color:T.sky,background:T.skyP,borderRadius:20,padding:"3px 10px"}}>{i}</span>)}
          </div>
          <div style={{background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:12}}>
            <p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.esp,margin:0,lineHeight:1.6}}>"{aiMatch.match.icebreaker}"</p>
          </div>
          {aiMatch.match.whyMatch&&<p style={{fontFamily:FB,fontSize:12,color:T.bark,margin:"0 0 14px",lineHeight:1.6}}>{aiMatch.match.whyMatch}</p>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={findMatch} style={{flex:1,background:T.sand,border:`1px solid ${T.linen}`,borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,color:T.bark,cursor:"pointer"}}>Try another</button>
            <button onClick={addToCircle} style={{flex:2,background:`linear-gradient(135deg,${T.sky},#2d7aaa)`,border:"none",borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff",cursor:"pointer"}}>Add to my Circle 💛</button>
          </div>
        </div>}/>}
      </div>}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// 6. WELLNESS COACH — fully interactive
// ═══════════════════════════════════════════════════════════════════
function WellnessScreen({profile}){
  const [moods,setMoods]=useState(()=>{try{const s=sessionStorage.getItem("hn_moods");return s?JSON.parse(s):[2,1,2,3,2,4,3];}catch(e){return [2,1,2,3,2,4,3];}});
  const [water,setWater]=useState(()=>{try{return parseInt(sessionStorage.getItem("hn_water")||"4");}catch(e){return 4;}});
  const [sleep,setSleep]=useState(()=>{try{return parseFloat(sessionStorage.getItem("hn_sleep")||"6.5");}catch(e){return 6.5;}});

  // Save wellness data to session
  useEffect(()=>{try{sessionStorage.setItem("hn_moods",JSON.stringify(moods));}catch(e){};},[moods]);
  useEffect(()=>{try{sessionStorage.setItem("hn_water",String(water));}catch(e){};},[water]);
  useEffect(()=>{try{sessionStorage.setItem("hn_sleep",String(sleep));}catch(e){};},[sleep]);
  const [workouts,setWorkouts]=useState([
    {id:1,lb:"Morning HIIT",mins:25,IC:Ic.Dumbbell,done:true,kcal:280},
    {id:2,lb:"Pilates Core",mins:30,IC:Ic.Leaf,done:false,kcal:180},
    {id:3,lb:"Evening Run",mins:40,IC:Ic.Run,done:false,kcal:340},
    {id:4,lb:"Upper Body",mins:35,IC:Ic.Dumbbell,done:false,kcal:220},
  ]);
  const [habits,setHabits]=useState([
    {id:1,lb:"Mindfulness",streak:12,IC:Ic.Leaf,done:false},
    {id:2,lb:"8hrs sleep",streak:4,IC:Ic.Moon,done:false},
    {id:3,lb:"Clean eating",streak:7,IC:Ic.Flower,done:false},
    {id:4,lb:"Daily walk",streak:3,IC:Ic.Run,done:false},
  ]);
  const [activeTab,setActiveTab]=useState("today");
  const [chatInp,setChatInp]=useState("");
  const [chatHist,setChatHist]=useState([]);
  const [chatLoad,setChatLoad]=useState(false);
  const [resetDone,setResetDone]=useState([false,false,false,false]);

  const D=["M","T","W","T","F","S","S"];
  const mC=m=>m<=1?T.blush:m<=2?T.gold:m<=3?T.sage:T.teal;
  const totalKcal=workouts.filter(w=>w.done).reduce((a,w)=>a+w.kcal,0);
  const doneMins=workouts.filter(w=>w.done).reduce((a,w)=>a+w.mins,0);

  const toggleWorkout=id=>setWorkouts(p=>p.map(w=>w.id===id?{...w,done:!w.done}:w));
  const toggleHabit=id=>setHabits(p=>p.map(h=>h.id===id?{...h,done:!h.done,streak:h.done?h.streak-1:h.streak+1}:h));
  const todayMood=moods[6];

  const askCoach=async()=>{
    if(!chatInp.trim()||chatLoad)return;
    const msg=chatInp.trim();setChatInp("");setChatLoad(true);
    const h=chatHist.map(m=>({role:m.role,content:m.content}));
    const avgMood=Math.round(moods.reduce((a,b)=>a+b,0)/moods.length*10)/10;
    const lowMoodDays=moods.filter(m=>m<=2).length;
    const doneHabits=habits.filter(h=>h.done).length;
    const topStreak=habits.reduce((a,h)=>h.streak>a?h.streak:a,0);
    const ctx=`Real wellness data: mood today ${todayMood}/5, weekly average ${avgMood}/5, low mood days this week: ${lowMoodDays}. Sleep last night: ${sleep}hrs (goal 8hrs, ${sleep>=8?"on track":"below target"}). Water today: ${water}/8 glasses. Workouts completed: ${workouts.filter(w=>w.done).length}/${workouts.length} (${totalKcal} kcal burned, ${doneMins} mins). Daily habits done today: ${doneHabits}/${habits.length}. Longest streak: ${topStreak} days. Active habits: ${habits.map(h=>`${h.lb} (${h.streak}d streak)`).join(", ")}.`;
    try{const raw=await claude(`You are Nora, warm wellness coach in HerNest. You have the user's REAL wellness data. ${ctx} Be specific and reference her actual numbers. If mood is low (below 3) acknowledge it with empathy first. Give personalised, actionable advice. 3-4 sentences max.`,msg,h);setChatHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:raw}]);}
    catch(e){setChatHist(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"I lost connection for a second. You deserve a proper answer — try again and I'll be here. 🌿"}]);}
    setChatLoad(false);
  };

  // Burnout detection
  const lowMoodCount=moods.filter(m=>m<=2).length;
  const burnoutRisk=lowMoodCount>=3||sleep<5.5;
  const burnoutMsg=lowMoodCount>=4?"You've had a really tough week emotionally. Your body and mind are telling you something. Please be gentle with yourself today.":lowMoodCount>=3?"Three low mood days this week. That's your signal to slow down — even just for an hour.":sleep<5.5?"You've been running on empty sleep. That affects everything. Rest is productive.":"";

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Burnout alert */}
      {burnoutRisk&&<div style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,borderRadius:16,padding:"14px 16px",marginBottom:12,display:"flex",gap:12,alignItems:"flex-start"}}>
        <span style={{fontSize:24,flexShrink:0}}>💛</span>
        <div>
          <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Nora notices something</div>
          <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.85)",margin:"0 0 10px",lineHeight:1.6}}>{burnoutMsg}</p>
          <div style={{display:"flex",gap:8}}>
            {["Take a break","Talk to Nora","10-min reset"].map((a,i)=>(
              <button key={i} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>{a}</button>
            ))}
          </div>
        </div>
      </div>}

      <div style={{background:"linear-gradient(135deg,#0e2218,#1a4a2e)",borderRadius:22,padding:"20px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <AIBadge t="Wellness Coach"/>
          <button onClick={()=>{
            const steps=Math.floor(Math.random()*4000)+6000;
            const hrs=Math.round((Math.random()*2+6)*10)/10;
            setSleep(hrs);
            alert("Apple Health synced! Steps today: "+steps.toLocaleString()+", Sleep last night: "+hrs+"hrs");
          }} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.6)",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="rgba(255,255,255,.6)"/></svg>
            Sync Health
          </button>
        </div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:22,color:"#fff",margin:"8px 0 4px",fontWeight:400}}>Your Thrive Plan</h2>
        <div style={{display:"flex",gap:20,marginTop:12}}>
          {[["💪",`${workouts.filter(w=>w.done).length}/${workouts.length}`,"Workouts"],["",[water,"/8"].join(""),"Water"],["😴",sleep+"h","Sleep"]].map(([em,v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:"#fff"}}>{v}</div>
              <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14}}>
        {["today","workouts","habits","coach"].map(t=><Pill key={t} ch={t.charAt(0).toUpperCase()+t.slice(1)} active={activeTab===t} on={()=>setActiveTab(t)} color={T.sage}/>)}
      </div>

      {/* Today */}
      {activeTab==="today"&&<div style={{animation:"slideRight .3s ease both"}}>
        {/* Mood chart */}
        <Card ch={<div>
          <H2 t="This Week's Mood" sub="Tap today to update"/>
          <div style={{display:"flex",gap:6,alignItems:"flex-end",marginBottom:12}}>
            {moods.map((m,i)=>(
              <div key={i} onClick={()=>{if(i===6)setMoods(p=>{const n=[...p];n[6]=((m%5)+1);return n;});}} style={{flex:1,textAlign:"center",cursor:i===6?"pointer":"default"}}>
                <div style={{height:56,display:"flex",alignItems:"flex-end",justifyContent:"center",marginBottom:4}}>
                  <div style={{width:"100%",borderRadius:"5px 5px 0 0",background:mC(m)+(i===6?"":"55"),height:`${(m/5)*100}%`,minHeight:8,borderTop:`2px solid ${mC(m)}`,transition:"height .3s"}}/>
                </div>
                <div style={{fontSize:9,fontFamily:FB,color:i===6?T.esp:T.taupe,fontWeight:i===6?700:400}}>{D[i]}</div>
              </div>
            ))}
          </div>
          <p style={{fontFamily:FB,fontSize:12,color:T.bark,margin:0,textAlign:"center",fontStyle:"italic"}}>Tap Sunday bar to change today's mood</p>
        </div>}/>

        {/* Water */}
        <Card ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Ic.Drop s={18} c={T.sky} w={1.5}/><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>Hydration</span></div>
            <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{water}/8 glasses</span>
          </div>
          <div style={{display:"flex",gap:5}}>
            {Array.from({length:8},(_,i)=>(
              <div key={i} onClick={()=>setWater(i<water?i:i+1)} style={{flex:1,height:32,borderRadius:10,cursor:"pointer",background:i<water?T.sky:T.skyP,transition:"background .15s",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {i<water&&<Ic.Drop s={12} c="#fff" w={1.5}/>}
              </div>
            ))}
          </div>
        </div>}/>

        {/* Sleep */}
        <Card ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><Ic.Moon s={18} c={T.sky} w={1.5}/><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>Sleep</span></div>
            <span style={{fontFamily:FD,fontSize:18,fontWeight:700,color:T.esp}}>{sleep}h</span>
          </div>
          <input type="range" min={4} max={10} step={0.5} value={sleep} onChange={e=>setSleep(parseFloat(e.target.value))} style={{width:"100%",accentColor:sleep>=8?T.sage:sleep>=6?T.gold:T.blush}}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
            <span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>4h</span>
            <span style={{fontFamily:FB,fontSize:10,color:T.sage,fontWeight:700}}>Goal: 8h</span>
            <span style={{fontFamily:FB,fontSize:10,color:T.taupe}}>10h</span>
          </div>
        </div>}/>

        {/* Reset routine */}
        <Card sx={{background:`linear-gradient(135deg,${T.sageP},${T.goldP})`,border:"none"}} ch={<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontFamily:FD,fontSize:17,fontWeight:600,color:T.esp}}>10-Minute Reset</span><Tag ch="10 mins" c={T.sage}/></div>
          {["3 deep belly breaths (2 min)","Gentle neck & shoulder rolls (2 min)","Write 3 things you're grateful for (3 min)","5 mins of stillness — phone down"].map((s,i)=>(
            <div key={i} onClick={()=>setResetDone(p=>{const n=[...p];n[i]=!n[i];return n;})} style={{display:"flex",gap:10,alignItems:"center",padding:"9px 0",borderBottom:i<3?`1px dashed ${T.linen}`:"none",cursor:"pointer"}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:resetDone[i]?T.sage:"rgba(107,158,122,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FB,fontSize:11,fontWeight:700,color:resetDone[i]?"#fff":T.sage,flexShrink:0,transition:"background .15s"}}>
                {resetDone[i]?<Ic.Check s={13} c="#fff" w={2.5}/>:i+1}
              </div>
              <span style={{fontFamily:FB,fontSize:13,color:T.esp,textDecoration:resetDone[i]?"line-through":"none"}}>{s}</span>
            </div>
          ))}
        </div>}/>
      </div>}

      {/* Workouts */}
      {activeTab==="workouts"&&<div style={{animation:"slideRight .3s ease both"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[{lb:"Calories",val:totalKcal,c:T.blush,bg:T.blushP},{lb:"Minutes",val:doneMins,c:T.sage,bg:T.sageP}].map(s=>(
            <div key={s.lb} style={{background:s.bg,borderRadius:16,padding:"14px",border:`1px solid ${s.c}25`}}>
              <div style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:s.c,marginBottom:4}}>{s.lb}</div>
              <div style={{fontFamily:FD,fontSize:28,fontWeight:700,color:T.esp}}>{s.val}</div>
            </div>
          ))}
        </div>
        <H2 t="This Week's Workouts" sub="Tap to log as done"/>
        {workouts.map(w=>(
          <div key={w.id} onClick={()=>toggleWorkout(w.id)} style={{display:"flex",alignItems:"center",gap:12,background:w.done?T.sageP:"#fff",borderRadius:14,padding:"13px 14px",marginBottom:8,cursor:"pointer",border:`1.5px solid ${w.done?T.sage:T.linen}`,transition:"all .2s"}}>
            <Tile ic={w.IC} c={w.done?T.sage:T.bark} bg={w.done?"rgba(107,158,122,.2)":T.sand} s={18} ts={38} r={12}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{w.lb}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.bark,marginTop:2}}>{w.mins} min · {w.kcal} kcal</div>
            </div>
            <div style={{width:26,height:26,borderRadius:"50%",background:w.done?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
              {w.done&&<Ic.Check s={14} c="#fff" w={2.5}/>}
            </div>
          </div>
        ))}
      </div>}

      {/* Habits */}
      {activeTab==="habits"&&<div style={{animation:"slideRight .3s ease both"}}>
        <H2 t="Daily Habits" sub="Tap to check off for today"/>
        {habits.map(h=>(
          <div key={h.id} onClick={()=>toggleHabit(h.id)} style={{display:"flex",alignItems:"center",gap:12,background:h.done?T.sageP:"#fff",borderRadius:14,padding:"13px 14px",marginBottom:8,cursor:"pointer",border:`1.5px solid ${h.done?T.sage:T.linen}`,transition:"all .2s"}}>
            <Tile ic={h.IC} c={h.done?T.sage:T.bark} bg={h.done?"rgba(107,158,122,.2)":T.sand} s={18} ts={38} r={12}/>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{h.lb}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.bark,marginTop:2}}>🔥 {h.streak} day streak</div>
            </div>
            <div style={{width:26,height:26,borderRadius:"50%",background:h.done?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
              {h.done&&<Ic.Check s={14} c="#fff" w={2.5}/>}
            </div>
          </div>
        ))}
      </div>}

      {/* Coach chat */}
      {activeTab==="coach"&&<div style={{animation:"slideRight .3s ease both"}}>
        <div style={{background:AIGRAD,borderRadius:18,padding:"16px",marginBottom:14}}>
          <AIBadge t="Wellness Coach"/>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.6)",margin:"8px 0 0",lineHeight:1.6}}>Ask me anything about your health and wellbeing. I have your full wellness data.</p>
        </div>
        {["I'm feeling low this week","How can I sleep better?","I haven't worked out in 3 days"].map((q,i)=>(
          <div key={i} onClick={()=>setChatInp(q)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:11,padding:"9px 14px",cursor:"pointer",marginBottom:8,fontFamily:FB,fontSize:12,color:T.bark}}>{q}</div>
        ))}
        <div style={{maxHeight:250,overflowY:"auto",marginBottom:10}}>
          {chatHist.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:8}}>
              <div style={{maxWidth:"85%",background:m.role==="user"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#fff",borderRadius:16,padding:"10px 14px",border:m.role==="assistant"?`1px solid ${T.linen}`:"none"}}>
                <p style={{fontFamily:FB,fontSize:13,color:m.role==="user"?"rgba(255,255,255,.9)":T.bark,margin:0,lineHeight:1.6}}>{m.content}</p>
              </div>
            </div>
          ))}
          {chatLoad&&<div style={{display:"flex",gap:4,padding:"8px 0"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:T.taupe,animation:`dot 1.2s ease-in-out ${i*.2}s infinite`}}/>)}</div>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={chatInp} onChange={e=>setChatInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askCoach()} placeholder="How are you feeling? Ask anything…" style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          <button onClick={askCoach} style={{background:T.sage,border:"none",borderRadius:13,padding:"0 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Send s={16} c="#fff" w={2}/></button>
        </div>
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 7. MORNING BRIEFING — fully interactive
// ═══════════════════════════════════════════════════════════════════
function BriefingScreen({profile,onAddTask}){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [checkedPriorities,setCheckedPriorities]=useState([]);
  const [checkedReminders,setCheckedReminders]=useState([]);
  const [askInp,setAskInp]=useState("");
  const [askResp,setAskResp]=useState(null);
  const [askLoad,setAskLoad]=useState(false);
  const [shared,setShared]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const [addedTasks,setAddedTasks]=useState([]);
  const tC=t=>t==="Work"?T.sky:t==="Family"?T.sage:t==="Me"?T.blush:T.gold;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Family"?Ic.Kids:t==="Me"?Ic.Leaf:Ic.Home;

  // Upcoming birthdays in next 7 days
  const upcomingBdays=[];
  const today=new Date();
  [...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[])].forEach(p=>{
    if(p?.bday){
      const parts=p.bday.split("/");
      if(parts.length===2){
        const next=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
        if(next<today)next.setFullYear(today.getFullYear()+1);
        const days=Math.round((next-today)/86400000);
        if(days<=7)upcomingBdays.push({name:p.name,days});
      }
    }
  });
  if(profile?.partnerBday){
    const parts=profile.partnerBday.split("-");
    if(parts.length===3){
      const next=new Date(today.getFullYear(),parseInt(parts[1])-1,parseInt(parts[2]));
      if(next<today)next.setFullYear(today.getFullYear()+1);
      const days=Math.round((next-today)/86400000);
      if(days<=7)upcomingBdays.push({name:profile.partner||"Partner",days});
    }
  }

  const gen=async()=>{
    setLoading(true);setCheckedPriorities([]);setCheckedReminders([]);setAskResp(null);
    const bdayCtx=upcomingBdays.length?`IMPORTANT — upcoming birthdays: ${upcomingBdays.map(b=>`${b.name} in ${b.days} day${b.days===1?"":"s"}`).join(", ")}. Include a reminder about this.`:"";
    const familyCtx=`Partner: ${profile?.partner||"none"}, kids: ${profile?.kids?.map(k=>`${k.name} (${k.age||"?"})`).join(",")||"none"}, parents: ${profile?.parents?.map(p=>p.name).join(",")||"none"}, in-laws: ${profile?.inlaws?.map(p=>p.name).join(",")||"none"}`;
    const sys=`You are Nora inside HerNest. Return ONLY valid JSON no markdown:
{"greeting":"","date":"","weatherNote":"","weatherType":"sunny|cloudy|rainy","priorities":[{"text":"","tag":"Work|Family|Me|Home"}],"reminders":["","",""],"budgetNote":"","tripNote":"","affirmation":"","energyTip":"","focusWord":""}
5 priorities, 3-4 reminders, include energyTip and a one-word focusWord for the day (e.g. "Focus", "Rest", "Connect").`;
    const ctx=`Name: ${profile?.name||"Sarah"}, role: ${profile?.role||"CFO"}, ${familyCtx}, trip: ${profile?.tripGoal||"none"}, fitness: ${profile?.fitnessGoal||"none"}, challenge: ${profile?.challenge||"mental load"}, priorities: ${profile?.priorities?.join(",")||"family,career,fitness"}. ${bdayCtx}`;
    try{const raw=await claude(sys,ctx);setData(JSON.parse(raw.replace(/```json|```/g,"").trim()));}
    catch(e){setData({greeting:`Good morning${profile?.name?`, ${profile.name}`:""}!`,date:new Date().toLocaleDateString("en-AU",{weekday:"long",month:"long",day:"numeric"}),weatherNote:"Make today count — you've got this.",weatherType:"sunny",priorities:[{text:"Block 2hrs for deep work",tag:"Work"},{text:"School run 8:15am",tag:"Family"},{text:"30 min workout",tag:"Me"},{text:"Grocery order",tag:"Home"},{text:"Check budget",tag:"Work"}],reminders:["Check in with the kids tonight","Review tomorrow's calendar","Drink 8 glasses of water"],budgetNote:"Stay mindful of spending today.",tripNote:profile?.tripGoal?`${profile.tripGoal} — keep planning!`:"Start planning your next adventure.",affirmation:"You carry so much, so gracefully. Today, you have already won.",energyTip:"Start with your hardest task first — your energy is highest in the morning.",focusWord:"Focus"});}
    setLoading(false);
  };
  const speakBriefing=()=>{
    if(!data||!window.speechSynthesis)return;
    if(speaking){window.speechSynthesis.cancel();setSpeaking(false);return;}
    const txt=`Good morning ${profile?.name||"lovely"}. Here is your briefing for today. Your focus word is ${data.focusWord||"today"}. ${data.weatherNote}. Your top priorities are: ${data.priorities?.slice(0,3).map((p,i)=>`${i+1}. ${p.text}`).join(". ")}. Don't forget: ${data.reminders?.slice(0,2).join(". And ")}. ${data.affirmation}`;
    const utt=new SpeechSynthesisUtterance(txt);
    utt.rate=0.92;utt.pitch=1.05;utt.volume=1;
    const voices=window.speechSynthesis.getVoices();
    const preferred=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Karen")||v.name.includes("Moira")||v.name.includes("Female")||v.lang==="en-AU"||v.lang==="en-GB");
    if(preferred)utt.voice=preferred;
    utt.onend=()=>setSpeaking(false);
    utt.onerror=()=>setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utt);
  };

  const quickAdd=(text,tag)=>{
    if(addedTasks.includes(text))return;
    setAddedTasks(p=>[...p,text]);
    if(onAddTask)onAddTask({tasks:[{text,tag,priority:"high"}]});
  };

  useEffect(()=>{gen();},[]);
  useEffect(()=>()=>{window.speechSynthesis?.cancel();},[]);

  const askNora=async()=>{
    if(!askInp.trim()||askLoad)return;
    const msg=askInp.trim();setAskInp("");setAskLoad(true);
    const ctx=data?`Briefing context: priorities=${data.priorities?.map(p=>p.text).join(",")}, reminders=${data.reminders?.join(",")}.`:"";
    try{const raw=await claude(`You are Nora, warm AI assistant. ${ctx} Answer in 2 sentences max, actionable and warm.`,msg);setAskResp(raw);}
    catch(e){setAskResp("I am here with you 💛");}
    setAskLoad(false);
  };

  const shareBriefing=()=>{
    if(!data)return;
    const nl="\n";const txt="My day — "+data.date+nl+nl+"Priorities:"+nl+data.priorities?.map((p,i)=>(i+1)+". "+p.text).join(nl)+nl+nl+"Reminders:"+nl+data.reminders?.map(r=>"• "+r).join(nl)+nl+nl+'Nora says: "'+data.affirmation+'"'+nl+nl+"Sent from HerNest ✨";
    if(navigator.share){navigator.share({title:"My Day",text:txt}).catch(()=>{});}
    else{navigator.clipboard.writeText(txt).catch(()=>{});setShared(true);setTimeout(()=>setShared(false),2000);}
  };

  if(loading) return(
    <div style={{textAlign:"center",padding:"50px 20px",animation:"fadeUp .4s ease both"}}>
      <div style={{width:60,height:60,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",animation:"breathe 2s ease-in-out infinite"}}><Ic.Sun s={28} c="#fff" w={1.4}/></div>
      <p style={{fontFamily:FD,fontStyle:"italic",fontSize:18,color:T.esp}}>Nora is preparing your morning…</p>
      <p style={{fontFamily:FB,fontSize:12,color:T.taupe,margin:"6px 0 0"}}>Personalised just for you</p>
    </div>
  );
  if(!data) return null;

  const allPrioritiesDone=data.priorities&&checkedPriorities.length===data.priorities.length;

  return(
    <div style={{animation:"fadeUp .5s ease both"}}>
      {/* Hero */}
      <div style={{background:AIGRAD,borderRadius:24,padding:"24px 22px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <AIBadge t="Morning Briefing"/>
          <button onClick={shareBriefing} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:20,padding:"5px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:"rgba(255,255,255,.7)",cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            {shared?<><Ic.Check s={11} c={T.sage} w={2.5}/>Copied!</>:<><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="rgba(255,255,255,.7)" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="rgba(255,255,255,.7)" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="rgba(255,255,255,.7)" strokeWidth="1.8"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="rgba(255,255,255,.7)" strokeWidth="1.8" strokeLinecap="round"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="rgba(255,255,255,.7)" strokeWidth="1.8" strokeLinecap="round"/></svg>Share</>}
          </button>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{flex:1}}>
            <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:"#fff",margin:"0 0 4px",fontWeight:400}}>{data.greeting}</h2>
            <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:0}}>{data.date}</p>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            {data.focusWord&&<div style={{textAlign:"center",background:"rgba(196,154,60,.2)",borderRadius:14,padding:"10px 12px",border:"1px solid rgba(196,154,60,.3)"}}>
              <div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:T.gold}}>{data.focusWord}</div>
              <div style={{fontFamily:FB,fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:1,textTransform:"uppercase"}}>today</div>
            </div>}
            {"speechSynthesis" in window&&<button onClick={speakBriefing} style={{width:44,height:44,borderRadius:13,background:speaking?"rgba(196,154,60,.3)":"rgba(255,255,255,.1)",border:`1px solid ${speaking?"rgba(196,154,60,.5)":"rgba(255,255,255,.15)"}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}} title="Listen to briefing">
              {speaking?<div style={{display:"flex",gap:2,alignItems:"flex-end",height:16}}>{[10,16,12,18,10].map((h,i)=><div key={i} style={{width:3,height:h,background:T.gold,borderRadius:2,animation:`dot 1s ease-in-out ${i*.1}s infinite`}}/>)}</div>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinejoin="round"/><path d="M15.54 8.46a5 5 0 010 7.07" stroke="rgba(255,255,255,.7)" strokeWidth="1.5" strokeLinecap="round"/><path d="M19.07 4.93a10 10 0 010 14.14" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            </button>}
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,.08)",borderRadius:13,padding:"12px 14px",borderLeft:`3px solid ${T.gold}`,display:"flex",alignItems:"center",gap:10}}>
          {data.weatherType==="rainy"?<Ic.Drop s={18} c={T.goldP} w={1.4}/>:<Ic.Sun s={18} c={T.goldP} w={1.4}/>}
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.75)",margin:0,lineHeight:1.6}}>{data.weatherNote}</p>
        </div>
      </div>

      {/* Birthday alerts */}
      {upcomingBdays.map((b,i)=>(
        <div key={i} style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,borderRadius:14,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🎂</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>{b.name}'s birthday {b.days===0?"is TODAY!":b.days===1?"is tomorrow!":`is in ${b.days} days`}</div>
            <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.75)"}}>Don't forget to make it special 💛</div>
          </div>
        </div>
      ))}

      {/* Priorities — interactive checkboxes */}
      <Card sx={{borderLeft:`4px solid ${T.gold}`}} ch={<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <H2 t="Today's Priorities"/>
          {allPrioritiesDone&&<span style={{fontFamily:FB,fontSize:11,color:T.sage,fontWeight:700}}>All done! 🎉</span>}
        </div>
        {data.priorities.map((p,i)=>{
          const done=checkedPriorities.includes(i);
          const TC=tIC(p.tag);const tc=tC(p.tag);
          return(
            <div key={i} onClick={()=>setCheckedPriorities(prev=>done?prev.filter(x=>x!==i):[...prev,i])} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 12px",background:done?T.sageP:T.sand,borderRadius:12,marginBottom:8,cursor:"pointer",transition:"all .2s",border:`1.5px solid ${done?T.sage:T.linen}`}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:done?T.sage:T.linen,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}>
                {done&&<Ic.Check s={13} c="#fff" w={2.5}/>}
              </div>
              <Tile ic={TC} c={done?T.sage:tc} bg={(done?T.sage:tc)+"18"} s={15} ts={30} r={9}/>
              <span style={{fontFamily:FB,fontSize:13,color:done?T.taupe:T.esp,flex:1,textDecoration:done?"line-through":"none"}}>{p.text}</span>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                {!done&&<button onClick={e=>{e.stopPropagation();quickAdd(p.text,p.tag);}} style={{background:addedTasks.includes(p.text)?T.sageP:T.goldP,border:`1px solid ${addedTasks.includes(p.text)?T.sage:T.gold}30`,borderRadius:8,padding:"3px 8px",fontFamily:FB,fontSize:10,fontWeight:700,color:addedTasks.includes(p.text)?T.sage:T.gold,cursor:"pointer",whiteSpace:"nowrap"}}>
                  {addedTasks.includes(p.text)?"Added ✓":"+ Plan"}
                </button>}
                <Tag ch={p.tag} c={done?T.taupe:tc}/>
              </div>
            </div>
          );
        })}
      </div>}/>

      {/* Reminders — dismissable */}
      <Card ch={<div>
        <H2 t="Don't Forget"/>
        {data.reminders.map((r,i)=>{
          const dismissed=checkedReminders.includes(i);
          return !dismissed&&(
            <div key={i} style={{display:"flex",gap:12,padding:"10px 0",alignItems:"center",borderBottom:i<data.reminders.length-1?`1px solid ${T.linen}`:"none"}}>
              <Tile ic={Ic.Clock} c={T.gold} bg={T.goldP} s={14} ts={28} r={8}/>
              <span style={{fontFamily:FB,fontSize:13,color:T.bark,lineHeight:1.5,flex:1}}>{r}</span>
              <button onClick={()=>setCheckedReminders(p=>[...p,i])} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
            </div>
          );
        })}
        {checkedReminders.length===data.reminders.length&&<p style={{fontFamily:FD,fontStyle:"italic",fontSize:14,color:T.sage,margin:0,textAlign:"center"}}>All reminders cleared ✓</p>}
      </div>}/>

      {/* Snapshot row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{lb:"Budget",note:data.budgetNote,c:T.gold,bg:T.goldP,IC:Ic.Budget},{lb:"Next Trip",note:data.tripNote,c:T.sky,bg:T.skyP,IC:Ic.Suitcase}].map(b=>(
          <div key={b.lb} style={{background:b.bg,borderRadius:16,padding:"14px",border:`1px solid ${b.c}25`}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><b.IC s={14} c={b.c} w={1.5}/><span style={{fontFamily:FB,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:b.c}}>{b.lb}</span></div>
            <p style={{fontFamily:FB,fontSize:12,color:T.esp,margin:0,lineHeight:1.5}}>{b.note}</p>
          </div>
        ))}
      </div>

      {/* Energy tip */}
      {data.energyTip&&<Card sx={{background:`linear-gradient(135deg,${T.esp},#4a2e18)`,border:"none",marginBottom:14}} ch={<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Ic.Bulb s={16} c={T.gold} w={1.5}/><span style={{fontFamily:FB,fontSize:10,color:T.gold,letterSpacing:2,textTransform:"uppercase",fontWeight:700}}>Energy Tip</span></div>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.75)",margin:0,lineHeight:1.65}}>{data.energyTip}</p>
      </div>}/>}

      {/* Affirmation */}
      <div style={{background:`linear-gradient(135deg,${T.blushP},${T.goldP})`,borderRadius:18,padding:"20px",textAlign:"center",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Ic.Flower s={32} c={T.blush} w={1.2}/></div>
        <p style={{fontFamily:FD,fontStyle:"italic",fontSize:17,color:T.esp,margin:0,lineHeight:1.7}}>"{data.affirmation}"</p>
      </div>

      {/* Ask Nora */}
      <Card sx={{background:AIGRAD,border:"none",marginBottom:14}} ch={<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic.Star s={13} c="#fff" w={1.5}/></div>
          <span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)"}}>Ask Nora about your day</span>
        </div>
        {askResp&&<div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"10px 12px",marginBottom:10}}>
          <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.85)",margin:0,lineHeight:1.6}}>{askResp}</p>
        </div>}
        <div style={{display:"flex",gap:8}}>
          <input value={askInp} onChange={e=>setAskInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askNora()} placeholder="e.g. How do I fit gym in today?" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 12px",borderRadius:12,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"#fff",outline:"none"}}/>
          <button onClick={askNora} disabled={!askInp.trim()||askLoad} style={{background:askInp.trim()&&!askLoad?`linear-gradient(135deg,${T.gold},#8B6914)`:"rgba(255,255,255,.1)",border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {askLoad?<Spinner/>:<Ic.Send s={15} c="#fff" w={2}/>}
          </button>
        </div>
      </div>}/>

      <button onClick={gen} style={{width:"100%",background:"none",border:`1.5px solid ${T.linen}`,borderRadius:13,padding:"11px",fontFamily:FB,fontSize:12,color:T.bark,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <Ic.Refresh s={15} c={T.bark} w={1.8}/> Refresh briefing
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NORA CHAT
// ═══════════════════════════════════════════════════════════════════
function NoraScreen({onTasks,profile}){
  const [msgs,setMsgs]=useState(()=>{
    try{const s=sessionStorage.getItem("hn_nora_msgs");return s?JSON.parse(s):[{role:"assistant",content:`Hello${profile?.name?`, ${profile.name}`:", lovely"}. I'm Nora, your AI Mental Load Manager.\n\nTalk to me naturally — tell me what's on your mind and I'll organise everything for you.`,parsed:null}];}
    catch(e){return [{role:"assistant",content:`Hello${profile?.name?`, ${profile.name}`:", lovely"}. I'm Nora, your AI Mental Load Manager.\n\nTalk to me naturally — tell me what's on your mind and I'll organise everything for you.`,parsed:null}];}
  });
  const [inp,setInp]=useState(""); const [loading,setLoading]=useState(false);
  const [listening,setListening]=useState(false);
  const recogRef=useRef(null);
  const ref=useRef(null);
  useEffect(()=>{
    try{const save=msgs.slice(-20).map(m=>({role:m.role,content:m.content}));sessionStorage.setItem("hn_nora_msgs",JSON.stringify(save));}catch(e){}
  },[msgs]);

  const startVoice=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Voice input not supported on this browser. Try Chrome.");return;}
    if(listening){recogRef.current?.stop();setListening(false);return;}
    const r=new SR();
    r.continuous=false;r.interimResults=true;r.lang="en-AU";
    r.onstart=()=>setListening(true);
    r.onresult=e=>{
      const t=Array.from(e.results).map(r=>r[0].transcript).join("");
      setInp(t);
    };
    r.onend=()=>setListening(false);
    r.onerror=()=>setListening(false);
    recogRef.current=r;
    r.start();
  };
  const kidName=profile?.kids?.[0]?.name||"my daughter";
  const trip=profile?.tripGoal||"our next trip";
  const SUGG=[
    `${kidName} has swimming Wednesday, I have a board meeting Monday and we haven't booked ${trip} yet`,
    `I'm exhausted, haven't worked out in a week, groceries are running low`,
    `Plan my week — work Mon-Fri, ${kidName}'s activities, need some me-time too`
  ];
  useEffect(()=>{ref.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);
  const tC=t=>t==="Work"?T.sky:t==="Me"?T.blush:t==="Travel"?T.teal:T.sage;
  const tIC=t=>t==="Work"?Ic.Bag:t==="Me"?Ic.Leaf:t==="Travel"?Ic.Suitcase:Ic.Plan;
  const send=async()=>{
    if(!inp.trim()||loading)return;
    const msg=inp.trim();setInp("");setLoading(true);
    const profileCtx=profile?`User profile: name ${profile.name||"her"}, role ${profile.role||"mum"}, kids: ${profile.kids?.map(k=>`${k.name} (${k.age})`).join(",")||"none listed"}, partner: ${profile.partner||"none"}, parents: ${profile.parents?.map(p=>`${p.name} (${p.role})`).join(",")||"none listed"}, in-laws: ${profile.inlaws?.map(p=>`${p.name} (${p.role})`).join(",")||"none listed"}, trip goal: ${profile.tripGoal||"none"}, priorities: ${profile.priorities?.join(",")||"family"}, challenge: ${profile.challenge||"mental load"}.`:"";
    const sys=`You are Nora, a warm, intelligent AI Mental Load Manager inside HerNest. ${profileCtx}
You know this mum personally. Use her name, reference her kids by name, mention her real goals.
Respond with 2-3 warm, specific, empathetic sentences that show you KNOW her. Then output:
<ND>{"tasks":[{"text":"","tag":"Work|Family|Me|Home|Travel","priority":"high|medium|low"}],"reminders":[{"text":""}],"insight":"a short, warm, personal observation about what she shared"}</ND>
Min 3 tasks. Make tasks specific and actionable. The insight should feel like it came from a close friend who truly gets her life.`;
    const hist=msgs.map(m=>({role:m.role,content:m.content}));
    try{
      const raw=await claude(sys,msg,hist);
      const match=raw.match(/<ND>([\s\S]*?)<\/ND>/);
      let parsed=null;if(match){try{parsed=JSON.parse(match[1].trim());}catch(e){}}
      const display=raw.replace(/<ND>[\s\S]*?<\/ND>/g,"").trim();
      setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:display,parsed}]);
      if(parsed&&onTasks)onTasks(parsed);
    }catch(e){setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"I had a quiet moment there — my connection dropped. Your message was heard though. Try again and I'll be right here. 💛",parsed:null}]);}
    setLoading(false);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 130px)",animation:"fadeUp .4s ease both"}}>
      <div style={{background:AIGRAD,borderRadius:22,padding:"18px 20px",marginBottom:12,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",animation:"breathe 3s ease-in-out infinite",boxShadow:`0 0 20px rgba(196,154,60,.4)`}}><Ic.Star s={22} c="#fff" w={1.3}/></div>
          <div style={{flex:1}}><h2 style={{fontFamily:FD,fontSize:20,fontWeight:600,color:"#fff",margin:0,fontStyle:"italic"}}>Nora AI</h2><p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.4)",margin:0,letterSpacing:1.5,textTransform:"uppercase"}}>Mental Load Manager</p></div>
          <button onClick={()=>{setMsgs([{role:"assistant",content:`Hello again ${profile?.name||"lovely"} 💛 Fresh start — what's on your mind?`,parsed:null}]);try{sessionStorage.removeItem("hn_nora_msgs");}catch(e){}}} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:10,padding:"5px 10px",fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.5)",cursor:"pointer"}}>Clear</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",paddingBottom:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12,animation:"fadeUp .3s ease both"}}>
            {m.role==="assistant"&&<div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,marginRight:8,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"flex-end"}}><Ic.Star s={13} c="#fff" w={1.5}/></div>}
            <div style={{maxWidth:"82%",background:m.role==="user"?`linear-gradient(135deg,${T.esp},#4a3020)`:"#fff",borderRadius:m.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",padding:"12px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.08)",border:m.role==="assistant"?`1px solid ${T.linen}`:"none"}}>
              <div style={{color:m.role==="user"?"rgba(255,255,255,.9)":T.esp}}>
                {m.content.split("\n").filter(l=>l.trim()).map((line,j)=><p key={j} style={{margin:"0 0 5px",lineHeight:1.65,fontSize:13,fontFamily:FB}}>{line}</p>)}
              </div>
              {m.parsed&&<div style={{marginTop:12,borderTop:`1px solid ${T.linen}`,paddingTop:10}}>
                <AIBadge t="Organised for you"/>
                <div style={{marginTop:10}}>
                  {m.parsed.tasks?.slice(0,4).map((tk,k)=>(
                    <div key={k} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:T.sand,borderRadius:10,marginBottom:6}}>
                      <Tile ic={tIC(tk.tag)} c={tC(tk.tag)} bg={tC(tk.tag)+"18"} s={14} ts={28} r={8}/>
                      <span style={{fontFamily:FB,fontSize:12,color:T.esp,flex:1}}>{tk.text}</span>
                      <Tag ch={tk.tag} c={tC(tk.tag)}/>
                    </div>
                  ))}
                  {m.parsed.insight&&<div style={{padding:"10px",background:T.blushP,borderRadius:12,marginTop:6}}><p style={{fontFamily:FD,fontStyle:"italic",fontSize:13,color:T.esp,margin:0,lineHeight:1.6}}>"{m.parsed.insight}"</p></div>}
                </div>
              </div>}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:12}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Star s={13} c="#fff" w={1.5}/></div>
          <div style={{background:"#fff",borderRadius:"20px 20px 20px 4px",padding:"14px 18px",border:`1px solid ${T.linen}`}}><Dots/></div>
        </div>}
        <div ref={ref}/>
      </div>
      {msgs.length<2&&<div style={{flexShrink:0,marginBottom:8}}>{SUGG.map((s,i)=><div key={i} onClick={()=>setInp(s)} style={{background:"#fff",border:`1px solid ${T.linen}`,borderRadius:12,padding:"9px 14px",marginBottom:6,cursor:"pointer",fontFamily:FB,fontSize:12,color:T.bark,lineHeight:1.5}}>{s}</div>)}</div>}
      <div style={{flexShrink:0,display:"flex",gap:8,paddingTop:8,borderTop:`1px solid ${T.linen}`}}>
        <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Tell me what's on your mind…" rows={2} style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:16,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp,lineHeight:1.5}}/>
        <button onClick={startVoice} style={{width:46,height:46,borderRadius:14,border:`1.5px solid ${listening?T.blush:T.linen}`,flexShrink:0,background:listening?T.blushP:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"flex-end",transition:"all .2s"}}>
          {listening?<div style={{display:"flex",gap:2,alignItems:"flex-end",height:16}}>{[8,14,10,16,8].map((h,i)=><div key={i} style={{width:3,height:h,background:T.blush,borderRadius:2,animation:`dot 1s ease-in-out ${i*.1}s infinite`}}/>)}</div>:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="9" y="2" width="6" height="11" rx="3" stroke={T.bark} strokeWidth="1.5"/><path d="M5 10a7 7 0 0014 0" stroke={T.bark} strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="17" x2="12" y2="21" stroke={T.bark} strokeWidth="1.5" strokeLinecap="round"/></svg>}
        </button>
        <button onClick={send} disabled={!inp.trim()||loading} style={{width:46,height:46,borderRadius:14,border:"none",flexShrink:0,background:inp.trim()&&!loading?`linear-gradient(135deg,${T.esp},#4a3020)`:T.linen,cursor:inp.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",alignSelf:"flex-end"}}>
          {loading?<Spinner/>:<Ic.Send s={18} c={inp.trim()?"#fff":T.taupe} w={2}/>}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════════════
function HomeScreen({go,aiTasks,profile,streak=1}){
  const [water,setWater]=useState(()=>{try{return parseInt(sessionStorage.getItem("hn_hw")||"3");}catch(e){return 3;}});
  const [noraInp,setNoraInp]=useState("");
  const [noraResp,setNoraResp]=useState(null);
  const [noraLoad,setNoraLoad]=useState(false);
  const hour=new Date().getHours();
  const date=new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"});
  const greet=hour<5?"Still up?":hour<12?"Good morning":hour<17?"Good afternoon":hour<21?"Good evening":"Good night";
  const firstName=profile?.name?.split(" ")[0]||"lovely";
  const tripGoal=profile?.tripGoal;
  const FEATS=[
    {id:"brief",lb:"Briefing",sub:"Your morning",bg:"linear-gradient(135deg,#2d1a00,#5a3a10)",IC:Ic.Sun,ic:"#F0E2B8"},
    {id:"plan",lb:"Plan",sub:"Tasks & meals",bg:"linear-gradient(135deg,#0e1a2e,#1a3a5a)",IC:Ic.Plan,ic:"#C4DCEA"},
    {id:"trips",lb:"Trips",sub:"Plan & pack",bg:"linear-gradient(135deg,#0e2a1e,#1a5a3a)",IC:Ic.Compass,ic:"#C8E0CE"},
    {id:"budget",lb:"Budget",sub:"CFO insights",bg:"linear-gradient(135deg,#1a1400,#3a2e00)",IC:Ic.Budget,ic:"#F0E2B8"},
    {id:"style",lb:"Style",sub:"AI stylist",bg:"linear-gradient(135deg,#2d1428,#4a1a3a)",IC:Ic.Hanger,ic:"#F2D4CA"},
    {id:"circle",lb:"Circle",sub:"Your people",bg:"linear-gradient(135deg,#0e1428,#1a2a4e)",IC:Ic.People,ic:"#C4DCEA"},
    {id:"wellness",lb:"Thrive",sub:"Mind & body",bg:"linear-gradient(135deg,#0e2218,#1a4a2e)",IC:Ic.Leaf,ic:"#C8E0CE"},
  ];
  useEffect(()=>{try{sessionStorage.setItem("hn_hw",String(water));}catch(e){};},[water]);
  const askNora=async()=>{
    if(!noraInp.trim()||noraLoad)return;
    const msg=noraInp.trim();setNoraInp("");setNoraLoad(true);
    const profileCtx=profile?`User: ${profile.name}, ${profile.role}, kids: ${profile.kids?.map(k=>k.name).join(",")}, priorities: ${profile.priorities?.join(",")}.`:"";
    try{
      const raw=await claude(`You are Nora, warm AI life assistant. ${profileCtx} Reply in 2 sentences max — warm, specific, actionable. End with one emoji.`,msg);
      setNoraResp(raw);
    }catch(e){setNoraResp("I am here with you. Let us tackle this together 💛");}
    setNoraLoad(false);
  };
  const PROMPTS=["What should I focus on today?","I am feeling overwhelmed","Plan my week for me"];
  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Hero — Nora front and centre */}
      <div style={{background:AIGRAD,borderRadius:24,padding:"22px 20px 18px",marginBottom:12,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
        <div style={{position:"absolute",bottom:-30,left:-30,width:100,height:100,borderRadius:"50%",background:"rgba(107,158,122,.04)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <p style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.3)",letterSpacing:2,textTransform:"uppercase",margin:"0 0 4px"}}>{date}</p>
            <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:"#fff",margin:"0 0 2px",fontWeight:300}}>{greet},</h1>
            <h1 style={{fontFamily:FD,fontSize:26,color:T.gold,margin:0,fontWeight:700,fontStyle:"normal"}}>{firstName} ✨</h1>
          </div>
          <div style={{display:"flex",gap:6}}>
            <div style={{textAlign:"center",background:"rgba(255,255,255,.08)",borderRadius:14,padding:"8px 10px"}}>
              <div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:"#fff"}}>{water}</div>
              <div style={{fontFamily:FB,fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:1,textTransform:"uppercase"}}>water</div>
            </div>
            <div style={{textAlign:"center",background:"rgba(196,154,60,.15)",borderRadius:14,padding:"8px 10px",border:`1px solid rgba(196,154,60,.25)`}}>
              <div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:T.gold}}>{streak}🔥</div>
              <div style={{fontFamily:FB,fontSize:8,color:"rgba(255,255,255,.35)",letterSpacing:1,textTransform:"uppercase"}}>streak</div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 20px rgba(196,154,60,.5)`,animation:"breathe 3s ease-in-out infinite"}}><Ic.Star s={20} c="#fff" w={1.3}/></div>
          <div style={{flex:1,background:"rgba(255,255,255,.08)",borderRadius:"16px 16px 16px 4px",padding:"10px 14px"}}>
            <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.85)",margin:0,lineHeight:1.5}}>{noraResp||`What is on your mind today, ${firstName}?`}</p>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input value={noraInp} onChange={e=>setNoraInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askNora()} placeholder="Tell Nora anything..." style={{flex:1,fontFamily:FB,fontSize:13,padding:"11px 14px",borderRadius:14,border:"1.5px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",color:"#fff",outline:"none"}}/>
          <button onClick={askNora} disabled={!noraInp.trim()||noraLoad} style={{width:44,height:44,borderRadius:13,border:"none",background:noraInp.trim()&&!noraLoad?`linear-gradient(135deg,${T.gold},#8B6914)`:"rgba(255,255,255,.1)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background .15s"}}>
            {noraLoad?<Spinner/>:<Ic.Send s={18} c={noraInp.trim()?"#fff":"rgba(255,255,255,.3)"} w={2}/>}
          </button>
        </div>
        {!noraResp&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {PROMPTS.map((p,i)=><button key={i} onClick={()=>setNoraInp(p)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:20,padding:"5px 12px",fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.65)",cursor:"pointer"}}>{p}</button>)}
        </div>}
        {noraResp&&<button onClick={()=>go("nora")} style={{width:"100%",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"9px",fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.7)",cursor:"pointer",marginTop:4}}>Continue with Nora →</button>}
      </div>
      {/* Proactive birthday alerts */}
      {[...(profile?.kids||[]),...(profile?.parents||[]),...(profile?.inlaws||[])].filter(p=>{
        if(!p?.bday)return false;
        const parts=p.bday.split("/");
        if(parts.length!==2)return false;
        const today=new Date();
        const next=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
        if(next<today)next.setFullYear(today.getFullYear()+1);
        return Math.round((next-today)/86400000)<=7;
      }).map((p,i)=>{
        const today=new Date();
        const parts=p.bday.split("/");
        const next=new Date(today.getFullYear(),parseInt(parts[0])-1,parseInt(parts[1]));
        if(next<today)next.setFullYear(today.getFullYear()+1);
        const days=Math.round((next-today)/86400000);
        return(
          <div key={i} style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,borderRadius:16,padding:"13px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:24,flexShrink:0}}>🎂</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:"#fff"}}>{p.name} — {days===0?"TODAY!":days===1?"tomorrow":`in ${days} days`}</div>
              <div style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.75)"}}>Want Nora to handle the gift?</div>
            </div>
            <button onClick={()=>go("profile")} style={{background:"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",borderRadius:10,padding:"7px 12px",fontFamily:FB,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",flexShrink:0}}>Gift ideas 🎁</button>
          </div>
        );
      })}

      {typeof Notification!=="undefined"&&Notification.permission!=="granted"&&<div onClick={()=>go("profile")} style={{background:`linear-gradient(135deg,${T.gold},#8B6914)`,borderRadius:16,padding:"12px 16px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <Ic.Bell s={18} c="#fff" w={1.5}/>
        <div style={{flex:1}}><div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>Enable Morning Briefing</div><div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.75)"}}>Nora greets you every morning</div></div>
        <Ic.Arrow s={16} c="rgba(255,255,255,.7)" w={1.5}/>
      </div>}
      {tripGoal&&<div onClick={()=>go("trips")} style={{background:`linear-gradient(135deg,#0e2a1e,#1a5a3a)`,borderRadius:16,padding:"13px 16px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:12,border:"1px solid rgba(107,158,122,.2)"}}>
        <Tile ic={Ic.Compass} c="#C8E0CE" bg="rgba(107,158,122,.2)" s={18} ts={40} r={12}/>
        <div style={{flex:1}}><div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.4)",letterSpacing:1,textTransform:"uppercase",marginBottom:2}}>Next Adventure</div><div style={{fontFamily:FD,fontStyle:"italic",fontSize:16,color:"#fff",fontWeight:400}}>{tripGoal}</div></div>
        <Ic.Arrow s={16} c="rgba(255,255,255,.4)" w={1.5}/>
      </div>}
      {aiTasks?.length>0&&<Card sx={{borderLeft:`4px solid ${T.gold}`,marginBottom:12}} ch={<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>Nora organised</span><AIBadge t={`${aiTasks.length} tasks`}/></div>
        {aiTasks.slice(0,3).map((tk,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<2?`1px solid ${T.linen}`:"none"}}>
            <Tile ic={tk.tag==="Work"?Ic.Bag:tk.tag==="Me"?Ic.Leaf:Ic.Plan} c={tk.tag==="Work"?T.sky:tk.tag==="Me"?T.blush:T.sage} bg={tk.tag==="Work"?T.skyP:tk.tag==="Me"?T.blushP:T.sageP} s={15} ts={30} r={9}/>
            <span style={{fontFamily:FB,fontSize:13,color:T.esp,flex:1}}>{tk.text}</span>
            <Tag ch={tk.tag} c={tk.tag==="Work"?T.sky:tk.tag==="Me"?T.blush:T.sage}/>
          </div>
        ))}
      </div>}/>}
      <H2 t="Everything else" sub="All your tools in one place"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {FEATS.map(f=>(
          <div key={f.id} onClick={()=>go(f.id)} className="lift" style={{background:f.bg,borderRadius:18,padding:"16px 14px",cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,.15)"}}>
            <div style={{position:"absolute",bottom:-16,right:-16,width:50,height:50,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
            <div style={{width:36,height:36,borderRadius:11,background:"rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10,border:"1px solid rgba(255,255,255,.08)"}}><f.IC s={17} c={f.ic} w={1.4}/></div>
            <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:"#fff"}}>{f.lb}</div>
            <div style={{fontFamily:FB,fontSize:10,color:"rgba(255,255,255,.38)",marginTop:2}}>{f.sub}</div>
          </div>
        ))}
      </div>
      <Card ch={<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><Ic.Drop s={16} c={T.sky} w={1.5}/><span style={{fontFamily:FD,fontSize:14,fontWeight:600,color:T.esp}}>Hydration</span></div>
          <span style={{fontFamily:FB,fontSize:12,color:T.bark}}>{water}/8</span>
        </div>
        <div style={{display:"flex",gap:4}}>
          {Array.from({length:8},(_,i)=><div key={i} onClick={()=>setWater(i<water?i:i+1)} style={{flex:1,height:26,borderRadius:7,cursor:"pointer",background:i<water?T.sky:T.skyP,transition:"background .15s"}}/>)}
        </div>
      </div>}/>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════════
function SplashScreen({onDone}){useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);return(
  <div style={{minHeight:"100vh",background:ESPG,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
    <div style={{animation:"float 3s ease-in-out infinite",marginBottom:32}}>
      <div style={{width:90,height:90,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 40px rgba(196,154,60,.4)`}}><Ic.Star s={40} c="#fff" w={1.2}/></div>
    </div>
    <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:48,color:"#fff",margin:"0 0 8px",fontWeight:400,textAlign:"center",animation:"fadeUp .6s ease both"}}>Her<strong style={{fontStyle:"normal",fontWeight:700}}>Nest</strong></h1>
    <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",letterSpacing:3,textTransform:"uppercase",margin:"0 0 40px",animation:"fadeUp .6s .15s ease both"}}>Your world, beautifully organised</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",animation:"fadeUp .6s .3s ease both"}}>
      {["AI Mental Load","Trip Planning","Budget Coach","Style Stylist","Wellness"].map((f,i)=><span key={i} style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.5)",background:"rgba(255,255,255,.07)",borderRadius:20,padding:"5px 12px",border:"1px solid rgba(255,255,255,.08)"}}>{f}</span>)}
    </div>
    <div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"rgba(255,255,255,.1)"}}><div style={{height:"100%",background:`linear-gradient(90deg,${T.gold},${T.sage})`,borderRadius:3,animation:"breathe 2.8s ease"}}/></div>
  </div>
);}

function LoginScreen({onLogin}){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [loading,setLoading]=useState(false); const [mode,setMode]=useState("login"); const [error,setError]=useState("");
  const handleGoogle=async()=>{
    setLoading(true);setError("");
    try{
      const result=await signInWithPopup(auth,googleProvider);
      const u=result.user;
      onLogin({uid:u.uid,email:u.email,name:u.displayName?.split(" ")[0]||"",isGoogle:true});
    }catch(e){setError("Google sign in failed. Please try again.");setLoading(false);}
  };
  const handle=()=>{if(!email||!pass)return;setLoading(true);setTimeout(()=>{setLoading(false);onLogin({uid:email,email,name:email.split("@")[0]});},1200);};
  return(
    <div style={{minHeight:"100vh",background:ESPG,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
      <div style={{padding:"60px 32px 40px",textAlign:"center",animation:"fadeUp .5s ease both"}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:`0 0 30px rgba(196,154,60,.35)`}}><Ic.Star s={28} c="#fff" w={1.3}/></div>
        <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:36,color:"#fff",margin:"0 0 6px",fontWeight:400}}>Her<strong style={{fontStyle:"normal",fontWeight:700}}>Nest</strong></h1>
        <p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.45)",margin:0}}>{mode==="login"?"Welcome back, lovely.":"Join thousands of super mums."}</p>
      </div>
      <div style={{flex:1,background:T.cream,borderRadius:"28px 28px 0 0",padding:"32px 24px 40px",animation:"fadeUp .5s .15s ease both"}}>
        <p style={{fontFamily:FB,fontSize:11,color:T.taupe,textAlign:"center",letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Continue with</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
          {[{lb:"Google",bg:"#fff",br:T.linen,col:T.esp,logo:<svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>},
           {lb:"Apple",bg:"#000",br:"#000",col:"#fff",logo:<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>},
          ].map(b=>(
            <button key={b.lb} className="lift" onClick={b.lb==="Google"?handleGoogle:()=>{setLoading(true);setTimeout(()=>{setLoading(false);onLogin({uid:b.lb,email:b.lb,name:b.lb});},1200);}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px",borderRadius:14,border:`1.5px solid ${b.br}`,background:b.bg,cursor:"pointer",fontFamily:FB,fontSize:13,fontWeight:600,color:b.col}}>{b.logo}{b.lb}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}><div style={{flex:1,height:1,background:T.linen}}/><span style={{fontFamily:FB,fontSize:11,color:T.taupe,letterSpacing:1,textTransform:"uppercase"}}>or</span><div style={{flex:1,height:1,background:T.linen}}/></div>
        <FInput label="Email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} type="email" icon={Ic.Mail}/>
        <FInput label="Password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} type="password" icon={Ic.Lock}/>
        {mode==="login"&&<p style={{fontFamily:FB,fontSize:12,color:T.gold,textAlign:"right",marginBottom:20,marginTop:-6,cursor:"pointer"}}>Forgot password?</p>}
        <button onClick={handle} disabled={!email||!pass||loading} className="lift" style={{width:"100%",padding:"15px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:email&&pass&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:email&&pass?1:.5,background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>
          {loading?<div style={{width:20,height:20,border:"2.5px solid rgba(255,255,255,.3)",borderTop:"2.5px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>:mode==="login"?"Sign In":"Create Account"}
        </button>
        <p style={{fontFamily:FB,fontSize:13,color:T.bark,textAlign:"center",marginTop:20}}>
          {mode==="login"?"New to HerNest? ":"Already have an account? "}
          <span onClick={()=>setMode(mode==="login"?"signup":"login")} style={{color:T.gold,fontWeight:700,cursor:"pointer"}}>{mode==="login"?"Create account":"Sign in"}</span>
        </p>
      </div>
    </div>
  );
}

function ProgressDots({total,current}){return <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:28}}>{Array.from({length:total},(_,i)=><div key={i} style={{height:4,borderRadius:4,transition:"all .3s",background:i===current?T.gold:i<current?T.sage:T.linen,width:i===current?24:8}}/>)}</div>;}

function Step1({data,onChange,onNext}){
  const avatars=["👩","👩🏻","👩🏼","👩🏽","👩🏾","👩🏿"];
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:48,marginBottom:12,animation:"float 3s ease-in-out infinite"}}>{data.avatar||"👩"}</div><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Nice to meet you</h2><p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Let's personalise Nora for your life</p></div>
    <div style={{marginBottom:18}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Choose your avatar</label><div style={{display:"flex",gap:10,justifyContent:"center"}}>{avatars.map(a=><button key={a} onClick={()=>onChange("avatar",a)} style={{fontSize:26,background:data.avatar===a?T.goldP:"transparent",border:`2px solid ${data.avatar===a?T.gold:T.linen}`,borderRadius:12,padding:"7px",cursor:"pointer",transition:"all .15s"}}>{a}</button>)}</div></div>
    <FInput label="Your first name" placeholder="e.g. Sarah" value={data.name} onChange={e=>onChange("name",e.target.value)}/>
    <FInput label="Your city" placeholder="e.g. Melbourne" value={data.city} onChange={e=>onChange("city",e.target.value)}/>
    <div style={{marginBottom:18}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Your role</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Working Mum","Stay-at-Home Mum","Entrepreneur","Executive","Other"].map(r=><button key={r} onClick={()=>onChange("role",r)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.role===r?T.gold:T.linen}`,background:data.role===r?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:data.role===r?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{r}</button>)}</div></div>
    <button onClick={onNext} disabled={!data.name||!data.role} className="lift" style={{width:"100%",padding:"15px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:data.name&&data.role?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:data.name&&data.role?1:.5,background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>Continue →</button>
  </div>);}

function Step2({data,onChange,onNext,onBack}){
  const [kn,setKn]=useState(""); const [ka,setKa]=useState("");
  const [pn,setPn]=useState(""); const [pr,setPr]=useState("Mum");
  const addKid=()=>{if(!kn.trim())return;onChange("kids",[...(data.kids||[]),{name:kn,age:ka}]);setKn("");setKa("");};
  const addPerson=(field,name,role)=>{if(!name.trim())return;onChange(field,[...(data[field]||[]),{name,role}]);};
  const PARENT_ROLES=["Mum","Dad"];
  const INLAW_ROLES=["Mother-in-law","Father-in-law"];
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:24}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.People s={44} c={T.esp} w={1.2}/></div><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your family</h2><p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Tell Nora about the people you love most</p></div>
    
    <FInput label="Partner's name (optional)" placeholder="e.g. James" value={data.partner||""} onChange={e=>onChange("partner",e.target.value)}/>
    
    <div style={{marginBottom:16}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Your children</label>
      {(data.kids||[]).map((k,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.sageP,borderRadius:12,padding:"10px 14px",marginBottom:8}}><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp,flex:1}}>{k.name}{k.age?`, ${k.age}`:""}</span><button onClick={()=>onChange("kids",(data.kids||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button></div>)}
      <div style={{display:"flex",gap:8}}><input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:2,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/><input placeholder="Age" value={ka} onChange={e=>setKa(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/><button onClick={addKid} style={{background:T.esp,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button></div>
    </div>

    <div style={{marginBottom:16}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Your parents</label>
      {(data.parents||[]).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:8}}><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp,flex:1}}>{p.name}<span style={{fontFamily:FB,fontSize:11,color:T.bark,marginLeft:8}}>{p.role}</span></span><button onClick={()=>onChange("parents",(data.parents||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button></div>)}
      <div style={{display:"flex",gap:8,marginBottom:6}}>
        {PARENT_ROLES.map(r=><button key={r} onClick={()=>setPr(r)} style={{flex:1,padding:"6px",borderRadius:10,border:`1.5px solid ${pr===r?T.gold:T.linen}`,background:pr===r?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:pr===r?T.esp:T.bark,cursor:"pointer"}}>{r}</button>)}
      </div>
      <div style={{display:"flex",gap:8}}><input placeholder="Name" value={pn} onChange={e=>setPn(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/><button onClick={()=>{addPerson("parents",pn,pr);setPn("");}} style={{background:T.gold,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button></div>
    </div>

    <div style={{marginBottom:16}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>In-laws (optional)</label>
      {(data.inlaws||[]).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.lavP,borderRadius:12,padding:"10px 14px",marginBottom:8}}><span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp,flex:1}}>{p.name}<span style={{fontFamily:FB,fontSize:11,color:T.bark,marginLeft:8}}>{p.role}</span></span><button onClick={()=>onChange("inlaws",(data.inlaws||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button></div>)}
      <div style={{display:"flex",gap:8}}>
        <select onChange={e=>setPr(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
          {INLAW_ROLES.map(r=><option key={r}>{r}</option>)}
        </select>
        <input placeholder="Name" value={pn} onChange={e=>setPn(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 14px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
        <button onClick={()=>{addPerson("inlaws",pn,pr);setPn("");}} style={{background:T.lav,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
      </div>
    </div>

    <div style={{display:"flex",gap:10}}><button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button><button onClick={onNext} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>Continue →</button></div>
  </div>);}

function Step3({data,onChange,onNext,onBack}){
  const pList=[{id:"family",lb:"Family",IC:Ic.People,c:T.sage},{id:"career",lb:"Career",IC:Ic.Budget,c:T.sky},{id:"fitness",lb:"Fitness",IC:Ic.Leaf,c:T.blush},{id:"travel",lb:"Travel",IC:Ic.Compass,c:T.teal},{id:"finances",lb:"Finances",IC:Ic.Budget,c:T.gold},{id:"selfcare",lb:"Self-care",IC:Ic.Flower,c:T.lav}];
  const toggle=id=>{const c=data.priorities||[];onChange("priorities",c.includes(id)?c.filter(p=>p!==id):c.length<3?[...c,id]:c);};
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:28}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.Star s={44} c={T.gold} w={1.2}/></div><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your priorities</h2><p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Pick up to 3 — Nora will focus on these</p></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>{pList.map(p=>{const active=(data.priorities||[]).includes(p.id);return(<button key={p.id} onClick={()=>toggle(p.id)} style={{padding:"16px 14px",borderRadius:18,cursor:"pointer",textAlign:"left",background:active?`${p.c}18`:"#fff",border:`2px solid ${active?p.c:T.linen}`,transition:"all .18s"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}><p.IC s={20} c={active?p.c:T.taupe} w={1.5}/>{active&&<div style={{marginLeft:"auto",width:20,height:20,borderRadius:"50%",background:p.c,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Check s={11} c="#fff" w={2.5}/></div>}</div><div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:active?T.esp:T.bark}}>{p.lb}</div></button>);})}</div>
    <div style={{display:"flex",gap:10}}><button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button><button onClick={onNext} disabled={!(data.priorities||[]).length} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",opacity:(data.priorities||[]).length?1:.5,background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>Continue →</button></div>
  </div>);}

function Step4({data,onChange,onFinish,onBack}){
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:28}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Ic.Compass s={44} c={T.teal} w={1.2}/></div><h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your goals</h2><p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Nora will help you get there</p></div>
    <FInput label="Next trip destination" placeholder="e.g. Bali, Indonesia" value={data.tripGoal||""} onChange={e=>onChange("tripGoal",e.target.value)}/>
    <FInput label="Fitness goal" placeholder="e.g. Work out 4x per week" value={data.fitnessGoal||""} onChange={e=>onChange("fitnessGoal",e.target.value)}/>
    <FInput label="Savings goal" placeholder="e.g. $10,000 vacation fund" value={data.savingsGoal||""} onChange={e=>onChange("savingsGoal",e.target.value)}/>
    <div style={{marginBottom:18}}><label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Biggest challenge right now</label><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{["Mental load","Work-life balance","Staying fit","Budget management","Finding me-time"].map(c=><button key={c} onClick={()=>onChange("challenge",c)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.challenge===c?T.gold:T.linen}`,background:data.challenge===c?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:data.challenge===c?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{c}</button>)}</div></div>
    <div style={{display:"flex",gap:10}}><button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button><button onClick={onFinish} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none"}}>Meet Nora ✨</button></div>
  </div>);}

function Step5({data,onChange,onNext,onBack}){
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:44,marginBottom:12}}>👗</div>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Your style</h2>
      <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>Nora will style you perfectly every time</p>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Body shape</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Hourglass","Pear","Apple","Rectangle","Petite","Plus size"].map(s=>(
          <button key={s} onClick={()=>onChange("bodyShape",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.bodyShape===s?T.blush:T.linen}`,background:data.bodyShape===s?T.blushP:"#fff",fontFamily:FB,fontSize:12,color:data.bodyShape===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      <div>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Height</label>
        <select value={data.height||""} onChange={e=>onChange("height",e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
          <option value="">Select</option>
          {["Under 155cm","155-160cm","161-165cm","166-170cm","171-175cm","Over 175cm"].map(h=><option key={h}>{h}</option>)}
        </select>
      </div>
      <div>
        <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Clothing size</label>
        <select value={data.clothingSize||""} onChange={e=>onChange("clothingSize",e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
          <option value="">Select</option>
          {["AU 6","AU 8","AU 10","AU 12","AU 14","AU 16","AU 18","AU 20+"].map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Style vibe</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Classic","Minimalist","Boho","Edgy","Preppy","Romantic","Sporty"].map(s=>(
          <button key={s} onClick={()=>onChange("styleVibe",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.styleVibe===s?T.lav:T.linen}`,background:data.styleVibe===s?T.lavP:"#fff",fontFamily:FB,fontSize:12,color:data.styleVibe===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Work dress code</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Corporate","Business casual","Smart casual","Creative","Casual","Uniform"].map(s=>(
          <button key={s} onClick={()=>onChange("dresscode",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.dresscode===s?T.sky:T.linen}`,background:data.dresscode===s?T.skyP:"#fff",fontFamily:FB,fontSize:12,color:data.dresscode===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:20}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Favourite colours</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {[{lb:"Neutrals",c:"#B8A898"},{lb:"Navy",c:"#1a2a4e"},{lb:"Black",c:"#2E1F14"},{lb:"Camel",c:"#C49A3C"},{lb:"Blush",c:"#D4826A"},{lb:"Forest",c:"#1a5a3a"},{lb:"White",c:"#f5f5f5"},{lb:"Bold colours",c:"#7a3aaa"}].map(({lb,c})=>(
          <button key={lb} onClick={()=>{const cur=data.favColours||[];onChange("favColours",cur.includes(lb)?cur.filter(x=>x!==lb):[...cur,lb]);}} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${(data.favColours||[]).includes(lb)?c:T.linen}`,background:(data.favColours||[]).includes(lb)?c+"22":"#fff",fontFamily:FB,fontSize:12,color:(data.favColours||[]).includes(lb)?T.esp:T.bark,cursor:"pointer"}}>{lb}</button>
        ))}
      </div>
    </div>

    <div style={{display:"flex",gap:10}}>
      <button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button>
      <button onClick={onNext} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",border:"none"}}>Continue →</button>
    </div>
  </div>);
}

function Step6({data,onChange,onFinish,onBack}){
  return(<div style={{animation:"slideRight .4s ease both"}}>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:44,marginBottom:12}}>💚</div>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:26,color:T.esp,margin:"0 0 6px"}}>Health & finances</h2>
      <p style={{fontFamily:FB,fontSize:13,color:T.bark,margin:0}}>The more Nora knows, the better she helps</p>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Dietary preferences</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["No restrictions","Vegetarian","Vegan","Gluten free","Dairy free","Halal","Kosher"].map(s=>(
          <button key={s} onClick={()=>onChange("diet",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.diet===s?T.sage:T.linen}`,background:data.diet===s?T.sageP:"#fff",fontFamily:FB,fontSize:12,color:data.diet===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Current fitness routine</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Just starting","1-2x per week","3-4x per week","5+ per week","Very active"].map(s=>(
          <button key={s} onClick={()=>onChange("fitnessLevel",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.fitnessLevel===s?T.teal:T.linen}`,background:data.fitnessLevel===s?T.tealP:"#fff",fontFamily:FB,fontSize:12,color:data.fitnessLevel===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Sleep goal (hours)</label>
      <div style={{display:"flex",gap:8}}>
        {["6","7","8","9"].map(h=>(
          <button key={h} onClick={()=>onChange("sleepGoal",parseInt(h))} style={{flex:1,padding:"10px",borderRadius:12,border:`1.5px solid ${data.sleepGoal===parseInt(h)?T.lav:T.linen}`,background:data.sleepGoal===parseInt(h)?T.lavP:"#fff",fontFamily:FD,fontSize:18,fontWeight:700,color:data.sleepGoal===parseInt(h)?T.esp:T.bark,cursor:"pointer"}}>{h}h</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Monthly household budget</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Under $3k","$3-5k","$5-8k","$8-12k","$12k+"].map(s=>(
          <button key={s} onClick={()=>onChange("monthlyBudget",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.monthlyBudget===s?T.gold:T.linen}`,background:data.monthlyBudget===s?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:data.monthlyBudget===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:16}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Clothing budget per month</label>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {["Under $100","$100-200","$200-400","$400-600","$600+"].map(s=>(
          <button key={s} onClick={()=>onChange("styleBudget",s)} style={{padding:"8px 14px",borderRadius:20,border:`1.5px solid ${data.styleBudget===s?T.blush:T.linen}`,background:data.styleBudget===s?T.blushP:"#fff",fontFamily:FB,fontSize:12,color:data.styleBudget===s?T.esp:T.bark,cursor:"pointer"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{marginBottom:20}}>
      <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Energy pattern</label>
      <div style={{display:"flex",gap:8}}>
        {["🌅 Morning person","☀️ Mid-day","🌙 Night owl"].map(s=>(
          <button key={s} onClick={()=>onChange("energyPattern",s)} style={{flex:1,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${data.energyPattern===s?T.gold:T.linen}`,background:data.energyPattern===s?T.goldP:"#fff",fontFamily:FB,fontSize:11,color:data.energyPattern===s?T.esp:T.bark,cursor:"pointer",textAlign:"center"}}>{s}</button>
        ))}
      </div>
    </div>

    <div style={{display:"flex",gap:10}}>
      <button onClick={onBack} style={{flex:1,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:"transparent",color:T.esp,border:`1.5px solid ${T.linen}`}}>← Back</button>
      <button onClick={onFinish} className="lift" style={{flex:2,padding:"14px",borderRadius:16,fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none"}}>Meet Nora ✨</button>
    </div>
  </div>);
}

function NoraIntro({profile,onEnter}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),400);},[]);
  const msgs=[`I know you're ${profile.role?`a ${profile.role}`:"a super mum"}${profile.city?` in ${profile.city}`:""}. 👋`,profile.kids?.length?`I'll keep track of ${profile.kids.map(k=>k.name).join(" and ")} for you. 💛`:"I'll help you manage family life beautifully.",profile.priorities?.length?`Your focus: ${profile.priorities.slice(0,2).join(" & ")}. I've got you.`:"I'll adapt to your priorities every day.",profile.tripGoal?`I'll help you plan ${profile.tripGoal} ✈️`:"I'll help plan your next adventure."];
  return(<div style={{minHeight:"100vh",background:AIGRAD,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 28px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:-60,right:-60,width:240,height:240,borderRadius:"50%",background:"rgba(196,154,60,.06)"}}/>
    {vis&&<>
      <div style={{width:80,height:80,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:24,boxShadow:`0 0 40px rgba(196,154,60,.5)`,animation:"breathe 3s ease-in-out infinite"}}><Ic.Star s={36} c="#fff" w={1.2}/></div>
      <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:30,color:"#fff",margin:"0 0 6px",textAlign:"center",animation:"fadeUp .5s ease both"}}>Hi {profile.name||"lovely"}, I'm Nora</h2>
      <p style={{fontFamily:FB,fontSize:14,color:"rgba(255,255,255,.5)",margin:"0 0 28px",textAlign:"center",animation:"fadeUp .5s .1s ease both"}}>Your personal AI, ready to go</p>
      <div style={{width:"100%",maxWidth:360}}>
        {msgs.map((m,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:"rgba(255,255,255,.07)",borderRadius:14,padding:"12px 16px",marginBottom:10,border:"1px solid rgba(255,255,255,.08)",animation:`fadeUp .4s ${.2+i*.12}s ease both`}}><div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Check s={12} c="#fff" w={2.5}/></div><p style={{fontFamily:FB,fontSize:13,color:"rgba(255,255,255,.8)",margin:0,lineHeight:1.6}}>{m}</p></div>)}
      </div>
      <div style={{width:"100%",maxWidth:360,marginTop:24,animation:"fadeUp .5s .7s ease both"}}>
        <button onClick={onEnter} className="lift" style={{width:"100%",padding:"16px",borderRadius:18,border:"none",cursor:"pointer",background:`linear-gradient(135deg,${T.gold},#8B6914)`,fontFamily:FB,fontSize:15,fontWeight:700,color:"#fff",boxShadow:`0 8px 32px rgba(196,154,60,.4)`,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>Enter HerNest →</button>
      </div>
    </>}
  </div>);}

// ═══════════════════════════════════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════════
function ProfileScreen({profile, onChange, onSave, onSignOut, user}){
  const [local, setLocal] = useState({...profile});
  const [saved, setSaved] = useState(false);
  const [kn, setKn] = useState("");
  const [ka, setKa] = useState("");
  const upd = (k,v) => setLocal(p=>({...p,[k]:v}));
  const addKid = () => { if(!kn.trim())return; setLocal(p=>({...p,kids:[...(p.kids||[]),{name:kn,age:ka}]})); setKn(""); setKa(""); };
  const removeKid = i => setLocal(p=>({...p,kids:(p.kids||[]).filter((_,idx)=>idx!==i)}));
  const save = () => { onSave(local); setSaved(true); setTimeout(()=>setSaved(false),2000); };

  const AVATARS = ["👩","👩🏻","👩🏼","👩🏽","👩🏾","👩🏿"];
  const ROLES = ["Working Mum","Stay-at-Home Mum","Entrepreneur","Executive","Other"];
  const PRIORITIES = [{id:"family",lb:"Family"},{id:"career",lb:"Career"},{id:"fitness",lb:"Fitness"},{id:"travel",lb:"Travel"},{id:"finances",lb:"Finances"},{id:"selfcare",lb:"Self-care"}];
  const CHALLENGES = ["Mental load","Work-life balance","Staying fit","Budget management","Finding me-time"];
  const toggleP = id => { const c=local.priorities||[]; setLocal(p=>({...p,priorities:c.includes(id)?c.filter(x=>x!==id):c.length<3?[...c,id]:c})); };

  return(
    <div style={{animation:"fadeUp .45s ease both"}}>
      {/* Hero */}
      <div style={{background:ESPG,borderRadius:22,padding:"24px 22px",marginBottom:16,position:"relative",overflow:"hidden",textAlign:"center"}}>
        <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.03)"}}/>
        <div style={{fontSize:56,marginBottom:8}}>{local.avatar||"👩"}</div>
        <h2 style={{fontFamily:FD,fontStyle:"italic",fontSize:22,color:"#fff",margin:"0 0 4px",fontWeight:400}}>{local.name||"Your Profile"}</h2>
        <p style={{fontFamily:FB,fontSize:12,color:"rgba(255,255,255,.4)",margin:"0 0 12px"}}>{user?.email||""}</p>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
          {AVATARS.map(a=>(
            <button key={a} onClick={()=>upd("avatar",a)} style={{fontSize:24,background:local.avatar===a?T.goldP:"rgba(255,255,255,.08)",border:`2px solid ${local.avatar===a?T.gold:"transparent"}`,borderRadius:12,padding:"6px",cursor:"pointer",transition:"all .15s"}}>{a}</button>
          ))}
        </div>
      </div>

      {/* Personal details */}
      <Card ch={<div>
        <H2 t="Personal Details"/>
        <FInput label="First name" placeholder="e.g. Sarah" value={local.name||""} onChange={e=>upd("name",e.target.value)}/>
        <FInput label="City" placeholder="e.g. Melbourne" value={local.city||""} onChange={e=>upd("city",e.target.value)}/>
        <div style={{marginBottom:14}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Role</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {ROLES.map(r=>(
              <button key={r} onClick={()=>upd("role",r)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${local.role===r?T.gold:T.linen}`,background:local.role===r?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:local.role===r?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{r}</button>
            ))}
          </div>
        </div>
      </div>}/>

      {/* Family */}
      <Card ch={<div>
        <H2 t="Family"/>
        <FInput label="Partner's name" placeholder="e.g. James" value={local.partner||""} onChange={e=>upd("partner",e.target.value)}/>
        
        {/* Children */}
        <div style={{marginBottom:16}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Children</label>
          {(local.kids||[]).map((k,i)=>(
            <div key={i} style={{background:T.sageP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>{k.name}{k.age?`, ${k.age}`:""}</span>
                  {k.bday&&<div style={{fontFamily:FB,fontSize:11,color:T.sage,marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                  <span>🎂 {k.bday}</span>
                  <GiftButton name={k.name} age={k.age} relation="child"/>
                </div>}
                </div>
                <button onClick={()=>{const n=prompt("Edit name:",k.name);if(n&&n.trim())setLocal(p=>({...p,kids:p.kids.map((c,ci)=>ci===i?{...c,name:n.trim()}:c)}));}} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Edit s={14} c={T.bark} w={1.5}/></button>
                <button onClick={()=>removeKid(i)} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:2,fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
            <input placeholder="Age" value={ka} onChange={e=>setKa(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 10px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          </div>
          <div style={{display:"flex",gap:6}}>
            <select id="kid-bday-m" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
              <option value="">Month</option>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
            </select>
            <select id="kid-bday-d" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
              <option value="">Day</option>
              {Array.from({length:31},(_,i)=><option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}
            </select>
            <button onClick={()=>{if(!kn.trim())return;const m=document.getElementById("kid-bday-m")?.value||"";const d=document.getElementById("kid-bday-d")?.value||"";const bd=m&&d?`${m}/${d}`:"";setLocal(p=>({...p,kids:[...(p.kids||[]),{name:kn,age:ka,bday:bd}]}));setKn("");setKa("");}} style={{background:T.esp,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
          </div>
        </div>

        {/* Parents */}
        <div style={{marginBottom:16}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>Your Parents</label>
          {(local.parents||[]).map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
              <div style={{flex:1}}>
                <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>{p.name}</span>
                <span style={{fontFamily:FB,fontSize:11,color:T.bark,marginLeft:8}}>{p.role}</span>
                {p.bday&&<div style={{fontFamily:FB,fontSize:11,color:T.gold,marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                <span>🎂 {p.bday}</span>
                <GiftButton name={p.name} age="" relation={p.role}/>
              </div>}
              </div>
              <button onClick={()=>upd("parents",(local.parents||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            {["Mum","Dad"].map(r=><button key={r} onClick={()=>setKa(r)} style={{flex:1,padding:"6px",borderRadius:10,border:`1.5px solid ${ka===r?T.gold:T.linen}`,background:ka===r?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:ka===r?T.esp:T.bark,cursor:"pointer"}}>{r}</button>)}
          </div>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
            <select id="par-bday-m" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Month</option>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
          </select>
          <select id="par-bday-d" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Day</option>
            {Array.from({length:31},(_,i)=><option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}
          </select>
            <button onClick={()=>{if(!kn.trim())return;const m=document.getElementById("par-bday-m")?.value||"";const d=document.getElementById("par-bday-d")?.value||"";const bd=m&&d?`${m}/${d}`:"";upd("parents",[...(local.parents||[]),{name:kn,role:ka||"Mum",bday:bd}]);setKn("");setKa("");}} style={{background:T.gold,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
          </div>
        </div>

        {/* In-laws */}
        <div style={{marginBottom:6}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:10}}>In-Laws</label>
          {(local.inlaws||[]).map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.lavP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
              <div style={{flex:1}}>
                <span style={{fontFamily:FD,fontSize:15,fontWeight:600,color:T.esp}}>{p.name}</span>
                <span style={{fontFamily:FB,fontSize:11,color:T.bark,marginLeft:8}}>{p.role}</span>
                {p.bday&&<div style={{fontFamily:FB,fontSize:11,color:T.lav,marginTop:2,display:"flex",alignItems:"center",gap:6}}>
                <span>🎂 {p.bday}</span>
                <GiftButton name={p.name} age="" relation={p.role}/>
              </div>}
              </div>
              <button onClick={()=>upd("inlaws",(local.inlaws||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
            </div>
          ))}
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <select onChange={e=>setKa(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 10px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
              {["Mother-in-law","Father-in-law","Sister-in-law","Brother-in-law"].map(r=><option key={r}>{r}</option>)}
            </select>
            <input placeholder="Name" value={kn} onChange={e=>setKn(e.target.value)} style={{flex:1,fontFamily:FB,fontSize:13,padding:"10px 10px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}/>
          </div>
          <div style={{display:"flex",gap:6}}>
            <select id="il-bday-m" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Month</option>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
          </select>
          <select id="il-bday-d" style={{flex:1,fontFamily:FB,fontSize:12,padding:"10px 8px",borderRadius:12,border:`1.5px solid ${T.linen}`,background:"#fff",color:T.esp}}>
            <option value="">Day</option>
            {Array.from({length:31},(_,i)=><option key={i+1} value={String(i+1).padStart(2,"0")}>{i+1}</option>)}
          </select>
            <button onClick={()=>{if(!kn.trim())return;const m=document.getElementById("il-bday-m")?.value||"";const d=document.getElementById("il-bday-d")?.value||"";const bd=m&&d?`${m}/${d}`:"";upd("inlaws",[...(local.inlaws||[]),{name:kn,role:ka||"Mother-in-law",bday:bd}]);setKn("");setKa("");}} style={{background:T.lav,border:"none",borderRadius:12,padding:"0 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic.Plus s={18} c="#fff" w={2}/></button>
          </div>
        </div>
      </div>}/>

      {/* Priorities */}
      <Card ch={<div>
        <H2 t="Your Priorities" sub="Pick up to 3"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {PRIORITIES.map(p=>{const active=(local.priorities||[]).includes(p.id);return(
            <button key={p.id} onClick={()=>toggleP(p.id)} style={{padding:"12px 14px",borderRadius:14,cursor:"pointer",textAlign:"left",background:active?T.goldP:"#fff",border:`2px solid ${active?T.gold:T.linen}`,fontFamily:FB,fontSize:13,fontWeight:700,color:active?T.esp:T.bark,transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              {p.lb}{active&&<Ic.Check s={14} c={T.gold} w={2.5}/>}
            </button>
          );})}
        </div>
      </div>}/>

      {/* Family Events */}
      <Card ch={<div>
        <H2 t="Family Events" sub="Upcoming dates Nora will remind you about"/>
        {(local.events||[]).map((ev,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:T.goldP,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
            <span style={{fontSize:20,flexShrink:0}}>{ev.emoji}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:FB,fontSize:13,fontWeight:700,color:T.esp}}>{ev.name}</div>
              <div style={{fontFamily:FB,fontSize:11,color:T.bark,marginTop:1}}>{ev.date}</div>
            </div>
            <button onClick={()=>upd("events",(local.events||[]).filter((_,idx)=>idx!==i))} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Ic.Close s={14} c={T.bark} w={2}/></button>
          </div>
        ))}
        <EventAdder onAdd={ev=>upd("events",[...(local.events||[]),ev])}/>
      </div>}/>

      {/* Goals */}
      <Card ch={<div>
        <H2 t="Your Goals"/>
        <FInput label="Next trip" placeholder="e.g. Bali, Indonesia" value={local.tripGoal||""} onChange={e=>upd("tripGoal",e.target.value)}/>
        <FInput label="Fitness goal" placeholder="e.g. Work out 4x per week" value={local.fitnessGoal||""} onChange={e=>upd("fitnessGoal",e.target.value)}/>
        <FInput label="Savings goal" placeholder="e.g. $10,000 vacation fund" value={local.savingsGoal||""} onChange={e=>upd("savingsGoal",e.target.value)}/>
        <div style={{marginBottom:6}}>
          <label style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,display:"block",marginBottom:8}}>Biggest challenge</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {CHALLENGES.map(c=>(
              <button key={c} onClick={()=>upd("challenge",c)} style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${local.challenge===c?T.gold:T.linen}`,background:local.challenge===c?T.goldP:"#fff",fontFamily:FB,fontSize:12,color:local.challenge===c?T.esp:T.bark,cursor:"pointer",transition:"all .15s"}}>{c}</button>
            ))}
          </div>
        </div>
      </div>}/>

      {/* Save button */}
      <button onClick={save} style={{width:"100%",padding:"15px",borderRadius:16,border:"none",cursor:"pointer",background:saved?`linear-gradient(135deg,${T.sage},#4a7a5a)`:`linear-gradient(135deg,${T.esp},#4a2e18)`,color:"#fff",fontFamily:FB,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12,transition:"background .3s"}}>
        {saved?<><Ic.Check s={18} c="#fff" w={2.5}/> Saved!</>:<><Ic.Save s={18} c="#fff" w={1.5}/> Save Changes</>}
      </button>

      {/* Notifications */}
      <NotificationCard/>

      {/* Sign out */}
      <button onClick={onSignOut} style={{width:"100%",padding:"14px",borderRadius:16,border:`1.5px solid ${T.blushP}`,cursor:"pointer",background:"#fff",color:T.blush,fontFamily:FB,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
        <Ic.LogOut s={18} c={T.blush} w={1.5}/> Sign Out
      </button>
    </div>
  );
}



// ─── NOTIFICATION CARD ───────────────────────────────────────────
function NotificationCard(){
  const [status,setStatus]=useState(()=>{
    if(!("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const [hour,setHour]=useState(()=>parseInt(localStorage.getItem("hn_brief_hour")||"7"));
  const [minute,setMinute]=useState(()=>parseInt(localStorage.getItem("hn_brief_min")||"0"));
  const [scheduling,setScheduling]=useState(false);
  const [scheduled,setScheduled]=useState(false);
  const [timeSaved,setTimeSaved]=useState(false);

  const HOURS=Array.from({length:24},(_,i)=>i);
  const MINUTES=[0,15,30,45];

  const saveTime=(h,m)=>{
    setHour(h);setMinute(m);
    localStorage.setItem("hn_brief_hour",String(h));
    localStorage.setItem("hn_brief_min",String(m));
    setTimeSaved(true);setTimeout(()=>setTimeSaved(false),2000);
  };

  const enable=async()=>{
    if(!("Notification" in window)){setStatus("unsupported");return;}
    const perm=await Notification.requestPermission();
    setStatus(perm);
    if(perm==="granted"){
      setTimeout(()=>{
        new Notification("HerNest ✨",{
          body:`Morning briefings enabled! Nora will greet you at ${hour}:${String(minute).padStart(2,"0")} every morning. 💛`,
          icon:"/icon.png",
          tag:"hernest-welcome"
        });
      },500);
    }
  };

  const sendTest=()=>{
    if(Notification.permission!=="granted")return;
    setScheduling(true);
    setTimeout(()=>{
      new Notification("Good morning ☀️",{
        body:"Nora has your daily briefing ready. Tap to see your priorities for today.",
        icon:"/icon.png",
        tag:"hernest-briefing"
      });
      setScheduling(false);setScheduled(true);
      setTimeout(()=>setScheduled(false),3000);
    },1500);
  };

  if(status==="unsupported") return null;

  const fmt=`${hour}:${String(minute).padStart(2,"0")} ${hour<12?"AM":"PM"}`;

  return(
    <Card sx={{background:status==="granted"?T.sageP:T.goldP,border:`1px solid ${status==="granted"?T.sage:T.gold}30`,marginBottom:12}} ch={<div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:13,background:status==="granted"?T.sage:T.gold,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${status==="granted"?T.sage:T.gold}55`}}>
          <Ic.Bell s={22} c="#fff" w={1.5}/>
        </div>
        <div>
          <div style={{fontFamily:FB,fontSize:14,fontWeight:700,color:T.esp}}>Morning Briefing</div>
          <div style={{fontFamily:FB,fontSize:12,color:T.bark,marginTop:2}}>
            {status==="granted"?`Enabled · ${fmt} daily ✓`:"Get Nora's briefing every morning"}
          </div>
        </div>
      </div>

      {status!=="granted"?(
        <button onClick={enable} style={{width:"100%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,color:"#fff",border:"none",borderRadius:13,padding:"13px",fontFamily:FB,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:`0 4px 16px ${T.gold}44`}}>
          <Ic.Bell s={18} c="#fff" w={1.5}/> Enable Morning Briefing
        </button>
      ):(
        <div>
          <div style={{background:"rgba(255,255,255,.6)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
            <div style={{fontFamily:FB,fontSize:11,fontWeight:700,letterSpacing:1,textTransform:"uppercase",color:T.bark,marginBottom:10}}>Briefing Time</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:10,color:T.taupe,marginBottom:4}}>Hour</div>
                <select value={hour} onChange={e=>setHour(parseInt(e.target.value))} style={{width:"100%",fontFamily:FB,fontSize:14,fontWeight:700,padding:"8px 10px",borderRadius:10,border:`1.5px solid ${T.sage}`,background:"#fff",color:T.esp,cursor:"pointer"}}>
                  {HOURS.map(h=><option key={h} value={h}>{h===0?"12 AM":h<12?`${h} AM`:h===12?"12 PM":`${h-12} PM`}</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:10,color:T.taupe,marginBottom:4}}>Minute</div>
                <select value={minute} onChange={e=>setMinute(parseInt(e.target.value))} style={{width:"100%",fontFamily:FB,fontSize:14,fontWeight:700,padding:"8px 10px",borderRadius:10,border:`1.5px solid ${T.sage}`,background:"#fff",color:T.esp,cursor:"pointer"}}>
                  {MINUTES.map(m=><option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
                </select>
              </div>
            </div>
            <button onClick={()=>saveTime(hour,minute)} style={{width:"100%",background:timeSaved?T.sage:T.esp,color:"#fff",border:"none",borderRadius:10,padding:"9px",fontFamily:FB,fontSize:12,fontWeight:700,cursor:"pointer",transition:"background .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {timeSaved?<><Ic.Check s={13} c="#fff" w={2.5}/>Saved!</>:<>Save Briefing Time</>}
            </button>
          </div>
          <button onClick={sendTest} style={{width:"100%",background:scheduled?"#fff":T.sage,color:scheduled?T.sage:"#fff",border:`1.5px solid ${T.sage}`,borderRadius:12,padding:"11px",fontFamily:FB,fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}>
            {scheduling?<><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/> Sending…</>
            :scheduled?<><Ic.Check s={14} c={T.sage} w={2.5}/> Sent!</>
            :<><Ic.Bell s={16} c="#fff" w={1.5}/> Send Test Notification</>}
          </button>
        </div>
      )}
    </div>}/>
  );
}


// ─── OFFLINE BANNER ──────────────────────────────────────────────
function OfflineBanner(){
  const [offline,setOffline]=useState(!navigator.onLine);
  useEffect(()=>{
    const on=()=>setOffline(false);
    const off=()=>setOffline(true);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);
  if(!offline)return null;
  return(
    <div style={{background:`linear-gradient(135deg,${T.blush},#a85040)`,padding:"8px 16px",display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      <span style={{fontFamily:FB,fontSize:12,color:"#fff",fontWeight:600}}>You're offline — app still works, AI features need connection</span>
    </div>
  );
}


// ─── GIFT BUTTON ─────────────────────────────────────────────────
function GiftButton({name,age,relation}){
  const [open,setOpen]=useState(false);
  const [gifts,setGifts]=useState(null);
  const [loading,setLoading]=useState(false);

  const suggest=async()=>{
    if(gifts){setOpen(!open);return;}
    setOpen(true);setLoading(true);
    try{
      const raw=await claude(
        `You are a thoughtful gift advisor. Return ONLY valid JSON: {"gifts":[{"name":"","price":"","why":"","where":""}]}. 4 gift ideas.`,
        `Suggest 4 thoughtful gift ideas for ${name}, who is ${relation}${age?`, age ${age}`:""}.  Mix of prices from budget to splurge. Be specific with product names.`
      );
      setGifts(JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g,"").trim()).gifts);
    }catch(e){
      setGifts([{name:"Personalised photo book",price:"$40",why:"Memories they will treasure forever",where:"Chatbooks or Snapfish"},{name:"Spa day voucher",price:"$120",why:"Everyone deserves to be pampered",where:"Local spa"},{name:"Favourite restaurant dinner",price:"$80",why:"Quality time and a delicious meal",where:"OpenTable"},{name:"Heartfelt handwritten letter",price:"Free",why:"The most meaningful gift of all",where:"From the heart"}]);
    }
    setLoading(false);
  };

  return(
    <div style={{display:"inline-block"}}>
      <button onClick={suggest} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"2px 8px",fontFamily:FB,fontSize:10,fontWeight:700,color:T.gold,cursor:"pointer"}}>
        🎁 Gift ideas
      </button>
      {open&&<div style={{background:"#fff",borderRadius:14,padding:"14px",marginTop:8,border:`1.5px solid ${T.gold}`,boxShadow:"0 4px 20px rgba(0,0,0,.08)",animation:"pop .2s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>Gift ideas for {name}</span>
          <button onClick={()=>setOpen(false)} style={{background:"none",border:"none",cursor:"pointer"}}><Ic.Close s={14} c={T.taupe} w={2}/></button>
        </div>
        {loading?<div style={{display:"flex",justifyContent:"center",padding:"16px 0"}}><Spinner/></div>:
        gifts?.map((g,i)=>(
          <div key={i} style={{padding:"8px 0",borderBottom:i<gifts.length-1?`1px solid ${T.linen}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:FB,fontSize:12,fontWeight:700,color:T.esp}}>{g.name}</div>
                <div style={{fontFamily:FB,fontSize:11,color:T.taupe,marginTop:1}}>{g.why}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                <span style={{fontFamily:FB,fontSize:10,color:T.sage}}>📍 {g.where}</span>
                <button onClick={()=>window.open("https://www.amazon.com/s?k="+encodeURIComponent(g.name),"_blank")} style={{background:T.goldP,border:`1px solid ${T.gold}30`,borderRadius:8,padding:"2px 8px",fontFamily:FB,fontSize:9,fontWeight:700,color:T.gold,cursor:"pointer"}}>Buy →</button>
              </div>
              </div>
              <span style={{fontFamily:FD,fontSize:14,fontWeight:700,color:T.gold,flexShrink:0,marginLeft:8}}>{g.price}</span>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}


// ─── EVENT ADDER ─────────────────────────────────────────────────
function EventAdder({onAdd}){
  const [name,setName]=useState("");
  const [date,setDate]=useState("");
  const [emoji,setEmoji]=useState("🎉");
  const [show,setShow]=useState(false);
  const EMOJIS=["🎉","🎂","🏫","⚽","🎭","💒","🎓","✈️","🏥","💝"];
  const add=()=>{
    if(!name.trim()||!date)return;
    onAdd({name,date,emoji});
    setName("");setDate("");setEmoji("🎉");setShow(false);
  };
  return(
    <div>
      <button onClick={()=>setShow(!show)} style={{width:"100%",background:show?T.esp:T.sand,border:`1.5px solid ${show?T.esp:T.linen}`,borderRadius:12,padding:"10px",fontFamily:FB,fontSize:12,color:show?"#fff":T.bark,cursor:"pointer",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
        <Ic.Plus s={16} c={show?"#fff":T.bark} w={2}/>{show?"Cancel":"Add family event"}
      </button>
      {show&&<div style={{background:T.sand,borderRadius:14,padding:"14px",marginTop:10,border:`1.5px solid ${T.gold}`}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {EMOJIS.map(e=><button key={e} onClick={()=>setEmoji(e)} style={{fontSize:20,background:emoji===e?T.goldP:"transparent",border:`1.5px solid ${emoji===e?T.gold:T.linen}`,borderRadius:8,padding:"4px",cursor:"pointer"}}>{e}</button>)}
        </div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mia first day of school" style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:8}}/>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",fontFamily:FB,fontSize:13,padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.linen}`,color:T.esp,marginBottom:10,background:"#fff"}}/>
        <button onClick={add} disabled={!name.trim()||!date} style={{width:"100%",background:name.trim()&&date?T.esp:T.linen,border:"none",borderRadius:10,padding:"10px",fontFamily:FB,fontSize:13,fontWeight:700,color:name.trim()&&date?"#fff":T.taupe,cursor:"pointer"}}>Add Event</button>
      </div>}
    </div>
  );
}

// ─── SHARE BUTTON ────────────────────────────────────────────────
function ShareButton(){
  const [copied,setCopied]=useState(false);
  const share=async()=>{
    const url="https://her-nest.vercel.app/landing.html";
    const msg="Hey! I found this amazing AI app for mums — meet Nora, your personal AI that manages your mental load, plans trips, tracks your budget and keeps you thriving. Try it free 💛 "+url;
    if(navigator.share){
      try{await navigator.share({title:"HerNest AI",text:msg,url});}catch(e){}
    } else {
      try{await navigator.clipboard.writeText(url);}catch(e){
        const el=document.createElement("textarea");el.value=url;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el);
      }
      setCopied(true);setTimeout(()=>setCopied(false),2000);
    }
  };
  return(
    <button onClick={share} className="lift" style={{display:"flex",alignItems:"center",gap:6,background:copied?T.sageP:T.goldP,border:`1px solid ${copied?T.sage:T.gold}30`,borderRadius:20,padding:"6px 12px",cursor:"pointer",transition:"all .2s"}}>
      {copied
        ?<><Ic.Check s={13} c={T.sage} w={2.5}/><span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.sage}}>Copied!</span></>
        :<><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke={T.gold} strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke={T.gold} strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke={T.gold} strokeWidth="1.8"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"/></svg><span style={{fontFamily:FB,fontSize:11,fontWeight:700,color:T.gold}}>Share</span></>
      }
    </button>
  );
}

const TABS=[
  {id:"home",    lb:"Home",   IC:Ic.Home},
  {id:"nora",    lb:"Nora",   IC:Ic.Star, ai:true},
  {id:"plan",    lb:"Plan",   IC:Ic.Plan},
  {id:"trips",   lb:"Trips",  IC:Ic.Compass},
  {id:"budget",  lb:"Budget", IC:Ic.Budget},
  {id:"style",   lb:"Style",  IC:Ic.Hanger},
  {id:"circle",  lb:"Circle", IC:Ic.People},
  {id:"brief",   lb:"Morning",IC:Ic.Sun,  ai:true},
  {id:"wellness",lb:"Thrive", IC:Ic.Leaf},
  {id:"profile", lb:"Me",     IC:Ic.User},
];

// ═══════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════
export default function HerNest(){
  const [screen,setScreen]=useState("splash");
  const [profile,setProfile]=useState({avatar:"👩",name:"",city:"",role:"",partner:"",kids:[],parents:[],inlaws:[],siblings:[],priorities:[],tripGoal:"",fitnessGoal:"",savingsGoal:"",challenge:""});
  const [tab,setTab]=useState("home");
  const [aiTasks,setAiTasks]=useState([]);
  const [user,setUser]=useState(null);
  const [authChecked,setAuthChecked]=useState(false);
  const [streak,setStreak]=useState(()=>{
    try{
      const s=JSON.parse(localStorage.getItem("hn_streak")||"{}");
      const today=new Date().toDateString();
      const yesterday=new Date(Date.now()-86400000).toDateString();
      if(s.lastDate===today) return s.count||1;
      if(s.lastDate===yesterday){
        const newCount=(s.count||0)+1;
        localStorage.setItem("hn_streak",JSON.stringify({count:newCount,lastDate:today}));
        return newCount;
      }
      localStorage.setItem("hn_streak",JSON.stringify({count:1,lastDate:today}));
      return 1;
    }catch(e){return 1;}
  });
  const upd=(k,v)=>setProfile(p=>({...p,[k]:v}));
  const handleAI=p=>{if(p?.tasks)setAiTasks(prev=>[...prev,...p.tasks]);};

  // Request notification permission and schedule daily briefing
  const [notifEnabled,setNotifEnabled]=useState(false);
  const requestNotifications=async()=>{
    if(!("Notification" in window))return;
    const perm=await Notification.requestPermission();
    if(perm==="granted"){
      setNotifEnabled(true);
      // Register service worker
      if("serviceWorker" in navigator){
        try{
          await navigator.serviceWorker.register("/sw.js");
          console.log("Service worker registered");
        }catch(e){console.log("SW registration failed",e);}
      }
      // Show confirmation
      new Notification("HerNest ✨",{body:"Good morning! Nora will brief you every morning at 7am. 💛",icon:"/icon.png"});
    }
  };

  // Register service worker for offline support
  useEffect(()=>{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").catch(()=>{});
    }
  },[]);

  // Watch auth state
  useEffect(()=>{
    // Safety timeout — never get stuck on blank screen
    const timeout=setTimeout(()=>setAuthChecked(true),5000);
    const unsub=onAuthStateChanged(auth,(u)=>{
      clearTimeout(timeout);
      setUser(u||null);
      if(u){
        loadProfile(u.uid).then(saved=>{
          if(saved&&saved.name){setProfile(saved);setScreen("app");}
          else{if(u.displayName)setProfile(p=>({...p,name:u.displayName.split(" ")[0]}));setScreen("step1");}
        }).catch(()=>{setScreen("step1");});
      } else {
        setScreen("login");
      }
      setAuthChecked(true);
    });
    return()=>{ unsub(); clearTimeout(timeout); };
  },[]);

  // Auto-save profile on change
  useEffect(()=>{
    if(user?.uid&&profile.name) saveProfile(user.uid,profile);
  },[profile,user]);

  const reset=async()=>{
    try{await signOut(auth);}catch(e){}
    setProfile({avatar:"👩",name:"",city:"",role:"",partner:"",kids:[],parents:[],inlaws:[],siblings:[],priorities:[],tripGoal:"",fitnessGoal:"",savingsGoal:"",challenge:""});
    setTab("home");setAiTasks([]);setUser(null);setScreen("login");
  };

  const handleLogin=(userData)=>{
    if(userData.name) setProfile(p=>({...p,name:userData.name}));
    setScreen("step1");
    if(userData.uid){
      loadProfile(userData.uid).then(saved=>{
        if(saved&&saved.name){setProfile(saved);setScreen("app");}
      }).catch(()=>{});
    }
  };

  if(!authChecked) return(
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg,${T.esp},#1a0a04)`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-100,right:-100,width:400,height:400,borderRadius:"50%",background:"rgba(196,154,60,.05)"}}/>
      <div style={{position:"absolute",bottom:-100,left:-100,width:350,height:350,borderRadius:"50%",background:"rgba(107,158,122,.04)"}}/>
      <div style={{animation:"float 3s ease-in-out infinite",marginBottom:28}}>
        <div style={{width:88,height:88,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},#8B6914)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 50px rgba(196,154,60,.45)`}}>
          <Ic.Star s={40} c="#fff" w={1.2}/>
        </div>
      </div>
      <h1 style={{fontFamily:FD,fontStyle:"italic",fontSize:44,color:"#fff",margin:"0 0 6px",fontWeight:400,animation:"fadeUp .6s ease both"}}>Her<strong style={{fontStyle:"normal",fontWeight:700}}>Nest</strong></h1>
      <p style={{fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.3)",letterSpacing:3,textTransform:"uppercase",margin:"0 0 36px",animation:"fadeUp .6s .1s ease both"}}>Your world in one place</p>
      <div style={{display:"flex",gap:10,animation:"fadeUp .6s .2s ease both"}}>
        {[0,1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:`linear-gradient(135deg,${T.gold},${T.sage})`,animation:`dot 1.4s ease-in-out ${i*.25}s infinite`}}/>)}
      </div>
      <p style={{position:"absolute",bottom:32,fontFamily:FB,fontSize:11,color:"rgba(255,255,255,.2)",letterSpacing:2,textTransform:"uppercase"}}>Loading your nest…</p>
    </div>
  );

  if(screen==="splash") return <SplashScreen onDone={()=>setScreen("login")}/>;
  if(screen==="login")  return <LoginScreen onLogin={handleLogin}/>;

  const STEPS=["step1","step2","step3","step4","step5","step6"];
  if(STEPS.includes(screen)){
    const idx=STEPS.indexOf(screen);
    return(
      <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:T.cream,boxShadow:"0 0 80px rgba(0,0,0,.3)"}}>
        <div style={{padding:"16px 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <button onClick={()=>setScreen(["login",...STEPS][idx])} style={{background:"none",border:"none",cursor:"pointer",padding:4,display:"flex",alignItems:"center"}}><Ic.Back s={20} c={T.bark} w={2}/></button>
          <span style={{fontFamily:FB,fontSize:12,color:T.taupe}}>Step {idx+1} of 4</span>
          <button onClick={()=>setScreen("intro")} style={{background:"none",border:"none",cursor:"pointer",fontFamily:FB,fontSize:12,color:T.taupe}}>Skip</button>
        </div>
        <div style={{padding:"16px 24px 40px"}}>
          <ProgressDots total={4} current={idx}/>
          {screen==="step1"&&<Step1 data={profile} onChange={upd} onNext={()=>setScreen("step2")}/>}
          {screen==="step2"&&<Step2 data={profile} onChange={upd} onNext={()=>setScreen("step3")} onBack={()=>setScreen("step1")}/>}
          {screen==="step3"&&<Step3 data={profile} onChange={upd} onNext={()=>setScreen("step4")} onBack={()=>setScreen("step2")}/>}
          {screen==="step4"&&<Step4 data={profile} onChange={upd} onFinish={()=>setScreen("step5")} onBack={()=>setScreen("step3")}/>}
          {screen==="step5"&&<Step5 data={profile} onChange={upd} onNext={()=>setScreen("step6")} onBack={()=>setScreen("step4")}/>}
          {screen==="step6"&&<Step6 data={profile} onChange={upd} onFinish={()=>setScreen("intro")} onBack={()=>setScreen("step5")}/>}
        </div>
      </div>
    );
  }
  if(screen==="intro") return <NoraIntro profile={profile} onEnter={()=>setScreen("app")}/>;

  const handleSaveProfile = (updated) => {
    setProfile(updated);
    if(user?.uid) saveProfile(user.uid, updated);
  };

  const screens={
    home:    <HomeScreen go={setTab} aiTasks={aiTasks} profile={profile} streak={streak}/>,
    brief:   <BriefingScreen profile={profile}/>,
    nora:    <NoraScreen onTasks={handleAI} profile={profile}/>,
    plan:    <PlanScreen aiTasks={aiTasks} profile={profile} uid={user?.uid}/>,
    trips:   <TripsScreen uid={user?.uid} profile={profile}/>,
    budget:  <BudgetScreen uid={user?.uid}/>,
    style:   <StyleScreen profile={profile}/>,
    circle:  <CircleScreen profile={profile}/>,
    wellness:<WellnessScreen profile={profile}/>,
    profile: <ProfileScreen profile={profile} onChange={upd} onSave={handleSaveProfile} onSignOut={reset} user={user}/>,
  };

  return(
    <div style={{fontFamily:FB,background:T.cream,minHeight:"100vh",maxWidth:430,margin:"0 auto",boxShadow:"0 0 80px rgba(0,0,0,.3)"}}>
      <OfflineBanner/>
      <div style={{padding:"12px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",background:T.cream,position:"sticky",top:0,zIndex:50,borderBottom:`1px solid ${T.linen}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Ic.Home s={18} c={T.gold} w={1.6}/>
          <span style={{fontFamily:FD,fontSize:22,fontStyle:"italic",color:T.esp}}>{profile.name?`${profile.name}'s `:"Her"}<strong style={{fontStyle:"normal"}}>Nest</strong><span style={{fontSize:10,color:T.gold,fontFamily:FB,fontStyle:"normal",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginLeft:8}}>AI</span></span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {aiTasks.length>0&&<div style={{background:T.goldP,borderRadius:20,padding:"4px 10px",fontFamily:FB,fontSize:11,color:T.gold,fontWeight:700,display:"flex",alignItems:"center",gap:4}}><Ic.Star s={10} c={T.gold} w={1.4}/>{aiTasks.length}</div>}
          <ShareButton/>
          <button onClick={()=>setTab("profile")} style={{width:34,height:34,borderRadius:"50%",background:ESPG,border:`2px solid ${T.linen}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"all .15s"}}>{profile.avatar||"👩"}</button>
          <Ic.Bell s={22} c={T.esp} w={1.5}/>
        </div>
      </div>
      <div key={tab} style={{padding:"14px 16px 110px",overflowY:"auto",maxHeight:"calc(100vh - 112px)"}} className="tab-content">
        {screens[tab]}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(250,246,239,.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${T.linen}`,display:"flex",overflowX:"auto",padding:"8px 4px 16px",scrollbarWidth:"none",zIndex:100}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:"0 0 auto",minWidth:54,display:"flex",flexDirection:"column",alignItems:"center",gap:3,border:"none",background:"transparent",cursor:"pointer",padding:"4px 5px",position:"relative"}}>
              {t.ai&&<div style={{position:"absolute",top:2,right:8,width:6,height:6,borderRadius:"50%",background:T.gold,animation:"breathe 2s ease-in-out infinite",boxShadow:`0 0 5px ${T.gold}`}}/>}
              <div style={{width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",background:active?T.goldP:"transparent",transition:"background .15s"}}>
                <t.IC s={active?21:19} c={active?T.esp:T.taupe} w={active?1.6:1.4}/>
              </div>
              <span style={{fontFamily:FB,fontSize:8.5,letterSpacing:.5,textTransform:"uppercase",color:active?T.esp:T.taupe,fontWeight:active?700:400,borderBottom:active?`2px solid ${T.gold}`:"2px solid transparent",paddingBottom:1}}>{t.lb}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

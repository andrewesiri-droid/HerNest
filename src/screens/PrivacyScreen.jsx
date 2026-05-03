import React from "react";
import { T, FD, FB } from "../constants/theme";
import { Card, H2 } from "../components/shared";

export function PrivacyScreen({ onClose }) {
  const sections = [
    { title: "What Nora knows about you", body: "Nora stores your name, family details, preferences, wellness data, budget categories and conversation history. This data lives in your personal Firebase account — encrypted, private, and only accessible to you." },
    { title: "How your data is used", body: "Your data is used exclusively to personalise Nora's responses. It is never sold, shared with advertisers, or used to train AI models. Each user's data is completely isolated from other users." },
    { title: "AI conversations", body: "When you chat with Nora, your messages are sent to Anthropic's Claude API via our secure server proxy. Your API key is never exposed to the browser. We do not store your conversations beyond what you see in the app." },
    { title: "Financial data", body: "Budget data, expense history and savings goals are stored in your private Firebase document. We never connect to your bank directly — you import statements manually. We never see your bank credentials." },
    { title: "Your rights", body: "You can delete all your data at any time. Sign out and contact us at privacy@hernest.app — we will permanently remove your Firebase document within 48 hours. You own your data completely." },
    { title: "Security", body: "All data is encrypted in transit (HTTPS) and at rest (Firebase encryption). Firebase security rules ensure no user can access another user's data. Our API proxy validates and protects all requests." },
  ];

  return (
    <div style={{ paddingBottom: 40, animation: "fadeUp .4s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: FD, fontSize: 26, fontWeight: 600, color: T.esp, fontStyle: "italic", margin: 0 }}>Your Privacy</h2>
          <p style={{ fontFamily: FB, fontSize: 12, color: T.taupe, margin: "4px 0 0" }}>How HerNest protects you</p>
        </div>
        {onClose && <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: FB, fontSize: 13, color: T.bark, cursor: "pointer" }}>← Back</button>}
      </div>

      <div style={{ background: "linear-gradient(135deg,#1a3a6e11,#1a5a9e08)", borderRadius: 16, padding: "14px 16px", marginBottom: 16, borderLeft: "3px solid #1a5a9e" }}>
        <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 14, color: T.esp, margin: 0, lineHeight: 1.6 }}>
          "Your data belongs to you. Nora knows you personally because you chose to share — not because we collected it without your knowledge."
        </p>
      </div>

      {sections.map((s, i) => (
        <Card key={i} sx={{ marginBottom: 10 }} ch={
          <div>
            <div style={{ fontFamily: FB, fontSize: 13, fontWeight: 700, color: T.esp, marginBottom: 6 }}>🔒 {s.title}</div>
            <p style={{ fontFamily: FB, fontSize: 12, color: T.bark, margin: 0, lineHeight: 1.7 }}>{s.body}</p>
          </div>
        } />
      ))}

      <Card ch={
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
          <p style={{ fontFamily: FD, fontStyle: "italic", fontSize: 15, color: T.esp, margin: "0 0 4px" }}>Your data. Your Nora.</p>
          <p style={{ fontFamily: FB, fontSize: 11, color: T.taupe, margin: 0 }}>Questions? privacy@hernest.app</p>
        </div>
      } />
    </div>
  );
}

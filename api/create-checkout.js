import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PRO_ENABLED = false; // ← flip to true when ready to charge real users

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Auth check
  const idToken = req.headers["authorization"]?.split("Bearer ")[1];
  if (!idToken) return res.status(401).json({ error: "Unauthorized" });

  let uid, email;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    uid   = decoded.uid;
    email = decoded.email;
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Feature flag — not charging yet
  if (!PRO_ENABLED) {
    return res.status(200).json({
      test_mode: true,
      message: "Stripe integration ready — not yet charging users.",
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode:                "subscription",
      payment_method_types:["card"],
      customer_email:      email,
      line_items: [{
        price:    process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      metadata: { uid },
      success_url: `${process.env.VITE_APP_URL || "https://her-nest.vercel.app"}/?upgrade=success`,
      cancel_url:  `${process.env.VITE_APP_URL  || "https://her-nest.vercel.app"}/?upgrade=cancelled`,
    });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error("[HerNest] Stripe error:", e?.message);
    return res.status(500).json({ error: "Could not create checkout session" });
  }
}

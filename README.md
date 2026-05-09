# HerNest
AI chief of staff for busy moms. Nora manages your mental load, calendar, budget, style, and wellness in one place.

## Stack
React 18 · Vite · Firebase Auth + Firestore · Vercel Serverless · Anthropic Claude API · PostHog · PWA

## Run locally
```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your Firebase + Anthropic keys
npm run dev
```

## Architecture
- `src/screens/` — feature screens
- `src/utils/firebase.js` — Firestore read/write
- `src/utils/claude.js` — AI calls with auth token
- `api/claude.js` — serverless proxy with Firebase Admin auth
- `src/types.ts` — TypeScript type definitions
- `firestore.rules` — security rules

## Environment variables
See `.env.example` for required variables.

# Nexus — Investor & Entrepreneur Collaboration Platform

Nexus is a platform that connects investors and entrepreneurs, enabling them to discover each other, schedule meetings, hold video calls, exchange and e-sign deal documents, and manage deal payments — all in one place.

This repository contains my work as a Frontend Development Intern at DevelopersHub Corporation, building on top of the base Nexus project.

## 🔗 Links

- **Live Demo:** [Add your Vercel link here]
- **Demo Video:** [Add your Loom/Drive link here]

## 🛠️ Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

## 🔑 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Entrepreneur | sarah@techwave.io | password123 |
| Investor | michael@vcinnovate.com | password123 |

*(Or use the "Entrepreneur Demo" / "Investor Demo" buttons on the login page.)*

After logging in, a 2FA step will appear — use demo code **123456**.

## ✨ Features

### Week 1 — Scheduling
- Consistent design system (colors, typography) via Tailwind config
- Meeting scheduling calendar with availability management
- Send, accept, and decline meeting requests
- Confirmed meetings shown on both dashboards

### Week 2 — Video Calling & Documents
- Real camera/mic video call UI (start/end call, mute, camera toggle, screen share)
- Document Chamber: upload, preview, and e-sign documents (canvas signature pad)
- Document status tracking: Draft → In Review → Signed

### Week 3 — Payments & Security
- Wallet with deposit, withdraw, and transfer (simulated)
- Deal funding flow (Investor → Entrepreneur)
- Full transaction history
- Password strength meter on registration
- Two-factor authentication mockup (OTP) on login
- Role-based dashboards (separate views for Investors and Entrepreneurs)
- First-time user guided walkthrough

## 📂 Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a full breakdown of the component structure, folder organization, and design system.

## 🚀 Running Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

## ⚠️ Note on Data

This is a frontend-only project — there is no real backend. Data (meeting requests, availability, wallet balances, transactions, documents) is simulated using browser `localStorage`, so it persists across page refreshes and account switches within the same browser.
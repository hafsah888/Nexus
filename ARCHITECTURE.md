# Nexus Platform — Component Structure & Architecture

## 1. Tech Stack
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Linting:** ESLint
- **Deployment:** Vercel

## 2. Folder Structure Overview

```
Nexus/
├── public/
│   └── logo.svg
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── pages/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

## 3. `src/components/` — Reusable UI Building Blocks

| Folder | Component | Purpose |
|---|---|---|
| `chat/` | `ChatMessage.tsx` | Renders a single chat message bubble |
| `chat/` | `ChatUserList.tsx` | List of users/contacts in chat sidebar |
| `collaboration/` | `CollaborationRequestCard.tsx` | Card showing a collaboration request (investor ↔ entrepreneur) |
| `entrepreneur/` | `EntrepreneurCard.tsx` | Card preview of an entrepreneur profile |
| `investor/` | `InvestorCard.tsx` | Card preview of an investor profile |
| `layout/` | `DashboardLayout.tsx` | Wrapper layout (sidebar + navbar + content area) used across dashboard pages |
| `layout/` | `Navbar.tsx` | Top navigation bar |
| `layout/` | `Sidebar.tsx` | Side navigation menu |
| `ui/` | `Avatar.tsx`, `Badge.tsx`, `Button.tsx`, `Card.tsx`, `Input.tsx` | Base reusable UI elements (used everywhere — buttons, inputs, cards etc.) |

**Note:** `ui/` folder is the design-system layer — any new theme colors/typography should be applied here first, since every other component depends on these.

## 4. `src/context/` — Global State

- `AuthContext.tsx` — Manages logged-in user state, role (Investor/Entrepreneur), and auth actions (login/logout) across the whole app using React Context API.

## 5. `src/data/` — Mock/Static Data

- `users.ts` — Dummy user records
- `messages.ts` — Dummy chat messages
- `collaborationRequests.ts` — Dummy collaboration request records

These simulate a backend/database since there's no real API yet.

## 6. `src/pages/` — Route-Level Screens

| Folder | Pages | Purpose |
|---|---|---|
| `auth/` | LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage | Authentication flow |
| `dashboard/` | InvestorDashboard, EntrepreneurDashboard | Role-based dashboards (different UI per role) |
| `investors/` | InvestorsPage | Browse/list all investors |
| `entrepreneurs/` | EntrepreneursPage | Browse/list all entrepreneurs |
| `deals/` | DealsPage | Deal-related page |
| `documents/` | DocumentsPage | Document handling page (this is where Document Chamber will go in Week 2) |
| `chat/` | ChatPage | Chat interface |
| `messages/` | MessagesPage | Messages inbox |
| `notifications/` | NotificationsPage | Notifications list |
| `profile/` | InvestorProfile, EntrepreneurProfile | Role-based profile pages |
| `settings/` | SettingsPage | App/account settings |
| `help/` | HelpPage | Help/support page |

## 7. `src/types/`

- `index.ts` — Central TypeScript type/interface definitions (e.g. User, Message, CollaborationRequest types) shared across the app.

## 8. Routing & Entry Point

- `App.tsx` — Root component, likely holds route definitions (React Router)
- `main.tsx` — App entry point, mounts React app to DOM
- `index.css` — Global styles / Tailwind imports

## 9. Role-Based Architecture (Key Pattern)

Nexus follows a **role-based structure**: Investor and Entrepreneur each get separate Dashboard, Profile, and Card components. This is important for Milestone 6 (Role-based UI) — the pattern already exists, we just extend it.

## 10. UI Theme (Design System)

The application's design system is centrally configured in `tailwind.config.js`. All reusable components should use these predefined theme tokens instead of hardcoded colors to maintain a consistent UI.

| Token | Color | Usage |
|---|---|---|
| `primary` (blue, #2563EB range) | Main brand color | Buttons, links, active states |
| `secondary` (teal) | Supporting color | Secondary actions, highlights |
| `accent` (amber/yellow) | Highlight color | Badges, callouts |
| `success` (green) | Status | "Signed", "Confirmed", success messages |
| `warning` (amber) | Status | "Pending", "In Review" |
| `error` (red) | Status | Errors, "Rejected" |

- **Font:** `Inter` (set as default sans-serif font app-wide)
- **Animations:** `fade-in`, `slide-in` — reusable transition classes for modals/cards

**Rule going forward:** any new component (Calendar, Video Call, Document Chamber, Payment UI) must reuse these tokens (`bg-primary-600`, `text-error-700`, etc.) instead of introducing new colors, to keep the app visually consistent.

## 11. Summary

The app is a **Vite + React + TypeScript + Tailwind** SPA with:
- Context API for auth state
- Mock data files instead of a real backend
- Clear separation: `components` (reusable) vs `pages` (routes) vs `context` (state) vs `data` (mock content)
- Role-based duplication pattern (Investor/Entrepreneur variants) used consistently

## 12. Week 1 Setup Status

- Repository forked and cloned successfully.
- Project dependencies installed.
- Application runs locally using Vite.
- Component structure and architecture documented.
- UI theme configuration reviewed and documented.
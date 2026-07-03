# Subhan Care — Hospital Management System (Frontend)

A responsive, role-based frontend for the Subhan Care HMS, built with React + Vite. This repository covers the **Sprint 1–3** deliverables: Authentication, Dashboard, Patient Management, Doctor Management, Appointment Scheduling, and Billing & Invoicing — all built against the module scope and Role-Permission Matrix defined in the project SRS (Section 9).

There is no backend yet. All data is served by a mocked service layer (`src/services/`) backed by `localStorage`, deliberately shaped to match what a real REST API would return (`{ data, total }` for paginated lists, thrown `Error`s for failure cases) so swapping in real endpoints later is a drop-in change, not a rewrite.

## Tech Stack

- **React 19** + **Vite**
- **React Router v7** for routing and route guarding
- **lucide-react** for icons
- Plain CSS with a shared token system (`src/styles/variables.css`) matching the project's UI Design Guide (colors, radius, spacing, typography)

## Getting Started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint       # oxlint
```

## Mock Login Credentials

Since there's no backend yet, sign in with any of the following (all mock users, defined in `src/services/authService.js`):

| Role             | Email                     | Password      |
|------------------|---------------------------|---------------|
| Admin            | admin@subhancare.pk       | Admin@123     |
| Doctor           | doctor@subhancare.pk      | Doctor@123    |
| Receptionist     | reception@subhancare.pk   | Front@123     |
| Pharmacist       | pharmacist@subhancare.pk  | Pharma@123    |
| Billing Staff    | billing@subhancare.pk     | Billing@123   |

Each role sees a different sidebar, dashboard, and set of permitted actions, enforced both in the UI (`Sidebar.jsx`) and at the route level (`RoleRoute.jsx`) — typing a restricted URL directly is blocked, not just hidden.

## Project Structure

```
src/
  components/   UI building blocks, grouped by module (auth, patients, doctors, appointments, billing, shared)
  constants/    roles.js (Role-Permission Matrix from SRS §9), routes.js, colors.js
  context/      AuthContext (session + idle timeout), ToastContext (global notifications)
  hooks/        Data-fetching hooks per module (usePatients, useDoctors, useAppointments, useBilling, useDashboardStats)
  layouts/      AuthLayout, DashboardLayout
  pages/        Route-level page components
  routes/       AppRoutes, ProtectedRoute (auth guard), RoleRoute (permission guard)
  services/     Mocked API layer — one file per module
  utils/        Formatters and Pakistan-specific validators (CNIC, mobile number, password strength)
```

## Notable Implementation Details

- **Session timeout (SR-04):** idle users are automatically logged out after 15 minutes (`AuthContext.jsx`).
- **RBAC at both layers (SR-03):** sidebar visibility and route access are both driven from the same `ROLE_MODULE_ACCESS` table, so they can never fall out of sync.
- **Password strength (SR-08):** enforced client-side (`utils/helpers.js`) — min 8 characters, upper + lower case, number, special character.
- **OTP expiry (SR-11):** password reset codes expire 15 minutes after being issued.
- **Live dashboard (FR-09.2):** each role's dashboard pulls real counts (patients, doctors, today's appointments, outstanding invoices) filtered to what that role can access — not static copy.

## Known Limitations (mock-data stage)

- No real backend — everything resets if `localStorage` is cleared.
- No password hashing (SR-01) or HTTPS enforcement (SR-02) yet — those are backend/deployment concerns, out of scope until the API is wired up.
- No audit logging (AL-01/AL-02) yet — requires a persistent backend to be meaningful.

## Git Workflow

Feature work happens on `feature/*` branches, merged into `main` via Pull Request after review — no direct pushes to `main`.

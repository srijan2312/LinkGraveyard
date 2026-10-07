# LinkGraveyard — Web Resource Health & Preservation Tracker

A full-stack web application that helps users save, organize, and monitor important web resources. It checks saved URLs for availability, detects redirects and broken links, and maintains a history of link health over time.

## Overview

People save useful URLs every day — tutorials, documentation, articles, GitHub repos, tools. Over time, some of those links move, redirect somewhere unexpected, or disappear entirely. **LinkGraveyard** is a personal preservation and monitoring app for your saved links: save them, organize them with categories and tags, and get a clear picture of which resources are healthy, which moved, and which are dead.

## Problem

You bookmark a useful tutorial today. Six months later, the page is gone — moved, deleted, or abandoned. Your bookmark still sits there, pointing at nothing. Link rot is silent: you only discover it when you need the resource most.

## Solution

LinkGraveyard watches your saved links for you:

1. **Save** URLs with titles, notes, categories, and tags.
2. **Check** whether each URL still works — manually per link, or your whole collection at once.
3. **Track** every check in a history timeline, so you can see exactly when a resource changed.

## Features

- JWT authentication (register, login, logout, protected routes)
- Dashboard: stat cards, health-overview chart, recently broken links, recent activity, quick actions
- Save links with title, URL, notes, category, and tags (+ duplicate prevention)
- Manual **Check Now** per link with loading state
- **Check All Links** with real progress ("Checking 12 / 40")
- Status system: **Healthy** / **Redirected** / **Broken** / **Never checked**
- Redirect detection that **preserves the original URL** and stores the final URL separately
- Per-link status **history timeline** + a global Link History feed
- Search across title, URL, domain, tags, and notes
- Filters by status and category; sorting (recent, oldest, recently checked, status)
- Categories page (defaults + your own custom categories)
- Bulk actions: check selected, delete selected, change category
- Settings: profile, appearance (two designed themes), security, account, and a danger zone with **account deletion**
- Real **Delete Account**: removes the user, all links, and all check history after typed-email confirmation, then lands on the landing page with a dismissible success notification
- Logout and account deletion both land cleanly on the landing page (no auth-page flash)
- Auth pages with back-to-home button and password visibility toggle
- Theme toggle (sun/moon) on every page: landing nav, auth pages, sidebar, and mobile top bar
- Collapsible sidebar — shrinks to an icon-only rail, choice persisted per device
- Search/filter/sort/page persist per tab (sessionStorage) — going to a link's detail page and back restores your exact view; `?status=`/`?category=` deep-links from dashboard cards always win
- Favicons next to link titles with a graceful letter-tile fallback (a broken image can never appear)
- Delete confirmations are double-click safe: buttons disable while the request is in flight
- Category picker is a real dropdown with a "+ New category…" option (reliable on mobile)
- Two intentionally designed themes — "Midnight Archive" (dark) and "Paper Archive" (light) — with a persisted switcher
- Responsive design, empty states everywhere, accessible forms

## Design

LinkGraveyard has its own "Archive" visual identity: serif display type for headings and the brand (a card-catalog feel), monospace for URLs, badges and metadata (the developer-tool voice), and warm, restrained palettes. The dark **Midnight Archive** theme uses warm near-black surfaces (never pure black) with brass accents under a soft amber glow; the light **Paper Archive** theme uses warm off-white paper (never pure white) with a controlled plum accent. Status badges are styled like archive stamps. The theme switcher persists the user's choice in `localStorage`, and one shared `useTheme` hook keeps every toggle and the Settings cards in sync.

## Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 18, React Router 6, Axios, Lucide icons, plain CSS |
| Backend    | Node.js, Express 4                                      |
| Database   | MongoDB + Mongoose                                      |
| Auth       | JWT (jsonwebtoken) + bcryptjs                           |
| Build/dev  | Vite, npm, dotenv                                       |
| Tests      | node:test + supertest + mongodb-memory-server           |

## Architecture

```
Browser (React SPA)
   │  JSON over HTTP (/api/*)
   ▼
Express API
   ├─ routes/        → URL paths
   ├─ middleware/    → auth (JWT verify), errorHandler
   ├─ controllers/   → request logic (auth, links)
   ├─ utils/         → checkUrl (the link checker), validateUrl
   └─ models/        → Mongoose schemas
         │
         ▼
      MongoDB (3 collections: users, links, linkcheckhistories)
```

The frontend is a single-page app. In development, Vite serves it on `:5173` and proxies `/api` to Express on `:5000`. In production (`NODE_ENV=production`), Express serves the built files from `client/dist` itself — one server, one deploy.

## Project Structure

```
linkgraveyard/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Logo, StatusBadge, Layout, modals, ...
│   │   ├── pages/           # Landing, Login, Register, Dashboard, MyLinks,
│   │   │                    # AddLink, LinkDetail, Categories, LinkHistory, Settings
│   │   ├── context/         # AuthContext — global login state
│   │   ├── services/        # api.js — axios instance + 401 handling
│   │   ├── hooks/           # useLinks (search/filter), useCheckAll (progress)
│   │   ├── utils/           # format.js — time-ago, domain, status labels
│   │   ├── App.jsx          # route map
│   │   ├── main.jsx         # entry point
│   │   └── styles.css       # entire design system (dark-first)
│   └── package.json
├── server/
│   ├── config/db.js         # MongoDB connection
│   ├── controllers/         # authController.js, linkController.js
│   ├── middleware/          # auth.js (JWT), errorHandler.js
│   ├── models/              # User, Link, LinkCheckHistory
│   ├── routes/              # authRoutes.js, linkRoutes.js
│   ├── utils/               # checkUrl.js (the checker), validateUrl.js
│   ├── scripts/seed.js      # demo data (dev only)
│   ├── tests/api.test.js    # 13 API tests
│   └── server.js            # entry point
├── README.md
├── INTERVIEW_QA.md
└── .env.example
```

## How It Works (link checking)

`server/utils/checkUrl.js` sends one HTTP request per URL **with redirects disabled** (`maxRedirects: 0`), so a redirect is visible instead of silently followed:

| Response            | Status       | Notes                                                        |
| ------------------- | ------------ | ------------------------------------------------------------ |
| 2xx                 | **healthy**      | The resource responds                                    |
| 3xx                 | **redirected**   | The `Location` header is resolved and stored as `finalUrl` |
| 4xx / 5xx           | **broken**       | The server answered, but the resource isn't available      |
| Timeout / DNS error | **never_checked**| Temporary failure — not marked dead                        |
| SSL certificate error | **never_checked** | Expired/self-signed/wrong-hostname cert — its own message |
| Private/internal IP | **never_checked**| Blocked on purpose (SSRF protection)                       |

Each check updates the link (`status`, `httpStatus`, `finalUrl`, `lastChecked`) **and** appends a `LinkCheckHistory` document — that's what powers the history timeline. A 12-second timeout guarantees a user-supplied URL can never hang the server. Redirects are never followed (`maxRedirects: 0`) — the first 3xx response is recorded as `redirected` with its `Location` header, so a redirect can never be misreported as healthy.

The four statuses use one consistent representation everywhere — frontend, backend, and database: `healthy`, `redirected`, `broken`, `never_checked`.

## Authentication (JWT flow)

1. Register/login → server verifies credentials → signs a JWT (`{ id }`, 7-day expiry) with `JWT_SECRET`.
2. The frontend stores the token in `localStorage` and sends it as `Authorization: Bearer <token>` on every request (axios interceptor). Failed logins return clear messages: `No account found with this email.` (404) or `Incorrect password. Please try again.` (401).
3. The `auth` middleware verifies the token, loads the user, and attaches it as `req.user`.
4. Controllers **always** filter by `req.user._id` — never by any id from the request body. That's what keeps users' data isolated.
5. On 401 (expired/invalid token), the axios interceptor clears the token and redirects to login.

Passwords are hashed with bcrypt (cost factor 10) via a Mongoose pre-save hook and are never returned by the API.

## Database Schema

**users** — `name`, `email` (unique), `password` (hashed, `select: false`), timestamps.

**links** — `user` (ref → User), `url` (unique per user), `title`, `description`, `category` (string), `tags[]`, `status` (healthy/redirected/broken/unknown), `httpStatus`, `finalUrl`, `responseTime`, `lastChecked`, timestamps.

**linkcheckhistories** — `link` (ref → Link), `user` (ref → User, for fast per-user queries), `status`, `httpStatus`, `finalUrl`, `responseTime`, `errorMessage`, `checkedAt`. Deleting a link deletes its history.

Why a separate history collection instead of an array on the link? A link checked weekly for years would grow one document without bound; a separate collection keeps the link document small and lets history be queried/paginated independently.

## API Endpoints

| Method | Endpoint                  | Auth | Description                          |
| ------ | ------------------------- | ---- | ------------------------------------ |
| POST   | `/api/auth/register`      | No   | Create account → returns JWT         |
| POST   | `/api/auth/login`         | No   | Log in → returns JWT                 |
| GET    | `/api/auth/me`            | Yes  | Restore session from token           |
| PUT    | `/api/auth/profile`       | Yes  | Update name                          |
| PUT    | `/api/auth/password`      | Yes  | Change password                      |
| GET    | `/api/links`              | Yes  | List links (search/filter/sort/page) |
| POST   | `/api/links`              | Yes  | Save a link (optional immediate check) |
| GET    | `/api/links/stats`        | Yes  | Dashboard counts + recently broken  |
| GET    | `/api/links/categories`   | Yes  | All categories in use                |
| POST   | `/api/links/check-all`    | Yes  | Check links (accepts `{ ids }`)      |
| POST   | `/api/links/bulk-delete`  | Yes  | Delete many links                    |
| POST   | `/api/links/bulk-category`| Yes  | Change category for many links       |
| GET    | `/api/links/history/recent`| Yes | Global check-history feed            |
| GET    | `/api/links/:id`          | Yes  | One link (ownership-checked)         |
| PUT    | `/api/links/:id`          | Yes  | Edit title/notes/category/tags       |
| DELETE | `/api/links/:id`          | Yes  | Delete link + its history            |
| POST   | `/api/links/:id/check`    | Yes  | Check Now — re-check one link        |
| GET    | `/api/links/:id/history`  | Yes  | Per-link check timeline              |

## Installation

```bash
# 1. Clone the repository
git clone <your-repo-url> linkgraveyard
cd linkgraveyard

# 2. Backend setup
cd server
npm install
cd ..
cp .env.example .env        # then fill in your values (see below)

# 3. Frontend setup (new terminal)
cd ../client
npm install
```

You also need **MongoDB** running — either locally (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

## Environment Variables

Create `.env` at the project root (see `.env.example`):

| Variable      | Required | Description                                              |
| ------------- | -------- | -------------------------------------------------------- |
| `MONGODB_URI` | Yes      | MongoDB connection string                                |
| `JWT_SECRET`  | Yes      | Long random string used to sign tokens                   |
| `PORT`        | No       | API port (default `5000`)                                |
| `FRONTEND_URL`| No       | Allowed CORS origin(s), comma-separated (default `http://localhost:5173`) |
| `NODE_ENV`    | No       | Set to `production` to serve the built frontend          |

## Running Locally

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server
npm run dev        # or: npm start

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm run dev
```

Optional demo data (creates `demo@linkgraveyard.dev` / `demo1234` with 10 links in different states):

```bash
cd server
npm run seed            # add demo data
npm run seed -- --reset # remove it again
```

Run the backend test suite:

```bash
cd server
npm test
```

Production build (serves frontend + API from one server):

```bash
cd client && npm run build
cd ../server && NODE_ENV=production npm start
```

## Screenshots

> Add screenshots here after running the app:
>
> - `docs/landing.png` — landing page hero
> - `docs/dashboard.png` — dashboard with health overview
> - `docs/links.png` — My Links with filters
> - `docs/detail.png` — link detail + history timeline

## Future Improvements

- Scheduled automatic checks (e.g. weekly) with a simple cron job — currently all checks are manual
- Email notification when a link breaks
- Browser extension for one-click saving
- Import bookmarks from browsers
- Export links (CSV/JSON)
- Full-page snapshots via the Wayback Machine
- Per-category health breakdowns

## Limitations

- Checks are **manual** — nothing re-checks links automatically on a schedule.
- No email/push notifications when a link breaks.
- Some sites block non-browser requests or require JavaScript, so a "broken" result occasionally means "blocked the checker", not "page is gone".
- The link checker runs in the request cycle (no background queue), so very large collections take a while to check all at once.
- Auth tokens live in `localStorage` (simple and explainable); httpOnly cookies would be the next hardening step.

## Interview Summary

> "LinkGraveyard is a full-stack MERN app I built to solve link rot — the problem that saved bookmarks silently go dead over time. Users save URLs with notes, categories and tags. The backend checks each URL with a real HTTP request and classifies it as healthy, redirected, or broken, and every check is stored in a history timeline so you can see when a resource changed. The key design decisions: redirects never overwrite the original URL, temporary failures are marked unknown rather than broken, and every query is scoped to the logged-in user so accounts are fully isolated."

## Resume Bullet Points

- Built **LinkGraveyard**, a full-stack MERN app that monitors the health of saved web resources — URL saving with categories/tags, on-demand health checks, redirect detection, and a per-link status history timeline.
- Implemented JWT authentication with bcrypt password hashing, ownership-scoped MongoDB queries, and input validation; wrote 13 backend API tests (auth, CRUD, ownership isolation, checker classification) with supertest + mongodb-memory-server.
- Designed the link-checking service: single HTTP request with redirects disabled, HTTP-status-based classification (2xx/3xx/4xx/5xx), 12s timeouts, and SSRF guards blocking private/internal targets; verified end-to-end with a 24-step headless-browser test run.

## Author

- **Name:** [Your Name]
- **GitHub:** [https://github.com/your-username]
- **LinkedIn:** [https://www.linkedin.com/in/your-profile]

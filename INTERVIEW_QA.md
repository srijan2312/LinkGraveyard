# LinkGraveyard — Interview Q&A

Every realistic interview question about this project, with beginner-friendly answers. Read the 30-second / 1-minute / 2-minute explanations first, then the sections.

---

## A. Project Introduction

### 30-second version

"LinkGraveyard is a full-stack MERN app that solves link rot. Users save important URLs with notes, categories and tags, and the app checks whether each link still works — healthy, redirected, broken, or never checked. Every check is stored in a history timeline, so you can see exactly when a resource changed."

### 1-minute version

"LinkGraveyard is a personal web-resource preservation app I built with the MERN stack. The problem is link rot: you bookmark a tutorial today, and six months later the page is gone and your bookmark points at nothing. In my app, users save URLs with titles, notes, categories and tags. The backend then checks each URL with a real HTTP request and classifies it as healthy, redirected, broken, or never checked. Redirects are detected without overwriting the original URL, and every single check is recorded in a history collection, so there's a timeline of each link's health. There's also search, filters, bulk actions, a dashboard with a health overview, and JWT authentication so every user's data is private."

### 2-minute version

**Problem:** "We all save links — tutorials, docs, articles — and over time a lot of them silently die. You only find out when you actually need the resource."

**Solution:** "I built LinkGraveyard, a full-stack app where you save URLs with titles, notes, categories and tags, and the app monitors their health. There's a dashboard with stat cards and a health chart, a main links page with search and filters, a detail page per link, and a global history feed."

**Architecture:** "It's the MERN stack. React frontend with React Router and Axios, Express backend with REST APIs, MongoDB with Mongoose. Three collections: users, links, and link check history. Auth is JWT with bcrypt-hashed passwords."

**Important feature:** "The link checker. It sends one HTTP request per URL with redirects disabled, so a 301 is visible instead of silently followed. 2xx is healthy, 3xx is redirected with the final URL stored separately, 4xx/5xx is broken. Timeouts, DNS failures, and SSL certificate errors are marked never_checked, not broken — because a temporary failure doesn't mean the resource is gone. SSL failures get their own message ("SSL certificate error — the site's certificate is invalid or expired.") so users know it's a certificate problem, and the detail page surfaces the latest check's error message in the Current status card. And there's an SSRF guard that blocks private/internal addresses so the checker can't be abused to probe internal networks."

**Challenge:** "The hardest part was making 'Check all links' feel responsive without building a queue system. I kept it simple: the frontend sends ids in small batches and shows real progress like 'Checking 12 / 40', and the button stays disabled so users can't double-fire it."

**Future improvement:** "Scheduled automatic checks — right now every check is manual. A simple cron job that re-checks weekly and emails you when something breaks would be the natural next step."

### Tell me about your project / What is LinkGraveyard?

LinkGraveyard is a personal web-resource preservation and monitoring app. You save important URLs, organize them with categories and tags, and the app tells you whether each link is healthy, redirected, or broken — with a full history of every check. The tagline is "Save the web before it disappears."

### Why did you build it?

Link rot is a real, everyday frustration: bookmarks silently go dead. I wanted a portfolio project that was a *real working product* rather than another todo app, and link monitoring gave me a genuinely interesting backend problem (HTTP semantics, redirects, failure classification) plus a full CRUD frontend.

### What problem does it solve?

It makes link decay visible. Instead of discovering a dead tutorial in the middle of a project, you see broken and redirected resources in one place, with a timeline of when each one changed.

### Who would use it?

Developers, students, and researchers — anyone who collects reference links and wants to know they still work.

### What makes it different from a bookmark manager?

Bookmark managers store links; LinkGraveyard *watches* them. The differentiators are health checking, redirect detection that preserves the original URL, and the per-link status history timeline.

### What was your role?

Sole developer — I designed the data model and API, built the entire frontend and backend, wrote the tests, and documented it.

### Why is the fourth status called `never_checked` instead of `never_checked`?

Consistency: the exact same value is used in the MongoDB enum, the backend classification, the API responses, and the frontend filters and badges. One representation everywhere means the dashboard counts, the My Links filter, and the history timeline can never disagree about what a status means.

---

## B. Feature Questions

### How does authentication work in the UI?

Register and Login pages with validated forms. On success the JWT is stored and the user is routed to the dashboard. All app pages are wrapped in `ProtectedRoute`, which bounces unauthenticated users to `/login`. The auth context restores the session from a stored token on page refresh. Logout clears the token.

### How does the category picker work on the Add Link page?

It's a native `<select>` dropdown listing all existing categories, plus a "+ New category…" option that reveals a text field. I used a native select deliberately: the previous `<input list="datalist">` approach doesn't open its suggestion popup reliably on all browsers, especially mobile. A native select always opens, so the bug is fixed by construction.

### How does account deletion work?

The Settings danger zone has a "Delete my account" button that opens a confirmation modal. The user must type their email address to enable the delete button — this prevents accidental clicks. The frontend calls `DELETE /api/auth/account`, which deletes the user's check history, then their links, then the user document (dependents first, so no orphaned records). The frontend then clears the JWT and navigates to the landing page with `replace: true`, so there's no flash of the login page or dashboard.

### What happens when the user logs out?

`logout()` clears the token from localStorage and resets auth state, then the app navigates to `/` (the landing page) with `replace: true`. Because the auth state is cleared synchronously before navigating, there's no flash of a protected page or the login form.

### How does the dashboard work?

It calls `GET /api/links/stats` (counts grouped by status via a MongoDB aggregation, plus the 5 most recently broken links) and shows stat cards, a simple bar chart, recently broken links, recent activity, and quick actions. With zero links it shows a friendly empty state instead of zeros.

### How do you add a link?

The Add Link form validates the URL client-side, posts to `POST /api/links`, and the backend validates again, normalizes the URL, and rejects duplicates per user. An optional "check right after saving" checkbox runs an immediate health check so the user sees the result instantly.

### How do search and filters work?

One search box queries title, URL, description, and tags with a case-insensitive regex on the backend. Status and category are dropdown filters, and sorting covers recently added, oldest, recently checked, and status. Search input is debounced (300ms) so we don't fire a request per keystroke.

### How do categories work?

Category is a plain string on the link document — no separate collection, which keeps things simple. A datalist suggests existing categories but users can type a new one. The Categories page lists each category with its link count and links to a pre-filtered My Links view.

### How do tags work?

Tags are a string array on the link. The frontend accepts comma-separated input, lowercases, trims, dedupes, and drops empties. Tags are included in the search query.

### How does link checking work?

Per link: the "Check Now" button calls `POST /api/links/:id/check`. The backend runs `checkUrl()`, updates the link, and appends a history entry. The UI shows a loading spinner, disables the button to prevent double clicks, and updates the status badge in place.

### How are redirects detected?

The checker disables automatic redirect following (`maxRedirects: 0`), so a 301/302 response is returned to us directly. We read the `Location` header, resolve it to an absolute URL, store it as `finalUrl`, and mark the link `redirected`. The original URL is never overwritten.

### How do you show broken links?

The dashboard has a "Recently broken" card, and My Links has a status filter (plus a direct `/links?status=broken` link from the dashboard quick actions). If a broken link becomes healthy again, the next check simply updates it back to `healthy`.

### How is link history stored and shown?

Every check creates a `LinkCheckHistory` document. The link detail page shows a timeline (newest first) with status, HTTP code, response time, final URL, and error message. A separate "Link History" nav page shows a global feed across all links, populated via `.populate('link', 'title url')`.

### How does "Check all" work?

The frontend collects all ids matching the current filters, sends them to `POST /api/links/check-all` in batches of 10, and shows progress ("Checking 12 / 40" with a progress bar). The backend processes each batch with a small concurrency limit (3 at a time).

### What bulk actions exist?

Select links with checkboxes → check selected, delete selected (with a confirmation modal), or move them to a different category. Deliberately small — no giant bulk-management system.

### How is the app responsive?

The sidebar becomes a slide-in drawer behind a hamburger button on mobile (≤768px), grids collapse to single columns, link rows stack vertically, and the toolbar wraps. No horizontal scrolling on normal phone screens.

---

## C. MERN Questions

### Why React?

Component-based UI, huge ecosystem, and exactly what entry-level frontend jobs ask for. State (`useState`), effects (`useEffect`), and Context covered everything I needed without extra libraries.

### Why Node + Express?

JavaScript on both ends means one language across the stack. Express is minimal and unopinionated — routing, middleware, and JSON APIs with very little boilerplate, which keeps the backend explainable.

### Why MongoDB + Mongoose?

The data is document-shaped (a link with nested tags and a flat history log) and the schema evolves easily. Mongoose adds schema validation, the password-hashing hook, and population for the history feed, without hiding MongoDB itself.

### How does the frontend communicate with the backend?

JSON over HTTP. A single axios instance (`services/api.js`) sets the base URL, attaches the JWT to every request, and centrally handles 401s. All endpoints live under `/api`.

### What is a REST API?

An API that uses HTTP methods on resource URLs: `GET /api/links` reads, `POST /api/links` creates, `PUT /api/links/:id` updates, `DELETE /api/links/:id` removes. Stateless — each request carries its own auth token.

### GET vs POST? PUT vs PATCH? Why DELETE?

GET reads data (and must not change anything); POST creates. PUT replaces a resource's fields (I use it for full-ish updates of a link); PATCH would be for partial updates — I didn't need the distinction, so PUT everywhere keeps it simple. DELETE removes.

### What is middleware?

A function that runs before the route handler. My `auth` middleware verifies the JWT and loads the user; `errorHandler` catches all errors in one place and returns safe messages.

### Controllers vs routes — why separate?

Routes declare *which URL maps to which function*; controllers contain *what happens*. It keeps files small and lets me test controller logic without HTTP.

---

## D. Authentication Questions

### What is JWT and why use it?

A JSON Web Token is a signed, tamper-evident token. The server signs `{ id }` with a secret; the client sends it back on each request; the server verifies the signature instead of looking up a session in a database. It's stateless and simple — perfect for this app's scale.

### How does login work?

1. User submits email + password.
2. Server finds the user (including the hashed password), compares with bcrypt.
3. On match, server signs a JWT (7-day expiry) and returns `{ token, user }`.
4. Frontend stores the token and attaches it to future requests.
5. On failure the messages are explicit: `No account found with this email.` (404) when the email isn't registered, `Incorrect password. Please try again.` (401) when it is. (The classic "invalid credentials" vagueness avoids user enumeration, but explicit messages are friendlier — a deliberate UX trade-off here.)

### How does registration work?

Validate input → check the email isn't taken → create the user (the Mongoose pre-save hook hashes the password with bcrypt) → sign and return a JWT so the new user is logged in immediately.

### How are passwords hashed? Why not store them directly?

With bcrypt (`bcryptjs`, cost factor 10): a salted, deliberately slow one-way hash. If the database ever leaks, attackers get hashes, not passwords — and the slowness makes brute force impractical. Storing plain text would expose every password on any breach.

### Protected routes — frontend and backend?

Frontend: `ProtectedRoute` redirects to `/login` when there's no valid session. Backend: the `auth` middleware on every `/api/links` route verifies the JWT. Both matter — frontend routing is UX, the backend is the real security.

### Authentication vs authorization?

Authentication = *who are you* (login, JWT). Authorization = *what may you do* (you may only touch your own links — enforced by filtering every query with `req.user._id`).

### What happens when the token expires?

The backend returns 401 with "Session expired". The axios interceptor clears the stored token and sends the user to `/login?expired=1`, which shows "Your session expired. Please log in again."

### How does logout work?

Frontend clears the token from localStorage and resets auth state. (With stateless JWTs there's no server session to destroy.)

### What if the token is invalid/tampered with?

`jwt.verify` throws, the middleware returns 401, and the user is sent to login. The signature guarantees tampering is detected.

---

## E. MongoDB Questions

### Collections, documents, ObjectId?

A collection is like a table; a document is like a row (a JSON-like object). Every document gets a unique `_id` of type ObjectId.

### What does the Mongoose schema do?

It defines the shape of documents: field types, required fields, defaults, enums (the four statuses), and the unique index on `(user, url)` that prevents duplicates.

### How are users and links related?

One-to-many: each link stores `user` as an ObjectId referencing the User. All link queries include `{ user: req.user._id }`, which both scopes data and enforces ownership.

### How is history related?

Each `LinkCheckHistory` stores `link` (ref → Link) and `user` (ref → User, so the global feed is one query without joining). Deleting a link deletes its history entries — they’re meaningless alone. Deleting the whole account deletes history, then links, then the user, so no orphaned records remain.

### Why does MongoDB fit this project?

Flexible documents for links with varying tags/notes, easy time-series-style history inserts, and no complex joins — the access patterns are simple per-user queries.

---

## F. Link Checking Questions (the most important section)

### How does the app check a URL?

`checkUrl()` in `server/utils/checkUrl.js`: validate it's http(s), resolve its DNS and reject private/internal IPs (SSRF guard), then send one axios GET with a 12-second timeout and redirects disabled. The response is classified by a pure function, `classifyResponse()`.

### What is an HTTP status code?

A 3-digit number in every HTTP response saying what happened: 2xx success, 3xx redirect, 4xx client error, 5xx server error.

### What do 200 / 301 / 302 / 404 / 500 mean?

- **200** OK — the page loaded. → healthy.
- **301** Moved Permanently / **302** Found — the URL redirects. → redirected (we store where it points).
- **404** Not Found — the page doesn't exist. → broken.
- **500** Internal Server Error — the server failed. → broken.

### How are redirects detected?

By *not* following them: `maxRedirects: 0` makes axios hand us the 3xx response. We read the `Location` header, resolve relative URLs against the original, and save it as `finalUrl`.

### How do you determine the final URL?

From the `Location` response header, resolved with `new URL(location, originalUrl)` so relative redirects like `/new-page` become absolute.

### What happens on timeout?

The request aborts after 12 seconds and the result is `never_checked` with "The request timed out…" — a slow site isn't necessarily a dead site.

### What if the domain doesn't exist?

DNS resolution fails → `never_checked` ("Could not reach the site. This may be temporary."). DNS hiccups happen; we don't declare the resource dead over them.

### Why preserve the original URL?

That's the product's concept: the saved URL is the *artifact*. If a tutorial moves, you want to know where it went *and* keep a record of where it was. Overwriting would destroy information.

### How is link history stored?

One `LinkCheckHistory` document per check: link, user, status, HTTP code, final URL, response time, error message, timestamp. Newest-first index on `(link, checkedAt)`.

### Why shouldn't every failed request mean "permanently dead"?

Because failures have different meanings: a 404 is the server telling you the resource is gone (broken); a timeout or DNS error is *absence of information* (never_checked). Conflating them would mark healthy-but-slow sites as dead and erode trust in the tool.

---

## G. Security Questions

### How do you stop users accessing each other's links?

The user id always comes from the verified JWT (`req.user._id`), never from request parameters or body. Every link query includes `{ user: req.user._id }`, and single-link routes return 404 (not 403) for other users' links so we don't even confirm they exist.

### How are passwords stored?

bcrypt hash with salt, cost factor 10, via a Mongoose pre-save hook. The schema sets `select: false` so the hash is never returned by queries unless explicitly requested (login only).

### What are environment variables?

Config outside the code (`.env`): database URI, JWT secret, ports. Secrets never get committed — `.env.example` documents the shape, `.gitignore` excludes the real file.

### What is CORS?

A browser security rule: a page from one origin can't call another origin's API unless the server allows it. My Express server only allows the configured frontend origin(s).

### How do you validate URLs?

`new URL()` parsing + protocol must be `http:`/`https:`. Rejected: `javascript:`, `file:`, `data:` URLs and malformed strings. The checker additionally blocks private IPs and localhost.

### What security concerns exist when a server checks user-provided URLs?

**SSRF** (Server-Side Request Forgery): an attacker could make the server request internal addresses — `http://localhost:…`, cloud metadata endpoints (`169.254.169.254`), or internal services — and exfiltrate data via timing/error messages.

### What basic measures did you take?

1. Protocol whitelist (http/https only).
2. DNS resolution + private-IP rejection before any request (covers 10/8, 172.16/12, 192.168/16, 127/8, ::1, link-local, and the metadata IP).
3. Explicit `localhost` rejection.
4. 12s timeout so checks can't hang the server.
5. No response bodies are returned to the client — only status, code, timing, and final URL.

---

## H. API Questions

### What REST APIs did you create?

Auth: register, login, me, update profile, change password. Links: list (with search/filter/sort/pagination), create, read, update, delete, check one, check all (batched), bulk delete, bulk category, stats, categories, per-link history, global history feed. (Full table in the README.)

### What happens when `POST /api/links/:id/check` is called?

Auth middleware verifies the JWT → controller loads the link scoped to the user (404 otherwise) → `checkUrl(link.url)` runs → `applyCheckResult` updates the link fields and creates a history entry → the updated link is returned.

### What is middleware? How do protected routes work?

Middleware functions run in the request pipeline before handlers. `router.use(auth)` on the link routes means every request must present a valid Bearer token; the middleware verifies it, loads the user, and either calls `next()` or returns 401.

---

## I. Frontend Questions

### Components, props, state?

The UI is built from components (e.g. `StatusBadge`, `LinkEditModal`, pages). Props pass data down (e.g. a `link` object into the edit modal); `useState` holds local UI state (form fields, loading flags, selections).

### useState / useEffect?

`useState` for values that change and re-render (filters, link lists). `useEffect` for side effects: fetching data on mount or when filters change (with a 300ms debounce for search).

### Why Context for auth?

Login state is needed everywhere (nav, route guards, user chip). `AuthContext` provides `user`, `login`, `register`, `logout` to the whole tree without prop drilling.

### How does React Router work here?

`BrowserRouter` + `Routes`: public routes for landing/login/register, and private routes wrapped in `ProtectedRoute` + `Layout`. `useParams` reads the link id on the detail page; `useSearchParams` lets dashboard cards deep-link into pre-filtered lists.

### How do you handle loading / error / empty states?

Every async action has all three: spinners + disabled buttons for loading, friendly messages from `apiErrorMessage()` (never raw server errors), and designed empty states on every page ("Your link graveyard is empty…", "No links matched your search.").

### How are API calls organized?

One axios instance with request/response interceptors: it injects the token and, on 401, clears the session and redirects to login. Components call it directly or through the `useLinks` / `useCheckAll` hooks.

### What is conditional rendering?

Showing different UI based on state — e.g. the dashboard renders stat cards when links exist and an empty state when they don't; the bulk-action bar only appears when something is selected.

---

## J. Problems & Challenges

### What was the hardest part?

Making "Check all links" feel good without building a queue system. Solution: the frontend batches ids (10 per request), the backend checks with small concurrency, and the UI shows real progress with a disabled button. Simple, honest, and explainable.

### What bugs did you face?

- **Express route ordering**: `/stats` had to be registered before `/:id`, otherwise "stats" was treated as a link id. Fixed by ordering static routes first.
- **Redirects being invisible**: axios follows redirects by default, so I initially never saw 301s. Fixed with `maxRedirects: 0`.
- **Test isolation**: my E2E script clicked rows by index and edited the wrong link after sorting changed the order. Fixed by targeting rows by title text — a good lesson in writing resilient selectors.

### How did you handle authentication edge cases?

Expired tokens redirect to login with an explanatory message; tampered tokens are rejected by signature verification; the password field is `select: false` so it can't leak accidentally.

### What would you improve?

Scheduled automatic checks with email alerts is the big one. Then bookmark import, Wayback Machine snapshots, and moving the token to an httpOnly cookie.

### What are the current limitations?

Checks are manual only; no notifications; some sites block automated requests (a "broken" can occasionally mean "blocked the checker"); check-all runs in the request cycle so huge collections are slow; tokens in localStorage instead of httpOnly cookies.

### How does the theme toggle work on every page?

One shared `useTheme` hook (no Context needed): the theme lives in module scope, on `<html data-theme>`, and in localStorage — all kept in sync. Every component using the hook subscribes to a listener set, so changing the theme from the sidebar instantly updates the Settings cards too. The toggle button sits in the landing nav, on the auth pages (floating), in the sidebar footer, and in the mobile top bar.

### How does the collapsible sidebar work?

A `collapsed` boolean in the Layout component, persisted to localStorage. Toggling just flips a CSS class: `.sidebar.collapsed` shrinks the rail to icon-only width and hides all text labels (brand text, nav labels, section heading, user details) with `display: none`, centering the icons. No layout library, no animation framework — one class and CSS.

### How did you design the two themes?

They're intentionally different designs, not inverted colors. The dark "Midnight Archive" uses warm near-black surfaces with a brass accent, serif display type, and monospace details — like a card catalog. The light "Paper Archive" uses warm off-white paper, white surfaces, and a controlled plum accent. The choice persists in localStorage and applies before first paint to avoid a flash.

---

## K. Scenario-Based Questions

### A user tries to access another user's link ID. What happens?

They get 404 "Link not found." Every query is scoped with `{ user: req.user._id }` from the verified JWT, so another user's link is simply invisible. We return 404 rather than 403 to avoid confirming the link exists.

### A link works today but is broken tomorrow. What happens?

The next check updates it: status flips to `broken`, `lastChecked` updates, and a new history entry records the change. The timeline will show healthy → broken with dates.

### A link redirects to another page. What happens?

It's marked `redirected`, the target is stored in `finalUrl`, and the UI shows both URLs with a note that the original was preserved.

### The target website takes 30 seconds to respond. What happens?

The checker aborts at 12 seconds and records `never_checked` ("The request timed out…"). The server never hangs, and the link isn't falsely marked dead.

### Two users save the same URL. Should they see each other's link?

No — links are per-user (the unique index is on `user + url`, not just `url`). Each user has their own copy, own notes, own check history.

### The JWT expires while the user is using the dashboard. What happens?

The next API call returns 401; the axios interceptor clears the token and redirects to `/login?expired=1`, which explains the session expired.

### What happens after logout?

The token is cleared and the user lands on the public landing page. If they try to visit `/dashboard` directly, the `ProtectedRoute` guard bounces them to `/login` because there's no valid session.

### What happens after account deletion?

The user document, all their links, and all their check history are deleted from MongoDB. The frontend clears the JWT and navigates to the top of the landing page with `location.state.accountDeleted = true`, which shows a dismissible green notification ("Your account was successfully deleted…"). The flag is cleared from history state so a refresh doesn't re-show it. The old token is useless — the auth middleware rejects it because the user no longer exists.

### What if the same user opens the app on another device?

JWTs are stateless, so the other device keeps working with its own stored token until it expires. Logging out on one device doesn't log out the other — that's a known trade-off of simple token auth, and acceptable for this app.

### The database goes offline. How does your application respond?

Mongoose operations throw; the central `errorHandler` logs the technical error server-side and returns "Something went wrong on our side. Please try again." The frontend shows that message instead of raw errors. (If MongoDB is down at startup, the server refuses to start — no point serving an API that can't store anything.)

---

## L. Code-Level Questions

### Why separate controllers and routes?

Routes are the URL map; controllers are the logic. Small files, single responsibility, and controllers can be tested without HTTP.

### Why use middleware?

To avoid repeating auth and error handling in every route. `router.use(auth)` protects a whole group of routes in one line.

### Why async/await?

Database calls and HTTP checks are asynchronous. `async/await` keeps the code reading top-to-bottom instead of nested callbacks.

### Why try/catch in controllers?

So any failure (validation, DB error, network error) is passed to `next(err)` and handled by the central error middleware — one place that decides what the user sees.

### Why environment variables?

Secrets and deployment-specific config (DB URI, JWT secret, ports) must not live in code or git. `.env.example` documents what's needed without exposing values.

### Why Mongoose instead of the raw driver?

Schema validation, the password-hashing hook, middleware, and `populate` — while still being plain MongoDB underneath.

### Why validate on the backend if the frontend already validates?

The frontend is not a security boundary — anyone can call the API with curl. Backend validation is the real validation; frontend validation is UX.

### Why check ownership in the backend?

Same reason: the frontend can be bypassed. Trusting a user id from the request body would let anyone read anyone's links by changing a parameter.

### How do search/filter/sort survive navigating to a detail page and back?

They're saved to `sessionStorage` on every change inside the `useLinks` hook, and restored when My Links mounts. `sessionStorage` (not `localStorage`) is per-tab, so a fresh tab still starts clean. One subtlety I hit: My Links also accepts `?status=`/`?category=` deep-links from dashboard cards — I initially spread those defaults *after* the saved filters, which wiped the restored values. The fix: only pass URL params that are actually present, so the precedence is defaults < saved filters < explicit deep-link.

### How do favicons work without breaking the UI?

A small `Favicon` component loads the icon from Google's favicon service, but the key is the `onError` handler: if the image fails for any reason (offline, blocked host, no icon), it swaps to a styled letter tile. A broken-image icon can never appear.

### How do you prevent double-clicks on destructive actions?

Every async action disables its button while the request is in flight (`disabled={saving}`, `checkingIds`, etc.). The delete confirmations go one step further with a `busy` prop on the modal that disables both buttons and shows a spinner — so double-clicking "Delete" can't fire two DELETE requests.

### How does the deleteAccount controller work?

```js
await LinkCheckHistory.deleteMany({ user: userId });
await Link.deleteMany({ user: userId });
await User.deleteOne({ _id: userId });
```
Three deletes, dependents first: history entries reference links, and links reference the user, so we remove history, then links, then the user. Everything is scoped by the authenticated user's id from the JWT — a user can only ever delete their own data.

### Why a separate history collection?

Unbounded growth: a link checked weekly for years would bloat a single document if history were an embedded array. A separate collection keeps link documents small and lets history be queried and paginated on its own.

---

## M. Improvement Questions (future work — NOT implemented)

- **Scheduled automatic checking**: a cron job that re-checks links weekly. Currently every check is manual.
- **Email notifications**: alert when a saved link breaks.
- **Browser extension**: one-click saving from the toolbar.
- **Bookmark import**: upload an HTML bookmark export.
- **Export**: download links as CSV/JSON.
- **Snapshots**: save Wayback Machine snapshots of important pages.
- **Dead-link recovery**: suggest the archived copy when a link dies.
- **Analytics**: per-category health trends over time.

These are deliberately *not* in v1 — the goal was a small, complete, polished product where every visible feature actually works.

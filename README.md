# LinkGraveyard

<p align="center">
  <strong>Web Resource Preservation & Health Monitoring Platform</strong>
</p>

<p align="center">
  Save, organize, search and monitor the health of your important web resources.
</p>

<p align="center">
  <a href="https://link-graveyard.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/srijan2312/LinkGraveyard">
    <img src="https://img.shields.io/badge/Source%20Code-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" />
  </a>
</p>

---

## 🌐 Live Demo

**https://link-graveyard.vercel.app/**

## 📦 Source Code

**https://github.com/srijan2312/LinkGraveyard**

---

# 📌 Overview

LinkGraveyard is a full-stack web application designed to help users preserve and monitor web resources they want to keep accessible over time.

Traditional browser bookmarks mainly store URLs. LinkGraveyard goes a step further by allowing users to monitor whether their saved URLs are still reachable.

A saved link can be:

- **Never Checked** — the URL has not been checked yet.
- **Healthy** — the resource responded successfully.
- **Redirected** — the original URL redirects somewhere else.
- **Broken** — the resource could not be reached or returned an unsuccessful response.

The application also stores the history of link checks so users can see how a resource's health has changed over time.

---

# 🎯 Problem

Important web resources can become unreliable over time.

A bookmarked URL may:

- Stop responding
- Return a 4xx or 5xx status
- Move to another URL
- Experience network or DNS failures
- Become inaccessible without the user realizing it

A traditional bookmark system does not provide visibility into these changes.

### LinkGraveyard addresses this by providing:

```text
Save URL
   ↓
Organize URL
   ↓
Check URL Health
   ↓
Classify Current Status
   ↓
Store Check History
   ↓
Monitor Changes Over Time
```

---

# ✨ Features

## 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Session restoration
- Logout
- Profile management
- Password change
- Account deletion

## 🔗 Link Management

- Add links
- Edit links
- Delete links
- View link details
- Store link descriptions
- Assign categories
- Add tags
- Search saved links
- Filter links by status
- Filter by category
- Sort links
- Bulk actions

## 🩺 Link Health Monitoring

Each saved URL can be checked manually.

The application identifies:

| Status | Meaning |
|---|---|
| 🟡 Never Checked | URL has not been checked yet |
| 🟢 Healthy | URL responded successfully |
| 🔵 Redirected | Original URL redirected to another location |
| 🔴 Broken | Request failed or returned an unsuccessful response |

The system records information such as:

- HTTP status code
- Response time
- Check timestamp
- Redirect target
- Error information

## 🔄 Redirect Detection

Redirects are treated separately from healthy responses.

For example:

```text
Original URL
     │
     ▼
https://example.com/old-page
     │
     │ 301 / 302
     ▼
https://example.com/new-page
```

The application records the redirect rather than simply following it and incorrectly marking the final destination as healthy.

## 📜 Check History

Every health check can create a historical record.

Example:

```text
Link
 │
 ├── Check #1 → Healthy
 ├── Check #2 → Healthy
 ├── Check #3 → Redirected
 └── Check #4 → Broken
```

This provides a simple timeline of resource health.

## 📊 Dashboard

The dashboard provides an overview of saved resources, including:

- Total links
- Healthy links
- Redirected links
- Broken links
- Never checked links

## 🗂️ Organization

Links can be organized using:

- Categories
- Tags
- Search
- Status filters

## ⚙️ Settings

Users can manage:

- Profile name
- Appearance/theme
- Password
- Account deletion

## 📱 Responsive Interface

The application is designed to work across:

- Desktop
- Tablet
- Mobile

---

# 🏗️ Architecture

LinkGraveyard follows a straightforward MERN-style client-server architecture.

```text
┌─────────────────────────────────────┐
│             React Client            │
│                                     │
│  React 18 · React Router · Axios    │
└──────────────────┬──────────────────┘
                   │
                   │ HTTP / REST API
                   ▼
┌─────────────────────────────────────┐
│          Node.js + Express          │
│                                     │
│  Authentication                     │
│  Link Management                    │
│  Health Checking                    │
│  Validation                         │
│  Authorization                      │
└──────────────────┬──────────────────┘
                   │
                   │ Mongoose
                   ▼
┌─────────────────────────────────────┐
│              MongoDB                │
│                                     │
│  Users                              │
│  Links                              │
│  Link Check History                 │
└─────────────────────────────────────┘
```

---

# 🧩 Application Flow

### Authentication

```text
User
 │
 ▼
Login / Register
 │
 ▼
Express API
 │
 ▼
Validate Credentials
 │
 ▼
JWT Token
 │
 ▼
React Client
 │
 ▼
Authenticated Requests
```

### Saving a Link

```text
User enters URL
       │
       ▼
Frontend validation
       │
       ▼
POST /api/links
       │
       ▼
JWT authentication
       │
       ▼
Validate request
       │
       ▼
Save Link in MongoDB
       │
       ▼
Return saved resource
```

### Checking Link Health

```text
User requests health check
          │
          ▼
Backend receives URL
          │
          ▼
Validate URL
          │
          ▼
Perform HTTP request
          │
          ├───────────────┐
          │               │
          ▼               ▼
       Success          Failure
          │               │
          ▼               ▼
    Analyze status     Store error
          │               │
          ├───────┬───────┤
          │       │       │
          ▼       ▼       ▼
       Healthy Redirected Broken
          │       │       │
          └───────┴───────┘
                  │
                  ▼
          Store Check History
```

---

# 🗄️ Data Model

The application uses three primary MongoDB collections.

## User

```text
User
├── name
├── email
├── password
└── timestamps
```

Passwords are hashed before being stored.

---

## Link

```text
Link
├── user
├── url
├── title
├── description
├── category
├── tags
├── status
├── statusCode
├── responseTime
├── finalUrl
├── lastCheckedAt
└── timestamps
```

Each link belongs to a specific user.

---

## LinkCheckHistory

```text
LinkCheckHistory
├── user
├── link
├── status
├── statusCode
├── responseTime
├── finalUrl
├── error
└── checkedAt
```

Keeping check history separately from the main link document allows the current status and historical checks to remain easy to manage.

---

# 🔐 Security

The application includes several security considerations.

## Authentication

JWT tokens are used to authenticate protected API requests.

```text
Login
  ↓
JWT issued
  ↓
Client stores token
  ↓
Authenticated API request
  ↓
JWT verification middleware
  ↓
Protected controller
```

## Password Security

Passwords are hashed using:

```text
bcryptjs
```

Plain-text passwords are not stored in the database.

## User Data Isolation

Links and check history are associated with the authenticated user.

A user should only be able to access or modify resources belonging to their account.

## URL Validation

Only supported web URLs should be accepted for link monitoring.

The application validates URLs before attempting health checks.

## SSRF Protection

Because the backend makes outbound HTTP requests to user-provided URLs, server-side request forgery is an important security consideration.

The health-check logic should restrict requests to safe HTTP/HTTPS destinations and avoid access to internal resources such as:

```text
localhost
127.0.0.1
private network addresses
link-local addresses
cloud metadata endpoints
```

Requests should also use reasonable timeouts and avoid downloading unnecessary response bodies.

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React 18 | User interface |
| JavaScript | Application logic |
| Vite | Development and build tooling |
| React Router | Client-side routing |
| Axios | API communication |
| Lucide React | UI icons |
| CSS | Application styling |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | REST API |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Axios | Server-side HTTP requests |
| dotenv | Environment configuration |
| CORS | Cross-origin configuration |

## Database

| Technology | Purpose |
|---|---|
| MongoDB | Persistent data storage |
| Mongoose | MongoDB ODM |

## Development

| Tool | Purpose |
|---|---|
| Git | Version control |
| GitHub | Repository hosting |
| Vercel | Frontend deployment |
| npm | Dependency management |

---

# 📁 Project Structure

```text
LinkGraveyard/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── scripts/
│   ├── tests/
│   ├── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# ⚙️ Getting Started

## Prerequisites

Install the following before running the project:

- Node.js
- npm
- MongoDB or a MongoDB Atlas database
- Git

---

## 1. Clone the Repository

```bash
git clone https://github.com/srijan2312/LinkGraveyard.git
```

## 2. Enter the Project

```bash
cd LinkGraveyard
```

## 3. Install Dependencies

### Client

```bash
cd client
npm install
```

### Server

Open another terminal:

```bash
cd server
npm install
```

---

# 🔧 Environment Variables

Create the environment configuration required by the backend.

Example:

```text
server/.env
```

Use the provided example file as a reference:

```text
.env.example
```

Typical backend configuration includes:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=http://localhost:5173
```

### Important

Never commit:

```text
.env
```

to GitHub.

The project includes `.gitignore` rules to keep environment secrets out of version control.

---

# ▶️ Running the Application

## Start the Backend

From:

```text
server/
```

run:

```bash
npm run dev
```

The backend will run on the configured API port.

---

## Start the Frontend

From:

```text
client/
```

run:

```bash
npm run dev
```

Vite will provide the local development URL.

Typically:

```text
http://localhost:5173
```

---

# 🧪 Testing

The backend includes automated tests for important API behaviour.

Run:

```bash
cd server
npm test
```

The test suite uses:

- Node.js test runner
- Supertest
- MongoDB Memory Server

This allows API behaviour to be tested without relying on the production database.

---

# 🔌 REST API

The application uses a REST-based client-server architecture.

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/password
DELETE /api/auth/account
```

## Links

The application provides endpoints for:

```text
GET
POST
PUT
DELETE
```

for managing authenticated users' links.

## Health Checking

The backend also provides functionality for:

```text
Check one link
Check multiple links
Store check result
Retrieve check history
```

Exact routes may evolve as the application develops.

---

# 📊 Link Status Model

LinkGraveyard intentionally keeps the status model simple.

```text
                  ┌────────────────┐
                  │  Never Checked │
                  └───────┬────────┘
                          │
                          ▼
                    Health Check
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
          Healthy     Redirected    Broken
```

### Healthy

The resource responds successfully without being classified as a redirect.

### Redirected

The original URL responds with a redirect such as:

```text
301
302
307
308
```

The redirect is recorded rather than silently treating the final destination as the original resource.

### Broken

Examples include:

- 4xx responses
- 5xx responses
- DNS failures
- Connection failures
- Request timeouts
- Other health-check failures

### Never Checked

The link has been saved but has not yet undergone a health check.

---

# 📈 Dashboard

The dashboard summarizes the current state of the user's saved resources.

Example:

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Total Links  │   Healthy    │  Redirected  │    Broken    │
├──────────────┼──────────────┼──────────────┼──────────────┤
│      42      │      30      │       7      │       5      │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

These values are derived from the current state of the user's saved links.

---

# 🎨 Design

The interface uses an archive-inspired visual direction rather than a generic SaaS dashboard.

### Design characteristics

- Dark charcoal / ink foundation
- Warm brass accents
- Editorial typography
- Subtle borders
- Restrained shadows
- Archive-inspired visual language
- Focused information hierarchy
- Responsive layouts

The application also supports a lighter paper-inspired appearance.

---

# 📱 Responsive Design

The interface adapts to different screen sizes.

```text
Desktop
   ↓
Tablet
   ↓
Mobile
```

Responsive considerations include:

- Navigation
- Forms
- Link tables/cards
- Dashboard statistics
- Modals
- Settings
- Search and filtering
- Link detail pages

---

# 🚢 Deployment

The frontend is deployed using Vercel.

### Production

**https://link-graveyard.vercel.app/**

### GitHub

**https://github.com/srijan2312/LinkGraveyard**

For production deployment, environment variables should be configured through the hosting platform rather than committing secrets to the repository.

---

# 🔄 Development Workflow

The project follows a simple development workflow:

```text
Feature / Fix
     │
     ▼
Local Development
     │
     ▼
Run Tests
     │
     ▼
Production Build
     │
     ▼
Git Commit
     │
     ▼
GitHub
     │
     ▼
Deployment
```

Example:

```bash
git add .
git commit -m "update link monitoring"
git push origin main
```

---

# 📌 Design Decisions

## Why MERN?

The application is primarily a JavaScript-based full-stack project.

Using React, Node.js, Express and MongoDB keeps the technology stack consistent across the application and makes the project straightforward to maintain.

## Why Separate Check History?

The current link status and historical checks serve different purposes.

The `Link` document represents the current state, while `LinkCheckHistory` records individual health-check events.

This keeps historical information separate and makes the data model easier to reason about.

## Why Check Links on the Backend?

URL health checks require server-side HTTP requests.

Keeping this logic on the backend avoids relying on browser-side cross-origin restrictions and provides a controlled place to apply validation, timeouts and SSRF protection.

## Why Track Redirects Separately?

A URL returning a redirect is not necessarily broken, but it is also not equivalent to the original URL responding directly.

Keeping `Redirected` as a separate state provides more accurate information about the resource.

---

# 🔮 Future Improvements

Possible future improvements include:

- Scheduled automatic link checks
- Email notifications for broken resources
- More detailed health analytics
- Link availability trends
- Advanced category management
- Import/export functionality
- Improved bulk operations
- More granular health-check policies
- Custom monitoring intervals

These features are intentionally outside the current core implementation to keep the application simple and maintainable.

---

# 📫 Connect

**LinkedIn**

https://www.linkedin.com/in/srijan-kumar-2b41b124a

**GitHub**

https://github.com/srijan2312

**Portfolio**

https://srijan-kumar-portfolio-alpha.vercel.app

---

# 📄 License

This project is maintained as a personal portfolio project by **Srijan Kumar**.

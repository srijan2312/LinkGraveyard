# LinkGraveyard

<p align="center">
  <strong>Web Resource Preservation & Health Monitoring Platform</strong>
</p>

<p align="center">
  Save, organize, and monitor the web resources you don't want to lose.
</p>

<p align="center">
  <a href="https://link-graveyard.vercel.app/">
    <img src="https://img.shields.io/badge/Live%20Demo-LinkGraveyard-111111?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://github.com/srijan2312/LinkGraveyard">
    <img src="https://img.shields.io/badge/Source%20Code-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
</p>

---

## 🌐 Live Demo

**https://link-graveyard.vercel.app/**

## 📦 Repository

**https://github.com/srijan2312/LinkGraveyard**

---

# 📖 Overview

**LinkGraveyard** is a full-stack web application that helps users save, organize, and monitor important web resources.

A normal bookmark manager stores a URL and leaves it there. LinkGraveyard adds a health-monitoring layer so users can determine whether their saved resources are still available, have moved, or have become inaccessible.

The application keeps the **original URL intact** and records information about subsequent checks separately.

The core idea is simple:

```text
Save the web resource
        ↓
Organize it
        ↓
Check its health
        ↓
Detect changes
        ↓
Keep a history
```

---

# 🎯 The Problem

Useful web resources disappear or change over time.

A tutorial that works today might later:

- Move to a different URL
- Start redirecting
- Return a 404
- Become unavailable
- Experience temporary network problems
- Be abandoned or removed

Traditional browser bookmarks do not tell you when this happens.

LinkGraveyard provides a focused way to keep important resources organized while giving visibility into their current health.

---

# ✨ Features

## 📑 Table of Contents

- [📖 Overview](#-overview)
- [🎯 The Problem](#-the-problem)
- [✨ Features](#-features)
  - [🔐 Authentication](#-authentication)
  - [🔗 Link Management](#-link-management)
  - [🩺 Link Health Monitoring](#-link-health-monitoring)
  - [🔄 Redirect Detection](#-redirect-detection)
  - [📜 Link Check History](#-link-check-history)
  - [📊 Dashboard](#-dashboard)
  - [🗂️ Organization](#-organization)
  - [🔎 Search & Filtering](#-search--filtering)
  - [⚙️ Settings](#-settings)
  - [📱 Responsive UI](#-responsive-ui)
- [🏗️ System Architecture](#️-system-architecture)
- [🔄 How It Works](#-how-it-works)
- [🗄️ Data Model](#️-data-model)
- [🔐 Security](#-security)
- [🛠️ Technology Stack](#️-technology-stack)
- [📁 Project Structure](#-project-structure)
- [⚙️ Getting Started](#️-getting-started)
- [🔧 Environment Variables](#-environment-variables)
- [▶️ Running Locally](#️-running-locally)
- [🧪 Testing](#-testing)
- [🔌 REST API](#-rest-api)
- [📊 Link Health Model](#-link-health-model)
- [📜 History Model](#-history-model)
- [🎨 Design Direction](#-design-direction)
- [🧠 Design Principles](#-design-principles)
- [🚢 Deployment](#-deployment)
- [🔄 Development Workflow](#-development-workflow)
- [🔮 Future Improvements](#-future-improvements)
- [🔗 Project Links](#-project-links)
- [📄 License](#-license)

## 🔐 Authentication

- User registration
- User login
- JWT authentication
- Password hashing with bcrypt
- Protected routes
- Session restoration
- Logout
- Profile name updates
- Password changes
- Account deletion

## 🔗 Link Management

- Add saved URLs
- Edit existing links
- Delete links
- View link details
- Add titles
- Add notes/descriptions
- Assign categories
- Add tags
- Search links
- Filter links
- Sort and organize saved resources
- Bulk link actions

## 🩺 Link Health Monitoring

Users can manually check the health of saved resources.

The application distinguishes between different states:

| Status | Meaning |
|---|---|
| 🟢 **Healthy** | The resource responded successfully |
| 🔵 **Redirected** | The original URL redirects somewhere else |
| 🔴 **Broken** | The resource returned a confirmed unsuccessful response |
| 🟡 **Never Checked** | The resource has not been checked yet |
| ⚪ **Unknown** | The check could not reliably determine the resource's state |

This keeps temporary failures from automatically being treated as permanent broken links.

## 🔄 Redirect Detection

Redirects are tracked separately from successful direct responses.

Example:

```text
Original URL
    │
    ▼
https://example.com/old-page
    │
    │ 301 / 302 / 307 / 308
    ▼
https://example.com/new-page
```

The original URL remains preserved while the destination can be recorded separately.

## 📜 Link Check History

Each health check can be stored as a historical record.

Example:

```text
React Documentation

June 10
    Healthy

July 21
    Healthy

August 14
    Redirected

September 02
    Healthy
```

This makes it possible to understand how a saved resource has changed over time.

## 📊 Dashboard

The dashboard provides an overview of the user's saved resources.

It includes information such as:

- Total links
- Healthy links
- Redirected links
- Broken links
- Never-checked links

## 🗂️ Organization

Saved resources can be organized using:

- Categories
- Tags
- Search
- Status filters

## 🔎 Search & Filtering

Users can search through their saved resources and narrow results using relevant filters.

Search can be used across information such as:

- Titles
- URLs
- Tags
- Notes

## ⚙️ Settings

The settings area provides:

- Profile management
- Appearance/theme selection
- Password management
- Account deletion

## 📱 Responsive UI

The interface is designed for:

- Desktop
- Tablet
- Mobile

---

# 🏗️ System Architecture

LinkGraveyard uses a straightforward MERN-style client-server architecture.

```text
┌───────────────────────────────────────────┐
│                React Client               │
│                                           │
│ React 18 · Vite · React Router · Axios    │
└─────────────────────┬─────────────────────┘
                      │
                      │ HTTP / REST API
                      │ JWT Authorization
                      ▼
┌───────────────────────────────────────────┐
│            Node.js + Express              │
│                                           │
│ Authentication                            │
│ Authorization                             │
│ Link Management                           │
│ Health Checking                           │
│ Validation                                │
└─────────────────────┬─────────────────────┘
                      │
                      │ Mongoose
                      ▼
┌───────────────────────────────────────────┐
│                  MongoDB                  │
│                                           │
│ Users                                     │
│ Links                                     │
│ Link Check History                        │
└───────────────────────────────────────────┘
```

---

# 🔄 How It Works

## 1. Save a Resource

A user adds a URL along with optional information such as:

```text
URL
Title
Description
Category
Tags
```

The frontend sends the request to the Express API.

```text
React
  │
  ▼
POST /api/links
  │
  ▼
Authentication
  │
  ▼
Validation
  │
  ▼
MongoDB
```

---

## 2. Check the Resource

When a user requests a health check:

```text
User
 │
 ▼
Check Link
 │
 ▼
Backend receives URL
 │
 ▼
Validate destination
 │
 ▼
Perform HTTP request
 │
 ├──────────────┬───────────────┐
 ▼              ▼               ▼
Success       Redirect        Failure
 │              │               │
 ▼              ▼               ▼
Healthy      Redirected      Analyze error
                               │
                         ┌─────┴─────┐
                         ▼           ▼
                      Broken      Unknown
```

---

## 3. Store the Result

The current state is updated on the link.

A separate history record can also be created containing information such as:

```text
Status
HTTP status code
Response time
Final URL
Error information
Checked timestamp
```

---

# 🗄️ Data Model

The application uses three main MongoDB models.

## User

```text
User
├── name
├── email
├── password
└── timestamps
```

Passwords are hashed before persistence.

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

Each link is associated with the user who created it.

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

Keeping historical checks separate from the main link document keeps the current state and historical events logically distinct.

---

# 🔐 Security

Security is considered at both the authentication and URL-monitoring layers.

## JWT Authentication

Protected requests use JWT authentication.

```text
Login
  ↓
JWT generated
  ↓
Client stores token
  ↓
Bearer token sent with API request
  ↓
Authentication middleware
  ↓
Protected controller
```

## Password Protection

Passwords are hashed using:

```text
bcryptjs
```

Plain-text passwords are not intentionally stored.

## User Data Isolation

Every saved link is associated with its owning user.

Protected operations verify the authenticated user before accessing or modifying resources.

This prevents one account from accessing another user's saved links.

## URL Validation

User-provided URLs are validated before being used for health checks.

Only supported HTTP/HTTPS URLs should be accepted.

## SSRF Considerations

Because LinkGraveyard makes server-side requests to user-provided URLs, the backend must treat URL health checking as a security-sensitive operation.

The health-check implementation considers protection against destinations such as:

```text
localhost
127.0.0.1
private network ranges
link-local addresses
cloud metadata endpoints
```

It should also use reasonable request timeouts and avoid unnecessarily downloading large response bodies.

---

# 🛠️ Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React 18 | UI development |
| JavaScript | Application logic |
| Vite | Frontend build tooling |
| React Router | Client-side routing |
| Axios | HTTP/API communication |
| Lucide React | Interface icons |
| CSS | Application styling |

## Backend

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Axios | Server-side HTTP requests |
| dotenv | Environment configuration |
| CORS | Cross-origin requests |

## Database

| Technology | Purpose |
|---|---|
| MongoDB | Persistent database |
| Mongoose | MongoDB ODM |

## Testing

| Technology | Purpose |
|---|---|
| Node.js Test Runner | Backend tests |
| Supertest | HTTP/API testing |
| MongoDB Memory Server | Isolated database testing |

## Deployment & Development

| Technology | Purpose |
|---|---|
| Git | Version control |
| GitHub | Source repository |
| Vercel | Frontend deployment |
| npm | Dependency management |

---

# 📁 Project Structure

```text
LinkGraveyard/
│
├── client/
│   ├── public/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── CategorySelect.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Favicon.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── LinkEditModal.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── PasswordField.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── ThemeToggle.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useCheckAll.js
│   │   │   ├── useLinks.js
│   │   │   └── useTheme.js
│   │   │
│   │   ├── pages/
│   │   │   ├── AddLink.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── LinkDetail.jsx
│   │   │   ├── LinkHistory.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyLinks.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── utils/
│   │   │   └── format.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   └── linkController.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   │
│   ├── models/
│   │   ├── Link.js
│   │   ├── LinkCheckHistory.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── linkRoutes.js
│   │
│   ├── scripts/
│   │   └── seed.js
│   │
│   ├── tests/
│   │   └── api.test.js
│   │
│   ├── utils/
│   │   ├── checkUrl.js
│   │   └── validateUrl.js
│   │
│   ├── package.json
│   └── server.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

# ⚙️ Getting Started

## Prerequisites

Install:

- Node.js
- npm
- Git
- MongoDB or MongoDB Atlas

---

## 1. Clone the Repository

```bash
git clone https://github.com/srijan2312/LinkGraveyard.git
```

```bash
cd LinkGraveyard
```

---

## 2. Install Frontend Dependencies

```bash
cd client
npm install
```

---

## 3. Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

---

# 🔧 Environment Variables

The backend requires environment configuration.

Create:

```text
server/.env
```

Use `.env.example` as the reference.

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=http://localhost:5173
```

### Never commit real secrets

The following should remain local:

```text
server/.env
```

The repository's `.gitignore` is configured to ignore environment files.

---

# ▶️ Running Locally

## Start the Backend

From:

```text
server/
```

run:

```bash
npm run dev
```

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

The Vite development server will normally be available at:

```text
http://localhost:5173
```

---

# 🧪 Testing

The backend contains API tests using an isolated MongoDB environment.

Run:

```bash
cd server
npm test
```

The test setup covers important application behaviour such as:

- Authentication
- Link creation
- Link access
- User ownership
- API responses
- Link operations

---

# 🔌 REST API

The application uses a REST API between the React client and Express server.

## Authentication

```http
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/password
DELETE /api/auth/account
```

## Links

The link API supports operations for:

```text
Create links
Read links
Update links
Delete links
Check link health
Check multiple links
Retrieve link history
```

The exact routes are maintained in:

```text
server/routes/
```

---

# 📊 Link Health Model

The application keeps link states intentionally understandable.

```text
                    ┌─────────────────┐
                    │  Never Checked  │
                    └────────┬────────┘
                             │
                             ▼
                        Health Check
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
          Successful      Redirect       Failure
              │              │              │
              ▼              ▼              ▼
           Healthy       Redirected     Analyze
                                             │
                                      ┌──────┴──────┐
                                      ▼             ▼
                                   Broken        Unknown
```

### Healthy

The URL responds successfully without being classified as a redirect.

### Redirected

The original URL responds with a redirect and a different destination is detected.

### Broken

The application receives a confirmed response indicating the resource is unavailable, such as a 404.

### Unknown

The application cannot reliably determine the state, for example because of a timeout or temporary server/network problem.

### Never Checked

The resource has not yet been checked.

---

# 📜 History Model

The history system records individual checks rather than overwriting previous information.

Example:

```text
Link
 │
 ├── 2026-06-10 → Healthy
 ├── 2026-07-02 → Healthy
 ├── 2026-08-19 → Redirected
 └── 2026-09-01 → Broken
```

This allows the application to preserve the history of a resource instead of only showing its latest state.

---

# 🎨 Design Direction

LinkGraveyard intentionally uses an **archive-inspired interface** rather than a generic modern SaaS aesthetic.

The design uses:

- Dark charcoal/ink surfaces
- Warm brass accents
- Editorial typography
- Structured layouts
- Restrained borders and shadows
- Archive/catalog visual language
- Clear status indicators

The light theme follows a warmer paper/archive direction rather than simply inverting the dark theme.

---

# 🧠 Design Principles

The application follows a few simple principles:

### Keep the core workflow simple

```text
Save → Organize → Check → Review
```

### Preserve original information

The original URL should not be silently replaced when a redirect is discovered.

### Separate current state from history

The `Link` model represents the current state.

`LinkCheckHistory` represents individual check events.

### Keep user data isolated

Every resource belongs to an authenticated user.

### Avoid unnecessary complexity

The project intentionally uses:

- React
- Express
- MongoDB
- REST APIs
- JWT

without introducing unnecessary microservices, queues, GraphQL layers, or other infrastructure.

---

# 🚢 Deployment

The production frontend is deployed using Vercel.

## Production URL

**https://link-graveyard.vercel.app/**

## GitHub Repository

**https://github.com/srijan2312/LinkGraveyard**

For deployment, production environment variables should be configured through the hosting platform rather than committed to the repository.

---

# 🔄 Development Workflow

```text
Development
     │
     ▼
Implement Feature
     │
     ▼
Run Tests
     │
     ▼
Run Production Build
     │
     ▼
Git Commit
     │
     ▼
Git Push
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

# 🔮 Future Improvements

Possible future extensions include:

- Scheduled automatic health checks
- Email notifications
- Link availability analytics
- Historical health charts
- Import/export
- More advanced bulk operations
- Configurable checking intervals
- Additional monitoring rules

These are intentionally kept outside the current core implementation so the project remains focused and maintainable.

---

# 🔗 Project Links

| Resource | Link |
|---|---|
| 🌐 Live Demo | https://link-graveyard.vercel.app/ |
| 💻 GitHub | https://github.com/srijan2312/LinkGraveyard |
| 👤 LinkedIn | https://www.linkedin.com/in/srijan-kumar-2b41b124a |
| 🌐 Portfolio | https://srijan-kumar-portfolio-alpha.vercel.app |

---

# 📄 License

LinkGraveyard is maintained as a personal open-source portfolio project by **Srijan Kumar**.

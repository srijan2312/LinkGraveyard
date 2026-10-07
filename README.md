# LinkGraveyard

> A web-resource preservation and health monitoring platform for saving, organizing, and monitoring important URLs.

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens)](https://jwt.io/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

---

## Overview

LinkGraveyard is a full-stack web application for saving web resources and keeping track of whether those resources are still accessible.

Instead of simply bookmarking URLs, LinkGraveyard checks their availability and classifies them into useful states:

- 🟢 Healthy
- 🟡 Redirected
- 🔴 Broken
- ⚪ Never Checked

The application also maintains a history of link checks so users can understand how a saved resource has changed over time.

---

## Problem

Normal browser bookmarks only store URLs.

They do not tell you:

- Whether a website still exists
- Whether a page has moved
- Whether a saved URL returns an error
- Whether a resource redirects somewhere else
- When the URL was last checked
- Whether a saved resource has repeatedly failed

For users who collect documentation, tutorials, research material, references, and useful web resources, bookmarks can gradually become unreliable.

---

## Solution

LinkGraveyard adds a lightweight monitoring layer on top of saved URLs.

Users can:

1. Save important URLs.
2. Organize them using categories and tags.
3. Search and filter saved resources.
4. Manually check individual links.
5. Check multiple links.
6. Detect redirects.
7. Identify broken resources.
8. View previous check results.
9. Monitor overall link health from the dashboard.

---

# Features

## 🔐 Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- User-specific data isolation
- Profile management
- Password change
- Account deletion

## 🔗 Link Management

- Add URLs
- Edit saved URLs
- Delete URLs
- View link details
- Store title and description
- Assign categories
- Add tags
- Track creation and update dates

## 📂 Organization

- Categories
- Tags
- Search
- Filtering
- Sorting
- Dedicated category views

## ❤️ Link Health Monitoring

Each saved URL can have one of four states:

| Status | Meaning |
|---|---|
| 🟢 Healthy | The URL was successfully reached |
| 🟡 Redirected | The URL redirects to another location |
| 🔴 Broken | The URL could not be successfully reached |
| ⚪ Never Checked | The URL has not been checked yet |

The application records:

- HTTP status code
- Response time
- Check timestamp
- Redirect destination
- Error information

## 📊 Dashboard

The dashboard provides an overview of:

- Total saved links
- Healthy links
- Redirected links
- Broken links
- Never-checked links
- Recent activity

## 🕒 Check History

Every link check can create a history record.

This allows users to see how a resource behaved over time instead of only seeing its current state.

## 📱 Responsive UI

The application is designed for:

- Desktop
- Tablet
- Mobile

It includes loading, empty, error, and confirmation states where appropriate.

---

# Architecture

```text
                    ┌─────────────────────┐
                    │       Browser       │
                    │                     │
                    │   React + Vite      │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │    Node.js +        │
                    │      Express        │
                    │                     │
                    │ Authentication      │
                    │ Link Management     │
                    │ Health Checking     │
                    └──────────┬──────────┘
                               │
                               │ Mongoose
                               ▼
                    ┌─────────────────────┐
                    │      MongoDB        │
                    │                     │
                    │ Users               │
                    │ Links               │
                    │ Check History       │
                    └─────────────────────┘
```

---

# Application Flow

## Registration

```text
User
  ↓
Register
  ↓
Validate Input
  ↓
Hash Password
  ↓
Create User
  ↓
Generate JWT
  ↓
Dashboard
```

## Login

```text
User
  ↓
Login
  ↓
Find Account
  ↓
Verify Password
  ↓
Generate JWT
  ↓
Dashboard
```

## Link Health Check

```text
Saved URL
    ↓
Backend Health Checker
    ↓
HTTP Request
    ↓
┌───────────────────────────────┐
│                               │
│  Successful → Healthy         │
│  Redirect   → Redirected      │
│  Error      → Broken          │
│  Not Checked → Never Checked  │
│                               │
└───────────────────────────────┘
    ↓
Save Result
    ↓
Update Link
    ↓
Create History Record
```

---

# Health Status Model

LinkGraveyard intentionally distinguishes between a redirect and a healthy direct response.

For example:

```text
Original URL
    │
    └── 301 / 302
            │
            ▼
       Another URL
```

This is classified as:

```text
REDIRECTED
```

rather than simply following the redirect and marking the original URL as healthy.

This preserves useful information about the original resource.

---

# Security

## Authentication

- Passwords are hashed with bcrypt.
- Authentication uses signed JWT tokens.
- Protected API routes require authentication.
- Users can only access their own resources.

## URL Checking

Because the backend makes outbound HTTP requests, URL validation and request restrictions are important.

The health-checking system is designed to:

- Accept only HTTP/HTTPS URLs.
- Apply request timeouts.
- Avoid unnecessary response-body downloads.
- Limit redirect handling.
- Prevent access to localhost/private/internal network targets.
- Handle network failures safely.

These protections reduce the risk of the backend being abused as an unrestricted internal network requester.

---

# Database Design

The application uses MongoDB with Mongoose.

## User

```text
User
├── name
├── email
├── password
└── timestamps
```

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
├── lastCheckedAt
├── redirectUrl
└── timestamps
```

## LinkCheckHistory

```text
LinkCheckHistory
├── user
├── link
├── status
├── statusCode
├── responseTime
├── redirectUrl
├── errorMessage
└── checkedAt
```

---

# REST API

The backend follows a REST-style API structure.

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

```text
GET    /api/links
POST   /api/links
GET    /api/links/:id
PUT    /api/links/:id
DELETE /api/links/:id
```

## Link Checking

The backend provides operations for checking saved URLs and recording their results.

The exact routes are maintained inside the Express route/controller implementation.

---

# Tech Stack

## Frontend

- React 18
- JavaScript ES6+
- Vite
- React Router
- Axios
- Lucide React
- CSS

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Axios
- dotenv
- CORS

## Deployment

- GitHub
- MongoDB Atlas
- Render
- Vercel

---

# Project Structure

```text
LinkGraveyard/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── scripts/
│   ├── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

# Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/srijan2312/LinkGraveyard.git
cd LinkGraveyard
```

## 2. Install dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd ../server
npm install
```

## 3. Configure environment variables

Create:

```text
server/.env
```

Example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Never commit the actual `.env` file.

## 4. Start the backend

From the `server` directory:

```bash
npm run dev
```

## 5. Start the frontend

Open another terminal:

```bash
cd client
npm run dev
```

Vite will provide the local development URL.

---

# Testing

The backend includes automated tests.

From the `server` directory:

```bash
npm test
```

---

# Design

LinkGraveyard uses an archive-inspired visual direction rather than a generic modern SaaS dashboard.

## Dark Theme

- Charcoal / ink background
- Warm brass accents
- Subtle borders
- Restrained shadows
- Minimal glow
- Archive / terminal-inspired visual language

## Light Theme

- Warm paper background
- Dark ink typography
- Brass and muted accent colors
- Editorial/archive-inspired styling

The two themes are intentionally different while maintaining the same application structure.

---

# Engineering Decisions

## MERN Architecture

A straightforward MERN architecture keeps the project easy to develop, deploy, and maintain.

## REST API

REST keeps communication between the React client and Express backend simple and predictable.

## MongoDB

MongoDB fits the application's document-oriented data model and works naturally with Mongoose.

## Separate Check History

Current link status and historical check records are stored separately.

This allows the application to show the current state while preserving previous results.

## Backend Health Checking

URL checks happen on the server rather than directly in the browser.

This avoids browser CORS limitations and centralizes health-checking logic.

## Explicit Link States

The application uses explicit states instead of reducing every successful request to simply "working".

This allows redirects and unchecked resources to remain distinguishable.

---

# Current Scope

The project intentionally focuses on a small and understandable feature set:

- Authentication
- Link management
- Categories
- Tags
- Search and filtering
- Link health checking
- Redirect detection
- Check history
- Dashboard statistics
- Profile and security settings
- Responsive UI

The architecture avoids unnecessary microservices, queues, complex infrastructure, or other systems that are not required for the application's current scope.

---

# Deployment Architecture

```text
                 Vercel
                   │
                   ▼
          React / Vite Frontend
                   │
                   │ HTTPS API
                   ▼
                 Render
                   │
                   ▼
           Node / Express API
                   │
                   │ Mongoose
                   ▼
             MongoDB Atlas
```

---

# Screenshots

Add screenshots of the main application here.

Recommended screenshots:

```text
screenshots/
├── landing.png
├── dashboard.png
├── links.png
├── link-detail.png
├── history.png
└── settings.png
```

---

# Project Links

## GitHub

https://github.com/srijan2312/LinkGraveyard

## Live Demo

Replace this with the final deployed frontend URL:

`YOUR_LINKGRAVEYARD_LIVE_URL`

---

# Author

**Srijan Kumar**

Full-Stack Software Engineer

- GitHub: https://github.com/srijan2312
- LinkedIn: YOUR_LINKEDIN_URL
- Portfolio: YOUR_PORTFOLIO_URL

---

# License

This project is intended for educational and portfolio purposes.

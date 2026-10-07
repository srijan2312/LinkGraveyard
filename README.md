# LinkGraveyard

> A personal web-resource archive that helps you save, organize, and monitor the health of important web links before they disappear.

## 🌐 Live Project

- **Live Website:** https://link-graveyard.vercel.app
- **GitHub Repository:** https://github.com/srijan2312/LinkGraveyard
- **Backend API:** https://linkgraveyard.onrender.com

---

## 📌 Overview

LinkGraveyard is a full-stack MERN application for saving web resources and monitoring whether those resources are still reachable.

Instead of saving links and forgetting about them, users can:

- Save important URLs
- Organize links using categories and tags
- Check whether a URL is healthy, redirected, broken, or never checked
- View link-check history
- Search and filter saved resources
- Manually check saved links
- Manage their profile and account settings

The project is intentionally built with a simple and explainable architecture suitable for understanding and demonstrating full-stack development fundamentals.

---

## ✨ Features

### 🔐 Authentication

- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Persistent login sessions
- Logout
- Profile name update
- Password change
- Account deletion

### 🔗 Link Management

- Add links
- Edit links
- Delete links
- View link details
- Add descriptions
- Organize links using categories
- Add tags
- Search and filter saved links

### ❤️ Link Health Monitoring

Each saved link can have one of four states:

| Status | Meaning |
|---|---|
| Never Checked | The link has not been checked yet |
| Healthy | The URL responded successfully |
| Redirected | The original URL redirects somewhere else |
| Broken | The request failed or returned an unsuccessful HTTP response |

Each check can record:

- HTTP status code
- Response time
- Check timestamp
- Redirect information
- Error information

### 📜 Check History

Link-check results are recorded so users can review previous health checks for their saved resources.

### 📊 Dashboard

The dashboard provides an overview of:

- Total links
- Healthy links
- Redirected links
- Broken links
- Never-checked links

### 🎨 User Experience

- Dark archive-inspired interface
- Light theme
- Responsive design
- Loading states
- Empty states
- Error states
- Confirmation dialogs
- Keyboard-friendly controls
- Mobile-friendly pages

---

## 🛠️ Tech Stack

### Frontend

- React 18
- JavaScript ES6+
- Vite
- React Router
- Axios
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Axios
- CORS
- dotenv

### Deployment

- Vercel — Frontend
- Render — Backend
- MongoDB Atlas — Database

---

## 🏗️ Architecture

The application uses a simple three-part architecture:

    ┌─────────────────────────────┐
    │           Vercel            │
    │       React + Vite          │
    │          Frontend           │
    └──────────────┬──────────────┘
                   │
                   │ HTTPS / REST API
                   ▼
    ┌─────────────────────────────┐
    │           Render            │
    │      Node.js + Express      │
    │          Backend            │
    └──────────────┬──────────────┘
                   │
                   │ Mongoose
                   ▼
    ┌─────────────────────────────┐
    │       MongoDB Atlas         │
    │          Database           │
    └─────────────────────────────┘

The frontend communicates with the backend through REST APIs.

The backend handles:

- Authentication
- Authorization
- Link management
- Link health checks
- Check history

MongoDB stores users, links, and link-check history.

---

## 📁 Project Structure

    LinkGraveyard/
    │
    ├── client/
    │   ├── public/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── context/
    │   │   ├── pages/
    │   │   ├── services/
    │   │   ├── App.jsx
    │   │   └── main.jsx
    │   ├── package.json
    │   ├── vite.config.js
    │   └── vercel.json
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
    ├── INTERVIEW_QA.md
    ├── package.json
    └── README.md

---

## 🗄️ Database Design

The application uses MongoDB with Mongoose models.

### User

Stores:

- Name
- Email
- Password hash
- Timestamps

Passwords are never stored as plain text.

### Link

Stores:

- User ownership
- URL
- Title/name
- Description
- Category
- Tags
- Current health status
- Last checked information
- Redirect information
- Timestamps

### LinkCheckHistory

Stores historical results for link health checks.

This allows users to review how the health of a saved resource changes over time.

---

## 🔐 Authentication Flow

LinkGraveyard uses JWT authentication.

    User registers or logs in
             ↓
    Backend validates credentials
             ↓
    Backend creates JWT
             ↓
    Frontend stores token
             ↓
    Axios sends token with protected requests
             ↓
    Backend middleware verifies token
             ↓
    User-specific data is returned

Protected resources also use ownership checks so users cannot access another user's links.

---

## 🔎 Link Health Checking

The backend performs server-side HTTP checks.

The application distinguishes between a redirect and a healthy final destination.

    Original URL
         │
         ▼
    HTTP request
         │
         ├── 2xx ───────────────► Healthy
         │
         ├── 3xx ───────────────► Redirected
         │
         └── 4xx/5xx/network ───► Broken

The result is stored so users can review previous checks.

---

## 🛡️ Security Considerations

Because the backend makes HTTP requests to user-provided URLs, URL checking is treated as a security-sensitive operation.

The project uses or is designed around protections such as:

- HTTP/HTTPS URL validation
- Request timeouts
- Redirect handling
- Avoiding unnecessary response-body downloads
- Protection against local/private infrastructure where applicable
- Authentication middleware
- User ownership checks
- Password hashing
- Environment variables for secrets
- CORS configuration
- `.env` excluded from Git

Production secrets such as the MongoDB connection string and JWT secret are stored in deployment environment variables rather than committed to GitHub.

---

## ⚙️ Local Development

### Prerequisites

Install:

- Node.js
- npm
- MongoDB or MongoDB Atlas
- Git

### Clone the repository

    git clone https://github.com/srijan2312/LinkGraveyard.git
    cd LinkGraveyard

### Configure the backend

    cd server
    npm install

Create a `.env` file inside `server/`.

Example:

    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    FRONTEND_URL=http://localhost:5173

Do not commit the `.env` file.

### Start the backend

    npm run dev

### Install frontend dependencies

Open another terminal:

    cd client
    npm install

### Start the frontend

    npm run dev

The frontend will normally run on the Vite development server.

---

## 🔑 Environment Variables

### Backend

    MONGODB_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    FRONTEND_URL=your_frontend_url

### Frontend

For production:

    VITE_API_URL=your_backend_api_url

The production frontend uses the deployed Render API.

---

## 🚀 Production Deployment

The project is deployed using separate frontend and backend services.

### Frontend — Vercel

The React/Vite application is deployed on Vercel.

The Vercel project uses the `client` directory as its root directory.

The project includes:

    client/vercel.json

This configuration rewrites application routes to `index.html`, allowing React Router pages such as `/dashboard`, `/links`, `/add`, and `/settings` to work correctly after a browser refresh.

### Backend — Render

The Node.js/Express application is deployed on Render.

The Render service uses the `server` directory as its root directory.

### Database — MongoDB Atlas

MongoDB Atlas is used as the production database.

Production credentials are configured through Render environment variables.

---

## 🧪 Testing

The backend includes automated test support using:

- Node.js test runner
- Supertest
- MongoDB Memory Server

Run backend tests with:

    cd server
    npm test

---

## 🔌 API Overview

The backend exposes REST endpoints for authentication and link management.

### Authentication

    POST   /api/auth/register
    POST   /api/auth/login
    GET    /api/auth/me
    PUT    /api/auth/profile
    PUT    /api/auth/password
    DELETE /api/auth/account

### Links

Link endpoints support operations such as:

- Create a link
- Read links
- Read one link
- Update a link
- Delete a link
- Check link health
- Check multiple links
- Read link history

The exact endpoint implementation is available in the backend route files.

---

## 🎯 Why I Built This

Traditional bookmarks are useful for storing URLs, but they provide little visibility into whether those resources are still available.

LinkGraveyard was built around a practical problem:

> What happens to the important links we save today when those pages move, redirect, or disappear later?

The project combines:

- CRUD operations
- Authentication
- REST APIs
- MongoDB
- Server-side HTTP requests
- Link status classification
- History tracking
- Production deployment

into one practical full-stack application.

---

## 💡 Key Technical Decisions

### Why React?

React provides a component-based approach for building the dashboard, forms, navigation, and reusable UI components.

### Why Express?

Express keeps the backend lightweight and makes it straightforward to organize REST API routes and middleware.

### Why MongoDB?

The application stores documents containing categories, tags, status information, and historical checks, making MongoDB a suitable choice.

### Why JWT?

JWT provides a straightforward authentication mechanism between the frontend and backend.

### Why server-side link checking?

Checking URLs from the backend allows the application to consistently record:

- HTTP status
- Redirects
- Response timing
- Network failures

without depending on browser restrictions.

### Why Vercel + Render?

The frontend and backend have different deployment requirements.

Vercel provides a convenient deployment environment for the Vite frontend, while Render provides a straightforward deployment environment for the Node/Express API.

---

## 📸 Screenshots

Recommended screenshots:

- Landing page
- Login/Register
- Dashboard
- My Links
- Add Link
- Link Details
- Link History
- Settings
- Mobile responsive view

Screenshots can be added to a `screenshots/` directory and referenced here.

---

## 📚 Interview Preparation

The repository includes:

    INTERVIEW_QA.md

It covers questions such as:

- Explain the project.
- Why did you choose the MERN stack?
- How does JWT authentication work?
- How are passwords secured?
- How does link health checking work?
- How do you detect redirects?
- How does the frontend communicate with the backend?
- How is user data isolated?
- Why is MongoDB used?
- How is the application deployed?
- What security concerns exist when a server checks user-provided URLs?
- What would you improve in a future version?

The goal is to make the project understandable enough to explain during a technical interview rather than relying on unexplained abstractions.

---

## 📈 Future Improvements

Possible future improvements include:

- Scheduled automatic link checks
- Email notifications for broken resources
- Better analytics and health trends
- Import/export of saved links
- Browser extension
- Advanced search
- More detailed link-change detection
- Custom domains
- More comprehensive automated tests

These are intentionally outside the current core scope so the application remains relatively simple and explainable.

---

## 📌 Current Scope

LinkGraveyard intentionally avoids unnecessary infrastructure such as:

- Microservices
- Kubernetes
- GraphQL
- Redis
- Message queues
- Complex event-driven architecture
- AI-dependent functionality

The goal is to demonstrate practical full-stack development fundamentals with a clear and explainable architecture.

---

## 👨‍💻 Author

**Srijan Kumar**

Computer Science Engineering Graduate | Full-Stack / MERN Developer

- GitHub: https://github.com/srijan2312

---

## 📄 License

This project is primarily intended as a portfolio and learning project.

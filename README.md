# 📚 SmartLibrary

A full-stack web application for reading PDF books with AI-powered assistance, personal library management, and role-based access control.

---

## ✨ Features

- **Public Library** — Browse and search published books by title, genre, or author. Guests can browse; reading requires an account.
- **Personal Library** — Upload and manage private PDF books visible only to you.
- **PDF Reader** — In-browser viewer with page tracking, progress saving, and byte-range streaming for large files.
- **AI Reading Assistant** — Select text while reading:
  - **1 word selected** → Synonyms with definitions and part of speech (rendered as cards)
  - **2+ words selected** → Streaming summary (token by token via SSE)
- **Highlights** — Every AI action is saved as a highlight (text + page + AI response), viewable in the reader sidebar.
- **Reading History & Progress** — Tracks last page read and completion percentage, shown on the dashboard.
- **Recommendations Engine** — Genre-overlap scoring against reading history, persists top-20 recommendations per user.
- **Author Panel** — Publish PDFs to the public library, upload cover images, toggle publish/unpublish.
- **Admin Panel** — Manage role upgrade requests (user → author) and user roles.
- **Dark Mode** — System-preference aware, user-toggleable, persisted across sessions.
- **Collapsible Sidebar** — Auto-collapses in reader mode, restores on exit.

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js v18+ |
| Framework | Express 4 |
| Database | MySQL 8 via Sequelize 6 ORM |
| Auth | JWT in HTTP-only cookies |
| File Uploads | Multer + pdf-parse (validation) |
| AI | Google Gemini API (`@google/generative-ai`) via Server-Sent Events |
| Security | Helmet, CORS, express-rate-limit, bcryptjs |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router DOM v6 |
| Global State | Redux Toolkit 2 + React Redux 9 |
| Server State | TanStack Query (React Query) v5 |
| HTTP Client | Axios (REST) + native `fetch` (SSE streaming) |
| PDF Rendering | `@react-pdf-viewer` v3 + `pdfjs-dist` v3 |
| Styling | Tailwind CSS v3 |

---

## 📁 Project Structure

```
eLibrary/
├── backend/          # Express API server
├── frontend/         # React + Vite SPA
├── package.json      # Workspace root
└── .gitignore
```

### Backend (`backend/src/`)
```
├── server.js                  # Entry point
├── config/
│   ├── database.js            # Sequelize instance
│   └── multer.js              # File upload config & PDF validation
├── models/                    # Sequelize models (User, Book, Highlight, etc.)
├── middleware/
│   ├── auth.js                # JWT authentication & RBAC middleware
│   └── errorhandler.js        # Global error handler
├── controllers/               # Route handler logic
├── routes/                    # Express route definitions
├── utils/
│   ├── bookAccess.js          # Central book access-control logic
│   ├── jwt.js                 # Token issue/verify/clear helpers
│   └── response.js            # Uniform JSON response helpers
└── scripts/
    ├── migrate.js             # Production DB migration
    └── seed.js                # Demo data seeder
```

### Frontend (`frontend/src/`)
```
├── App.jsx                    # Theme, TanStack Query client, auth bootstrap
├── api/                       # Axios instance + all API call functions
├── store/                     # Redux store (authSlice + readerSlice)
├── hooks/                     # TanStack Query hooks + useAiStream
├── router/                    # Route definitions + ProtectedRoute guards
├── layouts/                   # AppLayout (Navbar + Sidebar + Outlet)
├── pages/                     # AuthPage, Dashboard, Library, Reader, Admin, etc.
└── components/
    ├── reader/                # AiPopover, AiResultPanel, HighlightSidebar
    ├── library/               # BookCard, BookGrid, BookFilters, UploadModal
    └── shared/                # Navbar, Sidebar, Modal, Spinner, Pagination, etc.
```

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| `user` | Browse public library, upload personal books, read, get AI help, track history |
| `author` | Everything a user can, plus publish books to the public library |
| `admin` | Everything, plus manage all users and approve/reject author role requests |

---


| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: `5000`) |
| `NODE_ENV` | Yes | `development` or `production` |
| `DB_HOST` | Yes | MySQL host (usually `localhost`) |
| `DB_PORT` | No | MySQL port (default: `3306`) |
| `DB_USER` | Yes | MySQL username |
| `DB_PASSWORD` | Yes | MySQL password |
| `DB_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | Random string for signing JWTs (min 32 chars) |
| `COOKIE_SECRET` | Yes | Random string for signing cookies (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `GEMINI_API_KEY` | Yes | Google Generative AI key — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | No | Model ID (default: `gemini-1.5-flash`) |
| `CLIENT_ORIGIN` | Yes | Frontend URL for CORS (e.g. `http://localhost:5173`) |
| `UPLOAD_DIR` | No | Path for file uploads (default: `./uploads`) |
| `MAX_FILE_SIZE_MB` | No | Max PDF upload size in MB (default: `20`) |

Generate secure secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MySQL** 8+



### 1. Set up the database

```bash
mysql -u root -p -e "CREATE DATABASE elibrary;"
```

### 2. Configure environment variables

```bash
cd backend
cp example.env .env
# Open .env and fill in: DB_PASSWORD, JWT_SECRET, COOKIE_SECRET, GEMINI_API_KEY
```

### 3. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Run in development

Open **two separate terminals**:

```bash
# Terminal 1 — Backend (auto-restarts on changes)
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

> The Vite dev server automatically proxies `/api/*` and `/uploads/*` to `http://localhost:5000` — no CORS setup needed in development.

### 5. (Optional) Seed demo data

```bash
cd backend
npm run seed
```

---

## 📜 Available Scripts

| Command | Directory | Description |
|---|---|---|
| `npm run dev` | `backend/` | Start backend with nodemon (auto-restart) |
| `npm start` | `backend/` | Start backend without nodemon |
| `npm run migrate` | `backend/` | Run DB migration (`sequelize.sync({ alter: true })`) |
| `npm run seed` | `backend/` | Insert demo users, books, and history |
| `npm run dev` | `frontend/` | Start Vite dev server on port 5173 |
| `npm run build` | `frontend/` | Build production bundle to `frontend/dist/` |
| `npm run preview` | `frontend/` | Preview the production build locally |

---

## 🗄️ Database Schema

Key models and their relationships:

```
users
 ├── books (authored)
 │    ├── book_permissions   (explicit read/manage grants)
 │    ├── user_history       (last_page, completion_pct per user)
 │    ├── highlights         (selected_text, page, AI result)
 │    └── recommendations    (score + reason per user)
 └── role_requests           (user → author upgrade requests)
```

---

## 🔐 Authentication

- Credentials are verified with `bcrypt`, then a **JWT is stored in an HTTP-only, SameSite=Strict cookie** (never accessible via JavaScript).
- The frontend calls `GET /api/auth/me` on mount to restore session state into Redux.
- A 401 interceptor in Axios automatically clears the session and redirects to `/login` on token expiry.

---

## 🤖 AI Streaming

AI responses use **Server-Sent Events (SSE)** — not standard JSON:

```
data: {"token": "partial text"}\n\n
data: {"token": "more text"}\n\n
data: [DONE]\n\n
```

The frontend reads this via the native `fetch` API with `ReadableStream` (Axios does not support streaming). The AI route persists the highlight to the database **before** streaming begins, so the frontend should never manually call `POST /api/highlights` after an AI action.

---

## 🌐 API Overview

All responses follow the envelope: `{ success: boolean, message: string, data: any }`

| Group | Base Path | Auth |
|---|---|---|
| Auth | `/api/auth` | Mixed |
| Public Library | `/api/library` | Optional / Required |
| Personal Books | `/api/personal/books` | Required |
| Author Panel | `/api/author` | `author` or `admin` |
| Reading History | `/api/history` | Required |
| Highlights | `/api/highlights` | Required |
| AI Assistant | `/api/ai` | Required |
| Recommendations | `/api/recommendations` | Required |
| Admin | `/api/admin` | `admin` only |

---

## 🚢 Production Notes

- Set `NODE_ENV=production` before deploying.
- Run `npm run migrate` manually before first deploy (auto-sync is disabled in production).
- Use a reverse proxy (e.g. Nginx) to forward `/api` and `/uploads` to the backend — the Vite proxy only works in development.
- Use an absolute path for `UPLOAD_DIR` in production (e.g. `/var/www/elibrary/uploads`).
- The `backend/uploads/` directory is in `.gitignore` — never commit uploaded files.

---

## 📄 License

This project is for educational/personal use.

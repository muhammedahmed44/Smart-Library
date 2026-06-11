# eLibrary — Developer README

> **For new contributors.** This document explains what the project is, what every file does, how data flows through the system, and how all the moving parts fit together. Read it top to bottom before touching any code.

---

## Table of Contents

1. [What is eLibrary?](#1-what-is-elibrary)
2. [Feature Overview](#2-feature-overview)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
   - [Root](#41-root)
   - [Backend](#42-backend)
   - [Frontend](#43-frontend)
5. [Database — Models & Relationships](#5-database--models--relationships)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Reference](#7-api-reference)
8. [Data Flow Walkthroughs](#8-data-flow-walkthroughs)
   - [Login Flow](#81-login-flow)
   - [Reading a Book](#82-reading-a-book)
   - [AI Actions (Summarize / Synonyms)](#83-ai-actions-summarize--synonyms)
   - [Recommendations Engine](#84-recommendations-engine)
9. [State Management — Redux Toolkit](#9-state-management--redux-toolkit)
10. [Frontend Routing & Guards](#10-frontend-routing--guards)
11. [File Uploads & PDF Streaming](#11-file-uploads--pdf-streaming)
12. [Environment Variables](#12-environment-variables)
13. [Running the Project](#13-running-the-project)
14. [Useful Scripts](#14-useful-scripts)
15. [Key Conventions & Gotchas](#15-key-conventions--gotchas)

---

## 1. What is eLibrary?

eLibrary is a full-stack web application where users can read PDF books, get AI-powered reading assistance, and manage personal collections. There are three kinds of users:

| Role | What they can do |
|---|---|
| **user** | Browse the public library, upload personal books, read, get AI help, track history |
| **author** | Everything a user can, plus publish books to the public library and upload cover images |
| **admin** | Everything, plus manage all users, approve/reject author role requests |

---

## 2. Feature Overview

- **Public Library** — Browse and search published books by title, genre, author. Guests can browse; reading requires an account.
- **Personal Library** — Upload private PDF books visible only to yourself. Manage, edit, delete.
- **PDF Reader** — In-browser PDF viewer with page tracking, progress saving, and byte-range streaming (supports large files).
- **AI Reading Assistant** — Select text while reading:
  - **1 word selected** → Synonyms (returns a structured JSON list of synonyms + definitions + part of speech, rendered as cards).
  - **2+ words selected** → Summarize (streams a 2–4 sentence summary token by token via SSE).
- **Highlights** — Every AI action is saved as a highlight (text + page + AI response). Viewable in the reader sidebar.
- **Reading History & Progress** — Tracks last page read and calculates completion percentage. Shown on the dashboard.
- **Recommendations** — Genre-overlap engine scores unread books against reading history and preferences, persists top-20 per user.
- **Author Panel** — Publish PDFs to the public library, upload cover images, toggle publish/unpublish.
- **Admin Panel** — Review role upgrade requests (user → author), approve or reject with notes. Manage user roles directly.
- **Dark Mode** — System-preference aware, user-toggleable, persisted in `localStorage`.
- **Collapsible Sidebar** — Auto-collapses when entering reader mode, restores on exit. Manually toggleable.

---

## 3. Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express 4 |
| Database | MySQL 8 via Sequelize 6 ORM |
| Auth | JWT in HTTP-only cookies |
| File uploads | Multer + pdf-parse (validation) |
| AI | Google Gemini API (`@google/generative-ai`) via Server-Sent Events |
| Security | Helmet, CORS, express-rate-limit, bcryptjs |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Routing | React Router DOM v6 |
| Global state | Redux Toolkit 2 + React Redux 9 |
| Server state | TanStack Query (React Query) v5 |
| HTTP client | Axios (REST) + native `fetch` (SSE streaming) |
| PDF rendering | `@react-pdf-viewer` v3 + `pdfjs-dist` v3 |
| Styling | Tailwind CSS v3 |

---

## 4. Project Structure

### 4.1 Root

```
eLibrary-project/
├── backend/          # Express API server
├── frontend/         # React + Vite SPA
├── package.json      # Workspace root (scripts to run both together)
└── .gitignore        # Excludes node_modules, .env, backend/uploads/
```

---

### 4.2 Backend

```
backend/
├── example.env                  # Template — copy to .env and fill in values
├── package.json                 # Backend dependencies and npm scripts
└── src/
    ├── server.js                # Entry point — wires Express, middleware, routes, and DB
    │
    ├── config/
    │   ├── database.js          # Sequelize instance (reads DB_* env vars)
    │   └── multer.js            # File upload config: storage paths, MIME filters,
    │                            # PDF validation middleware, helper utilities
    │
    ├── models/
    │   ├── index.js             # Imports all models, defines ALL associations, exports
    │   ├── User.js              # Users table — roles, preferences, bcrypt hooks
    │   ├── Book.js              # Books table — metadata, file path, visibility, publish state
    │   ├── BookPermission.js    # Explicit read/manage grants for private books
    │   ├── UserHistory.js       # Reading progress — last page + completion % per user+book
    │   ├── Highlight.js         # AI-triggered highlights — selected text, page, AI result
    │   ├── Recommendation.js    # Computed recommendations — score + reason per user+book
    │   └── RoleRequest.js       # Author role upgrade requests — pending/approved/rejected
    │
    ├── middleware/
    │   ├── auth.js              # authenticate (JWT cookie → req.user), authorize (RBAC),
    │   │                        # optionalAuth (attaches user if present, never rejects)
    │   └── errorhandler.js      # Global Express error handler + 404 handler
    │
    ├── controllers/
    │   ├── authController.js    # register, login, logout, me, updatePreferences,
    │   │                        # requestAuthorRole, myRoleRequest
    │   ├── libraryController.js # listPublicBooks, getPublicBook, serveBookPdf, listGenres
    │   ├── personalController.js# listPersonalBooks, getPersonalBook, uploadPersonalBook,
    │   │                        # updatePersonalBook, deletePersonalBook, servePersonalPdf
    │   ├── authorController.js  # listAuthorBooks, publishBook, togglePublish, uploadBookCover
    │   ├── historyController.js # upsertHistory, getHistory, getHighlights,
    │   │                        # createHighlight, deleteHighlight
    │   └── adminController.js   # listRoleRequests, actionRoleRequest, listUsers, setUserRole
    │
    ├── routes/
    │   ├── auth.js              # /api/auth/* — registration, login, session, preferences
    │   ├── books.js             # Exports 5 routers: libraryRouter, personalRouter,
    │   │                        # authorRouter, historyRouter, highlightsRouter
    │   ├── ai.js                # /api/ai/summarize and /api/ai/synonyms (SSE streaming)
    │   ├── recommendations.js   # /api/recommendations — computes + serves top-20
    │   └── admin.js             # /api/admin/* — role requests + user management (admin only)
    │
    ├── utils/
    │   ├── bookAccess.js        # getBookById(), canReadBook(), canManageBook()
    │   │                        # Central access-control logic used by all controllers
    │   ├── jwt.js               # issueToken(), verifyToken(), clearToken() + cookie name
    │   └── response.js          # sendSuccess() and sendError() — uniform JSON envelope
    │
    └── scripts/
        ├── migrate.js           # Run in production: sequelize.sync({ alter: true })
        └── seed.js              # Seeds demo users, books, and history for local dev
```

#### Key file details

**`server.js`**
The application entry point. In order: applies security headers (Helmet), CORS (credentials: true for cookie auth), body parsers, global rate limiter (300 req / 15 min), static file serving for cover images, registers all route groups, then starts listening. In `development` mode it calls `sequelize.sync({ alter: true })` which auto-creates/migrates tables — no manual migration needed locally.

**`config/multer.js`**
Handles all file upload logic. Two Multer instances: `uploadBook` (PDFs, up to `MAX_FILE_SIZE_MB`, stored as `books/<uuid>.pdf`) and `uploadCover` (images, up to 5 MB, stored as `covers/<uuid>.ext`). The `validatePdf` middleware runs *after* Multer saves the file — it reads the file asynchronously, runs `pdf-parse` to count pages, attaches `req.pdfMeta = { totalPages, filePath, fileSizeBytes }` for the controller to persist, and deletes the file + returns 422 if invalid.

**`middleware/auth.js`**
Three middlewares:
- `authenticate` — reads the `elib_token` HTTP-only cookie, verifies JWT, fetches the user from DB (excluding `password_hash`), attaches to `req.user`. Returns 401 on failure.
- `authorize(...roles)` — factory that returns a middleware checking `req.user.role` against allowed roles. Always used *after* `authenticate`.
- `optionalAuth` — same as `authenticate` but silently continues if no cookie or invalid token. Used on `GET /api/library/books` so guests can browse but authenticated users get richer data.

**`utils/bookAccess.js`**
The single source of truth for "can this user access this book?". `canReadBook` checks: admin → yes; author of book → yes; public + published → yes; else checks `BookPermission` table. `canManageBook` checks: admin → yes; author of book → yes; else checks for a `manage` permission row.

---

### 4.3 Frontend

```
frontend/
├── index.html               # Vite entry HTML — mounts React at #root
├── vite.config.js           # Dev server on :5173, proxies /api and /uploads to :5000
├── tailwind.config.js       # Custom design tokens (ink-*, parchment-* color scales)
├── postcss.config.js        # Autoprefixer
│
└── src/
    ├── main.jsx             # React root — wraps App in Redux <Provider>
    ├── App.jsx              # Theme management, TanStack Query client, AuthBootstrap,
    │                        # memoised router creation
    ├── index.css            # Tailwind directives + custom component classes
    │
    ├── api/
    │   ├── axios.js         # Axios instance (/api base, withCredentials).
    │   │                    # 401 interceptor: lazily dispatches Redux clearUser + redirects
    │   ├── auth.js          # authApi — register, login, logout, me, preferences, role requests
    │   └── books.js         # libraryApi, personalApi, authorApi, historyApi,
    │                        # highlightsApi, aiApi, recommendationsApi, adminApi
    │
    ├── store/
    │   ├── index.js         # configureStore — combines authSlice + readerSlice
    │   ├── authStore.js     # (legacy Zustand file — kept for reference, no longer used)
    │   ├── readerStore.js   # (legacy Zustand file — kept for reference, no longer used)
    │   └── slices/
    │       ├── authSlice.js # RTK slice: user, isLoading. Actions: setUser, clearUser,
    │       │                # setLoading, updatePreferences. localStorage persistence.
    │       │                # Selectors: selectUser, selectIsLoading, selectIsAdmin,
    │       │                # selectIsAuthor, selectIsAuthenticated
    │       └── readerSlice.js # RTK slice: currentBook, currentPage, selection, aiPanel,
    │                          # highlights, highlightSidebarOpen, navSidebarCollapsed.
    │                          # Selectors: selectCurrentBook, selectSelection, selectAiPanel, etc.
    │
    ├── hooks/
    │   ├── index.js         # All TanStack Query hooks: useAuth, useMe, useLogout,
    │   │                    # usePublicBooks, usePersonalBooks, useUploadBook,
    │   │                    # useHighlights, useCreateHighlight, useDeleteHighlight,
    │   │                    # useHistory, useUpsertProgress, useAuthorBooks,
    │   │                    # usePublishBook, useTogglePublish, useRoleRequests,
    │   │                    # useActionRoleRequest, useAdminUsers, useGenres
    │   └── useAiStream.js   # Returns triggerAi(action). Captures selection values,
    │                        # opens AI panel in Redux, calls SSE endpoint,
    │                        # dispatches appendAiContent per token, setAiDone on [DONE]
    │
    ├── router/
    │   ├── index.jsx        # createAppRouter() — all route definitions
    │   └── guards.jsx       # ProtectedRoute (redirects to /login if not authed, checks roles)
    │                        # PublicRoute (redirects to /dashboard if already authed)
    │
    ├── layouts/
    │   └── AppLayout.jsx    # Shell: Navbar + Sidebar + <Outlet>. Watches route to
    │                        # auto-collapse sidebar on /reader/* paths via Redux dispatch.
    │                        # Main content margin transitions with sidebar width.
    │
    ├── pages/
    │   ├── AuthPage.jsx         # Login + Register tabs. On success dispatches setUser to Redux.
    │   ├── DashboardPage.jsx    # Stats, continue-reading list, recommendations carousel,
    │   │                        # role upgrade request button
    │   ├── PublicLibraryPage.jsx# Paginated book grid with genre + search filters
    │   ├── PersonalLibraryPage.jsx # Personal book grid, upload modal, edit/delete
    │   ├── ReaderPage.jsx       # PDF viewer, progress tracking, text selection handler,
    │   │                        # dispatches to Redux, renders AI popover + panels
    │   ├── AuthorPanelPage.jsx  # Author's books list, publish form, toggle publish/unpublish,
    │   │                        # cover upload
    │   ├── AdminPage.jsx        # Role request queue + user management table
    │   └── index.jsx            # Barrel for SettingsPage (stub) and NotFoundPage
    │
    └── components/
        ├── reader/
        │   ├── AiPopover.jsx       # Floating bubble over text selection.
        │   │                       # 1 word → Synonyms button only.
        │   │                       # 2+ words → Summarize button only.
        │   │                       # Dispatches clearSelection on outside click.
        │   ├── AiResultPanel.jsx   # Right-side drawer showing streaming AI output.
        │   │                       # Summarize: streams prose with live cursor.
        │   │                       # Synonyms: waits for [DONE] then renders word cards.
        │   └── HighlightSidebar.jsx# Left-side drawer listing all highlights.
        │                           # Each card shows: action badge, page number, selected text,
        │                           # and a collapsible AI Response section with full content.
        │
        ├── library/
        │   ├── BookCard.jsx        # Book thumbnail, title, author, genre badge, read button
        │   ├── BookGrid.jsx        # Responsive grid of BookCards with loading/empty states
        │   ├── BookFilters.jsx     # Search input + genre dropdown filter bar
        │   └── UploadModal.jsx     # Personal book upload form (title, genre, PDF file)
        │
        └── shared/
            ├── Navbar.jsx          # Top bar: logo, mobile menu toggle, theme toggle,
            │                       # user avatar + logout
            ├── Sidebar.jsx         # Nav links (Dashboard, Library, My Books, Author, Admin).
            │                       # Collapses to icon-only mode. Collapse button at bottom.
            │                       # Recent reading progress mini-list (hidden when collapsed).
            │                       # Mobile: full-screen drawer overlay.
            ├── Modal.jsx           # Accessible dialog wrapper
            ├── Spinner.jsx         # Loading spinner (size variants: sm, md, lg)
            ├── Pagination.jsx      # Page number controls
            ├── EmptyState.jsx      # Illustrated empty state with optional CTA
            └── ErrorBoundary.jsx   # React error boundary wrapping all page content
```

---

## 5. Database — Models & Relationships

```
users ──────────────────────────────────────────────────────────────────┐
  id, name, email, password_hash, role, preferences (JSON), notification │
  │                                                                        │
  │ hasMany                                                                │
  ├──► books (as authoredBooks)                                           │
  │      id, author_id, title, description, genre, file_path, cover_path, │
  │      file_size_bytes, total_pages, visibility, is_published, published_at
  │      │                                                                 │
  │      │ hasMany                                                         │
  │      ├──► book_permissions                                             │
  │      │      id, book_id, user_id, permission_type ('read'|'manage')   │
  │      │                                                                 │
  │      ├──► user_history (as readHistory)                               │
  │      │      id, user_id, book_id, last_page, total_pages,             │
  │      │      completion_pct (virtual), updated_at                       │
  │      │                                                                 │
  │      ├──► highlights                                                   │
  │      │      id, user_id, book_id, selected_text, page_number,         │
  │      │      position_data (JSON), ai_action, ai_result (LONGTEXT)     │
  │      │                                                                 │
  │      └──► recommendations                                              │
  │             id, user_id, book_id, score (FLOAT), reason               │
  │                                                                        │
  ├──► book_permissions (as bookPermissions)                              │
  ├──► user_history (as history)                                          │
  ├──► highlights                                                          │
  ├──► recommendations                                                     │
  └──► role_requests                                                       │
         id, user_id, message, status ('pending'|'approved'|'rejected'),  │
         admin_note, actioned_by, actioned_at                             │
```

**Important model notes:**

- `User` has `beforeCreate` / `beforeUpdate` hooks that bcrypt-hash `password_hash` automatically — never store plain-text passwords.
- `User.prototype.toSafeObject()` strips `password_hash` before sending to the client.
- `Book.visibility` is either `'public'` or `'private'`. A book is only browsable publicly when **both** `visibility === 'public'` AND `is_published === true`. `togglePublish(false)` resets visibility back to `'private'`.
- `Highlight.position_data` stores the `@react-pdf-viewer` highlight plugin shape: `{ boundingRect: { x1, y1, x2, y2, width, height }, pageIndex }`.
- `Recommendation` rows are replaced (not accumulated) on every `/api/recommendations` call — stale rows outside the top-20 are deleted before upserting.

---

## 6. Authentication & Authorization

### How auth works end-to-end

1. User POSTs credentials to `/api/auth/login`.
2. Server verifies password with `bcrypt.compare`, calls `issueToken(res, { id, role })`.
3. `issueToken` signs a JWT (7-day expiry) and sets it as an **HTTP-only, SameSite=Strict cookie** named `elib_token`. The token never touches JavaScript — it cannot be stolen via XSS.
4. Every subsequent request from the browser automatically sends the cookie.
5. `authenticate` middleware reads it, calls `jwt.verify`, fetches the user from DB, and attaches to `req.user`.
6. On the frontend, `App.jsx`'s `AuthBootstrap` calls `GET /api/auth/me` on mount to validate the cookie and populate Redux with the user object.
7. The Axios 401 interceptor listens for expired/invalid sessions and dispatches `clearUser()` + redirects to `/login`.

### Role-based access control

Three roles exist: `user` < `author` < `admin`.

```
Route guard (frontend)       Backend authorize() middleware
─────────────────────────    ──────────────────────────────────────
/author  → ['author','admin']  authorRouter.use(authorize('author','admin'))
/admin   → ['admin']           adminRouter.use(authorize('admin'))
All others → any authed user   authenticate only
```

Book-level access uses `canReadBook()` / `canManageBook()` in `utils/bookAccess.js`. These are called in every controller that serves or modifies book content — not just at the route level.

---

## 7. API Reference

All responses follow the envelope: `{ success: boolean, message: string, data: any }`.

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | None | Create account. Rate-limited: 10/15 min |
| POST | `/login` | None | Login, sets `elib_token` cookie. Rate-limited |
| POST | `/logout` | Required | Clears cookie |
| GET | `/me` | Required | Returns current user (no password_hash) |
| PUT | `/preferences` | Required | Update `user.preferences` JSON |
| POST | `/role-request` | Required | Submit author upgrade request |
| GET | `/role-request/me` | Required | Get own role request status |

### Public Library — `/api/library`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/books` | Optional | List published books. Params: `?search=&genre=&page=&limit=` |
| GET | `/books/:id` | Optional | Get single book metadata |
| GET | `/books/:id/serve` | Required | Stream PDF bytes (supports `Range` header) |
| GET | `/genres` | None | List all genres with book counts |

### Personal Books — `/api/personal/books`

All routes require authentication. Users can only access their own books.

| Method | Path | Description |
|---|---|---|
| GET | `/` | List own uploaded books |
| GET | `/:id` | Get single personal book |
| POST | `/` | Upload PDF (`multipart/form-data`, field: `file`) |
| PUT | `/:id` | Update title / genre / description |
| DELETE | `/:id` | Delete book + file from disk |
| GET | `/:id/serve` | Stream personal book PDF |

### Author Panel — `/api/author`

Requires `author` or `admin` role.

| Method | Path | Description |
|---|---|---|
| GET | `/books` | List all books authored by this user |
| POST | `/books` | Publish a new book to the public library (PDF upload) |
| PUT | `/books/:id/publish` | Toggle published/unpublished state |
| POST | `/books/:id/cover` | Upload cover image (`multipart/form-data`, field: `cover`) |

### Reading History — `/api/history`

| Method | Path | Description |
|---|---|---|
| POST | `/:bookId` | Upsert reading progress. Body: `{ lastPage }` |
| GET | `/` | Get full reading history with completion percentages |

### Highlights — `/api/highlights`

| Method | Path | Description |
|---|---|---|
| GET | `/:bookId` | Get all highlights for a book |
| POST | `/` | Create a highlight manually |
| DELETE | `/:id` | Delete a highlight |

> **Note:** Highlights are also created automatically by the AI routes before streaming begins. Do not create them again client-side.

### AI — `/api/ai`

Both routes require authentication and use **Server-Sent Events** (SSE), not standard JSON.

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/summarize` | `{ text, bookId?, pageNumber?, positionData? }` | Streams summary tokens. Max 2000 chars of input. |
| POST | `/synonyms` | `{ text, bookId?, pageNumber?, positionData? }` | Streams a JSON array of synonym objects. Max 200 chars. |

**SSE format:**
```
data: {"token": "partial text"}\n\n
data: {"token": "more text"}\n\n
data: [DONE]\n\n
```
On error: `data: [ERROR]\n\n`

The client reads this stream with `fetch` + `ReadableStream`, not Axios (which doesn't support streaming).

### Recommendations — `/api/recommendations`

| Method | Path | Description |
|---|---|---|
| GET | `/` | Compute + return top-20 book recommendations for the current user |

### Admin — `/api/admin`

Requires `admin` role.

| Method | Path | Description |
|---|---|---|
| GET | `/role-requests` | List all role upgrade requests |
| PUT | `/role-requests/:id` | Approve or reject. Body: `{ action: 'approve'\|'reject', adminNote? }` |
| GET | `/users` | List all users |
| PUT | `/users/:id/role` | Change a user's role. Body: `{ role }` |

---

## 8. Data Flow Walkthroughs

### 8.1 Login Flow

```
User types email + password
  → AuthPage dispatches POST /api/auth/login
    → authController.login() verifies bcrypt hash
      → issueToken() sets HTTP-only cookie
        → returns user object (no password_hash)
  → Frontend: dispatch(setUser(user)) → Redux authSlice
  → React Router redirects to /dashboard
  → All future requests automatically send cookie
```

### 8.2 Reading a Book

```
User clicks "Read" on a BookCard
  → Navigates to /reader/public/:id or /reader/personal/:id
    → ReaderPage mounts
      → dispatch(resetReader()) clears any previous book state
      → AppLayout detects /reader/* → dispatch(collapseNavSidebar())
      → useEffect: fetch book metadata → dispatch(setCurrentBook(book))
      → useHighlights(id): React Query fetches highlights → dispatch(setHighlights(highlights))
      → PDF viewer loads from /api/library/books/:id/serve (byte-range streaming)
        → serveBookPdf() reads file stats, checks Range header,
          streams fs.createReadStream() with HTTP 206 Partial Content
      → On page change: dispatch(setCurrentPage(page))
        → Debounced (3s): POST /api/history/:bookId { lastPage }
```

### 8.3 AI Actions (Summarize / Synonyms)

```
User selects text in the PDF viewer
  → mouseup handler reads window.getSelection()
  → dispatch(setSelection({ text, pageNumber, positionData, boundingRect }))
  → AiPopover renders above the selection
    → 1 word  → "Synonyms" button
    → 2+ words → "Summarize" button

User clicks the action button
  → triggerAi(action) in useAiStream.js
    → Captures selection values into local variables (BEFORE clearSelection)
    → dispatch(openAiPanel(action))   // opens AiResultPanel
    → dispatch(clearSelection())      // hides AiPopover
    → fetch POST /api/ai/summarize or /api/ai/synonyms
      → Backend: verifies book access, creates Highlight row (ai_result: null),
        then calls Gemini API with generateContentStream()
      → SSE stream opens
        → For each chunk: res.write(`data: {"token": "..."}\n\n`)
        → Frontend: dispatch(appendAiContent(token))
        → AiResultPanel renders tokens progressively
      → res.write('data: [DONE]\n\n')
      → Frontend: dispatch(setAiDone())
        → Summarize: prose is already fully rendered
        → Synonyms: JSON is parsed + rendered as word cards
```

> **Why `fetch` instead of Axios for AI?** Axios reads the full response body before resolving. SSE requires reading an open `ReadableStream` chunk by chunk. Only the native `fetch` API supports this.

### 8.4 Recommendations Engine

```
User visits Dashboard → useQuery calls GET /api/recommendations
  → computeAndFetchRecommendations(userId):
    1. Fetch user.preferences.genres
    2. Fetch all UserHistory rows → extract read book IDs and genre frequency map
    3. Blend preference genres at half-weight into genre frequency map
    4. Fetch up to 200 unread public books
    5. Score each: score = genreFreq[book.genre] / totalWeight
    6. Sort descending, take top 20
    7. DELETE Recommendation rows for this user NOT in the top-20 (removes stale rows)
    8. UPSERT each of the top-20
    9. Fetch + return with Book association

New users with no history: all scores = 0, returns 20 random public books.
```

---

## 9. State Management — Redux Toolkit

The project uses **RTK for UI/client state** and **TanStack Query for server/cache state**. They don't overlap.

### Store structure

```
Redux store
├── auth (authSlice)
│   ├── user          — full user object or null
│   └── isLoading     — true until /auth/me bootstrap completes
│
└── reader (readerSlice)
    ├── currentBook          — book metadata object or null
    ├── currentPage          — integer, 1-indexed
    ├── selection            — { text, pageNumber, positionData, boundingRect } or null
    ├── aiPanel              — { isOpen, action, status, content, errorMessage }
    ├── highlights           — array of highlight objects from server
    ├── highlightSidebarOpen — boolean
    └── navSidebarCollapsed  — boolean (auto-managed by AppLayout)
```

### Why two systems?

| Concern | Tool | Why |
|---|---|---|
| Is the user logged in? | RTK | Shared across the whole app, updated once |
| What text is selected? | RTK | Ephemeral UI state, no server involvement |
| List of public books | TanStack Query | Needs caching, pagination, background refetch |
| Highlights for a book | TanStack Query | Needs invalidation when a highlight is deleted |
| Recommendations | TanStack Query | Stale-while-revalidate, server-computed |

### Important: `authStore.js` and `readerStore.js` in `store/`

These are the **old Zustand store files**. They are no longer imported anywhere. They are kept for reference only. Do not use them. The actual stores are `store/slices/authSlice.js` and `store/slices/readerSlice.js`, composed in `store/index.js`.

---

## 10. Frontend Routing & Guards

```
/login                    PublicRoute   → redirects to /dashboard if already logged in
/                         ProtectedRoute → redirects to /login if not logged in
  /dashboard              any authed user
  /library                any authed user
  /personal               any authed user
  /settings               any authed user (stub — not yet implemented)
  /reader/public/:id      any authed user
  /reader/personal/:id    any authed user
  /author                 ProtectedRoute roles=['author','admin']
  /admin                  ProtectedRoute roles=['admin']
* (catch-all)             NotFoundPage
```

`createAppRouter()` in `router/index.jsx` is called inside `App.jsx` wrapped in `useMemo([theme, toggle])` — this prevents the entire route tree from remounting on theme toggle.

`ProtectedRoute` and `PublicRoute` in `router/guards.jsx` both read from Redux (`selectUser`, `selectIsLoading`). They render a full-screen `<Spinner>` while `isLoading` is true to prevent a flash of the login page on refresh.

---

## 11. File Uploads & PDF Streaming

### Upload pipeline

```
POST /api/personal/books (multipart/form-data)
  → Multer (uploadBook) saves file to backend/uploads/books/<uuid>.pdf
  → validatePdf middleware:
      - Reads file asynchronously (fs.promises.readFile)
      - Runs pdf-parse to count pages
      - Attaches req.pdfMeta = { totalPages, filePath, fileSizeBytes }
      - On failure: deletes file + returns 422
  → Controller persists Book row with file_path, total_pages, file_size_bytes
```

Cover images follow a similar path through `uploadCover` + `uploadBookCover`.

### PDF streaming

PDFs are **never served as static files**. They go through an authenticated Express route that supports HTTP `Range` headers:

```
GET /api/library/books/:id/serve
  → authenticate middleware
  → canReadBook() access check
  → Read file stats (size)
  → If Range header present: parse start/end, respond 206 Partial Content
  → If no Range: respond 200 with full file
  → Pipe fs.createReadStream(filePath, { start, end }) to response
```

This is what enables the PDF viewer to seek to a specific page without downloading the entire file first. The `@react-pdf-viewer` library sends `Range` requests automatically.

The PDF URL is constructed on the frontend as a plain string (`/api/library/books/:id/serve`) and passed directly to the viewer — it is **not** an Axios call.

### File path storage

Files are stored with a path relative to `UPLOAD_DIR`, e.g. `books/uuid.pdf`. This relative path is what's saved in the `Book.file_path` column. At serve time, `resolveUploadPath(book.file_path)` joins it back to the absolute `UPLOAD_DIR` path.

Never commit files in `backend/uploads/` — it is in `.gitignore`.

---

## 12. Environment Variables

Copy `backend/example.env` to `backend/.env` and fill in all values.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port. Default: `5000` |
| `NODE_ENV` | Yes | `development` or `production`. Controls DB sync, cookie `secure` flag |
| `DB_HOST` | Yes | MySQL host. Usually `localhost` |
| `DB_PORT` | No | MySQL port. Default: `3306` |
| `DB_USER` | Yes | MySQL username |
| `DB_PASSWORD` | Yes | MySQL password — note the full key name `DB_PASSWORD` not `DB_PASS` |
| `DB_NAME` | Yes | Database name (create it first: `CREATE DATABASE elibrary;`) |
| `JWT_SECRET` | Yes | Long random string for signing JWTs. Min 32 chars recommended |
| `COOKIE_SECRET` | Yes | Long random string for signing cookies |
| `JWT_EXPIRES_IN` | No | Token lifetime. Default: `7d` |
| `GEMINI_API_KEY` | Yes | Google Generative AI key — get one free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL` | No | Model ID. Default: `gemini-1.5-flash` |
| `CLIENT_ORIGIN` | Yes | Frontend URL for CORS. Default: `http://localhost:5173` |
| `UPLOAD_DIR` | No | Absolute or relative path for uploads. Default: `./uploads` |
| `MAX_FILE_SIZE_MB` | No | Max PDF upload size in MB. Default: `20` |

---

## 13. Running the Project

### Prerequisites

- Node.js v18+
- MySQL 8+

### One-time setup

```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE elibrary;"

# 2. Configure backend
cd backend
cp example.env .env
# Edit .env — fill in DB_PASSWORD, JWT_SECRET, COOKIE_SECRET, GEMINI_API_KEY

# 3. Install dependencies
cd ../backend && npm install
cd ../frontend && npm install
```

### Running in development

In two separate terminals:

```bash
# Terminal 1 — Backend (auto-restarts on file changes)
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173**

The frontend dev server proxies `/api/*` and `/uploads/*` to `http://localhost:5000`, so there are no CORS issues in development.

### Optional: seed demo data

```bash
cd backend
npm run seed
```

---

## 14. Useful Scripts

| Command | Location | What it does |
|---|---|---|
| `npm run dev` | `backend/` | Start backend with nodemon (auto-restart) |
| `npm start` | `backend/` | Start backend without nodemon (production) |
| `npm run migrate` | `backend/` | Run `sequelize.sync({ alter: true })` — use in production instead of auto-sync |
| `npm run seed` | `backend/` | Insert demo users, books, and history rows |
| `npm run dev` | `frontend/` | Start Vite dev server on :5173 |
| `npm run build` | `frontend/` | Build production bundle to `frontend/dist/` |
| `npm run preview` | `frontend/` | Preview the production build locally |

---

## 15. Key Conventions & Gotchas

**All API responses use the same envelope.**
```json
{ "success": true, "message": "Success", "data": { ... } }
{ "success": false, "message": "Error description" }
```
Never return raw data from a controller — always use `sendSuccess(res, data)` or `sendError(res, message, status)`.

**Never create highlights from the frontend.**
The AI routes (`/api/ai/summarize`, `/api/ai/synonyms`) persist the highlight row to the database *before* streaming begins. The frontend must not call `POST /api/highlights` after an AI action — this was a bug (duplicate highlights) that has already been fixed.

**SSE streams use `fetch`, not Axios.**
`useAiStream.js` opens a `fetch()` call and reads `response.body.getReader()`. Axios doesn't support streaming responses — don't try to port this to Axios.

**Capture selection values before dispatching `clearSelection()`.**
`clearSelection()` zeroes `state.selection` in Redux. Code that needs the selected text or page number *after* clearing must copy values to local variables first. This is already done in `useAiStream.js`.

**`navSidebarCollapsed` is controlled by `AppLayout`, not the user directly.**
`AppLayout` watches `location.pathname`. On `/reader/*` it dispatches `collapseNavSidebar()`. On any other route it dispatches `expandNavSidebar()`. The sidebar's own "Collapse" button dispatches `toggleNavSidebar()` for manual control outside reader mode.

**The `@react-pdf-viewer` `Viewer` component re-renders aggressively.**
The `defaultLayoutPlugin` instance must be created with `defaultLayoutPlugin()` at component level (not inside render). It's already correctly memoised in `ReaderPage.jsx`.

**MySQL booleans.**
Sequelize maps `DataTypes.BOOLEAN` to `TINYINT(1)`. Always use `is_published: true/false` in Sequelize — never compare with `=== 1` in raw code.

**`sequelize.sync({ alter: true })` runs automatically in development.**
You don't need to run migrations locally. In production, set `NODE_ENV=production` and run `npm run migrate` manually before deploying, or the tables won't be created.

**Vite proxies `/api` in development only.**
In production you'll need a real reverse proxy (Nginx, etc.) to forward `/api` and `/uploads` to the backend. The `vite.config.js` proxy is a dev-only convenience.

**`authStore.js` and `readerStore.js` in `store/` are dead code.**
They are the legacy Zustand stores kept for historical reference. No file imports from them. The live stores are `store/slices/authSlice.js`, `store/slices/readerSlice.js`, and `store/index.js`.

**Genre field has an 80-character limit.**
Validated in both `personalController.js` and `authorController.js` before hitting the DB. The model column is `STRING(80)`.

**File paths in the DB are relative to `UPLOAD_DIR`.**
Example: `books/550e8400-e29b-41d4-a716-446655440000.pdf`. Use `resolveUploadPath(book.file_path)` to get the absolute path for disk operations.

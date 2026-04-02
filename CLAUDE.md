# HireTrack — Claude Code Context

## Project Overview

HireTrack is a full-stack job application tracker that helps users manage their job search from start to finish. Users add job listings, attach CV versions and cover letters, track application status through a pipeline (DRAFT → APPLIED → INTERVIEW → OFFER), and use Claude AI to analyze job descriptions, get CV match scores, and generate tailored PDF CVs. Every user's data is fully isolated via Supabase Auth.

---

## Tech Stack

- **Frontend:** React 18 + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)
- **Database:** Supabase PostgreSQL
- **ORM:** Prisma 5
- **Auth:** Supabase Auth (Google OAuth, GitHub OAuth, Email/Password)
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **PDF:** Puppeteer (headless Chromium)
- **Styling:** CSS variables (Space Editorial dark theme) + Tailwind CSS (utility layer)
- **Data fetching:** @tanstack/react-query v5
- **HTTP client:** axios with auth interceptor

---

## Project Structure

```
applyiq/
├── package.json               # Root: concurrently runs server + client
├── CLAUDE.md
├── server/
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma      # All DB models
│   └── src/
│       ├── index.js            # Express app entry, route registration
│       ├── middleware/
│       │   ├── auth.js         # requireAuth middleware (Supabase JWT)
│       │   └── errorHandler.js
│       ├── lib/
│       │   ├── prisma.js       # Prisma client singleton
│       │   ├── claude.js       # Anthropic client singleton
│       │   └── keepAlive.js    # Supabase keep-alive cron (every 5 days)
│       ├── routes/
│       │   ├── jobs.js
│       │   ├── cvVersions.js
│       │   ├── applications.js
│       │   ├── coverLetters.js
│       │   ├── statusHistory.js
│       │   ├── ai.js
│       │   ├── cvGenerator.js
│       │   └── profile.js
│       └── services/
│           ├── aiService.js          # analyzeJob(), recommendCvVersion()
│           └── cvGeneratorService.js # generateTailoredCv(), renderCvHtml(), generatePdf()
└── client/
    ├── package.json
    ├── index.html
    └── src/
        ├── main.jsx            # React root, providers
        ├── App.jsx             # Routes
        ├── index.css           # All CSS variables + global styles
        ├── lib/
        │   └── supabase.js     # Supabase client singleton
        ├── api/
        │   ├── client.js       # Axios instance + auth interceptor
        │   ├── jobs.js
        │   ├── cvVersions.js
        │   ├── applications.js
        │   ├── coverLetters.js
        │   └── cvGenerator.js
        ├── context/
        │   ├── AuthContext.jsx  # useAuth() — user, session, loading, signOut
        │   └── ToastContext.jsx # useToast() — toast.success(), toast.error()
        ├── hooks/
        │   ├── useJobs.js
        │   ├── useCvVersions.js
        │   ├── useApplications.js
        │   └── useAiAnalysis.js
        ├── components/
        │   ├── Layout.jsx       # Sidebar nav + user avatar + sign out
        │   ├── ProtectedRoute.jsx
        │   ├── Modal.jsx        # Generic modal + ConfirmModal
        │   ├── StatusBadge.jsx  # Colored status pill
        │   └── CvPreviewModal.jsx # 4-phase CV preview + PDF download
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Jobs.jsx
            ├── CvVersions.jsx
            ├── Applications.jsx
            └── Profile.jsx
```

---

## Database Models

### Job
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| user_id | String? | Supabase user ID (nullable for legacy rows) |
| company_name | String | Required |
| title | String | Required |
| description | String? | Text |
| url | String? | |
| source | String? | |
| created_at | DateTime | |
| → applications | Application[] | |
| → cover_letters | CoverLetter[] | |
| → ai_analyses | AiAnalysis[] | |

### CvVersion
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| user_id | String? | |
| name | String | |
| target_type | TargetType | FULLSTACK \| BACKEND \| DATA \| STUDENT |
| file_url | String? | |
| plain_text | String? | Text — required for AI CV generation |
| created_at | DateTime | |

### Application
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| user_id | String? | |
| job_id | String | FK → Job (cascade delete) |
| cv_version_id | String | FK → CvVersion |
| cover_letter_id | String? | FK → CoverLetter |
| applied_at | DateTime? | Set automatically when status → APPLIED |
| status | ApplicationStatus | DRAFT \| READY \| APPLIED \| OA \| INTERVIEW \| REJECTED \| OFFER \| WITHDRAWN |
| match_score | Float? | 0–100, set by AI analysis |
| notes | String? | Text |
| updated_at | DateTime | Auto-updated |
| → status_history | StatusHistory[] | |

### CoverLetter
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| job_id | String | FK → Job (cascade delete) |
| content | String | Text |
| created_at | DateTime | |

### AiAnalysis
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| user_id | String? | |
| job_id | String | FK → Job (cascade delete) |
| required_skills | String[] | |
| technologies | String[] | |
| experience_years | Int? | |
| job_type | String? | |
| seniority | String? | |
| keywords | String[] | |
| summary | String? | Text |
| match_tips | String[] | |
| recommended_cv_id | String? | |
| match_score | Int? | 0–100 |
| reason | String? | Text |
| suggested_tweaks | String[] | |
| created_at | DateTime | |

### StatusHistory
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| application_id | String | FK → Application (cascade delete) |
| old_status | ApplicationStatus? | |
| new_status | ApplicationStatus | |
| changed_at | DateTime | |
| note | String? | |

### UserProfile
| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| user_id | String | Unique — Supabase user ID |
| full_name | String? | |
| avatar_url | String? | |
| created_at | DateTime | |
| updated_at | DateTime | Auto-updated |

---

## API Routes

All routes require `Authorization: Bearer <supabase-jwt>` except `/api/health`.

### Health
- `GET  /api/health` — liveness check (no auth)

### Jobs — `/api/jobs`
- `GET  /` — list all jobs for user
- `GET  /:id` — get job with applications and cover letters
- `POST /` — create job (`company_name`, `title` required)
- `PUT  /:id` — update job fields (partial)
- `DELETE /:id` — delete job (cascades to applications, cover letters, AI analyses)

### CV Versions — `/api/cv-versions`
- `GET  /` — list all CV versions for user
- `GET  /:id` — get single CV version
- `POST /` — create CV version (`name`, `target_type` required; optionally `plain_text`)
- `PUT  /:id` — update CV version (partial)
- `DELETE /:id` — delete CV version

### Applications — `/api/applications`
- `GET  /` — list applications (optional `?status=` filter)
- `GET  /:id` — get application with job, cv_version, cover_letter, status_history
- `POST /` — create application (`job_id`, `cv_version_id` required); auto-creates DRAFT status history entry
- `PATCH /:id/status` — update status (`status` required, optional `note`); auto-sets `applied_at` on first APPLIED transition
- `PUT  /:id` — update cv_version_id, cover_letter_id, notes, match_score
- `DELETE /:id` — delete application

### Cover Letters — `/api/cover-letters`
- `GET  /` — list cover letters (optional `?job_id=` filter); verifies job ownership
- `POST /` — create cover letter (`job_id`, `content` required); verifies job ownership
- `DELETE /:id` — delete cover letter; verifies job ownership

### Status History — `/api/status-history`
- `GET  /:applicationId` — get status history for an application; verifies application ownership

### AI — `/api/ai`
- `POST /analyze-job` — analyze a job with Claude (`job_id` required); returns `{ analysis }`
- `POST /recommend-cv` — analyze job + recommend best CV version (`job_id` required); returns `{ analysis, recommendation }`
- `POST /full-analysis` — analyze job + recommend CV + save AiAnalysis + update application match_score (`job_id` required); returns `{ analysis, recommendation, application_updated }`
- `GET  /analysis/:jobId` — retrieve saved AiAnalysis for a job (most recent)

### CV Generator — `/api/cv-generator`
- `POST /generate` — generate tailored CV HTML via Claude (`job_id`, `cv_version_id` required; job must have saved AiAnalysis; cv must have `plain_text`); returns `{ html, cvData }`
- `POST /download` — render HTML to PDF via Puppeteer (`html` required); returns binary PDF

### Profile — `/api/profile`
- `GET  /` — get or auto-create UserProfile for the user
- `PUT  /` — update `full_name`

---

## Auth

- All routes registered with `requireAuth` middleware (in `server/src/middleware/auth.js`)
- Middleware calls `supabase.auth.getUser(token)` and attaches the result to `req.user`
- `req.user.id` is the Supabase UUID used as `user_id` on all records
- `req.user.user_metadata` contains `full_name`, `avatar_url` from OAuth providers
- Only `GET /api/health` is public
- Frontend: `client.js` axios interceptor fetches `supabase.auth.getSession()` before every request and sets `Authorization: Bearer <token>`
- `AuthContext` listens to `supabase.auth.onAuthStateChange()` and exposes `{ user, session, loading, signOut }`
- `ProtectedRoute` redirects to `/login` if no user; shows full-screen spinner while loading

---

## Frontend Pages

| Page | Path | Description |
|---|---|---|
| Login | `/login` | Google OAuth, GitHub OAuth, Email/Password sign in + sign up |
| Dashboard | `/` | Stat cards (total, in-progress, interviews, offers) + recent applications table |
| Jobs | `/jobs` | Job list with add/edit/delete modals; AI full-analysis button; "Apply with this CV" → creates application then opens CvPreviewModal |
| CV Versions | `/cv-versions` | Manage CV versions with name, target_type, plain_text |
| Applications | `/applications` | Application list with status pipeline; create/update/delete; status change with history |
| Profile | `/profile` | Read-only email field; editable display name; saved to UserProfile |

---

## CSS Design System

All variables defined in `client/src/index.css`:

```css
/* Backgrounds */
--bg-base:     #0C0C14   /* page background */
--bg-surface:  #13131F   /* cards, panels */
--bg-elevated: #1A1A2E   /* dropdowns, modals */
--bg-input:    #0F0F1A   /* inputs */

/* Text */
--text-primary:   #E8E8FF
--text-secondary: #9999CC
--text-muted:     #5555AA

/* Borders */
--border-subtle:  #1E1E30
--border-default: #2A2A45
--border-active:  #7C6FF7

/* Accent (purple) */
--accent-primary: #7C6FF7
--accent-glow:    rgba(124,111,247,0.15)

/* Semantic */
--success:    #22C55E
--warning:    #F59E0B
--danger:     #EF4444
--info:       #60A5FA
```

- **Fonts:** Inter (body text), JetBrains Mono (numbers, dates, monospace)
- **Icons:** inline SVGs (lucide-react shapes); use `lucide-react` for new icons
- **Never hardcode colors** — always use CSS variables

---

## Common Commands

```bash
# From applyiq/ root:
npm run dev              # Run both frontend + backend (concurrently)
npm run server           # Backend only (node --watch)
npm run client           # Frontend only (vite dev)
npm run install:all      # Install deps for root + server + client

# Prisma (run from applyiq/ root):
npm run prisma:migrate   # Run migrations (prisma migrate dev)
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:studio    # Open Prisma Studio

# Or directly from server/:
npx prisma db push --schema=server/prisma/schema.prisma
npx prisma generate --schema=server/prisma/schema.prisma
```

---

## Environment Variables

**`server/.env`**
```
DATABASE_URL=          # Supabase pooled connection string (port 6543)
DIRECT_URL=            # Supabase direct connection string (port 5432)
SUPABASE_URL=          # https://<project>.supabase.co
SUPABASE_ANON_KEY=     # sb_publishable_... key
ANTHROPIC_API_KEY=     # sk-ant-... key
PORT=3001
CLIENT_URL=http://localhost:5173
```

**`client/.env`**
```
VITE_SUPABASE_URL=     # https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=# sb_publishable_... key
```

---

## Key Conventions

### API Responses
Every endpoint returns the same shape:
```json
{ "data": <payload or null>, "error": <string or null>, "message": "<human string>" }
```
Status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Server Error.

### Data Isolation
- Every `findMany` must include `where: { user_id: req.user.id }`
- Every `findUnique` must check `if (!record || record.user_id !== req.user.id)` → 404
- Every `create` must include `user_id: req.user.id` in `data`
- Models without direct `user_id` (CoverLetter, StatusHistory) are verified through the parent relation

### Frontend Data Fetching
- All server state via `@tanstack/react-query` hooks in `client/src/hooks/`
- Raw API functions in `client/src/api/` (imported by hooks)
- Mutations call `queryClient.invalidateQueries()` to refresh affected lists

### Module System
- ES Modules throughout: `import/export` everywhere — **never use `require()`**
- Server `package.json` has `"type": "module"`

### Node.js
- Using Node.js v24 — use `node --watch` (already configured in `npm run server`)
- Do **not** use nodemon

### Writing Large Files on Windows
- Shell heredocs with single quotes fail when JS content contains single quotes
- Solution: write a Python helper script to disk (`Write` tool), then `python3 script.py`
- Alternatively use `python3 -c` with carefully escaped strings

---

## Important Notes

- **Supabase free tier** pauses after 7 days of inactivity — `keepAlive.js` pings the DB every 5 days via `node-cron`
- **Puppeteer** uses headless Chromium; always pass `--no-sandbox` in `generatePdf()` (already done in `cvGeneratorService.js`)
- **Prisma generate DLL lock on Windows** — `npx prisma db push` may fail with `EPERM: rename .dll.node.tmp` on Windows; this is a known issue — the schema push still succeeds, restart the server to pick up changes
- **AI model:** `claude-sonnet-4-20250514` used in both `aiService.js` and `cvGeneratorService.js`
- **CvPreviewModal** uses `srcdoc` on an `<iframe>` for HTML preview; PDF download uses `responseType: 'arraybuffer'` → Blob → `URL.createObjectURL`
- **OAuth setup (Supabase Console):** Enable Google + GitHub providers at Authentication → Providers; set redirect URL to `http://localhost:5173`
- **user_id is nullable** (`String?`) on Job, CvVersion, Application, AiAnalysis — legacy rows before auth was added may have `null` user_id; new rows always have it set

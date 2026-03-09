# ApplyIQ — Job Application Tracker

Full-stack job application tracker built with React, Vite, Express, Prisma, and Supabase.

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite 5, Tailwind CSS 3        |
| Backend   | Node.js, Express 4                      |
| Database  | Supabase (PostgreSQL)                   |
| ORM       | Prisma 5                                |
| State     | TanStack Query v5                       |
| Routing   | React Router v6                         |

---

## Project Structure

```
applyiq/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios API clients (jobs, applications, cvVersions, coverLetters)
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # TanStack Query hooks
│   │   ├── pages/           # Page-level route components
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                  # Express API backend
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.js    # Prisma client singleton
│   │   │   └── supabase.js  # Supabase client
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── jobs.js
│   │   │   ├── applications.js
│   │   │   ├── cvVersions.js
│   │   │   └── coverLetters.js
│   │   └── index.js         # Express entry point
│   ├── uploads/             # CV file uploads (gitignored)
│   └── .env.example
├── package.json             # Root with concurrently scripts
└── .gitignore
```

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

---

## Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo>
cd applyiq
npm run install:all
```

### 2. Configure the server environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and fill in:

| Variable          | Where to find it                                         |
|-------------------|----------------------------------------------------------|
| `DATABASE_URL`    | Supabase → Settings → Database → Connection string (Transaction mode, port 6543) |
| `DIRECT_URL`      | Supabase → Settings → Database → Connection string (Session mode, port 5432) |
| `SUPABASE_URL`    | Supabase → Settings → API → Project URL                 |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key           |
| `OPENAI_API_KEY`  | https://platform.openai.com/api-keys                    |
| `PORT`            | Default `3001`                                          |

### 3. Run Prisma migrations

```bash
npm run prisma:migrate
# When prompted, enter a migration name e.g. "init"
```

Or, if you want to push the schema without a migration file (faster for early dev):

```bash
npm run prisma:push
```

### 4. Generate Prisma client

This runs automatically after `migrate`, but you can run it manually:

```bash
npm run prisma:generate
```

### 5. Create uploads directory

```bash
mkdir server/uploads
```

---

## Running the App

### Development (both servers simultaneously)

```bash
npm run dev
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:3001        |
| API docs | http://localhost:3001/api/health |

### Backend only

```bash
npm run server
```

### Frontend only

```bash
npm run client
```

### Prisma Studio (database GUI)

```bash
npm run prisma:studio
```

---

## API Endpoints

| Method | Path                            | Description               |
|--------|---------------------------------|---------------------------|
| GET    | /api/health                     | Health check              |
| GET    | /api/jobs                       | List all jobs             |
| POST   | /api/jobs                       | Create a job              |
| GET    | /api/jobs/:id                   | Get a job                 |
| PUT    | /api/jobs/:id                   | Update a job              |
| DELETE | /api/jobs/:id                   | Delete a job              |
| GET    | /api/cv-versions                | List all CV versions      |
| POST   | /api/cv-versions                | Upload a CV (multipart)   |
| DELETE | /api/cv-versions/:id            | Delete a CV version       |
| GET    | /api/cover-letters              | List cover letters        |
| POST   | /api/cover-letters              | Create a cover letter     |
| PUT    | /api/cover-letters/:id          | Update a cover letter     |
| DELETE | /api/cover-letters/:id          | Delete a cover letter     |
| GET    | /api/applications               | List applications         |
| POST   | /api/applications               | Create an application     |
| GET    | /api/applications/:id           | Get an application        |
| PUT    | /api/applications/:id           | Update an application     |
| PATCH  | /api/applications/:id/status    | Update status + log history |
| DELETE | /api/applications/:id           | Delete an application     |

---

## Database Schema Overview

```
Job ──< Application >── CvVersion
 │            │
 └─< CoverLetter      └─< StatusHistory
```

**ApplicationStatus** enum: `DRAFT → READY → APPLIED → OA → INTERVIEW → REJECTED / OFFER / WITHDRAWN`

**TargetType** (CV) enum: `FULLSTACK | BACKEND | DATA | STUDENT`

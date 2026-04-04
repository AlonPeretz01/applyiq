import 'dotenv/config'

// ─── Environment variable validation ─────────────────────────────────────────
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'PORT',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}
console.log('✅ All environment variables validated')

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import jobsRouter from './routes/jobs.js'
import cvVersionsRouter from './routes/cvVersions.js'
import applicationsRouter from './routes/applications.js'
import coverLettersRouter from './routes/coverLetters.js'
import statusHistoryRouter from './routes/statusHistory.js'
import aiRouter from './routes/ai.js'
import cvGeneratorRouter from './routes/cvGenerator.js'
import profileRouter from './routes/profile.js'
import analyticsRouter from './routes/analytics.js'
import creditsRouter from './routes/credits.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { startKeepAlive } from './lib/keepAlive.js'
import { requireAuth } from './middleware/auth.js'
import { generalLimiter, aiLimiter, cvLimiter } from './middleware/rateLimiter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://hire-track-seven.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ─── Health check — exempt from rate limiting ─────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() }, error: null, message: 'Server is healthy' })
)

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use(generalLimiter)
// Note: aiLimiter and cvLimiter are applied per-route AFTER requireAuth so req.user is available for skip()

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/jobs',          requireAuth, jobsRouter)
app.use('/api/cv-versions',   requireAuth, cvVersionsRouter)
app.use('/api/applications',  requireAuth, applicationsRouter)
app.use('/api/cover-letters', requireAuth, coverLettersRouter)
app.use('/api/status-history',requireAuth, statusHistoryRouter)
app.use('/api/ai',            requireAuth, aiLimiter, aiRouter)
app.use('/api/cv-generator',  requireAuth, cvLimiter, cvGeneratorRouter)
app.use('/api/profile',       requireAuth, profileRouter)
app.use('/api/analytics',     requireAuth, analyticsRouter)
app.use('/api/credits',       requireAuth, creditsRouter)

// ─── Error handling ──────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Global error handlers ───────────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason)
})

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err)
})

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] HireTrack API running on http://localhost:${PORT}`)
  startKeepAlive()
})

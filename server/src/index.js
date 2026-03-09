import 'dotenv/config'
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
import { errorHandler, notFound } from './middleware/errorHandler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ─── Routes ──────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() }, error: null, message: 'Server is healthy' })
)

app.use('/api/jobs', jobsRouter)
app.use('/api/cv-versions', cvVersionsRouter)
app.use('/api/applications', applicationsRouter)
app.use('/api/cover-letters', coverLettersRouter)
app.use('/api/status-history', statusHistoryRouter)
app.use('/api/ai', aiRouter)

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
  console.log(`[server] ApplyIQ API running on http://localhost:${PORT}`)
})

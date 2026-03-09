import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { analyzeJob, recommendCvVersion } from '../services/aiService.js'

const router = Router()

// ─── POST /api/ai/analyze-job ─────────────────────────────────────────────────
// Body: { job_id }
// Returns: { data: { analysis }, error, message }
router.post('/analyze-job', async (req, res, next) => {
  try {
    const { job_id } = req.body
    if (!job_id) {
      return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    }

    const job = await prisma.job.findUnique({ where: { id: job_id } })
    if (!job) {
      return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    }

    const jobText = [job.title, job.company_name, job.description].filter(Boolean).join('\n\n')

    let analysis
    try {
      analysis = await analyzeJob(jobText)
    } catch (parseErr) {
      return res.status(500).json({
        data: null,
        error: 'AI returned invalid JSON',
        message: `Failed to parse AI response: ${parseErr.message}`,
      })
    }

    res.json({ data: { analysis }, error: null, message: 'Job analyzed successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/ai/recommend-cv ────────────────────────────────────────────────
// Body: { job_id }
// Returns: { data: { analysis, recommendation }, error, message }
router.post('/recommend-cv', async (req, res, next) => {
  try {
    const { job_id } = req.body
    if (!job_id) {
      return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    }

    const job = await prisma.job.findUnique({ where: { id: job_id } })
    if (!job) {
      return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    }

    const cvVersions = await prisma.cvVersion.findMany({ orderBy: { created_at: 'desc' } })

    const jobText = [job.title, job.company_name, job.description].filter(Boolean).join('\n\n')

    let analysis
    try {
      analysis = await analyzeJob(jobText)
    } catch (parseErr) {
      return res.status(500).json({
        data: null,
        error: 'AI returned invalid JSON for job analysis',
        message: `Failed to parse AI response: ${parseErr.message}`,
      })
    }

    let recommendation
    try {
      recommendation = await recommendCvVersion(analysis, cvVersions)
    } catch (parseErr) {
      return res.status(500).json({
        data: null,
        error: 'AI returned invalid JSON for CV recommendation',
        message: `Failed to parse AI response: ${parseErr.message}`,
      })
    }

    res.json({
      data: { analysis, recommendation },
      error: null,
      message: cvVersions.length === 0
        ? 'Job analyzed. No CV versions found — add one to get CV recommendations.'
        : 'Job analyzed and CV recommendation generated',
    })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/ai/full-analysis ───────────────────────────────────────────────
// Body: { job_id }
// Runs analyze + recommend, and if an application exists for this job,
// saves the match_score back to the application record.
// Returns: { data: { analysis, recommendation, application_updated }, error, message }
router.post('/full-analysis', async (req, res, next) => {
  try {
    console.log('[full-analysis] STEP 1: request received, job_id =', req.body?.job_id)
    console.log('[full-analysis] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY)

    const { job_id } = req.body
    if (!job_id) {
      return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    }

    const job = await prisma.job.findUnique({ where: { id: job_id } })
    if (!job) {
      return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    }
    console.log('[full-analysis] STEP 2: job fetched —', job.title)

    const cvVersions = await prisma.cvVersion.findMany({ orderBy: { created_at: 'desc' } })
    console.log('[full-analysis] STEP 3: cvVersions fetched, count =', cvVersions.length)

    const jobText = [job.title, job.company_name, job.description].filter(Boolean).join('\n\n')
    console.log('[full-analysis] STEP 4: calling analyzeJob, jobText length =', jobText.length)

    let analysis
    try {
      analysis = await analyzeJob(jobText)
      console.log('[full-analysis] STEP 5: analyzeJob returned OK')
    } catch (err) {
      console.error('[full-analysis] STEP 5 ERROR: analyzeJob threw:', err)
      return res.status(500).json({
        data: null,
        error: 'AI analysis failed',
        message: err.message,
      })
    }

    console.log('[full-analysis] STEP 6: calling recommendCvVersion')
    let recommendation
    try {
      recommendation = await recommendCvVersion(analysis, cvVersions)
      console.log('[full-analysis] STEP 7: recommendCvVersion returned OK')
    } catch (err) {
      console.error('[full-analysis] STEP 7 ERROR: recommendCvVersion threw:', err)
      return res.status(500).json({
        data: null,
        error: 'CV recommendation failed',
        message: err.message,
      })
    }

    // If there's an application for this job and we have a match score, save it
    let application_updated = false
    if (recommendation.match_score != null && recommendation.match_score > 0) {
      const application = await prisma.application.findFirst({
        where: { job_id },
        orderBy: { applied_at: 'desc' },
      })
      if (application) {
        await prisma.application.update({
          where: { id: application.id },
          data: { match_score: Math.round(recommendation.match_score) },
        })
        application_updated = true
      }
    }
    console.log('[full-analysis] STEP 8: application_updated =', application_updated, '— sending response')

    res.json({
      data: { analysis, recommendation, application_updated },
      error: null,
      message: application_updated
        ? 'Full analysis complete — match score saved to application'
        : 'Full analysis complete',
    })
  } catch (err) {
    console.error('[full-analysis] OUTER CATCH:', err)
    next(err)
  }
})

export default router

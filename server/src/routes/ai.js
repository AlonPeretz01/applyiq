import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { analyzeJob, recommendCvVersion } from '../services/aiService.js'
import { checkCredits } from '../middleware/checkCredits.js'

const router = Router()

// POST /api/ai/analyze-job
router.post('/analyze-job', checkCredits('ai'), async (req, res, next) => {
  try {
    const { job_id } = req.body
    if (!job_id) return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    const job = await prisma.job.findUnique({ where: { id: job_id } })
    if (!job || job.user_id !== req.user.id) return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    const jobText = [job.title, job.company_name, job.description].filter(Boolean).join('\n\n')
    let analysis
    try { analysis = await analyzeJob(jobText) } catch (parseErr) {
      return res.status(500).json({ data: null, error: 'AI returned invalid JSON', message: parseErr.message })
    }
    res.json({ data: { analysis }, error: null, message: 'Job analyzed successfully' })
  } catch (err) { next(err) }
})

// POST /api/ai/recommend-cv
router.post('/recommend-cv', async (req, res, next) => {
  try {
    const { job_id } = req.body
    if (!job_id) return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    const job = await prisma.job.findUnique({ where: { id: job_id } })
    if (!job || job.user_id !== req.user.id) return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    const cvVersions = await prisma.cvVersion.findMany({ where: { user_id: req.user.id }, orderBy: { created_at: 'desc' } })
    const jobText = [job.title, job.company_name, job.description].filter(Boolean).join('\n\n')
    let analysis
    try { analysis = await analyzeJob(jobText) } catch (parseErr) {
      return res.status(500).json({ data: null, error: 'AI returned invalid JSON for job analysis', message: parseErr.message })
    }
    let recommendation
    try { recommendation = await recommendCvVersion(analysis, cvVersions) } catch (parseErr) {
      return res.status(500).json({ data: null, error: 'AI returned invalid JSON for CV recommendation', message: parseErr.message })
    }
    res.json({ data: { analysis, recommendation }, error: null, message: cvVersions.length === 0 ? 'Job analyzed. No CV versions found.' : 'Job analyzed and CV recommendation generated' })
  } catch (err) { next(err) }
})

// POST /api/ai/full-analysis
router.post('/full-analysis', checkCredits('ai'), async (req, res, next) => {
  try {
    console.log('[full-analysis] STEP 1: request received, job_id =', req.body?.job_id)
    console.log('[full-analysis] ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY)
    const { job_id } = req.body
    if (!job_id) return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    const job = await prisma.job.findUnique({ where: { id: job_id } })
    if (!job || job.user_id !== req.user.id) return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    console.log('[full-analysis] STEP 2: job fetched -', job.title)
    const cvVersions = await prisma.cvVersion.findMany({ where: { user_id: req.user.id }, orderBy: { created_at: 'desc' } })
    console.log('[full-analysis] STEP 3: cvVersions count =', cvVersions.length)
    const jobText = [job.title, job.company_name, job.description].filter(Boolean).join('\n\n')
    let analysis
    try {
      analysis = await analyzeJob(jobText)
      console.log('[full-analysis] STEP 5: analyzeJob OK')
    } catch (err) {
      console.error('[full-analysis] STEP 5 ERROR:', err)
      return res.status(500).json({ data: null, error: 'AI analysis failed', message: err.message })
    }
    let recommendation
    try {
      recommendation = await recommendCvVersion(analysis, cvVersions)
      console.log('[full-analysis] STEP 7: recommendCvVersion OK')
    } catch (err) {
      console.error('[full-analysis] STEP 7 ERROR:', err)
      return res.status(500).json({ data: null, error: 'CV recommendation failed', message: err.message })
    }
    await prisma.aiAnalysis.deleteMany({ where: { job_id, user_id: req.user.id } })
    const savedAnalysis = await prisma.aiAnalysis.create({
      data: {
        user_id:           req.user.id,
        job_id,
        required_skills:   analysis.required_skills   ?? [],
        technologies:      analysis.technologies       ?? [],
        experience_years:  analysis.experience_years != null ? Math.round(analysis.experience_years) : null,
        job_type:          analysis.job_type           ?? null,
        seniority:         analysis.seniority          ?? null,
        keywords:          analysis.keywords           ?? [],
        summary:           analysis.summary            ?? null,
        match_tips:        analysis.match_tips         ?? [],
        recommended_cv_id: recommendation.recommended_cv_id ?? null,
        match_score:       recommendation.match_score != null ? Math.round(recommendation.match_score) : null,
        reason:            recommendation.reason       ?? null,
        suggested_tweaks:  recommendation.suggested_tweaks  ?? [],
      },
    })
    console.log('[full-analysis] SAVED OK, id:', savedAnalysis.id)
    let application_updated = false
    if (recommendation.match_score != null && recommendation.match_score > 0) {
      const application = await prisma.application.findFirst({ where: { job_id, user_id: req.user.id }, orderBy: { applied_at: 'desc' } })
      if (application) {
        await prisma.application.update({ where: { id: application.id }, data: { match_score: Math.round(recommendation.match_score) } })
        application_updated = true
      }
    }
    res.json({ data: { analysis, recommendation, application_updated }, error: null, message: application_updated ? 'Full analysis complete - match score saved' : 'Full analysis complete' })
  } catch (err) {
    console.error('[full-analysis] OUTER CATCH:', err)
    next(err)
  }
})

// GET /api/ai/analysis/:jobId
router.get('/analysis/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params
    console.log('[get-analysis] jobId received:', jobId)
    const saved = await prisma.aiAnalysis.findFirst({ where: { job_id: jobId, user_id: req.user.id }, orderBy: { created_at: 'desc' } })
    console.log('[get-analysis] result:', saved ? 'found id=' + saved.id : 'null')
    res.set('Cache-Control', 'no-store')
    res.json({ data: saved ?? null, error: null, message: saved ? 'Analysis found' : 'No analysis found' })
  } catch (err) { next(err) }
})

export default router

import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { generateTailoredCv, renderCvHtml, generatePdf } from '../services/cvGeneratorService.js'

const router = Router()

router.post('/generate', async (req, res, next) => {
  try {
    const { job_id, cv_version_id } = req.body
    if (!job_id || !cv_version_id) {
      return res.status(400).json({ data: null, error: 'job_id and cv_version_id are required', message: 'Missing required fields' })
    }
    const [job, cvVersion, analysis, profile] = await Promise.all([
      prisma.job.findUnique({ where: { id: job_id } }),
      prisma.cvVersion.findUnique({ where: { id: cv_version_id } }),
      prisma.aiAnalysis.findFirst({ where: { job_id, user_id: req.user.id }, orderBy: { created_at: 'desc' } }),
      prisma.userProfile.findUnique({ where: { user_id: req.user.id } }),
    ])
    if (!job || job.user_id !== req.user.id) return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    if (!cvVersion || cvVersion.user_id !== req.user.id) return res.status(404).json({ data: null, error: 'CV version not found', message: 'CV version not found' })
    if (!analysis) return res.status(400).json({ data: null, error: 'No analysis found for this job. Please analyze the job first.', message: 'Please analyze this job first' })
    if (!cvVersion.plain_text) return res.status(400).json({ data: null, error: 'CV version has no plain text content', message: 'Add plain text to your CV version before generating' })

    const jobAnalysis = { required_skills: analysis.required_skills, technologies: analysis.technologies, keywords: analysis.keywords, match_tips: analysis.match_tips, summary: analysis.summary, seniority: analysis.seniority, job_type: analysis.job_type }
    const recommendation = { recommended_cv_id: analysis.recommended_cv_id, match_score: analysis.match_score, reason: analysis.reason, suggested_tweaks: analysis.suggested_tweaks }

    console.log('[cv-generator/generate] calling Claude for job:', job.title, '- cv:', cvVersion.name)
    const cvData = await generateTailoredCv(cvVersion.plain_text, jobAnalysis, recommendation, profile)
    const html = renderCvHtml(cvData)
    res.json({ data: { html, cvData }, error: null, message: 'CV generated successfully' })
  } catch (err) { next(err) }
})

router.post('/download', async (req, res, next) => {
  try {
    const { html } = req.body
    if (!html) return res.status(400).json({ data: null, error: 'html is required', message: 'Missing HTML content' })
    console.log('[cv-generator/download] generating PDF, html length:', html.length)
    const pdfBuffer = await generatePdf(html)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="cv_applyiq.pdf"')
    res.setHeader('Content-Length', pdfBuffer.length)
    res.end(pdfBuffer)
  } catch (err) { next(err) }
})

export default router

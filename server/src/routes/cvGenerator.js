import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { supabaseAdmin } from '../lib/supabase.js'
import { generateTailoredCv, renderCvHtml, generatePdf } from '../services/cvGeneratorService.js'
import { checkCredits } from '../middleware/checkCredits.js'

const router = Router()

router.post('/generate', checkCredits('cv'), async (req, res, next) => {
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
    const { html, jobId, returnUrl } = req.body
    if (!html) return res.status(400).json({ data: null, error: 'html is required', message: 'Missing HTML content' })

    console.log('[cv-generator/download] generating PDF, html length:', html.length, 'returnUrl:', !!returnUrl)
    const pdfBuffer = await generatePdf(html)

    // ── Upload to Supabase Storage ──────────────────────────────────────────────
    let savedUrl = null
    if (jobId) {
      try {
        const userId = req.user.id
        const fileName = `ai_${userId}_${jobId}_${Date.now()}.pdf`
        const { error: uploadError } = await supabaseAdmin.storage
          .from('cv-files')
          .upload(fileName, pdfBuffer, { contentType: 'application/pdf' })

        if (uploadError) {
          console.warn('[cv-generator/download] storage upload failed:', uploadError.message)
        } else {
          const { data: urlData } = supabaseAdmin.storage
            .from('cv-files')
            .getPublicUrl(fileName)
          savedUrl = urlData.publicUrl
          console.log('[cv-generator/download] CV saved to storage:', savedUrl)

          // If not returnUrl mode, also update any existing application (legacy path)
          if (!returnUrl) {
            await prisma.application.updateMany({
              where: { job_id: jobId, user_id: userId },
              data: { generated_cv_url: savedUrl, generated_cv_html: html },
            })
          }
        }
      } catch (storageErr) {
        console.warn('[cv-generator/download] storage/db save failed (non-fatal):', storageErr.message)
      }
    }

    // ── returnUrl mode: return JSON with the storage URL ───────────────────────
    if (returnUrl) {
      return res.json({ data: { url: savedUrl }, error: null, message: savedUrl ? 'PDF saved to storage' : 'PDF generated but storage upload failed' })
    }

    // ── Default mode: return binary PDF ───────────────────────────────────────
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="cv_hiretrack.pdf"')
    res.setHeader('Content-Length', pdfBuffer.length)
    res.end(pdfBuffer)
  } catch (err) { next(err) }
})

// GET /api/cv-generator/download/:applicationId
// Returns the stored CV URL and HTML for a given application
router.get('/download/:applicationId', async (req, res, next) => {
  try {
    const app = await prisma.application.findUnique({
      where: { id: req.params.applicationId },
      select: { id: true, user_id: true, generated_cv_url: true, generated_cv_html: true },
    })
    if (!app || app.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Application not found', message: 'Application not found' })
    }
    if (!app.generated_cv_url) {
      return res.status(404).json({ data: null, error: 'No CV stored for this application', message: 'No CV stored yet' })
    }
    res.json({
      data: { generated_cv_url: app.generated_cv_url, generated_cv_html: app.generated_cv_html },
      error: null,
      message: 'CV retrieved successfully',
    })
  } catch (err) { next(err) }
})

export default router

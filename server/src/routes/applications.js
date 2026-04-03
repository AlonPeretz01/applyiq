import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

const VALID_STATUSES = ['DRAFT', 'READY', 'APPLIED', 'OA', 'INTERVIEW', 'REJECTED', 'OFFER', 'WITHDRAWN']

const applicationInclude = {
  job: true,
  cv_version: true,
  cover_letter: true,
  status_history: { orderBy: { changed_at: 'desc' } },
}

// ─── GET /api/applications ────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        data: null,
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }
    const applications = await prisma.application.findMany({
      where: { user_id: req.user.id, ...(status ? { status } : {}) },
      include: applicationInclude,
      orderBy: { updated_at: 'desc' },
    })
    res.json({ data: applications, error: null, message: 'Applications retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/applications/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: applicationInclude,
    })
    if (!application || application.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Application not found', message: 'Application not found' })
    }
    res.json({ data: application, error: null, message: 'Application retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/applications ───────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { job_id, cv_version_id, cover_letter_id, notes, match_score } = req.body
    console.log('[POST /applications] body:', req.body)
    if (!job_id) {
      return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    }
    if (!cv_version_id) {
      return res.status(400).json({ data: null, error: 'cv_version_id is required', message: 'cv_version_id is required' })
    }
    if (match_score !== undefined && match_score !== null && (typeof match_score !== 'number' || match_score < 0 || match_score > 100)) {
      return res.status(400).json({ data: null, error: 'match_score must be a number between 0 and 100', message: 'match_score must be a number between 0 and 100' })
    }
    const application = await prisma.application.create({
      data: {
        user_id:         req.user.id,
        job_id,
        cv_version_id,
        cover_letter_id: cover_letter_id ?? null,
        notes:           notes ?? null,
        match_score:     match_score ?? null,
        status_history: {
          create: { new_status: 'DRAFT', note: 'Application created' },
        },
      },
      include: applicationInclude,
    })
    res.status(201).json({ data: application, error: null, message: 'Application created successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── PATCH /api/applications/:id/status ──────────────────────────────────────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body
    if (!status) {
      return res.status(400).json({ data: null, error: 'status is required', message: 'status is required' })
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        data: null,
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
        message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      })
    }
    const current = await prisma.application.findUnique({
      where: { id: req.params.id },
      select: { status: true, applied_at: true, user_id: true },
    })
    if (!current || current.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Application not found', message: 'Application not found' })
    }
    const application = await prisma.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id: req.params.id },
        data: {
          status,
          ...(status === 'APPLIED' && !current.applied_at && { applied_at: new Date() }),
        },
        include: applicationInclude,
      })
      await tx.statusHistory.create({
        data: {
          application_id: req.params.id,
          old_status: current.status,
          new_status: status,
          note: note ?? null,
        },
      })
      return updated
    })
    res.json({ data: application, error: null, message: `Status updated to ${status}` })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/applications/:id ────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.application.findUnique({ where: { id: req.params.id }, select: { user_id: true } })
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Application not found', message: 'Application not found' })
    }
    const { cv_version_id, cover_letter_id, notes, match_score, generated_cv_url } = req.body
    if (match_score !== undefined && match_score !== null) {
      if (typeof match_score !== 'number' || match_score < 0 || match_score > 100) {
        return res.status(400).json({ data: null, error: 'match_score must be a number between 0 and 100', message: 'match_score must be a number between 0 and 100' })
      }
    }
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: {
        ...(cv_version_id !== undefined && { cv_version_id }),
        ...(cover_letter_id !== undefined && { cover_letter_id }),
        ...(notes !== undefined && { notes }),
        ...(match_score !== undefined && { match_score }),
        ...(generated_cv_url !== undefined && { generated_cv_url }),
      },
      include: applicationInclude,
    })
    res.json({ data: application, error: null, message: 'Application updated successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── DELETE /api/applications/:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.application.findUnique({ where: { id: req.params.id }, select: { user_id: true } })
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Application not found', message: 'Application not found' })
    }
    await prisma.application.delete({ where: { id: req.params.id } })
    res.json({ data: null, error: null, message: 'Application deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router

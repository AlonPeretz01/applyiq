import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

const jobSelect = { select: { id: true, company_name: true, title: true } }

// ─── GET /api/cover-letters ───────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { job_id } = req.query
    const letters = await prisma.coverLetter.findMany({
      where: job_id ? { job_id } : undefined,
      include: { job: jobSelect },
      orderBy: { created_at: 'desc' },
    })
    res.json({ data: letters, error: null, message: 'Cover letters retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/cover-letters ──────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { job_id, content } = req.body

    if (!job_id) {
      return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    }
    if (!content?.trim()) {
      return res.status(400).json({ data: null, error: 'content is required', message: 'content is required' })
    }

    const letter = await prisma.coverLetter.create({
      data: { job_id, content: content.trim() },
      include: { job: jobSelect },
    })
    res.status(201).json({ data: letter, error: null, message: 'Cover letter created successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── DELETE /api/cover-letters/:id ────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.coverLetter.delete({ where: { id: req.params.id } })
    res.json({ data: null, error: null, message: 'Cover letter deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router

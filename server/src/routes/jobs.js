import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json({ data: jobs, error: null, message: 'Jobs retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        applications: {
          include: { cv_version: true, cover_letter: true },
          orderBy: { updated_at: 'desc' },
        },
        cover_letters: { orderBy: { created_at: 'desc' } },
      },
    })
    if (!job || job.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    }
    res.json({ data: job, error: null, message: 'Job retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/jobs ───────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { company_name, title, description, url, source } = req.body
    if (!company_name?.trim()) {
      return res.status(400).json({ data: null, error: 'company_name is required', message: 'company_name is required' })
    }
    if (!title?.trim()) {
      return res.status(400).json({ data: null, error: 'title is required', message: 'title is required' })
    }
    const job = await prisma.job.create({
      data: {
        user_id:      req.user.id,
        company_name: company_name.trim(),
        title:        title.trim(),
        description:  description ?? null,
        url:          url ?? null,
        source:       source ?? null,
      },
    })
    res.status(201).json({ data: job, error: null, message: 'Job created successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/jobs/:id ────────────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id }, select: { user_id: true } })
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    }
    const { company_name, title, description, url, source } = req.body
    if (company_name !== undefined && !company_name?.trim()) {
      return res.status(400).json({ data: null, error: 'company_name cannot be blank', message: 'company_name cannot be blank' })
    }
    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ data: null, error: 'title cannot be blank', message: 'title cannot be blank' })
    }
    const job = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        ...(company_name !== undefined && { company_name: company_name.trim() }),
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(url !== undefined && { url }),
        ...(source !== undefined && { source }),
      },
    })
    res.json({ data: job, error: null, message: 'Job updated successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.job.findUnique({ where: { id: req.params.id }, select: { user_id: true } })
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    }
    await prisma.job.delete({ where: { id: req.params.id } })
    res.json({ data: null, error: null, message: 'Job deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router

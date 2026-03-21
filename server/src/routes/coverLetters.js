import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()
const jobSelect = { select: { id: true, company_name: true, title: true } }

router.get('/', async (req, res, next) => {
  try {
    const { job_id } = req.query
    const letters = await prisma.coverLetter.findMany({
      where: { job: { user_id: req.user.id }, ...(job_id ? { job_id } : {}) },
      include: { job: jobSelect },
      orderBy: { created_at: 'desc' },
    })
    res.json({ data: letters, error: null, message: 'Cover letters retrieved successfully' })
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const { job_id, content } = req.body
    if (!job_id) return res.status(400).json({ data: null, error: 'job_id is required', message: 'job_id is required' })
    if (!content?.trim()) return res.status(400).json({ data: null, error: 'content is required', message: 'content is required' })
    const job = await prisma.job.findUnique({ where: { id: job_id }, select: { user_id: true } })
    if (!job || job.user_id !== req.user.id) return res.status(404).json({ data: null, error: 'Job not found', message: 'Job not found' })
    const letter = await prisma.coverLetter.create({ data: { job_id, content: content.trim() }, include: { job: jobSelect } })
    res.status(201).json({ data: letter, error: null, message: 'Cover letter created successfully' })
  } catch (err) { next(err) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const letter = await prisma.coverLetter.findUnique({ where: { id: req.params.id }, include: { job: { select: { user_id: true } } } })
    if (!letter || letter.job?.user_id !== req.user.id) return res.status(404).json({ data: null, error: 'Cover letter not found', message: 'Cover letter not found' })
    await prisma.coverLetter.delete({ where: { id: req.params.id } })
    res.json({ data: null, error: null, message: 'Cover letter deleted successfully' })
  } catch (err) { next(err) }
})

export default router

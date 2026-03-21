import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

const VALID_TARGET_TYPES = ['FULLSTACK', 'BACKEND', 'DATA', 'STUDENT']

// ─── GET /api/cv-versions ─────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const versions = await prisma.cvVersion.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
    })
    res.json({ data: versions, error: null, message: 'CV versions retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── GET /api/cv-versions/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const cv = await prisma.cvVersion.findUnique({ where: { id: req.params.id } })
    if (!cv || cv.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'CV version not found', message: 'CV version not found' })
    }
    res.json({ data: cv, error: null, message: 'CV version retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── POST /api/cv-versions ────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { name, target_type, plain_text } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ data: null, error: 'name is required', message: 'name is required' })
    }
    if (!target_type) {
      return res.status(400).json({ data: null, error: 'target_type is required', message: 'target_type is required' })
    }
    if (!VALID_TARGET_TYPES.includes(target_type)) {
      return res.status(400).json({
        data: null,
        error: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}`,
        message: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}`,
      })
    }
    const cv = await prisma.cvVersion.create({
      data: {
        user_id:    req.user.id,
        name:       name.trim(),
        target_type,
        plain_text: plain_text ?? null,
        file_url:   null,
      },
    })
    res.status(201).json({ data: cv, error: null, message: 'CV version created successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/cv-versions/:id ─────────────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.cvVersion.findUnique({ where: { id: req.params.id }, select: { user_id: true } })
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'CV version not found', message: 'CV version not found' })
    }
    const { name, target_type, plain_text } = req.body
    if (name !== undefined && !name?.trim()) {
      return res.status(400).json({ data: null, error: 'name cannot be blank', message: 'name cannot be blank' })
    }
    if (target_type !== undefined && !VALID_TARGET_TYPES.includes(target_type)) {
      return res.status(400).json({
        data: null,
        error: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}`,
        message: `target_type must be one of: ${VALID_TARGET_TYPES.join(', ')}`,
      })
    }
    const cv = await prisma.cvVersion.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(target_type !== undefined && { target_type }),
        ...(plain_text !== undefined && { plain_text }),
      },
    })
    res.json({ data: cv, error: null, message: 'CV version updated successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── DELETE /api/cv-versions/:id ──────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.cvVersion.findUnique({ where: { id: req.params.id }, select: { user_id: true } })
    if (!existing || existing.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'CV version not found', message: 'CV version not found' })
    }
    await prisma.cvVersion.delete({ where: { id: req.params.id } })
    res.json({ data: null, error: null, message: 'CV version deleted successfully' })
  } catch (err) {
    next(err)
  }
})

export default router

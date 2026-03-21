import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// ─── GET /api/profile ─────────────────────────────────────────────────────────
// Get or create the UserProfile for the authenticated user.
router.get('/', async (req, res, next) => {
  try {
    let profile = await prisma.userProfile.findUnique({
      where: { user_id: req.user.id },
    })
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          user_id:    req.user.id,
          full_name:  req.user.user_metadata?.full_name ?? req.user.user_metadata?.name ?? null,
          avatar_url: req.user.user_metadata?.avatar_url ?? null,
        },
      })
    }
    res.json({ data: profile, error: null, message: 'Profile retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
// Update display name for the authenticated user.
router.put('/', async (req, res, next) => {
  try {
    const { full_name } = req.body
    const profile = await prisma.userProfile.upsert({
      where:  { user_id: req.user.id },
      update: { full_name: full_name ?? null },
      create: { user_id: req.user.id, full_name: full_name ?? null },
    })
    res.json({ data: profile, error: null, message: 'Profile updated successfully' })
  } catch (err) {
    next(err)
  }
})

export default router

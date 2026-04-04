import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

const LIMITS = {
  pilot:  { ai_analyses: 5,      cv_generated: 3      },
  pro:    { ai_analyses: 100,    cv_generated: 50     },
  elite:  { ai_analyses: 999999, cv_generated: 999999 },
}

// GET /api/credits
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id

    let credits = await prisma.userCredits.upsert({
      where:  { user_id: userId },
      create: { user_id: userId },
      update: {},
    })

    // Reset if new month
    const now     = new Date()
    const resetAt = new Date(credits.reset_at)
    if (
      now.getMonth()    !== resetAt.getMonth() ||
      now.getFullYear() !== resetAt.getFullYear()
    ) {
      credits = await prisma.userCredits.update({
        where: { user_id: userId },
        data:  { ai_analyses_used: 0, cv_generated_used: 0, reset_at: now },
      })
    }

    const limits = LIMITS[credits.plan] || LIMITS.pilot

    res.json({
      data: {
        plan:               credits.plan,
        ai_analyses_used:   credits.ai_analyses_used,
        ai_analyses_limit:  limits.ai_analyses,
        cv_generated_used:  credits.cv_generated_used,
        cv_generated_limit: limits.cv_generated,
        reset_at:           credits.reset_at,
      },
      error:   null,
      message: 'Credits retrieved',
    })
  } catch (err) { next(err) }
})

export default router

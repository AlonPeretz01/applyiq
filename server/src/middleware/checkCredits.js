import prisma from '../lib/prisma.js'

const ADMIN_EMAILS = ['alonperetz2001@gmail.com']

const LIMITS = {
  pilot:  { ai_analyses: 5,      cv_generated: 3      },
  pro:    { ai_analyses: 100,    cv_generated: 50     },
  elite:  { ai_analyses: 999999, cv_generated: 999999 },
}

export function checkCredits(type) {
  return async (req, res, next) => {
    // Admin bypass
    if (ADMIN_EMAILS.includes(req.user?.email)) return next()

    const userId = req.user.id

    // Get or create credits record
    let credits = await prisma.userCredits.upsert({
      where:  { user_id: userId },
      create: { user_id: userId },
      update: {},
    })

    // Reset counters if we've crossed into a new month
    const now     = new Date()
    const resetAt = new Date(credits.reset_at)
    if (
      now.getMonth()     !== resetAt.getMonth() ||
      now.getFullYear()  !== resetAt.getFullYear()
    ) {
      credits = await prisma.userCredits.update({
        where: { user_id: userId },
        data:  { ai_analyses_used: 0, cv_generated_used: 0, reset_at: now },
      })
    }

    const limits = LIMITS[credits.plan] || LIMITS.pilot
    const used   = type === 'ai' ? credits.ai_analyses_used  : credits.cv_generated_used
    const limit  = type === 'ai' ? limits.ai_analyses        : limits.cv_generated

    if (used >= limit) {
      return res.status(402).json({
        data:    null,
        error:   'Credit limit reached',
        message: type === 'ai'
          ? `You've used all ${limit} AI analyses for this month. Resets on the 1st.`
          : `You've used all ${limit} CV generations for this month. Resets on the 1st.`,
        credits: { used, limit, reset_at: credits.reset_at },
      })
    }

    // Consume one credit
    await prisma.userCredits.update({
      where: { user_id: userId },
      data:  type === 'ai'
        ? { ai_analyses_used:  { increment: 1 } }
        : { cv_generated_used: { increment: 1 } },
    })

    next()
  }
}

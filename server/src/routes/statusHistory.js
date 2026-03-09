import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// ─── GET /api/status-history/:applicationId ───────────────────────────────────
// Returns the full status change log for a given application, newest first.
router.get('/:applicationId', async (req, res, next) => {
  try {
    const { applicationId } = req.params

    // Verify the application exists before querying history
    await prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      select: { id: true },
    })

    const history = await prisma.statusHistory.findMany({
      where: { application_id: applicationId },
      orderBy: { changed_at: 'desc' },
    })

    res.json({
      data: history,
      error: null,
      message: `Status history for application ${applicationId} retrieved successfully`,
    })
  } catch (err) {
    next(err)
  }
})

export default router

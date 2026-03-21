import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

router.get('/:applicationId', async (req, res, next) => {
  try {
    const { applicationId } = req.params
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true, user_id: true },
    })
    if (!application || application.user_id !== req.user.id) {
      return res.status(404).json({ data: null, error: 'Application not found', message: 'Application not found' })
    }
    const history = await prisma.statusHistory.findMany({
      where: { application_id: applicationId },
      orderBy: { changed_at: 'desc' },
    })
    res.json({ data: history, error: null, message: 'Status history retrieved successfully' })
  } catch (err) { next(err) }
})

export default router

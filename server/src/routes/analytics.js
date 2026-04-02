import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user.id

    const [applications, analyses] = await Promise.all([
      prisma.application.findMany({
        where: { user_id: userId },
        include: {
          cv_version: { select: { id: true, name: true, target_type: true } },
        },
      }),
      prisma.aiAnalysis.findMany({
        where: { user_id: userId },
        select: { technologies: true, match_score: true },
      }),
    ])

    const total_applications = applications.length

    // ─── Status counts ─────────────────────────────────────────────────────────
    const STATUS_KEYS = ['DRAFT', 'READY', 'APPLIED', 'OA', 'INTERVIEW', 'REJECTED', 'OFFER', 'WITHDRAWN']
    const by_status = Object.fromEntries(STATUS_KEYS.map(s => [s, 0]))
    for (const app of applications) {
      if (by_status[app.status] !== undefined) by_status[app.status]++
    }

    const total_interviews = by_status.INTERVIEW + by_status.OFFER
    const total_offers = by_status.OFFER

    // ─── Rate calculations ─────────────────────────────────────────────────────
    // "Submitted" = moved past DRAFT/READY into the pipeline
    const SUBMITTED = new Set(['APPLIED', 'OA', 'INTERVIEW', 'REJECTED', 'OFFER', 'WITHDRAWN'])
    const submittedCount = applications.filter(a => SUBMITTED.has(a.status)).length

    const interview_rate = submittedCount > 0
      ? Math.round(((by_status.INTERVIEW + by_status.OFFER) / submittedCount) * 100)
      : 0
    const offer_rate = submittedCount > 0
      ? Math.round((by_status.OFFER / submittedCount) * 100)
      : 0

    // Response = any non-APPLIED signal: OA, Interview, Rejected, Offer
    const RESPONDED = new Set(['OA', 'INTERVIEW', 'REJECTED', 'OFFER'])
    const responded = applications.filter(a => RESPONDED.has(a.status)).length
    const response_rate = submittedCount > 0
      ? Math.round((responded / submittedCount) * 100)
      : 0

    // ─── Avg match score from AI analyses ──────────────────────────────────────
    const scores = analyses.filter(a => a.match_score != null).map(a => a.match_score)
    const avg_match_score = scores.length > 0
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : 0

    // ─── Recency counts ────────────────────────────────────────────────────────
    const now = new Date()
    const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7)
    const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1)

    // Use applied_at if set (submitted apps), else updated_at as proxy
    function appDate(a) {
      return a.applied_at ? new Date(a.applied_at) : new Date(a.updated_at)
    }

    const applications_this_week  = applications.filter(a => appDate(a) >= weekAgo).length
    const applications_this_month = applications.filter(a => appDate(a) >= monthAgo).length

    // ─── Top technologies ──────────────────────────────────────────────────────
    const techCounts = {}
    for (const analysis of analyses) {
      for (const tech of (analysis.technologies || [])) {
        techCounts[tech] = (techCounts[tech] || 0) + 1
      }
    }
    const top_technologies = Object.entries(techCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))

    // ─── Applications over time (last 30 days) ─────────────────────────────────
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const dailyCounts = {}
    for (let d = 0; d < 30; d++) {
      const day = new Date(thirtyDaysAgo)
      day.setDate(thirtyDaysAgo.getDate() + d)
      dailyCounts[day.toISOString().slice(0, 10)] = 0
    }
    for (const app of applications) {
      const d = appDate(app)
      if (d >= thirtyDaysAgo) {
        const key = d.toISOString().slice(0, 10)
        if (key in dailyCounts) dailyCounts[key]++
      }
    }
    const applications_over_time = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))

    // ─── CV performance ────────────────────────────────────────────────────────
    const cvMap = {}
    for (const app of applications) {
      const cv = app.cv_version
      if (!cv) continue
      if (!cvMap[cv.id]) {
        cvMap[cv.id] = { cv_name: cv.name, cv_type: cv.target_type, uses: 0, scoreSum: 0, scoreCount: 0, interviews: 0 }
      }
      cvMap[cv.id].uses++
      if (app.match_score != null) {
        cvMap[cv.id].scoreSum  += app.match_score
        cvMap[cv.id].scoreCount++
      }
      if (app.status === 'INTERVIEW' || app.status === 'OFFER') {
        cvMap[cv.id].interviews++
      }
    }
    const cv_performance = Object.values(cvMap)
      .map(cv => ({
        cv_name:    cv.cv_name,
        cv_type:    cv.cv_type,
        uses:       cv.uses,
        avg_match:  cv.scoreCount > 0 ? Math.round(cv.scoreSum / cv.scoreCount) : null,
        interviews: cv.interviews,
      }))
      .sort((a, b) => b.uses - a.uses)

    res.json({
      data: {
        total_applications,
        by_status,
        total_interviews,
        total_offers,
        interview_rate,
        offer_rate,
        avg_match_score,
        applications_this_week,
        applications_this_month,
        top_technologies,
        applications_over_time,
        cv_performance,
        response_rate,
      },
      error: null,
      message: 'Analytics fetched successfully',
    })
  } catch (err) {
    next(err)
  }
})

export default router

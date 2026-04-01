import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// ─── GET /api/profile ─────────────────────────────────────────────────────────
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
          skills:     [],
        },
      })
    }
    res.json({ data: profile, error: null, message: 'Profile retrieved successfully' })
  } catch (err) {
    next(err)
  }
})

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
router.put('/', async (req, res, next) => {
  try {
    const {
      full_name,
      headline,
      location,
      summary,
      target_role,
      target_seniority,
      years_experience,
      skills,
      github_url,
      linkedin_url,
      portfolio_url,
    } = req.body

    const data = {
      full_name:        full_name        != null ? String(full_name).trim()   || null : undefined,
      headline:         headline         != null ? String(headline).trim()    || null : undefined,
      location:         location         != null ? String(location).trim()    || null : undefined,
      summary:          summary          != null ? String(summary).trim()     || null : undefined,
      target_role:      target_role      != null ? String(target_role).trim() || null : undefined,
      target_seniority: target_seniority != null ? target_seniority           || null : undefined,
      github_url:       github_url       != null ? String(github_url).trim()  || null : undefined,
      linkedin_url:     linkedin_url     != null ? String(linkedin_url).trim()|| null : undefined,
      portfolio_url:    portfolio_url    != null ? String(portfolio_url).trim()|| null : undefined,
      // Coerce years_experience to Int or null
      ...(years_experience !== undefined && {
        years_experience: years_experience !== '' && years_experience != null
          ? parseInt(years_experience, 10)
          : null,
      }),
      // skills must be a string array
      ...(skills !== undefined && {
        skills: Array.isArray(skills) ? skills.filter(s => typeof s === 'string' && s.trim()) : [],
      }),
    }

    // Remove undefined keys so we don't overwrite fields we didn't receive
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k])

    const profile = await prisma.userProfile.upsert({
      where:  { user_id: req.user.id },
      update: data,
      create: { user_id: req.user.id, skills: [], ...data },
    })

    res.json({ data: profile, error: null, message: 'Profile updated successfully' })
  } catch (err) {
    next(err)
  }
})

export default router

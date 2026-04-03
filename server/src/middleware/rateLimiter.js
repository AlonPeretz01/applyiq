import rateLimit from 'express-rate-limit'

const ADMIN_EMAILS = ['alonperetz2001@gmail.com']

// General API rate limit — all routes (except /api/health which is registered before this)
// Note: runs before requireAuth so req.user is not available here — skip is a no-op for unauthenticated context
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { data: null, error: 'Too many requests', message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ADMIN_EMAILS.includes(req.user?.email),
})

// AI routes — stricter limit (applied after requireAuth so req.user is set)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { data: null, error: 'AI rate limit exceeded', message: 'You have exceeded the AI analysis limit. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ADMIN_EMAILS.includes(req.user?.email),
})

// CV generation — even stricter (applied after requireAuth so req.user is set)
export const cvLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { data: null, error: 'CV generation limit exceeded', message: 'You have exceeded the CV generation limit. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ADMIN_EMAILS.includes(req.user?.email),
})

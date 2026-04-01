import rateLimit from 'express-rate-limit'

// General API rate limit — all routes (except /api/health which is registered before this)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { data: null, error: 'Too many requests', message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// AI routes — stricter limit
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { data: null, error: 'AI rate limit exceeded', message: 'You have exceeded the AI analysis limit. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// CV generation — even stricter
export const cvLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { data: null, error: 'CV generation limit exceeded', message: 'You have exceeded the CV generation limit. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
})

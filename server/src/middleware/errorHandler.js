import { Prisma } from '@prisma/client'

/**
 * Maps Prisma-specific error codes to HTTP status codes and readable messages.
 */
function parsePrismaError(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2025': // Record not found (findUniqueOrThrow, update, delete)
        return { status: 404, message: 'Resource not found' }
      case 'P2002': // Unique constraint violation
        return { status: 409, message: `Unique constraint violated on field(s): ${err.meta?.target}` }
      case 'P2003': // Foreign key constraint
        return { status: 400, message: `Referenced resource does not exist (${err.meta?.field_name})` }
      case 'P2014': // Relation violation
        return { status: 400, message: 'Relation violation in the request' }
      default:
        return { status: 500, message: `Database error [${err.code}]` }
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: 'Invalid data sent to the database' }
  }

  return null
}

/**
 * Global error handling middleware.
 */
export function errorHandler(err, req, res, next) {
  const prismaResult = parsePrismaError(err)

  if (prismaResult) {
    return res.status(prismaResult.status).json({
      data: null,
      error: prismaResult.message,
      message: prismaResult.message,
    })
  }

  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  console.error(`[Error ${status}] ${req.method} ${req.path} — ${message}`)
  if (status === 500) console.error(err.stack)

  res.status(status).json({
    data: null,
    error: message,
    message,
    ...(process.env.NODE_ENV === 'development' && status === 500 && { stack: err.stack }),
  })
}

/**
 * 404 handler — must be placed after all routes.
 */
export function notFound(req, res) {
  res.status(404).json({
    data: null,
    error: `Route ${req.method} ${req.path} not found`,
    message: `Route ${req.method} ${req.path} not found`,
  })
}

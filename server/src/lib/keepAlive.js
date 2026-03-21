import cron from 'node-cron'
import prisma from './prisma.js'

export function startKeepAlive() {
  // Runs at midnight every 5 days
  cron.schedule('0 0 */5 * *', async () => {
    try {
      const count = await prisma.job.count()
      console.log(`[keep-alive] Supabase ping successful — count: ${count}`)
    } catch (err) {
      console.error('[keep-alive] Supabase ping failed:', err.message)
    }
  })

  console.log('[keep-alive] Supabase keep-alive cron registered (every 5 days)')
}

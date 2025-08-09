import { prisma } from './db'
import { PLAN_LIMITS } from './stripe'

export async function checkUsageLimit(userId: string): Promise<{
  canAnalyze: boolean
  usage: number
  limit: number
  plan: string
}> {
  try {
    // Get user's current plan
    const user = await prisma.$queryRaw<any[]>`
      SELECT "subscriptionTier" FROM "User" 
      WHERE id = ${userId} 
      LIMIT 1
    `

    const plan = user[0]?.subscriptionTier || 'starter'
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].analyses

    // If unlimited (agency plan)
    if (limit === -1) {
      return { canAnalyze: true, usage: 0, limit: -1, plan }
    }

    // Get usage this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const usage = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count 
      FROM "RecipeAnalysis" 
      WHERE "userId" = ${userId} 
      AND "createdAt" >= ${startOfMonth}
    `

    const currentUsage = Number(usage[0].count)
    const canAnalyze = currentUsage < limit

    return {
      canAnalyze,
      usage: currentUsage,
      limit,
      plan
    }
  } catch (error) {
    console.error('Error checking usage limit:', error)
    return { canAnalyze: false, usage: 0, limit: 0, plan: 'starter' }
  }
}

export async function logUsage(userId: string, action: string, resourceUsed: string, metadata?: any) {
  try {
    await prisma.$queryRaw`
      INSERT INTO "UsageLog" (id, "userId", action, "resourceUsed", metadata, "createdAt")
      VALUES (
        gen_random_uuid()::text, ${userId}, ${action}, ${resourceUsed}, 
        ${metadata ? JSON.stringify(metadata) : null}, NOW()
      )
    `
  } catch (error) {
    console.error('Error logging usage:', error)
  }
}

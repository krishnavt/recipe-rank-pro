import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')

    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful')

    // Check if User table exists and has data
    const userCount = await prisma.$queryRaw<{count: bigint}[]>`
      SELECT COUNT(*) as count FROM "User"
    `
    console.log('✅ User table accessible, count:', Number(userCount[0]?.count))

    // Check if RecipeAnalysis table exists
    try {
      const recipeCount = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count FROM "RecipeAnalysis"
      `
      console.log('✅ RecipeAnalysis table accessible, count:', Number(recipeCount[0]?.count))
    } catch (error) {
      console.log('❌ RecipeAnalysis table not accessible:', error)
      return NextResponse.json({
        success: false,
        error: 'RecipeAnalysis table not found or not accessible',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Check if UsageLog table exists
    try {
      const usageCount = await prisma.$queryRaw<{count: bigint}[]>`
        SELECT COUNT(*) as count FROM "UsageLog"
      `
      console.log('✅ UsageLog table accessible, count:', Number(usageCount[0]?.count))
    } catch (error) {
      console.log('❌ UsageLog table not accessible:', error)
      return NextResponse.json({
        success: false,
        error: 'UsageLog table not found or not accessible',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'All database tables are accessible',
      tables: {
        users: Number(userCount[0]?.count),
        recipeAnalyses: Number((await prisma.$queryRaw<{count: bigint}[]>`SELECT COUNT(*) as count FROM "RecipeAnalysis"`)[0]?.count),
        usageLogs: Number((await prisma.$queryRaw<{count: bigint}[]>`SELECT COUNT(*) as count FROM "UsageLog"`)[0]?.count)
      }
    })

  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection or query failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

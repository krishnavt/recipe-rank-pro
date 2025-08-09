import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    // Build where clause for search
    const whereClause: any = {
      userId: session.user.id
    }

    if (search) {
      whereClause.OR = [
        { originalTitle: { contains: search, mode: 'insensitive' } },
        { optimizedTitle: { contains: search, mode: 'insensitive' } },
        { recipeUrl: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [analyses, total] = await Promise.all([
      prisma.recipeAnalysis.findMany({
        where: whereClause,
        select: {
          id: true,
          recipeUrl: true,
          originalTitle: true,
          optimizedTitle: true,
          seoScore: true,
          targetKeywords: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.recipeAnalysis.count({
        where: whereClause
      })
    ])

    return NextResponse.json({
      analyses: analyses.map(analysis => ({
        ...analysis,
        targetKeywords: analysis.targetKeywords as string[] || []
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Analyses GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
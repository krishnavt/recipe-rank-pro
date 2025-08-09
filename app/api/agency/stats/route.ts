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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        subscriptionTier: true,
        organizationId: true
      }
    })

    if (!user || user.subscriptionTier !== 'agency') {
      return NextResponse.json({ error: 'Agency subscription required' }, { status: 403 })
    }

    // Get or create organization for this user
    let organizationId = user.organizationId

    if (!organizationId) {
      // Create organization if it doesn't exist
      const organization = await prisma.organization.create({
        data: {
          name: `${session.user.name || 'Agency'} Organization`,
          slug: `org-${session.user.id}`,
          description: 'Agency organization'
        }
      })

      // Update user with organization
      await prisma.user.update({
        where: { id: session.user.id },
        data: { organizationId: organization.id }
      })

      // Create owner team member
      await prisma.teamMember.create({
        data: {
          userId: session.user.id,
          organizationId: organization.id,
          role: 'OWNER'
        }
      })

      organizationId = organization.id
    }

    // Fetch stats
    const [totalAnalyses, teamMembers, apiCalls] = await Promise.all([
      prisma.recipeAnalysis.count({
        where: { userId: session.user.id }
      }),
      prisma.teamMember.count({
        where: { organizationId }
      }),
      prisma.usageLog.count({
        where: { 
          userId: session.user.id,
          action: 'api_call'
        }
      })
    ])

    return NextResponse.json({
      totalAnalyses,
      teamMembers,
      apiCalls,
      organizationId
    })

  } catch (error) {
    console.error('Agency stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
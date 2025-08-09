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
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Verify user has access to this organization
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const members = await prisma.teamMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' }
      ]
    })

    return NextResponse.json({ members })

  } catch (error) {
    console.error('Team GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
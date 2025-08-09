import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId, email, role } = body

    if (!organizationId || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Verify user has permission to invite
    const inviter = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!inviter) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user exists
    let inviteeUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    // If user doesn't exist, they'll need to register first
    if (!inviteeUser) {
      return NextResponse.json({ 
        error: 'User not found. They must register first before being invited to a team.' 
      }, { status: 404 })
    }

    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        userId: inviteeUser.id,
        organizationId
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a team member' }, { status: 409 })
    }

    // Create team member
    const teamMember = await prisma.teamMember.create({
      data: {
        userId: inviteeUser.id,
        organizationId,
        role,
        invitedBy: session.user.id,
        invitedAt: new Date(),
        joinedAt: new Date()
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    // In a real app, you'd send an email invitation here
    // For now, we'll just add them directly

    return NextResponse.json({
      success: true,
      member: teamMember,
      message: 'Team member added successfully'
    })

  } catch (error) {
    console.error('Team invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
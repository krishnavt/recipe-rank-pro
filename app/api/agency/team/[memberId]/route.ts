import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = params

    // Get the member to remove
    const memberToRemove = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: {
        userId: true,
        organizationId: true,
        role: true
      }
    })

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Verify user has permission to remove members
    const requester = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: memberToRemove.organizationId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!requester) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Cannot remove owner
    if (memberToRemove.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove organization owner' }, { status: 400 })
    }

    // Remove team member
    await prisma.teamMember.delete({
      where: { id: memberId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Team member DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { memberId } = params
    const body = await request.json()
    const { role } = body

    if (!role || !['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Get the member to update
    const memberToUpdate = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: {
        userId: true,
        organizationId: true,
        role: true
      }
    })

    if (!memberToUpdate) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Verify user has permission to update roles
    const requester = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId: memberToUpdate.organizationId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!requester) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Cannot change owner role
    if (memberToUpdate.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
    }

    // Update role
    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
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

    return NextResponse.json({ success: true, member: updatedMember })

  } catch (error) {
    console.error('Team member PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
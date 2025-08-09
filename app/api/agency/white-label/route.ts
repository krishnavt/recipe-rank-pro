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
        companyName: true,
        companyLogo: true,
        primaryColor: true,
        customDomain: true
      }
    })

    if (!user || user.subscriptionTier !== 'agency') {
      return NextResponse.json({ error: 'Agency subscription required' }, { status: 403 })
    }

    return NextResponse.json({
      companyName: user.companyName,
      companyLogo: user.companyLogo,
      primaryColor: user.primaryColor,
      customDomain: user.customDomain
    })

  } catch (error) {
    console.error('White-label GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true }
    })

    if (!user || user.subscriptionTier !== 'agency') {
      return NextResponse.json({ error: 'Agency subscription required' }, { status: 403 })
    }

    const body = await request.json()
    const { companyName, companyLogo, primaryColor, customDomain } = body

    // Validate inputs
    if (companyLogo && !companyLogo.match(/^https?:\/\/.+/)) {
      return NextResponse.json({ error: 'Invalid logo URL' }, { status: 400 })
    }

    if (primaryColor && !primaryColor.match(/^#[0-9a-fA-F]{6}$/)) {
      return NextResponse.json({ error: 'Invalid color format' }, { status: 400 })
    }

    if (customDomain && !customDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        companyName: companyName || null,
        companyLogo: companyLogo || null,
        primaryColor: primaryColor || null,
        customDomain: customDomain || null
      },
      select: {
        companyName: true,
        companyLogo: true,
        primaryColor: true,
        customDomain: true
      }
    })

    return NextResponse.json({
      success: true,
      settings: updatedUser
    })

  } catch (error) {
    console.error('White-label POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
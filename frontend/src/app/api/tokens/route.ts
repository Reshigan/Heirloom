import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tokens = await prisma.legacyToken.findMany({
      where: { userId: session.user.id },
      include: {
        vault: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tokens)
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { maxRedemptions, expiresAt } = body

    const tokenString = `HLM_LEG_${randomBytes(16).toString('hex').toUpperCase()}`

    const token = await prisma.legacyToken.create({
      data: {
        token: tokenString,
        userId: session.user.id,
        maxRedemptions: maxRedemptions || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })

    await prisma.notification.create({
      data: {
        type: 'TOKEN_GENERATED',
        title: 'Legacy Token Generated',
        message: `Your new legacy token ${tokenString} has been created`,
        userId: session.user.id
      }
    })

    return NextResponse.json(token, { status: 201 })
  } catch (error) {
    console.error('Error creating token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

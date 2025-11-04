import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token: tokenString } = body

    if (!tokenString || !tokenString.startsWith('HLM_LEG_')) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
    }

    const token = await prisma.legacyToken.findUnique({
      where: { token: tokenString },
      include: {
        user: true,
        vault: true
      }
    })

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    if (!token.isActive) {
      return NextResponse.json({ error: 'Token is inactive' }, { status: 400 })
    }

    if (token.expiresAt && new Date() > token.expiresAt) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 })
    }

    if (token.maxRedemptions && token.redemptions >= token.maxRedemptions) {
      return NextResponse.json({ error: 'Token redemption limit reached' }, { status: 400 })
    }

    if (token.user.lifeStatus !== 'DECEASED') {
      return NextResponse.json({ error: 'Vault can only be unsealed after death' }, { status: 400 })
    }

    await prisma.legacyToken.update({
      where: { id: token.id },
      data: { redemptions: token.redemptions + 1 }
    })

    if (token.user.vaultStatus === 'SEALED') {
      await prisma.user.update({
        where: { id: token.userId },
        data: {
          vaultStatus: 'UNSEALED',
          unlockedAt: new Date()
        }
      })
    }

    const memories = await prisma.memory.findMany({
      where: {
        userId: token.userId,
        privacyLevel: 'PUBLIC'
      },
      include: {
        reactions: true,
        comments: true
      }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: token.user.id,
        name: token.user.name,
        avatar: token.user.avatar,
        birthDate: token.user.birthDate,
        deathDate: token.user.unlockedAt,
        bio: token.user.bio
      },
      memories,
      message: `Successfully unsealed ${token.user.name}'s vault. ${memories.length} memories are now accessible.`
    })
  } catch (error) {
    console.error('Error redeeming token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

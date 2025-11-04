import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memory = await prisma.memory.findUnique({
      where: { id: params.id },
      include: {
        reactions: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }

    if (memory.userId !== session.user.id) {
      if (memory.privacyLevel === 'PRIVATE') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      if (memory.privacyLevel === 'RESTRICTED' && !memory.restrictedTo.includes(session.user.id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (memory.isTimeLocked && memory.unlockDate && new Date() < memory.unlockDate) {
      return NextResponse.json({ error: 'Memory is time-locked' }, { status: 403 })
    }

    return NextResponse.json(memory)
  } catch (error) {
    console.error('Error fetching memory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memory = await prisma.memory.findUnique({
      where: { id: params.id }
    })

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }

    if (memory.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updatedMemory = await prisma.memory.update({
      where: { id: params.id },
      data: body,
      include: {
        reactions: true,
        comments: true
      }
    })

    return NextResponse.json(updatedMemory)
  } catch (error) {
    console.error('Error updating memory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memory = await prisma.memory.findUnique({
      where: { id: params.id }
    })

    if (!memory) {
      return NextResponse.json({ error: 'Memory not found' }, { status: 404 })
    }

    if (memory.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.memory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting memory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

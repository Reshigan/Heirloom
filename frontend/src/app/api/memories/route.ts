import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMemorySchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  date: z.string().datetime(),
  location: z.string().optional(),
  type: z.enum(['PHOTO', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STORY', 'LEGACY_VIDEO']),
  thumbnail: z.string().optional(),
  content: z.string().optional(),
  emotions: z.array(z.string()),
  significance: z.enum(['LOW', 'MEDIUM', 'HIGH', 'MILESTONE']),
  privacyLevel: z.enum(['PUBLIC', 'PRIVATE', 'RESTRICTED']),
  restrictedTo: z.array(z.string()).optional(),
  isTimeLocked: z.boolean(),
  unlockDate: z.string().datetime().optional(),
  tags: z.array(z.string())
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const emotion = searchParams.get('emotion')
    const privacyLevel = searchParams.get('privacyLevel')

    const where: any = {
      userId: session.user.id
    }

    if (type) where.type = type
    if (privacyLevel) where.privacyLevel = privacyLevel
    if (emotion) where.emotions = { has: emotion }

    const memories = await prisma.memory.findMany({
      where,
      include: {
        reactions: true,
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(memories)
  } catch (error) {
    console.error('Error fetching memories:', error)
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
    const validatedData = createMemorySchema.parse(body)

    const memory = await prisma.memory.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        unlockDate: validatedData.unlockDate ? new Date(validatedData.unlockDate) : null,
        restrictedTo: validatedData.restrictedTo || [],
        userId: session.user.id
      },
      include: {
        reactions: true,
        comments: true
      }
    })

    return NextResponse.json(memory, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Error creating memory:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

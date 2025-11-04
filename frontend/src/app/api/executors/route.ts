import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = process.env.EMAIL_API_KEY ? new Resend(process.env.EMAIL_API_KEY) : null

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const executors = await prisma.executor.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(executors)
  } catch (error) {
    console.error('Error fetching executors:', error)
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
    const { email, name, permissions } = body

    const executor = await prisma.executor.create({
      data: {
        email,
        name,
        permissions: permissions || [],
        userId: session.user.id
      }
    })

    try {
      if (resend) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@heirloom.com',
          to: email,
          subject: 'You have been appointed as a Vault Executor',
          html: `
            <h1>Vault Executor Invitation</h1>
            <p>You have been appointed as an executor for ${session.user.name}'s digital vault on Heirloom.</p>
            <p>As an executor, you will be responsible for managing the vault after their passing.</p>
            <p><a href="${process.env.NEXTAUTH_URL}/executors/accept/${executor.id}">Accept Invitation</a></p>
          `
        })
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
    }

    await prisma.notification.create({
      data: {
        type: 'EXECUTOR_INVITATION',
        title: 'Executor Invitation Sent',
        message: `Invitation sent to ${name} (${email})`,
        userId: session.user.id
      }
    })

    return NextResponse.json(executor, { status: 201 })
  } catch (error) {
    console.error('Error creating executor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

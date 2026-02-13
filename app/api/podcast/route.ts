// File: app/api/podcast/route.js

import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hasAnyRole } from '@/lib/roleUtils'

type CreatePodcastBody = {
  title?: string
  subtitle?: string
  description?: string
  date?: string
  duration?: string
  audioKey?: string
  coverImageKey?: string
  image?: string
}

function isAdmin(roleString: string): boolean {
  return hasAnyRole(roleString, ['DEVELOPER', 'MUSIC'])
}

export async function GET() {
  try {
    const podcasts = await prisma.podcast.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(podcasts)
  } catch (error) {
    console.error('Error fetching podcasts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Accept JSON, not formData
    const data = (await req.json()) as CreatePodcastBody
    const { title, subtitle, description, date, duration, audioKey, coverImageKey, image } = data
    if (!title || !description || !audioKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    // Save only the R2 keys/URLs
    const podcast = await prisma.podcast.create({
      data: {
        title,
        subtitle: subtitle || undefined,
        description,
        date: date || undefined,
        duration: duration || undefined,
        audioUrl: audioKey,
        image: image || (coverImageKey ? `/api/proxy-audio?key=${coverImageKey}` : undefined),
        coverImage: coverImageKey ? `/api/proxy-audio?key=${coverImageKey}` : undefined,
        authorId: session.user.id,
      },
    })
    return NextResponse.json(podcast, { status: 201 })
  } catch (error) {
    console.error('Error creating podcast:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// ... (Sisa kode PATCH dan DELETE tetap sama) ...
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const payload = (await req.json()) as {
      id?: string
      [key: string]: unknown
    }
    const { id, ...data } = payload
    if (!id) {
      return NextResponse.json({ error: 'Missing podcast id' }, { status: 400 })
    }
    const updated = await prisma.podcast.update({
      where: { id },
      data: data as Prisma.PodcastUpdateInput,
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating podcast:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { id } = (await req.json()) as { id?: string }
    if (!id) {
      return NextResponse.json({ error: 'Missing podcast id' }, { status: 400 })
    }
    await prisma.podcast.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting podcast:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

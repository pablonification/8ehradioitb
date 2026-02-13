import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hasAnyRole } from '@/lib/roleUtils'

function isMusic(roleString: string): boolean {
  return hasAnyRole(roleString, ['MUSIC', 'DEVELOPER'])
}

// GET: List all 10 entries, sorted by order
export async function GET() {
  const entries = await prisma.tuneTrackerEntry.findMany({
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(entries)
}

// POST: Create or update one entry (by order)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { order, title, artist, coverImage, audioUrl } = (await req.json()) as {
    order?: number
    title?: string
    artist?: string
    coverImage?: string
    audioUrl?: string
  }
  if (!order || !title || !artist) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  let entry = await prisma.tuneTrackerEntry.findFirst({ where: { order } })
  if (entry) {
    entry = await prisma.tuneTrackerEntry.update({
      where: { id: entry.id },
      data: { title, artist, coverImage, audioUrl },
    })
  } else {
    entry = await prisma.tuneTrackerEntry.create({
      data: { order, title, artist, coverImage, audioUrl },
    })
  }
  return NextResponse.json(entry)
}

// PATCH: Partial update (by id)
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const payload = (await req.json()) as {
    id?: string
    [key: string]: unknown
  }
  const { id, ...data } = payload
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const entry = await prisma.tuneTrackerEntry.update({
    where: { id },
    data: data as Prisma.TuneTrackerEntryUpdateInput,
  })
  return NextResponse.json(entry)
}

// DELETE: Remove cover or audio from entry (by id, field)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !isMusic(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, field } = (await req.json()) as {
    id?: string
    field?: 'coverImage' | 'audioUrl'
  }
  if (!id || !field || !['coverImage', 'audioUrl'].includes(field)) {
    return NextResponse.json({ error: 'Missing id or invalid field' }, { status: 400 })
  }

  const data = field === 'coverImage' ? { coverImage: null } : { audioUrl: null }

  const entry = await prisma.tuneTrackerEntry.update({
    where: { id },
    data,
  })
  return NextResponse.json(entry)
}

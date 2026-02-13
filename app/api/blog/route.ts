import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hasAnyRole } from '@/lib/roleUtils'

type CreateBlogPayload = {
  title?: string
  content?: string
  category?: string
  mainImage?: string
  slug?: string
  description?: string
  readTime?: string
  tags?: string[]
  authorIds?: string[]
}

export async function GET() {
  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        authors: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !hasAnyRole(session.user.role, ['DEVELOPER', 'REPORTER'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as CreateBlogPayload
    const { title, content, category, mainImage, slug, description, readTime, tags, authorIds } =
      body

    if (!title || !content || !slug) {
      return NextResponse.json({ error: 'Title, content, and slug are required' }, { status: 400 })
    }

    const authorsToConnect = authorIds && authorIds.length > 0 ? authorIds : [session.user.id]

    // I will add a proper slug generation later
    const newPost = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        description,
        readTime,
        category,
        mainImage,
        tags: tags || [],
        authors: {
          create: authorsToConnect.map((userId: string) => ({
            user: {
              connect: {
                id: userId,
              },
            },
          })),
        },
      },
    })

    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    const target =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.meta?.target : undefined

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(target) &&
      target.includes('slug')
    ) {
      return NextResponse.json({ error: 'Slug must be unique.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

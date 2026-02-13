import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hasAnyRole } from '@/lib/roleUtils'

type SlugRouteContext = {
  params: {
    slug: string
  }
}

type UpdatePostPayload = {
  authorIds?: string[]
  title?: string
  slug?: string
  content?: string
  description?: string
  readTime?: string
  category?: string
  mainImage?: string
  tags?: string[]
}

// GET a single post by slug
export async function GET(_req: Request, { params }: SlugRouteContext) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: {
        slug: params.slug,
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

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// UPDATE a post by slug
export async function PUT(req: Request, { params }: SlugRouteContext) {
  const session = await getServerSession(authOptions)

  if (!session || !hasAnyRole(session.user.role, ['DEVELOPER', 'REPORTER'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as UpdatePostPayload
    const { authorIds, ...postData } = body

    const post = await prisma.blogPost.findUnique({ where: { slug: params.slug } })
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update post content itself
      await tx.blogPost.update({
        where: { id: post.id },
        data: {
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          description: postData.description,
          readTime: postData.readTime,
          category: postData.category,
          mainImage: postData.mainImage,
          tags: postData.tags,
        },
      })

      // 2. Delete all existing author connections for this post
      await tx.authorOnPost.deleteMany({
        where: { postId: post.id },
      })

      // 3. Create new author connections
      if (authorIds && authorIds.length > 0) {
        await tx.authorOnPost.createMany({
          data: authorIds.map((userId: string) => ({
            postId: post.id,
            userId: userId,
          })),
        })
      }
    })

    // Fetch the updated post to return it
    const updatedPost = await prisma.blogPost.findUnique({
      where: { id: post.id },
      include: { authors: { include: { user: true } } },
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post:', error)
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

// DELETE a post by slug
export async function DELETE(_req: Request, { params }: SlugRouteContext) {
  const session = await getServerSession(authOptions)

  if (!session || !hasAnyRole(session.user.role, ['DEVELOPER', 'REPORTER'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Need to delete AuthorOnPost records first
    await prisma.authorOnPost.deleteMany({
      where: {
        post: {
          slug: params.slug,
        },
      },
    })

    await prisma.blogPost.delete({
      where: {
        slug: params.slug,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

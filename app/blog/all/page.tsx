import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/app/components/Navbar'
import FooterSection from '@/app/components/FooterSection'
import Pagination from '@/app/components/Pagination'
import { prisma } from '@/lib/prisma'

const POSTS_PER_PAGE = 9

type BlogAllArticle = {
  id: string
  slug: string
  mainImage: string | null
  title: string
  category: string | null
  description: string | null
  createdAt: Date
  readTime: string | null
  authors: Array<{ user: { name: string | null; image: string | null } }>
}

const BlogCard = ({ article }: { article: BlogAllArticle }) => (
  <Link href={`/blog/${article.slug}`} className="group flex flex-col">
    <div className="relative mb-4 h-60 w-full overflow-hidden rounded-lg">
      <Image
        src={article.mainImage || '/og-image.png'}
        alt={article.title}
        layout="fill"
        objectFit="cover"
        className="transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <p className="font-body mb-1 text-sm font-medium text-red-600">{article.category}</p>
    <h3 className="font-heading mb-3 text-xl font-bold text-gray-900">{article.title}</h3>
    <p className="font-body mb-4 line-clamp-2 flex-grow text-sm text-gray-600">
      {article.description}
    </p>
    <div className="mt-auto flex flex-shrink-0 items-start text-xs text-gray-500">
      {article.authors?.[0]?.user?.image && (
        <div className="relative mr-2 h-8 w-8 flex-shrink-0">
          <Image
            src={article.authors[0].user.image}
            alt={article.authors[0].user.name || 'Author'}
            fill
            className="rounded-full"
          />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate-words font-semibold text-gray-800">
          {article.authors?.map((a: { user: { name: string | null } }) => a.user.name).join(', ') ||
            '8EH Radio ITB'}
        </p>
        <p className="truncate-words">
          {new Date(article.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          {article.readTime && ` • ${article.readTime}`}
        </p>
      </div>
    </div>
  </Link>
)

async function getPaginatedPosts(page = 1) {
  const skip = (page - 1) * POSTS_PER_PAGE
  const take = POSTS_PER_PAGE

  const posts = await prisma.blogPost.findMany({
    skip,
    take,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      authors: {
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  })

  const totalPosts = await prisma.blogPost.count()
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

  return { posts, totalPages }
}

async function PaginatedBlogContent({ currentPage }: { currentPage: number }) {
  const { posts, totalPages } = await getPaginatedPosts(currentPage)

  return (
    <>
      <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} article={post} />
        ))}
      </div>

      <Pagination totalPages={totalPages} basePath="/blog/all" />
    </>
  )
}

function LoadingBlogContent() {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: POSTS_PER_PAGE }).map((_, index) => (
        <div key={index} className="flex animate-pulse flex-col">
          <div className="mb-4 h-60 w-full rounded-lg bg-gray-200"></div>
          <div className="mb-2 h-4 w-1/4 rounded bg-gray-200"></div>
          <div className="mb-3 h-6 w-3/4 rounded bg-gray-200"></div>
          <div className="mb-4 h-16 rounded bg-gray-200"></div>
          <div className="flex items-center">
            <div className="mr-2 h-8 w-8 rounded-full bg-gray-200"></div>
            <div className="h-8 w-1/2 rounded bg-gray-200"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AllBlogsPage({ searchParams }: { searchParams: { page?: string } }) {
  const currentPage = Number(searchParams.page ?? '1') || 1
  return (
    <div className="bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-left">
          <h1 className="font-heading mb-2 text-4xl font-bold text-gray-900">All Blog Posts</h1>
          <p className="font-body text-lg text-gray-600">
            Explore all of our articles and stories.
          </p>
        </div>

        <Suspense fallback={<LoadingBlogContent />}>
          <PaginatedBlogContent currentPage={currentPage} />
        </Suspense>
      </main>
      <FooterSection />
    </div>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import FooterSection from '@/app/components/FooterSection'
import { prisma } from '@/lib/prisma'

// --- NEW COMPONENTS FOR THE BLOG PAGE ---

type AuthorUser = {
  id?: string
  name: string | null
  image: string | null
}

type Article = {
  id: string
  slug: string
  mainImage: string | null
  title: string
  category: string | null
  description: string | null
  createdAt: Date
  readTime: string | null
  isFeatured?: boolean
  authors: Array<{ user: AuthorUser }>
}

const FeaturedArticle = ({ article }: { article: Article }) => (
  <Link
    href={`/blog/${article.slug}`}
    className="group grid grid-cols-1 items-center gap-8 md:grid-cols-2"
  >
    <div className="relative h-80 w-full overflow-hidden rounded-lg">
      <Image
        src={article.mainImage || '/og-image.png'}
        alt={article.title}
        layout="fill"
        objectFit="cover"
      />
    </div>
    <div>
      <p className="font-body mb-2 text-sm font-medium text-red-600">{article.category}</p>
      <h2 className="font-heading mb-2 text-3xl font-bold text-gray-900">{article.title}</h2>
      <p className="font-body mb-4 line-clamp-2 text-gray-600">{article.description}</p>
      <div className="mt-auto flex flex-shrink-0 items-center">
        {article.authors?.[0]?.user?.image && (
          <div className="relative mr-3 h-10 w-10 flex-shrink-0">
            <Image
              src={article.authors[0].user.image}
              alt={article.authors[0].user.name || 'Author'}
              fill
              className="rounded-full"
            />
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <p className="font-body truncate-words text-sm font-semibold text-gray-800">
            {article.authors?.map((a: { user: AuthorUser }) => a.user.name).join(', ') ||
              '8EH Radio ITB'}
          </p>
          <p className="font-body truncate-words text-xs text-gray-500">
            {new Date(article.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {article.readTime && ` • ${article.readTime}`}
          </p>
        </div>
      </div>
    </div>
  </Link>
)

const BlogCard = ({ article }: { article: Article }) => (
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
        <div className="relative mt-0.5 mr-2 h-8 w-8 flex-shrink-0">
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
          {article.authors?.map((a: { user: AuthorUser }) => a.user.name).join(', ') ||
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

const SectionHeader = ({
  title,
  linkText = 'See all',
  linkHref,
}: {
  title: string
  linkText?: string
  linkHref: string
}) => (
  <div className="mb-4 flex items-center justify-between">
    <h2 className="font-heading text-2xl font-bold text-gray-900">{title}</h2>
    <Link href={linkHref} className="font-body text-sm font-medium text-red-600 hover:underline">
      {linkText} →
    </Link>
  </div>
)

async function getPosts() {
  const posts = await prisma.blogPost.findMany({
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
  return posts
}

async function getFeaturedPost() {
  let featured = await prisma.blogPost.findFirst({
    where: { isFeatured: true },
    include: {
      authors: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
  })

  if (!featured) {
    featured = await prisma.blogPost.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        authors: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    })
  }
  return featured
}

export default async function Blog() {
  const [featuredArticle, allPosts] = await Promise.all([getFeaturedPost(), getPosts()])

  // Exclude featured article from the main list to avoid duplication
  const latestBlogs = allPosts.filter((p: Article) => p.id !== featuredArticle?.id).slice(0, 9)

  return (
    <div className="bg-white">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <section className="relative overflow-hidden rounded-lg bg-gray-50 p-8 text-center">
          {/* Decorative vstock images */}
          <div className="absolute top-4 left-4 opacity-20">
            <Image src="/vstock-podcast-3.png" alt="decoration" width={60} height={60} />
          </div>
          <div className="absolute top-4 right-4 opacity-20">
            <Image src="/vstock-podcast-5.png" alt="decoration" width={60} height={60} />
          </div>
          <div className="absolute bottom-4 left-1/4 opacity-15">
            <Image src="/vstock-agency-3.png" alt="decoration" width={40} height={40} />
          </div>
          <div className="absolute right-1/4 bottom-4 opacity-15">
            <Image src="/vstock-podcast-2.png" alt="decoration" width={50} height={50} />
          </div>

          <p className="font-body mb-2 text-sm font-medium tracking-widest text-gray-500 uppercase">
            Blog
          </p>
          <h1 className="font-heading relative z-10 text-4xl font-bold text-gray-900">
            Craft narratives that ignite inspiration,
            <br />
            knowledge, and entertainment.
          </h1>
        </section>

        {/* Featured Article */}
        {featuredArticle && (
          <section className="relative">
            {/* Decorative elements around featured article */}
            <div className="absolute -top-8 -left-8 hidden opacity-10 lg:block">
              <Image src="/vstock-podcast-4.png" alt="decoration" width={120} height={120} />
            </div>
            <div className="absolute -top-4 -right-4 hidden opacity-15 lg:block">
              <Image src="/vstock-3.png" alt="decoration" width={80} height={80} />
            </div>
            <FeaturedArticle article={featuredArticle} />
          </section>
        )}

        {/* Latest Blog */}
        {latestBlogs.length > 0 && (
          <section className="relative">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 opacity-5">
              <Image src="/vstock-home1.png" alt="decoration" width={200} height={200} />
            </div>
            <div className="absolute top-1/2 right-0 opacity-5">
              <Image src="/vstock-home2.png" alt="decoration" width={180} height={180} />
            </div>
            <div className="absolute bottom-0 left-1/3 opacity-8">
              <Image src="/vstock-podcast-1.png" alt="decoration" width={60} height={60} />
            </div>

            <SectionHeader title="Latest Blog" linkHref="/blog/all" />
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {latestBlogs.map((article) => (
                <BlogCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}
      </main>
      <FooterSection />
    </div>
  )
}

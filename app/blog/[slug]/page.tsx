import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { notFound } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import FooterSection from '@/app/components/FooterSection'
import { prisma } from '@/lib/prisma'
import ArticleStructuredData from '@/app/components/ArticleStructuredData'
import TLDRSection from '@/app/components/TLDRSection'
import { cache } from 'react'

type PageParams = { slug: string }

const getPost = cache(async (slug: string) => {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
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
  return post
})

export async function generateMetadata({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The post you are looking for could not be found.',
    }
  }

  const description = post.description || post.content?.substring(0, 160)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://8ehradioitb.com'

  return {
    title: post.title,
    description: description,
    keywords: post.tags,
    alternates: {
      canonical: `${siteUrl}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: description,
      url: `${siteUrl}/blog/${post.slug}`,
      images: [
        {
          url: post.mainImage || '/8eh-real-long.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      article: {
        publishedTime: post.createdAt.toISOString(),
        authors: post.authors?.map((a) => a.user.name).join(', '),
        tags: post.tags,
      },
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      images: [post.mainImage || '/8eh-real-long.png'],
    },
  }
}

// --- BLOG POST PAGE ---
export default async function BlogPostPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const mainAuthor = post.authors?.[0]?.user
  const coAuthors = post.authors?.slice(1).map((a) => a.user)
  const allAuthorNames = post.authors?.map((a) => a.user.name).join(', ') || '8EH Radio ITB'

  return (
    <div className="bg-white">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <article>
          {/* Header */}
          <div className="mb-12">
            <p className="font-body mb-2 text-sm font-semibold text-red-600">{post.category}</p>
            <h1 className="font-heading mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              {post.title}
            </h1>
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-start space-x-3">
                {mainAuthor?.image && (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                    <Image src={mainAuthor.image} alt={mainAuthor.name || 'Author'} fill />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-body truncate-words font-semibold text-gray-900">
                    {allAuthorNames}
                  </p>
                  <p className="font-body text-sm text-gray-500">
                    {new Date(post.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {post.readTime && ` • ${post.readTime}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center space-x-4 text-gray-700">
                {/* LinkedIn Share */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                >
                  <Image
                    src="/LinkedIn.svg"
                    alt="LinkedIn"
                    width={20}
                    height={20}
                    className="cursor-pointer transition-opacity hover:opacity-75"
                  />
                </a>
                {/* X/Twitter Share */}
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug}`
                  )}&text=${encodeURIComponent(`Artikel terbaru 8EH Radio ITB, '${post.title}', seru banget! Gimana menurutmu? Baca selengkapnya:`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on X"
                >
                  <Image
                    src="/X.svg"
                    alt="X"
                    width={20}
                    height={20}
                    className="cursor-pointer transition-opacity hover:opacity-75"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Main Image */}
          {post.mainImage && (
            <div className="relative mb-12 aspect-video w-full overflow-hidden rounded-2xl bg-gray-200 shadow-lg">
              <Image src={post.mainImage} alt={post.title} layout="fill" objectFit="cover" />
            </div>
          )}

          {/* TL;DR Section */}
          {post.content && post.content.length >= 500 && (
            <TLDRSection content={post.content} title={post.title} />
          )}

          {/* Markdown Content */}
          <div className="max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="font-heading mt-8 mb-6 text-4xl leading-tight font-bold text-gray-900"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="font-heading mt-8 mb-4 text-3xl leading-tight font-bold text-gray-900"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="font-heading mt-6 mb-3 text-2xl leading-tight font-bold text-gray-900"
                    {...props}
                  />
                ),
                h4: ({ node, ...props }) => (
                  <h4
                    className="font-heading mt-4 mb-2 text-xl leading-tight font-bold text-gray-900"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p className="font-body mb-4 leading-relaxed text-gray-800" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="font-body my-6 border-l-4 border-red-600 bg-gray-50 py-4 pl-6 text-gray-800 italic"
                    {...props}
                  />
                ),
                img: ({ node, ...props }) => (
                  <div className="my-8">
                    <img className="h-auto w-full rounded-xl object-cover shadow-md" {...props} />
                  </div>
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-red-600 no-underline hover:text-red-700 hover:underline"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="font-body mb-4 list-disc pl-6 text-gray-800" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="font-body mb-4 list-decimal pl-6 text-gray-800" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="font-body mb-1 text-gray-800" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-gray-900" {...props} />
                ),
                em: ({ node, ...props }) => <em className="text-gray-800" {...props} />,
                code: ({ node, ...props }) => (
                  <code className="rounded bg-gray-100 px-1 py-0.5 text-red-600" {...props} />
                ),
                pre: ({ node, ...props }) => (
                  <pre
                    className="overflow-x-auto rounded-lg border border-gray-200 bg-gray-100 p-4 text-gray-800"
                    {...props}
                  />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Footer Section */}
          <div className="mt-16 border-t border-gray-200 pt-8">
            {/* Tags Section */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <span className="font-body mr-2 font-semibold text-gray-700">Tags</span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-body rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Box */}
            {post.authors && post.authors.length > 0 && (
              <div className="rounded-2xl bg-gray-50 p-6">
                {mainAuthor && (
                  <div className="flex items-center space-x-6">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                      <Image
                        src={mainAuthor.image || '/8eh-real.svg'}
                        alt={mainAuthor.name || 'Author'}
                        fill
                        objectFit="cover"
                      />
                    </div>
                    <div>
                      <p className="font-body mb-1 text-sm text-gray-500">Written by</p>
                      <p className="font-heading text-lg font-bold text-gray-900">
                        {mainAuthor.name}
                      </p>
                    </div>
                  </div>
                )}

                {coAuthors && coAuthors.length > 0 && (
                  <div className="mt-6 space-y-6">
                    {coAuthors.map((author) => (
                      <div key={author.id} className="flex items-center space-x-6">
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                          <Image
                            src={author.image || '/8eh-real.svg'}
                            alt={author.name || 'Author'}
                            fill
                            objectFit="cover"
                          />
                        </div>
                        <div>
                          <p className="font-body mb-1 text-sm text-gray-500">Co-Author</p>
                          <p className="font-heading text-lg font-bold text-gray-900">
                            {author.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </article>
      </main>
      <FooterSection />
      <ArticleStructuredData post={post} />
    </div>
  )
}

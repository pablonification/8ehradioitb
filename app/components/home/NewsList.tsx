'use client'

import type { SyntheticEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ButtonPrimary from '@/app/components/ButtonPrimary'

type NewsAuthor = {
  user: {
    name: string | null
    image: string | null
  }
}

type NewsItem = {
  id: string
  slug: string
  mainImage: string | null
  title: string
  category: string | null
  description: string | null
  authors: NewsAuthor[]
  createdAt: string
  readTime: string | null
}

type NewsListProps = {
  newsItems?: NewsItem[]
}

export default function NewsList({ newsItems = [] }: NewsListProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <section className="relative bg-white py-16">
      <div className="absolute top-10 left-1/4 -translate-x-1/2 opacity-80">
        <Image src="/vstock-home1.png" alt="decoration" width={150} height={150} />
      </div>
      <div className="absolute top-10 right-1/4 translate-x-1/2 opacity-80">
        <Image src="/vstock-home2.png" alt="decoration" width={150} height={150} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-accent mb-2 text-6xl font-bold text-gray-900">Latest Campus News</h2>
        <p className="font-body mb-16 text-gray-600">
          Selalu terhubung dengan kabar terbaru dan cerita seru seputar dunia kampus!
        </p>

        {newsItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 text-left sm:grid-cols-2 md:grid-cols-3">
            {newsItems.map((item, idx) => (
              <Link href={`/blog/${item.slug}`} key={item.id || idx} className="group block">
                <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-[#FEF9E7] to-[#F5E6A3] p-4 shadow-sm transition-all duration-300 ease-in-out group-hover:scale-[1.02] group-hover:shadow-xl">
                  <div className="relative h-48 overflow-hidden rounded-xl">
                    <img
                      src={item.mainImage || '/og-image.png'}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-grow flex-col px-2 pt-6">
                    <p className="font-body mb-2 text-sm font-medium text-gray-500">
                      {item.category || 'News'}
                    </p>
                    <h3 className="font-heading mb-3 text-xl font-bold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="font-body mb-6 line-clamp-3 flex-grow text-sm text-gray-600">
                      {item.description || 'No description available'}
                    </p>
                    <div className="mt-auto flex items-center">
                      <div className="relative mr-3 h-10 w-10">
                        <img
                          src={
                            item.authors?.[0]?.user?.image
                              ? item.authors[0].user.image.includes('googleusercontent.com')
                                ? item.authors[0].user.image.replace(/=s\d+-c/, '=s150-c')
                                : item.authors[0].user.image.startsWith('http')
                                  ? item.authors[0].user.image
                                  : `${window.location.origin}${item.authors[0].user.image}`
                              : '/8eh-real.svg'
                          }
                          alt={item.authors?.[0]?.user?.name || 'Author'}
                          className="h-full w-full rounded-full object-cover"
                          onError={(e: SyntheticEvent<HTMLImageElement>) => {
                            const target = e.currentTarget
                            // Try alternative Google image size if it's a Google image
                            if (
                              target.src.includes('googleusercontent.com') &&
                              !target.src.includes('=s150-c')
                            ) {
                              target.src = target.src.replace(/=s\d+-c/, '=s150-c')
                            } else {
                              target.src = '/8eh-real.svg'
                              target.onerror = null // Prevent infinite loop
                            }
                          }}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="font-body text-sm font-semibold text-gray-800">
                          {item.authors?.[0]?.user?.name || '8EH Team'}
                        </p>
                        <p className="font-body text-xs text-gray-500">
                          {formatDate(item.createdAt)} &bull; {item.readTime || '5 min read'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">No news articles available yet.</div>
        )}

        <div className="mt-12 text-center">
          <ButtonPrimary
            className="!bg-gray-200 !px-6 !py-2.5 !font-medium !text-gray-800 hover:!bg-gray-300"
            onClick={() => {
              window.open('/blog', '_self')
            }}
          >
            View all
          </ButtonPrimary>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { hasAnyRole } from '@/lib/roleUtils'
import useSWR from 'swr'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  FiEdit,
  FiMic,
  FiLink,
  FiBarChart2,
  FiArrowRight,
  FiPlus,
  FiActivity,
  FiInfo,
} from 'react-icons/fi'

type StatCardColor = 'blue' | 'green' | 'purple' | 'red'

type BlogPost = {
  title: string
  createdAt: string
  slug: string
}

type ShortLink = {
  _count?: {
    clicks?: number
  }
}

type DashboardRole = 'DEVELOPER' | 'REPORTER' | 'TECHNIC' | 'MUSIC' | 'KRU'

type QuickActionItem = {
  icon: ReactNode
  label: string
  href: string
  roles: DashboardRole[]
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)
  return (await response.json()) as T
}

type StatCardProps = {
  icon: ReactNode
  title: string
  value: number | undefined
  isLoading: boolean
  color: StatCardColor
  href: string
}

// Komponen Kartu Statistik (Versi Refined)
const StatCard = ({ icon, title, value, isLoading, color, href }: StatCardProps) => {
  const colorClasses: Record<StatCardColor, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
  }
  const colors = colorClasses[color]

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-400 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body font-semibold text-gray-600">{title}</p>
          {isLoading ? (
            <div className="mt-1 h-10 w-20 animate-pulse rounded-md bg-gray-200"></div>
          ) : (
            <p className="font-heading text-4xl font-bold text-gray-800">{value ?? '0'}</p>
          )}
        </div>
        <div className={`rounded-lg p-3 ${colors.bg}`}>
          <div className={colors.text}>{icon}</div>
        </div>
      </div>
      <Link
        href={href}
        className="font-body mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
      >
        View All →
      </Link>
    </div>
  )
}

// Komponen Tombol Aksi Cepat
type QuickActionProps = {
  icon: ReactNode
  label: string
  href: string
}

const QuickAction = ({ icon, label, href }: QuickActionProps) => (
  <Link
    href={href}
    className="group flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:bg-gray-100"
  >
    <div className="flex items-center gap-4">
      {icon}
      <span className="font-body font-medium text-gray-800">{label}</span>
    </div>
    <FiArrowRight className="text-gray-400 transition-transform group-hover:translate-x-1" />
  </Link>
)

export default function DashboardHome() {
  const { data: session } = useSession()

  const actions: QuickActionItem[] = [
    {
      icon: <FiPlus className="text-blue-500" />,
      label: 'New Blog Post',
      href: '/dashboard/blog/new',
      roles: ['DEVELOPER', 'REPORTER'],
    },
    {
      icon: <FiPlus className="text-green-500" />,
      label: 'Upload Podcast',
      href: '/dashboard/podcast',
      roles: ['DEVELOPER', 'TECHNIC'],
    },
    {
      icon: <FiPlus className="text-purple-500" />,
      label: 'Create Short Link',
      href: '/dashboard/links',
      roles: ['MUSIC', 'DEVELOPER', 'TECHNIC', 'REPORTER', 'KRU'],
    },
  ]

  const visibleActions = actions.filter((action) => hasAnyRole(session?.user?.role, action.roles))

  const { data: posts, error: postsError } = useSWR<BlogPost[]>('/api/blog', fetcher)
  const { data: podcasts, error: podcastsError } = useSWR<unknown[]>('/api/podcast', fetcher)
  const { data: links, error: linksError } = useSWR<ShortLink[]>('/api/shortlinks', fetcher)

  const totalPosts = posts?.length
  const totalPodcasts = podcasts?.length
  const totalLinks = links?.length
  const totalClicks = links?.reduce((acc, link) => acc + (link._count?.clicks || 0), 0)
  const latestPost = posts?.[0]

  const isLoadingStats = !posts && !podcasts && !links

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-gray-800 md:text-4xl">
          Welcome to the Studio,{' '}
          <span className="text-red-600">{session?.user?.name?.split(' ')[0]}</span>!
        </h1>
        <p className="font-body mt-2 text-gray-600">
          Here's a snapshot of your content and performance. Let's make something great today.
        </p>
      </div>

      {/* New Documentation Card */}
      <div className="flex items-start gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
        <FiInfo size={40} className="mt-1 flex-shrink-0 text-blue-500" />
        <div>
          <h3 className="font-heading font-bold">Panduan Dokumentasi</h3>
          <p className="font-body mt-1 text-sm">
            Kami telah menyiapkan panduan dokumentasi website 8EH Radio ITB untuk membantu Anda
            menggunakan dashboard ini dengan lebih mudah.
          </p>
          <a
            href="https://docs.google.com/document/d/1kScboeFQNPDu9YNwrt6mUYPlhVXf_yHmCDyn0AJtvdE/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body mt-2 inline-block font-semibold text-blue-600 hover:underline"
          >
            Akses Dokumentasi di sini →
          </a>
        </div>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FiEdit size={24} />}
          title="Blog Posts"
          value={totalPosts}
          isLoading={!posts}
          color="blue"
          href="/dashboard/blog"
        />
        <StatCard
          icon={<FiMic size={24} />}
          title="Podcasts"
          value={totalPodcasts}
          isLoading={!podcasts}
          color="green"
          href="/dashboard/podcast"
        />
        <StatCard
          icon={<FiLink size={24} />}
          title="Short Links"
          value={totalLinks}
          isLoading={!links}
          color="purple"
          href="/dashboard/links"
        />
        <StatCard
          icon={<FiBarChart2 size={24} />}
          title="Total Clicks"
          value={totalClicks}
          isLoading={!links}
          color="red"
          href="/dashboard/links"
        />
      </div>

      {/* Aksi Cepat & Aktivitas Terbaru */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="font-heading mb-4 text-xl font-bold text-gray-800">Quick Actions</h2>
          <div className="space-y-3">
            {visibleActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="font-heading mb-4 flex items-center gap-2 text-xl font-bold text-gray-800">
            <FiActivity /> Recent Activity
          </h2>
          {isLoadingStats ? (
            <div className="space-y-3">
              <div className="h-6 w-3/4 animate-pulse rounded-md bg-gray-200"></div>
              <div className="h-4 w-1/2 animate-pulse rounded-md bg-gray-200"></div>
            </div>
          ) : latestPost ? (
            <div className="group">
              <p className="font-body mb-1 text-sm text-gray-500">Latest Blog Post</p>
              <h3 className="font-heading mb-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-600">
                {latestPost.title}
              </h3>
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-gray-500">
                  Published on{' '}
                  {new Date(latestPost.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <Link
                  href={`/blog/${latestPost.slug}`}
                  target="_blank"
                  className="flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                >
                  View Post <FiArrowRight />
                </Link>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="font-body text-gray-500">No recent activity to show.</p>
              <p className="font-body mt-1 text-sm text-gray-400">
                Create a new post to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import Navbar from '@/app/components/Navbar'
import FooterSection from '@/app/components/FooterSection'
import dynamic from 'next/dynamic'
import HeroSection from '@/app/components/home/HeroSection'
import PodcastList from '@/app/components/home/PodcastList'
import NewsList from '@/app/components/home/NewsList'
import TuneTracker from '@/app/components/home/TuneTracker'
import ProgramsSection from '@/app/components/home/ProgramsSection'
import { prisma } from '@/lib/prisma'

const BoardSliderAnnouncer = dynamic(() => import('@/app/components/BoardSliderAnnouncer'), {
  loading: () => <div className="h-96 w-full animate-pulse rounded-2xl bg-white/20" />,
})

function AnnouncersSection() {
  return (
    <section className="bg-gradient-to-b from-orange-400 via-orange-300 to-yellow-200 py-24 text-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl text-center sm:text-left">
          <h2 className="font-accent mb-4 text-5xl font-bold text-white sm:text-7xl">
            Our Announcers
          </h2>
          <p className="font-body text-lg text-white/90">
            Temui Announcer kami yang penuh talenta dan cerita!
          </p>
        </div>
        <BoardSliderAnnouncer />
      </div>
    </section>
  )
}

export default async function Home() {
  const [podcasts, newsItems, tunes] = await Promise.all([
    prisma.podcast.findMany({
      take: 2,
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    }),
    prisma.blogPost.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { authors: { include: { user: true } } },
    }),
    prisma.tuneTrackerEntry.findMany({
      take: 10,
      orderBy: { order: 'asc' },
    }),
  ])

  // Serialize dates to avoid Next.js serialization warning/error
  const serializedPodcasts = podcasts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    author: p.author
      ? {
          ...p.author,
          createdAt: p.author.createdAt.toISOString(),
          emailVerified: p.author.emailVerified ? p.author.emailVerified.toISOString() : null,
        }
      : null,
  }))

  const serializedNews = newsItems.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    authors: n.authors.map((a) => ({
      ...a,
      user: {
        ...a.user,
        createdAt: a.user.createdAt.toISOString(),
        emailVerified: a.user.emailVerified ? a.user.emailVerified.toISOString() : null,
      },
    })),
  }))

  const serializedTunes = tunes.map((t) => ({
    ...t,
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <main className="flex min-h-screen flex-col bg-white font-sans">
      <Navbar />
      <HeroSection />
      <PodcastList podcasts={serializedPodcasts} />
      <NewsList newsItems={serializedNews} />
      {/* <ProgramsSection /> */}
      <TuneTracker tunes={serializedTunes} />
      <AnnouncersSection />
      <FooterSection />
    </main>
  )
}

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://8ehradioitb.com";

  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agency`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog/all`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/podcast`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/programs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/media-partner`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    const blogPosts = await prisma.blogPost.findMany({
      select: { slug: true, updatedAt: true },
    });

    const blogUrls = blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    const podcasts = await prisma.podcast.findMany({
      select: { id: true, updatedAt: true },
    });

    const podcastUrls = podcasts.map((podcast) => ({
      url: `${baseUrl}/podcast/${podcast.id}`,
      lastModified: podcast.updatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    }));

    return [...staticPages, ...blogUrls, ...podcastUrls];
  } catch (e) {
    // Fallback to static pages only if DB is not reachable during build/runtime
    return staticPages;
  }
}


import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import FooterSection from "@/app/components/FooterSection";
import Pagination from "@/app/components/Pagination";
import { prisma } from "@/lib/prisma";

const POSTS_PER_PAGE = 9;

const BlogCard = ({ article }) => (
    <Link href={`/blog/${article.slug}`} className="flex flex-col group">
      <div className="w-full h-60 relative rounded-lg overflow-hidden mb-4">
        <Image
          src={article.mainImage || '/placeholder-news1.png'}
          alt={article.title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <p className="font-body text-sm text-red-600 mb-1 font-medium">
        {article.category}
      </p>
      <h3 className="font-heading text-xl text-gray-900 font-bold mb-3">
        {article.title}
      </h3>
      <p className="font-body text-sm text-gray-600 mb-4 flex-grow line-clamp-2">
        {article.description}
      </p>
      <div className="flex items-center text-xs text-gray-500 mt-auto">
        {article.authors?.[0]?.user?.image && (
          <div className="w-8 h-8 relative mr-2">
            <Image
              src={article.authors[0].user.image}
              alt={article.authors[0].user.name || 'Author'}
              fill
              className="rounded-full"
            />
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-800">{article.authors?.map(a => a.user.name).join(', ') || '8EH Radio ITB'}</p>
          <p>
            {new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {article.readTime && ` • ${article.readTime}`}
          </p>
        </div>
      </div>
    </Link>
  );

async function getPaginatedPosts(page = 1) {
    const skip = (page - 1) * POSTS_PER_PAGE;
    const take = POSTS_PER_PAGE;
  
    const posts = await prisma.blogPost.findMany({
      skip,
      take,
      orderBy: {
        createdAt: "desc",
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
    });
  
    const totalPosts = await prisma.blogPost.count();
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  
    return { posts, totalPages };
}

async function PaginatedBlogContent({ currentPage }) {
  const { posts, totalPages } = await getPaginatedPosts(currentPage);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {posts.map((post) => (
          <BlogCard key={post.id} article={post} />
        ))}
      </div>

      <Pagination totalPages={totalPages} basePath="/blog/all" />
    </>
  );
}

function LoadingBlogContent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {Array.from({ length: POSTS_PER_PAGE }).map((_, index) => (
        <div key={index} className="flex flex-col animate-pulse">
          <div className="w-full h-60 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AllBlogsPage({ searchParams }) {
  const currentPage = Number(searchParams.page) || 1;
  return (
    <div className="bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-left mb-12">
          <h1 className="text-4xl font-bold font-heading text-gray-900 mb-2">
            All Blog Posts
          </h1>
          <p className="text-lg font-body text-gray-600">
            Explore all of our articles and stories.
          </p>
        </div>

        <Suspense fallback={<LoadingBlogContent />}>
          <PaginatedBlogContent currentPage={currentPage} />
        </Suspense>
      </main>
      <FooterSection />
    </div>
  );
}

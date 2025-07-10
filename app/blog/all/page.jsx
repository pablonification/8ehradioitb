"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import FooterSection from "@/app/components/FooterSection";
import Pagination from "@/app/components/Pagination";
import { allBlogPosts } from "@/app/blog/data";

const POSTS_PER_PAGE = 10;

// Re-using the BlogCard component definition from the main blog page
const BlogCard = ({ article }) => (
  <Link href={`/blog/${article.slug}`} className="flex flex-col group">
    <div className="w-full h-60 relative rounded-lg overflow-hidden mb-4">
      <Image
        src={article.image}
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
    <p className="font-body text-sm text-gray-600 mb-4 flex-grow">
      {article.description}
    </p>
    <div className="flex items-center text-xs text-gray-500 mt-auto">
      <div className="w-8 h-8 relative mr-2">
        <Image
          src={article.authorImage}
          alt={article.author}
          fill
          className="rounded-full"
        />
      </div>
      <div>
        <p className="font-semibold text-gray-800">{article.author}</p>
        <p>
          {article.date} &bull; {article.readTime}
        </p>
      </div>
    </div>
  </Link>
);

// Separate component for the paginated content
function PaginatedBlogContent() {
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const totalPages = Math.ceil(allBlogPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const currentPosts = allBlogPosts.slice(startIndex, endIndex);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {currentPosts.map((post, index) => (
          <BlogCard key={index} article={post} />
        ))}
      </div>

      <Pagination totalPages={totalPages} basePath="/blog/all" />
    </>
  );
}

// Loading component for Suspense fallback
function LoadingBlogContent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col animate-pulse">
          <div className="w-full h-60 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded mb-3"></div>
          <div className="h-16 bg-gray-200 rounded mb-4"></div>
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
            <div className="h-4 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AllBlogsPage() {
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
          <PaginatedBlogContent />
        </Suspense>
      </main>
      <FooterSection />
    </div>
  );
}

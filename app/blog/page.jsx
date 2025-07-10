import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import FooterSection from "@/app/components/FooterSection";
import { allBlogPosts } from "@/app/blog/data";

// --- DUMMY DATA ---
const featuredArticle = allBlogPosts[0];
const latestBlogs = allBlogPosts.slice(0, 9);

// --- NEW COMPONENTS FOR THE BLOG PAGE ---

const FeaturedArticle = ({ article }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
    <div className="w-full h-80 relative rounded-lg overflow-hidden">
      <Image
        src={article.image}
        alt={article.title}
        layout="fill"
        objectFit="cover"
      />
    </div>
    <div>
      <p className="font-body text-sm text-red-600 mb-2 font-medium">
        {article.category}
      </p>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 font-heading">
        {article.title}
      </h2>
      <p className="text-gray-600 mb-4 font-body">{article.description}</p>
      <div className="flex items-center mt-auto">
        <div className="w-10 h-10 relative mr-3">
          <Image
            src={article.authorImage}
            alt={article.author}
            fill
            className="rounded-full"
          />
        </div>
        <div className="flex flex-col">
          <p className="font-body font-semibold text-sm text-gray-800">
            {article.author}
          </p>
          <p className="font-body text-xs text-gray-500">
            {article.date} &bull; {article.readTime}
          </p>
        </div>
      </div>
    </div>
  </div>
);

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

const SectionHeader = ({ title, linkText = "See all", linkHref }) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold text-gray-900 font-heading">{title}</h2>
    <Link
      href={linkHref}
      className="text-sm font-medium text-red-600 hover:underline font-body"
    >
      {linkText} →
    </Link>
  </div>
);

export default function Blog() {
  return (
    <div className="bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Welcome Header */}
        <section className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-sm font-body font-medium text-gray-500 uppercase tracking-widest mb-2">
            Blog
          </p>
          <h1 className="text-4xl font-heading font-bold text-gray-900">
            Craft narratives that ignite inspiration,
            <br />
            knowledge, and entertainment.
          </h1>
        </section>

        {/* Featured Article */}
        <section>
          <FeaturedArticle article={featuredArticle} />
        </section>

        {/* Latest Blog */}
        <section>
          <SectionHeader title="Latest Blog" linkHref="/blog/all" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {latestBlogs.map((article, index) => (
              <BlogCard key={index} article={article} />
            ))}
          </div>
        </section>
      </main>
      <FooterSection />
    </div>
  );
}

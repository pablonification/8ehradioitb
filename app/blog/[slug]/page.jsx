"use client";

import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/app/components/Navbar";
import FooterSection from "@/app/components/FooterSection";

// --- MOCK DATA FOR A SINGLE BLOG POST ---
const post = {
  slug: "exploring-the-vibrant-world-of-campus-life",
  title: "Exploring the Vibrant World of Campus Life",
  category: "Updates",
  author: "John Doe",
  authorRole: "Content Writer, 8EH Radio",
  authorImage: "/8eh-real.svg", // Using an existing placeholder
  date: "11 Jan 2023",
  readTime: "5 min read",
  mainImage: "/placeholder-news2.png", // Using an existing placeholder
  tags: [
    "Campus Life",
    "Student Engagement",
    "Media Innovation",
    "Creative Programs",
  ],
  content: `
### Introduction
Mi tincidunt elit, id quisque ligula ac diam, amet. Vel etiam sus-pendisse morbi eleifend faucibus eget. Eget quis mi enim, leo lacinia pharetra, semper. Eget in volutpat mollis at volutpat lectus velit, sed auctor. Porttitor fames arcu quis fusce augue enim. Quis at habitant diam at. Suscipit tristique risus, at donec. In amet, vitae risi, tellus tincidunt. At feugiat sapien varius id.

![An image caption that describes the image.](/placeholderlek.JPG)

Dolor enim eu tortor urna sed duis nulla. Aliquam vestibulum, nulla odio nisl vitae. In aliquet pellentesque aenean hac vestibulum turpis mi bibendum diam. Tempor integer aliquam in vitae malesuada fringilla.

> "Ipsum sit mattis nulla quam nulla. Gravida id gravida ac enim mauris id. Non et tellus molestie sem nunc, dictumst. Sapien, dictumst ac, scelerisque cras tempus. Diam elit, orci, tincidunt aenean tempus."

Tristique odio senectus nam posuere ornare leo metus, ultricies. Blandit duis ultricies et in cras placerat elit. Aliquam tellus lorem sed ac. Montes, sed mattis pellentesque suscipit
viverra aenean magna risus elementum faucibus mollis. Velit sed quis proin morbi quisque dictumst. In et vitae vestibulum.

### Conclusion
Morbi sed imperdiet in ipsum, adipiscing elit dui lectus. Tellus id scelerisque est ultricies ultricies. Duis est sit sed leo nisl, blandit elit sagittis. Quis-que tristique consequat quam sed. Nisl at scelerisque amet nulla purus enim. Nunc sed faucibus bibendum feugiat sed interdum. Ipsum egestas condimentum mi massa. In tincidunt turpis ut et. Et et sed nec ut, adipiscing arc.
`,
};

const socialIcons = {
  linkedin: "/LinkedIn.svg",
  x: "/X.svg",
  instagram: "/Instagram.svg",
};

// --- BLOG POST PAGE ---
export default function BlogPostPage({ params }) {
  // In a real app, you'd fetch the post data based on `params.slug`
  // For now, we'll use the mock data.

  return (
    <div className="bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <article>
          {/* Header */}
          <div className="mb-12">
            <p className="text-sm font-body text-gray-600 mb-4">
              <Link href="/blog" className="hover:underline">
                Blog
              </Link>{" "}
              &gt; <span className="text-gray-900">{post.category}</span>
            </p>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
              {post.title}
            </h1>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full relative overflow-hidden">
                  <Image src={post.authorImage} alt={post.author} fill />
                </div>
                <div>
                  <p className="font-body font-semibold text-gray-900">
                    {post.author}
                  </p>
                  <p className="font-body text-sm text-gray-500">
                    {post.date} &bull; {post.readTime}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-gray-700">
                <Image
                  src="/LinkedIn.svg"
                  alt="LinkedIn"
                  width={20}
                  height={20}
                  className="cursor-pointer hover:text-red-600"
                />
                <Image
                  src="/X.svg"
                  alt="X"
                  width={20}
                  height={20}
                  className="cursor-pointer hover:text-red-600"
                />
                <Image
                  src="/Instagram.svg"
                  alt="Instagram"
                  width={20}
                  height={20}
                  className="cursor-pointer hover:text-red-600"
                />
              </div>
            </div>
          </div>

          {/* Main Image */}
          <div className="w-full aspect-video bg-gray-200 rounded-2xl relative overflow-hidden mb-12">
            <Image
              src={post.mainImage}
              alt={post.title}
              layout="fill"
              objectFit="cover"
            />
          </div>

          {/* Markdown Content */}
          <div className="max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-4xl font-heading font-bold text-gray-900 mb-6 mt-8 leading-tight"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-3xl font-heading font-bold text-gray-900 mb-4 mt-8 leading-tight"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-2xl font-heading font-bold text-gray-900 mb-3 mt-6 leading-tight"
                    {...props}
                  />
                ),
                h4: ({ node, ...props }) => (
                  <h4
                    className="text-xl font-heading font-bold text-gray-900 mb-2 mt-4 leading-tight"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="font-body text-gray-800 leading-relaxed mb-4"
                    {...props}
                  />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-red-600 bg-gray-50 pl-6 py-4 italic font-body text-gray-800 my-6"
                    {...props}
                  />
                ),
                img: ({ node, ...props }) => (
                  <div className="my-8">
                    <img
                      className="rounded-xl shadow-md w-full h-auto object-cover"
                      {...props}
                    />
                  </div>
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-red-600 no-underline hover:underline hover:text-red-700"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-gray-800 mb-1" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="text-gray-900 font-semibold" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="text-gray-800" {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code
                    className="text-red-600 bg-gray-100 px-1 py-0.5 rounded"
                    {...props}
                  />
                ),
                pre: ({ node, ...props }) => (
                  <pre
                    className="bg-gray-100 text-gray-800 border border-gray-200 p-4 rounded-lg overflow-x-auto"
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
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="font-body font-semibold mr-2 text-gray-700">
                Tags
              </span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full font-body"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Author Box */}
            <div className="bg-gray-100 p-6 rounded-2xl flex items-center space-x-6">
              <div className="w-20 h-20 bg-gray-200 rounded-full relative overflow-hidden flex-shrink-0">
                <Image src={post.authorImage} alt={post.author} fill />
              </div>
              <div>
                <p className="font-heading font-bold text-lg text-gray-900">
                  {post.author}
                </p>
                <p className="font-body text-gray-600">{post.authorRole}</p>
              </div>
            </div>
          </div>
        </article>
      </main>
      <FooterSection />
    </div>
  );
}

export const allBlogPosts = [
  {
    slug: "work-life-balance-101",
    category: "Achievement",
    title: "Work Life Balance 101 (Kru's Version)",
    description:
      "Dibalik siaran radio, ada para Kru yang diam-diam menjadi mahasiswa ambis. Hamzah salah satunya!",
    author: "Aline",
    date: "6 Juni 2025",
    readTime: "5 min read",
    image: "/placeholder-news1.png",
    authorImage: "/8eh-real.svg",
  },
  {
    slug: "merakit-asa",
    category: "Events",
    title: "Merakit Asa",
    description:
      "Aksi angkatan MERAKIT'24 SAPPK ITB menjadi bukti bahwa kolaborasi dan kepedulian sosial dapat tumbuh dari lingkungan kampus.",
    author: "Abel",
    date: "4 Juni 2025",
    readTime: "5 min read",
    image: "/placeholder-news2.png",
    authorImage: "/8eh-real.svg",
  },
  {
    slug: "the-last-paradise",
    category: "News",
    title: "They Call It... The Last Paradise",
    description:
      "Menambang nikel di Raja Ampat adalah bentuk keserakahan yang dibungkus dalih kebutuhan.",
    author: "Zahra, Mahar, & Ody",
    date: "8 Juni 2025",
    readTime: "5 min read",
    image: "/placeholder-news3.png",
    authorImage: "/8eh-real.svg",
  },
  // Add more posts to test pagination
  ...Array.from({ length: 22 }, (_, i) => ({
    slug: `sample-post-${i + 1}`,
    category: "Sample Category",
    title: `Sample Post Title ${i + 1}`,
    description: `This is the description for sample post number ${
      i + 1
    }. It's here to fill space.`,
    author: "Test Author",
    date: "1 Jan 2025",
    readTime: "4 min read",
    image: `/placeholder-news${(i % 3) + 1}.png`,
    authorImage: "/8eh-real.svg",
  })),
];

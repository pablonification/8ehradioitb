import { NextResponse } from "next/server";

/**
 * Mock data for new/unpublished blog posts
 * These are blog drafts that don't have readCount yet (not published)
 * Used for: POST /predictions/{model_id} from Predictia API
 */
const mockNewBlogs = [
  {
    id: "new_blog_001",
    title: "Mengenal Lebih Dekat Program Unggulan 8EH Radio ITB",
    slug: "mengenal-program-unggulan-8eh-radio-itb",
    content:
      "8EH Radio ITB memiliki berbagai program unggulan yang menarik untuk didengarkan. Mulai dari musik, talkshow, hingga podcast yang informatif. Program-program ini dirancang khusus untuk mahasiswa ITB dan masyarakat umum yang ingin mendapatkan hiburan berkualitas sekaligus informasi terkini seputar kampus dan dunia luar.",
    description:
      "Artikel tentang program-program unggulan yang ada di 8EH Radio ITB",
    readTime: "5 min",
    category: "Program",
    mainImage: "/vstock-programs-1.png",
    tags: ["radio", "program", "8EH", "ITB"],
    isFeatured: false,
    authors: [
      {
        user: {
          id: "mock_author_001",
          name: "Tim Redaksi 8EH",
          image: null,
        },
      },
    ],
    createdAt: "2025-12-20T06:00:00.000Z",
    updatedAt: "2025-12-20T06:00:00.000Z",
  },
  {
    id: "new_blog_002",
    title: "Tips Menjadi Penyiar Radio yang Baik untuk Pemula",
    slug: "tips-menjadi-penyiar-radio-pemula",
    content:
      "Menjadi penyiar radio membutuhkan latihan dan dedikasi. Artikel ini akan membahas tips-tips praktis bagi pemula yang ingin memulai karir sebagai penyiar radio. Dari teknik vokal, cara membaca berita, hingga bagaimana membangun chemistry dengan pendengar melalui gelombang radio.",
    description: "Panduan lengkap untuk menjadi penyiar radio bagi pemula",
    readTime: "8 min",
    category: "Tutorial",
    mainImage: "/vstock-podcast-2.png",
    tags: ["penyiar", "tutorial", "radio", "tips"],
    isFeatured: false,
    authors: [
      {
        user: {
          id: "mock_author_002",
          name: "Divisi Announcer 8EH",
          image: null,
        },
      },
    ],
    createdAt: "2025-12-19T10:30:00.000Z",
    updatedAt: "2025-12-19T10:30:00.000Z",
  },
  {
    id: "new_blog_003",
    title: "Sejarah Radio Kampus di Indonesia: Dari Analog ke Digital",
    slug: "sejarah-radio-kampus-indonesia",
    content:
      "Radio kampus memiliki sejarah panjang di Indonesia. Dimulai dari era analog dengan peralatan sederhana, kini radio kampus telah bertransformasi ke era digital dengan streaming online. Artikel ini menelusuri perjalanan radio kampus dari masa ke masa dan bagaimana 8EH Radio ITB menjadi bagian dari sejarah tersebut.",
    description:
      "Menelusuri sejarah perkembangan radio kampus di Indonesia dari era analog hingga digital",
    readTime: "12 min",
    category: "Sejarah",
    mainImage: "/radio-home.png",
    tags: ["sejarah", "radio kampus", "digital", "analog"],
    isFeatured: true,
    authors: [
      {
        user: {
          id: "mock_author_003",
          name: "Divisi Research 8EH",
          image: null,
        },
      },
    ],
    createdAt: "2025-12-18T14:00:00.000Z",
    updatedAt: "2025-12-18T14:00:00.000Z",
  },
  {
    id: "new_blog_004",
    title: "Kolaborasi 8EH Radio dengan Komunitas Musik Bandung",
    slug: "kolaborasi-8eh-komunitas-musik-bandung",
    content:
      "8EH Radio ITB aktif berkolaborasi dengan berbagai komunitas musik di Bandung. Kolaborasi ini meliputi live session, interview dengan musisi lokal, hingga promosi event musik kampus. Simak bagaimana 8EH Radio menjadi jembatan antara talenta musik lokal dengan pendengar yang lebih luas.",
    description:
      "Cerita kolaborasi 8EH Radio ITB dengan komunitas musik lokal Bandung",
    readTime: "6 min",
    category: "Kolaborasi",
    mainImage: "/group-microphone.png",
    tags: ["musik", "kolaborasi", "Bandung", "komunitas"],
    isFeatured: false,
    authors: [
      {
        user: {
          id: "mock_author_004",
          name: "Divisi Music 8EH",
          image: null,
        },
      },
    ],
    createdAt: "2025-12-17T09:15:00.000Z",
    updatedAt: "2025-12-17T09:15:00.000Z",
  },
  {
    id: "new_blog_005",
    title: "Podcast 8EH: Platform Diskusi Mahasiswa ITB",
    slug: "podcast-8eh-platform-diskusi-mahasiswa",
    content:
      "Podcast 8EH menjadi wadah bagi mahasiswa ITB untuk berdiskusi tentang berbagai topik menarik. Dari isu kampus, teknologi, hingga lifestyle mahasiswa. Podcast ini hadir dengan format yang santai namun tetap informatif, cocok untuk menemani aktivitas sehari-hari.",
    description:
      "Mengenal lebih dekat podcast 8EH sebagai platform diskusi mahasiswa",
    readTime: "7 min",
    category: "Podcast",
    mainImage: "/boombox-podcast.png",
    tags: ["podcast", "diskusi", "mahasiswa", "ITB"],
    isFeatured: false,
    authors: [
      {
        user: {
          id: "mock_author_005",
          name: "Tim Podcast 8EH",
          image: null,
        },
      },
    ],
    createdAt: "2025-12-16T11:45:00.000Z",
    updatedAt: "2025-12-16T11:45:00.000Z",
  },
];

export async function GET() {
  try {
    return NextResponse.json(mockNewBlogs);
  } catch (error) {
    console.error("Error fetching new blog posts:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

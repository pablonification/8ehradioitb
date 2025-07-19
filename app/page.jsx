"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";
import ButtonPrimary from "@/app/components/ButtonPrimary";
import BoardSliderAnnouncer from "@/app/components/BoardSliderAnnouncer";
import RadioPlayer from "@/app/components/RadioPlayer";
import FooterSection from "@/app/components/FooterSection";
import PodcastAudioPlayer from "@/app/components/PodcastAudioPlayer";

// ---------------------------------------------------------------------------
//  Placeholder data (to be replaced with real content later)
// ---------------------------------------------------------------------------

// Podcasts - will be fetched from API
const podcasts = [];

// News - will be fetched from API
const newsItems = [];

// Programs
const programs = [
  {
    title: "Hias Kue Ultah",
    schedule: "Thursday 11.00 - 13.00",
    image: "/placeholder-program.png",
  },
  {
    title: "Dulu vs Sekarang",
    schedule: "Thursday 11.00 - 13.00",
    image: "/placeholder-program.png",
  },
  {
    title: "Gather With Us!",
    schedule: "Thursday 11.00 - 13.00",
    image: "/placeholder-program.png",
  },
  {
    title: "Night Drive",
    schedule: "Friday 20.00 - 22.00",
    image: "/placeholder-program.png",
  },
  {
    title: "Morning Brew",
    schedule: "Monday 08.00 - 10.00",
    image: "/placeholder-program.png",
  },
];

// Tune Tracker – top 10 songs (placeholder)
const tunes = [
  {
    title: "Ordinary",
    artist: "Alex Warren",
    image: "/music-1.png",
  },
  {
    title: "Back To Friend",
    artist: "Sombr",
    image: "/music-2.png",
  },
  {
    title: "Birds Of A Feather",
    artist: "Billie Eilish",
    image: "/music-3.png",
  },
  {
    title: "Sapphire",
    artist: "Ed Sheeran",
    image: "/music-4.png",
  },
  {
    title: "Luther (With SZA)",
    artist: "Kendrick Lamar, SZA",
    image: "/music-5.png",
  },
  {
    title: "You'll Be In My Heart",
    artist: "NIKI",
    image: "/music-6.png",
  },
  {
    title: "Monolog",
    artist: "Pamungkas",
    image: "/music-7.png",
  },
  {
    title: "WILDFLOWER",
    artist: "Billie Eilish",
    image: "/music-3.png",
  },
  {
    title: "Rumah ke Rumah",
    artist: "Hindia",
    image: "/music-8.png",
  },
  {
    title: "Die With A Smile",
    artist: "Laddy Gaga, Bruno Mars",
    image: "/music-9.png",
  },
];

// ---------------------------------------------------------------------------
//  Section components – kept in this file to minimize additional files
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section className="relative bg-[#FDFBF6] pt-28 pb-0 overflow-hidden" role="banner" aria-label="Welcome to 8EH Radio ITB">
      {/* Decorative gradient blob */}
      <Image
        src="/mastercard.png"
        alt="Abstract background gradient for 8EH Radio ITB hero section"
        width={2000}
        height={434}
        className="absolute -top-10 left-160 -translate-x-1/2 pointer-events-none select-none opacity-70 z-0"
        priority
      />

      {/* Content container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid md:grid-cols-2 gap-x-8 items-start">
        {/* Text */}
        <div className="md:col-span-1">
          <h1 className="font-accent font-bold text-5xl sm:text-6xl md:text-7xl leading-tight text-gray-900">
            Welcome to <br />
            8EH Radio ITB
          </h1>
        </div>
        {/* CTA */}
        <div className="space-y-6 md:col-span-1 md:text-left mt-8 md:mt-2">
          <p className="font-body text-base text-gray-700 max-w-sm">
            Tune in to 8EH Radio for the latest in campus news, music, and
            entertainment. Join our vibrant community and explore a world of
            creativity and fun!
          </p>
          <div className="flex items-center gap-4 justify-start">
            <ButtonPrimary
              className="!bg-[#EA4A30] !text-white hover:!bg-[#D0402A] !px-8 !py-3"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("triggerPlayerControl"))
              }
              aria-label="Listen to 8EH Radio ITB live stream"
            >
              Listen
            </ButtonPrimary>
            <a
              href="https://www.instagram.com/regenerasi8eh/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
              aria-label="Follow us on Instagram"
            >
              <ButtonPrimary
                className="!bg-[#EFEAE6]/80 !text-[#444] hover:!bg-[#E5DED8] !px-8 !py-3"
              >
                Join
              </ButtonPrimary>
            </a>
          </div>
        </div>
      </div>

      {/* Radio Image with Fade */}
      <div className="relative -mt-36 md:-mt-60 flex justify-center">
        <Image
          src="/radio-home.png"
          alt="8EH Radio ITB Studio Illustration"
          width={1200}
          height={700}
          className="[mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)] mix-blend-multiply"
          priority
        />
      </div>

      {/* Sticky small player (desktop) */}
      <div className="hidden">
        <RadioPlayer compact />
      </div>
    </section>
  );
}

function PodcastSection() {
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPodcast, setCurrentPodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetch("/api/podcast")
      .then((res) => res.json())
      .then((data) => {
        // Get only the 2 latest podcasts
        const latestPodcasts = data.slice(0, 2);
        console.log("Podcast data:", latestPodcasts); // Debug log
        setPodcasts(latestPodcasts);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching podcast data:", error);
        setLoading(false);
      });
  }, []);

  const handlePlayPause = (pod) => {
    console.log("Play/Pause clicked for podcast:", pod.title);
    console.log("Current podcast:", currentPodcast?.title);
    console.log("Audio URL:", pod.audioUrl);
    
    if (currentPodcast && currentPodcast.id === pod.id) {
      // Same podcast - toggle play/pause
      console.log("Toggling play/pause for same podcast");
      setIsPlaying((prev) => !prev);
    } else {
      // Different podcast - switch to new one and play
      console.log("Switching to new podcast and playing");
      setCurrentPodcast(pod);
      // Small delay to ensure state updates before playing
      setTimeout(() => {
        setIsPlaying(true);
      }, 100);
    }
  };

  return (
    <section className="pt-12 pb-16 bg-white relative overflow-hidden">
      {/* Background decorative blob */}
      <div className="absolute -right-1/8 -top-1/8 w-1/2 h-full z-0 pointer-events-none">
        <Image
          src="/vstock-home.png"
          alt="background decorative gradient"
          width={800}
          height={800}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="font-accent text-5xl sm:text-6xl text-gray-900 mb-4">
          Listen to Our Podcast
        </h2>
        <div className="w-1/2 sm:w-1/3 border-t-2 border-gray-200 mb-10" />

        {/* Podcasts List */}
        {loading ? (
          <div className="text-center py-8">Loading podcasts...</div>
        ) : podcasts.length > 0 ? (
          <div className="space-y-4">
            {podcasts.map((pod, idx) => {
              const playing = currentPodcast && currentPodcast.id === pod.id && isPlaying;
              return (
                <div
                  key={pod.id || idx}
                  className="flex items-start gap-4 sm:gap-6 py-8 border-b border-gray-200/80 last:border-b-0"
                >
                  {/* Image */}
                  <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 relative flex-shrink-0">
                    <img
                      src={pod.image || pod.coverImage || "/8eh-real.svg"}
                      alt="Podcast Thumbnail"
                      className="object-cover rounded-2xl shadow-md w-full h-full"
                    />
                  </div>
                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="font-heading text-lg sm:text-xl text-gray-900 font-bold mb-2">
                      {pod.title}
                    </h3>
                    <p className="font-body text-sm text-gray-500 mb-2">
                      {pod.subtitle}
                    </p>
                    <p className="font-body text-sm text-gray-600 mb-4 leading-relaxed">
                      {pod.description}
                    </p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="font-body text-xs sm:text-sm text-gray-500">
                        {pod.date} &bull; {pod.duration}
                      </p>
                      <ButtonPrimary 
                        className="!w-12 !h-12 !p-0 !rounded-full flex items-center justify-center flex-shrink-0"
                        aria-label={playing ? "Pause Podcast" : "Play Podcast"}
                        onClick={() => handlePlayPause(pod)}
                      >
                        {playing ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            fill="white"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <rect x="6" y="5" width="4" height="14" />
                            <rect x="14" y="5" width="4" height="14" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            fill="white"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <polygon points="6,4 20,12 6,20" fill="white" />
                          </svg>
                        )}
                      </ButtonPrimary>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No podcasts available yet.</div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <ButtonPrimary
            className="!bg-gray-100 !text-gray-800 hover:!bg-gray-200 !font-medium !px-8 !py-3"
            onClick={() => window.open('/podcast', '_self')}
          >
            View all
          </ButtonPrimary>
        </div>
      </div>
      
      {/* Render PodcastAudioPlayer if a podcast is selected */}
      {currentPodcast && (
        <PodcastAudioPlayer
          audioUrl={currentPodcast.audioUrl}
          title={currentPodcast.title}
          image={currentPodcast.image || currentPodcast.coverImage || "/8eh-real.svg"}
          subtitle={currentPodcast.subtitle}
          description={currentPodcast.description}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      )}
    </section>
  );
}

function NewsSection() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        // Get only the 3 latest blog posts
        const latestPosts = data.slice(0, 3);
        console.log("Blog data:", latestPosts); // Debug log
        setNewsItems(latestPosts);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching blog data:", error);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <section className="py-16 bg-white relative">
      <div className="absolute top-10 left-1/4 opacity-80 -translate-x-1/2">
        <Image
          src="/vstock-home1.png"
          alt="decoration"
          width={150}
          height={150}
        />
      </div>
      <div className="absolute top-10 right-1/4 opacity-80 translate-x-1/2">
        <Image
          src="/vstock-home2.png"
          alt="decoration"
          width={150}
          height={150}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="font-accent text-6xl font-bold text-gray-900 mb-2">
          Latest Campus News
        </h2>
        <p className="font-body text-gray-600 mb-16">
          Stay updated with campus happenings and insights.
        </p>

        {loading ? (
          <div className="text-center py-8">Loading news...</div>
        ) : newsItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-left">
            {newsItems.map((item, idx) => (
              <Link href={`/blog/${item.slug}`} key={item.id || idx} className="block group">
                <div className="bg-gradient-to-b from-[#FEF9E7] to-[#F5E6A3] rounded-3xl shadow-sm overflow-hidden flex flex-col h-full p-4 transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:scale-[1.02]">
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <img
                      src={item.mainImage || "/placeholder-news1.png"}
                      alt={item.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="pt-6 px-2 flex flex-col flex-grow">
                    <p className="font-body text-sm text-gray-500 mb-2 font-medium">
                      {item.category || "News"}
                    </p>
                    <h3 className="font-heading text-xl text-gray-900 font-bold mb-3">
                      {item.title}
                    </h3>
                    <p className="font-body text-sm text-gray-600 mb-6 flex-grow line-clamp-3">
                      {item.description || "No description available"}
                    </p>
                    <div className="flex items-center mt-auto">
                      <div className="w-10 h-10 relative mr-3">
                        <img
                          src={
                            item.authors?.[0]?.user?.image 
                              ? (item.authors[0].user.image.includes('googleusercontent.com')
                                  ? item.authors[0].user.image.replace(/=s\d+-c/, '=s150-c')
                                  : item.authors[0].user.image.startsWith('http') 
                                    ? item.authors[0].user.image 
                                    : `${window.location.origin}${item.authors[0].user.image}`)
                              : "/8eh-real.svg"
                          }
                          alt={item.authors?.[0]?.user?.name || "Author"}
                          className="rounded-full w-full h-full object-cover"
                          onError={(e) => {
                            console.log("Image failed to load:", e.target.src);
                            // Try alternative Google image size if it's a Google image
                            if (e.target.src.includes('googleusercontent.com') && !e.target.src.includes('=s150-c')) {
                              e.target.src = e.target.src.replace(/=s\d+-c/, '=s150-c');
                            } else {
                              e.target.src = "/8eh-real.svg";
                              e.target.onerror = null; // Prevent infinite loop
                            }
                          }}
                          onLoad={(e) => {
                            console.log("Image loaded successfully:", e.target.src);
                          }}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="font-body font-semibold text-sm text-gray-800">
                          {item.authors?.[0]?.user?.name || "8EH Team"}
                        </p>
                        <p className="font-body text-xs text-gray-500">
                          {formatDate(item.createdAt)} &bull; {item.readTime || "5 min read"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No news articles available yet.</div>
        )}

        <div className="text-center mt-12">
          <ButtonPrimary
            className="!bg-gray-200 !text-gray-800 hover:!bg-gray-300 !font-medium !px-6 !py-2.5"
            onClick={() => {
              window.open('/blog', '_self');
            }}
          >
            View all
          </ButtonPrimary>
        </div>
      </div>
    </section>
  );
}

function ProgramsSection() {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = current.offsetWidth; // Scroll by the container width
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative py-24 bg-gradient-to-b from-[#FFF8F8] to-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-12">
          <div className="text-left">
            <h2 className="font-heading text-base sm:text-lg md:text-xl text-red-600/90 mb-1">
              Discover the Vibrant World of
            </h2>
            <h3 className="font-accent text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900">
              8EH Radio Programs
            </h3>
          </div>
          {/* Slider Controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/100 hover:border-gray-300 transition-all duration-200 flex items-center justify-center border border-gray-200/80 shadow-md hover:shadow-lg cursor-pointer"
              aria-label="Scroll left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white/70 backdrop-blur-sm hover:bg-white/100 hover:border-gray-300 transition-all duration-200 flex items-center justify-center border border-gray-200/80 shadow-md hover:shadow-lg cursor-pointer"
              aria-label="Scroll right"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scroll-smooth space-x-6 pb-4 -mx-4 px-4 -my-4 py-4 snap-x snap-mandatory hide-scrollbar"
        >
          {programs.map((prog, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-full sm:w-[calc(25%-1.125rem)] snap-center group"
            >
              <div className="relative w-full h-64 sm:h-72 rounded-2xl mb-4 bg-gray-200/80 overflow-hidden transition-all duration-300 group-hover:scale-105">
                {/* Image will go here */}
              </div>
              <div className="text-center px-2">
                <h4 className="font-heading text-xl font-bold text-gray-800 mb-1 truncate">
                  {prog.title}
                </h4>
                <p className="font-body text-sm text-gray-500">
                  {prog.schedule}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TuneTrackerSection() {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [tunes, setTunes] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch("/api/tune-tracker")
      .then((res) => res.json())
      .then((data) => {
        // Always 10 entries, fill missing with placeholder
        const filled = Array.from({ length: 10 }, (_, i) => {
          const found = data.find((e) => e.order === i + 1);
          return found || { order: i + 1, title: "", artist: "", coverImage: "/music-1.png", audioUrl: "" };
        });
        setTunes(filled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handlePlay = (idx) => {
    if (nowPlaying === idx) {
      audioRef.current.pause();
      setNowPlaying(null);
    } else {
      setNowPlaying(idx);
      if (tunes[idx].audioUrl) {
        audioRef.current.src = `/api/proxy-audio?url=${encodeURIComponent(tunes[idx].audioUrl)}`;
        audioRef.current.play();
      }
    }
  };

  return (
    <section className="relative py-24 bg-white text-gray-900 overflow-hidden">
      <audio ref={audioRef} onEnded={() => setNowPlaying(null)} />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px]">
        <Image
          src="/tune-tracker.png"
          alt="Decorative turntable"
          width={900}
          height={900}
          className="w-full h-full object-contain opacity-70 mix-blend-multiply"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <h2 className="font-accent text-6xl font-bold text-gray-900 mb-2">
            Tune Tracker
          </h2>
          <p className="font-body text-gray-600 text-lg">
            Discover the Hottest Tracks: Our Top 10 Music Charts
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {tunes.map((tune, idx) => {
              const isPlaying = nowPlaying === idx;
              return (
                <div
                  key={idx}
                  className="flex items-center p-3 rounded-2xl bg-white/70 border border-gray-200/80 backdrop-blur-md hover:bg-gray-50/80 hover:border-gray-300 transition-all duration-300 shadow-sm"
                >
                  <div className="w-8 text-center text-gray-400 font-mono font-medium">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="w-14 h-14 relative mx-4 rounded-full overflow-hidden flex-shrink-0 shadow-inner">
                    <img
                      src={tune.coverImage || "/music-1.png"}
                      alt={tune.title || `Song ${idx + 1}`}
                      className={`object-cover w-full h-full absolute inset-0 ${isPlaying ? "animate-[spin_3s_linear_infinite]" : ""}`}
                      style={{ position: "absolute", inset: 0 }}
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-heading font-bold text-gray-800">
                      {tune.title || <span className="italic text-gray-400">Coming Soon</span>}
                    </h3>
                    <p className="text-sm text-gray-500">{tune.artist || <span className="italic text-gray-300">Coming Soon</span>}</p>
                  </div>
                  <button
                    onClick={() => handlePlay(idx)}
                    className="w-12 h-12 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0 border border-gray-200/90 shadow-md cursor-pointer disabled:opacity-40"
                    aria-label={`Play ${tune.title}`}
                    disabled={!tune.audioUrl}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 text-gray-700"
                      fill="currentColor"
                    >
                      {isPlaying ? (
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      ) : (
                        <path d="M8 5v14l11-7z" />
                      )}
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function AnnouncersSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-orange-400 via-orange-300 to-yellow-200 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center sm:text-left max-w-2xl mb-12">
          <h2 className="font-accent text-5xl sm:text-7xl text-white font-bold mb-4">
            Our Announcers
          </h2>
          <p className="font-body text-lg text-white/90">
            Meet our talented radio announcers and their stories.
          </p>
        </div>
        <BoardSliderAnnouncer />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
//  Main Page
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-white font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Sections */}
      <HeroSection />
      <PodcastSection />
      <NewsSection />
      <ProgramsSection />
      <TuneTrackerSection />
      <AnnouncersSection />

      {/* Footer */}
      <FooterSection />
    </main>
  );
}

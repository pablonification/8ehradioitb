"use client";

import { useEffect, useState } from "react";
import { FaPlay, FaStar, FaBroadcastTower, FaClock, FaCalendarAlt, FaUsers } from 'react-icons/fa';


// Placeholder data, idealnya ini didapat dari API menggunakan slug
const programData = {
  "gws": {
    name: "GWS: Gather With Us",
    shortDescription: "Gather With Us adalah program podcast yang menghadirkan diskusi santai namun mendalam tentang berbagai topik menarik. Mari berkumpul dan berbagi cerita bersama kami!",
    about: "Gather With Us (GWS) adalah program podcast yang menghadirkan diskusi santai dan interaktif tentang berbagai topik yang relevan dengan kehidupan sehari-hari. Dari lifestyle, teknologi, hingga isu-isu sosial yang sedang trending. Setiap episode, kami mengundang tamu-tamu menarik dari berbagai latar belakang untuk berbagi pengalaman, insight, dan perspektif mereka. Program ini dirancang untuk menciptakan ruang diskusi yang terbuka dan inklusif. Dengan format yang casual namun informatif, GWS menjadi tempat yang tepat untuk mendapatkan inspirasi, wawasan baru, dan tentunya hiburan yang berkualitas.",
    stats: {
      episodes: "50+",
      listeners: "1K+",
      duration: "20min",
      rating: "4.8"
    },
    schedules: [
      { 
        title: "Every Wednesday",
        description: "Regular episodes with special guests",
        time: "7:00 PM - 8:00 PM",
        icon: FaCalendarAlt
      },
      { 
        title: "Live Sessions",
        description: "Interactive live discussions",
        time: "First Friday of Month",
        icon: FaBroadcastTower
      },
      { 
        title: "Special Events",
        description: "Exclusive content and collaborations",
        time: "Monthly",
        icon: FaStar
      }
    ],
  },
  "on-air": {
    name: "CTRL: Coba Tanya Radio Lo!",
    shortDescription: "Program interaktif yang memberikan kesempatan kepada pendengar untuk bertanya dan berdiskusi tentang berbagai topik menarik.",
    about: "CTRL: Coba Tanya Radio Lo! adalah program interaktif yang memberikan kesempatan kepada pendengar untuk bertanya dan berdiskusi tentang berbagai topik menarik. Program ini menghadirkan suasana santai namun tetap informatif, cocok untuk menemani waktu santai Anda. Kami membahas semua hal, mulai dari musik, film, hingga kehidupan kampus, semuanya dari sudut pandang mahasiswa.",
    stats: {
      episodes: "75+",
      listeners: "1.5K+",
      duration: "30min",
      rating: "4.9"
    },
    schedules: [
      { 
        title: "Every Friday",
        description: "Live Q&A sessions with listeners",
        time: "8:00 PM - 9:00 PM",
        icon: FaCalendarAlt
      },
      { 
        title: "Special Segments",
        description: "Featuring guest speakers and experts",
        time: "Bi-weekly",
        icon: FaBroadcastTower
      },
      { 
        title: "CTRL Rewind",
        description: "Highlights from past episodes",
        time: "On-demand",
        icon: FaStar
      }
    ]
  },
};

export default function ProgramDetailPage({ params }) {
  const { slug } = params;
  const [program, setProgram] = useState(null);

  useEffect(() => {
    if (programData[slug]) {
      setProgram(programData[slug]);
    }
  }, [slug]);

  if (!program) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-primary text-accent">
        <p>Loading...</p>
      </main>
    );
  }

  const { name, shortDescription, about, stats, schedules } = program;

  return (
    <main className="bg-primary text-accent font-body">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-secondary to-orange-400 text-white py-20 md:py-32">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <p className="text-lg font-semibold uppercase tracking-wider">Podcast</p>
            <h1 className="text-5xl md:text-7xl font-bold font-heading my-4">{name}</h1>
            <p className="text-lg md:text-xl max-w-lg">{shortDescription}</p>
            <button className="mt-8 bg-white text-secondary font-bold py-3 px-6 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors">
              <FaPlay />
              Listen Now
            </button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="bg-white/20 backdrop-blur-lg p-8 rounded-2xl shadow-lg w-full max-w-md">
              <div className="bg-white p-6 rounded-xl text-center">
                 <h2 className="text-4xl font-bold text-secondary">{name.split(':')[0]}!</h2>
                 <p className="text-gray-600 mt-2">{name.split(':')[1]}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="bg-yellow-400 p-4 rounded-full text-white mb-3">
                <FaPlay size={24} />
              </div>
              <p className="text-3xl font-bold text-primary">{stats.episodes}</p>
              <p className="text-gray-500">Episodes</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-purple-400 p-4 rounded-full text-white mb-3">
                <FaUsers size={24} />
              </div>
              <p className="text-3xl font-bold text-primary">{stats.listeners}</p>
              <p className="text-gray-500">Listeners</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-red-400 p-4 rounded-full text-white mb-3">
                <FaClock size={24} />
              </div>
              <p className="text-3xl font-bold text-primary">{stats.duration}</p>
              <p className="text-gray-500">Avg Duration</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-yellow-500 p-4 rounded-full text-white mb-3">
                <FaStar size={24} />
              </div>
              <p className="text-3xl font-bold text-primary">{stats.rating}</p>
              <p className="text-gray-500">Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl font-bold font-heading text-primary text-center mb-6">Tentang Program {name.split(':')[0]}</h2>
          <p className="text-gray-600 text-lg leading-relaxed text-justify">{about}</p>
        </div>
      </section>
      
      {/* Program Schedule Section */}
      <section className="bg-primary py-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-white mb-12">
            <h2 className="text-4xl font-bold font-heading">Program Schedule</h2>
            <p className="text-lg mt-2 text-gray-300">Jangan lewatkan siaran program {name.split(':')[0]} setiap minggunya</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {schedules.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-gray-800 p-8 rounded-lg text-center flex flex-col items-center">
                  <div className="bg-secondary p-4 rounded-full text-white mb-4">
                    <Icon size={32}/>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 mb-4 flex-grow">{item.description}</p>
                  <p className="font-semibold text-secondary">{item.time}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </main>
  );
}

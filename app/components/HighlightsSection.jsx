// app/components/HighlightsSection.jsx
import Image from 'next/image';

// Data untuk kartu highlight. Idealnya, ini datang dari CMS atau API.
const highlightsData = [
  {
    imageUrl: '/highlight-2.png',
    altText: 'Highlight Program Dulu vs Sekarang',
    link: ''
  },
  {
    imageUrl: '/highlight-1.png',
    altText: 'Highlight Program Gather With Us',
    link: ''
  },
  {
    imageUrl: '/highlight-3.png',
    altText: 'Highlight Program Hias Kue',
    link: ''
  }
];

const HighlightsSection = () => {
  return (
    // Latar belakang gelap untuk menonjolkan kartu
    <section className="relative bg-[url('/highlights-bg.png')] bg-cover bg-center bg-no-repeat py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-300/30 to-white"></div>

      <div className="relative container mx-auto px-12">
        
        {/* Judul "Program Highlights" */}
        <div className="flex justify-center mb-12">
          <h2 className="bg-gradient-to-br backdrop-blur-xs drop-shadow-md from-orange-500/90 via-orange-400/30 to-white/80 text-black text-center font-accent text-4xl lg:text-5xl px-4 lg:px-12 py-3 rounded-xl shadow-lg">
            Program Highlights
          </h2>
        </div>

        {/* Grid untuk Kartu Highlight */}
        <div className="flex flex-wrap justify-center gap-8">
          {highlightsData.map((highlight, index) => (
            <a 
              key={index} 
            //   href={highlight.link} 
              className="group block transform transition-transform duration-300 ease-in-out hover:scale-105"
            >
              <Image
                src={highlight.imageUrl}
                alt={highlight.altText}
                width={500}
                height={500}
                className="w-50 md:w-70 h-60 md:h-90 object-cover rounded-2xl shadow-lg group-hover:shadow-yellow-400/30 group-hover:shadow-2xl drop-shadow-xl/30"
              />
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HighlightsSection;
export default function ContributorsPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-heading font-bold text-white drop-shadow-lg mb-8">
          Contributors
        </h1>
        <div className="flex flex-col items-center justify-center space-y-2 mb-8">
          <p className="text-base font-body font-bold text-white drop-shadow">
            Arqila '29
          </p>
          <p className="text-base font-body font-bold text-white drop-shadow">
            Emir '30
          </p>
          <p className="text-base font-body font-bold text-white drop-shadow">
            Ara '30
          </p>
          <p className="text-base font-body font-bold text-white drop-shadow">
            Nayel '30
          </p>
          <p className="text-base font-body font-bold text-white drop-shadow">
            Iasha '30
          </p>
          <p className="text-base font-body font-bold text-white drop-shadow">
            Aini '30
          </p>
        </div>
        <div className="w-full flex justify-center">
          <div className="aspect-video w-full max-w-2xl rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/Q6hIca__dmA"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

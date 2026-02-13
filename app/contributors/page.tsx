export default function ContributorsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="font-heading mb-8 text-4xl font-bold text-white drop-shadow-lg">
          Contributors
        </h1>
        <div className="mb-8 flex flex-col items-center justify-center space-y-2">
          <p className="font-body text-base font-bold text-white drop-shadow">Arqila '29</p>
          <p className="font-body text-base font-bold text-white drop-shadow">Emir '30</p>
          <p className="font-body text-base font-bold text-white drop-shadow">Ara '30</p>
          <p className="font-body text-base font-bold text-white drop-shadow">Nayel '30</p>
          <p className="font-body text-base font-bold text-white drop-shadow">Iasha '30</p>
          <p className="font-body text-base font-bold text-white drop-shadow">Aini '30</p>
        </div>
        <div className="flex w-full justify-center">
          <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-xl border-2 border-white/20 shadow-lg">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/Q6hIca__dmA"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  )
}

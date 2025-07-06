import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F7D6D6]">
      <div className="relative w-[300px] h-[300px]">
        <Image
          src="/8eh.png"
          alt="8EH Logo"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
      <h1 className="mt-8 text-[#E36F6F] text-4xl tracking-tighter font-bold italic font-['Plus_Jakarta_Sans']">
        #Meresonansi&Berkarya
      </h1>
      <p className="text-center text-gray-600 mt-4">
        On developing...
      </p>
    </main>
  );
}
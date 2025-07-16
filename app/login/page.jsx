"use client";
import Image from "next/image";
import ButtonPrimary from "../components/ButtonPrimary";

// --- Komponen untuk Ikon Google ---
// (Menggunakan SVG langsung di dalam kode agar lebih mudah)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48">
    <path
      fill="white"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    ></path>
    <path
      fill="white"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    ></path>
    <path
      fill="white"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.618-3.226-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    ></path>
    <path
      fill="white"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.088,5.571l6.19,5.238C39.712,34.464,44,28.286,44,20C44,22.659,43.862,21.35,43.611,20.083z"
    ></path>
  </svg>
);

const LoginPage = () => {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#F7D6D6] font-body">
      <div className="grid w-full max-w-7xl grid-cols-1 md:grid-cols-2">
        {/* --- Kolom Kiri (Hanya terlihat di Desktop) --- */}
        <div className="hidden md:flex flex-col items-center justify-center pb-12">
          <Image
            src="/8eh.png" // Ganti dengan path logo Anda
            alt="8EH Radio ITB Logo"
            width={300}
            height={300}
            className="mb-8 drop-shadow-lg w-60 hover:scale-105 transition-transform duration-300"
          />
          <p className="font-heading italic text-3xl font-bold text-[#E36F6F]">
            #Meresonansi&Berkarya
          </p>
        </div>

        {/* --- Kolom Kanan (Form Login) --- */}
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[80vh] md:min-h-0">
          <Image
            src="/8eh.png" // Ganti dengan path logo Anda
            alt="8EH Radio ITB Logo"
            width={120}
            height={120}
            className="md:hidden -mt-20 mb-6 drop-shadow-md w-40 pointer-events-none"
          />
          <h1 className="text-4xl md:text-5xl font-semibold font-heading text-gray-800">
            Ahoy, Kru's!
          </h1>
          <p className="mt-8 mb-2 font-semibold text-gray-800">
            Login to your account
          </p>

          <ButtonPrimary
            className="!bg-[#EA4A30] !text-white hover:!bg-[#D0402A] !py-3 !rounded-2xl flex w-full md:w-2/3 items-center justify-center gap-2"
            onClick={() => {}}
          >
            <Image
              src="/google.png" // Ganti dengan path logo Anda
              alt="Google Logo"
              width={20}
              height={20}
              className="mr-1 drop-shadow-lg"
            />
            Log In with Google Account
          </ButtonPrimary>
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="absolute bottom-4 w-full text-center text-sm text-gray-500">
        © 2025 Technic 8EH Radio ITB. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;

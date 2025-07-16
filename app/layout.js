import { Geist, Geist_Mono } from "next/font/google";
import { Plus_Jakarta_Sans, Arimo, Instrument_Serif } from "next/font/google";
import "./globals.css";
import GlobalAudioPlayer from "@/app/components/GlobalAudioPlayer";
import AuthProvider from "@/app/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800"],
});

const arimo = Arimo({
  subsets: ["latin"],
  variable: "--font-arimo",
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
});

export const metadata = {
  title: "8EH Radio ITB",
  description: "Meresonansi & Berkarya",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} ${arimo.variable} ${instrumentSerif.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <div>
          <GlobalAudioPlayer />
        </div>
      </body>
    </html>
  );
}

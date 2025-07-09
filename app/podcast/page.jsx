// import { PodcastSection } from "@/app/page";
import Navbar from "../components/Navbar";
import FooterSection from "../components/FooterSection";



export default function Podcast() {
  return (
    <main className="flex flex-col min-h-screen bg-white font-sans">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-black">ini podcast ya</h1>
      </div>
      {/* <PodcastSection /> */}
      {/* <FooterSection /> */}
    </main>
  );
}

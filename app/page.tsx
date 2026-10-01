"use client";
import ShatterReveal from '../components/ShatterReveal';
import LaunchCountdown from '../components/LaunchCountdown';
import SectionSnap from '../components/SectionSnap';

export default function Home() {
  return (
    <main className="bg-[#f2efe9] text-[#0e0e0e] font-sans">
      <SectionSnap 
        sections="hero, features, countdown" 
        freeAfter="footer" 
        duration={1.4} 
        easing="Silk" 
        enabled={true} 
        keyboard={true} 
      />

      {/* Hero Section */}
      <section id="hero" className="relative w-full h-screen overflow-hidden bg-[#f2efe9]">
        
        {/* Layer 1: Background Text (Behind the shatter) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Top Left */}
          <h1 className="absolute top-12 left-4 md:top-20 md:left-16 text-8xl md:text-[13rem] font-normal tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#800000] to-[#d97373]">
            Coming
          </h1>
          {/* Bottom Right */}
          <h1 className="absolute bottom-20 right-4 md:bottom-24 md:right-16 text-8xl md:text-[13rem] font-normal tracking-tighter text-transparent bg-clip-text bg-gradient-to-tl from-[#800000] to-[#d97373]">
            together.
          </h1>
        </div>

        {/* Layer 2: Shatter Component (On top of text) */}
        {/* Added opacity-85 to make the shards slightly see-through */}
        <div className="absolute inset-0 z-10 opacity-85">
          <ShatterReveal 
            style={{ width: "100%", height: "100%" }}
            image="images/pattern.png" 
            background="transparent" 
            shards={90}
            posterWidth={45}
            ratio="1:1"
            radius={28}
            spread={1}
            progressMode="Manual"
            progress={0.4} /* Lowered from 0.5 to scatter the pieces a bit more */
            magnet={1}
            cursorRadius={190}
            float={1}
            edges={true}
            shadows={true}
            revealOn="Submit"
            clickBurst={true}
            revealed={false}
            hoverCursor={true}
            cursorLabel="Pull the pieces together"
          />
        </div>
        
        {/* Layer 3: Progress Indicator UI */}
        <div className="absolute bottom-8 left-8 bg-white/80 p-4 rounded-xl backdrop-blur-md z-20 pointer-events-none">
          <p className="text-sm font-mono text-black">42% ASSEMBLED</p>
          <p className="text-xs text-gray-700 mt-1">Every sign-up moves a piece.</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full h-screen flex flex-col justify-center px-12 md:px-24 bg-[#f2efe9]">
        <h2 className="text-5xl md:text-8xl font-light tracking-tight leading-tight">
          Stitched, Tailored & delivered <br/>
          at your home <span className="text-gray-400">every time.</span>
        </h2>
        <div className="flex gap-24 mt-24 border-t border-gray-300 pt-8">
          <div>
            <p className="text-xs text-gray-400 mb-2">01</p>
            <p className="text-lg">Built in the open</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">02</p>
            <p className="text-lg">Early access first</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">03</p>
            <p className="text-lg">Opening 10.10.26</p>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section id="countdown" className="w-full h-screen flex flex-col items-center justify-center bg-black text-white relative overflow-hidden">
        {/* Placeholder for the dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-orange-600 to-black opacity-60 z-0"></div>
        
        <div className="z-10 flex flex-col items-center">
          <p className="text-xl mb-8">The last piece lands in</p>
          <LaunchCountdown 
            launchDate="2026-10-10T09:00:00"
            layout="Large"
            labels="Long"
            separator={true}
            color="#ffffff"
            gap={26}
          />
          <div className="mt-12 flex bg-white/10 p-1 rounded-full backdrop-blur-md border border-white/20">
            <input type="email" placeholder="Your email address" className="bg-transparent text-white px-6 py-3 outline-none w-64" />
            <button className="bg-white text-black px-6 py-3 rounded-full font-medium">Save my spot →</button>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section id="footer" className="w-full min-h-[50vh] flex flex-col justify-between px-12 py-16 bg-[#f2efe9]">
        <div className="flex justify-between items-start">
          <h2 className="text-5xl font-light">Follow the making.</h2>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white rounded-full text-sm border border-gray-200">Instagram ↗</button>
            <button className="px-4 py-2 bg-white rounded-full text-sm border border-gray-200">X ↗</button>
          </div>
        </div>
        
        <h1 className="text-[20rem] font-bold tracking-tighter text-[#0e0e0e] leading-none mt-12">ito</h1>
        
        <div className="flex justify-between items-center border-t border-gray-300 pt-8 mt-12 text-sm text-gray-500">
          <p>© 2026 ito</p>
          <p>tryito.in</p>
          <p>Privacy</p>
          <p>Back to top ↑</p>
        </div>
      </section>
    </main>
  );
}
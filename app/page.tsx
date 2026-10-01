"use client";
import Image from 'next/image';
import ShatterReveal from '../components/ShatterReveal';
import LaunchCountdown from '../components/LaunchCountdown';
import SectionSnap from '../components/SectionSnap';

export default function Home() {
  return (
    <main className="bg-[#f2efe9] text-[#0e0e0e] font-sans">
      
      {/* Top Left Logo & Text Anchor */}
      <div className="absolute top-6 left-6 md:top-12 md:left-12 flex items-center gap-3 z-50 pointer-events-none">
        <Image
          src="/logo.png" 
          alt="ito logo"
          width={48}
          height={48}
          className="w-8 h-8 md:w-12 md:h-12 object-contain"
        />
        <h1 className="text-2xl md:text-4xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#800000] to-[#d97373]">
          ito
        </h1>
      </div>

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
        <div className="absolute inset-0 z-0 pointer-events-none flex flex-col justify-between py-32 md:py-0 md:block">
          {/* Top Left */}
          <h1 className="md:absolute md:top-20 md:left-16 px-4 md:px-0 text-7xl sm:text-8xl md:text-[13rem] font-normal tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#800000] to-[#d97373] leading-none">
            Coming
          </h1>
          {/* Bottom Right */}
          <h1 className="md:absolute md:bottom-24 md:right-16 px-4 md:px-0 text-right text-7xl sm:text-8xl md:text-[13rem] font-normal tracking-tighter text-transparent bg-clip-text bg-gradient-to-tl from-[#800000] to-[#d97373] leading-none">
            together.
          </h1>
        </div>

        {/* Layer 2: Shatter Component (On top of text) */}
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
            progress={0.4} 
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
        <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 bg-white/80 p-3 md:p-4 rounded-xl backdrop-blur-md z-20 pointer-events-none">
          <p className="text-xs md:text-sm font-mono text-black">42% ASSEMBLED</p>
          <p className="text-[10px] md:text-xs text-gray-700 mt-1">Every sign-up moves a piece.</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full min-h-screen flex flex-col justify-center px-6 py-20 md:px-24 md:py-0 bg-[#f2efe9]">
        <h2 className="text-4xl md:text-8xl font-light tracking-tight leading-tight">
          Stitched, Tailored & delivered <br className="hidden md:block"/>
          at your home <span className="text-gray-400">every time.</span>
        </h2>
        <div className="flex flex-col md:flex-row gap-8 md:gap-24 mt-12 md:mt-24 border-t border-gray-300 pt-8">
          <div>
            <p className="text-xs text-gray-400 mb-1 md:mb-2">01</p>
            <p className="text-base md:text-lg">Built in the open</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1 md:mb-2">02</p>
            <p className="text-base md:text-lg">Early access first</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1 md:mb-2">03</p>
            <p className="text-base md:text-lg">Opening 10.10.26</p>
          </div>
        </div>
      </section>

      {/* Countdown Section */}
      <section id="countdown" className="w-full h-screen flex flex-col items-center justify-center bg-black text-white relative overflow-hidden px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-orange-600 to-black opacity-60 z-0"></div>
        
        <div className="z-10 flex flex-col items-center w-full max-w-md md:max-w-none">
          <p className="text-lg md:text-xl mb-6 md:mb-8 text-center">The last piece lands in</p>
          
          <div className="scale-75 md:scale-100 origin-center">
            <LaunchCountdown 
              launchDate="2026-10-10T09:00:00"
              layout="Large"
              labels="Long"
              separator={true}
              color="#ffffff"
              gap={26}
            />
          </div>

          <div className="mt-8 md:mt-12 flex flex-col md:flex-row w-full md:w-auto bg-transparent md:bg-white/10 md:p-1 gap-3 md:gap-0 rounded-3xl md:rounded-full backdrop-blur-md md:border md:border-white/20">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="bg-white/10 md:bg-transparent text-white px-6 py-4 md:py-3 rounded-full md:rounded-none outline-none w-full md:w-64 border border-white/20 md:border-none focus:bg-white/20 transition-colors" 
            />
            <button className="bg-white text-black px-6 py-4 md:py-3 rounded-full font-medium w-full md:w-auto hover:bg-gray-200 transition-colors">
              Save my spot →
            </button>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <section id="footer" className="w-full min-h-[50vh] flex flex-col justify-between px-6 py-12 md:px-12 md:py-16 bg-[#f2efe9] overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-0">
          <h2 className="text-3xl md:text-5xl font-light">Follow the making.</h2>
          <div className="flex gap-3 md:gap-4">
            <button className="px-4 py-2 bg-white rounded-full text-xs md:text-sm border border-gray-200">Instagram ↗</button>
            <button className="px-4 py-2 bg-white rounded-full text-xs md:text-sm border border-gray-200">X ↗</button>
          </div>
        </div>
        
        <h1 className="text-[10rem] md:text-[20rem] font-bold tracking-tighter text-[#0e0e0e] leading-none mt-12 md:mt-12 -ml-2 md:ml-0">
          ito
        </h1>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-gray-300 pt-6 md:pt-8 mt-8 md:mt-12 text-xs md:text-sm text-gray-500 gap-4 md:gap-0">
          <div className="flex gap-4 md:gap-8">
            <p>© 2026 ito</p>
            <p>tryito.in</p>
            <p>Privacy</p>
          </div>
          <p className="cursor-pointer">Back to top ↑</p>
        </div>
      </section>
    </main>
  );
}
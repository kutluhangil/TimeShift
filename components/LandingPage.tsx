import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [currentEra, setCurrentEra] = useState('1950s');
  const ERAS = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEra(prev => ERAS[(ERAS.indexOf(prev) + 1) % ERAS.length]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background gradients for a premium feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-black opacity-80 z-0 pointer-events-none"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full z-0 pointer-events-none"></div>
      
      {/* Grid pattern (cool/subtle tech vibe) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>

      <div className="z-10 flex flex-col items-center text-center px-6 max-w-4xl pt-12 pb-12 w-full">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm text-neutral-300 font-medium mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
          AI-Powered Time Travel
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-500"
        >
          Your Face.<br />Across the Decades.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl leading-relaxed text-balance"
        >
          Upload a single photo and watch our AI reimagine you in authentic, photorealistic styles from the 1950s to the 2000s. Experience your ultimate time machine journey in seconds.
        </motion.p>

        {/* Demo Animation Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="relative w-64 h-80 mb-16 perspective-1000"
        >
          <AnimatePresence mode="wait">
            <motion.div 
               key={currentEra}
               initial={{ opacity: 0, y: 10, rotateX: 10, rotateZ: (Math.random() * 6 - 3) }}
               animate={{ opacity: 1, y: 0, rotateX: 0, rotateZ: (Math.random() * 4 - 2) }}
               exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
               transition={{ type: "spring", stiffness: 120, damping: 20 }}
               className="absolute inset-0 bg-neutral-100 p-4 pb-12 shadow-2xl rounded-sm flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20"
            >
               <div className="w-full relative bg-neutral-900 flex-1 overflow-hidden flex items-center justify-center border border-neutral-300 shadow-inner">
                  {/* Subtle placeholder icon representing a portrait */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-neutral-700/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  
                  {/* Era-specific tint effect overlay */}
                  <div className={`absolute inset-0 mix-blend-overlay opacity-40 transition-colors duration-1000 ${
                     currentEra === '1950s' ? 'bg-orange-900' :
                     currentEra === '1960s' ? 'bg-yellow-700' :
                     currentEra === '1970s' ? 'bg-red-800' :
                     currentEra === '1980s' ? 'bg-pink-600' :
                     currentEra === '1990s' ? 'bg-blue-600' :
                     'bg-transparent'
                  }`}></div>
                  
                  {/* Film grain effect */}
                  <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwIiAvPgo8L3N2Zz4=')]"></div>
               </div>
               <div className="absolute bottom-4 left-0 w-full text-center font-permanent-marker text-xl text-neutral-800">
                  {currentEra}
               </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          onClick={onStart}
          className="group relative px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          <span className="relative flex items-center gap-2 text-lg">
            Start Your Journey
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </motion.button>
        
        {/* Helper to animate shimmer effect */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
          .perspective-1000 {
            perspective: 1000px;
          }
        ` }} />
      </div>
    </div>
  );
}

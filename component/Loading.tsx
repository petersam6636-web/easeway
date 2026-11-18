
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Sparkles } from "lucide-react";

export default function ProjectLoading() {
  const spinnerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Continuous spinning animation
      gsap.to(spinnerRef.current, {
        rotation: 360,
        duration: 1.5,
        repeat: -1,
        ease: "linear",
      });

      // Smooth entrance animation


    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="flex min-h-[calc(100dvh-110px)] w-full items-center justify-center overflow-hidden ">

      <div
        ref={contentRef}
        className="relative flex w-full flex-col items-center justify-center px-3  sm:px-6"
      >

        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/50 blur-3xl sm:h-64 sm:w-64" />

        {/* Loading illustration */}
        <div className="relative flex h-44 w-full max-w-[300px] items-center justify-center sm:h-52">

          {/* Outer soft circle */}
          <div className="absolute h-36 w-36 rounded-full border border-blue-100/70 bg-blue-50/40 sm:h-44 sm:w-44" />

          {/* Spinning loader */}
          <div
            ref={spinnerRef}
            className="relative z-10 h-24 w-24 rounded-full border-[5px] border-blue-100 border-t-blue-600 border-r-blue-400 shadow-lg shadow-blue-500/10 sm:h-28 sm:w-28"
          />

          {/* Center circle */}
          <div className="absolute z-10 h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 sm:h-16 sm:w-16" />

          {/* Decorative sparkles */}
          <Sparkles
            size={18}
            className="absolute left-[15%] top-[25%] text-blue-400"
          />

          <Sparkles
            size={17}
            className="absolute bottom-[22%] right-[15%] text-cyan-500"
          />

          {/* Decorative particles */}
          <span className="absolute right-[22%] top-[17%] h-2.5 w-2.5 rounded-full bg-blue-400" />

          <span className="absolute bottom-[18%] left-[23%] h-2 w-2 rounded-full bg-purple-400" />

        </div>

        {/* Loading text */}
        <div className="relative z-10 mt-5 flex flex-col items-center text-center">

          <h2 className="text-xl font-extrabold tracking-tight text-blue-950 sm:text-2xl md:text-3xl">
            Loading 
            <span className="text-blue-600">...</span>
          </h2>

          <p className="mt-2 text-xs leading-6 text-slate-500 sm:text-sm">
            Getting everything ready for you.
          </p>

          {/* Small loading indicator */}
          <div className="mt-5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:200ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600 [animation-delay:400ms]" />
          </div>

        </div>

      </div>
    </section>
  );
}

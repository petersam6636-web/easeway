
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Sparkles } from "lucide-react";

export default function ProjectLoading() {
  const spinnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Continuous spinning animation
      gsap.to(spinnerRef.current, {
        rotation: 360,
        duration: 1.5,
        repeat: -1,
        ease: "linear",
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="flex min-h-[calc(100dvh-150px)] w-full items-center justify-center overflow-hidden px-2 py-3">

      <div className="relative flex w-full flex-col items-center justify-center">

        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/50 blur-3xl sm:h-44 sm:w-44" />

        {/* Loading illustration */}
        <div className="relative flex h-32 w-full max-w-[200px] items-center justify-center sm:h-36">

          {/* Outer soft circle */}
          <div className="absolute h-28 w-28 rounded-full border border-blue-100/70 bg-blue-50/40 sm:h-32 sm:w-32" />

          {/* Spinning loader */}
          <div
            ref={spinnerRef}
            className="relative z-10 h-[72px] w-[72px] rounded-full border-[5px] border-blue-100 border-t-blue-600 border-r-blue-400 shadow-md shadow-blue-500/10 sm:h-20 sm:w-20"
          />

          {/* Center circle */}
          <div className="absolute z-10 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-500/25 sm:h-12 sm:w-12" />

          {/* Decorative sparkles */}
          <Sparkles
            size={15}
            className="absolute left-[17%] top-[23%] text-blue-400"
          />

          <Sparkles
            size={14}
            className="absolute bottom-[20%] right-[17%] text-cyan-500"
          />

          {/* Decorative particles */}
          <span className="absolute right-[23%] top-[16%] h-2 w-2 rounded-full bg-blue-400" />

          <span className="absolute bottom-[17%] left-[24%] h-1.5 w-1.5 rounded-full bg-purple-400" />

        </div>

        {/* Loading text */}
        <div className="relative z-10 mt-2 flex flex-col items-center text-center">

          <h2 className="text-lg font-extrabold tracking-tight text-blue-950 sm:text-xl">
            Loading
            <span className="text-blue-600">...</span>
          </h2>

          <p className="mt-1 text-[11px] leading-5 text-slate-500 sm:text-xs">
            Getting everything ready for you.
          </p>

          {/* Small loading indicator */}
          <div className="mt-3 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500 [animation-delay:200ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600 [animation-delay:400ms]" />
          </div>

        </div>

      </div>
    </section>
  );
}


"use client";

import { useRouter } from "next/navigation";

import {
  Send,
  Sparkles,
  Plus,
} from "lucide-react";

export default function NotProject() {
  const router = useRouter();

  function handleCreateProject() {
    router.push("/home/project");
  }

  return (
    <section className="flex min-h-[calc(100dvh-110px)] w-full items-center justify-center overflow-hidden px-3 py-3 sm:px-5">

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden px-3 py-4 sm:px-6">

        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-[20%] h-48 w-48 -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl sm:h-64 sm:w-64" />

        {/* Decorative illustration area */}
        <div className="relative flex h-[175px] w-full max-w-[340px] shrink-0 items-center justify-center sm:h-[210px]">

          {/* Illustration background */}
          <div className="absolute h-40 w-40 rounded-full border border-blue-100/50 bg-blue-50/50 sm:h-48 sm:w-48" />

          <div className="absolute h-52 w-52 rounded-full bg-blue-100/20 blur-2xl sm:h-64 sm:w-64" />

          {/* Decorative particles */}
          <span className="absolute left-[12%] top-[25%] h-2.5 w-2.5 rounded-full bg-blue-400" />

          <span className="absolute right-[22%] top-[18%] h-2.5 w-2.5 rounded-full bg-cyan-400" />

          <span className="absolute left-[10%] bottom-[25%] h-2 w-2 rounded-full bg-purple-400" />

          <Sparkles
            className="absolute left-[24%] top-[39%] text-blue-400"
            size={15}
          />

          <Sparkles
            className="absolute right-[20%] bottom-[22%] text-blue-500"
            size={16}
          />

          {/* Paper plane */}
          <div className="absolute right-[7%] top-[13%] z-20 text-blue-600 sm:right-[10%]">
            <Send
              size={29}
              strokeWidth={1.5}
              fill="currentColor"
            />
          </div>

          {/* Flight trail */}
          <svg
            className="pointer-events-none absolute right-[8%] top-[27%] h-24 w-28 sm:right-[10%] sm:h-28 sm:w-32"
            viewBox="0 0 160 140"
            fill="none"
          >
            <path
              d="M5 15 C35 110 125 105 145 5"
              stroke="#60A5FA"
              strokeWidth="1.5"
              strokeDasharray="7 7"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Empty state content */}
        <div className="relative z-10 mt-2 flex w-full max-w-xl flex-col items-center text-center">

          {/* Heading */}
          <h2 className="text-xl font-extrabold tracking-tight text-blue-950 sm:text-2xl md:text-3xl">
            No projects yet
          </h2>

          {/* Description */}
          <p className="mt-2 max-w-md text-xs leading-6 text-slate-600 sm:text-sm sm:leading-7">
            You do not have any projects created.
            <br className="hidden sm:block" />
            Create your first project to get started.
          </p>

          {/* Create project button */}
          <button
            type="button"
            onClick={handleCreateProject}
            className="mt-5 inline-flex min-h-12 w-full max-w-[220px] cursor-pointer items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600">
              <Plus size={16} strokeWidth={3} />
            </span>

            Create Project
          </button>

          {/* Helpful tip */}
          <div className="mt-4 flex w-full max-w-lg items-center justify-center gap-3 px-3 py-2 text-left">

            <Sparkles
              size={18}
              className="shrink-0 text-blue-600"
            />

            <p className="text-[11px] leading-5 text-blue-700 sm:text-xs">
              <span className="font-bold">Tip:</span>{" "}
              You can create different projects for different subjects or classes.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

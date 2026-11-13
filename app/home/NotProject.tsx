
"use client";

import { useRouter } from "next/navigation";

import {
  Sparkles,
  Plus,
} from "lucide-react";

export default function NotProject() {
  const router = useRouter();

  function handleCreateProject() {
    router.push("/home/project");
  }

  return (
    <section className="flex min-h-0 h-full w-full items-center justify-center overflow-hidden px-3 py-2 sm:px-5">

      <div className="relative flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden px-3 py-2 sm:px-6">

        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-[20%] h-36 w-36 -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl sm:h-48 sm:w-48" />

        {/* Decorative illustration area */}

        {/* Empty state content */}
        <div className="relative z-10 mt-1 flex w-full max-w-xl flex-col items-center text-center">

          {/* Heading */}
          <h2 className="text-lg font-extrabold tracking-tight text-blue-950 sm:text-xl md:text-2xl">
            No projects yet
          </h2>

          {/* Description */}
          <p className="mt-1.5 max-w-md text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
            You do not have any projects created.
            <br className="hidden sm:block" />
            Create your first project to get started.
          </p>

          {/* Create project button */}
          <button
            type="button"
            onClick={handleCreateProject}
            className="mt-4 inline-flex min-h-10 w-full max-w-[200px] cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/30 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-blue-600">
              <Plus size={15} strokeWidth={3} />
            </span>

            Create Project
          </button>

          {/* Helpful tip */}
          <div className="mt-3 flex w-full max-w-lg items-center justify-center gap-2 px-3 py-1.5 text-left">

            <Sparkles
              size={16}
              className="shrink-0 text-blue-600"
            />

            <p className="text-[10px] leading-5 text-blue-700 sm:text-xs">
              <span className="font-bold">Tip:</span>{" "}
              You can create different projects for different subjects or classes.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

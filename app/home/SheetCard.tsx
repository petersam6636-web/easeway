
"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import useApp from "@/lib/useApp";
import Sheets from "./Sheet";

export default function ProjectsPage() {
  const router = useRouter();
  const { setPage } = useApp();

  return (
    <section className="w-full min-w-0 flex flex-col gap-6 sm:gap-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div className="min-w-0 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
            My Projects
          </h1>

          <p className="text-sm text-slate-500 leading-relaxed">
            Manage and organize all your classroom projects in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPage("select");
            router.push("/home/project");
          }}
          className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 cursor-pointer"
        >
          <Plus size={19} strokeWidth={2.5} />
          Create Project
        </button>
      </div>

      {/* Projects */}
      <div className="w-full min-w-0">
        <Sheets />
      </div>

    </section>
  );
}

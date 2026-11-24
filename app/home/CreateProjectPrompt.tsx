"use client";

import {
  ArrowRight,
  FileSpreadsheet,
  PenLine,
  X,
} from "lucide-react";

type EntryMethod = "manual" | "automatic";

type CreateProjectPromptProps = {
  onSelect: (entryMethod: EntryMethod) => void;
  onClose: () => void;
};

export default function CreateProjectPrompt({
  onSelect,
  onClose,
}: CreateProjectPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-entry-title"
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close entry method selection"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          <X size={17} />
        </button>

        <div className="mx-auto max-w-lg pr-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Project setup
          </p>
          <h2
            id="create-project-entry-title"
            className="mt-1 text-xl font-bold tracking-tight text-slate-900"
          >
            How do you want to choose subjects?
          </h2>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect("manual")}
            className="group flex min-h-28 items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <PenLine size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900">
                Manual
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Select the subjects you want to enter yourself.
              </span>
            </span>
            <span className="pt-1 text-blue-700">
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelect("automatic")}
            className="group flex min-h-28 items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-violet-300 hover:bg-violet-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <FileSpreadsheet size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900">
                Automatic
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Automatically provide subjects for the academic level you choose next.
              </span>
            </span>
            <span className="pt-1 text-violet-700">
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

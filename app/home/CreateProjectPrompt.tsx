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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-entry-title"
        className="relative max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close entry method selection"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          <X size={19} />
        </button>

        <div className="mx-auto max-w-xl pt-2 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <FileSpreadsheet size={26} />
          </div>
          <h2
            id="create-project-entry-title"
            className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
          >
            Choose your entry method
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            How would you like to add student information to this project?
          </p>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onSelect("manual")}
            className="group rounded-2xl border border-slate-200 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-lg hover:shadow-blue-900/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <PenLine size={21} />
            </span>
            <span className="mt-4 block text-lg font-bold text-slate-900">
              Manual
            </span>
            <span className="mt-2 block text-sm leading-6 text-slate-500">
              Enter student details yourself, one student at a time.
            </span>
            <span className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-blue-700">
              Choose manual
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelect("automatic")}
            className="group rounded-2xl border border-slate-200 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-lg hover:shadow-violet-900/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <FileSpreadsheet size={21} />
            </span>
            <span className="mt-4 block text-lg font-bold text-slate-900">
              Automatic
            </span>
            <span className="mt-2 block text-sm leading-6 text-slate-500">
              Use the automatic student-entry method for this project.
            </span>
            <span className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-violet-700">
              Choose automatic
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

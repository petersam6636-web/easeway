
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import  useApp  from "@/lib/useApp";

import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PenLine,
  FileSpreadsheet,
} from "lucide-react";

import ProjectDetails from "./ProjectDetails";

gsap.registerPlugin(useGSAP);

type ProjectMethod = "JHS" | "Primary";

export default function SchoolDatas() {
  const router = useRouter();

  const {
    subjectSteps,
    setSubjectSteps,
    page,
    setPage,
    projectMethod,
    setProjectMethod,
    setProjectDetails,
  } = useApp();

  const [selectedMethod, setSelectedMethod] =
    useState<ProjectMethod | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const jhsSubjects = [
    "English",
    "Mathematics",
    "Science",
    "History",
    "Computing",
    "Creative Arts",
    "Career Technology",
    "RME",
    "Fante/Twi",
  ];

  const primarySubjects = [
    "English",
    "Mathematics",
    "Science",
    "Computing",
    "Creative Arts",
    "RME",
    "PEH",
    "HIstory",
    "Fante/Twi",
  ];

  // Keep subjectSteps available from the global context.
  void subjectSteps;

  // Animate the page whenever the selected page changes.
  useGSAP(
    () => {
      const element = containerRef.current;

      if (!element) return;

      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 100,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          ease: "power1.out",
          clearProps: "opacity",
        }
      );
    },
    {
      scope: containerRef,
      dependencies: [page],
      revertOnUpdate: true,
    }
  );

  const handleSelect = (method: ProjectMethod) => {
    setSelectedMethod(method);
    setProjectMethod(method);
    setProjectDetails((previous) => ({
      ...previous,
      method,
      entryMethod: "",
    }));

    // Save all subjects belonging to the selected academic method.
    setSubjectSteps(
      method === "JHS" ? [
    "English",
    "Mathematics",
    "Science",
    "Social Studies",
    "Computing",
    "Creative Arts",
    "Career Technology",
    "RME",
    "Fante/twi",
  ] : [
    "English",
    "Mathematics",
    "Science",
    "Computing",
    "Creative_arts",
    "RME",
    "PEH",
    "HIstory",
    "Fante/twi",
  ]
    );

    setPage("entryMethod");
  };

  const handleBackToLevel = () => {
    setPage("select");
  };

  const handleEntryMethodSelect = (entryMethod: "manual" | "automatic") => {
    setProjectDetails((previous) => ({ ...previous, entryMethod }));
    setPage("details");
  };

  const handleBackToEntryMethod = () => {
    setPage("entryMethod");
  };

  const currentMethod = selectedMethod ?? (
    projectMethod === "JHS" || projectMethod === "Primary" ? projectMethod : null
  );

  return (
    <div ref={containerRef} className="w-full">
      {/* PROJECT DETAILS PAGE */}
      {page === "details" && (
        <div className="w-full">
          <button
            type="button"
            onClick={handleBackToEntryMethod}
            className="mb-4 flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft size={15} />
            Change entry method
          </button>

          <ProjectDetails setPage={setPage} method={currentMethod} />
        </div>
      )}

      {page === "entryMethod" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="entry-method-title"
            className="max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-8"
          >
            <button
              type="button"
              onClick={handleBackToLevel}
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Back to academic level
            </button>

            <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <BookOpen size={26} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              {currentMethod === "JHS" ? "Junior High School" : "Primary School"}
            </p>
            <h2
              id="entry-method-title"
              className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
            >
              How would you like to add students?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Choose how student records will be entered for this project. You can
              change your workflow when setting up the project.
            </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleEntryMethodSelect("manual")}
              className="group rounded-2xl border border-slate-200 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-lg hover:shadow-blue-900/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <PenLine size={21} />
              </span>
              <span className="mt-4 block text-lg font-bold text-slate-900">
                Manual entry
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-500">
                Add students and their details individually as you work through
                the project.
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
              onClick={() => handleEntryMethodSelect("automatic")}
              className="group rounded-2xl border border-slate-200 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-lg hover:shadow-violet-900/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/20"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <FileSpreadsheet size={21} />
              </span>
              <span className="mt-4 block text-lg font-bold text-slate-900">
                Automatic entry
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-500">
                Use an automated workflow to enter student records for this
                project.
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

            <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 p-3.5 text-xs leading-5 text-slate-500">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
            <p>
              Your choice will be saved with the project when you submit its
              details.
            </p>
            </div>
          </div>
        </div>
      )}

      {/* ACADEMIC METHOD SELECTION PAGE */}
      {page === "select" && (
        <div className="w-full max-w-4xl mx-auto py-1">
          {/* Back to Dashboard */}
          <button
            type="button"
            onClick={() => router.push("/home")}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          {/* Heading */}
          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Select your academic level
            </h2>
          </div>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* JHS CARD */}
            <button
              type="button"
              onClick={() => handleSelect("JHS")}
              aria-label="Select Junior High School"
              className="group relative text-left w-full bg-white border border-gray-200 border-l-4 border-l-blue-600 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 hover:border-l-blue-600 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <GraduationCap size={22} />
                </div>

                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  JHS LEVEL
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                  Junior High School
                </h3>

                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Set up your JHS academic records with all nine subjects,
                  including Career Technology and History.
                </p>
              </div>

              {/* Subjects */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2.5">
                  <BookOpen size={14} className="text-blue-600" />
                  Available Subjects

                  <span className="text-[10px] text-gray-400 font-normal">
                    ({jhsSubjects.length})
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {jhsSubjects.map((subject) => (
                    <span
                      key={subject}
                      className="text-[10px] sm:text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-md px-2 py-1"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hover Action */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-700">
                  Select JHS
                </span>

                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300">
                  <ArrowRight size={15} />
                </div>
              </div>
            </button>

            {/* PRIMARY CARD */}
            <button
              type="button"
              onClick={() => handleSelect("Primary")}
              aria-label="Select Primary School"
              className="group relative text-left w-full bg-white border border-gray-200 border-l-4 border-l-green-600 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-green-300 hover:border-l-green-600 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-500/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
                  <BookOpen size={21} />
                </div>

                <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  PRIMARY LEVEL
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                  Primary School
                </h3>

                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  Set up your Primary academic records with seven
                  subjects designed for primary-level assessment.
                </p>
              </div>

              {/* Subjects */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2.5">
                  <BookOpen size={14} className="text-green-600" />
                  Available Subjects

                  <span className="text-[10px] text-gray-400 font-normal">
                    ({primarySubjects.length})
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {primarySubjects.map((subject) => (
                    <span
                      key={subject}
                      className="text-[10px] sm:text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-md px-2 py-1"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hover Action */}
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-green-700">
                  Select Primary
                </span>

                <div className="w-8 h-8 rounded-full bg-green-50 text-green-700 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-300">
                  <ArrowRight size={15} />
                </div>
              </div>
            </button>
          </div>

          {/* Footer Information */}
          <div className="mt-4 flex items-start gap-2 text-[11px] text-gray-400">
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />

            <p>
              You can configure the school information and student
              assessment details in the next step.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

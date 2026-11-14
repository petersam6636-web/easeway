
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import ProjectDetails from "./ProjectDetails";

type PageType = "select" | "details";
type ProjectMethod = "JHS" | "Primary";

export default function SchoolDatas() {
  const router = useRouter();

  const [page, setPage] = useState<PageType>("select");
  const [selectedMethod, setSelectedMethod] =
    useState<ProjectMethod | null>(null);

  const jhsSubjects = [
    "English",
    "Mathematics",
    "Science",
    "History",
    "Computing",
    "Creative Arts",
    "Career Technology",
    "RME",
    "Fante / Twi",
  ];

  const primarySubjects = [
    "English",
    "Mathematics",
    "Science",
    "Computing",
    "Creative Arts",
    "RME",
    "Fante / Twi",
  ];

  const handleSelect = (method: ProjectMethod) => {
    setSelectedMethod(method);
    setPage("details");
  };

  if (page === "details") {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => setPage("select")}
          className="mb-4 flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
        >
          <ArrowLeft size={15} />
          Back to selection
        </button>

        <ProjectDetails method={selectedMethod} />
      </div>
    );
  }

  return (
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
          className="group relative text-left w-full bg-white border border-gray-200 border-l-4 border-l-blue-600 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 hover:border-l-blue-600 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer"
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

          {/* Action */}
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
          className="group relative text-left w-full bg-white border border-gray-200 border-l-4 border-l-green-600 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-green-300 hover:border-l-green-600 hover:-translate-y-0.5 transition-all duration-300 ease-out cursor-pointer"
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

          {/* Action */}
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

      {/* Footer information */}
      <div className="mt-4 flex items-start gap-2 text-[11px] text-gray-400">
        <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
        <p>
          You can configure the school information and student
          assessment details in the next step.
        </p>
      </div>
    </div>
  );
}

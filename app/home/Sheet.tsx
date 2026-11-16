
"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import useApp from "@/lib/useApp";

import {
  CalendarDays,
  GraduationCap,
  Users,
  ArrowRight,
  School,
  ChartNoAxesColumnIncreasing,
} from "lucide-react";

// ==========================================
// PROJECT TYPE
// ==========================================

type ProjectData = {
  id: string | number;
  header?: string | null;
  description?: string | null;
  method?: string | null;
  passMark?: number | string | null;
  created_at?: string | null;

  school_data?: {
    school_name?: string | null;
    logo_image?: string | null;
  } | null;

  students?: unknown[] | null;
};

// ==========================================
// DATE FORMATTER
// ==========================================

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date?: string | null) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return dateFormatter.format(parsedDate);
}

// ==========================================
// PROJECT CARD
// ==========================================

const ProjectCard = memo(function ProjectCard({
  project,
}: {
  project: ProjectData;
}) {
  const isJHS = project.method?.toLowerCase() === "jhs";

  const school = project.school_data;

  const studentCount = Array.isArray(project.students)
    ? project.students.length
    : 0;

  const accent = isJHS
    ? {
        border: "border-l-blue-600",
        badge: "bg-blue-50 text-blue-700",
        title: "group-hover:text-blue-700",
        method: "text-blue-700",
        arrow: "group-hover:bg-blue-600",
        focus: "focus-visible:ring-blue-500/20",
      }
    : {
        border: "border-l-green-600",
        badge: "bg-green-50 text-green-700",
        title: "group-hover:text-green-700",
        method: "text-green-700",
        arrow: "group-hover:bg-green-600",
        focus: "focus-visible:ring-green-500/20",
      };

  return (
    <Link
      href={`/home/project/${project.id}`}
      prefetch={false}
      className={`
        group relative block w-full
        overflow-hidden
        bg-white
        border border-gray-200
        border-l-4 ${accent.border}
        rounded-xl
        p-5 sm:p-5
        min-h-[225px]
        shadow-sm
        hover:shadow-lg
        hover:-translate-y-1
        hover:border-t-gray-300
        hover:border-r-gray-300
        hover:border-b-gray-300
        transition-all duration-300 ease-out
        focus-visible:outline-none
        focus-visible:ring-4
        ${accent.focus}
      `}
    >

      {/* ================================= */}
      {/* TOP SECTION */}
      {/* ================================= */}

      <div className="flex items-start gap-4">

        {/* SCHOOL LOGO */}

        <div className="shrink-0">

          {school?.logo_image ? (
            <Image
              src={school.logo_image}
              alt={`${school.school_name || "School"} logo`}
              width={64}
              height={64}
              unoptimized
              loading="lazy"
              className="
                w-14 h-14 sm:w-16 sm:h-16
                rounded-full
                object-cover
                border border-gray-200
                bg-gray-50
                transition-transform duration-300
                group-hover:scale-105
              "
            />
          ) : (
            <div className="
              w-14 h-14 sm:w-16 sm:h-16
              rounded-full
              bg-gray-50
              border border-gray-200
              flex items-center justify-center
            ">
              <School size={27} className="text-gray-400" />
            </div>
          )}

        </div>

        {/* PROJECT DETAILS */}

        <div className="flex-1 min-w-0">

          <div className="flex items-start justify-between gap-2">

            <div className="min-w-0">

              <h3 className={`
                text-sm sm:text-base
                font-bold text-gray-900
                truncate
                transition-colors duration-200
                ${accent.title}
              `}>
                {project.header || "Untitled Project"}
              </h3>

              <p className="
                text-xs sm:text-sm
                text-gray-500
                font-medium
                mt-1
                truncate
              ">
                {school?.school_name || "School not specified"}
              </p>

            </div>

            {/* METHOD BADGE */}

            <span className={`
              shrink-0
              text-[10px] sm:text-xs
              font-semibold
              px-3 py-1.5
              rounded-full
              ${accent.badge}
            `}>
              {project.method || "Unknown"}
            </span>

          </div>

          {/* DESCRIPTION */}

          <p className="
            text-xs sm:text-sm
            text-gray-500
            mt-3
            leading-relaxed
            line-clamp-2
            break-words
          ">
            {project.description || "No project description available."}
          </p>

        </div>

      </div>

      {/* ================================= */}
      {/* PROJECT STATISTICS */}
      {/* ================================= */}

      <div className="
        grid grid-cols-3
        mt-5
        py-4
        border-y border-gray-100
      ">

        {/* PASS MARK */}

        <div className="px-2 border-r border-gray-100 min-w-0">

          <div className="flex items-center gap-2 text-gray-400">

            <ChartNoAxesColumnIncreasing
              size={17}
              className="shrink-0"
            />

            <span className="text-[10px] sm:text-xs truncate">
              Pass Mark
            </span>

          </div>

          <p className="text-lg font-bold text-gray-900 mt-2">
            {project.passMark ?? 0}
          </p>

        </div>

        {/* STUDENTS */}

        <div className="px-2 border-r border-gray-100 min-w-0">

          <div className="flex items-center gap-2 text-gray-400">

            <Users size={17} className="shrink-0" />

            <span className="text-[10px] sm:text-xs truncate">
              Students
            </span>

          </div>

          <p className="text-lg font-bold text-gray-900 mt-2">
            {studentCount}
          </p>

        </div>

        {/* METHOD */}

        <div className="px-2 min-w-0">

          <div className="flex items-center gap-2 text-gray-400">

            <GraduationCap size={18} className="shrink-0" />

            <span className="text-[10px] sm:text-xs truncate">
              Method
            </span>

          </div>

          <p className={`
            text-sm sm:text-base
            font-bold mt-2 truncate
            ${accent.method}
          `}>
            {project.method || "Unknown"}
          </p>

        </div>

      </div>

      {/* ================================= */}
      {/* BOTTOM SECTION */}
      {/* ================================= */}

      <div className="
        flex items-center justify-between
        gap-3
        mt-4
      ">

        <div className="
          flex items-center gap-2
          min-w-0
          text-xs text-gray-400
        ">

          <CalendarDays
            size={15}
            className="shrink-0"
          />

          <span className="truncate">
            Created: {formatDate(project.created_at)}
          </span>

        </div>

        {/* ARROW */}

        <div className={`
          w-8 h-8 shrink-0
          rounded-full
          flex items-center justify-center
          bg-gray-50
          text-gray-500
          transition-all duration-300
          group-hover:text-white
          ${accent.arrow}
          group-hover:translate-x-1
        `}>
          <ArrowRight size={16} />
        </div>

      </div>

    </Link>
  );
});

// ==========================================
// MAIN SHEETS COMPONENT
// ==========================================

export default function Sheets() {
  const { studentsSubject } = useApp();

  const projects = useMemo<ProjectData[]>(() => {
    return Array.isArray(studentsSubject)
      ? studentsSubject as ProjectData[]
      : [];
  }, [studentsSubject]);

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="w-full">



<div className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
  {projects.map((project) => (
    <ProjectCard key={project.id} project={project} />
  ))}
</div>



    </section>
  );
}

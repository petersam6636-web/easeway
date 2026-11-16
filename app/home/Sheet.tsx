
"use client";

import {
  memo,
  useMemo,
  useState,
  useCallback,
} from "react";

import type { MouseEvent } from "react";

import Link from "next/link";
import useApp from "@/lib/useApp";
import { supabase } from "@/lib/supabase-client";

import {
  CalendarDays,
  GraduationCap,
  Users,
  ArrowRight,
  School,
  ChartNoAxesColumnIncreasing,
  MoreVertical,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
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
  deleted?: string | null;

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
  onDelete,
}: {
  project: ProjectData;
  onDelete: (id: string | number) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const isJHS = project.method?.toLowerCase() === "jhs";

  const school = project.school_data;
  const logoUrl = school?.logo_image;

  // Get the actual students attached by PageRender.
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

  // ==========================================
  // DELETE HANDLER
  // ==========================================

  async function handleDelete(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await onDelete(project.id);

      setConfirmOpen(false);
    } catch (error) {
      console.error("Project deletion failed:", error);

      setDeleteError(
        error instanceof Error
          ? error.message
          : "Unable to delete this project. Please try again."
      );

      setDeleting(false);
    }
  }

  return (
    <>
      {/* ================================== */}
      {/* PROJECT CARD */}
      {/* ================================== */}

      <Link
        href={`/home/project/${project.id}`}
        prefetch={false}
        className={`
          group relative block w-full
          overflow-visible
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
        {/* THREE DOT MENU */}

        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            aria-label="Project options"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              setMenuOpen((prev) => !prev);
              setDeleteError("");
            }}
            className="
              w-8 h-8
              flex items-center justify-center
              rounded-lg
              text-gray-500
              bg-white
              hover:bg-gray-100
              hover:text-gray-900
              transition-colors
              cursor-pointer
            "
          >
            <MoreVertical size={19} />
          </button>

          {/* DROPDOWN */}

          {menuOpen && (
            <div
              className="
                absolute right-0 top-9
                w-44
                bg-white
                border border-gray-200
                rounded-xl
                shadow-xl
                p-1.5
                z-30
                animate-in fade-in zoom-in-95 duration-150
              "
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setMenuOpen(false);
                  setConfirmOpen(true);
                  setDeleteError("");
                }}
                className="
                  w-full
                  flex items-center gap-3
                  px-3 py-2.5
                  text-sm font-medium
                  text-red-600
                  hover:bg-red-50
                  rounded-lg
                  transition-colors
                  cursor-pointer
                "
              >
                <Trash2 size={16} />
                Delete Project
              </button>
            </div>
          )}
        </div>

        {/* TOP SECTION */}

        <div className="flex items-start gap-4 pr-7">
          {/* SCHOOL LOGO */}

          <div className="shrink-0">
            {logoUrl && failedImageUrl !== logoUrl ? (
              <img
                key={logoUrl}
                src={logoUrl}
                alt={`${school?.school_name || "School"} logo`}
                width={64}
                height={64}
                loading="lazy"
                onError={() => setFailedImageUrl(logoUrl)}
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
              <div
                className="
                  w-14 h-14 sm:w-16 sm:h-16
                  rounded-full
                  bg-gray-50
                  border border-gray-200
                  flex items-center justify-center
                "
              >
                <School size={27} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* PROJECT DETAILS */}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className={`
                    text-sm sm:text-base
                    font-bold text-gray-900
                    truncate
                    transition-colors duration-200
                    ${accent.title}
                  `}
                >
                  {project.header || "Untitled Project"}
                </h3>

                <p
                  className="
                    text-xs sm:text-sm
                    text-gray-500
                    font-medium
                    mt-1
                    truncate
                  "
                >
                  {school?.school_name || "School not specified"}
                </p>
              </div>

              {/* METHOD BADGE */}

              <span
                className={`
                  shrink-0
                  text-[10px] sm:text-xs
                  font-semibold
                  px-3 py-1.5
                  rounded-full
                  ${accent.badge}
                `}
              >
                {project.method || "Unknown"}
              </span>
            </div>

            {/* DESCRIPTION */}

            <p
              className="
                text-xs sm:text-sm
                text-gray-500
                mt-3
                leading-relaxed
                line-clamp-2
                break-words
              "
            >
              {project.description || "No project description available."}
            </p>
          </div>
        </div>

        {/* PROJECT STATISTICS */}

        <div
          className="
            grid grid-cols-3
            mt-5
            py-4
            border-y border-gray-100
          "
        >
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

            <p
              className={`
                text-sm sm:text-base
                font-bold mt-2 truncate
                ${accent.method}
              `}
            >
              {project.method || "Unknown"}
            </p>
          </div>
        </div>

        {/* BOTTOM SECTION */}

        <div
          className="
            flex items-center justify-between
            gap-3
            mt-4
          "
        >
          <div
            className="
              flex items-center gap-2
              min-w-0
              text-xs text-gray-400
            "
          >
            <CalendarDays size={15} className="shrink-0" />

            <span className="truncate">
              Created: {formatDate(project.created_at)}
            </span>
          </div>

          {/* ARROW */}

          <div
            className={`
              w-8 h-8 shrink-0
              rounded-full
              flex items-center justify-center
              bg-gray-50
              text-gray-500
              transition-all duration-300
              group-hover:text-white
              ${accent.arrow}
              group-hover:translate-x-1
            `}
          >
            <ArrowRight size={16} />
          </div>
        </div>
      </Link>

      {/* ================================== */}
      {/* FULL SCREEN DELETE POPUP */}
      {/* ================================== */}

      {confirmOpen && (
        <div
          className="
            fixed inset-0 z-[9999]
            flex items-center justify-center
            p-4
            bg-gray-950/40
            backdrop-blur-md
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${project.id}`}
            className="
              relative
              w-full max-w-[400px]
              bg-white
              rounded-2xl
              border border-gray-100
              shadow-2xl
              p-6 sm:p-7
              animate-in fade-in zoom-in-95 duration-200
            "
          >
            {/* CLOSE BUTTON */}

            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setConfirmOpen(false);
                setDeleteError("");
              }}
              aria-label="Close confirmation"
              className="
                absolute top-4 right-4
                w-8 h-8
                flex items-center justify-center
                rounded-full
                text-gray-400
                hover:text-gray-800
                hover:bg-gray-100
                transition-colors
                disabled:opacity-50
                cursor-pointer
              "
            >
              <X size={18} />
            </button>

            {/* WARNING ICON */}

            <div
              className="
                w-14 h-14
                rounded-2xl
                bg-red-50
                flex items-center justify-center
                mb-5
              "
            >
              <AlertTriangle
                size={27}
                className="text-red-600"
              />
            </div>

            {/* TITLE */}

            <h3
              id={`delete-title-${project.id}`}
              className="text-xl font-bold text-gray-900"
            >
              Delete project?
            </h3>

            {/* DESCRIPTION */}

            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {project.header || "this project"}
              </span>
              ?
              <br />
              <span className="block mt-2">
                This project will be removed from your active projects.
              </span>
            </p>

            {/* ERROR */}

            {deleteError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-600">
                  {deleteError}
                </p>
              </div>
            )}

            {/* ACTION BUTTONS */}

            <div className="flex items-center gap-3 mt-7">
              {/* CANCEL */}

              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setConfirmOpen(false);
                  setDeleteError("");
                }}
                className="
                  flex-1
                  py-3
                  rounded-xl
                  border border-gray-200
                  bg-white
                  text-gray-700
                  text-sm font-semibold
                  hover:bg-gray-50
                  disabled:opacity-50
                  transition-colors
                  cursor-pointer
                "
              >
                No, Cancel
              </button>

              {/* DELETE */}

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="
                  flex-1
                  flex items-center justify-center gap-2
                  py-3
                  rounded-xl
                  bg-red-600
                  text-white
                  text-sm font-semibold
                  hover:bg-red-700
                  disabled:opacity-60
                  transition-colors
                  cursor-pointer
                "
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

// ==========================================
// MAIN SHEETS COMPONENT
// ==========================================

export default function Sheets() {
  const {
    loginUserInfo,
    studentsSubject,
    setStudentsSubject,
  } = useApp();

  const userId = loginUserInfo?.id;

  // ==========================================
  // GET PROJECTS FROM GLOBAL CONTEXT
  // ==========================================

  // PageRender already fetches the projects together with
  // their school data, students, student data and subjects.
  // Do not fetch projects again inside Sheets.

  const projects = useMemo<ProjectData[]>(() => {
    if (!Array.isArray(studentsSubject)) {
      return [];
    }

    // Display active projects only.
    return (studentsSubject as ProjectData[]).filter(
      (project) => project.deleted === "No"
    );
  }, [studentsSubject]);

  // ==========================================
  // DELETE PROJECT
  // ==========================================

  const handleDeleteProject = useCallback(
    async (id: string | number) => {
      if (!userId) {
        throw new Error("User not authenticated.");
      }

      // Update the database first.
      const { error } = await supabase
        .from("projects")
        .update({ deleted: "Yes" })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      // Remove the deleted project from the existing context.
      // No second project fetch is needed.
      const currentProjects = Array.isArray(studentsSubject)
        ? (studentsSubject as ProjectData[])
        : [];

      const updatedProjects = currentProjects.map((project) =>
        project.id === id
          ? { ...project, deleted: "Yes" }
          : project
      );

      setStudentsSubject(updatedProjects);
    },
    [userId, studentsSubject, setStudentsSubject]
  );

  // ==========================================
  // EMPTY STATE
  // ==========================================

  if (projects.length === 0) {
    return null;
  }

  // ==========================================
  // RENDER PROJECTS
  // ==========================================

  return (
    <section className="w-full">
      <div
        className="
          grid w-full
          grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]
          gap-5
        "
      >
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onDelete={handleDeleteProject}
          />
        ))}
      </div>
    </section>
  );
}

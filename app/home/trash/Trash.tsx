
"use client";

import { memo, useMemo, useState, useCallback } from "react";
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
  RotateCcw,
  Trash,
  FolderOpen,
  Clock,
  CheckCircle2,
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
  onRestore,
  onDelete,
}: {
  project: ProjectData;
  onRestore: (id: string | number) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<
    "restore" | "delete" | null
  >(null);

  const [actionError, setActionError] = useState("");
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const isJHS = project.method?.toLowerCase() === "jhs";

  const school = project.school_data;
  const logoUrl = school?.logo_image;

  const studentCount = Array.isArray(project.students)
    ? project.students.length
    : 0;

  const accent = isJHS
    ? {
        border: "border-l-blue-500",
        badge: "bg-blue-50 text-blue-700",
        method: "text-blue-700",
        arrow: "group-hover:bg-blue-600",
      }
    : {
        border: "border-l-green-500",
        badge: "bg-green-50 text-green-700",
        method: "text-green-700",
        arrow: "group-hover:bg-green-600",
      };

  // ==========================================
  // RESTORE PROJECT
  // ==========================================

  async function handleRestore(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (processing) return;

    setProcessing(true);
    setProcessingType("restore");
    setActionError("");

    try {
      await onRestore(project.id);
      setMenuOpen(false);
    } catch (error) {
      console.error("Project restoration failed:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to restore this project."
      );
    } finally {
      setProcessing(false);
      setProcessingType(null);
    }
  }

  // ==========================================
  // PERMANENT DELETE
  // ==========================================

  async function handleDelete(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (processing) return;

    setProcessing(true);
    setProcessingType("delete");
    setActionError("");

    try {
      await onDelete(project.id);
      setConfirmOpen(false);
    } catch (error) {
      console.error("Permanent project deletion failed:", error);

      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to permanently delete this project."
      );
    } finally {
      setProcessing(false);
      setProcessingType(null);
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
        className="
          group relative block w-full
          overflow-visible
          bg-white
          border border-gray-200
          border-l-4 border-l-red-400
          rounded-2xl
          p-5
          min-h-[225px]
          shadow-sm
          hover:shadow-lg
          hover:-translate-y-1
          transition-all duration-300
          focus-visible:outline-none
          focus-visible:ring-4
          focus-visible:ring-red-500/20
        "
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
              setActionError("");
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
                w-48
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
                disabled={processing}
                onClick={handleRestore}
                className="
                  w-full
                  flex items-center gap-3
                  px-3 py-2.5
                  text-sm font-medium
                  text-blue-700
                  hover:bg-blue-50
                  rounded-lg
                  transition-colors
                  disabled:opacity-50
                  cursor-pointer
                "
              >
                {processing && processingType === "restore" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RotateCcw size={16} />
                )}

                Restore Project
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                disabled={processing}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setMenuOpen(false);
                  setConfirmOpen(true);
                  setActionError("");
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
                  disabled:opacity-50
                  cursor-pointer
                "
              >
                <Trash2 size={16} />
                Delete 
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
                  className="
                    text-sm sm:text-base
                    font-bold text-gray-900
                    truncate
                    transition-colors duration-200
                    group-hover:text-red-600
                  "
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

        <div className="flex items-center justify-between gap-3 mt-4">
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

        {/* TRASH STATUS */}

        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-red-500">
          <Trash2 size={12} />
          <span>In Trash</span>
        </div>
      </Link>

      {/* ================================== */}
      {/* PERMANENT DELETE CONFIRMATION */}
      {/* ================================== */}

      {confirmOpen && (
        <div
          className="
            fixed inset-0 z-[9999]
            flex items-center justify-center
            p-4
            bg-gray-950/50
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
            <button
              type="button"
              disabled={processing}
              onClick={() => {
                setConfirmOpen(false);
                setActionError("");
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

            <div
              className="
                w-14 h-14
                rounded-2xl
                bg-red-50
                flex items-center justify-center
                mb-5
              "
            >
              <AlertTriangle size={27} className="text-red-600" />
            </div>

            <h3
              id={`delete-title-${project.id}`}
              className="text-xl font-bold text-gray-900"
            >
              Delete permanently?
            </h3>

            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-gray-800">
                {project.header || "this project"}
              </span>
              ?
              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </p>

            {actionError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-600">
                  {actionError}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 mt-7">
              <button
                type="button"
                disabled={processing}
                onClick={() => {
                  setConfirmOpen(false);
                  setActionError("");
                }}
                className="
                  flex-1 py-3
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
                Cancel
              </button>

              <button
                type="button"
                disabled={processing}
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
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Forever
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
// MAIN TRASH COMPONENT
// ==========================================

export default function TrashPage() {
  const {
    loginUserInfo,
    studentsSubject,
    setStudentsSubject,
  } = useApp();

  const userId = loginUserInfo?.id;

  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState("");

  // ==========================================
  // GET TRASHED PROJECTS FROM CONTEXT
  // ==========================================

  const trashProjects = useMemo<ProjectData[]>(() => {
    if (!Array.isArray(studentsSubject)) {
      return [];
    }

    // Only show projects whose deleted value is NOT "No".
    return (studentsSubject as ProjectData[]).filter(
      (project) => project.deleted !== "No"
    );
  }, [studentsSubject]);

  // ==========================================
  // RESTORE INDIVIDUAL PROJECT
  // ==========================================

  const handleRestoreProject = useCallback(
    async (id: string | number) => {
      if (!userId) {
        throw new Error("User not authenticated.");
      }

      const { error } = await supabase
        .from("projects")
        .update({ deleted: "No" })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      const currentProjects = Array.isArray(studentsSubject)
        ? (studentsSubject as ProjectData[])
        : [];

      const updatedProjects = currentProjects.map((project) =>
        project.id === id
          ? { ...project, deleted: "No" }
          : project
      );

      setStudentsSubject(updatedProjects);
    },
    [userId, studentsSubject, setStudentsSubject]
  );

  // ==========================================
  // PERMANENTLY DELETE INDIVIDUAL PROJECT
  // ==========================================

  const handleDeleteProject = useCallback(
    async (id: string | number) => {
      if (!userId) {
        throw new Error("User not authenticated.");
      }

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        throw new Error(error.message);
      }

      const currentProjects = Array.isArray(studentsSubject)
        ? (studentsSubject as ProjectData[])
        : [];

      const updatedProjects = currentProjects.filter(
        (project) => project.id !== id
      );

      setStudentsSubject(updatedProjects);
    },
    [userId, studentsSubject, setStudentsSubject]
  );

  // ==========================================
  // PERMANENTLY DELETE ALL TRASHED PROJECTS
  // ==========================================

  const handleDeleteAll = useCallback(async () => {
    if (!userId) {
      setDeleteAllError("User not authenticated.");
      return;
    }

    if (trashProjects.length === 0) {
      setDeleteAllOpen(false);
      return;
    }

    setDeletingAll(true);
    setDeleteAllError("");

    try {
      // Delete only this user's projects whose deleted
      // value is not "No".
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("user_id", userId)
        .neq("deleted", "No");

      if (error) {
        throw new Error(error.message);
      }

      // Remove the deleted projects from global context.
      // Keep all active projects and their enriched data.
      const deletedIds = new Set(
        trashProjects.map((project) => project.id)
      );

      const currentProjects = Array.isArray(studentsSubject)
        ? (studentsSubject as ProjectData[])
        : [];

      const updatedProjects = currentProjects.filter(
        (project) => !deletedIds.has(project.id)
      );

      setStudentsSubject(updatedProjects);

      setDeleteAllOpen(false);
    } catch (error) {
      console.error("Delete all projects failed:", error);

      setDeleteAllError(
        error instanceof Error
          ? error.message
          : "Unable to delete all trashed projects."
      );
    } finally {
      setDeletingAll(false);
    }
  }, [
    userId,
    trashProjects,
    studentsSubject,
    setStudentsSubject,
  ]);

  // ==========================================
  // EMPTY TRASH
  // ==========================================

  if (!Array.isArray(studentsSubject)) {
    return null;
  }

  return (
    <section className="w-full space-y-6">

      {/* ================================== */}
      {/* TRASH HEADER */}
      {/* ================================== */}

      <div
        className="
          relative overflow-hidden
          rounded-2xl
          border border-red-100
          bg-gradient-to-br from-red-50 via-white to-orange-50
          p-5 sm:p-7
        "
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">

          <div className="flex items-center gap-4">
            <div
              className="
                w-14 h-14 sm:w-16 sm:h-16
                shrink-0
                rounded-2xl
                bg-red-100
                flex items-center justify-center
              "
            >
              <Trash2 size={29} className="text-red-600" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Trash
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Manage your deleted projects.
              </p>

              <div className="flex items-center gap-2 mt-2 text-xs text-red-600">
                <Clock size={13} />
                <span>
                  Permanently deleted projects cannot be recovered.
                </span>
              </div>
            </div>
          </div>

          {/* DELETE ALL BUTTON */}

          <button
            type="button"
            disabled={trashProjects.length === 0 || deletingAll}
            onClick={() => {
              setDeleteAllError("");
              setDeleteAllOpen(true);
            }}
            className="
              flex items-center justify-center gap-2
              px-5 py-3
              rounded-xl
              bg-red-600
              text-white
              text-sm font-semibold
              shadow-sm
              hover:bg-red-700
              hover:shadow-md
              disabled:bg-gray-200
              disabled:text-gray-400
              disabled:shadow-none
              disabled:cursor-not-allowed
              transition-all duration-200
              cursor-pointer
            "
          >
            <Trash size={17} />
            Delete All
          </button>
        </div>

        {/* DECORATIVE BACKGROUND */}

        <div
          className="
            absolute -right-10 -bottom-16
            w-48 h-48
            rounded-full
            bg-red-100/40
            blur-2xl
            pointer-events-none
          "
        />
      </div>

      {/* ================================== */}
      {/* TRASH SUMMARY */}
      {/* ================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">
            Deleted Projects
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Projects moved out of your active workspace.
          </p>
        </div>

        <div
          className="
            flex items-center gap-2
            px-3 py-2
            rounded-full
            bg-red-50
            border border-red-100
            text-red-700
            text-xs font-semibold
          "
        >
          <FolderOpen size={14} />

          {trashProjects.length}{" "}
          {trashProjects.length === 1 ? "Project" : "Projects"}
        </div>
      </div>

      {/* ================================== */}
      {/* PROJECT GRID */}
      {/* ================================== */}

      {trashProjects.length > 0 ? (
        <div
          className="
            grid w-full
            grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]
            gap-5
          "
        >
          {trashProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onRestore={handleRestoreProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      ) : (
        /* ================================== */
        /* EMPTY TRASH STATE */
        /* ================================== */

        <div
          className="
            w-full
            flex flex-col items-center justify-center
            text-center
            py-16 sm:py-20
            px-5
            rounded-2xl
            border border-dashed border-gray-200
            bg-white
          "
        >
          <div
            className="
              w-20 h-20
              rounded-3xl
              bg-gray-50
              border border-gray-100
              flex items-center justify-center
              mb-5
            "
          >
            <Trash2 size={35} className="text-gray-300" />
          </div>

          <h3 className="text-lg font-bold text-gray-800">
            Your trash is empty
          </h3>

          <p className="text-sm text-gray-500 mt-2 max-w-sm leading-relaxed">
            Projects you delete will appear here. You can restore them
            whenever you need them or permanently delete them.
          </p>

          <div className="flex items-center gap-2 mt-5 text-xs text-green-600 font-medium">
            <CheckCircle2 size={15} />
            <span>All your projects are safe.</span>
          </div>
        </div>
      )}

      {/* ================================== */}
      {/* DELETE ALL CONFIRMATION */}
      {/* ================================== */}

      {deleteAllOpen && (
        <div
          className="
            fixed inset-0 z-[9999]
            flex items-center justify-center
            p-4
            bg-gray-950/50
            backdrop-blur-md
          "
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-all-title"
            className="
              relative
              w-full max-w-[420px]
              bg-white
              rounded-2xl
              border border-gray-100
              shadow-2xl
              p-6 sm:p-7
              animate-in fade-in zoom-in-95 duration-200
            "
          >
            <button
              type="button"
              disabled={deletingAll}
              onClick={() => {
                setDeleteAllOpen(false);
                setDeleteAllError("");
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

            <div
              className="
                w-14 h-14
                rounded-2xl
                bg-red-50
                flex items-center justify-center
                mb-5
              "
            >
              <AlertTriangle size={28} className="text-red-600" />
            </div>

            <h3
              id="delete-all-title"
              className="text-xl font-bold text-gray-900"
            >
              Empty your trash?
            </h3>

            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              You are about to permanently delete{" "}
              <span className="font-bold text-gray-900">
                {trashProjects.length}{" "}
                {trashProjects.length === 1 ? "project" : "projects"}
              </span>
              .

              <span className="block mt-2 text-red-600 font-medium">
                This action cannot be undone. These projects will be
                removed from your projects table.
              </span>
            </p>

            {deleteAllError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-600">
                  {deleteAllError}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 mt-7">
              <button
                type="button"
                disabled={deletingAll}
                onClick={() => {
                  setDeleteAllOpen(false);
                  setDeleteAllError("");
                }}
                className="
                  flex-1 py-3
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
                Cancel
              </button>

              <button
                type="button"
                disabled={deletingAll}
                onClick={handleDeleteAll}
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
                {deletingAll ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

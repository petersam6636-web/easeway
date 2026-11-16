
"use client";

import {
  memo,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import useApp from "@/lib/useApp";
import { supabase } from "@/lib/supabase-client";
import QRCodePage, { type ProjectData } from "./QRCode";

import gsap from "gsap";

import {
  Search,
  QrCode,
  ArrowRight,
  CalendarDays,
  Users,
  School,
  ChartNoAxesColumnIncreasing,
  MoreVertical,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  ScanLine,
  FolderOpen,
} from "lucide-react";

// ==========================================
// HELPERS
// ==========================================

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date?: string | null): string {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return dateFormatter.format(parsedDate);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

// ==========================================
// PROJECT CARD
// ==========================================

const ProjectCard = memo(function ProjectCard({
  project,
  onSelect,
  onDelete,
}: {
  project: ProjectData;
  onSelect: (project: ProjectData) => void;
  onDelete: (id: string | number) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const school = project.school_data;
  const logoUrl = school?.logo_image;

  const isJHS = project.method?.toLowerCase() === "jhs";

  const studentCount = Array.isArray(project.students)
    ? project.students.length
    : 0;

  const accent = isJHS
    ? "bg-blue-50 text-blue-700"
    : "bg-green-50 text-green-700";

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      await onDelete(project.id);
      setConfirmOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Project deletion failed:", error);

      setDeleteError(
        getErrorMessage(
          error,
          "Unable to delete this project. Please try again."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <article className="group relative bg-white border border-gray-200 border-l-4 border-l-blue-600 rounded-2xl overflow-visible transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/60">
        {/* PROJECT SELECT BUTTON */}

        <button
          type="button"
          onClick={() => onSelect(project)}
          className="w-full text-left p-5 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 rounded-2xl"
        >
          <div className="flex items-start gap-4 pr-8">
            <div className="shrink-0">
              {logoUrl && failedImageUrl !== logoUrl ? (
                <img
                  key={logoUrl}
                  src={logoUrl}
                  alt={`${school?.school_name || "School"} logo`}
                  width={60}
                  height={60}
                  loading="lazy"
                  onError={() => setFailedImageUrl(logoUrl)}
                  className="w-14 h-14 rounded-2xl object-cover border border-gray-200 bg-gray-50"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <School size={25} className="text-blue-600" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                {project.header || "Untitled Project"}
              </h3>

              <p className="text-xs font-medium text-gray-500 mt-1 truncate">
                {school?.school_name || "School not specified"}
              </p>

              <span className={`inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold ${accent}`}>
                {project.method || "Unknown method"}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500 leading-relaxed mt-5 line-clamp-2 min-h-[40px]">
            {project.description || "No project description available."}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-gray-100">
            <div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={15} />
                <span className="text-xs">Students</span>
              </div>

              <p className="text-lg font-bold text-gray-900 mt-1">
                {studentCount}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-400">
                <ChartNoAxesColumnIncreasing size={15} />
                <span className="text-xs">Pass Mark</span>
              </div>

              <p className="text-lg font-bold text-gray-900 mt-1">
                {project.passMark ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0">
              <CalendarDays size={14} className="shrink-0" />
              <span className="truncate">
                {formatDate(project.created_at)}
              </span>
            </div>

            <span className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 group-hover:gap-3 transition-all shrink-0">
              Generate QR
              <ArrowRight size={15} />
            </span>
          </div>
        </button>

        {/* OPTIONS MENU */}

        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            aria-label="Project options"
            aria-expanded={menuOpen}
            onClick={() => {
              setMenuOpen((previous) => !previous);
              setDeleteError("");
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 bg-white border border-gray-100 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-white border border-gray-200 rounded-xl shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onSelect(project);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <QrCode size={16} />
                Generate QR Code
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                  setDeleteError("");
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
                Delete Project
              </button>
            </div>
          )}
        </div>
      </article>

      {/* DELETE CONFIRMATION */}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-md"
          onClick={() => {
            if (!deleting) {
              setConfirmOpen(false);
              setDeleteError("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${project.id}`}
            className="relative w-full max-w-[400px] bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              disabled={deleting}
              onClick={() => {
                setConfirmOpen(false);
                setDeleteError("");
              }}
              aria-label="Close confirmation"
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5">
              <AlertTriangle size={27} className="text-red-600" />
            </div>

            <h3
              id={`delete-title-${project.id}`}
              className="text-xl font-bold text-gray-900"
            >
              Delete project?
            </h3>

            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {project.header || "this project"}
              </span>
              ?
              <span className="block mt-2">
                This project will be moved to your trash.
              </span>
            </p>

            {deleteError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            )}

            <div className="flex items-center gap-3 mt-7">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setConfirmOpen(false);
                  setDeleteError("");
                }}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete project
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

export default function Paging() {
  const {
    loginUserInfo,
    studentsSubject,
    setStudentsSubject,
  } = useApp();

  const userId = loginUserInfo?.id;

  const [activeView, setActiveView] = useState<"project" | "qr-code">(
    "project"
  );

  const [selectedProject, setSelectedProject] =
    useState<ProjectData | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const viewRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // PROJECT DATA
  // ==========================================

  const allProjects = useMemo<ProjectData[]>(() => {
    if (!Array.isArray(studentsSubject)) return [];

    return studentsSubject as ProjectData[];
  }, [studentsSubject]);

  const projects = useMemo(() => {
    return allProjects.filter(
      (project) => project.deleted === "No"
    );
  }, [allProjects]);

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredProjects = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) return projects;

    return projects.filter((project) => {
      const projectName = project.header?.toLowerCase() || "";
      const schoolName =
        project.school_data?.school_name?.toLowerCase() || "";
      const method = project.method?.toLowerCase() || "";

      return (
        projectName.includes(search) ||
        schoolName.includes(search) ||
        method.includes(search)
      );
    });
  }, [projects, searchTerm]);

  // ==========================================
  // GSAP TRANSITION
  // ==========================================

  useEffect(() => {
    const element = viewRef.current;

    if (!element) return;

    const animationContext = gsap.context(() => {
      gsap.fromTo(
        element,
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          ease: "power2.out",
        }
      );
    }, element);

    return () => {
      animationContext.revert();
    };
  }, [activeView, selectedProject?.id]);

  // ==========================================
  // SELECT PROJECT
  // ==========================================

  const handleSelectProject = useCallback((project: ProjectData) => {
    setSelectedProject(project);
    setActiveView("qr-code");
  }, []);

  // ==========================================
  // BACK TO PROJECTS
  // ==========================================

  const handleBack = useCallback(() => {
    setActiveView("project");
    setSelectedProject(null);
  }, []);

  // ==========================================
  // SOFT DELETE PROJECT
  // ==========================================

  const handleDeleteProject = useCallback(
    async (id: string | number): Promise<void> => {
      if (!userId) {
        throw new Error(
          "User not authenticated. Please sign in again."
        );
      }

      const { data, error } = await supabase
        .from("projects")
        .update({ deleted: "Yes" })
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .maybeSingle();

      if (error) {
        console.error("Supabase project update error:", error);
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(
          "Project not found or you do not have permission to delete it."
        );
      }

      // Keep the project in context for the Trash page.
      // Only mark it as deleted.

      const currentProjects = Array.isArray(studentsSubject)
        ? (studentsSubject as ProjectData[])
        : [];

      const updatedProjects = currentProjects.map((project) =>
        String(project.id) === String(id)
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

  if (activeView === "project" && projects.length === 0) {
    return (
      <section className="w-full">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <QrCode size={30} />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mt-5">
            No projects available
          </h2>

          <p className="text-sm text-gray-500 max-w-md mx-auto mt-2 leading-relaxed">
            Create an active project first. Once your project is
            available, you can generate its QR code and share it.
          </p>
        </div>
      </section>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section className="w-full">
      {/* PROJECT SELECTION */}

      {activeView === "project" && (
        <div ref={viewRef} className="w-full space-y-7">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 mb-3">
                <QrCode size={14} />
                QR CODE GENERATOR
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Generate project QR codes
              </h1>

              <p className="text-sm sm:text-base text-gray-500 mt-2 leading-relaxed">
                Select one of your projects to create a unique QR code.
                Anyone who scans it can open that project&apos;s share page.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 w-fit">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FolderOpen size={20} />
              </div>

              <div>
                <p className="text-xl font-bold text-gray-900">
                  {projects.length}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">
                  Active projects
                </p>
              </div>
            </div>
          </div>

          {/* INSTRUCTION PANEL */}

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
              <ScanLine size={22} />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-bold text-blue-950">
                Select a project to get started
              </h3>

              <p className="text-xs sm:text-sm text-blue-800/80 mt-1 leading-relaxed">
                Choose a project below. Easeway will generate a QR code
                connected to that project&apos;s unique sharing link.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-blue-700 shrink-0">
              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                1
              </span>
              Select
              <ArrowRight size={14} />
              <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                2
              </span>
              Share
            </div>
          </div>

          {/* PROJECT LIST HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Your projects
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Choose which project you want to share.
              </p>
            </div>

            <div className="w-full sm:w-[280px] flex items-center gap-2 px-3.5 bg-white border border-gray-200 rounded-xl focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <Search size={17} className="text-gray-400 shrink-0" />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search projects..."
                aria-label="Search projects"
                className="w-full min-w-0 py-3 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* PROJECT CARDS */}

          {filteredProjects.length > 0 ? (
            <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))] gap-5">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={handleSelectProject}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <Search size={28} className="text-gray-300 mx-auto" />

              <h3 className="text-base font-bold text-gray-800 mt-3">
                No matching projects
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Try searching with a different project or school name.
              </p>

              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      )}

      {/* SEPARATE QR CODE COMPONENT */}

      {activeView === "qr-code" && selectedProject && (
        <div ref={viewRef} className="w-full">
          <QRCodePage
            project={selectedProject}
            onBack={handleBack}
          />
        </div>
      )}
    </section>
  );
}

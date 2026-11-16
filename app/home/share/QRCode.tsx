
"use client";

import {
  memo,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

import type { MouseEvent } from "react";

import useApp from "@/lib/useApp";
import { supabase } from "@/lib/supabase-client";

import { QRCodeSVG } from "qrcode.react";
import gsap from "gsap";

import {
  Search,
  QrCode,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Users,
  School,
  ChartNoAxesColumnIncreasing,
  MoreVertical,
  Trash2,
  Loader2,
  AlertTriangle,
  X,
  Copy,
  Check,
  Link2,
  ScanLine,
  Share2,
  FolderOpen,
  Sparkles,
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
// SHARE URL
// ==========================================

function getProjectShareUrl(projectId: string | number) {
  return `https://easeway-chi.vercel.app/home/share/${projectId}`;
}

// ==========================================
// COPY LINK HELPER
// ==========================================

async function copyToClipboard(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);

  textarea.select();

  const successful = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!successful) {
    throw new Error("Copying the link failed.");
  }
}

// ==========================================
// PROJECT QR CODE COMPONENT
// ==========================================

function QRCode({
  project,
  onBack,
}: {
  project: ProjectData;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const shareUrl = getProjectShareUrl(project.id);

  const studentCount = Array.isArray(project.students)
    ? project.students.length
    : 0;

  // ==========================================
  // COPY PROJECT LINK
  // ==========================================

  const handleCopy = async () => {
    try {
      await copyToClipboard(shareUrl);

      setCopied(true);
      setCopyError("");

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (error) {
      console.error("Copy link error:", error);

      setCopyError("Unable to copy the link. Please try again.");
      setCopied(false);
    }
  };

  // ==========================================
  // DOWNLOAD QR CODE
  // ==========================================

  const handleDownload = () => {
    const svg = document.getElementById(
      `project-qr-${project.id}`
    );

    if (!(svg instanceof SVGElement)) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `easeway-project-${project.id}-qr.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-7">

      {/* ================================== */}
      {/* TOP HEADER */}
      {/* ================================== */}

      <div className="flex flex-col gap-5">

        <button
          type="button"
          onClick={onBack}
          className="
            group inline-flex items-center gap-2
            w-fit
            text-sm font-semibold
            text-gray-500
            hover:text-blue-700
            transition-colors
            cursor-pointer
          "
        >
          <span className="
            w-9 h-9 rounded-xl
            border border-gray-200
            bg-white
            flex items-center justify-center
            group-hover:border-blue-200
            group-hover:bg-blue-50
            transition-colors
          ">
            <ArrowLeft size={17} />
          </span>

          Back to project selection
        </button>

        <div>
          <div className="
            inline-flex items-center gap-2
            text-xs font-bold
            text-blue-700
            bg-blue-50
            border border-blue-100
            rounded-full
            px-3 py-1.5
            mb-3
          ">
            <QrCode size={14} />
            PROJECT QR GENERATOR
          </div>

          <h1 className="
            text-2xl sm:text-3xl
            font-bold tracking-tight
            text-gray-900
          ">
            Share your project
          </h1>

          <p className="
            text-sm sm:text-base
            text-gray-500
            mt-2 max-w-2xl
            leading-relaxed
          ">
            Anyone with this QR code or share link can open
            your project's sharing page.
          </p>
        </div>

      </div>

      {/* ================================== */}
      {/* QR GENERATOR CONTENT */}
      {/* ================================== */}

      <div className="
        grid grid-cols-1
        lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]
        gap-6
        items-stretch
      ">

        {/* ================================== */}
        {/* QR PREVIEW */}
        {/* ================================== */}

        <div className="
          relative overflow-hidden
          bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950
          rounded-3xl
          p-6 sm:p-8
          flex flex-col items-center justify-center
          min-h-[430px]
        ">

          {/* DECORATION */}

          <div className="
            absolute -top-20 -right-20
            w-64 h-64
            rounded-full
            bg-white/5
          " />

          <div className="
            absolute -bottom-24 -left-20
            w-64 h-64
            rounded-full
            bg-blue-400/10
          " />

          <div className="relative z-10 text-center">

            <div className="
              inline-flex items-center gap-2
              text-xs font-semibold
              text-blue-100
              bg-white/10
              border border-white/10
              rounded-full
              px-3 py-1.5
              mb-6
            ">
              <ScanLine size={14} />
              Ready to scan
            </div>

            {/* WHITE QR CONTAINER */}

            <div className="
              mx-auto
              w-fit
              bg-white
              rounded-3xl
              p-4 sm:p-5
              shadow-2xl
              shadow-black/20
            ">
              <QRCodeSVG
                id={`project-qr-${project.id}`}
                value={shareUrl}
                size={240}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#111827"
              />
            </div>

            <h2 className="
              text-white
              text-lg font-bold
              mt-6
            ">
              Scan to open project
            </h2>

            <p className="
              text-sm text-blue-100/80
              mt-2 max-w-xs mx-auto
              leading-relaxed
            ">
              Open your phone camera and point it at this QR code.
            </p>

          </div>

        </div>

        {/* ================================== */}
        {/* PROJECT INFORMATION AND SHARING */}
        {/* ================================== */}

        <div className="
          bg-white
          border border-gray-200
          rounded-3xl
          p-5 sm:p-7
          flex flex-col
        ">

          {/* PROJECT INFORMATION */}

          <div className="flex items-start gap-4">

            {project.school_data?.logo_image ? (
              <img
                src={project.school_data.logo_image}
                alt="School logo"
                className="
                  w-14 h-14
                  rounded-2xl
                  object-cover
                  border border-gray-200
                  bg-gray-50
                  shrink-0
                "
              />
            ) : (
              <div className="
                w-14 h-14
                rounded-2xl
                bg-blue-50
                border border-blue-100
                flex items-center justify-center
                shrink-0
              ">
                <School size={25} className="text-blue-600" />
              </div>
            )}

            <div className="min-w-0 flex-1">

              <p className="
                text-[11px] font-bold
                uppercase tracking-wider
                text-gray-400
              ">
                Selected project
              </p>

              <h2 className="
                text-lg sm:text-xl
                font-bold text-gray-900
                mt-1 break-words
              ">
                {project.header || "Untitled Project"}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {project.school_data?.school_name ||
                  "School not specified"}
              </p>

            </div>

          </div>

          {/* PROJECT DETAILS */}

          <div className="
            grid grid-cols-2
            gap-3
            mt-7
          ">

            <div className="
              bg-gray-50
              border border-gray-100
              rounded-2xl
              p-4
            ">
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={16} />
                <span className="text-xs font-medium">Students</span>
              </div>

              <p className="text-xl font-bold text-gray-900 mt-2">
                {studentCount}
              </p>
            </div>

            <div className="
              bg-gray-50
              border border-gray-100
              rounded-2xl
              p-4
            ">
              <div className="flex items-center gap-2 text-gray-400">
                <GraduationCap size={17} />
                <span className="text-xs font-medium">Method</span>
              </div>

              <p className="text-base font-bold text-gray-900 mt-2">
                {project.method || "Unknown"}
              </p>
            </div>

          </div>

          {/* DIVIDER */}

          <div className="border-t border-gray-100 my-7" />

          {/* SHARE LINK */}

          <div>

            <div className="flex items-center gap-2 mb-3">
              <Link2 size={17} className="text-blue-600" />

              <h3 className="text-sm font-bold text-gray-900">
                Project sharing link
              </h3>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Copy this link and share it with anyone who needs
              to access this project.
            </p>

            <div className="
              flex flex-col sm:flex-row
              gap-2
            ">

              <div className="
                flex-1 min-w-0
                flex items-center
                px-3
                bg-gray-50
                border border-gray-200
                rounded-xl
              ">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.target.select()}
                  className="
                    w-full min-w-0
                    py-3
                    bg-transparent
                    outline-none
                    text-xs
                    text-gray-600
                  "
                />
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className={`
                  shrink-0
                  inline-flex items-center justify-center gap-2
                  px-5 py-3
                  rounded-xl
                  text-sm font-semibold
                  transition-all
                  cursor-pointer
                  ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }
                `}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy link
                  </>
                )}
              </button>

            </div>

            {copyError && (
              <p className="text-xs text-red-600 mt-2">
                {copyError}
              </p>
            )}

          </div>

          {/* DOWNLOAD */}

          <div className="mt-auto pt-7">

            <button
              type="button"
              onClick={handleDownload}
              className="
                w-full
                inline-flex items-center justify-center gap-2
                py-3.5 px-5
                rounded-xl
                border border-gray-200
                bg-white
                text-gray-700
                text-sm font-semibold
                hover:bg-gray-50
                hover:border-gray-300
                transition-colors
                cursor-pointer
              "
            >
              <QrCode size={17} />
              Download QR Code
            </button>

            <p className="
              text-[11px] text-gray-400
              text-center mt-3
            ">
              Download the QR code as an SVG image.
            </p>

          </div>

        </div>

      </div>

      {/* ================================== */}
      {/* HELPFUL INFORMATION */}
      {/* ================================== */}

      <div className="
        flex items-start gap-3
        p-4 sm:p-5
        rounded-2xl
        bg-blue-50/70
        border border-blue-100
      ">

        <div className="
          w-9 h-9 shrink-0
          rounded-xl
          bg-white
          flex items-center justify-center
          text-blue-600
        ">
          <Sparkles size={18} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-blue-950">
            Easy project sharing
          </h3>

          <p className="
            text-xs sm:text-sm
            text-blue-800/80
            mt-1 leading-relaxed
          ">
            Your QR code is connected to this project's unique ID.
            You can download it, print it, or share the link.
            The QR code will continue to point to the same project URL.
          </p>
        </div>

      </div>

    </div>
  );
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
    ? {
        border: "border-l-blue-600",
        badge: "bg-blue-50 text-blue-700",
        method: "text-blue-700",
      }
    : {
        border: "border-l-green-600",
        badge: "bg-green-50 text-green-700",
        method: "text-green-700",
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

  // ==========================================
  // RENDER CARD
  // ==========================================

  return (
    <>
      <article className="
        group relative
        bg-white
        border border-gray-200
        border-l-4
        rounded-2xl
        overflow-visible
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-xl
        hover:shadow-gray-200/60
      ">

        {/* PROJECT CARD SELECT BUTTON */}

        <button
          type="button"
          onClick={() => onSelect(project)}
          className="
            w-full
            text-left
            p-5
            cursor-pointer
            focus-visible:outline-none
            focus-visible:ring-4
            focus-visible:ring-blue-500/20
            rounded-2xl
          "
        >

          {/* CARD TOP */}

          <div className="flex items-start gap-4 pr-8">

            {/* SCHOOL LOGO */}

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
                  className="
                    w-14 h-14
                    rounded-2xl
                    object-cover
                    border border-gray-200
                    bg-gray-50
                  "
                />
              ) : (
                <div className="
                  w-14 h-14
                  rounded-2xl
                  bg-blue-50
                  border border-blue-100
                  flex items-center justify-center
                ">
                  <School size={25} className="text-blue-600" />
                </div>
              )}

            </div>

            {/* PROJECT NAME */}

            <div className="flex-1 min-w-0">

              <h3 className="
                text-base font-bold
                text-gray-900
                truncate
                group-hover:text-blue-700
                transition-colors
              ">
                {project.header || "Untitled Project"}
              </h3>

              <p className="
                text-xs font-medium
                text-gray-500
                mt-1 truncate
              ">
                {school?.school_name || "School not specified"}
              </p>

              <span className={`
                inline-flex items-center
                mt-2
                px-2.5 py-1
                rounded-full
                text-[10px] font-bold
                ${accent.badge}
              `}>
                {project.method || "Unknown method"}
              </span>

            </div>

          </div>

          {/* DESCRIPTION */}

          <p className="
            text-sm text-gray-500
            leading-relaxed
            mt-5
            line-clamp-2
            min-h-[40px]
          ">
            {project.description || "No project description available."}
          </p>

          {/* STATISTICS */}

          <div className="
            grid grid-cols-2
            gap-3
            mt-5
            pt-4
            border-t border-gray-100
          ">

            <div>
              <div className="flex items-center gap-2 text-gray-400">
                <Users size={15} />
                <span className="text-xs">Students</span>
              </div>

              <p className="
                text-lg font-bold
                text-gray-900 mt-1
              ">
                {studentCount}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-gray-400">
                <ChartNoAxesColumnIncreasing size={15} />
                <span className="text-xs">Pass Mark</span>
              </div>

              <p className="
                text-lg font-bold
                text-gray-900 mt-1
              ">
                {project.passMark ?? 0}
              </p>
            </div>

          </div>

          {/* CARD FOOTER */}

          <div className="
            flex items-center justify-between
            gap-3
            mt-5 pt-4
            border-t border-gray-100
          ">

            <div className="
              flex items-center gap-2
              text-xs text-gray-400
              min-w-0
            ">
              <CalendarDays size={14} className="shrink-0" />

              <span className="truncate">
                {formatDate(project.created_at)}
              </span>
            </div>

            <span className="
              inline-flex items-center gap-2
              text-xs font-bold
              text-blue-700
              group-hover:gap-3
              transition-all
              shrink-0
            ">
              Generate QR
              <ArrowRight size={15} />
            </span>

          </div>

        </button>

        {/* ================================== */}
        {/* OPTIONS MENU */}
        {/* ================================== */}

        <div className="absolute top-4 right-4 z-20">

          <button
            type="button"
            aria-label="Project options"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              setMenuOpen((previous) => !previous);
              setDeleteError("");
            }}
            className="
              w-9 h-9
              rounded-xl
              flex items-center justify-center
              text-gray-500
              bg-white
              border border-gray-100
              hover:bg-gray-50
              hover:text-gray-900
              transition-colors
              cursor-pointer
            "
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div
              className="
                absolute right-0 top-10
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  setMenuOpen(false);
                  onSelect(project);
                }}
                className="
                  w-full flex items-center gap-3
                  px-3 py-2.5
                  rounded-lg
                  text-sm font-medium
                  text-blue-700
                  hover:bg-blue-50
                  transition-colors
                  cursor-pointer
                "
              >
                <QrCode size={16} />
                Generate QR Code
              </button>

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
                  w-full flex items-center gap-3
                  px-3 py-2.5
                  rounded-lg
                  text-sm font-medium
                  text-red-600
                  hover:bg-red-50
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

      </article>

      {/* ================================== */}
      {/* DELETE CONFIRMATION */}
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

            <div className="
              w-14 h-14
              rounded-2xl
              bg-red-50
              flex items-center justify-center
              mb-5
            ">
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
              <div className="
                mt-4 p-3
                rounded-lg
                bg-red-50
                border border-red-100
              ">
                <p className="text-sm text-red-600">
                  {deleteError}
                </p>
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

export default function Sheets() {
  const {
    loginUserInfo,
    studentsSubject,
    setStudentsSubject,
  } = useApp();

  const userId = loginUserInfo?.id;

  // ==========================================
  // SCREEN STATE
  // ==========================================

  type ViewType = "project" | "qr-code";

  const [activeView, setActiveView] = useState<ViewType>("project");

  const [selectedProject, setSelectedProject] =
    useState<ProjectData | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const viewRef = useRef<HTMLDivElement>(null);

  // ==========================================
  // GET PROJECTS FROM PAGE RENDER CONTEXT
  // ==========================================

  const projects = useMemo<ProjectData[]>(() => {
    if (!Array.isArray(studentsSubject)) {
      return [];
    }

    return (studentsSubject as ProjectData[]).filter(
      (project) => project.deleted === "No"
    );
  }, [studentsSubject]);

  // ==========================================
  // SEARCH PROJECTS
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
  // GSAP SCREEN TRANSITION
  // ==========================================

  useEffect(() => {
    const element = viewRef.current;

    if (!element) return;

    const animation = gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 100,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out",
      }
    );

    return () => {
      animation.kill();
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
  // BACK TO PROJECT SELECTION
  // ==========================================

  const handleBack = useCallback(() => {
    setActiveView("project");
    setSelectedProject(null);
  }, []);

  // ==========================================
  // DELETE PROJECT
  // ==========================================

  const handleDeleteProject = useCallback(
    async (id: string | number) => {
      if (!userId) {
        throw new Error("User not authenticated.");
      }

      const { error } = await supabase
        .from("projects")
        .update({ deleted: "Yes" })
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
    return (
      <section className="w-full">

        <div className="
          bg-white
          border border-gray-200
          rounded-2xl
          p-8 sm:p-12
          text-center
        ">

          <div className="
            w-16 h-16
            mx-auto
            rounded-2xl
            bg-blue-50
            flex items-center justify-center
            text-blue-600
          ">
            <QrCode size={30} />
          </div>

          <h2 className="
            text-xl font-bold
            text-gray-900
            mt-5
          ">
            No projects available
          </h2>

          <p className="
            text-sm text-gray-500
            max-w-md mx-auto
            mt-2 leading-relaxed
          ">
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

      {/* ================================== */}
      {/* PROJECT SELECTION SCREEN */}
      {/* ================================== */}

      {activeView === "project" && (
        <div
          ref={viewRef}
          className="w-full space-y-7"
        >

          {/* PAGE HEADER */}

          <div className="
            flex flex-col
            lg:flex-row
            lg:items-end
            lg:justify-between
            gap-5
          ">

            <div className="max-w-2xl">

              <div className="
                inline-flex items-center gap-2
                text-xs font-bold
                text-blue-700
                bg-blue-50
                border border-blue-100
                rounded-full
                px-3 py-1.5
                mb-3
              ">
                <QrCode size={14} />
                QR CODE GENERATOR
              </div>

              <h1 className="
                text-2xl sm:text-3xl
                font-bold tracking-tight
                text-gray-900
              ">
                Generate project QR codes
              </h1>

              <p className="
                text-sm sm:text-base
                text-gray-500
                mt-2 leading-relaxed
              ">
                Select one of your projects to create a unique QR code.
                Anyone who scans it can open that project's share page.
              </p>

            </div>

            {/* PROJECT COUNT */}

            <div className="
              flex items-center gap-3
              bg-white
              border border-gray-200
              rounded-2xl
              px-4 py-3
              w-fit
            ">

              <div className="
                w-10 h-10
                rounded-xl
                bg-blue-50
                flex items-center justify-center
                text-blue-600
              ">
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

          <div className="
            flex flex-col sm:flex-row
            sm:items-center
            gap-4
            p-4 sm:p-5
            bg-gradient-to-r from-blue-50 to-indigo-50
            border border-blue-100
            rounded-2xl
          ">

            <div className="
              w-11 h-11 shrink-0
              rounded-xl
              bg-white
              flex items-center justify-center
              text-blue-600
              shadow-sm
            ">
              <ScanLine size={22} />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-bold text-blue-950">
                Select a project to get started
              </h3>

              <p className="
                text-xs sm:text-sm
                text-blue-800/80
                mt-1 leading-relaxed
              ">
                Choose a project below. Easeway will generate a QR code
                connected to that project's unique sharing link.
              </p>
            </div>

            <div className="
              hidden sm:flex
              items-center gap-2
              text-xs font-semibold
              text-blue-700
              shrink-0
            ">
              <span className="
                w-6 h-6
                rounded-full
                bg-white
                flex items-center justify-center
              ">
                1
              </span>

              Select
              <ArrowRight size={14} />
              <span className="
                w-6 h-6
                rounded-full
                bg-white
                flex items-center justify-center
              ">
                2
              </span>

              Share
            </div>

          </div>

          {/* PROJECT LIST HEADER */}

          <div className="
            flex flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-4
          ">

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Your projects
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Choose which project you want to share.
              </p>
            </div>

            {/* SEARCH */}

            <div className="
              w-full sm:w-[280px]
              flex items-center gap-2
              px-3.5
              bg-white
              border border-gray-200
              rounded-xl
              focus-within:border-blue-400
              focus-within:ring-4
              focus-within:ring-blue-500/10
              transition-all
            ">

              <Search size={17} className="text-gray-400 shrink-0" />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="
                  w-full min-w-0
                  py-3
                  bg-transparent
                  outline-none
                  text-sm
                  text-gray-700
                  placeholder:text-gray-400
                "
              />

            </div>

          </div>

          {/* PROJECT CARDS */}

          {filteredProjects.length > 0 ? (
            <div className="
              grid w-full
              grid-cols-[repeat(auto-fill,minmax(min(100%,290px),1fr))]
              gap-5
            ">

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
            <div className="
              bg-white
              border border-gray-200
              rounded-2xl
              p-8
              text-center
            ">

              <Search
                size={28}
                className="text-gray-300 mx-auto"
              />

              <h3 className="
                text-base font-bold
                text-gray-800
                mt-3
              ">
                No matching projects
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Try searching with a different project or school name.
              </p>

              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="
                  mt-4
                  text-sm font-semibold
                  text-blue-700
                  hover:text-blue-800
                  cursor-pointer
                "
              >
                Clear search
              </button>

            </div>
          )}

        </div>
      )}


      {activeView === "qr-code" && selectedProject && (
        <div
          ref={viewRef}
          className="w-full"
        >
          <QRCode
            project={selectedProject}
            onBack={handleBack}
          />
        </div>
      )}

    </section>
  );
}

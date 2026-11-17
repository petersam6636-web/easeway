
"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";

import useApp from "@/lib/useApp";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Command,
  GraduationCap,
  Search,
  School,
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
  deleted?: string | null;

  school_data?: {
    school_name?: string | null;
    logo_image?: string | null;
  } | null;
};

// ==========================================
// HEADER FALLBACK
// ==========================================

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
            <GraduationCap size={24} strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Teacher Workspace
            </h1>

            <p className="hidden truncate text-xs text-slate-500 sm:block">
              Your space to create and organize
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ==========================================
// HEADER CONTENT
// All navigation hooks are inside Suspense.
// ==========================================

function HeaderContent() {
  const router = useRouter();
  const pathname = usePathname();

  // ==========================================
  // GLOBAL APP STATE
  // ==========================================

  const { studentsSubject } = useApp();

  // ==========================================
  // PATHNAME CONTROL
  // ==========================================

  const showSearch = pathname === "/home";

  // ==========================================
  // LOCAL STATE
  // ==========================================

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const [failedImages, setFailedImages] = useState<
    Record<string, boolean>
  >({});

  // ==========================================
  // REFS
  // ==========================================

  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);

  // ==========================================
  // PROJECTS FROM GLOBAL CONTEXT
  // ==========================================

  const projects = useMemo<ProjectData[]>(() => {
    if (!Array.isArray(studentsSubject)) {
      return [];
    }

    // Search only active projects.
    return (studentsSubject as ProjectData[]).filter(
      (project) => project.deleted === "No"
    );
  }, [studentsSubject]);

  // ==========================================
  // SEARCH ALL MATCHING PROJECTS
  // ==========================================

  const allMatchingProjects = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return [];
    }

    return projects.filter((project) =>
      (project.header || "").toLowerCase().includes(value)
    );
  }, [projects, query]);

  // ==========================================
  // SHOW ONLY THE FIRST FOUR PROJECTS
  // ==========================================

  const matchingProjects = useMemo(() => {
    return allMatchingProjects.slice(0, 4);
  }, [allMatchingProjects]);

  // ==========================================
  // SEARCH INFORMATION
  // ==========================================

  const hasQuery = query.trim().length > 0;

  const totalMatchingProjects = allMatchingProjects.length;

  // ==========================================
  // MOUNT
  // ==========================================

  useEffect(() => {
    setMounted(true);

    return () => {
      animationRef.current?.kill();
    };
  }, []);

  // ==========================================
  // OPEN SEARCH
  // ==========================================

  const openSearch = useCallback(() => {
    animationRef.current?.kill();

    closingRef.current = false;

    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  }, []);

  // ==========================================
  // CLOSE SEARCH
  // ==========================================

  const closeSearch = useCallback(() => {
    if (closingRef.current) return;

    closingRef.current = true;

    animationRef.current?.kill();

    const panel = panelRef.current;
    const backdrop = backdropRef.current;

    if (!panel || !backdrop) {
      setIsOpen(false);
      closingRef.current = false;
      return;
    }

    animationRef.current = gsap.timeline({
      onComplete: () => {
        setIsOpen(false);
        closingRef.current = false;
      },
    });

    animationRef.current
      .to(
        panel,
        {
          opacity: 0,
          y: -4,
          scale: 0.995,
          duration: 0.11,
          ease: "power1.in",
        },
        0
      )
      .to(
        backdrop,
        {
          opacity: 0,
          duration: 0.13,
          ease: "power1.in",
        },
        0
      );
  }, []);

  // ==========================================
  // NAVIGATE TO PROJECT
  // ==========================================

  const navigateToProject = useCallback(
    (id: string | number) => {
      closeSearch();
      router.push(`/home/project/${id}`);
    },
    [closeSearch, router]
  );

  // ==========================================
  // SHOW ALL MATCHING PROJECTS ON HOMEPAGE
  // ==========================================

  const showAllProjects = useCallback(() => {
    const searchValue = query.trim();

    if (!searchValue) return;

    closeSearch();

    router.push(
      `/home?projectSearch=${encodeURIComponent(searchValue)}`
    );
  }, [query, closeSearch, router]);

  // ==========================================
  // CLOSE WHEN LEAVING DASHBOARD
  // ==========================================

  useEffect(() => {
    if (pathname !== "/home" && isOpen) {
      animationRef.current?.kill();

      setIsOpen(false);
      closingRef.current = false;
    }
  }, [pathname, isOpen]);

  // ==========================================
  // SEARCH MODAL ANIMATION
  // ==========================================

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const backdrop = backdropRef.current;

    if (!panel || !backdrop) return;

    animationRef.current?.kill();

    gsap.set(backdrop, { opacity: 0 });

    gsap.set(panel, {
      opacity: 0,
      y: 7,
      scale: 0.995,
    });

    animationRef.current = gsap.timeline();

    animationRef.current
      .to(backdrop, {
        opacity: 1,
        duration: 0.14,
        ease: "power1.out",
      })
      .to(
        panel,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.19,
          ease: "power2.out",
        },
        0
      );

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);

    return () => {
      window.clearTimeout(focusTimer);
      animationRef.current?.kill();
    };
  }, [isOpen]);

  // ==========================================
  // GLOBAL KEYBOARD SHORTCUTS
  // ==========================================

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k" &&
        showSearch
      ) {
        event.preventDefault();

        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }

      if (event.key === "Escape" && isOpen) {
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen, showSearch, openSearch, closeSearch]);

  // ==========================================
  // RESET ACTIVE INDEX AND ANIMATE RESULTS
  // ==========================================

  useEffect(() => {
    setActiveIndex(0);

    if (!resultsRef.current) return;

    const results =
      resultsRef.current.querySelectorAll<HTMLElement>(
        "[data-search-result]"
      );

    gsap.killTweensOf(results);

    if (results.length) {
      gsap.fromTo(
        results,
        {
          opacity: 0,
          y: 2,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.1,
          stagger: 0.015,
          ease: "power1.out",
          clearProps: "all",
        }
      );
    }
  }, [matchingProjects, query]);

  // ==========================================
  // KEYBOARD NAVIGATION
  // ==========================================

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const currentCount = matchingProjects.length;

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        currentCount
          ? (current + 1) % currentCount
          : 0
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        currentCount
          ? (current - 1 + currentCount) % currentCount
          : 0
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const project = matchingProjects[activeIndex];

      if (project) {
        navigateToProject(project.id);
      }
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
    }
  };

  // ==========================================
  // KEEP ACTIVE RESULT VISIBLE
  // ==========================================

  useEffect(() => {
    const activeResult =
      resultsRef.current?.querySelector<HTMLElement>(
        `[data-search-index="${activeIndex}"]`
      );

    activeResult?.scrollIntoView({
      block: "nearest",
      behavior: "auto",
    });
  }, [activeIndex]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      {/* ================================== */}
      {/* WORKSPACE HEADER */}
      {/* ================================== */}

      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* WORKSPACE TITLE */}

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <GraduationCap size={24} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Teacher Workspace
              </h1>

              <p className="hidden truncate text-xs text-slate-500 sm:block">
                Your space to create and organize
              </p>
            </div>
          </div>

          {/* SEARCH BUTTON - ONLY /HOME */}

          {showSearch && (
            <button
              type="button"
              onClick={openSearch}
              aria-label="Open project search"
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:w-[280px] sm:justify-between sm:px-3 lg:w-[320px]"
            >
              <span className="flex items-center gap-2">
                <Search size={18} />

                <span className="hidden text-sm text-slate-500 sm:inline">
                  Search your projects...
                </span>
              </span>

              <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-medium text-slate-500 sm:flex">
                <Command size={11} />
                K
              </span>
            </button>
          )}
        </div>
      </header>

      {/* ================================== */}
      {/* PROJECT SEARCH MODAL */}
      {/* ================================== */}

      {mounted &&
        isOpen &&
        showSearch &&
        createPortal(
          <div
            ref={backdropRef}
            className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-3 pb-8 pt-[12vh] backdrop-blur-sm sm:px-6"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeSearch();
              }
            }}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Search projects"
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20 sm:rounded-3xl"
            >
              {/* ================================== */}
              {/* SEARCH INPUT */}
              {/* ================================== */}

              <div className="flex items-center gap-3 border-b border-slate-100 px-4 sm:px-5">
                <Search
                  className="shrink-0 text-slate-400"
                  size={20}
                />

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search your projects..."
                  className="h-16 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  aria-label="Search projects by project name"
                  autoComplete="off"
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ================================== */}
              {/* SEARCH RESULTS */}
              {/* ================================== */}

              <div className="px-3 pb-3 pt-4 sm:px-4">

                {/* RESULTS HEADER */}

                <div className="mb-2 flex items-center justify-between px-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Matching projects
                  </p>

                  <span className="text-xs text-slate-400">
                    {totalMatchingProjects}{" "}
                    {totalMatchingProjects === 1
                      ? "project"
                      : "projects"}
                  </span>
                </div>

                {/* RESULTS LIST */}

                <div
                  ref={resultsRef}
                  className="max-h-[min(50vh,360px)] space-y-1 overflow-y-auto"
                >
                  {hasQuery ? (
                    matchingProjects.length > 0 ? (
                      matchingProjects.map((project, index) => {
                        const projectKey = String(project.id);
                        const logoUrl = project.school_data?.logo_image;
                        const imageFailed = failedImages[projectKey];

                        const schoolName =
                          project.school_data?.school_name || "School";

                        return (
                          <button
                            key={project.id}
                            type="button"
                            data-search-result
                            data-search-index={index}
                            onMouseEnter={() => setActiveIndex(index)}
                            onClick={() =>
                              navigateToProject(project.id)
                            }
                            className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors duration-100 ${
                              activeIndex === index
                                ? "bg-blue-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            {/* SCHOOL LOGO */}

                            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                              {logoUrl && !imageFailed ? (
                                <img
                                  src={logoUrl}
                                  alt={`${schoolName} logo`}
                                  loading="lazy"
                                  onError={() =>
                                    setFailedImages((previous) => ({
                                      ...previous,
                                      [projectKey]: true,
                                    }))
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <School
                                  size={21}
                                  className="text-slate-400"
                                />
                              )}
                            </span>

                            {/* PROJECT INFORMATION */}

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-800">
                                {project.header || "Untitled Project"}
                              </span>

                              <span className="mt-1 block truncate text-xs text-slate-500">
                                {project.description ||
                                  "No project description available."}
                              </span>
                            </span>

                            {/* ARROW */}

                            <ArrowUpRight
                              size={16}
                              className={`shrink-0 transition-colors duration-100 ${
                                activeIndex === index
                                  ? "text-blue-600"
                                  : "text-slate-300 group-hover:text-blue-500"
                              }`}
                            />
                          </button>
                        );
                      })
                    ) : (
                      /* NO PROJECTS FOUND */

                      <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Search size={22} />
                        </span>

                        <p className="text-sm font-semibold text-slate-700">
                          No projects found
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          No project header matches "{query.trim()}".
                        </p>
                      </div>
                    )
                  ) : (
                    /* EMPTY SEARCH */

                    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                        <Search size={22} />
                      </span>

                      <p className="text-sm font-semibold text-slate-700">
                        Search your projects
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Start typing a project name to find it.
                      </p>
                    </div>
                  )}
                </div>

                {/* ================================== */}
                {/* SHOW ALL MATCHING PROJECTS */}
                {/* ================================== */}

                {totalMatchingProjects > 4 && (
                  <button
                    type="button"
                    onClick={showAllProjects}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-100"
                  >
                    Show all {totalMatchingProjects} projects
                    <ArrowUpRight size={16} />
                  </button>
                )}

                {/* ================================== */}
                {/* KEYBOARD INSTRUCTIONS */}
                {/* ================================== */}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 px-2 pt-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1">
                      <ArrowUp size={11} />
                    </kbd>

                    <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1">
                      <ArrowDown size={11} />
                    </kbd>

                    Navigate
                  </span>

                  <span className="flex items-center gap-1.5">
                    <kbd className="flex h-5 items-center justify-center rounded border border-slate-200 bg-white px-1.5">
                      Enter
                    </kbd>
                    Open
                  </span>

                  <span className="flex items-center gap-1.5">
                    <kbd className="flex h-5 items-center justify-center rounded border border-slate-200 bg-white px-1.5">
                      Esc
                    </kbd>
                    Close
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ==========================================
// EXPORTED HEADER
// ==========================================

export default function Header() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderContent />
    </Suspense>
  );
}

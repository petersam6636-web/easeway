
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Command,
  GraduationCap,
  LayoutDashboard,
  Search,
  Settings,
  Share2,
  Trash2,
  X,
} from "lucide-react";

type SearchItem = {
  title: string;
  description: string;
  href: string;
  keywords: string;
  icon: React.ElementType;
};

const searchItems: SearchItem[] = [
  {
    title: "Dashboard",
    description: "Your teacher workspace",
    href: "/home",
    keywords: "dashboard home overview workspace",
    icon: LayoutDashboard,
  },
  {
    title: "Share",
    description: "Manage your shared items",
    href: "/home/share",
    keywords: "share shared files images documents",
    icon: Share2,
  },
  {
    title: "Trash",
    description: "View deleted items",
    href: "/home/trash",
    keywords: "trash deleted recycle bin",
    icon: Trash2,
  },
  {
    title: "Settings",
    description: "Manage your preferences",
    href: "/home/settings",
    keywords: "settings preferences account configuration",
    icon: Settings,
  },
];

export default function Header() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);

  const filteredItems = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return searchItems;

    return searchItems.filter((item) =>
      `${item.title} ${item.description} ${item.keywords}`
        .toLowerCase()
        .includes(value)
    );
  }, [query]);

  useEffect(() => {
    setMounted(true);

    return () => {
      animationRef.current?.kill();
    };
  }, []);

  const openSearch = useCallback(() => {
    animationRef.current?.kill();
    closingRef.current = false;
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  }, []);

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

  const navigateTo = useCallback(
    (href: string) => {
      closeSearch();
      router.push(href);
    },
    [closeSearch, router]
  );

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

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
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
  }, [isOpen, openSearch, closeSearch]);

  useEffect(() => {
    setActiveIndex(0);

    if (!resultsRef.current) return;

    const results = resultsRef.current.querySelectorAll<HTMLElement>(
      "[data-search-result]"
    );

    gsap.killTweensOf(results);

    if (results.length) {
      gsap.fromTo(
        results,
        { opacity: 0, y: 2 },
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
  }, [filteredItems]);

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        filteredItems.length
          ? (current + 1) % filteredItems.length
          : 0
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        filteredItems.length
          ? (current - 1 + filteredItems.length) % filteredItems.length
          : 0
      );
    }

    if (event.key === "Enter" && filteredItems[activeIndex]) {
      event.preventDefault();
      navigateTo(filteredItems[activeIndex].href);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
    }
  };

  useEffect(() => {
    const activeResult = resultsRef.current?.querySelector<HTMLElement>(
      `[data-search-index="${activeIndex}"]`
    );

    activeResult?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [activeIndex]);

  return (
    <>
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

          <button
            type="button"
            onClick={openSearch}
            aria-label="Open search"
            className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors duration-150 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 sm:w-[280px] sm:justify-between sm:px-3 lg:w-[320px]"
          >
            <span className="flex items-center gap-2">
              <Search size={18} />

              <span className="hidden text-sm text-slate-500 sm:inline">
                Search your workspace...
              </span>
            </span>

            <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-medium text-slate-500 sm:flex">
              <Command size={11} /> K
            </span>
          </button>
        </div>
      </header>

      {mounted &&
        isOpen &&
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
              aria-label="Search workspace"
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20 sm:rounded-3xl"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 sm:px-5">
                <Search className="shrink-0 text-slate-400" size={20} />

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search pages and actions..."
                  className="h-16 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  aria-label="Search pages and actions"
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

              <div className="px-3 pb-3 pt-4 sm:px-4">
                <div className="mb-2 flex items-center justify-between px-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {query ? "Search results" : "Quick navigation"}
                  </p>

                  <span className="text-xs text-slate-400">
                    {filteredItems.length}{" "}
                    {filteredItems.length === 1 ? "result" : "results"}
                  </span>
                </div>

                <div
                  ref={resultsRef}
                  className="max-h-[min(50vh,360px)] space-y-1 overflow-y-auto"
                >
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = index === activeIndex;

                      return (
                        <button
                          key={item.href}
                          type="button"
                          data-search-result
                          data-search-index={index}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => navigateTo(item.href)}
                          className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors duration-100 ${
                            isActive
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-100 ${
                              isActive
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                            }`}
                          >
                            <Icon size={19} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-800">
                              {item.title}
                            </span>

                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {item.description}
                            </span>
                          </span>

                          <ArrowUpRight
                            size={16}
                            className={`shrink-0 transition-colors duration-100 ${
                              isActive
                                ? "text-blue-600"
                                : "text-slate-300 group-hover:text-blue-500"
                            }`}
                          />
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Search size={22} />
                      </span>

                      <p className="text-sm font-semibold text-slate-700">
                        No results found
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Try another search term.
                      </p>
                    </div>
                  )}
                </div>

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


"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
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
  icon: typeof LayoutDashboard;
};

const searchItems: SearchItem[] = [
  {
    title: "Dashboard",
    description: "Return to your workspace",
    href: "/home",
    keywords: "home overview dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Share",
    description: "Manage your shared content",
    href: "/home/share",
    keywords: "share sharing content",
    icon: Share2,
  },
  {
    title: "Trash",
    description: "Find your deleted items",
    href: "/home/trash",
    keywords: "delete deleted recycle bin",
    icon: Trash2,
  },
  {
    title: "Settings",
    description: "Manage your preferences",
    href: "/home/settings",
    keywords: "settings preferences account",
    icon: Settings,
  },
];

export default function Header() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [mounted, setMounted] = useState<boolean>(false);

  const backdropRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef<boolean>(false);

  const filteredItems = useMemo<SearchItem[]>(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return searchItems;
    }

    return searchItems.filter((item) =>
      `${item.title} ${item.description} ${item.keywords}`
        .toLowerCase()
        .includes(search)
    );
  }, [query]);

  // Only render the portal after the component mounts in the browser.
  useEffect(() => {
    setMounted(true);

    return () => {
      animationRef.current?.kill();
    };
  }, []);

  const openSearch = useCallback(() => {
    if (isOpen) return;

    closingRef.current = false;
    setQuery("");
    setActiveIndex(0);
    setIsOpen(true);
  }, [isOpen]);

  const closeSearch = useCallback(() => {
    if (!isOpen || closingRef.current) return;

    const panel = panelRef.current;
    const backdrop = backdropRef.current;

    if (!panel || !backdrop) {
      setIsOpen(false);
      return;
    }

    closingRef.current = true;
    animationRef.current?.kill();

    animationRef.current = gsap.timeline({
      defaults: { ease: "power2.in" },
      onComplete: () => {
        setIsOpen(false);
        closingRef.current = false;
        animationRef.current = null;
      },
    });

    animationRef.current
      .to(
        panel,
        {
          opacity: 0,
          y: -10,
          scale: 0.985,
          duration: 0.18,
        },
        0
      )
      .to(
        backdrop,
        {
          opacity: 0,
          duration: 0.2,
        },
        0
      );
  }, [isOpen]);

  const navigateTo = useCallback(
    (href: string) => {
      closeSearch();
      router.push(href);
    },
    [closeSearch, router]
  );

  // Animate the overlay when it opens.
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const backdrop = backdropRef.current;

    if (!panel || !backdrop) return;

    animationRef.current?.kill();

    gsap.set(backdrop, { opacity: 0 });
    gsap.set(panel, {
      opacity: 0,
      y: 16,
      scale: 0.98,
      transformOrigin: "center top",
    });

    animationRef.current = gsap.timeline({
      defaults: { ease: "power3.out" },
    });

    animationRef.current
      .to(backdrop, {
        opacity: 1,
        duration: 0.24,
      })
      .to(
        panel,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.36,
        },
        "-=0.1"
      );

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 180);

    return () => {
      window.clearTimeout(focusTimer);
      animationRef.current?.kill();
      animationRef.current = null;
    };
  }, [isOpen]);

  // Keep the active result within the filtered results.
  useEffect(() => {
    setActiveIndex((current: number) => {
      const maxIndex = filteredItems.length - 1;

      if (maxIndex < 0) return 0;
      return Math.min(current, maxIndex);
    });
  }, [filteredItems.length]);

  // Keyboard shortcuts.
  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();

        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen, openSearch, closeSearch]);

  // Animate search results when the search changes.
  useEffect(() => {
    if (!isOpen || !resultsRef.current) return;

    const results =
      resultsRef.current.querySelectorAll<HTMLElement>(
        "[data-search-result]"
      );

    gsap.killTweensOf(results);

    gsap.fromTo(
      results,
      { opacity: 0, y: 6 },
      {
        opacity: 1,
        y: 0,
        duration: 0.22,
        stagger: 0.035,
        ease: "power2.out",
        clearProps: "transform",
      }
    );

    return () => {
      gsap.killTweensOf(results);
    };
  }, [filteredItems, isOpen]);

  const handleSearchKeyDown = (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "ArrowDown" && filteredItems.length > 0) {
      event.preventDefault();

      setActiveIndex((current: number) =>
        current >= filteredItems.length - 1 ? 0 : current + 1
      );
    }

    if (event.key === "ArrowUp" && filteredItems.length > 0) {
      event.preventDefault();

      setActiveIndex((current: number) =>
        current <= 0 ? filteredItems.length - 1 : current - 1
      );
    }

    if (event.key === "Enter" && filteredItems.length > 0) {
      event.preventDefault();

      const selected = filteredItems[activeIndex];

      if (selected) {
        navigateTo(selected.href);
      }
    }
  };

  useEffect(() => {
    if (!isOpen || !resultsRef.current) return;

    const activeResult =
      resultsRef.current.querySelector<HTMLElement>(
        `[data-result-index="${activeIndex}"]`
      );

    activeResult?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex, isOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <GraduationCap size={23} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Teacher Workspace
              </h1>

              <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
                Your space to create and organize
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openSearch}
            aria-label="Open search"
            className="group flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md active:translate-y-0 active:scale-[0.98] sm:min-w-[220px] sm:justify-between sm:px-4"
          >
            <span className="flex items-center gap-2">
              <Search
                size={17}
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-sm font-medium">Search...</span>
            </span>

            <span className="hidden items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[11px] font-semibold text-slate-500 sm:inline-flex">
              <Command size={11} />
              K
            </span>
          </button>
        </div>
      </header>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={backdropRef}
            className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-slate-950/40 px-3 pb-8 pt-[12vh] backdrop-blur-[3px] sm:px-6 sm:pt-[16vh]"
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
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
                <Search
                  size={21}
                  className="shrink-0 text-blue-600"
                />

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search your workspace..."
                  aria-label="Search your workspace"
                  className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 sm:text-[15px]"
                />

                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Close search"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-90"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="px-3 pb-3 pt-4 sm:px-4">
                <div className="mb-3 flex items-center justify-between px-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {query.trim()
                      ? "Search results"
                      : "Quick navigation"}
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
                  {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeIndex === index;

                    return (
                      <button
                        key={item.href}
                        type="button"
                        data-search-result
                        data-result-index={index}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => navigateTo(item.href)}
                        className={`group flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 active:scale-[0.99] ${
                          isActive
                            ? "bg-blue-50 shadow-sm ring-1 ring-blue-100"
                            : "bg-white hover:bg-slate-50 hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                              : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700"
                          }`}
                        >
                          <Icon size={19} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm font-semibold ${
                              isActive
                                ? "text-blue-800"
                                : "text-slate-800"
                            }`}
                          >
                            {item.title}
                          </span>

                          <span className="mt-1 block truncate text-xs text-slate-500">
                            {item.description}
                          </span>
                        </span>

                        <ArrowUpRight
                          size={17}
                          className={`shrink-0 transition-all duration-200 ${
                            isActive
                              ? "text-blue-600"
                              : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500"
                          }`}
                        />
                      </button>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                        <Search size={22} />
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        No results found
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Try another keyword.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1 font-semibold shadow-sm">
                      <ArrowUp size={10} />
                    </kbd>

                    <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1 font-semibold shadow-sm">
                      <ArrowDown size={10} />
                    </kbd>

                    Navigate
                  </span>

                  <span className="flex items-center gap-1">
                    <kbd className="flex h-5 items-center justify-center rounded border border-slate-200 bg-white px-1.5 font-semibold shadow-sm">
                      Enter
                    </kbd>
                    Open
                  </span>
                </div>

                <button
                  type="button"
                  onClick={closeSearch}
                  className="cursor-pointer text-xs font-medium text-slate-500 transition-colors hover:text-blue-700"
                >
                  Esc to close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

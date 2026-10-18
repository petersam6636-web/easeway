
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";

import {
  LayoutDashboard,
  Share2,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LoaderCircle,
} from "lucide-react";

// All navigation items are defined in one array.
const navItems = [
  {
    name: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
  },
  {
    name: "Share",
    href: "/home/share",
    icon: Share2,
  },
  {
    name: "Trash",
    href: "/home/trash",
    icon: Trash2,
  },
  {
    name: "Settings",
    href: "/home/settings",
    icon: Settings,
  },
] as const;

function getUserName(user: User): string {
  const metadata = user.user_metadata ?? {};

  const value =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    user.email?.split("@")[0] ||
    "User";

  return typeof value === "string" && value.trim()
    ? value.trim()
    : "User";
}

function getAvatarUrl(user: User): string | null {
  const metadata = user.user_metadata ?? {};

  const value =
    metadata.avatar_url ||
    metadata.picture ||
    metadata.profile_image;

  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function UserAvatar({
  user,
  size = 42,
}: {
  user: User;
  size?: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const name = getUserName(user);
  const avatarUrl = getAvatarUrl(user);

  const initial =
    user.email?.trim().charAt(0).toUpperCase() ||
    name.charAt(0).toUpperCase() ||
    "U";

  useEffect(() => {
    setImageFailed(false);
  }, [user.id, avatarUrl]);

  return (
    <div
      style={{ width: size, height: size }}
      title={name}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/50 bg-gradient-to-br from-blue-500 via-blue-700 to-blue-950 text-lg font-extrabold text-white shadow-md ring-2 ring-blue-300/30"
    >
      {avatarUrl && !imageFailed ? (
        <Image
          src={avatarUrl}
          alt={`${name}'s profile`}
          width={size}
          height={size}
          unoptimized
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

export default function Slider() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  // Load the current Supabase user and listen for authentication changes.
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (!mounted) return;

        setUser(error ? null : data.user);
      } catch (error) {
        console.error("Unable to load user:", error);

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Find the current route from the shared navigation array.
  // Dashboard matches /home only, not its nested routes.
  const currentRoute = navItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== "/home" &&
        pathname.startsWith(`${item.href}/`))
  );

  const activeRouteName = currentRoute?.name ?? "";

  // Both desktop and mobile navigation use the same active-route check.
  const isActive = (name: string) => activeRouteName === name;

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    setSignOutError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setUser(null);
      setConfirmSignOut(false);

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);

      setSignOutError("Unable to sign out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  function openSignOut() {
    setSignOutError("");
    setConfirmSignOut(true);
  }

  return (
    <>
      {/* Desktop and tablet sidebar */}
      <aside
        className={`relative z-30 hidden h-screen shrink-0 flex-col overflow-visible bg-gradient-to-b from-blue-700 via-blue-800 to-blue-950 text-white shadow-xl shadow-blue-950/15 transition-[width] duration-300 ease-in-out md:flex ${
          collapsed ? "w-[82px]" : "w-[250px]"
        }`}
      >
        {/* Logo and collapse button */}
        <div
          className={`relative flex h-[82px] shrink-0 items-center border-b border-white/10 px-4 ${
            collapsed ? "justify-center" : "gap-3"
          }`}
        >
          <Link
            href="/home"
            title="Easeway"
            className="flex min-w-0 items-center gap-3"
          >
            <Image
              src="/easeway-logo.png"
              alt="Easeway logo"
              width={42}
              height={42}
              priority
              className="h-[42px] w-[42px] shrink-0 rounded-full object-contain"
            />

            {!collapsed && (
              <span className="text-xl font-extrabold tracking-tight">
                Easeway
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`absolute top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-blue-500 text-white shadow-lg transition duration-200 hover:scale-110 hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-white/70 ${
              collapsed ? "right-[-17px]" : "right-2"
            }`}
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <ChevronLeft size={17} />
            )}
          </button>
        </div>

        {/* Sidebar navigation */}
        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-2 overflow-y-auto px-3 py-6"
        >
          {!collapsed && (
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200/70">
              Workspace
            </p>
          )}

          {navItems.map(({ name, href, icon: Icon }) => {
            const active = isActive(name);

            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? name : undefined}
                aria-label={name}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-white text-blue-800 shadow-lg"
                    : "text-blue-50/85 hover:bg-white/15 hover:text-white"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 1.9}
                  className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                />

                {!collapsed && <span>{name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User profile and sign-out */}
        <div className="shrink-0 border-t border-white/10 p-3">
          {loading ? (
            <div className="flex justify-center py-3">
              <LoaderCircle
                size={22}
                className="animate-spin text-blue-200"
              />
            </div>
          ) : user ? (
            collapsed ? (
              <button
                type="button"
                onClick={openSignOut}
                title={`${getUserName(user)} — Account and sign out`}
                aria-label="Open account sign-out confirmation"
                className="group relative mx-auto flex cursor-pointer rounded-full p-1 transition-all duration-300 hover:scale-110 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/80 active:scale-95"
              >
                <span className="absolute inset-0 rounded-full bg-blue-300/30 opacity-0 blur-md transition group-hover:opacity-100" />

                <span className="relative rounded-full transition duration-300 group-hover:ring-2 group-hover:ring-blue-200 group-hover:ring-offset-2 group-hover:ring-offset-blue-900">
                  <UserAvatar user={user} size={44} />
                </span>
              </button>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} size={42} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {getUserName(user)}
                    </p>

                    <p className="truncate text-[11px] text-blue-100/75">
                      {user.email || "Signed-in user"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openSignOut}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-xs font-bold transition hover:bg-red-500/90 focus:outline-none focus:ring-2 focus:ring-white/70"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            )
          ) : (
            <Link
              href="/"
              title="Sign up"
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-blue-800 shadow-lg transition hover:bg-blue-50"
            >
              {!collapsed && "Sign up"}

              {collapsed && (
                <span className="text-base font-extrabold">+</span>
              )}
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/15 bg-blue-800 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 text-white shadow-[0_-8px_30px_rgba(30,64,175,0.2)] md:hidden"
      >
        <div className="mx-auto flex max-w-xl items-center justify-around gap-1">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = isActive(name);

            return (
              <Link
                key={href}
                href={href}
                title={name}
                aria-label={name}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all duration-200 ${
                  active
                    ? "bg-white text-blue-800 shadow-md"
                    : "text-blue-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2.5 : 1.9}
                />

                <span className="max-w-full truncate text-[10px] font-semibold">
                  {name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sign-out confirmation */}
      {confirmSignOut && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !signingOut
            ) {
              setConfirmSignOut(false);
              setSignOutError("");
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            aria-describedby="signout-description"
            className="w-full max-w-sm rounded-3xl border border-blue-100 bg-white p-6 text-slate-800 shadow-2xl"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <LogOut size={23} />
            </div>

            <h2
              id="signout-title"
              className="text-xl font-extrabold"
            >
              Sign out?
            </h2>

            <p
              id="signout-description"
              className="mt-2 text-sm leading-6 text-slate-500"
            >
              Are you sure you want to sign out of your Easeway account?
            </p>

            {signOutError && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {signOutError}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={signingOut}
                onClick={() => {
                  setConfirmSignOut(false);
                  setSignOutError("");
                }}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {signingOut && (
                  <LoaderCircle
                    size={16}
                    className="animate-spin"
                  />
                )}

                {signingOut ? "Signing out..." : "Yes, sign out"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
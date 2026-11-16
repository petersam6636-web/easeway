
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase-client";
import {
  UserRound,
  ShieldCheck,
  Bell,
  Palette,
  Globe,
  Database,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Settings,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  BriefcaseBusiness,
  Users,
  GraduationCap,
  Mail,
  Code2,
  LockKeyhole,
  Monitor,
} from "lucide-react";

type ModalType = "signout" | "developer" | null;

export default function SettingsPage() {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [userEmail, setUserEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  // Get the currently authenticated user's email.
  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!error && data.user?.email) {
        setUserEmail(data.user.email);
      }
    };

    void getUser();

    return () => {
      mounted = false;
    };
  }, []);

  // Close the modal with the Escape key.
  useEffect(() => {
    if (!activeModal) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !signingOut) {
        setActiveModal(null);
        setSignOutError("");
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [activeModal, signingOut]);

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);
    setSignOutError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setSignOutError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
      setSigningOut(false);
    }
  };

  const openSignOut = () => {
    setSignOutError("");
    setActiveModal("signout");
  };

  const closeModal = () => {
    if (signingOut) return;

    setActiveModal(null);
    setSignOutError("");
  };

  const settingGroups = [
    {
      title: "ACCOUNT",
      description: "Your personal account and information",
      items: [
        {
          icon: UserRound,
          title: "Personal information",
          description: "Manage your name and profile information",
          label: "Profile",
        },
        {
          icon: ShieldCheck,
          title: "Account security",
          description: "Your password and account protection",
          label: "Protected",
        },
      ],
    },
    {
      title: "PREFERENCES",
      description: "Make Easeway feel comfortable to use",
      items: [
        {
          icon: Bell,
          title: "Notifications",
          description: "Manage how you receive updates",
          label: "Preferences",
        },
        {
          icon: Palette,
          title: "Appearance",
          description: "Customize your workspace experience",
          label: "Display",
        },
        {
          icon: Globe,
          title: "Language and region",
          description: "Language and regional preferences",
          label: "General",
        },
      ],
    },
    {
      title: "WORKSPACE",
      description: "Information about your Easeway workspace",
      items: [
        {
          icon: Database,
          title: "Workspace data",
          description: "Information about your workspace and records",
          label: "Workspace",
        },
        {
          icon: HelpCircle,
          title: "Help and support",
          description: "Get assistance when using Easeway",
          label: "Support",
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-9 lg:py-9">
      <div className="mx-auto w-full max-w-6xl">
        {/* PAGE HEADER */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
            <Settings size={17} />
            <span>Workspace</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-500">Settings</span>
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Settings
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                Manage your account, explore your workspace preferences, and
                learn more about the people behind Easeway.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
              <Sparkles size={15} />
              Your workspace
            </div>
          </div>
        </div>

        {/* ACCOUNT PROFILE CARD */}
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 sm:p-7">
          <div className="absolute -right-12 -top-20 h-56 w-56 rounded-full bg-blue-50 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-2xl font-bold text-white shadow-lg shadow-blue-200">
              {userEmail ? userEmail.charAt(0).toUpperCase() : <UserRound size={27} />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Your account
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Easeway user
                </span>
              </div>

              <p className="break-all text-sm text-slate-500">
                {userEmail || "Your account information"}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600">
                <CheckCircle2 size={15} />
                Account workspace
              </div>
            </div>

            <div className="hidden h-14 w-px bg-slate-100 sm:block" />

            <div className="flex items-center gap-3 sm:max-w-40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <GraduationCap size={21} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Easeway</p>
                <p className="text-[11px] text-slate-500">Teacher workspace</p>
              </div>
            </div>
          </div>
        </section>

        {/* SETTINGS GROUPS */}
        <div className="space-y-7">
          {settingGroups.map((group) => (
            <section key={group.title}>
              <div className="mb-3">
                <h3 className="text-[11px] font-bold tracking-[0.16em] text-slate-500">
                  {group.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {group.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {group.items.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className={`flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5 ${
                        index !== group.items.length - 1
                          ? "border-b border-slate-100"
                          : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                        <Icon size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {item.description}
                        </p>
                      </div>

                      <span className="hidden rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-400 sm:inline-flex">
                        {item.label}
                      </span>

                      <ChevronRight
                        size={17}
                        className="shrink-0 text-slate-300"
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ABOUT AND ACCOUNT ACTIONS */}
        <section className="mt-9">
          <div className="mb-3">
            <h3 className="text-[11px] font-bold tracking-[0.16em] text-slate-500">
              ABOUT & ACCOUNT
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Learn about Easeway and manage your session
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* ABOUT DEVELOPER */}
            <button
              type="button"
              onClick={() => setActiveModal("developer")}
              className="group flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-blue-50/60 sm:gap-4 sm:px-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                <Info size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  About the developer
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Meet the person and groups behind this project
                </p>
              </div>

              <ChevronRight
                size={18}
                className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600"
              />
            </button>

            <div className="mx-5 border-t border-slate-100" />

            {/* SIGN OUT */}
            <button
              type="button"
              onClick={openSignOut}
              className="group flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-blue-50/60 sm:gap-4 sm:px-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                <LogOut size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  Sign out
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Safely sign out of your Easeway account
                </p>
              </div>

              <ChevronRight
                size={18}
                className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600"
              />
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-10 border-t border-slate-200 py-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-sm font-bold text-slate-700">
            <GraduationCap size={19} className="text-blue-700" />
            Easeway
          </div>
          <p className="text-xs text-slate-400">
            Built to make school management easier.
          </p>
          <p className="mt-2 text-[10px] text-slate-300">
            About • Account • Workspace
          </p>
        </footer>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          {/* SIGN OUT CONFIRMATION */}
          {activeModal === "signout" && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="signout-title"
              aria-describedby="signout-description"
              className="w-full max-w-md overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/20"
            >
              <div className="relative flex flex-col items-center px-6 pb-6 pt-8 text-center sm:px-8">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={signingOut}
                  aria-label="Close sign out confirmation"
                  className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                >
                  <X size={19} />
                </button>

                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-8 ring-blue-50/50">
                  <LogOut size={27} />
                </div>

                <h2
                  id="signout-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Sign out of Easeway?
                </h2>

                <p
                  id="signout-description"
                  className="mt-3 max-w-xs text-sm leading-6 text-slate-500"
                >
                  Are you sure you want to sign out of your account? You will
                  need to sign in again to access your workspace.
                </p>

                {signOutError && (
                  <div
                    role="alert"
                    className="mt-5 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-left text-xs leading-5 text-red-600"
                  >
                    {signOutError}
                  </div>
                )}

                <div className="mt-7 grid w-full grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={signingOut}
                    className="flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {signingOut ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Signing out
                      </>
                    ) : (
                      <>
                        <LogOut size={16} />
                        Yes, sign out
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-700 to-blue-950" />
            </div>
          )}

          {/* ABOUT DEVELOPER CARD */}
          {activeModal === "developer" && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="developer-title"
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/20"
            >
              {/* BLUE TOP AREA */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 px-6 pb-16 pt-7 sm:px-8">
                <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[25px] border-white/5" />
                <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-blue-500/20 blur-2xl" />

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close developer information"
                  className="absolute right-5 top-5 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <X size={19} />
                </button>

                <div className="relative">
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                    <Sparkles size={15} />
                    Behind Easeway
                  </div>

                  <h2
                    id="developer-title"
                    className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                  >
                    About the Developer
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100/80">
                    A little introduction to the person and communities behind
                    this project.
                  </p>
                </div>
              </div>

              {/* DEVELOPER DETAILS */}
              <div className="relative px-5 pb-6 sm:px-8">
                <div className="-mt-10 rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-200/60">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-800">
                      <Code2 size={27} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                        Developer
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-slate-900">
                        Solomon Arthur
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Creator of Easeway
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-sm leading-6 text-slate-600">
                      Easeway is built with the goal of making school
                      management simpler, more organized, and easier for
                      teachers to use.
                    </p>
                  </div>
                </div>

                {/* ORGANIZATIONS */}
                <div className="mt-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Work & Communities
                  </p>

                  <div className="space-y-3">
                    {/* VISION CRAFT */}
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                        <BriefcaseBusiness size={23} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          Vision Craft
                        </h4>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Working with Vision Craft.
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                        Work
                      </span>
                    </div>

                    {/* MKN */}
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-sm">
                        <Image
                          src="/business-logo.png"
                          alt="Business logo"
                          width={48}
                          height={48}
                          className="h-full w-full rounded-lg object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          MKN
                        </h4>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Part of the MKN community.
                        </p>
                      </div>

                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                        Community
                      </span>
                    </div>
                  </div>
                </div>

                {/* BOTTOM NOTE */}
                <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2 text-blue-700">
                    <GraduationCap size={20} />
                    <span className="text-sm font-bold">Easeway</span>
                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    Built with purpose, creativity, and a passion for making
                    education easier.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-5 w-full cursor-pointer rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

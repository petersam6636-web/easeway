
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
  GraduationCap,
  Code2,
  Users,
} from "lucide-react";

type ModalType = "signout" | "developer" | null;

type AccountProfile = {
  name: string;
  email: string;
  picture: string;
};

const getAccountProfile = (
  user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]
): AccountProfile => {
  const metadata = user?.user_metadata ?? {};

  const pictureCandidates = [
    metadata.picture,
    metadata.avatar_url,
    metadata.profile_image,
  ];

  const picture = pictureCandidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  );

  const nameCandidates = [
    metadata.full_name,
    metadata.name,
    metadata.display_name,
  ];

  const name = nameCandidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0
  );

  return {
    name: name || "Your account",
    email: user?.email || "",
    picture: picture || "",
  };
};

export default function SettingsPage() {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [profile, setProfile] = useState<AccountProfile>({
    name: "Your account",
    email: "",
    picture: "",
  });

  const [pictureError, setPictureError] = useState(false);
  const [mknLogoError, setMknLogoError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  // Load the authenticated user's Google profile photo and account details.
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted || error || !data.user) return;

      setProfile(getAccountProfile(data.user));
      setPictureError(false);
    };

    void loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setProfile(getAccountProfile(session.user));
        setPictureError(false);
      } else {
        setProfile({
          name: "Your account",
          email: "",
          picture: "",
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Close an open popup with Escape.
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

  const closeModal = () => {
    if (signingOut) return;

    setActiveModal(null);
    setSignOutError("");
  };

  const openSignOut = () => {
    setSignOutError("");
    setActiveModal("signout");
  };

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
      description: "Make Easeway comfortable to use",
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
          description: "Your workspace display preferences",
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
    <main className="min-h-screen bg-slate-50 px-4 py-2 sm:px-4 lg:px-6 lg:py-3">
      <div className="mx-auto w-full max-w-5xl">

        {/* PAGE HEADER */}
        <header className="mb-7">

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Settings
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Manage your account, explore your workspace preferences, and
            learn more about the people behind Easeway.
          </p>
        </header>

        {/* COMPACT CENTERED ACCOUNT CARD */}
        <section className="mx-auto mb-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">

            {/* GOOGLE PROFILE PHOTO */}
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-blue-100 bg-blue-50 sm:h-16 sm:w-16">
              {profile.picture && !pictureError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.picture}
                  alt="Your Google profile"
                  referrerPolicy="no-referrer"
                  onError={() => setPictureError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-blue-700">
                  {profile.email
                    ? profile.email.charAt(0).toUpperCase()
                    : <UserRound size={25} />}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-bold text-slate-900">
                  {profile.name}
                </h2>

                <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-blue-700">
                  Account
                </span>
              </div>

              <p className="mt-1 truncate text-xs text-slate-500">
                {profile.email || "Your Easeway account"}
              </p>

              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 size={13} />
                Easeway workspace
              </div>
            </div>

            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:flex">
              <GraduationCap size={22} />
            </div>
          </div>
        </section>

        {/* SETTINGS GROUPS - VISUAL ONLY */}
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

        {/* ABOUT & ACCOUNT */}
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

            {/* ABOUT DEVELOPER BUTTON */}
            <button
              type="button"
              onClick={() => setActiveModal("developer")}
              className="group flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-all duration-200 hover:bg-blue-50 sm:gap-4 sm:px-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-700 group-hover:text-white">
                <Info size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-700">
                  About the developer
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Meet the person and communities behind this project
                </p>
              </div>

              <ChevronRight
                size={18}
                className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-700"
              />
            </button>

            <div className="mx-5 border-t border-slate-100" />

            {/* SIGN OUT BUTTON */}
            <button
              type="button"
              onClick={openSignOut}
              className="group flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-all duration-200 hover:bg-blue-50 sm:gap-4 sm:px-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-700 group-hover:text-white">
                <LogOut size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-700">
                  Sign out
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Safely sign out of your Easeway account
                </p>
              </div>

              <ChevronRight
                size={18}
                className="shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-1 group-hover:text-blue-700"
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
        </footer>
      </div>

      {/* MODAL BACKDROP */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-5 backdrop-blur-sm"
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
              className="w-full max-w-sm overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/20"
            >
              <div className="relative flex flex-col items-center px-6 pb-6 pt-8 text-center">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={signingOut}
                  aria-label="Close confirmation"
                  className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                >
                  <X size={19} />
                </button>

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <LogOut size={26} />
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
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {signingOut ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Signing out
                      </>
                    ) : (
                      <>
                        <LogOut size={16} />
                        Sign out
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMPACT CENTERED DEVELOPER CARD */}
          {activeModal === "developer" && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="developer-title"
              className="relative my-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-950/20"
            >
              {/* BLUE HEADER */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-950 px-6 pb-9 pt-6 text-center">
                <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full border-[22px] border-white/5" />
                <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-blue-500/20 blur-2xl" />

                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close developer information"
                  className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all duration-200 hover:rotate-90 hover:bg-white/20"
                >
                  <X size={19} />
                </button>

                <div className="relative">
                  <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white">
                    <Code2 size={22} />
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">
                    Behind Easeway
                  </p>

                  <h2
                    id="developer-title"
                    className="mt-2 text-xl font-bold text-white"
                  >
                    About the Developer
                  </h2>

                  <p className="mt-1 text-xs text-blue-100/80">
                    The person and communities behind this project
                  </p>
                </div>
              </div>

              {/* DEVELOPER INFORMATION */}
              <div className="px-5 pb-5 sm:px-6">

                {/* DEVELOPER */}
                <div className="-mt-5 relative rounded-2xl border border-slate-100 bg-white p-4 shadow-md shadow-slate-200/60">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <UserRound size={24} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-600">
                        Developer
                      </p>

                      <h3 className="mt-0.5 text-lg font-bold text-slate-900">
                        Solomon Arthur
                      </h3>

                      <p className="text-xs text-slate-500">
                        Creator of Easeway
                      </p>
                    </div>
                  </div>
                </div>

                {/* WORK AND COMMUNITIES */}
                <div className="mt-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Work & Communities
                  </p>

                  <div className="space-y-3">

                    {/* VISIONCRAFT */}
                    <div className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1">
                        <Image
                          src="/business-logo.png"
                          alt="VisionCraft logo"
                          width={44}
                          height={44}
                          className="h-full w-full rounded-lg object-contain"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 transition-colors group-hover:text-blue-700">
                          VisionCraft
                        </h4>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Working name
                        </p>
                      </div>

                      <BriefcaseBusiness
                        size={17}
                        className="shrink-0 text-blue-600"
                      />
                    </div>

                    {/* MKN */}
                    <div className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:shadow-sm">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-1">
                        {!mknLogoError ? (
                          <Image
                            src="/mkn-logo.png"
                            alt="MKN logo"
                            width={44}
                            height={44}
                            className="h-full w-full rounded-lg object-contain"
                            onError={() => setMknLogoError(true)}
                          />
                        ) : (
                          <Users size={23} className="text-blue-700" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 transition-colors group-hover:text-blue-700">
                          MKN
                        </h4>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Group name
                        </p>
                      </div>

                      <Users
                        size={17}
                        className="shrink-0 text-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* SHORT FOOTER */}
                <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <GraduationCap size={18} />
                    <span className="text-sm font-bold">Easeway</span>
                  </div>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Built with purpose, creativity, and a passion for making
                    education easier.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

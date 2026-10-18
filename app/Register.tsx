
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { supabase } from "@/lib/supabase-client";

gsap.registerPlugin(useGSAP);

const illustration =
  "https://cdni.iconscout.com/illustration/premium/thumb/user-login-illustration-download-in-svg-png-gif-file-formats--password-security-protection-nallow-set-2-pack-people-illustrations-7050114.png";

export default function AuthPage() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const busy = loading || googleLoading;

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".auth-card", {
          opacity: 0,
          y: 16,
          duration: 0.5,
        })
        .from(
          ".auth-panel",
          { opacity: 0, x: -12, duration: 0.35 },
          "-=0.2"
        )
        .from(
          ".auth-illustration",
          { opacity: 0, x: 12, duration: 0.35 },
          "-=0.25"
        );
    },
    { scope: container }
  );

  function switchMode() {
    if (busy) return;

    const nextMode = mode === "login" ? "signup" : "login";
    const currentPanel = panel.current;

    setError("");
    setMessage("");

    if (!currentPanel) {
      setMode(nextMode);
      return;
    }

    gsap.to(currentPanel, {
      opacity: 0,
      x: -10,
      duration: 0.16,
      ease: "power1.in",
      onComplete: () => {
        setMode(nextMode);

        gsap.fromTo(
          currentPanel,
          { opacity: 0, x: 10 },
          {
            opacity: 1,
            x: 0,
            duration: 0.3,
            ease: "power2.out",
          }
        );
      },
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (busy) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
          },
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/home");
        } else {
          setMessage(
            "Account created! Check your email to confirm your account before signing in."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        router.replace("/home");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (busy) return;

    setError("");
    setMessage("");

    // Set immediately so the button responds to the click.
    setGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/home`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start Google sign-in."
      );

      setGoogleLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (busy) return;

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (error) throw error;

      setMessage("Check your email for password reset instructions.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to request a password reset."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      ref={container}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#64a5ed] px-3 py-4 sm:px-5"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-14 -top-14 h-36 w-36 rounded-full bg-[#438bd5]/40" />
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#438bd5]/40" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-[#438bd5]/40" />
      <div className="pointer-events-none absolute -bottom-16 right-0 h-36 w-36 rounded-full bg-[#438bd5]/40" />

      <section className="auth-card relative z-10 grid w-full max-w-[850px] overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-950/20 md:grid-cols-2">
        {/* Authentication panel */}
        <div
          ref={panel}
          className="auth-panel flex items-center justify-center bg-gradient-to-br from-[#2c7bc6] to-[#236bb4] px-5 py-6 text-white sm:px-8 sm:py-7 md:px-7 lg:px-10"
        >
          <div className="w-full max-w-[310px]">
            <header className="mb-5 text-center">
              <div className="mb-4 text-xl font-bold tracking-tight">
                ◉ LOGO
              </div>

              <h1 className="text-xl font-semibold">
                {mode === "login" ? "Sign in" : "Create account"}
              </h1>

              <p className="mt-1.5 text-xs text-blue-100">
                {mode === "login"
                  ? "Welcome back! Sign in to continue."
                  : "Create your account to get started."}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                autoComplete="email"
                placeholder="Email address"
                aria-label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={busy}
                className="h-10 w-full rounded-full border border-white/70 bg-white/5 px-4 text-sm outline-none transition placeholder:text-blue-100 focus:bg-white/10 focus:ring-2 focus:ring-white/30 disabled:opacity-60"
              />

              <input
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder="Password"
                aria-label="Password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={busy}
                className="h-10 w-full rounded-full border border-white/70 bg-white/5 px-4 text-sm outline-none transition placeholder:text-blue-100 focus:bg-white/10 focus:ring-2 focus:ring-white/30 disabled:opacity-60"
              />

              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={busy}
                    className="text-xs text-blue-100 transition hover:text-white disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex h-10 cursor-pointer w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#246db5] shadow transition hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    {mode === "login"
                      ? "Signing in..."
                      : "Creating account..."}
                  </>
                ) : mode === "login" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            {error && (
              <p
                role="alert"
                className="mt-3 break-words rounded-xl bg-red-950/20 p-2.5 text-xs text-white"
              >
                {error}
              </p>
            )}

            {message && (
              <p
                role="status"
                className="mt-3 break-words rounded-xl bg-white/10 p-2.5 text-xs text-white"
              >
                {message}
              </p>
            )}

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/30" />
              <span className="text-[10px] text-blue-100">OR</span>
              <div className="h-px flex-1 bg-white/30" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {googleLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                    className="h-5 w-5"
                  >
                    <path
                      fill="#4285F4"
                      d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 32 15l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.3-.4-3.5Z"
                    />
                    <path
                      fill="#34A853"
                      d="M6.3 14.7 12.9 19A12 12 0 0 1 32 15l5.7-5.7A20 20 0 0 0 6.3 14.7Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M24 44a20 20 0 0 0 13.7-5.4l-6.3-5.3A12 12 0 0 1 12.9 29l-6.6 5.1A20 20 0 0 0 24 44Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-3.9 5.3l6.3 5.3A20 20 0 0 0 44 24c0-1.2-.1-2.3-.4-3.5Z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <p className="mt-4 text-center text-xs text-blue-100">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                disabled={busy}
                className="font-semibold text-white underline underline-offset-4 transition hover:text-blue-200 disabled:opacity-50"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        {/* Optimized illustration: tablet and desktop only */}
        <div className="auth-illustration hidden items-center justify-center bg-white p-6 md:flex lg:p-8">
          <div className="w-full max-w-sm">
            <Image
              src={illustration}
              alt="People working with a secure login interface"
              width={480}
              height={320}
              priority
              sizes="(min-width: 768px) 40vw, 0px"
              className="mx-auto h-auto max-h-[260px] w-full object-contain"
            />

            <div className="mt-3 text-center">
              <h2 className="text-lg font-bold text-slate-800">
                Secure. Simple. Seamless.
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Your account, all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

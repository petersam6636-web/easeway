"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type RecoveryResult =
  | { ready: true }
  | { ready: false; message: string };

const invalidLinkMessage =
  "This password reset link is invalid or has expired. Request a new reset email and try again.";

export default function ResetPasswordPage() {
  const initialization = useRef<Promise<RecoveryResult> | null>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    if (!initialization.current) {
      initialization.current = initializeRecovery();
    }

    void initialization.current
      .then((result) => {
        if (!active) return;
        if (result.ready) {
          setRecoveryReady(true);
        } else {
          setError(result.message);
        }
        setChecking(false);
      })
      .catch(() => {
        if (!active) return;
        setError(invalidLinkMessage);
        setChecking(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function initializeRecovery(): Promise<RecoveryResult> {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const code = url.searchParams.get("code");
    const tokenHash =
      url.searchParams.get("token_hash") || hashParams.get("token_hash");
    const type = url.searchParams.get("type") || hashParams.get("type");

    if (type && type !== "recovery") {
      return { ready: false, message: invalidLinkMessage };
    }

    if (code) {
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError || !data.session) {
        return { ready: false, message: invalidLinkMessage };
      }

      window.history.replaceState(null, "", url.pathname);
      return { ready: true };
    }

    if (tokenHash) {
      if (type !== "recovery") {
        return { ready: false, message: invalidLinkMessage };
      }

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (verifyError || !data.session) {
        return { ready: false, message: invalidLinkMessage };
      }

      window.history.replaceState(null, "", url.pathname);
      return { ready: true };
    }

    if (type === "recovery") {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!sessionError && data.session) {
        window.history.replaceState(null, "", url.pathname);
        return { ready: true };
      }
    }

    return { ready: false, message: invalidLinkMessage };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !recoveryReady) return;

    setError("");
    setNotice("");

    if (password.length < 6) {
      setError("Your password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      let successNotice =
        "Your password has been updated. You can now sign in with your new password.";
      try {
        const { error: signOutError } = await supabase.auth.signOut({
          scope: "local",
        });
        if (signOutError) {
          successNotice =
            "Your password was updated, but this recovery session could not be signed out. Sign out before signing in again.";
        }
      } catch {
        successNotice =
          "Your password was updated, but this recovery session could not be signed out. Sign out before signing in again.";
      }

      setNotice(successNotice);
      setCompleted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to update your password. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10">
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-sky-100/80 blur-3xl" />

      <section className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70 sm:p-9">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {completed ? (
            <CheckCircle2 size={24} />
          ) : (
            <KeyRound size={24} />
          )}
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {completed ? "Password updated" : "Choose a new password"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {completed
            ? notice
            : "Create a new password for your Easeway account."}
        </p>

        {checking ? (
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-600">
            <LoaderCircle size={18} className="animate-spin text-blue-600" />
            Verifying your reset link...
          </div>
        ) : completed ? (
          <Link
            href="/"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <ArrowLeft size={17} />
            Back to sign in
          </Link>
        ) : recoveryReady ? (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Enter your new password again"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700"
              >
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <LoaderCircle size={17} className="animate-spin" />}
              {saving ? "Updating password..." : "Update password"}
            </button>
          </form>
        ) : (
          <>
            <p
              role="alert"
              className="mt-7 flex items-start gap-2 rounded-lg bg-amber-50 px-3.5 py-3 text-sm text-amber-800"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error || invalidLinkMessage}</span>
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              Back to sign in and request a new link
            </Link>
          </>
        )}

      </section>
    </main>
  );
}

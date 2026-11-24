"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    async function finishConfirmation() {
      const code = new URL(window.location.href).searchParams.get("code");

      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } finally {
        await supabase.auth.signOut({ scope: "local" });
        router.replace("/");
      }
    }

    void finishConfirmation();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#64a5ed] text-sm text-white">
      Confirming your account...
    </main>
  );
}

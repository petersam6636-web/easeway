import type { Metadata } from "next";
import Slider from "@/component/Slider";
import Header from "@/component/header/Header";

export const metadata: Metadata = {
  title: "Easeway",
  description: "Make report card ease",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-100/50 font-sans text-sm text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      <Slider />

      <main className="min-w-0 flex-1 pb-20 md:pb-0">
        <Header />

        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
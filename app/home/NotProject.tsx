
"use client";
import { useRouter } from "next/navigation";
import useApp from "@/lib/useApp";
export default function NotProject() {
  const router = useRouter();
  const { setPage } = useApp();
  const handleCreateProject = () => {
    setPage("select");
    router.push("/home/project");
  };

  return (
    <div className="flex min-h-[65vh] w-full items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          No projects yet
          
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 sm:text-base">
          You have not created any projects yet. Get started by
          creating your first project and organizing your students
          with Easeway.
        </p>

        <button
          type="button"
          onClick={handleCreateProject}
          className="mt-7 inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30 active:translate-y-0"
        >
          Create Project
        </button>
      </div>
    </div>
  );
}

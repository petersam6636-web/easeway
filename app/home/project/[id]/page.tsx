
import { Suspense } from "react";
import ProjectPageClient from "./ProjectPageClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function ProjectPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-gray-500">Loading project...</p>
        </div>
      }
    >
      <ProjectPageContent params={params} />
    </Suspense>
  );
}

async function ProjectPageContent({ params }: PageProps) {
  const { id } = await params;

  return <ProjectPageClient projectId={id} />;
}

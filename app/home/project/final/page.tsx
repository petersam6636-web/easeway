
import { Suspense } from "react";
import TerminalReportPage from "./TerminalReportPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function Page({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-gray-500">
            Loading terminal reports...
          </p>
        </div>
      }
    >
      <TerminalReportContent params={params} />
    </Suspense>
  );
}

async function TerminalReportContent({ params }: PageProps) {
  const { id } = await params;

  return <TerminalReportPage projectId={id} />;
}

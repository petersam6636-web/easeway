
import { Suspense } from "react";
import FindPage from "./FindPage";

type ShareProjectPageProps = {
    params: Promise<{ id: string }>;
};

export default function ShareProjectPage({ params }: ShareProjectPageProps) {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-sm text-gray-500">Loading shared project...</p>
                </div>
            }
        >
            <ShareProjectPageContent params={params} />
        </Suspense>
    );
}

async function ShareProjectPageContent({ params }: ShareProjectPageProps) {
    const { id } = await params;

    return <FindPage projectId={id} />;
}

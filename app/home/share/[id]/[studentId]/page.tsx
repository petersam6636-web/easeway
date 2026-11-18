import { Suspense } from "react";
import CardClient from "./CardClient.";

type CardRouteProps = {
    params: Promise<{
        id: string;
        studentId: string;
    }>;
};

export default function CardPage({ params }: CardRouteProps) {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <p className="text-sm text-gray-500">Loading student report...</p>
                </div>
            }
        >
            <CardPageContent params={params} />
        </Suspense>
    );
}

async function CardPageContent({ params }: CardRouteProps) {
    const { id, studentId } = await params;

    return (
        <CardClient
            projectId={id}
            studentId={studentId}
        />
    );
}
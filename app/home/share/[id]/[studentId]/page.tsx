
import CardClientPage from "./CardClient.";
type CardRouteProps = {
    params: Promise<{
        id: string;
    }>;

    searchParams: Promise<{
        studentId?: string;
    }>;
};

export default async function CardPage({
    params,
    searchParams,
}: CardRouteProps) {
    const { id } = await params;
    const { studentId } = await searchParams;

    return (
        <CardClientPage
            projectId={id}
            studentId={studentId ?? ""}
        />
    );
}

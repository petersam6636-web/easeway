import CardClient from "./CardClient.";
type CardRouteProps = {
    params: Promise<{
        id: string;
        studentId: string;
    }>;
};

export default async function CardPage({
    params,
}: CardRouteProps) {
    const { id, studentId } = await params;

    return (
        <CardClient
            projectId={id}
            studentId={studentId}
        />
    );
}
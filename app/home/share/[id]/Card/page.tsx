
import CardClient from "./CardClient";

type CardRouteProps = {
    params: Promise<{ id: string }>;
};

export default async function CardPage({
    params,
}: CardRouteProps) {
    const { id } = await params;

    return <CardClient projectId={id} />;
}
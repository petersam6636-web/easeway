
import FindPage from "./FindPage";

type ShareProjectPageProps = {
    params: Promise<{ id: string }>;
};

export default async function ShareProjectPage({
    params,
}: ShareProjectPageProps) {
    const { id } = await params;

    return <FindPage projectId={id} />;
}

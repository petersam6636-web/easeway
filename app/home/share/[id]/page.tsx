
import FindPage from "./FindPage";



export default async function ShareProjectPage({
    params,
}) {
    const { id } = await params;

    return <FindPage projectId={id} />;
}

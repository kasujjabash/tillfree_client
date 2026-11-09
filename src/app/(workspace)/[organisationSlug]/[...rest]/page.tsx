import { PlannedScreen } from "@/features/workspace/components/planned-screen";

export default async function CatchAllPage({ params }: PageProps<"/[organisationSlug]/[...rest]">) {
  const { rest } = await params;
  return <PlannedScreen path={rest.join("/")} />;
}

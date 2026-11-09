import { redirect } from "next/navigation";

export default async function WorkspaceIndex({ params }: PageProps<"/[organisationSlug]">) {
  const { organisationSlug } = await params;
  redirect(`/${organisationSlug}/overview`);
}

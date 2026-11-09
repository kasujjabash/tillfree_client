import { AppShell } from "@/components/layout/app-shell";
import { RequireAuth } from "@/features/authentication/require-auth";
import { WorkspaceProvider } from "@/features/workspace/workspace-provider";

export default async function WorkspaceLayout({ children, params }: LayoutProps<"/[organisationSlug]">) {
  const { organisationSlug } = await params;
  return (
    <RequireAuth>
      <WorkspaceProvider slug={organisationSlug}>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    </RequireAuth>
  );
}

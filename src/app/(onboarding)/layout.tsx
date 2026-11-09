import { CenteredLayout } from "@/components/layout/centered-layout";
import { RequireAuth } from "@/features/authentication/require-auth";

export default function OnboardingLayout({ children }: LayoutProps<"/">) {
  return (
    <RequireAuth>
      <CenteredLayout>{children}</CenteredLayout>
    </RequireAuth>
  );
}

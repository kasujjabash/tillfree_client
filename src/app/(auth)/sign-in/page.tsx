import type { Metadata } from "next";
import { Suspense } from "react";

import { RedirectIfAuthenticated } from "@/features/authentication/require-auth";
import { SignInForm } from "@/features/authentication/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <RedirectIfAuthenticated to="/select-organisation">
      <Suspense>
        <SignInForm />
      </Suspense>
    </RedirectIfAuthenticated>
  );
}

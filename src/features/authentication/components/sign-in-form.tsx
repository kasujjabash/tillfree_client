"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { isMockMode } from "@/config/env";
import { describeError, isApiError } from "@/lib/api/errors";
import { safeNextPath } from "../api";
import { useAuth } from "../auth-provider";
import { AuthPanel, FormAlert } from "./auth-panel";

const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type Values = z.infer<typeof schema>;

export function SignInForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const reason = params.get("reason");
  const next = safeNextPath(params.get("next"));

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await signIn(values);
      router.replace(next ?? "/select-organisation");
    } catch (error) {
      // Same message whether the email exists or not.
      setFormError(
        isApiError(error) && (error.code === "invalid_credentials" || error.status === 400)
          ? "Invalid email or password."
          : describeError(error),
      );
      form.setFocus("password");
    }
  }

  const submitting = form.formState.isSubmitting;

  return (
    <AuthPanel
      title="Sign in"
      description="Use the email address your organisation invited."
      footer={
        <>
          New to Unified OS? <span className="text-foreground">Ask your organisation&apos;s administrator for an invitation.</span>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-5">
          {reason === "session_expired" && (
            <FormAlert tone="info">Your session ended. Sign in again to continue where you left off.</FormAlert>
          )}
          {reason === "password_reset" && (
            <FormAlert tone="info">Your password was changed. Sign in with your new password.</FormAlert>
          )}
          {formError && <FormAlert>{formError}</FormAlert>}

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  autoFocus
                  aria-invalid={fieldState.invalid}
                  className="h-9"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link href="/forgot-password" className="text-label font-normal text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <InputGroup className="h-9">
                  <InputGroupInput
                    {...field}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" aria-hidden />}
            {submitting ? "Signing in" : "Sign in"}
          </Button>
        </FieldGroup>
      </form>

      {isMockMode && <SampleCredentials />}
    </AuthPanel>
  );
}

function SampleCredentials() {
  return (
    <div className="mt-6 rounded-lg border border-dashed px-3 py-2.5 text-meta text-muted-foreground">
      <p className="font-medium text-foreground">Sample data mode</p>
      <p className="mt-0.5">
        Sign in with <span className="font-mono text-foreground">amina@example.com</span> and{" "}
        <span className="font-mono text-foreground">demo-password</span>. No backend is contacted.
      </p>
    </div>
  );
}

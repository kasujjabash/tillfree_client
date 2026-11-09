"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { describeError } from "@/lib/api/errors";
import { requestPasswordReset } from "../api";
import { AuthPanel, FormAlert } from "./auth-panel";

const schema = z.object({ email: z.email("Enter a valid email address.") });
type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await requestPasswordReset(values);
      setSentTo(values.email);
    } catch (error) {
      setFormError(describeError(error));
    }
  }

  const back = (
    <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-foreground hover:underline">
      <ArrowLeft className="size-3.5" aria-hidden />
      Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthPanel title="Check your email" footer={back}>
        <div className="flex gap-3">
          <MailCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="text-body text-muted-foreground">
            <p>
              If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, we&apos;ve sent a
              link to reset the password. The link expires in 30 minutes.
            </p>
            <p className="mt-3">Didn&apos;t get it? Check your spam folder, or try again in a few minutes.</p>
          </div>
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      title="Reset your password"
      description="Enter the email you sign in with. We'll send you a link to choose a new password."
      footer={back}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-5">
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
                  autoComplete="email"
                  autoFocus
                  aria-invalid={fieldState.invalid}
                  className="h-9"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
            Send reset link
          </Button>
        </FieldGroup>
      </form>
    </AuthPanel>
  );
}

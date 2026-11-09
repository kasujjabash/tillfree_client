"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormAlert } from "@/features/authentication/components/auth-panel";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { describeError, isApiError } from "@/lib/api/errors";
import { useInviteMember, useRoles } from "../api";

const ALL = "__all__";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter the person's name.").max(150),
  email: z.email("Enter a valid email address."),
  role_id: z.string().min(1, "Choose a role."),
  branch: z.string().min(1, "Choose where they can work."),
  message: z.string().max(500, "Keep the message under 500 characters.").optional(),
});
type Values = z.infer<typeof schema>;

export function InviteMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[480px]">
        {/* Remount per opening: fresh form state and a fresh idempotency key. */}
        {open && <InviteForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const { organisation, branches, allBranches, activeBranch } = useWorkspace();
  const roles = useRoles();
  const invite = useInviteMember();
  const [formError, setFormError] = useState<string | null>(null);
  // One key per dialog session: a double-click or network retry can't send two invitations.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      role_id: "",
      branch: allBranches ? ALL : (activeBranch?.id ?? branches[0]?.id ?? ""),
      message: "",
    },
  });

  const roleId = useWatch({ control: form.control, name: "role_id" });
  const selectedRole = roles.data?.find((r) => r.id === roleId);

  async function onSubmit(values: Values) {
    setFormError(null);
    try {
      await invite.mutateAsync({
        idempotencyKey,
        input: {
          full_name: values.full_name,
          email: values.email,
          role_id: values.role_id,
          branch_id: values.branch === ALL ? null : values.branch,
          message: values.message || undefined,
        },
      });
      toast.success(`Invitation sent to ${values.email}`);
      onDone();
    } catch (error) {
      if (isApiError(error) && error.fieldErrors.length) {
        const fieldMap: Record<string, keyof Values> = { branch_id: "branch" };
        for (const fe of error.fieldErrors) {
          const name = (fieldMap[fe.field] ?? fe.field) as keyof Values;
          if (name in form.getValues()) form.setError(name, { message: fe.message }, { shouldFocus: true });
          else setFormError(fe.message);
        }
      } else {
        setFormError(describeError(error));
      }
    }
  }

  const submitting = form.formState.isSubmitting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <DialogHeader className="border-b px-5 py-4">
        <DialogTitle className="text-section-title">Invite to {organisation.name}</DialogTitle>
        <DialogDescription>They&apos;ll get an email to set up their account. Invitations expire after 7 days.</DialogDescription>
      </DialogHeader>

      <FieldGroup className="gap-4 px-5 py-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="full_name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="invite-name">
                  Full name <Required />
                </FieldLabel>
                <Input {...field} id="invite-name" autoComplete="off" autoFocus aria-invalid={fieldState.invalid} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="invite-email">
                  Email <Required />
                </FieldLabel>
                <Input {...field} id="invite-email" type="email" autoComplete="off" aria-invalid={fieldState.invalid} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        <Controller
          name="role_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invite-role">
                Role <Required />
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={roles.isPending}>
                <SelectTrigger id="invite-role" className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder={roles.isPending ? "Loading roles…" : "Choose a role"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.data?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && <FieldDescription>{selectedRole.description}</FieldDescription>}
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {selectedRole && selectedRole.sensitivity !== "standard" && (
          <div className="flex gap-2.5 rounded-lg border border-warning/25 bg-warning-subtle px-3 py-2.5 text-meta">
            <ShieldAlert className="mt-px size-4 shrink-0 text-warning" aria-hidden />
            <p>
              {selectedRole.sensitivity === "clinical"
                ? "This role can see patient information. The grant is recorded in the audit log and all owners are notified."
                : "This role includes sensitive permissions such as cost prices or exports. The grant is recorded in the audit log."}
            </p>
          </div>
        )}

        <Controller
          name="branch"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invite-branch">
                Branch access <Required />
              </FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="invite-branch" className="w-full" aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder="Choose a branch" />
                </SelectTrigger>
                <SelectContent>
                  {allBranches && <SelectItem value={ALL}>All branches</SelectItem>}
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>You can only grant access to branches you cover yourself.</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          name="message"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invite-message">
                Personal note <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Textarea {...field} id="invite-message" rows={2} className="min-h-16 resize-none" aria-invalid={fieldState.invalid} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <DialogFooter className="mx-0 mb-0 px-5 py-3">
        <Button type="button" variant="ghost" onClick={onDone} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" aria-hidden />}
          {submitting ? "Sending" : "Send invitation"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function Required() {
  return (
    <span className="text-destructive" aria-hidden>
      *
    </span>
  );
}

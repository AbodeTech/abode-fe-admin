"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";

import { changePasswordSchema, type ChangePasswordValues } from "../schemas/auth.schema";
import { useChangePassword } from "../hooks/use-change-password";
import { useLogout } from "../hooks/use-logout";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const fieldClass =
  "h-auto py-[1.1rem] bg-input border-none rounded-md text-sm pl-4 pr-10";

export function ChangePasswordForm() {
  const router = useRouter();
  const changePassword = useChangePassword();
  const logout = useLogout();
  const isForced = useAuthStore((state) => state.user?.must_change_password ?? false);

  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: ChangePasswordValues) {
    setError(null);

    changePassword.mutate(values, {
      // The hook stores the fresh token pair the BE issues here — every
      // session was just revoked, so the old token is already dead.
      onSuccess: () => router.push("/"),
      onError: (err) => setError(err.message || "Failed to change password."),
    });
  }

  const toggle = (name: string) =>
    setVisible((prev) => ({ ...prev, [name]: !prev[name] }));

  const fields = [
    {
      name: "currentPassword" as const,
      label: isForced ? "Temporary Password" : "Current Password",
      placeholder: isForced ? "The password you were given" : "Current password",
      autoComplete: "current-password",
    },
    {
      name: "newPassword" as const,
      label: "New Password",
      placeholder: "At least 8 characters",
      autoComplete: "new-password",
    },
    {
      name: "confirmPassword" as const,
      label: "Confirm New Password",
      placeholder: "Re-enter the new password",
      autoComplete: "new-password",
    },
  ];

  return (
    <div className="w-full max-w-94.25 mx-auto pb-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          {isForced ? "Set your password" : "Change password"}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {isForced
            ? "Your account was created with a temporary password. Choose a new one to continue — the rest of the dashboard stays locked until you do."
            : "Choose a new password. You'll stay signed in on this device and be signed out everywhere else."}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          {fields.map(({ name, label, placeholder, autoComplete }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-foreground">{label}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={visible[name] ? "text" : "password"}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        {...field}
                        className={fieldClass}
                      />
                      <button
                        type="button"
                        onClick={() => toggle(name)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-(--auth-btn-end) hover:text-(--auth-btn-start)"
                        aria-label={visible[name] ? `Hide ${label}` : `Show ${label}`}
                      >
                        {visible[name] ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <Button
            type="submit"
            className="w-full mt-4 min-h-15.25 bg-linear-to-r from-(--auth-btn-start) to-(--auth-btn-end) hover:opacity-90 text-white rounded-md font-semibold text-sm"
            disabled={changePassword.isPending}
          >
            {changePassword.isPending ? (
              <>
                Saving <Loader2 className="ml-2 h-6 w-6 animate-spin text-white" />
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </form>
      </Form>

      {/*
        The only way out while locked. The dashboard is unreachable, so the
        logout control in its header is too — and /signin redirects straight
        back here. Without this, an admin who doesn't know their temporary
        password has no route back to the login screen.
      */}
      <p className="text-center text-sm text-muted-foreground mt-8">
        <button
          type="button"
          onClick={() =>
            logout.mutate(undefined, { onSettled: () => router.push("/signin") })
          }
          disabled={logout.isPending}
          className="font-medium text-primary hover:underline disabled:opacity-60"
        >
          {logout.isPending ? "Signing out…" : "Sign out and use a different account"}
        </button>
      </p>
    </div>
  );
}

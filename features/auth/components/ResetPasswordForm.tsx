"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";

import { resetPasswordSchema, type ResetPasswordValues } from "../schemas/auth.schema";
import { useResetPassword } from "../hooks/use-password-recovery";
import { clearResetSession, useResetToken } from "../reset-session";

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

export function ResetPasswordForm() {
  const router = useRouter();
  const resetPassword = useResetPassword();

  const resetToken = useResetToken();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: ResetPasswordValues) {
    if (!resetToken) {
      setError("Reset session expired. Please request a new code.");
      return;
    }

    setError(null);

    resetPassword.mutate(
      { resetToken, values },
      {
        onSuccess: () => {
          clearResetSession();
          router.push("/signin?reset=success");
        },
        onError: (err) => setError(err.message || "Failed to reset password."),
      }
    );
  }

  // `undefined` means sessionStorage hasn't been read yet (SSR / pre-hydration).
  // Only `null` is a genuine missing token.
  if (resetToken === null) {
    return (
      <div className="w-full max-w-94.25 mx-auto pb-16">
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          Reset session not found. Please request a new code from the forgot password page.
        </div>
        <Link
          href="/forgot-password"
          className="flex items-center text-sm text-primary hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forgot Password
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-94.25 mx-auto pb-16">
      <div className="mb-6">
        <Link
          href="/signin"
          className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the code sent to your email and choose a new password.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">Verification Code</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="6-digit code from your email"
                    {...field}
                    className="h-auto py-[1.1rem] bg-input border-none rounded-md text-sm pl-4"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
                      autoComplete="new-password"
                      {...field}
                      className="h-auto py-[1.1rem] bg-input border-none rounded-md text-sm pl-4 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-(--auth-btn-end) hover:text-(--auth-btn-start)"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      {...field}
                      className="h-auto py-[1.1rem] bg-input border-none rounded-md text-sm pl-4 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-(--auth-btn-end) hover:text-(--auth-btn-start)"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full mt-4 min-h-15.25 bg-linear-to-r from-(--auth-btn-start) to-(--auth-btn-end) hover:opacity-90 text-white rounded-md font-semibold text-sm"
            disabled={resetPassword.isPending}
          >
            {resetPassword.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reset Password
          </Button>
        </form>
      </Form>
    </div>
  );
}

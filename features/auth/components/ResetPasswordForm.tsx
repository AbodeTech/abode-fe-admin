/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";

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

const RESET_AUTH_TOKEN_KEY = "adminResetAuthToken";
const RESET_EMAIL_KEY = "adminResetEmail";

async function gqlRequest<T = any>(
  query: string,
  variables: Record<string, unknown>,
  operationName: string,
  authToken?: string
): Promise<T> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ query, variables, operationName }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Network error");
  }

  const { data, errors } = await response.json();
  if (errors?.length) {
    throw new Error(errors[0]?.message || "Request failed");
  }
  return data as T;
}

const VERIFY_MUTATION = `
  mutation VerifyAdminEmail($tokenInput: TokenInput) {
    verifyAdminEmail(tokenInput: $tokenInput) {
      message
      authToken
    }
  }
`;

const UPDATE_PASSWORD_MUTATION = `
  mutation UpdateAdminPassword($passwordInput: PasswordInput!) {
    updateAdminPassword(passwordInput: $passwordInput)
  }
`;

export function ResetPasswordForm() {
  const router = useRouter();
  const [resetAuthToken, setResetAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(RESET_AUTH_TOKEN_KEY);
    setResetAuthToken(stored);
  }, []);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordValues) {
    if (!resetAuthToken) {
      setError("Reset session expired. Please request a new code.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const verifyData = await gqlRequest<{
        verifyAdminEmail: { message: string; authToken: string };
      }>(
        VERIFY_MUTATION,
        { tokenInput: { token: data.code } },
        "VerifyAdminEmail",
        resetAuthToken
      );

      const verifiedAuthToken = verifyData?.verifyAdminEmail?.authToken;
      if (!verifiedAuthToken) {
        throw new Error("Verification failed. Please try again.");
      }

      await gqlRequest(
        UPDATE_PASSWORD_MUTATION,
        { passwordInput: { password: data.password } },
        "UpdateAdminPassword",
        verifiedAuthToken
      );

      sessionStorage.removeItem(RESET_AUTH_TOKEN_KEY);
      sessionStorage.removeItem(RESET_EMAIL_KEY);
      router.push("/signin?reset=success");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  }

  if (resetAuthToken === null) {
    return (
      <div className="w-full max-w-94.25 mx-auto pb-16">
        <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          Reset session not found. Please request a new code from the forgot password page.
        </div>
        <Link href="/forgot-password" className="flex items-center text-sm text-primary hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forgot Password
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-94.25 mx-auto pb-16">
      <div className="mb-6">
        <Link href="/signin" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
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
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">Verification Code</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter the code from your email"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
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
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reset Password
          </Button>
        </form>
      </Form>
    </div>
  );
}

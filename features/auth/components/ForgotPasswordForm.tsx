/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/schemas/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
import { executeRaw } from "@/lib/graphql-client";

const RESET_AUTH_TOKEN_KEY = "adminResetAuthToken";
const RESET_EMAIL_KEY = "adminResetEmail";

async function sendAdminEmailVerification(email: string): Promise<{ authToken: string }> {
  const query = `
    mutation SendAdminEmailVerification($emailInput: EmailInput!) {
      sendAdminEmailVerification(emailInput: $emailInput) {
        success
        data {
          message
          authToken
        }
      }
    }
  `;

  const data = await executeRaw<{
    sendAdminEmailVerification?: {
      data?: { authToken?: string };
    };
  }>(query, { emailInput: { email } });

  const authToken = data?.sendAdminEmailVerification?.data?.authToken;
  if (!authToken) {
    throw new Error("No verification token returned");
  }

  return { authToken };
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordValues) {
    setIsLoading(true);
    setError(null);
    try {
      const { authToken } = await sendAdminEmailVerification(data.email);
      sessionStorage.setItem(RESET_AUTH_TOKEN_KEY, authToken);
      sessionStorage.setItem(RESET_EMAIL_KEY, data.email);
      router.push("/reset-password");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to process request.");
    } finally {
      setIsLoading(false);
    }
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
        <h2 className="text-2xl font-bold text-foreground">Forgot Password?</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your email and we&apos;ll send you a verification code.
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex. you@example.com"
                    {...field}
                    className="h-auto py-[1.1rem] bg-input border-none rounded-md text-sm pl-4"
                  />
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
            Send Code
          </Button>
        </form>
      </Form>
    </div>
  );
}

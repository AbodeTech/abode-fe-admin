"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";

import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas/auth.schema";
import { useForgotPassword } from "../hooks/use-password-recovery";
import { storeResetSession } from "../reset-session";

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

export function ForgotPasswordForm() {
  const router = useRouter();
  const forgotPassword = useForgotPassword();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordValues) {
    setError(null);

    forgotPassword.mutate(values, {
      onSuccess: (result) => {
        // The reset token authorizes redeeming the code on the next screen.
        storeResetSession(result.resetToken, values.email);
        router.push("/reset-password");
      },
      onError: (err) => setError(err.message || "Failed to process request."),
    });
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
                    autoComplete="email"
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
            disabled={forgotPassword.isPending}
          >
            {forgotPassword.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Code
          </Button>
        </form>
      </Form>
    </div>
  );
}

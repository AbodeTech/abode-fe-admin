"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordValues } from "@/lib/schemas/auth";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// UI Components
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
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // Assuming token comes in query param

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordValues) {
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement GraphQL mutation for Reset Password
      console.warn("Reset Password not implemented yet");

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to sign in on success
      router.push("/signin?reset=success");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center text-red-500">
        Invalid or missing reset token. Please request a new link.
      </div>
    )
  }

  return (
    <div className="w-full max-w-94.25 mx-auto pb-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground">Reset Password</h2>
        <p className="text-sm text-muted-foreground mt-2">Enter your new password below.</p>
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="New password"
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
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
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
            Reset Password
          </Button>
        </form>
      </Form>
    </div>
  );
}

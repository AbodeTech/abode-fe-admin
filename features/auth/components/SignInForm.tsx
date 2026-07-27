"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { signInSchema, type SignInValues } from "../schemas/auth.schema";
import { useAdminLogin } from "../hooks/use-admin-login";

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

export function SignInForm() {
  const router = useRouter();
  const login = useAdminLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: SignInValues) {
    setError(null);

    login.mutate(values, {
      onSuccess: (result) => {
        // While must_change_password is set the BE 403s every other admin
        // route, so the dashboard would render nothing but failures.
        router.push(result.admin.must_change_password ? "/change-password" : "/");
      },
      onError: (err) => {
        setError(err.message || "An unexpected error occurred.");
      },
    });
  }

  return (
    <div className="w-full max-w-94.25 mx-auto pb-4">
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-foreground">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Type Here"
                      autoComplete="current-password"
                      {...field}
                      className="h-auto py-[1.1rem] bg-input border-none rounded-md text-sm pl-4 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-(--auth-btn-end) hover:text-(--auth-btn-start)"
                    >
                      {showPassword ? (
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

          <Button
            type="submit"
            className="w-full mt-4 min-h-15.25 bg-linear-to-r from-(--auth-btn-start) to-(--auth-btn-end) hover:opacity-90 text-white rounded-md font-semibold text-sm"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <>
                Loading <Loader2 className="ml-2 h-6 w-6 animate-spin text-white" />
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center font-medium text-[0.9375rem] text-primary mt-8">
        <Link href="/forgot-password">Can&apos;t login?</Link>
      </p>
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInValues } from "@/lib/schemas/auth";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type SigninAdminResponse = {
  authToken: string;
  role?: string;
  permissions?: string[];
};

async function signinAdminClient(email: string, password: string): Promise<SigninAdminResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  const query = `
    mutation SigninAdmin($signinAdminInput: adminSigninInput!) {
      signinAdmin(signinAdminInput: $signinAdminInput) {
        authToken
        role
        permissions
      }
    }
  `;

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        signinAdminInput: { email, password },
      },
      operationName: "SigninAdmin",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Network error during login");
  }

  const { data, errors } = await response.json();
  if (errors?.length) {
    throw new Error(errors[0]?.message || "Invalid credentials");
  }

  if (!data?.signinAdmin?.authToken) {
    throw new Error("Login failed");
  }

  return data.signinAdmin;
}

export function SignInForm() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInValues) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signinAdminClient(data.email, data.password);
      const role = result.role || "admin";
      const permissions = result.permissions || [];

      Cookies.set("adminAccessToken", result.authToken, {
        expires: 1,
        sameSite: "lax",
        secure: window.location.protocol === "https:",
      });
      Cookies.set("accessToken", result.authToken, {
        expires: 1,
        sameSite: "lax",
        secure: window.location.protocol === "https:",
      });
      Cookies.set(
        "user",
        JSON.stringify({
          email: data.email,
          role,
          permissions,
        }),
        {
          expires: 1,
          sameSite: "lax",
          secure: window.location.protocol === "https:",
        }
      );
      Cookies.set("adminRole", role, {
        expires: 1,
        sameSite: "lax",
        secure: window.location.protocol === "https:",
      });

      login({
        id: "admin",
        email: data.email,
        firstName: "Admin",
        lastName: "User",
        role,
        permissions,
        authToken: result.authToken,
      });

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
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
            disabled={isLoading}
          >
            {isLoading ? (
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
        <Link href="/forgot-password">Can’t login?</Link>
      </p>
    </div>
  );
}

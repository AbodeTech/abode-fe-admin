/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { cookies } from "next/headers";
import { executeRaw } from "@/lib/graphql-client";
import { isMockApiEnabled } from "@/lib/mocks/config";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    if (!isMockApiEnabled() && !process.env.NEXT_PUBLIC_API_BASE_URL) {
      throw new Error("API_BASE_URL is not defined");
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

    const data = await executeRaw<{
      signinAdmin?: {
        authToken?: string;
        role?: string;
        permissions?: string[];
      };
    }>(query, {
      signinAdminInput: {
        email,
        password,
      },
    });

    if (!data?.signinAdmin?.authToken) {
      throw new Error("Login failed: No token returned");
    }

    const { authToken, role, permissions } = data.signinAdmin;
    const cookieStore = await cookies();


    // Also set adminAccessToken for middleware compatibility
    cookieStore.set("adminAccessToken", authToken, {
      httpOnly: false, // Accessible by client-side JavaScript
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });

    // TODO: Replace authToken with actual refreshToken from backend response
    // cookieStore.set("refreshToken", refreshToken, {
    //   httpOnly: true, // NOT accessible by client-side JavaScript
    //   secure: process.env.NODE_ENV === "production",
    //   path: "/",
    //   maxAge: 60 * 60 * 24 * 7, // 7 days
    //   sameSite: "lax",
    // });

    const userPayload = { email, role: role || "admin", permissions: permissions || [] };

    cookieStore.set("user", JSON.stringify(userPayload), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });

    cookieStore.set("adminRole", "admin", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return {
      success: true,
      user: userPayload
    };

  } catch (error: any) {
    console.log(error)
    console.error("Login Action Error:", error.message);
    return {
      error: error.message || "Invalid credentials"
    };
  }
}

export async function sendEmailVerificationAction(email: string) {
  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL is not defined");
    }

    const query = `
      mutation SendEmailVerification($emailInput: EmailInput!) {
        sendEmailVerification(emailInput: $emailInput) {
          data {
            authToken
            message
          }
        }
      }
    `;

    const variables = {
      emailInput: {
        email,
      },
    };

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || "Network error");
    }

    const { data, errors } = await response.json();

    if (errors && errors.length > 0) {
      throw new Error(errors[0].message || "GraphQL Error");
    }

    return {
      success: true,
      data: data?.sendEmailVerification?.data
    };

  } catch (error: any) {
    console.error("Send Email Verification Error:", error.message);
    return {
      error: error.message || "Failed to send verification email"
    };
  }
}

export async function verifyEmailAction(token: string) {
  if (!token) {
    return { error: "Token is required" };
  }

  try {
    const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new Error("API_BASE_URL is not defined");
    }

    const query = `
      mutation VerifyEmail($tokenInput: TokenInput) {
        verifyEmail(tokenInput: $tokenInput) {
          authToken
        }
      }
    `;

    const variables = {
      tokenInput: {
        token,
      },
    };

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || "Network error");
    }

    const { data, errors } = await response.json();
    if (errors && errors.length > 0) {
      throw new Error(errors[0].message || "GraphQL Error");
    }

    const authToken = data?.verifyEmail?.authToken;

    if (authToken) {
      const cookieStore = await cookies();

      // Access token - client-accessible
      cookieStore.set("accessToken", authToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

      cookieStore.set("adminAccessToken", authToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
      });

      cookieStore.set("adminRole", "admin", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });

      return { success: true };
    }

    return { success: false, error: "No auth token returned" };

  } catch (error: any) {
    console.error("Verify Email Error:", error.message);
    return {
      error: error.message || "Failed to verify email"
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete("accessToken");
  cookieStore.delete("adminAccessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("user");
  cookieStore.delete("adminRole");
}

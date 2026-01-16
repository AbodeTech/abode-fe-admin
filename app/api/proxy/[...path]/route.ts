// app/api/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("API_BASE_URL is not defined");
}

const getTargetUrl = (path: string[]) => {
  const pathString = path.join("/");

  if (pathString.includes("graphql")) {
    console.log("GraphQL request");
    console.log("API_BASE_URL", API_BASE_URL);
    return API_BASE_URL;
  }

  const apiRoot = API_BASE_URL.replace(/\/graphql\/?$/, "");
  return `${apiRoot}/${pathString}`;
};

function isGraphQLAuthError(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;

  const { errors } = data as {
    errors?: Array<{ message?: string; extensions?: { code?: string } }>;
  };

  if (!Array.isArray(errors)) return false;

  return errors.some(
    (err) =>
      err.extensions?.code === "UNAUTHENTICATED" ||
      err.extensions?.code === "UNAUTHORIZED" ||
      err.message?.toLowerCase().includes("unauthorized") ||
      err.message?.toLowerCase().includes("unauthenticated")
  );
}

async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("user");
}

async function handleRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  console.log("=== PROXY HIT ===");
  console.log("Path:", path);
  console.log("Full URL:", req.url);
  const targetUrl = getTargetUrl(path);
  const isGraphQL = targetUrl === API_BASE_URL;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // Build headers
  const headers = new Headers();
  headers.set("Content-Type", req.headers.get("Content-Type") || "application/json");
  headers.set("Accept", "application/json");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
    console.log("=== PROXY: Authorization Header Set ===");
    console.log("AccessToken:", accessToken);
  }

  // Get body for non-GET requests
  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    // Handle REST 401
    if (response.status === 401) {
      await clearAuthCookies();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle GraphQL responses
    if (isGraphQL) {
      const data = await response.json().catch(() => null);

      console.log("=== PROXY: Backend Response ===");
      console.log("Status:", response.status);
      console.log("Data:", JSON.stringify(data, null, 2));

      if (isGraphQLAuthError(data)) {
        await clearAuthCookies();
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      return NextResponse.json(data, { status: response.status });
    }

    // Return REST response
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
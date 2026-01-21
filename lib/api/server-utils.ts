import { cookies } from "next/headers";
import { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { print } from "graphql";

const API_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_API_BASE_URL ||
  "";

if (!API_URL) {
  console.error("API_BASE_URL is not defined");
}

export async function fetchServerGraphql<TResult, TVariables = Record<string, any>>(
  document: TypedDocumentNode<TResult, TVariables> | string,
  variables?: TVariables,
  tags: string[] = []
): Promise<TResult> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken?.value) {
    throw new Error("Unauthorized");
  }

  const query = typeof document === 'string' ? document : print(document);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken.value}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    next: { tags },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("GraphQL Error Body:", errorBody);
    throw new Error(`API Error: ${response.statusText} - ${errorBody}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data as TResult;
}

import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { print } from 'graphql';
import { apiClient } from './axios-client';

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

/**
 * Execute a GraphQL query/mutation with full type safety
 * Uses axios client with interceptors for auth handling
 */
export async function execute<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables
): Promise<TResult> {
  const { data } = await apiClient.post<GraphQLResponse<TResult>>('', {
    query: print(document),
    variables,
  });

  if (data.errors?.length) {
    throw new Error(data.errors[0].message);
  }

  return data.data;
}

/**
 * Execute a raw GraphQL query string (for cases where you don't have typed documents)
 * Prefer using execute() with typed documents when possible
 */
export async function executeRaw<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const { data } = await apiClient.post<GraphQLResponse<T>>('', {
    query,
    variables,
  });

  if (data.errors?.length) {
    throw new Error(data.errors[0].message);
  }

  return data.data;
}

// Legacy export for backward compatibility during migration
export const fetchGraphql = executeRaw;

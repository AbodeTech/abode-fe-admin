import { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { print } from 'graphql';
import { apiClient } from './axios-client';
import { isMockApiEnabled } from './mocks/config';
import { resolveMockGraphql } from './mocks/resolve';

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

/**
 * Execute a GraphQL query/mutation with full type safety
 * Uses axios client with interceptors for auth handling
 * When NEXT_PUBLIC_USE_MOCKS=true, responses come from lib/mocks instead of the network.
 */
export async function execute<TResult, TVariables>(
  document: TypedDocumentNode<TResult, TVariables>,
  variables?: TVariables
): Promise<TResult> {
  const query = print(document);

  if (isMockApiEnabled()) {
    return resolveMockGraphql<TResult>(query, variables as Record<string, unknown> | undefined);
  }

  const { data } = await apiClient.post<GraphQLResponse<TResult>>('', {
    query,
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
  if (isMockApiEnabled()) {
    return resolveMockGraphql<T>(query, variables);
  }

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

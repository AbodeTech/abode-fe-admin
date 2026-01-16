
import { GraphQLClient } from 'graphql-request';
import { useAuthStore } from '@/store/auth-store';
import { TypedDocumentNode } from '@graphql-typed-document-node/core';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL; // Fallback for server if needed, though we usually hit proxy
  return 'http://localhost:3000';
};

const PROXY_ENDPOINT = `${getBaseUrl()}/api/proxy/graphql`;

export const graphqlClient = new GraphQLClient(PROXY_ENDPOINT);

export const fetchGraphql = async <T, V extends Record<string, any> = Record<string, any>>(query: string | TypedDocumentNode<T, V>, variables?: V): Promise<T> => {
  try {
    return await (graphqlClient.request as any)(query, variables);
  } catch (error: any) {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        useAuthStore.getState().logout();
        window.location.href = '/signin';
      }
    }
    if (error.response?.errors) {
      const isUnauthorized = error.response.errors.some((e: any) =>
        e.message?.toLowerCase().includes('unauthorized') ||
        e.message?.toLowerCase().includes('authenticated')
      );
      if (isUnauthorized && typeof window !== 'undefined') {
        useAuthStore.getState().logout();
        window.location.href = '/signin';
      }
    }

    throw error;
  }
};

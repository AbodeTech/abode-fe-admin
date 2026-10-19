import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { getAccessToken, clearAuthCookies } from '@/lib/utils/cookies';
import { assertNotMutation } from '@/lib/read-only';

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL || '';

if (!API_ENDPOINT) {
  console.error('NEXT_PUBLIC_API_BASE_URL is not defined');
}

export const apiClient = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - block writes while read-only
apiClient.interceptors.request.use((config) => {
  const body = typeof config.data === 'string' ? safeJsonParse(config.data) : config.data;
  assertNotMutation(body?.query);
  return config;
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken() || useAuthStore.getState().user?.authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

// Response interceptor - handle 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isUnauthorized =
      error.response?.status === 401 ||
      error.response?.data?.errors?.some(
        (e: { message?: string; extensions?: { code?: string } }) =>
          e.extensions?.code === 'UNAUTHENTICATED' ||
          e.extensions?.code === 'UNAUTHORIZED' ||
          e.message?.toLowerCase().includes('unauthorized') ||
          e.message?.toLowerCase().includes('unauthenticated')
      );

    if (isUnauthorized && typeof window !== 'undefined') {
      clearAuthCookies();
      useAuthStore.getState().logout();
      window.location.href = '/signin';
    }

    return Promise.reject(error);
  }
);

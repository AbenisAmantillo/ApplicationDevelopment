import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { apiBaseUrl } from '../config/env';
import { getToken, clearAuthStorage } from '../auth/tokenStorage';
import { triggerUnauthorized } from '../lib/api';

export { getErrorMessage } from '../lib/api';

const PUBLIC_URL_FRAGMENTS = [
  '/api/login',
  '/api/auth/firebase',
  '/api/register',
  '/api/verify-email',
  '/api/resend-verification',
];

function isPublicRequest(url?: string): boolean {
  if (!url) return false;
  return PUBLIC_URL_FRAGMENTS.some(p => url.includes(p));
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl ?? '',
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (!isPublicRequest(config.url)) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const url = error.config?.url;
    if (error.response?.status === 401 && !isPublicRequest(url)) {
      await clearAuthStorage();
      triggerUnauthorized();
    }
    return Promise.reject(error);
  },
);

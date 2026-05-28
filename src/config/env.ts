import { Platform } from 'react-native';
import {
  API_BASE_URL as ENV_API_BASE_URL,
  NEXT_PUBLIC_API_BASE_URL,
  VITE_API_BASE_URL,
} from '@env';

const API_PORT = 8080;

/**
 * Physical phone on local Symfony: your PC Wi‑Fi IPv4 from `ipconfig`.
 * Emulator/simulator: set to `null`.
 * Ignored when an API base URL is set in `.env.local`.
 */
export const DEV_API_HOST: string | null = '192.168.5.199';

function normalizeBaseUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '');
}

function resolveDevBaseUrl(): string {
  if (DEV_API_HOST) {
    return `http://${DEV_API_HOST}:${API_PORT}`;
  }
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}`;
  }
  return `http://localhost:${API_PORT}`;
}

const fromEnv = normalizeBaseUrl(
  ENV_API_BASE_URL ?? VITE_API_BASE_URL ?? NEXT_PUBLIC_API_BASE_URL,
);

/** Symfony API origin used by the app (no trailing slash). */
export const apiBaseUrl: string | null =
  fromEnv ?? (__DEV__ ? resolveDevBaseUrl() : null);

/** @deprecated Prefer `apiBaseUrl`; empty string when unset in production. */
export const API_BASE_URL = apiBaseUrl ?? '';

export function isApiConfigured(): boolean {
  return apiBaseUrl != null && apiBaseUrl.length > 0;
}

import { apiBaseUrl, isApiConfigured } from '../config/env';
import { clearAuthStorage, getToken } from '../auth/tokenStorage';

export { apiBaseUrl, isApiConfigured };

const PUBLIC_PATHS = [
  '/api/login',
  '/api/auth/firebase',
  '/api/register',
  '/api/verify-email',
  '/api/resend-verification',
] as const;

export type ApiErrorBody = {
  message?: string;
  detail?: string;
  'hydra:description'?: string;
  success?: boolean;
  verified?: boolean;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | undefined;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

let unauthorizedHandler: (() => void) | null = null;

/** Called on 401 for protected routes — typically clears session and shows login. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function triggerUnauthorized(): void {
  unauthorizedHandler?.();
}

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(p => path.startsWith(p));
}

function joinUrl(path: string): string {
  if (!apiBaseUrl) {
    throw new ApiError(
      0,
      'API is not configured. Create `.env.local` with API_BASE_URL pointing at your Railway Symfony service (see `.env.example`).',
    );
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalized}`;
}

async function parseJsonBody(res: Response): Promise<ApiErrorBody | undefined> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return { message: text };
  }
}

function messageFromBody(body: ApiErrorBody | undefined, fallback: string): string {
  return (
    body?.message ??
    body?.detail ??
    body?.['hydra:description'] ??
    fallback
  );
}

function networkMessage(): string {
  const base = apiBaseUrl ?? '(not configured)';
  return (
    `Cannot reach the API at ${base}. ` +
    'Check that the Symfony backend is running, the phone is on the same network, ' +
    'and API_BASE_URL points to your computer LAN IP and backend port, not localhost.'
  );
}

function isLoginRequest(url?: string): boolean {
  return url?.includes('/api/login') ?? false;
}

export type ApiFetchOptions = RequestInit & {
  /** Attach Bearer token (default true except public auth routes). */
  auth?: boolean;
  /** Raw JSON body object — serialized automatically. */
  json?: unknown;
};

/**
 * Fetch wrapper: prefixes `apiBaseUrl`, JSON headers, Bearer token, `credentials: 'omit'`.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { auth, json, headers: extraHeaders, body, ...rest } = options;
  const useAuth = auth ?? !isPublicPath(path);

  const headers = new Headers(extraHeaders as Record<string, string> | undefined);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  let payload = body;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    payload = JSON.stringify(json);
  }

  if (useAuth) {
    const token = await getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let res: Response;
  try {
    res = await fetch(joinUrl(path), {
      ...rest,
      headers,
      body: payload,
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(0, networkMessage());
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await parseJsonBody(res);

  if (!res.ok) {
    const msg = messageFromBody(data, res.statusText || 'Request failed');

    if (res.status === 401 && useAuth) {
      await clearAuthStorage();
      unauthorizedHandler?.();
    }

    if (res.status === 403 && data?.verified === false) {
      throw new ApiError(403, msg, data);
    }

    throw new ApiError(res.status, msg, data);
  }

  return (data ?? {}) as T;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message;
    if (error.status === 401) {
      return error.body?.message ?? 'Session expired. Please sign in again.';
    }
    if (error.status === 403) {
      return (
        error.body?.message ??
        'Access denied. If your email is not verified, check your inbox or contact support.'
      );
    }
    if (error.status === 409) {
      return error.body?.message ?? 'Conflict — this resource already exists or was changed.';
    }
    if (error.status === 400) {
      return error.body?.message ?? 'Invalid request.';
    }
    return error.message;
  }

  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const ax = error as {
      response?: { status?: number; data?: ApiErrorBody };
      message?: string;
      code?: string;
    };
    const status = ax.response?.status;
    const body = ax.response?.data;

    if (!ax.response) {
      return networkMessage();
    }
    if (status === 401) {
      if (isLoginRequest((error as { config?: { url?: string } }).config?.url)) {
        return body?.message ?? body?.detail ?? 'Invalid username or password.';
      }
      return body?.message ?? body?.detail ?? 'Session expired. Please sign in again.';
    }
    if (status === 403) {
      return (
        body?.message ??
        body?.detail ??
        'Access denied. If your email is not verified, check your inbox or contact support.'
      );
    }
    if (status === 423) {
      return body?.message ?? body?.detail ?? 'This account is disabled or inactive.';
    }
    if (status === 409) {
      return body?.message ?? 'Conflict — this resource already exists or was changed.';
    }
    if (status === 400) {
      return body?.message ?? 'Invalid request.';
    }
    return (
      body?.message ??
      body?.detail ??
      body?.['hydra:description'] ??
      ax.message ??
      'Request failed'
    );
  }

  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

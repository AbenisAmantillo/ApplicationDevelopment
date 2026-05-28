import { fetchCurrentUser } from './me';
import { apiClient, getErrorMessage } from './client';
import type { LoginResponse, RegisterResponse, User } from '../types';
import { rolesFromToken, usernameFromToken } from '../utils/user';

export async function login(
  username: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/login', {
    username,
    password,
  });
  return data;
}

export async function loginWithFirebaseIdToken(
  idToken: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/api/auth/firebase', {
    idToken,
  });
  return data;
}

export async function register(payload: {
  username: string;
  email: string;
  password: string;
}): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/api/register', payload);
  return data;
}

export async function validateSession(): Promise<boolean> {
  try {
    await fetchCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/** Notify backend (activity log). Local session is cleared either way. */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/logout');
  } catch {
    // Still sign out locally if the route is missing or the network fails.
  }
}

type LoginActivityUser = Pick<User, 'username' | 'roles'>;

/**
 * Matches Symfony `ActivityLog` entity: username, roles, action.
 * Logout is created server-side on POST /api/logout; login must be posted here.
 */
export async function recordLoginActivity(
  user?: LoginActivityUser | null,
): Promise<void> {
  const username = user?.username?.trim();
  if (!username) {
    return;
  }

  const roles =
    Array.isArray(user?.roles) && user.roles.length > 0
      ? user.roles
      : ['ROLE_USER'];

  const payload = {
    username,
    roles,
    action: 'login',
  };

  const endpoints = [
    '/api/activity_logs',
    '/api/activity-logs',
    '/api/activitylogs',
  ];

  for (const endpoint of endpoints) {
    try {
      await apiClient.post(endpoint, payload);
      return;
    } catch {
      // Try the next path alias.
    }
  }
}

export function loginUserToUser(
  loginUser: LoginResponse['user'],
  token: string,
  fallbackUsername?: string,
): User {
  const roles = loginUser?.roles?.length ? loginUser.roles : rolesFromToken(token);
  const username =
    loginUser?.username ?? usernameFromToken(token) ?? fallbackUsername ?? 'Account';
  return {
    id: loginUser?.id,
    username,
    email: loginUser?.email ?? username,
    roles,
    verified:
      loginUser?.verified ??
      (loginUser as { isVerified?: boolean } | undefined)?.isVerified,
    status: loginUser?.status,
    isEnabled: loginUser?.isEnabled,
  };
}

function isUserVerified(user: { verified?: boolean; isVerified?: boolean }): boolean {
  return user.verified === true || user.isVerified === true;
}

export async function registerApi(payload: {
  username: string;
  email: string;
  password: string;
}): Promise<
  | { success: true; userId?: number; email: string; verified: boolean; message: string }
  | { success: false; message: string }
> {
  try {
    const data = await register(payload);
    if (!data.success) {
      return { success: false, message: data.message ?? 'Registration failed' };
    }
    const user = data.user;
    const verified = user ? isUserVerified(user) : true;
    const email = user?.email ?? payload.email;
    const defaultMessage = verified
      ? 'Account created. You can sign in with your username and password.'
      : `Account created. Check ${email} (including spam) for a verification link before signing in.`;
    return {
      success: true,
      userId: user?.id,
      email,
      verified,
      message: data.message ?? defaultMessage,
    };
  } catch (error) {
    return { success: false, message: getErrorMessage(error) };
  }
}

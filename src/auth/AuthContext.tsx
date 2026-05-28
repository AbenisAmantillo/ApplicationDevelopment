import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  login as loginApi,
  loginWithFirebaseIdToken as loginWithFirebaseIdTokenApi,
  loginUserToUser,
  logout as logoutApi,
  recordLoginActivity,
} from '../api/auth';
import { fetchCurrentUser } from '../api/me';
import {
  clearAuthStorage,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  consumePendingUserId,
} from './tokenStorage';
import type { User } from '../types';
import {
  isAdmin,
  isStaff,
  isStaffOrAdmin,
  isTokenExpired,
  primaryRole,
  userIdFromToken,
} from '../utils/user';
import { logEvent, setAnalyticsUserId } from '../utils/firebase';
import { initializePushNotifications } from '../utils/notifications';
import { getErrorMessage } from '../api/client';
import { setUnauthorizedHandler } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaffBlocked: boolean;
  role: 'admin' | 'staff' | 'client';
  isAdmin: boolean;
  isStaff: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithFirebaseIdToken: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function resolveUserWithId(
  base: User | null,
  jwt: string,
): Promise<User | null> {
  if (!base) return null;

  const idFromJwt = userIdFromToken(jwt);
  const userWithJwtId =
    base.id == null && idFromJwt != null ? { ...base, id: idFromJwt } : base;

  try {
    const me = await fetchCurrentUser();
    if (me.id != null) {
      return {
        ...userWithJwtId,
        id: me.id,
        username: me.username ?? userWithJwtId.username,
        email: me.email ?? userWithJwtId.email,
        roles: me.roles?.length ? me.roles : userWithJwtId.roles,
        verified: me.verified ?? me.isVerified ?? userWithJwtId.verified,
        profileImageFileName:
          me.profileImageFileName ?? userWithJwtId.profileImageFileName,
        status: me.status ?? userWithJwtId.status,
        isEnabled: me.isEnabled ?? userWithJwtId.isEnabled,
      };
    }
  } catch {
    // /api/me may be unavailable until the backend is updated
  }

  return userWithJwtId;
}

function assertAccountCanUseApp(user: User): void {
  if (user.isEnabled === false || user.status?.toLowerCase() === 'disabled') {
    throw new Error('This account is disabled. Contact an administrator.');
  }
  if (user.status?.toLowerCase() === 'inactive') {
    throw new Error('This account is inactive. Contact an administrator.');
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = await getToken();
      const storedUser = await getStoredUser();
      if (!storedToken) {
        setTokenState(null);
        setUserState(null);
        return;
      }

      if (isTokenExpired(storedToken)) {
        await clearAuthStorage();
        setTokenState(null);
        setUserState(null);
        return;
      }

      const baseUser = storedUser ?? loginUserToUser(undefined, storedToken);
      let resolvedUser = await resolveUserWithId(baseUser, storedToken);
      assertAccountCanUseApp(resolvedUser ?? baseUser);
      setTokenState(storedToken);
      if (resolvedUser?.id != null && storedUser?.id == null) {
        await setStoredUser(resolvedUser);
      }
      setUserState(resolvedUser);
    } catch {
      await clearAuthStorage();
      setTokenState(null);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUserState(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    void setAnalyticsUserId(user?.id ?? null);
  }, [user?.id]);

  useEffect(() => {
    if (token && user) {
      void initializePushNotifications();
    }
  }, [token, user]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginApi(username, password);
    const jwt = response.token;
    let appUser = loginUserToUser(response.user, jwt, username);
    const pendingId = await consumePendingUserId();
    if (appUser.id == null && pendingId != null) {
      appUser = { ...appUser, id: pendingId };
    }
    await setToken(jwt);
    appUser = (await resolveUserWithId(appUser, jwt)) ?? appUser;
    assertAccountCanUseApp(appUser);
    await setStoredUser(appUser);
    setTokenState(jwt);
    setUserState(appUser);
    void logEvent('user_login', { method: 'password' });
    void recordLoginActivity(appUser).catch(() => undefined);
  }, []);

  const loginWithFirebaseIdToken = useCallback(async (idToken: string) => {
    try {
      const response = await loginWithFirebaseIdTokenApi(idToken);
      const jwt = response.token;
      let appUser = loginUserToUser(response.user, jwt);
      await setToken(jwt);
      appUser = (await resolveUserWithId(appUser, jwt)) ?? appUser;
      assertAccountCanUseApp(appUser);
      await setStoredUser(appUser);
      setTokenState(jwt);
      setUserState(appUser);
      void logEvent('user_login', { method: 'google' });
      void recordLoginActivity(appUser).catch(() => undefined);
    } catch (e) {
      await clearAuthStorage();
      setTokenState(null);
      setUserState(null);
      throw new Error(getErrorMessage(e));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      await clearAuthStorage();
      setTokenState(null);
      setUserState(null);
    }
  }, []);

  const setUser = useCallback((next: User) => {
    setUserState(next);
    void setStoredUser(next);
  }, []);

  const role = useMemo(() => primaryRole(user?.roles), [user?.roles]);
  const hasAdminRole = useMemo(() => isAdmin(user?.roles), [user?.roles]);
  const hasStaffRole = useMemo(() => isStaff(user?.roles), [user?.roles]);
  const staffBlocked = useMemo(
    () => isStaffOrAdmin(user?.roles),
    [user?.roles],
  );

  const loginWithMessages = useCallback(
    async (username: string, password: string) => {
      try {
        await login(username, password);
      } catch (e) {
        await clearAuthStorage();
        setTokenState(null);
        setUserState(null);
        throw new Error(getErrorMessage(e));
      }
    },
    [login],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      isStaffBlocked: staffBlocked,
      role,
      isAdmin: hasAdminRole,
      isStaff: hasStaffRole,
      login: loginWithMessages,
      loginWithFirebaseIdToken,
      logout,
      setUser,
    }),
    [
      user,
      token,
      isLoading,
      role,
      staffBlocked,
      hasAdminRole,
      hasStaffRole,
      loginWithMessages,
      loginWithFirebaseIdToken,
      logout,
      setUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import type { User } from '../types';

const TOKEN_KEY = '@amantillo/jwt';
const USER_KEY = '@amantillo/user';
const PENDING_USER_ID_KEY = '@amantillo/pending_user_id';
const TOKEN_SERVICE = 'com.amantillo.auth.jwt';

export async function getToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: TOKEN_SERVICE,
  });
  if (credentials) {
    return credentials.password;
  }

  const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
  if (legacyToken) {
    await setToken(legacyToken);
  }
  return legacyToken;
}

export async function setToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('jwt', token, {
    service: TOKEN_SERVICE,
  });
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await Promise.all([
    Keychain.resetGenericPassword({ service: TOKEN_SERVICE }),
    AsyncStorage.removeItem(TOKEN_KEY),
  ]);
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearStoredUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.all([clearToken(), clearStoredUser(), clearPendingUserId()]);
}

export async function setPendingUserId(id: number): Promise<void> {
  await AsyncStorage.setItem(PENDING_USER_ID_KEY, String(id));
}

export async function consumePendingUserId(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(PENDING_USER_ID_KEY);
  await AsyncStorage.removeItem(PENDING_USER_ID_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export async function clearPendingUserId(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_USER_ID_KEY);
}

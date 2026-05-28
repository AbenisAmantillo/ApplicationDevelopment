import type { User } from '../types';
import { resolveId } from './hydra';

export const ADMIN_ROLE = 'ROLE_ADMIN';
export const STAFF_ROLE = 'ROLE_STAFF';

const STAFF_ROLES = [ADMIN_ROLE, STAFF_ROLE];

export function isStaffOrAdmin(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some(r => STAFF_ROLES.includes(r));
}

export function isAdmin(roles: string[] | undefined): boolean {
  return roles?.includes(ADMIN_ROLE) ?? false;
}

export function isStaff(roles: string[] | undefined): boolean {
  return roles?.includes(STAFF_ROLE) ?? false;
}

export function primaryRole(roles: string[] | undefined): 'admin' | 'staff' | 'client' {
  if (isAdmin(roles)) return 'admin';
  if (isStaff(roles)) return 'staff';
  return 'client';
}

export function isPropertyAvailable(status: string | undefined): boolean {
  return (status ?? '').toLowerCase() === 'available';
}

export function isFurnitureAvailable(status: string | undefined): boolean {
  return (status ?? '').toLowerCase() === 'available';
}

export function isCurrentUserCustomer(
  customer: User | string | undefined,
  user: User,
): boolean {
  if (!customer) return false;
  if (typeof customer === 'string') {
    if (user.id != null && customer.includes(`/users/${user.id}`)) return true;
    return customer.toLowerCase().includes(user.username.toLowerCase());
  }
  if (customer.username && customer.username === user.username) return true;
  if (user.id != null && customer.id === user.id) return true;
  const cid = resolveId(customer);
  return user.id != null && cid === user.id;
}

function decodeBase64Url(part: string): string {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const atobFn = (globalThis as { atob?: (input: string) => string }).atob;
  if (typeof atobFn === 'function') {
    return atobFn(padded);
  }
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < padded.length) {
    const enc1 = chars.indexOf(padded.charAt(i++));
    const enc2 = chars.indexOf(padded.charAt(i++));
    const enc3 = chars.indexOf(padded.charAt(i++));
    const enc4 = chars.indexOf(padded.charAt(i++));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    output += String.fromCharCode(chr1);
    if (enc3 !== 64) output += String.fromCharCode(chr2);
    if (enc4 !== 64) output += String.fromCharCode(chr3);
  }
  return output;
}

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(decodeBase64Url(part)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function userIdFromToken(token: string): number | undefined {
  const payload = parseJwtPayload(token);
  if (!payload) return undefined;
  const id = payload.id ?? payload.user_id ?? payload.sub;
  if (typeof id === 'number') return id;
  if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id);
  return undefined;
}

export function rolesFromToken(token: string): string[] {
  const payload = parseJwtPayload(token);
  if (!payload) return [];
  const rawRoles =
    payload.roles ?? payload.role ?? payload.scopes ?? payload.permissions;
  if (Array.isArray(rawRoles)) {
    return rawRoles.filter((role): role is string => typeof role === 'string');
  }
  if (typeof rawRoles === 'string') {
    return rawRoles.split(/\s+/).filter(Boolean);
  }
  return [];
}

export function usernameFromToken(token: string): string | undefined {
  const payload = parseJwtPayload(token);
  if (!payload) return undefined;
  const value =
    payload.username ??
    payload.user_identifier ??
    payload.email ??
    payload.sub;
  return typeof value === 'string' ? value : undefined;
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = parseJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 <= Date.now() + skewSeconds * 1000;
}

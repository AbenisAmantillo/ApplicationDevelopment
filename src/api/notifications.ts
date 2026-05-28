import { apiClient } from './client';
import { extractCollection } from '../utils/hydra';
import type { Notification } from '../types';

function normalizeNotification(
  raw: Notification & Record<string, unknown>,
): Notification {
  const text =
    (raw.message as string | undefined) ??
    (raw.body as string | undefined) ??
    (raw.content as string | undefined) ??
    null;
  const createdAt =
    (raw.createdAt as string | undefined) ??
    (raw.date as string | undefined) ??
    (raw.sentAt as string | undefined) ??
    null;

  return {
    id: raw.id,
    '@id': raw['@id'] as string | undefined,
    title: (raw.title as string | undefined) ?? null,
    message: text,
    createdAt,
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data } = await apiClient.get('/api/notifications');
  const raw = extractCollection<Notification & Record<string, unknown>>(data);
  return raw
    .map(normalizeNotification)
    .filter(n => n.message?.trim())
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
}

import { apiClient } from './client';
import { extractCollection, resolveId } from '../utils/hydra';
import type { Transaction, User } from '../types';

export type AdminRecord = Record<string, unknown> & {
  id?: number | string;
  '@id'?: string;
};

export type AdminClient = AdminRecord & {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  name?: string;
  profileImageFileName?: string | null;
  image?: string | null;
  avatar?: string | null;
  photo?: string | null;
  roles?: string[];
};

export type SendNotificationPayload = {
  client: AdminClient;
  title: string;
  message: string;
};

async function fetchFirstAvailable(paths: string[]): Promise<AdminRecord[]> {
  let lastError: unknown;

  for (const path of paths) {
    try {
      const { data } = await apiClient.get(path);
      const collection = extractRecords<AdminRecord>(data);
      if (collection.length || Array.isArray(data)) {
        return collection;
      }
      if (data && typeof data === 'object') {
        return [data as AdminRecord];
      }
      return [];
    } catch (e) {
      lastError = e;
    }
  }

  throw lastError;
}

export function fetchAdminNotifications(): Promise<AdminRecord[]> {
  return fetchFirstAvailable(['/api/notifications']);
}

export async function fetchClients(): Promise<AdminClient[]> {
  const clientsByKey = new Map<string, AdminClient>();
  const paths = ['/api/clients', '/api/users'];

  for (const path of paths) {
    try {
      const { data } = await apiClient.get(path);
      for (const record of extractRecords<AdminRecord>(data)) {
        addClient(clientsByKey, record as AdminClient);
      }
    } catch {
      // Try the next source; some backends expose clients only through users.
    }
  }

  try {
    const { data } = await apiClient.get('/api/transactions');
    for (const tx of extractRecords<Transaction & Record<string, unknown>>(data)) {
      const customer = tx.customer;
      if (typeof customer === 'string') {
        addClient(clientsByKey, await fetchClientDetail(customer));
      } else if (customer && typeof customer === 'object') {
        addClient(clientsByKey, customer as User & AdminClient);
      }
    }
  } catch {
    // Transactions are only a fallback source for known paying clients.
  }

  return [...clientsByKey.values()].filter(isClientAccount);
}

export async function sendClientNotification({
  client,
  title,
  message,
}: SendNotificationPayload): Promise<AdminRecord> {
  const endpoints = notificationSendEndpoints(client);
  const payloads = notificationPayloads(client, title, message);
  let lastError: unknown;

  for (const endpoint of endpoints) {
    for (const payload of payloads) {
      try {
        const { data } = await apiClient.post<AdminRecord>(endpoint, payload);
        return data;
      } catch (e) {
        lastError = e;
      }
    }
  }

  throw lastError;
}

export function fetchActivityLogs(): Promise<AdminRecord[]> {
  return fetchFirstAvailable([
    '/api/activity_logs',
    '/api/activity-logs',
    '/api/activitylogs',
  ]);
}

export function fetchDataRecords(): Promise<AdminRecord[]> {
  return fetchFirstAvailable([
    '/api/data_records',
    '/api/data-records',
    '/api/datarecords',
  ]);
}

function clientIriFromId(client: AdminClient): string {
  const id =
    typeof client.id === 'number'
      ? client.id
      : typeof client.id === 'string'
        ? resolveId(client.id)
        : client['@id']
          ? resolveId(client['@id'])
          : null;
  if (id == null) {
    throw new Error('Select a valid client before sending a notification.');
  }
  return `/api/clients/${id}`;
}

function extractRecords<T>(data: unknown): T[] {
  const collection = extractCollection<T>(data);
  if (collection.length || Array.isArray(data)) return collection;
  if (!data || typeof data !== 'object') return [];

  const obj = data as Record<string, unknown>;
  for (const key of ['data', 'items', 'users', 'clients', 'records']) {
    const value = obj[key];
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

function addClient(
  clientsByKey: Map<string, AdminClient>,
  client: AdminClient,
): void {
  const key = clientKey(client);
  if (!key || clientsByKey.has(key)) return;
  clientsByKey.set(key, client);
}

function clientKey(client: AdminClient): string {
  return String(client['@id'] ?? client.id ?? client.username ?? client.email ?? '');
}

function isClientAccount(client: AdminClient): boolean {
  const roles = Array.isArray(client.roles) ? client.roles : [];
  return !roles.includes('ROLE_ADMIN') && !roles.includes('ROLE_STAFF');
}

function clientFromIri(iri: string): AdminClient {
  const id = resolveId(iri) ?? undefined;
  return {
    '@id': iri.startsWith('/api/') ? iri : id != null ? `/api/users/${id}` : iri,
    id,
    username: id != null ? `User #${id}` : iri,
  };
}

async function fetchClientDetail(iri: string): Promise<AdminClient> {
  const fallback = clientFromIri(iri);
  const candidates = new Set<string>();
  if (iri.startsWith('/api/')) candidates.add(iri);

  const id = resolveId(iri);
  if (id != null) {
    candidates.add(`/api/users/${id}`);
    candidates.add(`/api/clients/${id}`);
  }

  for (const path of candidates) {
    try {
      const { data } = await apiClient.get<AdminClient>(path);
      return {
        ...fallback,
        ...data,
        '@id': data['@id'] ?? fallback['@id'],
        id: data.id ?? fallback.id,
      };
    } catch {
      // Keep trying alternate user/client routes.
    }
  }

  return fallback;
}

function clientIris(client: AdminClient): string[] {
  const candidates = new Set<string>();
  if (client['@id']) candidates.add(client['@id']);

  const id =
    typeof client.id === 'number'
      ? client.id
      : typeof client.id === 'string'
        ? resolveId(client.id)
        : client['@id']
          ? resolveId(client['@id'])
          : null;

  if (id != null) {
    candidates.add(`/api/users/${id}`);
    candidates.add(`/api/clients/${id}`);
  }

  if (!candidates.size) {
    candidates.add(clientIriFromId(client));
  }

  return [...candidates];
}

function clientIds(client: AdminClient): number[] {
  const ids = new Set<number>();
  if (typeof client.id === 'number') ids.add(client.id);
  if (typeof client.id === 'string') {
    const id = resolveId(client.id);
    if (id != null) ids.add(id);
  }
  if (client['@id']) {
    const id = resolveId(client['@id']);
    if (id != null) ids.add(id);
  }
  return [...ids];
}

function notificationSendEndpoints(client: AdminClient): string[] {
  const endpoints = new Set<string>([
    '/api/notifications/send',
    '/api/admin/notifications/send',
    '/api/admin/notifications',
    '/api/client-notifications',
    '/api/notifications',
  ]);

  for (const id of clientIds(client)) {
    endpoints.add(`/api/clients/${id}/notifications`);
    endpoints.add(`/api/users/${id}/notifications`);
    endpoints.add(`/api/clients/${id}/notify`);
    endpoints.add(`/api/users/${id}/notify`);
  }

  return [...endpoints];
}

function notificationPayloads(
  client: AdminClient,
  title: string,
  message: string,
): Record<string, unknown>[] {
  const payloads: Record<string, unknown>[] = [];

  for (const clientIri of clientIris(client)) {
    payloads.push(
      { title, message, client: clientIri },
      { title, message, recipient: clientIri },
      { title, message, user: clientIri },
      { title, message, customer: clientIri },
    );
  }

  for (const id of clientIds(client)) {
    payloads.push(
      { title, message, clientId: id },
      { title, message, recipientId: id },
      { title, message, userId: id },
      { title, message, customerId: id },
      { title, message, targetUserId: id },
    );
  }

  payloads.push({ title, message });

  return dedupePayloads(payloads);
}

function dedupePayloads(
  payloads: Record<string, unknown>[],
): Record<string, unknown>[] {
  const seen = new Set<string>();
  return payloads.filter(payload => {
    const key = JSON.stringify(payload);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

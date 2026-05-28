import { apiClient } from './client';
import { apiFetch } from '../lib/api';
import { extractCollection } from '../utils/hydra';
import { normalizePropertyRecord } from '../utils/resourceImages';
import type { Property } from '../types';

/** Authenticated list — used on Dashboard after login (`useClientData`). */
export async function fetchProperties(): Promise<Property[]> {
  const data = await apiFetch<unknown>('/api/properties');
  return extractCollection<Property>(data).map(property =>
    normalizePropertyRecord(property as Property & Record<string, unknown>),
  );
}

export async function fetchProperty(id: number): Promise<Property> {
  const { data } = await apiClient.get<Property>(`/api/properties/${id}`);
  return normalizePropertyRecord(data as Property & Record<string, unknown>);
}

const MERGE_PATCH = 'application/merge-patch+json';

/** Partial update — PUT would null out fields omitted from the body. */
export async function updateProperty(
  id: number,
  patch: Partial<Property>,
): Promise<Property> {
  const { data } = await apiClient.patch<Property>(
    `/api/properties/${id}`,
    patch,
    { headers: { 'Content-Type': MERGE_PATCH } },
  );
  return data;
}

import { apiClient } from './client';
import { extractCollection } from '../utils/hydra';
import { normalizeFurnitureRecord } from '../utils/resourceImages';
import type { Furniture } from '../types';

export async function fetchFurniture(): Promise<Furniture[]> {
  const { data } = await apiClient.get('/api/furniture');
  return extractCollection<Furniture>(data).map(item =>
    normalizeFurnitureRecord(item as Furniture & Record<string, unknown>),
  );
}

export async function fetchFurnitureItem(id: number): Promise<Furniture> {
  const { data } = await apiClient.get<Furniture>(`/api/furniture/${id}`);
  return normalizeFurnitureRecord(data as Furniture & Record<string, unknown>);
}

const MERGE_PATCH = 'application/merge-patch+json';

/** Partial update — PUT would null out fields omitted from the body. */
export async function updateFurniture(
  id: number,
  patch: Partial<Furniture>,
): Promise<Furniture> {
  const { data } = await apiClient.patch<Furniture>(
    `/api/furniture/${id}`,
    patch,
    { headers: { 'Content-Type': MERGE_PATCH } },
  );
  return data;
}

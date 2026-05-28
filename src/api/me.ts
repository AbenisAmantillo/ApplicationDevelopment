import { apiClient } from './client';
import type { User } from '../types';

const MERGE_PATCH = 'application/merge-patch+json';

/** Current account from JWT (database user id). */
export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/api/me');
  return data;
}

export type UpdateProfilePayload = {
  username: string;
};

/** Update username only; email cannot be changed via API. */
export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<User> {
  const { data } = await apiClient.patch<User>('/api/me', payload, {
    headers: { 'Content-Type': MERGE_PATCH },
  });
  return data;
}

/** Upload profile photo (multipart). Returns updated user. */
export async function uploadProfileImage(
  uri: string,
  fileName: string,
  mimeType: string,
): Promise<User> {
  const form = new FormData();
  form.append('file', {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const { data } = await apiClient.post<User>('/api/me/profile-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await apiClient.post('/api/me/change-password', payload);
}

import { apiClient } from './client';
import { apiFetch, ApiError, getErrorMessage } from '../lib/api';

export async function verifyEmail(token: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch('/api/verify-email', {
    auth: false,
    method: 'POST',
    json: { token },
  });
}

export async function resendVerification(): Promise<{ success: boolean; message?: string }> {
  const { data } = await apiClient.post('/api/resend-verification');
  return data;
}

/** Resend without JWT (only works if the Symfony API allows email in the body). */
export async function resendVerificationByEmail(
  email: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const data = await apiFetch<{ success?: boolean; message?: string }>(
      '/api/resend-verification',
      {
        auth: false,
        method: 'POST',
        json: { email: email.trim() },
      },
    );
    return {
      success: data.success !== false,
      message:
        data.message ??
        'If an account exists for that email, a new verification link was sent.',
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return {
        success: false,
        message:
          'Cannot resend from here until you sign in. Use the verification link from registration, or check spam.',
      };
    }
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function getVerificationStatus(): Promise<{
  verified: boolean;
  message?: string;
}> {
  const { data } = await apiClient.get('/api/verification-status');
  return data;
}

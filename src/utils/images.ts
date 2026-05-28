import { API_BASE_URL } from '../config/env';

export const IMG = {
  LOGO: {
    uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200',
  },
};

const PLACEHOLDER_PROPERTY =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80';
const PLACEHOLDER_FURNITURE =
  'https://images.unsplash.com/photo-1582582429413-6717b02f0f71?w=800&q=80';

const LOCALHOST_NAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '10.0.2.2']);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function withBackendOrigin(path: string): string | null {
  if (!API_BASE_URL) return null;
  return encodeURI(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
}

function normalizeAbsoluteUrl(value: string): string {
  if (!API_BASE_URL) return encodeURI(value);

  try {
    const url = new URL(value);
    if (LOCALHOST_NAMES.has(url.hostname)) {
      return encodeURI(`${API_BASE_URL}${url.pathname}${url.search}${url.hash}`);
    }
  } catch {
    // Fall through to the original value if URL parsing fails.
  }

  return encodeURI(value);
}

export function uploadUrl(fileName: string, folder: string): string | null {
  const trimmed = fileName.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|file:|content:)/i.test(trimmed)) {
    return normalizeAbsoluteUrl(trimmed);
  }

  const normalized = trimmed.replace(/\\/g, '/');
  const uploadMatch = normalized.match(/(?:^|\/)(uploads\/.+)$/i);
  if (uploadMatch) {
    return withBackendOrigin(`/${uploadMatch[1]}`);
  }

  if (normalized.startsWith('/')) {
    return withBackendOrigin(normalized);
  }

  const cleaned = normalized
    .replace(/^\/?uploads\//, '')
    .replace(new RegExp(`^${escapeRegExp(folder)}/`, 'i'), '');

  return withBackendOrigin(`/uploads/${folder}/${cleaned}`);
}

export function propertyImageUrl(fileName?: string | null): string {
  if (!fileName) return PLACEHOLDER_PROPERTY;
  return uploadUrl(fileName, 'property_images') ?? PLACEHOLDER_PROPERTY;
}

export function furnitureImageUrl(fileName?: string | null): string {
  if (!fileName) return PLACEHOLDER_FURNITURE;
  return uploadUrl(fileName, 'furniture') ?? PLACEHOLDER_FURNITURE;
}

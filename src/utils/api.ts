import { API_BASE_URL } from '../config/env';
import { uploadUrl } from './images';

export const BASE_URL = API_BASE_URL;

export function assetUrl(path: string): string {
    if (!path) return '';
    if (path.includes('/uploads/')) {
        return uploadUrl(path, '') ?? '';
    }
    if (/^(https?:|data:|file:|content:)/i.test(path)) {
        return uploadUrl(path, '') ?? path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return BASE_URL ? encodeURI(`${BASE_URL}${normalized}`) : normalized;
}

export function profileImageUrl(fileName?: string | null): string | null {
    if (!fileName) return null;
    return uploadUrl(fileName, 'profile_images');
}

export function propertyImageUrl(fileName?: string | null): string {
    if (!fileName) {
        return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80';
    }
    return uploadUrl(fileName, 'property_images') ?? 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80';
}

export function furnitureImageUrl(fileName?: string | null): string {
    if (!fileName) {
        return 'https://images.unsplash.com/photo-1582582429413-6717b02f0f71?w=800&q=80';
    }
    return uploadUrl(fileName, 'furniture') ?? 'https://images.unsplash.com/photo-1582582429413-6717b02f0f71?w=800&q=80';
}

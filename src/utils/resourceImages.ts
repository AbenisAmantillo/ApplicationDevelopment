import type { Furniture, Property } from '../types';

const PROPERTY_IMAGE_KEYS = [
  'imageFileName',
  'image_file_name',
  'image',
  'imageName',
  'image_name',
  'imagePath',
  'image_path',
  'thumbnail',
  'thumbnailUrl',
  'thumbnail_url',
  'photo',
  'photoFileName',
  'photo_file_name',
  'fileName',
  'file_name',
  'contentUrl',
  'content_url',
  'url',
  'path',
];

const FURNITURE_IMAGE_KEYS = [
  'image',
  'imageFileName',
  'image_file_name',
  'imageName',
  'image_name',
  'imagePath',
  'image_path',
  'thumbnail',
  'thumbnailUrl',
  'thumbnail_url',
  'photo',
  'photoFileName',
  'photo_file_name',
  'fileName',
  'file_name',
  'contentUrl',
  'content_url',
  'url',
  'path',
];

const NESTED_IMAGE_KEYS = [
  'url',
  'contentUrl',
  'content_url',
  'path',
  'filePath',
  'file_path',
  'fileName',
  'file_name',
  'name',
];

function stringField(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = stringValue(record[key]);
    if (value) return value;
  }
  return null;
}

function stringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  return stringField(value as Record<string, unknown>, NESTED_IMAGE_KEYS);
}

export function propertyImageSource(property: Property | Record<string, unknown>): string | null {
  return stringField(property as Record<string, unknown>, PROPERTY_IMAGE_KEYS);
}

export function furnitureImageSource(furniture: Furniture | Record<string, unknown>): string | null {
  return stringField(furniture as Record<string, unknown>, FURNITURE_IMAGE_KEYS);
}

export function normalizePropertyRecord(raw: Property & Record<string, unknown>): Property {
  return {
    ...raw,
    imageFileName: propertyImageSource(raw),
  };
}

export function normalizeFurnitureRecord(raw: Furniture & Record<string, unknown>): Furniture {
  return {
    ...raw,
    image: furnitureImageSource(raw),
  };
}

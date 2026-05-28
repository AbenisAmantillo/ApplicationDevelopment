export function extractCollection<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj['hydra:member'])) return obj['hydra:member'] as T[];
  if (Array.isArray(obj.member)) return obj.member as T[];
  return [];
}

export function resourceIri(
  type: 'users' | 'properties' | 'furniture' | 'transactions' | 'payments',
  id: number,
): string {
  return `/api/${type}/${id}`;
}

export function resolveId(entity: { id?: number; '@id'?: string } | string): number | null {
  if (typeof entity === 'string') {
    const match = entity.match(/\/(\d+)(?:\?.*)?$/);
    return match ? Number(match[1]) : null;
  }
  if (entity.id != null) {
    const n = Number(entity.id);
    return Number.isFinite(n) ? n : null;
  }
  if (entity['@id']) return resolveId(entity['@id']);
  return null;
}

const PAYMENT_PATH_RE = /\/api\/payments\/(\d+)/i;

/** Extract numeric payment id from API shapes (id, @id, or any IRI string field). */
export function resolvePaymentId(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const m = raw.match(PAYMENT_PATH_RE);
    return m ? Number(m[1]) : resolveId(raw);
  }
  if (typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;
  const direct = obj.id ?? obj['@id'];
  if (direct != null) {
    const fromDirect = resolveId(
      typeof direct === 'string'
        ? direct
        : (direct as { id?: number; '@id'?: string }),
    );
    if (fromDirect != null) return fromDirect;
  }

  for (const value of Object.values(obj)) {
    if (typeof value !== 'string') continue;
    const m = value.match(PAYMENT_PATH_RE);
    if (m) return Number(m[1]);
  }

  return null;
}

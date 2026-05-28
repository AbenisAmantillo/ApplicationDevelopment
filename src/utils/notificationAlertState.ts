const seenKeys = new Set<string>();

export function markNotificationSeen(key: string): void {
  seenKeys.add(key);
}

export function hasNotificationSeen(key: string): boolean {
  return seenKeys.has(key);
}

export function clearNotificationSeenKeys(): void {
  seenKeys.clear();
}

type RefreshListener = () => void;

const listeners = new Set<RefreshListener>();

/** Subscribe to global data refresh requests (e.g. push notification received). */
export function subscribeDataRefresh(listener: RefreshListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Ask all mounted data hooks to reload from the API. */
export function requestDataRefresh(): void {
  for (const listener of listeners) {
    listener();
  }
}

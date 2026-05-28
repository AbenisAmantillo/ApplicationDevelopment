import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { DATA_POLL_INTERVAL_MS } from '../config/dataRefresh';
import { subscribeDataRefresh } from '../utils/dataRefresh';

type Options = {
  enabled?: boolean;
  intervalMs?: number;
};

/**
 * Periodically calls `refresh`, re-runs when the app returns to the foreground,
 * and reacts to {@link requestDataRefresh} (e.g. after a push notification).
 */
export function useAutoRefresh(
  refresh: () => void | Promise<void>,
  { enabled = true, intervalMs = DATA_POLL_INTERVAL_MS }: Options = {},
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const run = () => {
      if (!cancelled) {
        void refresh();
      }
    };

    const intervalId = setInterval(run, intervalMs);

    const appStateSub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          run();
        }
      },
    );

    const unsubscribePush = subscribeDataRefresh(run);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      appStateSub.remove();
      unsubscribePush();
    };
  }, [enabled, intervalMs, refresh]);
}

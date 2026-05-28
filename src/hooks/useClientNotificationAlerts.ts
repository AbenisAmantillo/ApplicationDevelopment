import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { fetchNotifications } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';
import type { Notification } from '../types';
import {
  clearNotificationSeenKeys,
  hasNotificationSeen,
  markNotificationSeen,
} from '../utils/notificationAlertState';
import { requestDataRefresh } from '../utils/dataRefresh';
import { showLocalNotification } from '../utils/notifications';

const POLL_INTERVAL_MS = 3_000;

function notificationKey(notification: Notification): string {
  if (notification.id != null) {
    return String(notification.id);
  }
  if (notification['@id']) {
    return notification['@id'];
  }
  return `${notification.createdAt ?? ''}|${notification.message ?? ''}`;
}

/**
 * Polls /api/notifications for logged-in clients and shows a local phone
 * notification when the admin (or backend) creates a new notification record.
 */
export function useClientNotificationAlerts(): void {
  const { isAuthenticated, role, isStaffBlocked } = useAuth();
  const baselineReady = useRef(false);

  useEffect(() => {
    const enabled =
      isAuthenticated && role === 'client' && !isStaffBlocked;

    if (!enabled) {
      clearNotificationSeenKeys();
      baselineReady.current = false;
      return;
    }

    let cancelled = false;

    const poll = async () => {
      try {
        const list = await fetchNotifications();
        if (cancelled) {
          return;
        }

        if (!baselineReady.current) {
          for (const item of list) {
            markNotificationSeen(notificationKey(item));
          }
          baselineReady.current = true;
          return;
        }

        for (const item of list) {
          const key = notificationKey(item);
          if (hasNotificationSeen(key)) {
            continue;
          }
          markNotificationSeen(key);

          const body = item.message?.trim();
          if (!body) {
            continue;
          }

          const title = item.title?.trim() || 'Amantillo notification';
          await showLocalNotification(title, body);
          requestDataRefresh();
        }
      } catch {
        // Notifications API may be unavailable; skip this poll.
      }
    };

    void poll();

    const intervalId = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    const appStateSub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          void poll();
        }
      },
    );

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      appStateSub.remove();
      clearNotificationSeenKeys();
      baselineReady.current = false;
    };
  }, [isAuthenticated, role, isStaffBlocked]);
}

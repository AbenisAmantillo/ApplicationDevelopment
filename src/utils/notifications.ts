import { PermissionsAndroid, Platform } from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import axios from 'axios';

import { apiClient } from '../api/client';
import { markNotificationSeen } from './notificationAlertState';

export const PUSH_CHANNEL_ID = 'amantillo_notifications_sound_v2';

let initialized = false;
let foregroundUnsubscribe: (() => void) | null = null;
let tokenRefreshUnsubscribe: (() => void) | null = null;

async function requestAndroidPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function requestMessagingPermission(): Promise<boolean> {
  const androidAllowed = await requestAndroidPermission();
  if (!androidAllowed) {
    return false;
  }

  if (Platform.OS !== 'ios') {
    return true;
  }

  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

async function syncDeviceToken(token: string): Promise<void> {
  try {
    await apiClient.post('/api/me/device-token', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const status = e.response?.status;
      if (status === 404 || status === 405) {
        return;
      }
    }
  }
}

function showForegroundNotification(
  message: FirebaseMessagingTypes.RemoteMessage,
): void {
  const title =
    (typeof message.data?.title === 'string' && message.data.title) ||
    message.notification?.title ||
    'Amantillo notification';
  const body =
    message.notification?.body ??
    (typeof message.data?.message === 'string' ? message.data.message : null);

  if (body) {
    const id =
      message.data?.notification_id ??
      message.data?.notificationId ??
      message.data?.id;
    if (typeof id === 'string' || typeof id === 'number') {
      markNotificationSeen(String(id));
    }
    void showLocalNotification(title, body).catch(() => undefined);
  }
}

export async function showLocalNotification(
  title: string,
  body: string,
): Promise<void> {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: PUSH_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    },
  });
}

export async function initializePushNotifications(): Promise<void> {
  if (initialized) {
    return;
  }

  initialized = true;

  try {
    const allowed = await requestMessagingPermission();
    if (!allowed) {
      return;
    }

    await messaging().registerDeviceForRemoteMessages();

    const token = await messaging().getToken();
    if (token) {
      await syncDeviceToken(token);
    }

    tokenRefreshUnsubscribe = messaging().onTokenRefresh(nextToken => {
      syncDeviceToken(nextToken).catch(() => undefined);
    });

    foregroundUnsubscribe = messaging().onMessage(message => {
      showForegroundNotification(message);
      return Promise.resolve();
    });
  } catch {
    initialized = false;
  }
}

export async function showLocalTransactionSuccessNotification(): Promise<void> {
  await showLocalNotification(
    'Transaction successful',
    'Your transaction has been created.',
  );
}

export function resetPushNotificationListeners(): void {
  foregroundUnsubscribe?.();
  tokenRefreshUnsubscribe?.();
  foregroundUnsubscribe = null;
  tokenRefreshUnsubscribe = null;
  initialized = false;
}

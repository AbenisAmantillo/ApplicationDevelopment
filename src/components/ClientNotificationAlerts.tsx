import { useClientNotificationAlerts } from '../hooks/useClientNotificationAlerts';

/** Mount while the client session is active; renders nothing. */
export function ClientNotificationAlerts() {
  useClientNotificationAlerts();
  return null;
}

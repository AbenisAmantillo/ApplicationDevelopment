import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { AdminClient, AdminRecord } from '../api/admin';
import {
  fetchActivityLogs,
  fetchAdminNotifications,
  fetchClients,
  fetchDataRecords,
  sendClientNotification,
} from '../api/admin';
import { getErrorMessage } from '../api/client';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
import { ErrorBanner } from '../components/ErrorBanner';
import { EstateEmpty, EstateHero, SectionHeader } from '../components/estate';
import { LoadingView } from '../components/LoadingView';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { estate, estateStyles } from '../theme/estate';
import { ROUTES } from '../utils';
import { assetUrl, profileImageUrl } from '../utils/api';

type ResourceConfig = {
  route: string;
  greeting: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyMessage: string;
  load: () => Promise<AdminRecord[]>;
};

const CONFIGS = {
  notifications: {
    route: ROUTES.ADMIN_NOTIFICATIONS,
    greeting: 'Notifications',
    title: 'Admin notifications',
    subtitle: 'Records returned by /api/notifications for the admin role.',
    emptyTitle: 'No notifications',
    emptyMessage: 'Notification records will appear here when the backend returns them.',
    load: fetchAdminNotifications,
  },
  activityLogs: {
    route: ROUTES.ACTIVITY_LOGS,
    greeting: 'Activity logs',
    title: 'Activity logs',
    subtitle: 'Admin audit records returned by the backend.',
    emptyTitle: 'No activity logs',
    emptyMessage: 'Activity log records will appear here when the backend route is available.',
    load: fetchActivityLogs,
  },
  dataRecords: {
    route: ROUTES.DATA_RECORDS,
    greeting: 'Data records',
    title: 'Data records',
    subtitle: 'Admin data records returned by the backend.',
    emptyTitle: 'No data records',
    emptyMessage: 'Data records will appear here when the backend route is available.',
    load: fetchDataRecords,
  },
} satisfies Record<string, ResourceConfig>;

type Props = {
  resource: keyof typeof CONFIGS;
};

export default function AdminResourceScreen({ resource }: Props) {
  const config = CONFIGS[resource];
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('Payment reminder');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const isNotifications = resource === 'notifications';

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setError('');
    try {
      setRecords(await config.load());
    } catch (e) {
      setError(getErrorMessage(e));
      setRecords([]);
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [config]);

  const silentRefresh = useCallback(() => {
    void load({ silent: true });
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const skipNextFocusRefresh = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRefresh.current) {
        skipNextFocusRefresh.current = false;
        return;
      }
      void silentRefresh();
    }, [silentRefresh]),
  );

  useAutoRefresh(silentRefresh);

  const loadClients = useCallback(async () => {
    if (!isNotifications) return;
    setClientsLoading(true);
    try {
      const list = await fetchClients();
      setClients(list);
      setSelectedClientId(current => current || clientKey(list[0]));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setClientsLoading(false);
    }
  }, [isNotifications]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const selectedClient = useMemo(
    () => clients.find(client => clientKey(client) === selectedClientId),
    [clients, selectedClientId],
  );

  const handleSendNotification = async () => {
    const title = notificationTitle.trim();
    const message = notificationMessage.trim();
    if (!selectedClient) {
      setError('Select a client before sending a notification.');
      return;
    }
    if (!message) {
      setError('Enter a notification message.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await sendClientNotification({
        client: selectedClient,
        title: title || 'Amantillo notification',
        message,
      });
      setNotificationTitle('Payment reminder');
      setNotificationMessage('');
      await load();
      Alert.alert('Notification sent', `Sent to ${clientLabel(selectedClient)}.`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (loading && records.length === 0) return <LoadingView />;

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={config.route}
        greeting={config.greeting}
        subtitle="Admin"
        tone="estate"
      />

      <ScrollView
        style={estateStyles.flex}
        contentContainerStyle={estateStyles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={estate.gold}
            colors={[estate.navy]}
          />
        }
      >
        <ErrorBanner message={error} />
        <EstateHero
          eyebrow={estate.brandEyebrow}
          title={config.title}
          subtitle={config.subtitle}
        />

        {isNotifications ? (
          <View style={estateStyles.card}>
            <Text style={estateStyles.cardTitle}>Send notification to client</Text>
            <Text style={estateStyles.cardMeta}>
              Select a client and write the notification message.
            </Text>

            <Text style={styles.label}>Client</Text>
            {clientsLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={estate.navy} />
                <Text style={styles.loadingText}>Loading clients...</Text>
              </View>
            ) : clients.length === 0 ? (
              <Text style={styles.emptyInline}>
                No clients found from /api/clients, /api/users, or transaction customers.
              </Text>
            ) : (
              <View style={styles.clientList}>
                {clients.map(client => {
                  const key = clientKey(client);
                  const selected = key === selectedClientId;
                  return (
                    <Pressable
                      key={key}
                      style={[styles.clientChip, selected && styles.clientChipActive]}
                      onPress={() => setSelectedClientId(key)}
                    >
                      <ClientAvatar client={client} selected={selected} />
                      <Text
                        style={[
                          styles.clientChipText,
                          selected && styles.clientChipTextActive,
                        ]}
                      >
                        {clientLabel(client)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={notificationTitle}
              onChangeText={setNotificationTitle}
              placeholder="Optional title"
              placeholderTextColor={estate.sub}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              placeholder="Example: Your payment is due. Please settle your balance."
              placeholderTextColor={estate.sub}
              multiline
            />

            <Pressable
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              disabled={sending}
              onPress={handleSendNotification}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send notification</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        <SectionHeader
          title="Records"
          subtitle={`${records.length} backend records`}
        />
        {records.length === 0 ? (
          <EstateEmpty
            icon="A"
            title={config.emptyTitle}
            message={config.emptyMessage}
          />
        ) : (
          records.map((record, index) => (
            <View key={recordKey(record, index)} style={estateStyles.card}>
              <Text style={estateStyles.cardTitle}>
                {recordTitle(record, index)}
              </Text>
              {recordSubtitle(record) ? (
                <Text style={estateStyles.cardMeta}>
                  {recordSubtitle(record)}
                </Text>
              ) : null}
              <Text style={styles.preview} numberOfLines={4}>
                {recordPreview(record)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export function AdminNotificationsScreen() {
  return <AdminResourceScreen resource="notifications" />;
}

export function ActivityLogsScreen() {
  return <AdminResourceScreen resource="activityLogs" />;
}

export function DataRecordsScreen() {
  return <AdminResourceScreen resource="dataRecords" />;
}

function recordKey(record: AdminRecord, index: number): string {
  return String(record.id ?? record['@id'] ?? index);
}

function recordTitle(record: AdminRecord, index: number): string {
  const action = record.action ?? record.type ?? record.event;
  if (typeof action === 'string' && action.trim()) {
    const normalized = action.trim().toLowerCase();
    if (normalized === 'login' || normalized === 'user_login') {
      return 'User login';
    }
    if (normalized === 'logout' || normalized === 'user_logout') {
      return 'User logout';
    }
    return action.trim();
  }

  const title = record.title ?? record.name;
  return typeof title === 'string' && title.trim()
    ? title
    : `Record #${record.id ?? index + 1}`;
}

function recordSubtitle(record: AdminRecord): string {
  const value =
    record.createdAt ??
    record.created_at ??
    record.date ??
    record.updatedAt ??
    record.updated_at;
  return typeof value === 'string' ? value : '';
}

function recordPreview(record: AdminRecord): string {
  const username =
    typeof record.username === 'string' ? record.username.trim() : '';
  const action =
    typeof record.action === 'string' ? record.action.trim() : '';
  const roles = Array.isArray(record.roles)
    ? record.roles.filter((r): r is string => typeof r === 'string')
    : [];

  if (username || action) {
    const parts = [username, action ? `action: ${action}` : ''].filter(Boolean);
    if (roles.length) {
      parts.push(`roles: ${roles.join(', ')}`);
    }
    return parts.join(' · ');
  }

  const message =
    record.message ??
    record.description ??
    record.details ??
    record.content ??
    record.body;
  if (typeof message === 'string' && message.trim()) return message;
  return JSON.stringify(record, null, 2);
}

function clientKey(client: AdminClient | undefined): string {
  if (!client) return '';
  return String(client['@id'] ?? client.id ?? client.username ?? client.email);
}

function clientLabel(client: AdminClient): string {
  const fullName =
    stringField(client, ['fullName', 'name']) ??
    [stringField(client, ['firstName']), stringField(client, ['lastName'])]
      .filter(Boolean)
      .join(' ');
  if (fullName.trim()) return fullName;
  const username = typeof client.username === 'string' ? client.username : '';
  const email = typeof client.email === 'string' ? client.email : '';
  if (username && email) return `${username} (${email})`;
  return username || email || `Client ${client.id ?? client['@id'] ?? ''}`;
}

function stringField(client: AdminClient, keys: string[]): string | null {
  for (const key of keys) {
    const value = client[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (value && !Array.isArray(value) && typeof value === 'object') {
      const nested = value as Record<string, unknown>;
      const nestedValue = stringField(nested as AdminClient, [
        'url',
        'contentUrl',
        'content_url',
        'path',
        'filePath',
        'file_path',
        'fileName',
        'file_name',
        'name',
      ]);
      if (nestedValue) return nestedValue;
    }
  }
  return null;
}

function clientPhotoUri(client: AdminClient): string | null {
  const raw = stringField(client, [
    'profileImageFileName',
    'profileImage',
    'profile_image',
    'avatar',
    'photo',
    'image',
  ]);
  if (raw?.startsWith('http') || raw?.includes('/uploads/')) return assetUrl(raw);
  return profileImageUrl(raw);
}

function ClientAvatar({
  client,
  selected,
}: {
  client: AdminClient;
  selected: boolean;
}) {
  const uri = clientPhotoUri(client);
  const initial = clientLabel(client).trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.clientAvatar, selected && styles.clientAvatarActive]}>
      {uri ? (
        <Image source={{ uri }} style={styles.clientAvatarImage} />
      ) : (
        <Text
          style={[
            styles.clientAvatarText,
            selected && styles.clientAvatarTextActive,
          ]}
        >
          {initial}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: estate.sub,
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loadingText: { color: estate.sub, fontSize: 13 },
  emptyInline: { color: estate.sub, fontSize: 13, marginTop: 8 },
  clientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: estate.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: estate.surface,
  },
  clientAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: estate.goldBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  clientAvatarActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  clientAvatarImage: { width: '100%', height: '100%' },
  clientAvatarText: { color: estate.navy, fontSize: 12, fontWeight: '800' },
  clientAvatarTextActive: { color: '#fff' },
  clientChipActive: {
    backgroundColor: estate.navy,
    borderColor: estate.navy,
  },
  clientChipText: { color: estate.text, fontSize: 13, fontWeight: '700' },
  clientChipTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: estate.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: estate.text,
    backgroundColor: '#fff',
  },
  messageInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: estate.navy,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.65 },
  sendButtonText: { color: '#fff', fontWeight: '800' },
  preview: {
    color: estate.sub,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});

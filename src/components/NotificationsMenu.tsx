import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { fetchNotifications } from '../api/notifications';
import type { MainStackParamList } from '../navigation/types';
import type { Notification } from '../types';
import { ROUTES } from '../utils';

const t = {
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E8EAF0',
  text: '#111827',
  sub: '#6B7280',
  accent: '#2563EB',
  accentBg: '#EFF6FF',
  radius: 12,
};

type Props = {
  anchorBottom: number;
  enabled?: boolean;
};

function formatNotificationDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotificationsMenu({ anchorBottom, enabled = true }: Props) {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const slideY = useRef(new Animated.Value(-16)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchNotifications();
      setItems(list);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setItems([]);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  const openPanel = () => {
    setOpen(true);
    void load();
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 280,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePanel = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: -16,
        duration: 160,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.timing(fadeIn, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      cb?.();
    });
  };

  const goToPayment = () =>
    closePanel(() => {
      const mainStack = navigation.getParent();
      if (mainStack) {
        mainStack.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.PAYMENT } as never);
        return;
      }
      navigation.navigate(ROUTES.MAIN_TABS, { screen: ROUTES.PAYMENT } as never);
    });

  const showEmpty = loaded && !loading && items.length === 0;

  if (!enabled) {
    return null;
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={open ? () => closePanel() : openPanel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Notifications"
        accessibilityRole="button"
      >
        <Text style={styles.bell}>🔔</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => closePanel()}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => closePanel()}>
          <Animated.View style={[styles.backdrop, { opacity: fadeIn }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.dropdown,
            { top: anchorBottom, opacity: fadeIn, transform: [{ translateY: slideY }] },
          ]}
        >
          <Text style={styles.dropdownTitle}>Notifications</Text>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={t.accent} />
            </View>
          ) : showEmpty ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No Notifications</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {items.map((n, i) => (
                <Pressable
                  key={n.id}
                  style={({ pressed }) => [
                    styles.item,
                    i < items.length - 1 && styles.itemBorder,
                    pressed && styles.itemPressed,
                  ]}
                  onPress={goToPayment}
                  accessibilityRole="button"
                  accessibilityLabel={n.title ?? n.message ?? 'Notification'}
                >
                  {n.title ? (
                    <Text style={styles.itemTitle}>{n.title}</Text>
                  ) : null}
                  <Text style={styles.itemMessage}>{n.message}</Text>
                  {n.createdAt ? (
                    <Text style={styles.itemDate}>
                      {formatNotificationDate(n.createdAt)}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  trigger: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: t.bg,
    borderWidth: 1,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerPressed: { backgroundColor: t.border },
  bell: { fontSize: 22 },
  dropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxHeight: 360,
    backgroundColor: t.surface,
    borderRadius: t.radius,
    borderWidth: 1,
    borderColor: t.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: t.sub,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  list: { maxHeight: 300 },
  centered: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: { fontSize: 15, color: t.sub, fontWeight: '500' },
  item: { paddingHorizontal: 20, paddingVertical: 14 },
  itemPressed: { backgroundColor: t.accentBg },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.border,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: t.text,
    marginBottom: 4,
  },
  itemMessage: { fontSize: 14, color: t.text, lineHeight: 20 },
  itemDate: { fontSize: 11, color: t.sub, marginTop: 6 },
});

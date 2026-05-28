import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { useAuth } from '../auth/AuthContext';
import { getLocalProfilePhotoUri } from '../auth/profilePhotoStorage';
import { ROUTES } from '../utils';
import { profileImageUrl } from '../utils/api';
import { colors } from '../theme';
import type { MainStackParamList } from '../navigation/types';

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

const NAV_ITEMS = [
  { label: 'Dashboard', sublabel: 'Overview', icon: '⊞', route: ROUTES.DASHBOARD },
  { label: 'My Transactions', sublabel: 'Purchases & history', icon: '↔', route: ROUTES.MY_TRANSACTIONS },
  { label: 'Payment', sublabel: 'Balance & installments', icon: '₱', route: ROUTES.PAYMENT },
  { label: 'Profile', sublabel: 'Account settings', icon: '◎', route: ROUTES.PROFILE },
];

const OPERATIONS_NAV_ITEMS = [
  { label: 'Dashboard', sublabel: 'Role overview', icon: '⊞', route: ROUTES.DASHBOARD },
  { label: 'Catalog', sublabel: 'Properties & furniture', icon: '□', route: ROUTES.CATALOG },
  { label: 'Transactions', sublabel: 'Backend records', icon: '↔', route: ROUTES.TRANSACTIONS },
  { label: 'Payments', sublabel: 'Overview & confirmation', icon: '₱', route: ROUTES.PAYMENT },
  { label: 'Profile', sublabel: 'Account settings', icon: '◎', route: ROUTES.PROFILE },
];

const ADMIN_NAV_ITEMS = [
  { label: 'Notifications', sublabel: 'Admin records', icon: '!', route: ROUTES.ADMIN_NOTIFICATIONS },
  { label: 'Activity Logs', sublabel: 'Audit trail', icon: '#', route: ROUTES.ACTIVITY_LOGS },
  { label: 'Data Records', sublabel: 'Admin data', icon: 'D', route: ROUTES.DATA_RECORDS },
];

type Props = {
  activeRoute: string;
  anchorBottom: number;
  username?: string;
};

export function TopNavMenu({ activeRoute, anchorBottom, username }: Props) {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { logout, user, isAdmin, isStaff } = useAuth();
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id == null) {
      setLocalPhotoUri(null);
      return;
    }
    void getLocalProfilePhotoUri(user.id).then(setLocalPhotoUri);
  }, [user?.id, user?.profileImageFileName]);

  const avatarUri =
    profileImageUrl(user?.profileImageFileName) ?? localPhotoUri;
  const [open, setOpen] = useState(false);
  const items = isAdmin
    ? [...OPERATIONS_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : isStaff
      ? OPERATIONS_NAV_ITEMS
      : NAV_ITEMS;

  const slideY = useRef(new Animated.Value(-16)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const rotateV = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setOpen(true);
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 280 }),
      Animated.timing(fadeIn, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(rotateV, { toValue: 1, duration: 180, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start();
  };

  const closeMenu = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: -16, duration: 160, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
      Animated.timing(fadeIn, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(rotateV, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      cb?.();
    });
  };

  const chevron = rotateV.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const mainStack = navigation.getParent();

  const go = (route: string) =>
    closeMenu(() => {
      if (activeRoute === route) return;

      if (mainStack) {
        mainStack.navigate(ROUTES.MAIN_TABS, { screen: route } as never);
        return;
      }

      navigation.navigate(ROUTES.MAIN_TABS, { screen: route } as never);
    });

  const handleLogout = () => {
    closeMenu(() => {
      Alert.alert('Log out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            void logout();
          },
        },
      ]);
    });
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
        onPress={open ? () => closeMenu() : openMenu}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Open menu"
        accessibilityRole="button"
      >
        <View style={styles.triggerAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.triggerAvatarImage} />
          ) : (
            <Text style={styles.triggerAvatarText}>
              {(username ?? 'A')[0].toUpperCase()}
            </Text>
          )}
        </View>
        <Animated.Text style={[styles.triggerChevron, { transform: [{ rotate: chevron }] }]}>▾</Animated.Text>
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => closeMenu()} statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => closeMenu()}>
          <Animated.View style={[styles.backdrop, { opacity: fadeIn }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[styles.dropdown, { top: anchorBottom, opacity: fadeIn, transform: [{ translateY: slideY }] }]}
        >
          <Text style={styles.dropdownTitle}>Go to</Text>
          {items.map((item, i) => {
            const active = activeRoute === item.route;
            return (
              <Pressable
                key={item.route}
                style={({ pressed }) => [
                  styles.item,
                  active && styles.itemActive,
                  pressed && styles.itemPressed,
                  i < items.length - 1 && styles.itemBorder,
                ]}
                onPress={() => go(item.route)}
              >
                <View style={[styles.iconBox, active && styles.iconBoxActive]}>
                  <Text style={[styles.iconText, active && styles.iconTextActive]}>{item.icon}</Text>
                </View>
                <View style={styles.itemLabels}>
                  <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
                  <Text style={styles.itemSub}>{item.sublabel}</Text>
                </View>
                {active ? <Text style={styles.arrow}>›</Text> : null}
              </Pressable>
            );
          })}

          <View style={styles.separator} />

          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={handleLogout}
          >
            <View style={[styles.iconBox, styles.iconBoxLogout]}>
              <Text style={styles.iconTextLogout}>⎋</Text>
            </View>
            <View style={styles.itemLabels}>
              <Text style={styles.itemLabelLogout}>Log out</Text>
              <Text style={styles.itemSub}>Sign out of your account</Text>
            </View>
          </Pressable>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: t.bg,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 28,
    paddingVertical: 6,
    paddingHorizontal: 8,
    paddingRight: 10,
  },
  triggerPressed: { backgroundColor: t.border },
  triggerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: t.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  triggerAvatarImage: { width: '100%', height: '100%' },
  triggerAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  triggerChevron: { fontSize: 14, color: t.sub, marginTop: 1 },
  dropdown: {
    position: 'absolute',
    left: 16,
    right: 16,
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  itemActive: { backgroundColor: t.accentBg },
  itemPressed: { backgroundColor: '#F3F4F6' },
  itemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: t.bg,
    borderWidth: 1,
    borderColor: t.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: t.accentBg, borderColor: `${t.accent}44` },
  iconText: { fontSize: 20, color: t.sub },
  iconTextActive: { color: t.accent },
  itemLabels: { flex: 1 },
  itemLabel: { fontSize: 17, fontWeight: '600', color: t.text },
  itemLabelActive: { color: t.accent },
  itemSub: { fontSize: 13, color: t.sub, marginTop: 2 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.border,
    marginHorizontal: 20,
  },
  iconBoxLogout: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  iconTextLogout: { fontSize: 20, color: colors.danger },
  itemLabelLogout: { fontSize: 17, fontWeight: '600', color: colors.danger },
  arrow: { fontSize: 24, color: t.accent, marginTop: -2 },
});

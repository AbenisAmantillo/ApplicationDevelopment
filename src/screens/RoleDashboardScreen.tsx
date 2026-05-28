import { useCallback } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { useAuth } from '../auth/AuthContext';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
import { ErrorBanner } from '../components/ErrorBanner';
import { EstateHero, SectionHeader, StatChip } from '../components/estate';
import { LoadingView } from '../components/LoadingView';
import { useOperationsData } from '../hooks/useOperationsData';
import type { MainTabParamList } from '../navigation/types';
import { estate, estateStyles } from '../theme/estate';
import { ROUTES } from '../utils';

type ModuleCard = {
  title: string;
  subtitle: string;
  route?: keyof MainTabParamList;
  adminOnly?: boolean;
};

const SHARED_MODULES: ModuleCard[] = [
  {
    title: 'Property Management',
    subtitle: 'Review property records and availability from the backend.',
    route: ROUTES.CATALOG,
  },
  {
    title: 'Furniture / Catalog',
    subtitle: 'Review catalog inventory and stock status.',
    route: ROUTES.CATALOG,
  },
  {
    title: 'Transactions',
    subtitle: 'View backend transaction records.',
    route: ROUTES.TRANSACTIONS,
  },
  {
    title: 'Payments',
    subtitle: 'View payments. Staff can receive and confirm pending payments.',
    route: ROUTES.PAYMENT,
  },
  {
    title: 'Account / Profile',
    subtitle: 'Manage your signed-in account.',
    route: ROUTES.PROFILE,
  },
];

const ADMIN_MODULES: ModuleCard[] = [
  {
    title: 'User / Client / Staff Management',
    subtitle: 'Admin-only backend area: /clients.',
    adminOnly: true,
  },
  {
    title: 'Notifications',
    subtitle: 'Admin-only notification management.',
    route: ROUTES.ADMIN_NOTIFICATIONS,
    adminOnly: true,
  },
  {
    title: 'Activity Logs',
    subtitle: 'Admin-only audit trail access.',
    route: ROUTES.ACTIVITY_LOGS,
    adminOnly: true,
  },
  {
    title: 'Data Records',
    subtitle: 'Admin-only backend data records.',
    route: ROUTES.DATA_RECORDS,
    adminOnly: true,
  },
];

const STAFF_MODULES: ModuleCard[] = [
  {
    title: 'Create Transactions',
    subtitle: 'Staff-only backend capability. Admin is not shown this action.',
  },
  {
    title: 'Receive / Confirm Payments',
    subtitle: 'Use Payments to confirm pending installments.',
    route: ROUTES.PAYMENT,
  },
];

export default function RoleDashboardScreen() {
  const { user, isAdmin } = useAuth();
  const navigation = useNavigation<StackNavigationProp<MainTabParamList>>();
  const { stats, loading, error, refresh } = useOperationsData();

  const go = useCallback(
    (route: keyof MainTabParamList) => navigation.navigate(route),
    [navigation],
  );

  if (loading) return <LoadingView />;

  const modules = isAdmin
    ? [...SHARED_MODULES, ...ADMIN_MODULES]
    : [...SHARED_MODULES, ...STAFF_MODULES];
  const title = isAdmin ? 'Admin dashboard' : 'Staff dashboard';
  const subtitle = isAdmin
    ? 'Admin access to operational overviews and admin-only records.'
    : 'Staff access for operations, transactions, and payment confirmation.';

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={ROUTES.DASHBOARD}
        greeting={title}
        subtitle={user?.username}
        tone="estate"
        showNotifications={isAdmin}
      />

      <ScrollView
        style={estateStyles.flex}
        contentContainerStyle={estateStyles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={estate.gold}
            colors={[estate.navy]}
          />
        }
      >
        <ErrorBanner message={error} />

        <EstateHero
          eyebrow={estate.brandEyebrow}
          title={title}
          subtitle={subtitle}
        />

        <View style={estateStyles.statsRow}>
          <StatChip
            label="Properties"
            value={String(stats.availableProperties)}
          />
          <StatChip label="Catalog" value={String(stats.availableFurniture)} />
        </View>
        <View style={estateStyles.statsRow}>
          <StatChip label="Transactions" value={String(stats.transactions)} />
          <StatChip label="Pending Pay" value={String(stats.pendingPayments)} />
        </View>

        <SectionHeader
          title="Allowed Areas"
          subtitle="Only routes allowed for your backend role are shown here"
        />

        {modules.map(item => (
          <Pressable
            key={item.title}
            disabled={!item.route}
            onPress={() => item.route && go(item.route)}
            style={({ pressed }) => [
              estateStyles.card,
              styles.module,
              item.adminOnly && styles.adminOnly,
              pressed && item.route && styles.pressed,
            ]}
          >
            <View style={styles.moduleText}>
              <Text style={estateStyles.cardTitle}>{item.title}</Text>
              <Text style={estateStyles.cardMeta}>{item.subtitle}</Text>
            </View>
            <Text style={styles.chevron}>{item.route ? '>' : 'API'}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  module: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  moduleText: { flex: 1 },
  adminOnly: { borderColor: estate.gold },
  pressed: { opacity: 0.75 },
  chevron: {
    fontSize: 12,
    fontWeight: '800',
    color: estate.gold,
    letterSpacing: 0.8,
  },
});

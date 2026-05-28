import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { NotificationsMenu } from './NotificationsMenu';
import { TopNavMenu } from './TopNavMenu';

const t = {
  bg: '#F7F8FA',
  border: '#E8EAF0',
  text: '#111827',
  sub: '#6B7280',
};

type Props = {
  activeRoute: string;
  greeting?: string;
  subtitle?: string;
  showNotifications?: boolean;
  /** Navy bar styling for property-browse screens */
  tone?: 'default' | 'estate';
};

const estateHeader = {
  bg: '#0F2942',
  border: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  sub: 'rgba(255,255,255,0.72)',
};

export function ClientScreenHeader({
  activeRoute,
  greeting = 'Good morning',
  subtitle,
  showNotifications = false,
  tone = 'default',
}: Props) {
  const { user } = useAuth();
  const [topBarBottom, setTopBarBottom] = useState(120);
  const estate = tone === 'estate';

  return (
    <View
      style={[styles.topBar, estate && styles.topBarEstate]}
      onLayout={e => setTopBarBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.hello, estate && styles.helloEstate]}>{greeting}</Text>
          <Text style={[styles.name, estate && styles.nameEstate]}>
            {subtitle ?? user?.username ?? 'Valued Client'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <NotificationsMenu
            anchorBottom={topBarBottom}
            enabled={showNotifications}
          />
          <TopNavMenu
            activeRoute={activeRoute}
            anchorBottom={topBarBottom}
            username={user?.username}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: t.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.border,
  },
  topBarEstate: {
    backgroundColor: estateHeader.bg,
    borderBottomColor: estateHeader.border,
    paddingBottom: 16,
  },
  helloEstate: { color: estateHeader.sub },
  nameEstate: { color: estateHeader.text },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: { flex: 1, marginRight: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hello: { fontSize: 13, color: t.sub },
  name: { fontSize: 22, fontWeight: '700', color: t.text, marginTop: 8 },
});

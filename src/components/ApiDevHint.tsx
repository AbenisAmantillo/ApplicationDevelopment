import { StyleSheet, Text, View } from 'react-native';
import { apiBaseUrl } from '../config/env';
import { colors } from '../theme';

/**
 * Shown on login in dev so you can confirm which Symfony origin the app uses.
 */
export function ApiDevHint() {
  if (!__DEV__) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>API origin</Text>
      <Text style={styles.url} selectable>
        {apiBaseUrl ?? '(not set — copy .env.example to .env.local)'}
      </Text>
      <Text style={styles.hint}>
        For physical phones, set API_BASE_URL in .env.local to your computer LAN IP and
        backend port. Do not use localhost.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  url: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 4,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/**
 * Shown when `API_BASE_URL` is missing (production build without `.env.local`).
 */
export function ApiConfigBanner() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>API not configured</Text>
      <Text style={styles.body}>
        Copy `.env.example` to `.env.local` and set API_BASE_URL to your Symfony
        backend origin. For physical phones, use your computer LAN IP and backend
        port, not localhost. Restart Metro after changing env files. Never put
        DATABASE_URL or MySQL credentials in the app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});

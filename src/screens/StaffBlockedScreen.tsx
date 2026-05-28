import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors } from '../theme';

export default function StaffBlockedScreen() {
  const { logout, user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin / staff account</Text>
      <Text style={styles.body}>
        Signed in as {user?.username}. This mobile app is for property clients
        only. Please use the admin web application.
      </Text>
      <Pressable style={styles.button} onPress={() => logout()}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  body: { fontSize: 15, color: colors.textMuted, marginTop: 12, lineHeight: 22 },
  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});

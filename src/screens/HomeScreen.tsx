import { useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import {
  Animated,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { IMG, ROUTES } from '../utils';
import { authLogout } from '../app/action';

interface ButtonProps {
  label: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
}

const Button = ({ label, onPress, style, textStyle }: ButtonProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.button, style]}>
    <Text style={[styles.buttonText, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const bounceValue = useRef(new Animated.Value(1)).current;

  const handleNavigateToProfile = useCallback(() => {
      (navigation as any).navigate(ROUTES.PROFILE);
  }, [navigation, bounceValue]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel'},
        {
          text: 'Log Out',
          onPress: () => {
            dispatch(authLogout());
          },
        },
      ]
    );
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Image source={IMG.LOGO} style={styles.logo}  />
          <View style={styles.divider} />
          <Text style={styles.subtitle}>Welcome back</Text>
          <Text style={styles.title}>Home</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardLabel}>QUICK ACTIONS</Text>
            <Button
              label="View Profile"
              onPress={handleNavigateToProfile}
              style={styles.profileButton}
            />
          <Button
            label="Log Out"
            onPress={handleLogout}
            style={styles.logoutButton}
            textStyle={styles.logoutText}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2025 MyApp. All rights reserved.</Text>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingVertical: 48,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  divider: {
    height: 2,
    backgroundColor: '#E0E0E0',
    width: '100%',
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },

  // Actions
  actionsCard: {
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 12,
    marginVertical: 20,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 16,
    letterSpacing: 1,
  },
  profileButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    marginVertical: 12,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    marginVertical: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutText: {
    color: 'white',
  },

  // Footer
  footer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default HomeScreen;

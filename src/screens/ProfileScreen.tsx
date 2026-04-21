import { useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IMG, ROUTES } from '../utils';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const spinValue = useRef(new Animated.Value(0)).current;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const backToHome = useCallback(() => {
    (navigation as any).navigate(ROUTES.HOME);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image source={IMG.LOGO2} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>ProfileScreen</Text>

        <TouchableOpacity
          onPress={backToHome}
          activeOpacity={0.8}
          style={styles.button}>
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#ffffff',
  },
  logo: {
    width: 400,
    height: 380,
  },
  title: {
    fontSize: 40,
    fontWeight: '900' as const,
    // fontWeight: '700',
    marginTop: 12,
  },
  button: {
    backgroundColor: '#616161',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 20,
    minWidth: 220,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;

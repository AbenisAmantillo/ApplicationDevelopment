import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

import { registerApi } from '../api/auth';
import { setPendingUserId } from '../auth/tokenStorage';
import { ROUTES } from '../utils';
import { logEvent } from '../utils/firebase';
import type { AuthStackParamList } from '../navigation/types';

const c = {
  white: '#ffffff',
  whiteMid: 'rgba(255,255,255,0.70)',
  whiteLow: 'rgba(255,255,255,0.45)',
  inputBg: 'rgba(255,255,255,0.12)',
  inputBorder: 'rgba(255,255,255,0.22)',
  cardBorder: 'rgba(255,255,255,0.18)',
  errorBg: 'rgba(220,53,69,0.75)',
  fieldError: 'rgba(255,120,120,0.95)',
};

const BG_IMAGE = {
  uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920',
};

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Text style={{ color: c.whiteLow, fontSize: 14 }}>
      {visible ? '🙈' : '👁'}
    </Text>
  );
}

export default function RegisterScreen() {
  const navigation =
    useNavigation<StackNavigationProp<AuthStackParamList>>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inputStyle = (
    field: string,
    hasError?: boolean,
    withIcon?: boolean,
  ) => [
    styles.input,
    !withIcon && styles.inputNoIcon,
    focusedField === field && styles.inputFocused,
    hasError && styles.inputError,
  ];

  const validate = () => {
    const next: Record<string, string> = {};
    if (username.trim().length < 3) {
      next.username = 'Username must be at least 3 characters.';
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const result = await registerApi({
      username: trimmedUsername,
      email: trimmedEmail,
      password,
    });
    if (!result.success) {
      setLoading(false);
      setServerError(result.message);
      return;
    }
    if (result.userId != null) {
      await setPendingUserId(result.userId);
    }
    void logEvent('user_registered', {
      method: 'password',
      verified: result.verified,
    });

    setLoading(false);
    navigation.navigate(ROUTES.LOGIN, {
      notice: result.message,
      resendEmail: result.verified ? undefined : result.email,
    });
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardShell}>
            <View style={styles.cardGlass} pointerEvents="none" />
            <View style={styles.cardBorder} pointerEvents="none" />
            <View style={styles.cardContent}>
              <Text style={styles.heading}>Register</Text>

              {!!serverError && (
                <View style={styles.alertDanger}>
                  <Text style={styles.alertText}>{serverError}</Text>
                </View>
              )}

              <AuthField
                label="Username"
                error={errors.username}
              >
                <View style={styles.inputWrap}>
                  <TextInput
                    style={inputStyle('username', !!errors.username, true)}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Choose a username"
                    placeholderTextColor={c.whiteLow}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <View style={styles.ico}>
                    <Text style={{ color: c.whiteLow, fontSize: 14 }}>👤</Text>
                  </View>
                </View>
              </AuthField>

              <AuthField label="Email" error={errors.email}>
                <TextInput
                  style={inputStyle('email', !!errors.email, false)}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor={c.whiteLow}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </AuthField>

              <AuthField label="Password" error={errors.password}>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={inputStyle('password', !!errors.password, true)}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholder="At least 6 characters"
                    placeholderTextColor={c.whiteLow}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable
                    style={styles.ico}
                    onPress={() => setShowPassword(v => !v)}
                    hitSlop={8}
                  >
                    <EyeIcon visible={showPassword} />
                  </Pressable>
                </View>
              </AuthField>

              <AuthField
                label="Confirm password"
                error={errors.confirmPassword}
              >
                <View style={styles.inputWrap}>
                  <TextInput
                    style={inputStyle(
                      'confirmPassword',
                      !!errors.confirmPassword,
                      true,
                    )}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    placeholder="Repeat your password"
                    placeholderTextColor={c.whiteLow}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable
                    style={styles.ico}
                    onPress={() => setShowConfirm(v => !v)}
                    hitSlop={8}
                  >
                    <EyeIcon visible={showConfirm} />
                  </Pressable>
                </View>
              </AuthField>

              <Pressable
                style={[styles.btnPrimary, loading && styles.btnPrimaryDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#222" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Register</Text>
                )}
              </Pressable>

              <View style={styles.footerWrap}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
                  <Text style={styles.footerLink}>Login</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.fieldErrorText}>{error}</Text> : null}
    </View>
  );
}

const RADIUS_PILL = 50;
const RADIUS_CARD = 24;

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  cardShell: {
    borderRadius: RADIUS_CARD,
    overflow: 'hidden',
  },
  cardGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 20, 20, 0.55)',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS_CARD,
    borderWidth: 1,
    borderColor: c.cardBorder,
  },
  cardContent: {
    padding: 32,
  },
  heading: {
    fontSize: 26,
    fontWeight: '500',
    color: c.white,
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: -0.3,
  },
  alertDanger: {
    backgroundColor: c.errorBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  alertText: { color: c.white, fontSize: 13 },
  field: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: c.whiteMid,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: RADIUS_PILL,
    paddingHorizontal: 18,
    paddingVertical: 13,
    paddingRight: 44,
    fontSize: 14,
    color: c.white,
  },
  inputNoIcon: {
    paddingRight: 18,
  },
  inputFocused: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  inputError: {
    borderColor: 'rgba(255,120,120,0.85)',
  },
  fieldErrorText: {
    color: c.fieldError,
    fontSize: 12,
    marginTop: 6,
  },
  ico: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  btnPrimary: {
    backgroundColor: c.white,
    borderRadius: RADIUS_PILL,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnPrimaryDisabled: { opacity: 0.7 },
  btnPrimaryText: {
    color: '#222',
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  footerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  footerLink: { color: c.white, fontWeight: '500', fontSize: 13 },
});

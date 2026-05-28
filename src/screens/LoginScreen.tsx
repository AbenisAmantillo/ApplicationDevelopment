import { useEffect, useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { useAuth } from '../auth/AuthContext';
import { resendVerificationByEmail } from '../api/verification';
import { ApiDevHint } from '../components/ApiDevHint';
import { ROUTES } from '../utils';
import {
  isGoogleSignInCancelled,
  logLogin,
  signInWithGoogle,
} from '../utils/firebase';
import type { AuthStackParamList } from '../navigation/types';

// ─── local palette (no theme.ts) ────────────────────────────────────────────
const c = {
  white: '#ffffff',
  whiteHigh: 'rgba(255,255,255,0.90)',
  whiteMid: 'rgba(255,255,255,0.70)',
  whiteLow: 'rgba(255,255,255,0.45)',
  whiteFaint: 'rgba(255,255,255,0.18)',
  whiteDim: 'rgba(255,255,255,0.08)',
  inputBg: 'rgba(255,255,255,0.12)',
  inputBorder: 'rgba(255,255,255,0.22)',
  inputFocus: 'rgba(255,255,255,0.22)',
  cardBg: 'rgba(255,255,255,0.08)',
  cardBorder: 'rgba(255,255,255,0.18)',
  divider: 'rgba(255,255,255,0.15)',
  errorBg: 'rgba(220,53,69,0.75)',
};

const BG_IMAGE = {
  uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920',
};

// ─── tiny SVG-style icons rendered with Text ─────────────────────────────────
// (Real app: swap for react-native-svg or an icon library)
function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <Text style={{ color: c.whiteLow, fontSize: 14 }}>
      {visible ? '🙈' : '👁'}
    </Text>
  );
}

// ─── Google "G" mark rendered with coloured Text segments ────────────────────
function GoogleG() {
  return (
    <Text style={styles.googleG}>
      <Text style={{ color: '#EA4335' }}>G</Text>
    </Text>
  );
}

export default function LoginScreen() {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();
  const route = useRoute<RouteProp<AuthStackParamList, typeof ROUTES.LOGIN>>();
  const { login, loginWithFirebaseIdToken } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [notice, setNotice] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = route.params;
    if (params?.notice) {
      setNotice(params.notice);
    }
    if (params?.resendEmail) {
      setResendEmail(params.resendEmail);
    }
    if (params?.notice || params?.resendEmail) {
      navigation.setParams({ notice: undefined, resendEmail: undefined });
    }
  }, [route.params, navigation]);

  // focused-input highlight
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const inputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  const handleResendVerification = async () => {
    const email = resendEmail.trim();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter the email address you used to register.');
      return;
    }
    setResendBusy(true);
    setError('');
    const result = await resendVerificationByEmail(email);
    setResendBusy(false);
    if (result.success) {
      setNotice(result.message);
    } else {
      setError(result.message);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      await logLogin('email');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const credential = await signInWithGoogle();
      const idToken = await credential.user.getIdToken();
      await loginWithFirebaseIdToken(idToken);
      await logLogin('google');
    } catch (e) {
      if (!isGoogleSignInCancelled(e)) {
        setError(e instanceof Error ? e.message : 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={BG_IMAGE} style={styles.bg} resizeMode="cover">
      {/* darkening overlay */}
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
          {/* ── Glass card (frosted overlay, no native blur) ─────────── */}
          <View style={styles.cardShell}>
            <View style={styles.cardGlass} pointerEvents="none" />
            <View style={styles.cardBorder} pointerEvents="none" />
            <View style={styles.cardContent}>
            <Text style={styles.heading}>Login</Text>

            {!!notice && (
              <View style={styles.alertInfo}>
                <Text style={styles.alertText}>{notice}</Text>
              </View>
            )}

            {/* Error banner */}
            {!!error && (
              <View style={styles.alertDanger}>
                <Text style={styles.alertText}>{error}</Text>
              </View>
            )}
            {/* Username */}
            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={inputStyle('username')}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Enter your username or email"
                  placeholderTextColor={c.whiteLow}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                />
                <View style={styles.ico}>
                  <Text style={{ color: c.whiteLow, fontSize: 14 }}>👤</Text>
                </View>
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={inputStyle('password')}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholder="Enter your password"
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
            </View>

            {/* Remember me + Forgot password */}
            <View style={styles.row}>
              <Pressable
                style={styles.rememberRow}
                onPress={() => setRememberMe(v => !v)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>
            </View>

            {/* Login button */}
            <Pressable
              style={[styles.btnLogin, loading && styles.btnLoginDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#222" />
              ) : (
                <Text style={styles.btnLoginText}>Login</Text>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={[styles.btnGoogle, loading && styles.btnLoginDisabled]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <GoogleG />
              <Text style={styles.btnGoogleText}>Continue with Google</Text>
            </Pressable>

            {!!resendEmail && (
              <View style={styles.resendBox}>
                <Text style={styles.resendHint}>
                  Need another verification link? Confirm your email below.
                </Text>
                <View style={styles.resendRow}>
                  <TextInput
                    style={styles.resendInput}
                    value={resendEmail}
                    onChangeText={setResendEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="Email address"
                    placeholderTextColor={c.whiteLow}
                  />
                  <Pressable
                    style={[
                      styles.btnResend,
                      resendBusy && styles.btnLoginDisabled,
                    ]}
                    onPress={handleResendVerification}
                    disabled={resendBusy}
                  >
                    {resendBusy ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnResendText}>Send</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Register link */}
            <View style={styles.registerWrap}>
              <Text style={styles.registerText}>Don&apos;t have an account? </Text>
              <Pressable onPress={() => navigation.navigate(ROUTES.REGISTER)}>
                <Text style={styles.registerLink}>Register</Text>
              </Pressable>
            </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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

  // ── Glass card (semi-transparent layers; no expo-blur) ───────────────────
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

  // ── Alerts ────────────────────────────────────────────────────────────────
  alertInfo: {
    backgroundColor: 'rgba(40, 120, 200, 0.75)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  alertDanger: {
    backgroundColor: c.errorBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  alertText: { color: c.white, fontSize: 13 },

  // ── Fields ────────────────────────────────────────────────────────────────
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
  inputFocused: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  ico: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
  },

  // ── Remember / Forgot row ────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 22,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: c.whiteMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: c.white,
    borderColor: c.white,
  },
  checkmark: { color: '#222', fontSize: 10, fontWeight: '700' },
  rememberText: { color: c.whiteMid, fontSize: 13 },
  forgot: { color: c.whiteMid, fontSize: 13 },

  // ── Login button ─────────────────────────────────────────────────────────
  btnLogin: {
    backgroundColor: c.white,
    borderRadius: RADIUS_PILL,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnLoginDisabled: { opacity: 0.7 },
  btnLoginText: { color: '#222', fontWeight: '500', fontSize: 14, letterSpacing: 0.5 },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.divider },
  dividerText: { color: 'rgba(255,255,255,0.40)', fontSize: 12, letterSpacing: 0.5 },

  // ── Google button ─────────────────────────────────────────────────────────
  btnGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: RADIUS_PILL,
    paddingVertical: 13,
    backgroundColor: c.whiteDim,
  },
  googleG: { fontSize: 17, fontWeight: '700' },
  btnGoogleText: { color: c.whiteHigh, fontSize: 14, fontWeight: '500', letterSpacing: 0.3 },

  // ── Register link ─────────────────────────────────────────────────────────
  registerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  registerText: { color: 'rgba(255,255,255,0.55)', fontSize: 13 },
  registerLink: { color: c.white, fontWeight: '500', fontSize: 13 },

  // ── Resend box ────────────────────────────────────────────────────────────
  resendBox: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  resendHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 10,
    lineHeight: 18,
  },
  resendRow: { flexDirection: 'row', gap: 8 },
  resendInput: {
    flex: 1,
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: RADIUS_PILL,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: c.white,
    fontSize: 13,
  },
  btnResend: {
    backgroundColor: c.whiteFaint,
    borderRadius: RADIUS_PILL,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  btnResendText: { color: c.white, fontSize: 13, fontWeight: '500' },
});
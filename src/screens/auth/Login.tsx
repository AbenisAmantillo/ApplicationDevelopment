import { useState, useEffect, useRef } from 'react';
import {
    Alert,
    Animated,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { ROUTES } from '../../utils';
import { authLogin } from '../../app/action';

// ─── Eye icons ────────────────────────────────────────────────────────────────
const EyeIcon = ({ visible }: { visible: boolean }) =>
    visible ? (
        // Eye open
        <Text style={styles.eyeText}>👁</Text>
    ) : (
        // Eye closed  – simple "strikethrough eye" fallback via unicode
        <Text style={styles.eyeText}>🙈</Text>
    );

// ─── Google G SVG (rendered as a coloured Unicode placeholder – swap for react-native-svg if available) ──
const GoogleIcon = () => (
    <View style={styles.googleIconWrap}>
        <Text style={styles.googleIconText}>G</Text>
    </View>
);

// ─────────────────────────────────────────────────────────────────────────────
const STAGGER = 80; // ms per field

function useFadeUp(delay: number) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 420,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 420,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return { opacity, transform: [{ translateY }] };
}

// ─── Field wrapper with staggered animation ──────────────────────────────────
const Field = ({
    label,
    children,
    delay,
}: {
    label: string;
    children: React.ReactNode;
    delay: number;
}) => {
    const anim = useFadeUp(delay);
    return (
        <Animated.View style={[styles.field, anim]}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
        </Animated.View>
    );
};

// ─── Main Login component ─────────────────────────────────────────────────────
const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [flashMessage, setFlashMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

    const navigation = useNavigation();
    const dispatch = useDispatch();
    const auth = useSelector((state: any) => state.auth);

    const cardAnim = useFadeUp(0);
    const rowAnim = useFadeUp(STAGGER * 3);
    const btnAnim = useFadeUp(STAGGER * 4);
    const dividerAnim = useFadeUp(STAGGER * 5);
    const googleAnim = useFadeUp(STAGGER * 6);
    const registerAnim = useFadeUp(STAGGER * 7);

    useEffect(() => {
        if (!auth.isLoading && auth.isError && auth.error) {
            setFlashMessage({ type: 'error', text: auth.error });
            // (navigation as any).navigate(ROUTES.ERROR);
        }
    }, [auth.isError, auth.error]);

    const handleLogin = () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Invalid Credentials', 'Please enter a valid username and password.');
            return;
        }
        dispatch(authLogin({ username, password }));
    };

    const flashColors: Record<string, string> = {
        error: 'rgba(220,53,69,0.75)',
        success: 'rgba(40,167,69,0.80)',
        info: 'rgba(13,202,240,0.75)',
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920' }}
            style={styles.bg}
            imageStyle={styles.bgImage}
        >
            {/* dark overlay */}
            <View style={styles.overlay} />

            <KeyboardAvoidingView
                style={styles.kav}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Glass card */}
                    <Animated.View style={[styles.cardShell, cardAnim]}>
                        <View style={styles.cardGlass} />

                        {/* Card border overlay */}
                        <View style={styles.cardBorder} />

                        {/* Card content */}
                        <View style={styles.cardContent}>
                            <Text style={styles.title}>Login</Text>

                            {/* Flash message */}
                            {flashMessage && (
                                <View
                                    style={[
                                        styles.alert,
                                        { backgroundColor: flashColors[flashMessage.type] },
                                    ]}
                                >
                                    <Text style={styles.alertText}>{flashMessage.text}</Text>
                                </View>
                            )}

                            {/* Username */}
                            <Field label="Username" delay={STAGGER}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your username or email"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="username"
                                    />
                                    {/* User icon */}
                                    <View style={styles.inputIcon}>
                                        <Text style={styles.inputIconText}>👤</Text>
                                    </View>
                                </View>
                            </Field>

                            {/* Password */}
                            <Field label="Password" delay={STAGGER * 2}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoComplete="current-password"
                                    />
                                    <TouchableOpacity
                                        style={styles.inputIcon}
                                        onPress={() => setShowPassword(p => !p)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <EyeIcon visible={showPassword} />
                                    </TouchableOpacity>
                                </View>
                            </Field>

                            {/* Remember me + Forgot password */}
                            <Animated.View style={[styles.row, rowAnim]}>
                                <TouchableOpacity
                                    style={styles.rememberRow}
                                    onPress={() => setRememberMe(v => !v)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                                        {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                    <Text style={styles.rememberText}>Remember me</Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => {/* handle forgot */}}>
                                    <Text style={styles.forgotText}>Forgot password?</Text>
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Login button */}
                            <Animated.View style={btnAnim}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.btnLogin,
                                        pressed && styles.btnLoginPressed,
                                    ]}
                                    onPress={handleLogin}
                                >
                                    <Text style={styles.btnLoginText}>
                                        {auth.isLoading ? 'Logging in…' : 'Login'}
                                    </Text>
                                </Pressable>
                            </Animated.View>

                            {/* Divider */}
                            <Animated.View style={[styles.divider, dividerAnim]}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>or</Text>
                                <View style={styles.dividerLine} />
                            </Animated.View>

                            {/* Google button */}
                            <Animated.View style={googleAnim}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.btnGoogle,
                                        pressed && styles.btnGooglePressed,
                                    ]}
                                    onPress={() => {/* handle Google */}}
                                >
                                    <GoogleIcon />
                                    <Text style={styles.btnGoogleText}>Continue with Google</Text>
                                </Pressable>
                            </Animated.View>

                            {/* Register link */}
                            <Animated.View style={[styles.registerWrap, registerAnim]}>
                                <Text style={styles.registerText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => (navigation as any).navigate(ROUTES.REGISTER)}>
                                    <Text style={styles.registerLink}>Register</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default Login;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    bg: {
        flex: 1,
    },
    bgImage: {
        // matches filter: brightness(0.7) — achieved via overlay below
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    kav: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },

    // Card
    cardShell: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardGlass: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(20, 20, 20, 0.55)',
    },
    cardBorder: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    cardContent: {
        padding: 40,
    },

    // Title
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 28,
        letterSpacing: -0.3,
    },

    // Alert
    alert: {
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
    },
    alertText: {
        color: '#fff',
        fontSize: 13,
    },

    // Field
    field: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.65)',
        marginBottom: 6,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },

    // Input
    inputWrap: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        paddingVertical: 13,
        paddingLeft: 16,
        paddingRight: 44,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        borderRadius: 50,
        fontSize: 14,
        color: '#fff',
        fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    },
    inputIcon: {
        position: 'absolute',
        right: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputIconText: {
        fontSize: 15,
        opacity: 0.55,
    },
    eyeText: {
        fontSize: 15,
        opacity: 0.55,
    },

    // Row
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        marginBottom: 22,
    },
    rememberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    checkboxChecked: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#fff',
    },
    checkmark: {
        color: '#222',
        fontSize: 10,
        lineHeight: 12,
        fontWeight: '700',
    },
    rememberText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },
    forgotText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
    },

    // Login button
    btnLogin: {
        width: '100%',
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 50,
        alignItems: 'center',
    },
    btnLoginPressed: {
        backgroundColor: 'rgba(255,255,255,0.88)',
        transform: [{ translateY: 1 }],
    },
    btnLoginText: {
        color: '#222',
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.5,
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    dividerText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 0.5,
    },

    // Google button
    btnGoogle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginTop: 12,
        paddingVertical: 13,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        borderRadius: 50,
        gap: 10,
    },
    btnGooglePressed: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderColor: 'rgba(255,255,255,0.4)',
        transform: [{ translateY: 1 }],
    },
    btnGoogleText: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    googleIconWrap: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleIconText: {
        color: '#4285F4',
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 15,
    },

    // Register
    registerWrap: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    registerText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
    },
    registerLink: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '500',
    },
});
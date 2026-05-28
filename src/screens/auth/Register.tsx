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

import { ROUTES } from '../../utils';

// ─── Eye toggle icon ──────────────────────────────────────────────────────────
const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Text style={styles.eyeText}>{visible ? '👁' : '🙈'}</Text>
);

// ─── Google icon ──────────────────────────────────────────────────────────────
const GoogleIcon = () => (
    <View style={styles.googleIconWrap}>
        <Text style={styles.googleIconText}>G</Text>
    </View>
);

// ─── Staggered fade-up hook ───────────────────────────────────────────────────
const STAGGER = 50;

function useFadeUp(delay: number) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return { opacity, transform: [{ translateY }] };
}

// ─── Animated field wrapper ───────────────────────────────────────────────────
const Field = ({
    label,
    error,
    delay,
    children,
}: {
    label: string;
    error?: string;
    delay: number;
    children: React.ReactNode;
}) => {
    const anim = useFadeUp(delay);
    return (
        <Animated.View style={[styles.field, anim]}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {children}
            {error ? (
                <View style={styles.fieldError}>
                    <Text style={styles.fieldErrorText}>{error}</Text>
                </View>
            ) : null}
        </Animated.View>
    );
};

// ─── Register screen ──────────────────────────────────────────────────────────
const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const navigation = useNavigation();

    const cardAnim = useFadeUp(0);
    const termsAnim = useFadeUp(STAGGER * 5);
    const btnAnim = useFadeUp(STAGGER * 6);
    const loginAnim = useFadeUp(STAGGER * 7);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!username.trim()) newErrors.username = 'Username is required.';
        if (!email.trim()) newErrors.email = 'Email is required.';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email.';
        if (!password) newErrors.password = 'Password is required.';
        else if (password.length < 6) newErrors.password = 'At least 6 characters.';
        if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
        if (!agreeTerms) newErrors.agreeTerms = 'You must agree to the terms.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = () => {
        if (!validate()) return;
        // dispatch your register action here
        Alert.alert('Success', 'Account created successfully!');
    };

    return (
        <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920' }}
            style={styles.bg}
        >
            {/* Dark overlay */}
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
                        <View style={styles.cardBorder} />

                        <View style={styles.cardContent}>
                            <TouchableOpacity
                                onPress={() => (navigation as any).navigate(ROUTES.LANDING)}
                                style={styles.backHome}
                            >
                                <Text style={styles.backHomeText}>← Home</Text>
                            </TouchableOpacity>
                            <Text style={styles.title}>Register</Text>

                            {/* Username */}
                            <Field label="Username" error={errors.username} delay={STAGGER}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your username"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <View style={styles.inputIcon}>
                                        <Text style={styles.inputIconText}>👤</Text>
                                    </View>
                                </View>
                            </Field>

                            {/* Email */}
                            <Field label="Email" error={errors.email} delay={STAGGER * 2}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoCorrect={false}
                                    />
                                    <View style={styles.inputIcon}>
                                        <Text style={styles.inputIconText}>✉️</Text>
                                    </View>
                                </View>
                            </Field>

                            {/* Password */}
                            <Field label="Password" error={errors.password} delay={STAGGER * 3}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your password"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.inputIcon}
                                        onPress={() => setShowPassword(v => !v)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <EyeIcon visible={showPassword} />
                                    </TouchableOpacity>
                                </View>
                            </Field>

                            {/* Confirm Password */}
                            <Field label="Confirm Password" error={errors.confirmPassword} delay={STAGGER * 4}>
                                <View style={styles.inputWrap}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm your password"
                                        placeholderTextColor="rgba(255,255,255,0.35)"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirm}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity
                                        style={styles.inputIcon}
                                        onPress={() => setShowConfirm(v => !v)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <EyeIcon visible={showConfirm} />
                                    </TouchableOpacity>
                                </View>
                            </Field>

                            {/* Agree to terms */}
                            <Animated.View style={[styles.termsRow, termsAnim]}>
                                <TouchableOpacity
                                    onPress={() => setAgreeTerms(v => !v)}
                                    style={styles.termsCheckTouchable}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                                        {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setAgreeTerms(v => !v)} activeOpacity={0.7}>
                                    <Text style={styles.termsText}>
                                        I agree to the{' '}
                                        <Text style={styles.termsLink}>terms and conditions</Text>
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>
                            {errors.agreeTerms ? (
                                <View style={[styles.fieldError, { marginBottom: 12 }]}>
                                    <Text style={styles.fieldErrorText}>{errors.agreeTerms}</Text>
                                </View>
                            ) : null}

                            {/* Register button */}
                            <Animated.View style={btnAnim}>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.btnRegister,
                                        pressed && styles.btnPressed,
                                    ]}
                                    onPress={handleRegister}
                                >
                                    <Text style={styles.btnRegisterText}>Register</Text>
                                </Pressable>
                            </Animated.View>

                            {/* Login link */}
                            <Animated.View style={[styles.loginWrap, loginAnim]}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => (navigation as any).navigate(ROUTES.LOGIN)}>
                                    <Text style={styles.loginLink}>Login</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

export default Register;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    kav: { flex: 1 },
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
    cardContent: { padding: 40 },

    backHome: { alignSelf: 'flex-start', marginBottom: 8 },
    backHomeText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.65)',
        fontWeight: '500',
    },
    title: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '500',
        textAlign: 'center',
        marginBottom: 28,
        letterSpacing: -0.3,
    },

    // Field
    field: { marginBottom: 14 },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.65)',
        marginBottom: 6,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    fieldError: {
        marginTop: 6,
        backgroundColor: 'rgba(220,53,69,0.75)',
        borderRadius: 50,
        paddingVertical: 5,
        paddingHorizontal: 14,
        alignSelf: 'flex-start',
    },
    fieldErrorText: {
        color: '#fff',
        fontSize: 12,
    },

    // Input
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
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
    },
    inputIcon: {
        position: 'absolute',
        right: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputIconText: { fontSize: 15, opacity: 0.55 },
    eyeText: { fontSize: 15, opacity: 0.55 },

    // Terms row
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 18,
        marginBottom: 4,
    },
    termsCheckTouchable: { marginTop: 1 },
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
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
    termsText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
        flexWrap: 'wrap',
    },
    termsLink: {
        color: '#fff',
        fontWeight: '500',
    },

    // Register button
    btnRegister: {
        width: '100%',
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 50,
        alignItems: 'center',
        marginTop: 8,
    },
    btnPressed: {
        backgroundColor: 'rgba(255,255,255,0.88)',
        transform: [{ translateY: 1 }],
    },
    btnRegisterText: {
        color: '#222',
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.5,
    },

    // Google button
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

    // Login link
    loginWrap: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    loginText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
    },
    loginLink: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '500',
    },
});
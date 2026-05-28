import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  launchImageLibrary,
  type Asset,
  type ImagePickerResponse,
} from 'react-native-image-picker';

import {
  changePassword,
  fetchCurrentUser,
  updateProfile,
  uploadProfileImage,
} from '../api/me';
import { getErrorMessage } from '../api/client';
import { resendVerification } from '../api/verification';
import { useAuth } from '../auth/AuthContext';
import {
  getLocalProfilePhotoUri,
  setLocalProfilePhotoUri,
} from '../auth/profilePhotoStorage';
import { ClientScreenHeader } from '../components/ClientScreenHeader';
import { ErrorBanner } from '../components/ErrorBanner';
import { EstateHero } from '../components/estate';
import { ROUTES } from '../utils';
import { profileImageUrl } from '../utils/api';
import { estate, estateStyles } from '../theme/estate';

function pickAsset(response: ImagePickerResponse): Asset | null {
  if (response.didCancel || response.errorCode) return null;
  const asset = response.assets?.[0];
  if (!asset?.uri) return null;
  return asset;
}

export default function ProfileScreen() {
  const { user, logout, setUser } = useAuth();
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  const userId = user?.id;

  useEffect(() => {
    if (userId == null) {
      setLocalPhotoUri(null);
      return;
    }
    void getLocalProfilePhotoUri(userId).then(setLocalPhotoUri);
  }, [userId]);

  useEffect(() => {
    if (user?.username) setEditUsername(user.username);
  }, [user?.username]);

  const remotePhotoUri = useMemo(
    () => profileImageUrl(user?.profileImageFileName),
    [user?.profileImageFileName],
  );

  const displayPhotoUri = remotePhotoUri ?? localPhotoUri;
  const initial = (user?.username ?? 'A')[0].toUpperCase();
  const verified = user?.verified ?? user?.isVerified;

  const refreshMe = useCallback(async () => {
    try {
      const me = await fetchCurrentUser();
      if (user) {
        setUser({
          ...user,
          id: me.id ?? user.id,
          username: me.username ?? user.username,
          email: me.email ?? user.email,
          roles: me.roles?.length ? me.roles : user.roles,
          verified: me.verified ?? me.isVerified ?? user.verified,
          profileImageFileName:
            me.profileImageFileName ?? user.profileImageFileName,
        });
      }
    } catch {
      // keep cached user if /api/me is unavailable
    }
  }, [setUser, user]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const handleResendVerification = async () => {
    setResendBusy(true);
    try {
      const result = await resendVerification();
      Alert.alert(
        'Verification email',
        result.message ??
          'If your account is not verified yet, a new link was sent. Check your inbox and spam folder.',
      );
    } catch (e) {
      Alert.alert('Verification email', getErrorMessage(e));
    } finally {
      setResendBusy(false);
    }
  };

  const handlePickPhoto = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, maxWidth: 1024, maxHeight: 1024 },
      response => {
        const asset = pickAsset(response);
        if (!asset?.uri) {
          if (response.errorMessage) {
            Alert.alert('Photo', response.errorMessage);
          }
          return;
        }
        void applyPhoto(asset.uri, asset.fileName, asset.type);
      },
    );
  };

  const applyPhoto = async (
    uri: string,
    fileName?: string | null,
    mimeType?: string | null,
  ) => {
    if (userId == null) {
      Alert.alert(
        'Profile photo',
        'Unable to determine your user id. Log out and log in again.',
      );
      return;
    }

    setPhotoBusy(true);
    setLocalPhotoUri(uri);
    await setLocalProfilePhotoUri(userId, uri);

    try {
      const me = await uploadProfileImage(
        uri,
        fileName ?? `profile-${userId}.jpg`,
        mimeType ?? 'image/jpeg',
      );
      if (user) {
        setUser({
          ...user,
          profileImageFileName:
            me.profileImageFileName ?? user.profileImageFileName,
        });
      }
    } catch (e) {
      Alert.alert(
        'Photo saved on device',
        `${getErrorMessage(e)} The image is stored locally until the server accepts uploads.`,
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const resetEditForm = () => {
    setEditUsername(user?.username ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setEditError('');
  };

  const openEdit = () => {
    resetEditForm();
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    resetEditForm();
  };

  const validatePasswordChange = (): string | null => {
    const wantsChange =
      currentPassword.length > 0 ||
      newPassword.length > 0 ||
      confirmPassword.length > 0;
    if (!wantsChange) return null;

    if (!currentPassword) return 'Enter your current password.';
    if (newPassword.length < 6) {
      return 'New password must be at least 6 characters.';
    }
    if (newPassword !== confirmPassword) {
      return 'New passwords do not match.';
    }
    return null;
  };

  const handleSaveProfile = async () => {
    setEditError('');
    const trimmed = editUsername.trim();
    if (trimmed.length < 3) {
      setEditError('Username must be at least 3 characters.');
      return;
    }

    const passwordError = validatePasswordChange();
    if (passwordError) {
      setEditError(passwordError);
      return;
    }

    const usernameChanged = trimmed !== user?.username;
    const passwordChanged = newPassword.length > 0;

    if (!usernameChanged && !passwordChanged) {
      closeEdit();
      return;
    }

    setSaveBusy(true);
    try {
      if (usernameChanged) {
        const me = await updateProfile({ username: trimmed });
        if (user) {
          setUser({
            ...user,
            username: me.username ?? trimmed,
            profileImageFileName:
              me.profileImageFileName ?? user.profileImageFileName,
          });
        }
      }

      if (passwordChanged) {
        await changePassword({
          currentPassword,
          newPassword,
        });
      }

      closeEdit();
      if (passwordChanged) {
        Alert.alert(
          'Password updated',
          'Your password has been changed. Use your new password next time you log in.',
        );
      }
    } catch (e) {
      setEditError(getErrorMessage(e));
    } finally {
      setSaveBusy(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <View style={estateStyles.root}>
      <ClientScreenHeader
        activeRoute={ROUTES.PROFILE}
        greeting="Your Account"
        tone="estate"
      />

      <ScrollView
        style={estateStyles.flex}
        contentContainerStyle={estateStyles.scroll}
      >
        <EstateHero
          eyebrow={estate.brandEyebrow}
          title="Profile & settings"
          subtitle="Manage your account details, profile photo, and sign-in credentials."
        />

        <View style={s.profileCard}>
          <Pressable
            style={s.avatarWrap}
            onPress={handlePickPhoto}
            disabled={photoBusy}
            accessibilityLabel="Change profile photo"
          >
            {displayPhotoUri ? (
              <Image source={{ uri: displayPhotoUri }} style={s.avatarImage} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarInitial}>{initial}</Text>
              </View>
            )}
            {photoBusy ? (
              <View style={s.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </Pressable>

          <Text style={s.profileName}>{user?.username}</Text>
          <Text style={s.profileEmail}>{user?.email}</Text>

          <View style={s.statusRow}>
            <View style={[s.statusBadge, verified ? s.statusVerified : s.statusPending]}>
              <Text style={[s.statusText, verified ? s.statusTextVerified : s.statusTextPending]}>
                {verified ? 'Verified account' : 'Pending verification'}
              </Text>
            </View>
          </View>

          {!verified ? (
            <Pressable
              style={[s.resendVerifyBtn, resendBusy && s.resendVerifyBtnDisabled]}
              onPress={handleResendVerification}
              disabled={resendBusy}
            >
              {resendBusy ? (
                <ActivityIndicator color={estate.accent} size="small" />
              ) : (
                <Text style={s.resendVerifyText}>Resend verification email</Text>
              )}
            </Pressable>
          ) : null}

          <Pressable onPress={handlePickPhoto} disabled={photoBusy}>
            <Text style={s.changePhoto}>Add or change profile photo</Text>
          </Pressable>
        </View>

        <View style={estateStyles.card}>
          <Text style={s.fieldLabel}>Username</Text>
          <Text style={s.fieldValue}>{user?.username}</Text>
          <Text style={s.fieldLabel}>Email</Text>
          <Text style={s.fieldValue}>{user?.email}</Text>
          <Text style={s.fieldHint}>Email cannot be changed here.</Text>
        </View>

        <Pressable style={estateStyles.menuItem} onPress={openEdit}>
          <Text style={estateStyles.menuText}>Edit profile</Text>
          <Text style={estateStyles.menuChevron}>›</Text>
        </Pressable>

        <Pressable style={[estateStyles.menuItem, s.logout]} onPress={handleLogout}>
          <Text style={s.logoutText}>Log out</Text>
          <Text style={estateStyles.menuChevron}>›</Text>
        </Pressable>

        <View style={estateStyles.footer}>
          <Text style={estateStyles.footerText}>
            Amantillo client portal · Account settings
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={editOpen}
        animationType="slide"
        transparent
        onRequestClose={closeEdit}
      >
        <KeyboardAvoidingView
          style={s.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={s.modalScrim} onPress={closeEdit} />
          <View style={s.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={s.modalTitle}>Edit profile</Text>
              <ErrorBanner message={editError} />

              <Text style={s.inputLabel}>Username</Text>
              <TextInput
                style={s.input}
                value={editUsername}
                onChangeText={setEditUsername}
                autoCapitalize="none"
                placeholderTextColor={estate.sub}
              />

              <Text style={s.inputLabel}>Email</Text>
              <TextInput
                style={[s.input, s.inputDisabled]}
                value={user?.email ?? ''}
                editable={false}
                selectTextOnFocus={false}
              />
              <Text style={s.fieldHint}>Email is read-only.</Text>

              <Text style={s.modalSection}>Change password</Text>
              <Text style={s.fieldHint}>
                Leave blank to keep your current password.
              </Text>

              <Text style={s.inputLabel}>Current password</Text>
              <TextInput
                style={s.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                placeholderTextColor={estate.sub}
              />

              <Text style={s.inputLabel}>New password</Text>
              <TextInput
                style={s.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                placeholderTextColor={estate.sub}
              />

              <Text style={s.inputLabel}>Confirm new password</Text>
              <TextInput
                style={s.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                placeholderTextColor={estate.sub}
              />

              <View style={s.modalActions}>
                <Pressable
                  style={s.cancelBtn}
                  onPress={closeEdit}
                  disabled={saveBusy}
                >
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[
                    estateStyles.primaryBtn,
                    s.saveBtnFlex,
                    saveBusy && estateStyles.primaryBtnDisabled,
                  ]}
                  onPress={() => void handleSaveProfile()}
                  disabled={saveBusy}
                >
                  {saveBusy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={estateStyles.primaryBtnText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const AVATAR_SIZE = 88;

const s = StyleSheet.create({
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: estate.surface,
    borderRadius: estate.radius,
    borderWidth: 1,
    borderColor: estate.border,
    padding: 20,
    alignItems: 'center',
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: estate.gold,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: estate.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontSize: 32, fontWeight: '800' },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,41,66,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: estate.text,
    marginTop: 14,
  },
  profileEmail: { fontSize: 14, color: estate.sub, marginTop: 4 },
  statusRow: { marginTop: 12 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusVerified: { backgroundColor: estate.accentBg },
  statusPending: { backgroundColor: estate.goldBg },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  statusTextVerified: { color: estate.accent },
  statusTextPending: { color: estate.warn },
  resendVerifyBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: estate.accent,
    alignItems: 'center',
  },
  resendVerifyBtnDisabled: { opacity: 0.6 },
  resendVerifyText: { color: estate.accent, fontSize: 13, fontWeight: '700' },
  changePhoto: {
    fontSize: 14,
    fontWeight: '700',
    color: estate.gold,
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: estate.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  fieldValue: { fontSize: 16, fontWeight: '600', color: estate.text, marginTop: 4 },
  fieldHint: { fontSize: 12, color: estate.sub, marginTop: 4 },
  logout: { borderColor: '#FECACA', backgroundColor: estate.dangerBg },
  logoutText: { fontSize: 16, fontWeight: '700', color: estate.danger },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,41,66,0.5)',
  },
  modalScrim: { flex: 1 },
  modalCard: {
    backgroundColor: estate.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: estate.border,
    maxHeight: '88%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: estate.text,
    marginBottom: 12,
  },
  modalSection: {
    fontSize: 15,
    fontWeight: '800',
    color: estate.text,
    marginTop: 16,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: estate.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: estate.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: estate.text,
    backgroundColor: estate.bg,
  },
  inputDisabled: {
    backgroundColor: estate.goldBg,
    color: estate.sub,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: estate.border,
  },
  cancelBtnText: { fontWeight: '700', color: estate.text },
  saveBtnFlex: { flex: 1, marginTop: 0 },
});

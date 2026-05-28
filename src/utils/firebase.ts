import {
  getAnalytics,
  logEvent as logAnalyticsEvent,
  logScreenView as logAnalyticsScreenView,
  setAnalyticsCollectionEnabled,
  setUserId as setFirebaseAnalyticsUserId,
} from '@react-native-firebase/analytics';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  crash,
  getCrashlytics,
  log as logFirebaseCrashlytics,
  recordError,
  setUserId as setFirebaseCrashlyticsUserId,
} from '@react-native-firebase/crashlytics';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

type ErrorHandler = (error: Error, isFatal?: boolean) => void;
const DEFAULT_GOOGLE_WEB_CLIENT_ID =
  '670659193824-rr2o3n7i0ad162da29ktpubpqbj293c4.apps.googleusercontent.com';
export type AuthUser = FirebaseAuthTypes.User | null;
export type AuthCredential = FirebaseAuthTypes.UserCredential;
export type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;
export { GoogleSigninButton };

type GlobalWithErrorUtils = typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler?: () => ErrorHandler;
    setGlobalHandler?: (handler: ErrorHandler) => void;
  };
};

let isBootstrapped = false;

async function initializeAdMob(): Promise<void> {
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.PG,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });

  await mobileAds().initialize();
}

export function configureGoogleSignIn(): void {
  const webClientId = GOOGLE_WEB_CLIENT_ID || DEFAULT_GOOGLE_WEB_CLIENT_ID;

  GoogleSignin.configure({
    webClientId,
  });
}

export function bootstrapFirebase(): void {
  if (isBootstrapped) {
    return;
  }

  isBootstrapped = true;

  configureGoogleSignIn();

  const crashlytics = getCrashlytics();
  const errorUtils = (globalThis as GlobalWithErrorUtils).ErrorUtils;
  const defaultErrorHandler = errorUtils?.getGlobalHandler?.();

  void initializeAdMob().catch(error => {
    recordError(
      crashlytics,
      error instanceof Error ? error : new Error('AdMob initialization failed'),
      'AdMob initialization failed',
    );
  });

  errorUtils?.setGlobalHandler?.((error, isFatal) => {
    recordError(
      crashlytics,
      error,
      isFatal ? 'Fatal JavaScript error' : 'JavaScript error',
    );

    defaultErrorHandler?.(error, isFatal);
  });
}

export function logScreenView(screenName: string): Promise<void> {
  return logAnalyticsScreenView(getAnalytics(), {
    screen_name: screenName,
    screen_class: screenName,
  });
}

export function setAnalyticsUserId(userId: string | number | null): Promise<void> {
  return setFirebaseAnalyticsUserId(
    getAnalytics(),
    userId == null ? null : String(userId),
  );
}

export function logEvent(
  eventName: string,
  params?: AnalyticsEventParams,
): Promise<void> {
  return logAnalyticsEvent(getAnalytics(), eventName, params);
}

export function logLogin(method: string): Promise<void> {
  return logEvent('user_login', { method });
}

export function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  return setAnalyticsCollectionEnabled(getAnalytics(), enabled);
}

export function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthCredential> {
  return auth().signInWithEmailAndPassword(email, password);
}

export function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthCredential> {
  return auth().createUserWithEmailAndPassword(email, password);
}

export function sendPasswordReset(email: string): Promise<void> {
  return auth().sendPasswordResetEmail(email);
}

export async function signInWithGoogle(): Promise<AuthCredential> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  if (GoogleSignin.hasPreviousSignIn()) {
    await GoogleSignin.signOut();
  }

  const response = await GoogleSignin.signIn();
  const idToken = response.type === 'success' ? response.data.idToken : null;

  if (!idToken) {
    throw new Error('Google Sign-In failed: no idToken');
  }

  const credential = auth.GoogleAuthProvider.credential(idToken);
  return auth().signInWithCredential(credential);
}

export async function signOutFirebase(): Promise<void> {
  await auth().signOut();

  if (GoogleSignin.hasPreviousSignIn()) {
    await GoogleSignin.signOut();
  }
}

export function onFirebaseAuthStateChanged(
  callback: (user: AuthUser) => void,
): () => void {
  return auth().onAuthStateChanged(callback);
}

export function getCurrentFirebaseUser(): AuthUser {
  return auth().currentUser;
}

export function recordFirebaseError(error: Error, name?: string): void {
  recordError(getCrashlytics(), error, name);
}

export function setCrashlyticsUserId(userId: string): Promise<null> {
  return setFirebaseCrashlyticsUserId(getCrashlytics(), userId);
}

export function logCrashlytics(message: string): void {
  logFirebaseCrashlytics(getCrashlytics(), message);
}

export function testCrash(): void {
  crash(getCrashlytics());
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    error.code === statusCodes.SIGN_IN_CANCELLED
  );
}

export function isPlayServicesUnavailable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error != null &&
    'code' in error &&
    error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
  );
}

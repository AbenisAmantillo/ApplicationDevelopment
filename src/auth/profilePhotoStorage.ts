import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (userId: number) => `@amantillo/profile_photo_local/${userId}`;

/** Local URI when server upload is unavailable or pending sync. */
export async function getLocalProfilePhotoUri(
  userId: number,
): Promise<string | null> {
  return AsyncStorage.getItem(key(userId));
}

export async function setLocalProfilePhotoUri(
  userId: number,
  uri: string,
): Promise<void> {
  await AsyncStorage.setItem(key(userId), uri);
}

export async function clearLocalProfilePhotoUri(userId: number): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}

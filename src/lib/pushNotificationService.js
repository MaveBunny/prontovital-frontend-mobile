import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const PUSH_TOKEN_STORAGE_KEY = '@prontovital:push_token';

export async function registrarPushNotification() {
  try {
    if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function desativarPushNoBackend(expoPushToken) {
  try {
    if (!expoPushToken) return;
    await api.patch('/dispositivos/desativar', {
      expo_push_token: expoPushToken,
    });
  } catch {}
}

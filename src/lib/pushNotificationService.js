import api from './api';

export const PUSH_TOKEN_STORAGE_KEY = '@prontovital:push_token';

export async function registrarPushNotification() {
  return null;
}

export async function desativarPushNoBackend(expoPushToken) {
  try {
    if (!expoPushToken) return;
    await api.patch('/dispositivos/desativar', {
      expo_push_token: expoPushToken,
    });
  } catch {}
}

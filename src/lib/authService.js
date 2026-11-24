import AsyncStorage from "@react-native-async-storage/async-storage";
import api, {
  TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  setMemoryToken,
} from "./api";
import {
  PUSH_TOKEN_STORAGE_KEY,
  desativarPushNoBackend,
} from "./pushNotificationService";

export async function login({ email, senha }) {
  const loginId = String(email || "").trim();
  const payload = { email: loginId, senha };

  if (!loginId.includes("@")) {
    payload.cpf = loginId.replace(/\D/g, "");
  }

  const { data } = await api.post("/auth/login", payload);
  const token = data?.token;
  const refreshToken = data?.refresh_token;
  const usuario = data?.usuario;

  if (!token || !usuario) {
    throw new Error("Resposta de login inválida do servidor.");
  }

  setMemoryToken(token);

  const itemsToSave = [
    [TOKEN_STORAGE_KEY, token],
    [USER_STORAGE_KEY, JSON.stringify(usuario)],
  ];
  if (refreshToken) {
    itemsToSave.push([REFRESH_TOKEN_STORAGE_KEY, refreshToken]);
  }

  await AsyncStorage.multiSet(itemsToSave);

  return { token, refreshToken, usuario };
}

export async function logout() {
  try {
    const [[, refreshToken], [, pushToken]] = await AsyncStorage.multiGet([
      REFRESH_TOKEN_STORAGE_KEY,
      PUSH_TOKEN_STORAGE_KEY,
    ]);

    if (pushToken) {
      await desativarPushNoBackend(pushToken);
    }

    if (refreshToken) {
      await api.post("/auth/logout", { refresh_token: refreshToken });
    }
  } catch {
    // Mesmo se estiver offline no momento do logout, limpa a sessão local
  } finally {
    setMemoryToken(null);
    await AsyncStorage.multiRemove([
      TOKEN_STORAGE_KEY,
      REFRESH_TOKEN_STORAGE_KEY,
      USER_STORAGE_KEY,
      PUSH_TOKEN_STORAGE_KEY,
    ]);
  }
}

export async function carregarSessaoSalva() {
  try {
    const [[, token], [, userRaw]] = await AsyncStorage.multiGet([
      TOKEN_STORAGE_KEY,
      USER_STORAGE_KEY,
    ]);
    if (token && userRaw) {
      setMemoryToken(token);
      return { token, usuario: JSON.parse(userRaw) };
    }
  } catch {}
  return { token: null, usuario: null };
}

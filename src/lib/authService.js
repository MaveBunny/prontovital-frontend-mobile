import AsyncStorage from '@react-native-async-storage/async-storage';
import api, {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  setMemoryToken,
} from './api';

export async function login({ email, senha }) {
  const loginId = String(email || '').trim();
  const payload = { email: loginId, senha };

  if (!loginId.includes('@')) {
    payload.cpf = loginId.replace(/\D/g, '');
  }

  const { data } = await api.post('/auth/login', payload);
  const token = data?.token || data?.accessToken || data?.dados?.token;
  const usuario = data?.usuario || data?.user || data?.User || data;

  if (!token || !usuario) {
    throw new Error('Resposta de login inválida do servidor.');
  }

  setMemoryToken(token);
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));

  return { token, usuario };
}

export async function logout() {
  setMemoryToken(null);
  await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
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

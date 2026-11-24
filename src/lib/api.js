import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = '@prontovital:token';
export const USER_STORAGE_KEY = '@prontovital:user';

let memoryToken = null;
let onUnauthorizedCallback = null;

export function setMemoryToken(token) {
  memoryToken = token || null;
}

export function setOnUnauthorized(callback) {
  onUnauthorizedCallback = callback;
}

const baseURL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://prontovital-api.onrender.com'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = memoryToken || (await AsyncStorage.getItem(TOKEN_STORAGE_KEY));
  if (token) {
    memoryToken = token;
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLogin) {
      memoryToken = null;
      await AsyncStorage.multiRemove([TOKEN_STORAGE_KEY, USER_STORAGE_KEY]);
      onUnauthorizedCallback?.();
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_STORAGE_KEY = "@prontovital:token";
export const REFRESH_TOKEN_STORAGE_KEY = "@prontovital:refresh_token";
export const USER_STORAGE_KEY = "@prontovital:user";

let memoryToken = null;
let onUnauthorizedCallback = null;

export function setMemoryToken(token) {
  memoryToken = token || null;
}

export function setOnUnauthorized(callback) {
  onUnauthorizedCallback = callback;
}

const baseURL = (
  process.env.EXPO_PUBLIC_API_URL || "https://prontovital-api.onrender.com"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
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
    const originalRequest = error.config;
    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !isAuthRoute &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(
          REFRESH_TOKEN_STORAGE_KEY,
        );
        if (!refreshToken) throw new Error("Sem refresh token");

        // Chama o endpoint de rotação usando axios puro para evitar loop no interceptor
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        setMemoryToken(data.token);
        await AsyncStorage.multiSet([
          [TOKEN_STORAGE_KEY, data.token],
          [REFRESH_TOKEN_STORAGE_KEY, data.refresh_token],
          [USER_STORAGE_KEY, JSON.stringify(data.usuario)],
        ]);

        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch {
        memoryToken = null;
        await AsyncStorage.multiRemove([
          TOKEN_STORAGE_KEY,
          REFRESH_TOKEN_STORAGE_KEY,
          USER_STORAGE_KEY,
        ]);
        onUnauthorizedCallback?.();
      }
    }

    return Promise.reject(error);
  },
);

export default api;

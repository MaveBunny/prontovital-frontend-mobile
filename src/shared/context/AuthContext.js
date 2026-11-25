import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setOnUnauthorized } from "../../lib/api";
import {
  carregarSessaoSalva,
  login as loginService,
  logout as logoutService,
  USER_STORAGE_KEY,
} from "../../lib/authService";
import { registrarPushNotification } from "../../lib/pushNotificationService";

export const AuthContext = createContext(null);

const STORAGE_KEY_FALLBACK = USER_STORAGE_KEY || "@prontovital:user";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [autenticado, setAutenticado] = useState(false);
  const [inicializando, setInicializando] = useState(true);
  const [carregando, setCarregando] = useState(false);

  const logout = useCallback(async () => {
    await logoutService();
    setUsuario(null);
    setAutenticado(false);
  }, []);

  useEffect(() => {
    setOnUnauthorized(logout);

    carregarSessaoSalva()
      .then((sessao) => {
        if (sessao.token && sessao.usuario) {
          setUsuario(sessao.usuario);
          setAutenticado(true);
          registrarPushNotification();
        }
      })
      .finally(() => setInicializando(false));
  }, [logout]);

  const login = useCallback(async (credentials) => {
    setCarregando(true);
    try {
      const data = await loginService(credentials);
      setUsuario(data.usuario);
      setAutenticado(true);
      registrarPushNotification();
      return data;
    } finally {
      setCarregando(false);
    }
  }, []);

  const atualizarUsuarioLocal = useCallback(async (novosDados) => {
    let usuarioAtualizado = null;

    setUsuario((prev) => {
      usuarioAtualizado = { ...(prev || {}), ...novosDados };
      return usuarioAtualizado;
    });

    if (usuarioAtualizado && typeof STORAGE_KEY_FALLBACK === "string") {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY_FALLBACK,
          JSON.stringify(usuarioAtualizado),
        );
      } catch (e) {
        console.warn("Não foi possível salvar usuário no storage:", e?.message);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado,
        inicializando,
        carregando,
        login,
        logout,
        atualizarUsuarioLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}

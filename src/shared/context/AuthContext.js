import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { setOnUnauthorized } from "../../lib/api";
import {
  carregarSessaoSalva,
  login as loginService,
  logout as logoutService,
} from "../../lib/authService";
import { registrarPushNotification } from "../../lib/pushNotificationService";

export const AuthContext = createContext(null);

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

  return (
    <AuthContext.Provider
      value={{ usuario, autenticado, inicializando, carregando, login, logout }}
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

import { Platform, NativeModules } from 'react-native';

/**
 * Descobre automaticamente o IP do host que está servindo o bundle do Expo (ideal para Expo Go no celular).
 */
function getDevHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

const detectedHost = getDevHost();

/**
 * CONFIGURAÇÃO DA BASE URL DA API REST (prontovital-api)
 *
 * - Expo Go (dispositivo físico): detecta automaticamente o IP da máquina na rede Wi-Fi (ex: 192.168.1.4:3000)
 * - Emulador Android: 'http://10.0.2.2:3000'
 * - Simulador iOS / Navegador Web: 'http://localhost:3000'
 */
const DEFAULT_API_URL = detectedHost
  ? `http://${detectedHost}:3000`
  : Platform.select({
      android: 'http://10.0.2.2:3000',
      ios: 'http://localhost:3000',
      default: 'http://localhost:3000',
    });

// Permite customizar dinamicamente se necessário
let currentBaseUrl = DEFAULT_API_URL;
let currentAuthToken = null;

export const setApiBaseUrl = (url) => {
  if (url) currentBaseUrl = url;
};

export const getApiBaseUrl = () => currentBaseUrl;

export const setAuthToken = (token) => {
  currentAuthToken = token;
};

export const getAuthToken = () => currentAuthToken;

/**
 * Cliente HTTP centralizado utilizando Fetch API nativa do React Native.
 */
async function request(endpoint, options = {}) {
  const url = `${currentBaseUrl}${endpoint}`;
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (currentAuthToken) {
    headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (_) {
        errorData = { message: response.statusText || 'Erro na requisição' };
      }
      const error = new Error(errorData?.erro || errorData?.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Se resposta vazia (204)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn(`[API] Falha ao chamar ${endpoint}:`, err.message);
    throw err;
  }
}

/**
 * Serviços de Clínicas
 */
export const clinicaService = {
  /**
   * Consulta clínicas com filtro opcional por busca (nome da clínica ou bairro)
   * GET /clinicas?busca=...
   */
  async listar(busca = '') {
    const query = busca?.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : '';
    return await request(`/clinicas${query}`);
  },

  /**
   * Consulta clínica específica por ID
   * GET /clinicas/:id_clinica
   */
  async obterPorId(idClinica) {
    return await request(`/clinicas/${idClinica}`);
  },
};

/**
 * Serviços de Profissionais
 */
export const profissionalService = {
  /**
   * Consulta profissionais com filtros opcionais
   * GET /profissionais?busca=...&id_especialidade=...
   */
  async listar({ busca = '', idEspecialidade = '' } = {}) {
    const params = new URLSearchParams();
    if (busca?.trim()) params.append('busca', busca.trim());
    if (idEspecialidade) params.append('id_especialidade', idEspecialidade);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await request(`/profissionais${queryString}`);
  },

  /**
   * Obtém a contagem real de profissionais vinculados por ID de clínica.
   * Retorna um mapa { [id_clinica]: count }
   */
  async obterContagemPorClinica() {
    try {
      const profissionais = await request('/profissionais');
      const contagem = {};

      if (Array.isArray(profissionais)) {
        profissionais.forEach((prof) => {
          if (Array.isArray(prof.Clinicas)) {
            prof.Clinicas.forEach((c) => {
              const id = c.id_clinica;
              contagem[id] = (contagem[id] || 0) + 1;
            });
          }
        });
      }

      return contagem;
    } catch (error) {
      console.warn('[API] Erro ao obter contagem de profissionais por clínica:', error.message);
      return {};
    }
  },
};

export default {
  clinica: clinicaService,
  profissional: profissionalService,
  setApiBaseUrl,
  getApiBaseUrl,
  setAuthToken,
  getAuthToken,
};

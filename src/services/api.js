import api, { setMemoryToken } from '../lib/api';

let currentBaseUrl = api.defaults.baseURL;

export const setApiBaseUrl = (url) => {
  if (url) {
    currentBaseUrl = url;
    api.defaults.baseURL = url;
  }
};

export const getApiBaseUrl = () => currentBaseUrl;

export const setAuthToken = (token) => {
  setMemoryToken(token);
};

export const getAuthToken = () => null;

export const clinicaService = {
  async listar(busca = '') {
    const params = busca?.trim() ? { busca: busca.trim() } : {};
    const { data } = await api.get('/clinicas', { params });
    return data;
  },

  async obterPorId(idClinica) {
    const { data } = await api.get(`/clinicas/${idClinica}`);
    return data;
  },
};

export const profissionalService = {
  async listar({ busca = '', idEspecialidade = '' } = {}) {
    const params = {};
    if (busca?.trim()) params.busca = busca.trim();
    if (idEspecialidade) params.id_especialidade = idEspecialidade;
    const { data } = await api.get('/profissionais', { params });
    return data;
  },

  async obterContagemPorClinica() {
    try {
      const { data: profissionais } = await api.get('/profissionais');
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
    } catch {
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

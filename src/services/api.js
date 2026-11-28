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
  async obterPorId(idProfissional) {
    const { data } = await api.get(`/profissionais/${idProfissional}`);
    return data;
  },

  async listar({ busca = '', idEspecialidade = '' } = {}) {
    const params = {};
    if (busca?.trim()) params.busca = busca.trim();
    if (idEspecialidade) params.id_especialidade = idEspecialidade;
    const { data } = await api.get('/profissionais', { params });
    return data;
  },

  async listarAgendamentos(idProfissional) {
    const { data } = await api.get(
      `/profissionais/${idProfissional}/agendamentos`,
    );
    if (!Array.isArray(data)) {
      throw new Error('A API não devolveu a lista de agendamentos.');
    }
    return data;
  },

  async obterResumoPorClinica() {
    const { data: profissionais } = await api.get('/profissionais');
    const resumo = {};

    if (Array.isArray(profissionais)) {
      profissionais.forEach((prof) => {
        const nomeEspecialidade = prof.Especialidade?.nome;
        const nomeProfissional = prof.User?.nome;
        if (Array.isArray(prof.Clinicas)) {
          prof.Clinicas.forEach((c) => {
            const id = c.id_clinica;
            if (!resumo[id]) {
              resumo[id] = { total: 0, especialidades: [], profissionais: [] };
            }
            resumo[id].total += 1;
            if (
              nomeEspecialidade &&
              !resumo[id].especialidades.includes(nomeEspecialidade)
            ) {
              resumo[id].especialidades.push(nomeEspecialidade);
            }
            if (
              nomeProfissional &&
              !resumo[id].profissionais.includes(nomeProfissional)
            ) {
              resumo[id].profissionais.push(nomeProfissional);
            }
          });
        }
      });
    }

    return resumo;
  },

  async obterContagemPorClinica() {
    const resumo = await this.obterResumoPorClinica();
    const contagem = {};
    Object.keys(resumo).forEach((id) => {
      contagem[id] = resumo[id].total;
    });
    return contagem;
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

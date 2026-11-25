import api, { setMemoryToken } from "../lib/api";

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

/**
 * Serviços de Clínicas integrados à instância autenticada do Axios (src/lib/api.js).
 */
export const clinicaService = {
  /**
   * Consulta clínicas com filtro opcional por busca (nome da clínica ou bairro).
   * GET /clinicas?busca=...
   */
  async listar(busca = "") {
    const params = busca?.trim() ? { busca: busca.trim() } : {};
    const { data } = await api.get("/clinicas", { params });
    return data;
  },

  /**
   * Consulta clínica específica por ID.
   * GET /clinicas/:id_clinica
   */
  async obterPorId(idClinica) {
    const { data } = await api.get(`/clinicas/${idClinica}`);
    return data;
  },
};

/**
 * Serviços de Profissionais integrados à instância autenticada do Axios (src/lib/api.js).
 */
export const profissionalService = {
  /**
   * Consulta profissionais com filtros opcionais.
   * GET /profissionais?busca=...&id_especialidade=...
   */
  async listar({ busca = "", idEspecialidade = "" } = {}) {
    const params = {};
    if (busca?.trim()) params.busca = busca.trim();
    if (idEspecialidade) params.id_especialidade = idEspecialidade;
    const { data } = await api.get("/profissionais", { params });
    return data;
  },

  /**
   * Obtém a contagem real de profissionais e suas especialidades por ID de clínica.
   * Retorna um mapa { [id_clinica]: { total: number, especialidades: string[] } }.
   */
  async obterResumoPorClinica() {
    try {
      const profissionais = await this.listar();
      const resumo = {};

      if (Array.isArray(profissionais)) {
        profissionais.forEach((prof) => {
          const nomeEspecialidade = prof.Especialidade?.nome;
          if (Array.isArray(prof.Clinicas)) {
            prof.Clinicas.forEach((c) => {
              const id = c.id_clinica;
              if (!resumo[id]) {
                resumo[id] = { total: 0, especialidades: [] };
              }
              resumo[id].total += 1;
              if (
                nomeEspecialidade &&
                !resumo[id].especialidades.includes(nomeEspecialidade)
              ) {
                resumo[id].especialidades.push(nomeEspecialidade);
              }
            });
          }
        });
      }

      return resumo;
    } catch (error) {
      console.warn(
        "[API] Erro ao obter resumo de profissionais por clínica:",
        error.message,
      );
      return {};
    }
  },

  /**
   * Obtém apenas a contagem de profissionais por ID de clínica.
   * Retorna um mapa { [id_clinica]: number }.
   */
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

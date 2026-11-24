import api from './api';

async function consultarLista(rota, params, signal) {
  const { data } = await api.get(rota, { params, signal });
  if (!Array.isArray(data)) throw new Error('A API não devolveu uma lista.');
  return data;
}

export function listarEspecialidades(signal) {
  return consultarLista('/especialidades', {}, signal);
}

export function listarProfissionais({ busca = '', idEspecialidade = null }, signal) {
  const params = {};
  if (busca.trim()) params.busca = busca.trim();
  if (idEspecialidade != null) params.id_especialidade = idEspecialidade;
  return consultarLista('/profissionais', params, signal);
}

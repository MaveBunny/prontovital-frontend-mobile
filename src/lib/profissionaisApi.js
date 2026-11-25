import api from './api';

async function consultarLista(rota, params, signal) {
  const { data } = await api.get(rota, { params, signal });
  if (!Array.isArray(data)) throw new Error('A API não devolveu uma lista.');
  return data;
}

export function listarEspecialidades(signal) {
  return consultarLista('/especialidades', {}, signal);
}

export function listarClinicas(signal) {
  return consultarLista('/clinicas', {}, signal);
}

export function listarProfissionais({ busca = '', idEspecialidade = null }, signal) {
  const params = {};
  if (busca.trim()) params.busca = busca.trim();
  if (idEspecialidade != null) params.id_especialidade = idEspecialidade;
  return consultarLista('/profissionais', params, signal);
}

export async function cadastrarProfissional(payload) {
  const { data } = await api.post('/usuarios', payload);
  return data;
}

export async function vincularEspecialidadeProfissional(idProfissional, idEspecialidade) {
  const { data } = await api.patch(
    `/profissionais/${idProfissional}/especialidade/${idEspecialidade}`
  );
  return data;
}

export async function vincularProfissionalClinica(idClinica, idProfissional) {
  const { data } = await api.patch(
    `/clinicas/${idClinica}/profissionais/${idProfissional}`
  );
  return data;
}

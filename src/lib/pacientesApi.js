import api from './api';

export async function cadastrarPaciente(payload) {
  const { data } = await api.post('/usuarios', payload);
  return data;
}

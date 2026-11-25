import api from "./api";

export async function cadastrarPaciente(payload) {
  const { data } = await api.post("/usuarios", payload);
  return data;
}

export async function resolverIdPaciente(usuario) {
  const idPacienteDireto =
    usuario?.id_paciente || usuario?.paciente?.id_paciente;

  if (idPacienteDireto) {
    return idPacienteDireto;
  }

  // Plano B caso o login retorne apenas id_user sem id_paciente
  const { data: lista } = await api.get("/pacientes");
  const pacientes = Array.isArray(lista) ? lista : lista?.pacientes || [];
  const encontrado = pacientes.find(
    (p) =>
      p.id_user === usuario?.id_user ||
      p.User?.id_user === usuario?.id_user ||
      p.User?.email === usuario?.email,
  );

  return encontrado?.id_paciente || null;
}

export async function buscarPerfilPaciente(usuario) {
  const idPaciente = await resolverIdPaciente(usuario);
  if (!idPaciente) return null;

  const { data } = await api.get(`/pacientes/${idPaciente}`);
  return data;
}

export async function atualizarPerfilUsuario(payload) {
  const { data } = await api.patch("/usuarios/perfil", payload);
  return data;
}

export async function cancelarContaUsuario() {
  const { data } = await api.patch("/usuarios/perfil/cancelar");
  return data;
}

export async function buscarAgendamentosPaciente(usuario) {
  const idPaciente = await resolverIdPaciente(usuario);
  if (!idPaciente) return { idPaciente: null, agendamentos: [] };

  const { data } = await api.get(`/pacientes/${idPaciente}/agendamentos`);
  const agendamentos = Array.isArray(data) ? data : data?.agendamentos || [];
  return { idPaciente, agendamentos };
}

export async function cancelarAgendamentoPaciente(idPaciente, idAgendamento) {
  const { data } = await api.patch(
    `/pacientes/${idPaciente}/agendamentos/${idAgendamento}/cancelar`,
  );
  return data;
}

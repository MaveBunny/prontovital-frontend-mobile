import api from "./api";

export async function cadastrarPaciente(payload) {
  const { data } = await api.post("/usuarios", payload);
  return data;
}

export async function buscarPerfilPaciente(usuario) {
  const idPacienteDireto =
    usuario?.id_paciente || usuario?.paciente?.id_paciente;

  if (idPacienteDireto) {
    const { data } = await api.get(`/pacientes/${idPacienteDireto}`);
    return data;
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

  if (encontrado?.id_paciente) {
    const { data } = await api.get(`/pacientes/${encontrado.id_paciente}`);
    return data;
  }

  return null;
}

export async function atualizarPerfilUsuario(payload) {
  const { data } = await api.patch("/usuarios/perfil", payload);
  return data;
}

export async function cancelarContaUsuario() {
  const { data } = await api.patch("/usuarios/perfil/cancelar");
  return data;
}

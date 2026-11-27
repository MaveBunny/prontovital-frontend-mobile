import api from "../../../lib/api";

function exigirLista(data, mensagem) {
  if (!Array.isArray(data)) {
    throw new Error(mensagem);
  }
  return data;
}

export async function buscarClinica(idClinica) {
  const { data } = await api.get(`/clinicas/${idClinica}`);
  return data;
}

export async function listarMedicosClinica(idClinica) {
  const { data } = await api.get("/profissionais");
  const medicosClinica = exigirLista(
    data,
    "A API não devolveu a lista de médicos.",
  ).filter(
    (medico) =>
      Array.isArray(medico.Clinicas) &&
      medico.Clinicas.some(
        (clinica) => String(clinica.id_clinica) === String(idClinica),
      ),
  );
  const idsEspecialidade = [
    ...new Set(
      medicosClinica
        .map((medico) => medico.id_especialidade)
        .filter((id) => id != null),
    ),
  ];

  const respostasPorEspecialidade = await Promise.all(
    idsEspecialidade.map((id) =>
      api.get("/profissionais", { params: { id_especialidade: id } }),
    ),
  );
  const especialidadePorMedico = new Map();

  respostasPorEspecialidade.forEach(({ data: profissionais }) => {
    exigirLista(
      profissionais,
      "A API não devolveu médicos com especialidade.",
    ).forEach((medico) => {
      if (medico.Especialidade) {
        especialidadePorMedico.set(
          String(medico.id_profissional),
          medico.Especialidade,
        );
      }
    });
  });

  return medicosClinica.map((medico) => ({
    ...medico,
    Especialidade:
      medico.Especialidade ||
      especialidadePorMedico.get(String(medico.id_profissional)) ||
      null,
  }));
}

export async function listarAgendamentosClinica(idClinica) {
  const { data } = await api.get(`/clinicas/${idClinica}/agendamentos`);
  return exigirLista(data, "A API não devolveu a lista de agendamentos.");
}

export async function listarHorariosMedico(idProfissional) {
  const { data } = await api.get(`/profissionais/${idProfissional}/horarios`);
  return exigirLista(data, "A API não devolveu os horários do médico.");
}

export async function criarHorariosMedico(idProfissional, horario) {
  const { data } = await api.post(
    `/profissionais/${idProfissional}/horarios`,
    horario,
  );
  return exigirLista(data, "A API não confirmou o cadastro dos horários.");
}

export async function cancelarAgendamentoClinica(agendamento) {
  const { data } = await api.patch(
    `/pacientes/${agendamento.id_paciente}/agendamentos/${agendamento.id_agendamento}/cancelar`,
  );
  return data;
}


export const MODOS_AGENDA = ["Semana", "Mês"];
export const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function dataIso(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function dataDoAgendamento(item) {
  return String(
    item.data_agendamento || item.dataHora || item.data_hora || "",
  ).slice(0, 10);
}

export function formatarData(valor, opcoes) {
  const [ano, mes, dia] = String(valor || "")
    .slice(0, 10)
    .split("-")
    .map(Number);
  if (!ano || !mes || !dia) return "--/--/----";
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", opcoes);
}

export function obterDiasCalendario(dataSelecionada, modo) {
  const referencia = new Date(
    dataSelecionada.getFullYear(),
    dataSelecionada.getMonth(),
    dataSelecionada.getDate(),
  );

  let inicio;
  let quantidade;
  if (modo === "Semana") {
    inicio = new Date(referencia);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    quantidade = 7;
  } else {
    inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    quantidade = 42;
  }

  return Array.from({ length: quantidade }, (_, indice) => {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + indice);
    return dia;
  });
}

export function tituloPeriodo(dataSelecionada, modo) {
  if (modo === "Semana") {
    const inicio = new Date(dataSelecionada);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    const inicioFormatado = inicio.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
    const fimFormatado = fim.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${inicioFormatado} – ${fimFormatado}`;
  }
  return dataSelecionada.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function statusAgendamento(status) {
  const normalizado = String(status || "").trim().toLowerCase();
  if (normalizado === "cancelado") return "Cancelado";
  if (
    normalizado === "concluído" ||
    normalizado === "concluido" ||
    normalizado === "realizado"
  ) {
    return "Concluído";
  }
  if (normalizado === "pendente" || normalizado === "agendado") {
    return "Pendente";
  }
  return "Confirmado";
}

export function mensagemErro(error, fallback) {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.erro ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../../components/shared/AppHeader";
import { useAuth } from "../../../shared/context/AuthContext";
import { colors } from "../../../shared/theme/colors";
import {
  buscarClinica,
  cancelarAgendamentoClinica,
  criarHorariosMedico,
  listarAgendamentosClinica,
  listarHorariosMedico,
  listarMedicosClinica,
} from "../services/clinicaService";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_COMPLETOS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const OPCOES_HORARIO = Array.from({ length: 48 }, (_, indice) => {
  const minutos = indice * 30;
  const hora = String(Math.floor(minutos / 60)).padStart(2, "0");
  const minuto = String(minutos % 60).padStart(2, "0");
  return `${hora}:${minuto}`;
});
const ROTAS_CLINICA = {
  ClinicaVisaoGeral: "Visão Geral",
  ClinicaAgenda: "Agenda / Calendário",
  ClinicaAgendamentos: "Agendamentos",
  ClinicaMedicos: "Médicos",
  ClinicaDisponibilidade: "Disponibilidade",
  ClinicaPerfil: "Perfil da Clínica",
};

function mensagemErro(error, fallback) {
  return (
    error?.response?.data?.erro ||
    error?.response?.data?.mensagem ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function dataIso(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataLocal(valor) {
  const parteData = String(valor || "").split("T")[0];
  const [ano, mes, dia] = parteData.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia);
}

function formatarData(valor, opcoes = {}) {
  const data = dataLocal(valor);
  return data
    ? data.toLocaleDateString("pt-BR", opcoes)
    : "--/--/----";
}

function formatarHora(valor) {
  return valor ? String(valor).slice(0, 5) : "--:--";
}

function formatarTelefone(valor) {
  const digitos = String(valor || "").replace(/\D/g, "");
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return valor || "Não informado";
}

function statusAgendamento(status) {
  const normalizado = String(status || "").trim().toLowerCase();
  if (normalizado === "cancelado") return "Cancelado";
  if (normalizado === "concluído" || normalizado === "concluido" || normalizado === "realizado") {
    return "Concluído";
  }
  if (normalizado === "pendente" || normalizado === "agendado") {
    return "Pendente";
  }
  return "Confirmado";
}

function minutosHora(valor) {
  const [hora, minuto] = String(valor).split(":").map(Number);
  return hora * 60 + minuto;
}

function diasDoCalendario(data, modo) {
  const referencia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  let inicio;
  let quantidade;

  if (modo === "Semana") {
    inicio = new Date(referencia);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    quantidade = 7;
  } else {
    inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    quantidade = 42;
  }

  return Array.from({ length: quantidade }, (_, indice) => {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + indice);
    return dia;
  });
}

function tituloMes(data) {
  return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function CartaoMetrica({ titulo, valor, icone, cor }) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: cor }]}>
        <Ionicons name={icone} size={19} color={colors.primary} />
      </View>
      <Text style={styles.metricValue}>{valor}</Text>
      <Text style={styles.metricLabel}>{titulo}</Text>
    </View>
  );
}

function CaixaVazia({ texto }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{texto}</Text>
    </View>
  );
}

function CartaoAgendamento({ agendamento, onCancelar, mostrarData = true }) {
  const status = statusAgendamento(agendamento.status);
  const cancelado = status === "Cancelado";
  const paciente = agendamento.Paciente?.User?.nome || "Paciente";
  const medico = agendamento.Profissional?.User?.nome || "Médico";
  const especialidade = agendamento.Profissional?.Especialidade?.nome;

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentTop}>
        <View style={styles.appointmentTime}>
          <Text style={styles.appointmentHour}>
            {formatarHora(agendamento.horario_agendamento)}
          </Text>
          {mostrarData ? (
            <Text style={styles.appointmentDate}>
              {formatarData(agendamento.data_agendamento)}
            </Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.statusPill,
            cancelado ? styles.statusCancelled : styles.statusConfirmed,
          ]}
        >
          {status}
        </Text>
      </View>
      <Text style={styles.appointmentPatient}>{paciente}</Text>
      <Text style={styles.appointmentDetail}>
        {medico}
        {especialidade ? ` · ${especialidade}` : ""}
      </Text>
      {!cancelado && onCancelar ? (
        <TouchableOpacity
          style={styles.textAction}
          onPress={() => onCancelar(agendamento)}
          accessibilityRole="button"
        >
          <Ionicons name="close-circle-outline" size={17} color={colors.error} />
          <Text style={styles.textActionDanger}>Cancelar agendamento</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function iniciaisNome(nome) {
  return String(nome || "Médico")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
}

function VisaoGeral({ clinica, medicos, agendamentos, carregando, navegar }) {
  const hoje = dataIso();
  const mesAtual = hoje.slice(0, 7);
  const ativos = agendamentos.filter(
    (item) => statusAgendamento(item.status) !== "Cancelado",
  );
  const recentes = [...agendamentos]
    .sort((a, b) => {
      const dataA = new Date(a.createdAt || a.data_agendamento).getTime();
      const dataB = new Date(b.createdAt || b.data_agendamento).getTime();
      return dataB - dataA;
    })
    .slice(0, 5);
  const confirmados = ativos.filter(
    (item) => statusAgendamento(item.status) === "Confirmado",
  ).length;
  const nome = clinica?.User?.nome || clinica?.nome || "Clínica";

  return (
    <>
      <View style={styles.pageHeading}>
        <Text style={styles.pageTitle}>Visão Geral</Text>
        <Text style={styles.pageSubtitle}>{nome}</Text>
      </View>
      <View style={styles.metricGrid}>
        <CartaoMetrica
          titulo="Agendamentos hoje"
          valor={ativos.filter((item) => String(item.data_agendamento).slice(0, 10) === hoje).length}
          icone="calendar-outline"
          cor="#EFF6FF"
        />
        <CartaoMetrica
          titulo="Médicos vinculados"
          valor={medicos.length}
          icone="people-outline"
          cor="#ECFDF5"
        />
        <CartaoMetrica
          titulo="Confirmados"
          valor={confirmados}
          icone="checkmark-circle-outline"
          cor="#F0FDF4"
        />
        <CartaoMetrica
          titulo="Total no período"
          valor={agendamentos.filter((item) => String(item.data_agendamento).slice(0, 7) === mesAtual).length}
          icone="stats-chart-outline"
          cor="#FEF3C7"
        />
      </View>
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionTitle}>Agendamentos recentes</Text>
        <TouchableOpacity onPress={() => navegar("ClinicaAgendamentos")}>
          <Text style={styles.linkText}>Ver todos</Text>
        </TouchableOpacity>
      </View>
      {carregando ? (
        <ActivityIndicator color={colors.primary} style={styles.inlineLoader} />
      ) : recentes.length ? (
        recentes.map((item) => (
          <CartaoAgendamento key={item.id_agendamento} agendamento={item} />
        ))
      ) : (
        <CaixaVazia texto="Ainda não há agendamentos para esta clínica." />
      )}
    </>
  );
}

function Agenda({ agendamentos }) {
  const [modo, setModo] = useState("Semana");
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());
  const dias = useMemo(() => diasDoCalendario(diaSelecionado, modo), [diaSelecionado, modo]);
  const isoSelecionado = dataIso(diaSelecionado);
  const agendamentosDoDia = agendamentos
    .filter((item) => String(item.data_agendamento).slice(0, 10) === isoSelecionado)
    .sort((a, b) =>
      String(a.horario_agendamento).localeCompare(String(b.horario_agendamento)),
    );

  function moverPeriodo(direcao) {
    const proxima = new Date(diaSelecionado);
    if (modo === "Semana") {
      proxima.setDate(proxima.getDate() + direcao * 7);
    } else {
      const diaDoMes = proxima.getDate();
      proxima.setDate(1);
      proxima.setMonth(proxima.getMonth() + direcao);
      proxima.setDate(
        Math.min(
          diaDoMes,
          new Date(proxima.getFullYear(), proxima.getMonth() + 1, 0).getDate(),
        ),
      );
    }
    setDiaSelecionado(proxima);
  }

  return (
    <>
      <View style={styles.pageHeading}>
        <Text style={styles.pageTitle}>Agenda / Calendário</Text>
        <Text style={styles.pageSubtitle}>Consultas agendadas pelos pacientes</Text>
      </View>
      <View style={styles.segmentRow}>
        {["Semana", "Mês"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.segmentButton, modo === item && styles.segmentButtonActive]}
            onPress={() => setModo(item)}
          >
            <Text style={[styles.segmentText, modo === item && styles.segmentTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.calendarCard}>
        <View style={styles.calendarNav}>
          <TouchableOpacity onPress={() => moverPeriodo(-1)} accessibilityLabel="Período anterior">
            <Ionicons name="chevron-back" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.calendarTitle}>{tituloMes(diaSelecionado)}</Text>
          <TouchableOpacity onPress={() => moverPeriodo(1)} accessibilityLabel="Próximo período">
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <View style={styles.calendarGrid}>
          {DIAS_SEMANA.map((dia) => (
            <Text key={dia} style={styles.calendarWeekday}>{dia}</Text>
          ))}
          {dias.map((dia) => {
            const isoDia = dataIso(dia);
            const selecionado = isoDia === isoSelecionado;
            const doMes = dia.getMonth() === diaSelecionado.getMonth();
            const temAgendamento = agendamentos.some(
              (item) =>
                String(item.data_agendamento).slice(0, 10) === isoDia &&
                statusAgendamento(item.status) !== "Cancelado",
            );
            return (
              <TouchableOpacity
                key={isoDia}
                style={styles.calendarDay}
                onPress={() => setDiaSelecionado(dia)}
                accessibilityRole="button"
                accessibilityLabel={formatarData(isoDia)}
              >
                <View style={[styles.calendarDayNumber, selecionado && styles.calendarDaySelected]}>
                  <Text
                    style={[
                      styles.calendarDayText,
                      !doMes && styles.calendarDayOutside,
                      selecionado && styles.calendarDayTextSelected,
                    ]}
                  >
                    {dia.getDate()}
                  </Text>
                </View>
                {temAgendamento ? <View style={styles.calendarDot} /> : <View style={styles.calendarDotSpace} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Text style={styles.sectionTitle}>
        Consultas de {formatarData(isoSelecionado)}
      </Text>
      {agendamentosDoDia.length ? (
        agendamentosDoDia.map((item) => (
          <CartaoAgendamento
            key={item.id_agendamento}
            agendamento={item}
            mostrarData={false}
          />
        ))
      ) : (
        <CaixaVazia texto="Nenhuma consulta agendada para este dia." />
      )}
    </>
  );
}

function Agendamentos({ agendamentos, aoCancelar }) {
  const ordenados = [...agendamentos].sort((a, b) => {
    const dataA = `${a.data_agendamento} ${a.horario_agendamento}`;
    const dataB = `${b.data_agendamento} ${b.horario_agendamento}`;
    return dataB.localeCompare(dataA);
  });

  return (
    <>
      <View style={styles.pageHeading}>
        <Text style={styles.pageTitle}>Agendamentos</Text>
        <Text style={styles.pageSubtitle}>Consultas dos médicos vinculados à clínica</Text>
      </View>
      {ordenados.length ? (
        ordenados.map((item) => (
          <CartaoAgendamento
            key={item.id_agendamento}
            agendamento={item}
            onCancelar={aoCancelar}
          />
        ))
      ) : (
        <CaixaVazia texto="Nenhum agendamento encontrado." />
      )}
    </>
  );
}

function Medicos({ medicos, nomeClinica }) {
  return (
    <>
      <View style={styles.pageHeading}>
        <Text style={styles.pageTitle}>Médicos</Text>
        <Text style={styles.pageSubtitle}>
          {nomeClinica
            ? `Profissionais vinculados a ${nomeClinica}.`
            : "Profissionais vinculados à clínica."}
        </Text>
      </View>
      {medicos.length ? (
        medicos.map((medico) => {
          const crm = medico.uf_registro && medico.registro_profissional
            ? `${medico.uf_registro}-${medico.registro_profissional}`
            : medico.registro_profissional || "Não informado";
          const nome = medico.User?.nome || "Médico";
          return (
            <View key={medico.id_profissional} style={styles.doctorCard}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorInitials}>{iniciaisNome(nome)}</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{nome}</Text>
                <Text style={styles.doctorDetail}>CRM: {crm}</Text>
                <Text style={styles.doctorSpecialty}>
                  {medico.Especialidade?.nome || "Especialidade não informada"}
                </Text>
              </View>
              <Text style={styles.activePill}>Ativo</Text>
            </View>
          );
        })
      ) : (
        <CaixaVazia texto="Nenhum médico vinculado a esta clínica." />
      )}
    </>
  );
}

function SeletorDisponibilidade({
  label,
  value,
  options,
  onChange,
  placeholder,
}) {
  const [aberto, setAberto] = useState(false);
  const valorSelecionado = options.find(
    (opcao) => String(opcao.value) === String(value),
  );

  return (
    <View style={styles.availabilityFieldGroup}>
      <Text style={styles.availabilityFieldLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.availabilityDropdown}
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${valorSelecionado?.label || placeholder}`}
      >
        <Text
          style={[
            styles.availabilityDropdownText,
            !valorSelecionado && styles.availabilityDropdownPlaceholder,
          ]}
        >
          {valorSelecionado?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={22} color={colors.textPlaceholder} />
      </TouchableOpacity>
      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <View style={styles.selectorModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setAberto(false)}
            accessibilityLabel="Fechar opções"
          />
          <View style={styles.selectorModalCard}>
            <Text style={styles.selectorModalTitle}>Selecione {label.toLowerCase()}</Text>
            <ScrollView style={styles.selectorOptions}>
              {options.map((opcao) => {
                const selecionada = String(opcao.value) === String(value);
                return (
                  <TouchableOpacity
                    key={String(opcao.value)}
                    style={[
                      styles.selectorOption,
                      selecionada && styles.selectorOptionSelected,
                    ]}
                    onPress={() => {
                      onChange(opcao.value);
                      setAberto(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectorOptionText,
                        selecionada && styles.selectorOptionTextSelected,
                      ]}
                    >
                      {opcao.label}
                    </Text>
                    {selecionada ? (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Disponibilidade({ medicos }) {
  const [idMedico, setIdMedico] = useState(
    medicos[0] ? String(medicos[0].id_profissional) : "",
  );
  const [horarios, setHorarios] = useState([]);
  const [dia, setDia] = useState(null);
  const [inicio, setInicio] = useState("08:00");
  const [fim, setFim] = useState("17:00");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!medicos.some((item) => String(item.id_profissional) === idMedico)) {
      setIdMedico(medicos[0] ? String(medicos[0].id_profissional) : "");
    }
  }, [medicos, idMedico]);

  const carregarHorarios = useCallback(async () => {
    if (!idMedico) {
      setHorarios([]);
      return;
    }
    setCarregando(true);
    setErro("");
    try {
      setHorarios(await listarHorariosMedico(idMedico));
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar os horários."));
    } finally {
      setCarregando(false);
    }
  }, [idMedico]);

  useEffect(() => {
    carregarHorarios();
  }, [carregarHorarios]);

  async function adicionarHorario() {
    setErro("");
    if (dia === null) {
      setErro("Selecione o dia da semana.");
      return;
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(inicio) ||
        !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(fim) ||
        minutosHora(inicio) >= minutosHora(fim)) {
      setErro("Informe horários válidos; o fim deve ser depois do início.");
      return;
    }

    setSalvando(true);
    try {
      await criarHorariosMedico(idMedico, {
        dias_da_semana: [dia],
        horario_abertura: inicio,
        horario_fechamento: fim,
      });
      setDia(null);
      await carregarHorarios();
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível adicionar o horário."));
    } finally {
      setSalvando(false);
    }
  }

  const medicoSelecionado = medicos.find(
    (item) => String(item.id_profissional) === idMedico,
  );
  const nomeMedico = medicoSelecionado?.User?.nome || "médico";
  const opcoesDia = DIAS_COMPLETOS.map((nome, valor) => ({ label: nome, value: valor }));
  const opcoesInicio = OPCOES_HORARIO.slice(0, -1).map((horario) => ({
    label: horario,
    value: horario,
  }));
  const opcoesFim = OPCOES_HORARIO.filter(
    (horario) => minutosHora(horario) > minutosHora(inicio),
  ).map((horario) => ({ label: horario, value: horario }));

  function alterarInicio(novoInicio) {
    setInicio(novoInicio);
    if (minutosHora(fim) <= minutosHora(novoInicio)) {
      const proximoHorario = OPCOES_HORARIO.find(
        (horario) => minutosHora(horario) > minutosHora(novoInicio),
      );
      if (proximoHorario) setFim(proximoHorario);
    }
  }

  return (
    <>
      <View style={styles.availabilityHeading}>
        <Text style={styles.availabilityTitle}>Disponibilidade dos Médicos</Text>
        <Text style={styles.availabilitySubtitle}>
          Configure os horários de atendimento de cada médico desta clínica.
        </Text>
      </View>
      {!medicos.length ? (
        <CaixaVazia texto="Vincule um médico à clínica para configurar horários." />
      ) : (
        <>
          <View style={styles.availabilityDoctorSelector}>
            {medicos.map((medico) => (
              <TouchableOpacity
                key={medico.id_profissional}
                style={[
                  styles.availabilityDoctorOption,
                  String(medico.id_profissional) === idMedico &&
                    styles.availabilityDoctorOptionSelected,
                ]}
                onPress={() => setIdMedico(String(medico.id_profissional))}
              >
                <Text
                  style={[
                    styles.availabilityDoctorOptionText,
                    String(medico.id_profissional) === idMedico &&
                      styles.availabilityDoctorOptionTextSelected,
                  ]}
                >
                  {medico.User?.nome || "Médico"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.availabilityFormCard}>
            <Text style={styles.availabilityFormTitle}>
              ADICIONAR HORÁRIO — {nomeMedico.toUpperCase()}
            </Text>
            <SeletorDisponibilidade
              label="Dia da semana"
              value={dia}
              options={opcoesDia}
              onChange={setDia}
              placeholder="Escolha um dia"
            />
            <SeletorDisponibilidade
              label="Início"
              value={inicio}
              options={opcoesInicio}
              onChange={alterarInicio}
              placeholder="Escolha o início"
            />
            <SeletorDisponibilidade
              label="Fim"
              value={fim}
              options={opcoesFim}
              onChange={setFim}
              placeholder="Escolha o fim"
            />
            {erro ? <Text style={styles.errorText}>{erro}</Text> : null}
            <TouchableOpacity
              style={[styles.availabilityAddButton, salvando && styles.buttonDisabled]}
              onPress={adicionarHorario}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                  <Text style={styles.availabilityAddButtonText}>Adicionar horário</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.availabilityScheduleHeading}>
            HORÁRIOS DE {nomeMedico.toUpperCase()}
          </Text>
          {carregando ? (
            <ActivityIndicator color={colors.primary} style={styles.inlineLoader} />
          ) : horarios.length ? (
            horarios.map((horario) => (
              <View key={horario.id_horario} style={styles.availabilityScheduleCard}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleDay}>
                    {DIAS_COMPLETOS[horario.dia_da_semana] || "Dia não informado"}
                  </Text>
                  <Text style={styles.scheduleTime}>
                    {formatarHora(horario.horario_abertura)} – {formatarHora(horario.horario_fechamento)}
                  </Text>
                </View>
                <View style={styles.availabilityStatusRow}>
                  <Text style={styles.availabilityActivePill}>Ativo</Text>
                </View>
              </View>
            ))
          ) : (
            <CaixaVazia texto="Este médico ainda não tem horários cadastrados." />
          )}
        </>
      )}
    </>
  );
}

function LinhaPerfilClinica({ icone, titulo, valor }) {
  return (
    <View style={styles.clinicProfileRow}>
      <View style={styles.clinicProfileRowIcon}>
        <Ionicons name={icone} size={22} color={colors.textPlaceholder} />
      </View>
      <View style={styles.clinicProfileRowContent}>
        <Text style={styles.clinicProfileRowLabel}>{titulo.toUpperCase()}</Text>
        <Text style={styles.clinicProfileRowValue}>{valor || "Não informado"}</Text>
      </View>
    </View>
  );
}

function PerfilClinica({ clinica }) {
  const usuarioClinica = clinica?.User || {};
  const localidade = [usuarioClinica.cidade, usuarioClinica.estado]
    .filter(Boolean)
    .join(" / ");
  const endereco = [usuarioClinica.endereco, localidade]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <View style={styles.pageHeading}>
        <Text style={styles.pageTitle}>Perfil da Clínica</Text>
        <Text style={styles.pageSubtitle}>Informações cadastrais da clínica.</Text>
      </View>
      <View style={styles.clinicProfileCard}>
        <View style={styles.clinicProfileHero}>
          <View style={styles.clinicProfileLogo}>
            <Ionicons name="home-outline" size={40} color="#159B87" />
          </View>
          <View style={styles.clinicProfileIdentity}>
            <Text style={styles.clinicProfileName}>
              {usuarioClinica.nome || clinica?.nome || "Clínica"}
            </Text>
            <Text style={styles.clinicProfileCnpjLabel}>CNPJ:</Text>
            <Text style={styles.clinicProfileCnpj}>
              {clinica?.cnpj || "Não informado"}
            </Text>
          </View>
        </View>
        <View style={styles.clinicProfileDivider} />
        <LinhaPerfilClinica
          icone="location-outline"
          titulo="Endereço"
          valor={endereco}
        />
        <LinhaPerfilClinica
          icone="navigate-outline"
          titulo="Bairro"
          valor={clinica?.bairro}
        />
        <LinhaPerfilClinica
          icone="call-outline"
          titulo="Telefone"
          valor={formatarTelefone(usuarioClinica.telefone)}
        />
        <LinhaPerfilClinica
          icone="mail-outline"
          titulo="E-mail"
          valor={usuarioClinica.email}
        />
      </View>
    </>
  );
}

export default function ClinicaPortalScreen({ telaAtiva, navigation }) {
  const { usuario } = useAuth();
  const idClinica = usuario?.id_clinica;
  const [clinica, setClinica] = useState(null);
  const [medicos, setMedicos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarDados = useCallback(async (refresh = false) => {
    if (!idClinica) {
      setErro("A sessão não contém o identificador da clínica.");
      setCarregando(false);
      return;
    }
    if (refresh) setAtualizando(true);
    else setCarregando(true);
    setErro("");
    try {
      const [clinicaData, medicosData, agendamentosData] = await Promise.all([
        buscarClinica(idClinica),
        listarMedicosClinica(idClinica),
        listarAgendamentosClinica(idClinica),
      ]);
      setClinica(clinicaData);
      setMedicos(medicosData);
      setAgendamentos(agendamentosData);
    } catch (error) {
      setErro(mensagemErro(error, "Não foi possível carregar os dados da clínica."));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [idClinica]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function cancelarAgendamento(agendamento) {
    Alert.alert(
      "Cancelar agendamento",
      "Deseja cancelar este agendamento?",
      [
        { text: "Manter", style: "cancel" },
        {
          text: "Cancelar consulta",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelarAgendamentoClinica(agendamento);
              await carregarDados(true);
            } catch (error) {
              Alert.alert(
                "Não foi possível cancelar",
                mensagemErro(error, "Tente novamente mais tarde."),
              );
            }
          },
        },
      ],
    );
  }

  const tela = telaAtiva || "ClinicaVisaoGeral";

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva={tela}
        onNavigate={(rota) => navigation?.navigate?.(rota)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarDados(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erro}</Text>
          </View>
        ) : null}
        {carregando && !clinica ? (
          <ActivityIndicator color={colors.primary} size="large" style={styles.pageLoader} />
        ) : (
          <>
            {tela === "ClinicaVisaoGeral" ? (
              <VisaoGeral
                clinica={clinica}
                medicos={medicos}
                agendamentos={agendamentos}
                carregando={carregando}
                navegar={(rota) => navigation?.navigate?.(rota)}
              />
            ) : null}
            {tela === "ClinicaAgenda" ? <Agenda agendamentos={agendamentos} /> : null}
            {tela === "ClinicaAgendamentos" ? (
              <Agendamentos
                agendamentos={agendamentos}
                aoCancelar={cancelarAgendamento}
              />
            ) : null}
            {tela === "ClinicaMedicos" ? (
              <Medicos
                medicos={medicos}
                nomeClinica={clinica?.User?.nome || clinica?.nome}
              />
            ) : null}
            {tela === "ClinicaDisponibilidade" ? (
              <Disponibilidade medicos={medicos} />
            ) : null}
            {tela === "ClinicaPerfil" ? (
              <PerfilClinica clinica={clinica} />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceInput },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 36 },
  pageHeading: { marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: "800", color: colors.textPrimary },
  pageSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 5 },
  pageLoader: { marginTop: 70 },
  inlineLoader: { paddingVertical: 24 },
  availabilityHeading: { marginTop: 18, marginBottom: 28 },
  availabilityTitle: { fontSize: 30, lineHeight: 37, fontWeight: "800", color: colors.textPrimary },
  availabilitySubtitle: { fontSize: 15, lineHeight: 23, color: colors.textMuted, marginTop: 8 },
  availabilityDoctorSelector: { alignItems: "flex-start", gap: 10, marginBottom: 32 },
  availabilityDoctorOption: { minHeight: 50, borderRadius: 27, borderWidth: 1.5, borderColor: colors.borderLight, backgroundColor: colors.surface, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 10, elevation: 1 },
  availabilityDoctorOptionSelected: { backgroundColor: "#159B87", borderColor: "#159B87", elevation: 2 },
  availabilityDoctorOptionText: { color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  availabilityDoctorOptionTextSelected: { color: "#FFFFFF" },
  availabilityFormCard: { backgroundColor: colors.surface, borderRadius: 19, borderWidth: 1, borderColor: colors.borderLight, padding: 19, marginBottom: 32, elevation: 2 },
  availabilityFormTitle: { color: colors.textMuted, fontSize: 12, lineHeight: 18, letterSpacing: 1.1, fontWeight: "800", marginBottom: 18 },
  availabilityFieldGroup: { marginBottom: 14 },
  availabilityFieldLabel: { fontSize: 14, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 },
  availabilityDropdown: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1.5, borderColor: colors.borderLight, borderRadius: 13, backgroundColor: colors.surface, paddingHorizontal: 14, elevation: 1 },
  availabilityDropdownText: { color: colors.textPrimary, fontSize: 15 },
  availabilityDropdownPlaceholder: { color: colors.textPlaceholder },
  selectorModalBackdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(15, 23, 42, 0.48)" },
  selectorModalCard: { maxHeight: "78%", backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10, elevation: 8 },
  selectorModalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  selectorOptions: { flexGrow: 0 },
  selectorOption: { minHeight: 49, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingHorizontal: 8 },
  selectorOptionSelected: { backgroundColor: colors.primarySoft },
  selectorOptionText: { color: colors.textSecondary, fontSize: 15 },
  selectorOptionTextSelected: { color: colors.primary, fontWeight: "800" },
  availabilityAddButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1D5FF2", borderRadius: 13, marginTop: 10, elevation: 2 },
  availabilityAddButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  availabilityScheduleHeading: { color: colors.textMuted, fontSize: 12, lineHeight: 18, letterSpacing: 1.1, fontWeight: "800", marginBottom: 16 },
  availabilityScheduleCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderLight, borderRadius: 18, padding: 15, marginBottom: 12, elevation: 2 },
  availabilityStatusRow: { flexDirection: "row", alignItems: "center", marginTop: 13 },
  availabilityActivePill: { color: colors.success, backgroundColor: "#D9FBE8", overflow: "hidden", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 8, fontSize: 12, fontWeight: "800" },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 26 },
  metricCard: {
    width: "48%",
    flexGrow: 1,
    minHeight: 125,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
  },
  metricIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 24, fontWeight: "800", color: colors.textPrimary, marginTop: 10 },
  metricLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted, marginTop: 2 },
  sectionHeadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.textPrimary, marginTop: 8, marginBottom: 12 },
  linkText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  appointmentCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.borderLight, padding: 15, marginBottom: 10 },
  appointmentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  appointmentTime: { flexDirection: "row", alignItems: "center", gap: 9 },
  appointmentHour: { fontSize: 15, fontWeight: "800", color: colors.primary },
  appointmentDate: { fontSize: 12, color: colors.textMuted },
  appointmentPatient: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  appointmentDetail: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  statusPill: { overflow: "hidden", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: "700" },
  statusConfirmed: { backgroundColor: colors.successBg, color: colors.success },
  statusCancelled: { backgroundColor: colors.errorBg, color: colors.error },
  textAction: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 12 },
  textActionDanger: { color: colors.error, fontSize: 13, fontWeight: "700" },
  emptyBox: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: 14, backgroundColor: colors.surface, padding: 20, alignItems: "center" },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 },
  segmentRow: { flexDirection: "row", backgroundColor: colors.surfaceMuted, padding: 4, borderRadius: 12, marginBottom: 14 },
  segmentButton: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 9 },
  segmentButtonActive: { backgroundColor: colors.surface, elevation: 1 },
  segmentText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: colors.primary, fontWeight: "800" },
  calendarCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 16, padding: 12, marginBottom: 22 },
  calendarNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 5, paddingBottom: 10 },
  calendarTitle: { fontSize: 15, fontWeight: "800", color: colors.textPrimary, textTransform: "capitalize" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarWeekday: { width: "14.2857%", textAlign: "center", color: colors.textPlaceholder, fontSize: 11, fontWeight: "700", paddingVertical: 8 },
  calendarDay: { width: "14.2857%", height: 42, alignItems: "center", justifyContent: "center" },
  calendarDayNumber: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  calendarDaySelected: { backgroundColor: colors.primary },
  calendarDayText: { color: colors.textPrimary, fontSize: 12, fontWeight: "600" },
  calendarDayOutside: { color: colors.textPlaceholder },
  calendarDayTextSelected: { color: "#FFFFFF" },
  calendarDot: { position: "absolute", bottom: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  calendarDotSpace: { position: "absolute", bottom: 1, width: 4, height: 4 },
  doctorCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 20, padding: 19, marginBottom: 15, elevation: 2 },
  doctorAvatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#E8FAF7", alignItems: "center", justifyContent: "center", marginRight: 16 },
  doctorInitials: { color: "#138C7C", fontSize: 17, fontWeight: "800" },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 17, fontWeight: "800", color: colors.textPrimary },
  doctorDetail: { fontSize: 14, color: colors.textMuted, marginTop: 5 },
  doctorSpecialty: { alignSelf: "flex-start", color: colors.primaryText, backgroundColor: colors.primarySoft, borderColor: colors.primaryLight, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, fontSize: 13, fontWeight: "700", marginTop: 8 },
  activePill: { color: colors.success, backgroundColor: colors.successBg, overflow: "hidden", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },
  errorBox: { padding: 12, backgroundColor: colors.errorBg, borderColor: colors.errorBorder, borderWidth: 1, borderRadius: 12, marginBottom: 15 },
  errorText: { color: colors.error, fontSize: 13, fontWeight: "600" },
  scheduleCard: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 14, padding: 13, marginBottom: 9 },
  scheduleInfo: { flex: 1, minWidth: 130 },
  scheduleDay: { fontSize: 14, fontWeight: "800", color: colors.textPrimary },
  scheduleTime: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  disabledActions: { width: "100%", flexDirection: "row", justifyContent: "flex-end", gap: 14, paddingTop: 7 },
  disabledActionText: { color: colors.textPlaceholder, fontSize: 12, fontWeight: "600" },
  clinicProfileCard: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.borderLight, padding: 22, marginTop: 24, elevation: 2 },
  clinicProfileHero: { flexDirection: "row", alignItems: "center", gap: 17 },
  clinicProfileLogo: { width: 76, height: 76, flexShrink: 0, borderRadius: 20, backgroundColor: "#E8FAF7", alignItems: "center", justifyContent: "center" },
  clinicProfileIdentity: { flex: 1 },
  clinicProfileName: { color: colors.textPrimary, fontSize: 22, lineHeight: 28, fontWeight: "800" },
  clinicProfileCnpjLabel: { color: colors.textMuted, fontSize: 15, marginTop: 10 },
  clinicProfileCnpj: { color: colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 3 },
  clinicProfileDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 24 },
  clinicProfileRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 },
  clinicProfileRowIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" },
  clinicProfileRowContent: { flex: 1 },
  clinicProfileRowLabel: { color: colors.textPlaceholder, fontSize: 12, fontWeight: "800", letterSpacing: 0.8, marginBottom: 4 },
  clinicProfileRowValue: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, fontWeight: "700" },
});

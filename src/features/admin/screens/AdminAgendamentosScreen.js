import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../../components/shared/AppHeader';
import api from '../../../lib/api';
import { colors } from '../../../shared/theme/colors';
import { mascaraData } from '../../../shared/utils/masks';

const STATUS_OPTIONS = [
  'Todos os status',
  'Confirmado',
  'Pendente',
  'Concluído',
  'Cancelado',
];

const HORARIOS_PADRAO = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

function getIniciais(nome) {
  if (!nome) return 'PA';
  const partes = String(nome).trim().split(' ').filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return String(nome).trim().slice(0, 2).toUpperCase();
}

function isoParaBr(iso) {
  if (!iso) return '';
  const limpo = String(iso).split('T')[0];
  const partes = limpo.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return limpo;
}

function brParaIso(dataBr) {
  if (!dataBr) return '';
  const partes = String(dataBr).trim().split('/');
  if (partes.length !== 3) return '';
  const [dia, mes, ano] = partes;
  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return '';
  return `${ano}-${mes}-${dia}`;
}

function getAmanhaBr() {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const dia = String(amanha.getDate()).padStart(2, '0');
  const mes = String(amanha.getMonth() + 1).padStart(2, '0');
  const ano = amanha.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function getStatusBadge(status) {
  const st = String(status || '').trim().toLowerCase();
  if (st === 'cancelado') {
    return {
      bg: '#FEE2E2',
      text: '#B91C1C',
      label: 'CANCELADO',
    };
  }
  if (st === 'concluido' || st === 'concluído') {
    return {
      bg: '#DBEAFE',
      text: '#1D4ED8',
      label: 'CONCLUÍDO',
    };
  }
  if (st === 'pendente') {
    return {
      bg: '#FEF3C7',
      text: '#B45309',
      label: 'PENDENTE',
    };
  }
  return {
    bg: '#DCFCE7',
    text: '#15803D',
    label: 'CONFIRMADO',
  };
}

export default function AdminAgendamentosScreen({ navigation }) {
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [agendamentos, setAgendamentos] = useState([]);

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos os status');
  const [dropdownStatusAberto, setDropdownStatusAberto] = useState(false);

  const [agendamentoParaCancelar, setAgendamentoParaCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [carregandoOpcoesNovo, setCarregandoOpcoesNovo] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [salvandoNovo, setSalvandoNovo] = useState(false);
  const [erroNovo, setErroNovo] = useState('');
  const [seletorAtivo, setSeletorAtivo] = useState(null);

  const [formNovo, setFormNovo] = useState({
    id_paciente: '',
    id_profissional: '',
    id_clinica: '',
    dataBr: getAmanhaBr(),
    horario_agendamento: '08:00',
    observacao: 'Consulta agendada pelo administrador',
  });

  const carregarAgendamentos = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }
      setErro('');

      const [resAgendamentos, resProfissionais] = await Promise.all([
        api.get('/agendamentos'),
        api.get('/profissionais').catch(() => ({ data: [] })),
      ]);

      const listaProf = Array.isArray(resProfissionais.data)
        ? resProfissionais.data
        : [];
      const mapaEspPorProf = {};
      listaProf.forEach((p) => {
        if (p.id_profissional && p.Especialidade?.nome) {
          mapaEspPorProf[String(p.id_profissional)] = p.Especialidade.nome;
        }
      });

      const data = resAgendamentos.data;
      if (Array.isArray(data)) {
        const formatados = data.map((item) => {
          const nomePaciente = item.Paciente?.User?.nome || 'Paciente';
          const nomeProfissional =
            item.Profissional?.User?.nome || 'Profissional';
          const idProf =
            item.Profissional?.id_profissional || item.id_profissional;
          const especialidade =
            item.Profissional?.Especialidade?.nome ||
            (idProf ? mapaEspPorProf[String(idProf)] : '') ||
            '';
          const subInfo = especialidade
            ? `${nomeProfissional} · ${especialidade}`
            : nomeProfissional;

          const dataFormatada = isoParaBr(item.data_agendamento) || '--/--/----';
          const horarioFormatado =
            item.horario_agendamento?.substring(0, 5) || '--:--';

          const statusOriginal = item.status || 'Confirmado';
          const statusFormatado =
            statusOriginal.charAt(0).toUpperCase() +
            statusOriginal.slice(1).toLowerCase();

          return {
            id: String(item.id_agendamento),
            id_agendamento: item.id_agendamento,
            id_paciente: item.id_paciente || item.Paciente?.id_paciente,
            paciente: nomePaciente,
            iniciais: getIniciais(nomePaciente),
            profissional: subInfo,
            data: dataFormatada,
            horario: horarioFormatado,
            status: statusFormatado,
          };
        });
        setAgendamentos(formatados);
      } else {
        setAgendamentos([]);
      }
    } catch {
      setErro('Não foi possível carregar os agendamentos do servidor.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  const agendamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return agendamentos.filter((item) => {
      const matchBusca =
        !termo ||
        item.paciente.toLowerCase().includes(termo) ||
        item.profissional.toLowerCase().includes(termo);
      const matchStatus =
        filtroStatus === 'Todos os status' ||
        item.status.toLowerCase() === filtroStatus.toLowerCase() ||
        (filtroStatus === 'Concluído' &&
          item.status.toLowerCase() === 'concluido');
      return matchBusca && matchStatus;
    });
  }, [agendamentos, busca, filtroStatus]);

  const carregarDisponibilidade = useCallback(async (idProf, dataIso) => {
    if (!idProf || !dataIso) return;
    setCarregandoHorarios(true);
    try {
      const { data } = await api.get(
        `/profissionais/${idProf}/disponibilidade`,
        { params: { data: dataIso } }
      );
      if (Array.isArray(data) && data.length > 0) {
        const formatados = data.map((h) => String(h).slice(0, 5));
        setHorariosDisponiveis(formatados);
        setFormNovo((prev) => ({
          ...prev,
          horario_agendamento: formatados[0],
        }));
      } else {
        setHorariosDisponiveis([]);
      }
    } catch {
      setHorariosDisponiveis([]);
    } finally {
      setCarregandoHorarios(false);
    }
  }, []);

  const abrirModalNovo = async () => {
    const amanhaBr = getAmanhaBr();
    const amanhaIso = brParaIso(amanhaBr);

    setErroNovo('');
    setHorariosDisponiveis([]);
    setFormNovo({
      id_paciente: '',
      id_profissional: '',
      id_clinica: '',
      dataBr: amanhaBr,
      horario_agendamento: '08:00',
      observacao: 'Consulta agendada pelo administrador',
    });
    setModalNovoAberto(true);
    setCarregandoOpcoesNovo(true);

    try {
      const [resPacientes, resProfissionais, resClinicas] = await Promise.all([
        api.get('/pacientes'),
        api.get('/profissionais'),
        api.get('/clinicas'),
      ]);

      const listaPac = Array.isArray(resPacientes.data)
        ? resPacientes.data
        : [];
      const listaProf = Array.isArray(resProfissionais.data)
        ? resProfissionais.data
        : [];
      const listaClinicas = Array.isArray(resClinicas.data)
        ? resClinicas.data
        : [];

      setPacientes(listaPac);
      setProfissionais(listaProf);
      setClinicas(listaClinicas);

      const primProf = listaProf.length > 0 ? listaProf[0] : null;
      const idProfInicial = primProf ? String(primProf.id_profissional) : '';

      let idClinicaInicial = '';
      if (primProf?.Clinicas && primProf.Clinicas.length > 0) {
        idClinicaInicial = String(primProf.Clinicas[0].id_clinica);
      } else if (listaClinicas.length > 0) {
        idClinicaInicial = String(listaClinicas[0].id_clinica);
      }

      setFormNovo((prev) => ({
        ...prev,
        id_paciente:
          listaPac.length > 0 ? String(listaPac[0].id_paciente) : '',
        id_profissional: idProfInicial,
        id_clinica: idClinicaInicial,
      }));

      if (idProfInicial && amanhaIso) {
        carregarDisponibilidade(idProfInicial, amanhaIso);
      }
    } catch {
      setErroNovo('Erro ao carregar dados do servidor.');
    } finally {
      setCarregandoOpcoesNovo(false);
    }
  };

  const handleSelecionarProfissional = (idProf) => {
    const prof = profissionais.find(
      (p) => String(p.id_profissional) === String(idProf)
    );
    let idClinica = formNovo.id_clinica;
    if (prof?.Clinicas && prof.Clinicas.length > 0) {
      idClinica = String(prof.Clinicas[0].id_clinica);
    }
    setFormNovo((prev) => ({
      ...prev,
      id_profissional: String(idProf),
      id_clinica: idClinica,
    }));
    const dataIso = brParaIso(formNovo.dataBr);
    if (dataIso) {
      carregarDisponibilidade(idProf, dataIso);
    }
  };

  const handleAlterarDataBr = (texto) => {
    const mascarada = mascaraData(texto);
    setFormNovo((prev) => ({ ...prev, dataBr: mascarada }));
    if (mascarada.length === 10 && formNovo.id_profissional) {
      const iso = brParaIso(mascarada);
      if (iso) {
        carregarDisponibilidade(formNovo.id_profissional, iso);
      }
    }
  };

  const handleSalvarNovoAgendamento = async () => {
    setErroNovo('');

    if (!formNovo.id_paciente) {
      setErroNovo('Selecione um paciente para o agendamento.');
      return;
    }
    if (!formNovo.id_profissional) {
      setErroNovo('Selecione um profissional de saúde.');
      return;
    }
    if (!formNovo.id_clinica) {
      setErroNovo('Selecione uma clínica para o atendimento.');
      return;
    }
    const dataIso = brParaIso(formNovo.dataBr);
    if (!dataIso) {
      setErroNovo('Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    setSalvandoNovo(true);
    try {
      const prof = profissionais.find(
        (p) => String(p.id_profissional) === String(formNovo.id_profissional)
      );
      const jaVinculado = prof?.Clinicas?.some(
        (c) => String(c.id_clinica) === String(formNovo.id_clinica)
      );
      if (!jaVinculado) {
        await api
          .patch(
            `/clinicas/${formNovo.id_clinica}/profissionais/${formNovo.id_profissional}`
          )
          .catch(() => {});
      }

      const payload = {
        id_paciente: Number(formNovo.id_paciente),
        id_clinica: Number(formNovo.id_clinica),
        data_agendamento: dataIso,
        horario_agendamento: formNovo.horario_agendamento,
        observacao:
          formNovo.observacao?.trim() || 'Consulta agendada pelo administrador',
      };

      await api.post(
        `/profissionais/${formNovo.id_profissional}/agendamentos`,
        payload
      );
      setModalNovoAberto(false);
      await carregarAgendamentos(true);
    } catch (err) {
      const msg =
        err.response?.data?.erro ||
        err.response?.data?.message ||
        'Erro ao criar agendamento. Verifique se o médico tem disponibilidade neste horário.';
      setErroNovo(msg);
    } finally {
      setSalvandoNovo(false);
    }
  };

  const confirmarCancelamento = async () => {
    if (!agendamentoParaCancelar) return;
    setCancelando(true);
    try {
      if (
        agendamentoParaCancelar.id_paciente &&
        agendamentoParaCancelar.id_agendamento
      ) {
        await api.patch(
          `/pacientes/${agendamentoParaCancelar.id_paciente}/agendamentos/${agendamentoParaCancelar.id_agendamento}/cancelar`
        );
      }
      setAgendamentos((prev) =>
        prev.map((a) =>
          a.id === agendamentoParaCancelar.id
            ? { ...a, status: 'Cancelado' }
            : a
        )
      );
      setAgendamentoParaCancelar(null);
    } catch {
      setAgendamentoParaCancelar(null);
    } finally {
      setCancelando(false);
    }
  };

  const pacienteSelecionadoLabel = useMemo(() => {
    const p = pacientes.find(
      (item) => String(item.id_paciente) === String(formNovo.id_paciente)
    );
    if (!p) return 'Selecione um paciente...';
    const nome = p.User?.nome || `Paciente #${p.id_paciente}`;
    return p.cpf ? `${nome} (CPF: ${p.cpf})` : nome;
  }, [pacientes, formNovo.id_paciente]);

  const profissionalSelecionadoLabel = useMemo(() => {
    const prof = profissionais.find(
      (item) =>
        String(item.id_profissional) === String(formNovo.id_profissional)
    );
    if (!prof) return 'Selecione um profissional...';
    const nome = prof.User?.nome || `Médico #${prof.id_profissional}`;
    const crm = prof.registro_profissional
      ? ` (CRM: ${prof.uf_registro || ''}${prof.registro_profissional})`
      : '';
    const esp = prof.Especialidade?.nome ? ` - ${prof.Especialidade.nome}` : '';
    return `${nome}${crm}${esp}`;
  }, [profissionais, formNovo.id_profissional]);

  const clinicaSelecionadaLabel = useMemo(() => {
    const c = clinicas.find(
      (item) => String(item.id_clinica) === String(formNovo.id_clinica)
    );
    if (!c) return 'Selecione uma clínica...';
    const nome = c.User?.nome?.trim() || `Clínica #${c.id_clinica}`;
    const local = c.bairro || c.User?.cidade || 'Recife';
    return `${nome} (${local})`;
  }, [clinicas, formNovo.id_clinica]);

  const opcoesSeletorModal = useMemo(() => {
    if (seletorAtivo === 'paciente') {
      return pacientes.map((p) => {
        const nome = p.User?.nome || `Paciente #${p.id_paciente}`;
        return {
          value: String(p.id_paciente),
          label: p.cpf ? `${nome} (CPF: ${p.cpf})` : nome,
        };
      });
    }
    if (seletorAtivo === 'profissional') {
      return profissionais.map((prof) => {
        const nome = prof.User?.nome || `Médico #${prof.id_profissional}`;
        const crm = prof.registro_profissional
          ? ` (CRM: ${prof.uf_registro || ''}${prof.registro_profissional})`
          : '';
        const esp = prof.Especialidade?.nome
          ? ` - ${prof.Especialidade.nome}`
          : '';
        return {
          value: String(prof.id_profissional),
          label: `${nome}${crm}${esp}`,
        };
      });
    }
    if (seletorAtivo === 'clinica') {
      return clinicas.map((c) => {
        const nome = c.User?.nome?.trim() || `Clínica #${c.id_clinica}`;
        const local = c.bairro || c.User?.cidade || 'Recife';
        return {
          value: String(c.id_clinica),
          label: `${nome} (${local})`,
        };
      });
    }
    if (seletorAtivo === 'horario') {
      const lista =
        horariosDisponiveis.length > 0 ? horariosDisponiveis : HORARIOS_PADRAO;
      return lista.map((h) => ({
        value: h,
        label: h,
      }));
    }
    return [];
  }, [
    seletorAtivo,
    pacientes,
    profissionais,
    clinicas,
    horariosDisponiveis,
  ]);

  const handleSelecionarOpcaoModal = (valor) => {
    if (seletorAtivo === 'paciente') {
      setFormNovo((prev) => ({ ...prev, id_paciente: valor }));
    } else if (seletorAtivo === 'profissional') {
      handleSelecionarProfissional(valor);
    } else if (seletorAtivo === 'clinica') {
      setFormNovo((prev) => ({ ...prev, id_clinica: valor }));
    } else if (seletorAtivo === 'horario') {
      setFormNovo((prev) => ({ ...prev, horario_agendamento: valor }));
    }
    setSeletorAtivo(null);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva="AdminAgendamentos"
        onNavigate={(rota) => navigation?.navigate?.(rota)}
      />

      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Todos os Agendamentos</Text>
            <Text style={styles.subtitle}>Visão completa da rede.</Text>
          </View>

          <TouchableOpacity
            style={styles.newButton}
            activeOpacity={0.85}
            onPress={abrirModalNovo}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newButtonText}>Novo Agendamento</Text>
          </TouchableOpacity>
        </View>

        {erro ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{erro}</Text>
          </View>
        ) : null}

        <View style={styles.filtersContainer}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color={colors.textPlaceholder}
            />
            <TextInput
              style={styles.searchInput}
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por paciente, profissional ou especialidade..."
              placeholderTextColor={colors.textPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {busca.length > 0 ? (
              <TouchableOpacity onPress={() => setBusca('')}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textPlaceholder}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.statusFilterTrigger}
            activeOpacity={0.75}
            onPress={() => setDropdownStatusAberto(true)}
          >
            <Text style={styles.statusFilterText}>{filtroStatus}</Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {carregando && !atualizando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={agendamentosFiltrados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => carregarAgendamentos(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Nenhum agendamento encontrado.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{item.iniciais}</Text>
                  </View>

                  <View style={styles.cardMainInfo}>
                    <Text style={styles.patientName} numberOfLines={1}>
                      {item.paciente}
                    </Text>
                    <Text style={styles.doctorInfo} numberOfLines={1}>
                      {item.profissional}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.dateTimeText}>
                    {item.data} - {item.horario}
                  </Text>

                  <View style={styles.cardActionsRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusBadgeText, { color: badge.text }]}
                      >
                        {badge.label}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteIconBtn}
                      onPress={() => setAgendamentoParaCancelar(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#F87171"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal Filtro de Status */}
      <Modal
        visible={dropdownStatusAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownStatusAberto(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setDropdownStatusAberto(false)}
        >
          <Pressable style={styles.pickerSheet} onPress={() => {}}>
            <Text style={styles.pickerTitle}>Filtrar por status</Text>
            {STATUS_OPTIONS.map((st) => {
              const ativo = filtroStatus === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.pickerItem, ativo && styles.pickerItemActive]}
                  onPress={() => {
                    setFiltroStatus(st);
                    setDropdownStatusAberto(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      ativo && styles.pickerItemTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                  {ativo ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Confirmar Cancelamento */}
      <Modal
        visible={!!agendamentoParaCancelar}
        transparent
        animationType="fade"
        onRequestClose={() => !cancelando && setAgendamentoParaCancelar(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => !cancelando && setAgendamentoParaCancelar(null)}
        >
          <Pressable style={styles.confirmBox} onPress={() => {}}>
            <Text style={styles.confirmTitle}>Cancelar agendamento?</Text>
            <Text style={styles.confirmBody}>
              Tem certeza que deseja cancelar o agendamento de{' '}
              <Text style={styles.confirmHighlight}>
                {agendamentoParaCancelar?.paciente}
              </Text>
              ? O status passará para "Cancelado".
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmBackBtn}
                disabled={cancelando}
                onPress={() => setAgendamentoParaCancelar(null)}
              >
                <Text style={styles.confirmBackText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDangerBtn}
                disabled={cancelando}
                onPress={confirmarCancelamento}
              >
                {cancelando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDangerText}>
                    Confirmar Cancelamento
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Novo Agendamento */}
      <Modal
        visible={modalNovoAberto}
        transparent
        animationType="slide"
        onRequestClose={() => !salvandoNovo && setModalNovoAberto(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !salvandoNovo && setModalNovoAberto(false)}
          />
          <View style={styles.newModalCard}>
            <View style={styles.newModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.newModalTitle}>Novo Agendamento</Text>
                <Text style={styles.newModalSubtitle}>
                  Criar consulta diretamente pela administração.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeCircleBtn}
                disabled={salvandoNovo}
                onPress={() => setModalNovoAberto(false)}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {carregandoOpcoesNovo ? (
              <View style={styles.modalLoadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalLoadingText}>
                  Carregando pacientes, médicos e clínicas...
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.newModalForm}
              >
                {erroNovo ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{erroNovo}</Text>
                  </View>
                ) : null}

                <Text style={styles.fieldLabel}>PACIENTE</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setSeletorAtivo('paciente')}
                >
                  <Text style={styles.selectFieldText} numberOfLines={1}>
                    {pacienteSelecionadoLabel}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>PROFISSIONAL DE SAÚDE</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setSeletorAtivo('profissional')}
                >
                  <Text style={styles.selectFieldText} numberOfLines={1}>
                    {profissionalSelecionadoLabel}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                <Text style={styles.fieldLabel}>CLÍNICA DO ATENDIMENTO</Text>
                <TouchableOpacity
                  style={styles.selectField}
                  onPress={() => setSeletorAtivo('clinica')}
                >
                  <Text style={styles.selectFieldText} numberOfLines={1}>
                    {clinicaSelecionadaLabel}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>DATA DA CONSULTA</Text>
                    <View style={styles.dateInputBox}>
                      <TextInput
                        style={styles.dateTextInput}
                        value={formNovo.dataBr}
                        onChangeText={handleAlterarDataBr}
                        placeholder="DD/MM/AAAA"
                        placeholderTextColor={colors.textPlaceholder}
                        keyboardType="number-pad"
                        maxLength={10}
                      />
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                    </View>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>
                      HORÁRIO {carregandoHorarios ? '(...)' : ''}
                    </Text>
                    <TouchableOpacity
                      style={styles.selectField}
                      onPress={() => setSeletorAtivo('horario')}
                    >
                      <Text style={styles.selectFieldText}>
                        {formNovo.horario_agendamento}
                      </Text>
                      <Ionicons
                        name="chevron-down"
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>OBSERVAÇÕES CLÍNICAS</Text>
                <TextInput
                  style={styles.textareaField}
                  value={formNovo.observacao}
                  onChangeText={(t) =>
                    setFormNovo((prev) => ({ ...prev, observacao: t }))
                  }
                  placeholder="Ex: Consulta de rotina / encaminhamento..."
                  placeholderTextColor={colors.textPlaceholder}
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.newModalFooter}>
                  <TouchableOpacity
                    style={styles.cancelModalBtn}
                    disabled={salvandoNovo}
                    onPress={() => setModalNovoAberto(false)}
                  >
                    <Text style={styles.cancelModalBtnText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.submitModalBtn}
                    disabled={salvandoNovo}
                    onPress={handleSalvarNovoAgendamento}
                  >
                    {salvandoNovo ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitModalBtnText}>
                        Criar Agendamento
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sub-modal para seleção de Paciente / Profissional / Clínica / Horário */}
      <Modal
        visible={!!seletorAtivo}
        transparent
        animationType="fade"
        onRequestClose={() => setSeletorAtivo(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSeletorAtivo(null)}
        >
          <Pressable style={styles.pickerSheetLarge} onPress={() => {}}>
            <View style={styles.pickerHeaderRow}>
              <Text style={styles.pickerTitle}>
                {seletorAtivo === 'paciente' && 'Selecione o Paciente'}
                {seletorAtivo === 'profissional' && 'Selecione o Profissional'}
                {seletorAtivo === 'clinica' && 'Selecione a Clínica'}
                {seletorAtivo === 'horario' && 'Selecione o Horário'}
              </Text>
              <TouchableOpacity onPress={() => setSeletorAtivo(null)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={opcoesSeletorModal}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handleSelecionarOpcaoModal(item.value)}
                >
                  <Text style={styles.pickerItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 180,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  filtersContainer: {
    gap: 10,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  statusFilterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  statusFilterText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 12,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  cardMainInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  doctorInfo: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deleteIconBtn: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  pickerSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  pickerSheetLarge: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerItemActive: {
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  pickerItemTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
  },
  confirmTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  confirmBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: 22,
  },
  confirmHighlight: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBackBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmBackText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmDangerBtn: {
    flex: 1.5,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDangerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  newModalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
  },
  newModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 14,
  },
  newModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  newModalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLoadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  newModalForm: {
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: 8,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  textareaField: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 68,
    textAlignVertical: 'top',
  },
  newModalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelModalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  submitModalBtn: {
    flex: 1.2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

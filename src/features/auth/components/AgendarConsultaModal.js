import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  consultarDisponibilidadeProfissional,
  criarAgendamentoProfissional,
} from '../../../lib/profissionaisApi';
import { colors } from '../../../shared/theme/colors';

function inicioDoDia(data) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function adicionarDias(data, quantidade) {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + quantidade);
  return resultado;
}

function paraDataApi(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function nomeClinica(clinica) {
  return clinica?.User?.nome || clinica?.nome || `Clínica #${clinica?.id_clinica}`;
}

function resolverClinicaInicial(clinicas, clinicaInicial) {
  if (clinicaInicial?.id != null) {
    const correspondente = clinicas.find(
      (clinica) => String(clinica.id_clinica) === String(clinicaInicial.id)
    );
    if (correspondente) return String(correspondente.id_clinica);
  }

  if (clinicaInicial?.nome) {
    const nome = clinicaInicial.nome.trim().toLowerCase();
    const correspondente = clinicas.find(
      (clinica) => nomeClinica(clinica).trim().toLowerCase() === nome
    );
    if (correspondente) return String(correspondente.id_clinica);
  }

  return clinicas.length === 1 ? String(clinicas[0].id_clinica) : '';
}

export default function AgendarConsultaModal({
  visible,
  profissional,
  pacienteId,
  clinicaInicial,
  onClose,
}) {
  const hoje = useMemo(() => inicioDoDia(new Date()), []);
  const [semana, setSemana] = useState(0);
  const [dataSelecionada, setDataSelecionada] = useState(hoje);
  const [horarios, setHorarios] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState('');
  const [idClinica, setIdClinica] = useState('');
  const [observacao, setObservacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [tentativa, setTentativa] = useState(0);

  const clinicas = useMemo(() => {
    const relacionadas = Array.isArray(profissional?.Clinicas)
      ? profissional.Clinicas.filter((item) => item?.id_clinica != null)
      : [];
    return relacionadas.filter(
      (item, indice) =>
        relacionadas.findIndex(
          (outra) => String(outra.id_clinica) === String(item.id_clinica)
        ) === indice
    );
  }, [profissional]);

  const diasDaSemana = useMemo(
    () => Array.from({ length: 7 }, (_, indice) => adicionarDias(hoje, semana * 7 + indice)),
    [hoje, semana]
  );
  const dataApi = paraDataApi(dataSelecionada);
  const tituloMes = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(dataSelecionada);

  useEffect(() => {
    setIdClinica(resolverClinicaInicial(clinicas, clinicaInicial));
  }, [clinicas, clinicaInicial, visible]);

  useEffect(() => {
    if (!visible || !profissional?.id_profissional) return undefined;

    const controller = new AbortController();
    setCarregando(true);
    setErro('');
    setHorarios([]);
    setHorarioSelecionado('');

    consultarDisponibilidadeProfissional(
      profissional.id_profissional,
      dataApi,
      controller.signal
    )
      .then((resultado) => {
        if (!controller.signal.aborted) setHorarios(resultado);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setErro(
            error.response?.data?.erro ||
              error.message ||
              'Não foi possível consultar os horários. Tente novamente.'
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });

    return () => controller.abort();
  }, [dataApi, profissional?.id_profissional, tentativa, visible]);

  const selecionarSemana = (deslocamento) => {
    const novaSemana = semana + deslocamento;
    if (novaSemana < 0) return;
    setSemana(novaSemana);
    setDataSelecionada(adicionarDias(hoje, novaSemana * 7));
    setHorarios([]);
    setCarregando(true);
    setHorarioSelecionado('');
    setErro('');
    setAviso('');
  };

  const selecionarData = (data) => {
    setDataSelecionada(data);
    setHorarios([]);
    setCarregando(true);
    setHorarioSelecionado('');
    setErro('');
    setAviso('');
  };

  const fechar = () => {
    if (!salvando) onClose();
  };

  const agendar = async () => {
    if (!pacienteId) {
      setErro('Não foi possível identificar seu cadastro de paciente. Entre novamente.');
      return;
    }
    if (!idClinica) {
      setErro('Selecione uma clínica vinculada a este profissional.');
      return;
    }
    if (!horarioSelecionado) {
      setErro('Selecione um horário disponível.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      await criarAgendamentoProfissional(profissional.id_profissional, {
        id_paciente: Number(pacienteId),
        id_clinica: Number(idClinica),
        data_agendamento: dataApi,
        horario_agendamento: horarioSelecionado,
        observacao: observacao.trim() || null,
      });
      Alert.alert(
        'Consulta agendada',
        'Seu horário foi reservado com sucesso.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      if (error.response?.status === 409) {
        setHorarioSelecionado('');
        setAviso('Esse horário acabou de ficar indisponível. Escolha outro horário.');
        setTentativa((valor) => valor + 1);
      } else {
        setErro(
          error.response?.data?.erro ||
            'Não foi possível agendar a consulta. Tente novamente.'
        );
      }
    } finally {
      setSalvando(false);
    }
  };

  const profissionalNome = profissional?.User?.nome || 'profissional';
  const clinicaSelecionada = clinicas.find(
    (item) => String(item.id_clinica) === String(idClinica)
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={fechar}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar agendamento"
          onPress={fechar}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Agendar consulta</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                com {profissionalNome}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              disabled={salvando}
              onPress={fechar}
              style={styles.closeButton}
            >
              <Feather name="x" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {clinicas.length > 1 ? (
              <View style={styles.section}>
                <Text style={styles.label}>CLÍNICA</Text>
                <View style={styles.clinicaLista}>
                  {clinicas.map((item) => {
                    const selecionada = String(item.id_clinica) === String(idClinica);
                    return (
                      <TouchableOpacity
                        key={String(item.id_clinica)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selecionada }}
                        disabled={salvando}
                        onPress={() => setIdClinica(String(item.id_clinica))}
                        style={[
                          styles.clinicaOpcao,
                          selecionada && styles.opcaoSelecionada,
                        ]}
                      >
                        <Text
                          style={[
                            styles.clinicaTexto,
                            selecionada && styles.textoSelecionado,
                          ]}
                          numberOfLines={1}
                        >
                          {nomeClinica(item)}
                        </Text>
                        {selecionada ? (
                          <Feather name="check" size={16} color={colors.primary} />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : clinicaSelecionada ? (
              <View style={styles.clinicaResumo}>
                <Feather name="map-pin" size={15} color={colors.primary} />
                <Text style={styles.clinicaResumoTexto} numberOfLines={1}>
                  {nomeClinica(clinicaSelecionada)}
                </Text>
              </View>
            ) : null}

            {clinicas.length === 0 ? (
              <Text style={styles.error}>
                Este profissional não possui uma clínica vinculada para o agendamento.
              </Text>
            ) : null}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>ESCOLHA A DATA</Text>
                <Text style={styles.month}>{tituloMes}</Text>
              </View>
              <View style={styles.weekHeader}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Semana anterior"
                  disabled={semana === 0 || salvando}
                  onPress={() => selecionarSemana(-1)}
                  style={[styles.weekArrow, semana === 0 && styles.weekArrowDisabled]}
                >
                  <Feather name="chevron-left" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={styles.days}>
                  {diasDaSemana.map((dia) => {
                    const selecionado = paraDataApi(dia) === dataApi;
                    const semanaDia = new Intl.DateTimeFormat('pt-BR', {
                      weekday: 'short',
                    })
                      .format(dia)
                      .replace('.', '');
                    return (
                      <TouchableOpacity
                        key={paraDataApi(dia)}
                        accessibilityRole="button"
                        accessibilityLabel={dia.toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                        accessibilityState={{ selected: selecionado }}
                        disabled={salvando}
                        onPress={() => selecionarData(dia)}
                        style={[styles.dayButton, selecionado && styles.dayButtonSelected]}
                      >
                        <Text
                          style={[
                            styles.dayName,
                            selecionado && styles.dayTextSelected,
                          ]}
                        >
                          {semanaDia}
                        </Text>
                        <Text
                          style={[
                            styles.dayNumber,
                            selecionado && styles.dayTextSelected,
                          ]}
                        >
                          {dia.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Próxima semana"
                  disabled={salvando}
                  onPress={() => selecionarSemana(1)}
                  style={styles.weekArrow}
                >
                  <Feather name="chevron-right" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>HORÁRIOS DISPONÍVEIS</Text>
              {carregando ? (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.hint}>Consultando horários...</Text>
                </View>
              ) : erro && !horarios.length ? (
                <View style={styles.empty}>
                  <Text style={styles.error}>{erro}</Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    onPress={() => setTentativa((valor) => valor + 1)}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>Tentar novamente</Text>
                  </TouchableOpacity>
                </View>
              ) : horarios.length === 0 ? (
                <View style={styles.empty}>
                  <Feather name="clock" size={22} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Nenhum horário livre nesta data</Text>
                  <Text style={styles.hint}>Escolha outra data para ver novos horários.</Text>
                </View>
              ) : (
                <View style={styles.horarios}>
                  {horarios.map((horario) => {
                    const selecionado = horario === horarioSelecionado;
                    return (
                      <TouchableOpacity
                        key={horario}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selecionado }}
                        disabled={salvando}
                        onPress={() => {
                          setHorarioSelecionado(horario);
                          setAviso('');
                        }}
                        style={[
                          styles.horario,
                          selecionado && styles.horarioSelecionado,
                        ]}
                      >
                        <Text
                          style={[
                            styles.horarioTexto,
                            selecionado && styles.horarioTextoSelecionado,
                          ]}
                        >
                          {horario}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
            {aviso ? (
              <Text accessibilityLiveRegion="polite" style={styles.notice}>
                {aviso}
              </Text>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.label}>MOTIVO / OBSERVAÇÕES</Text>
              <TextInput
                accessibilityLabel="Motivo da consulta ou observações"
                editable={!salvando}
                multiline
                numberOfLines={3}
                maxLength={1000}
                onChangeText={setObservacao}
                placeholder="Informe o motivo da consulta ou alguma observação (opcional)"
                placeholderTextColor={colors.textPlaceholder}
                style={styles.input}
                textAlignVertical="top"
                value={observacao}
              />
            </View>

            {erro && horarios.length > 0 ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {erro}
              </Text>
            ) : null}
            {!pacienteId ? (
              <Text style={styles.error}>
                Não foi possível identificar seu cadastro de paciente. Entre novamente.
              </Text>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              disabled={
                salvando ||
                carregando ||
                !horarioSelecionado ||
                !idClinica ||
                !pacienteId ||
                horarios.length === 0
              }
              onPress={agendar}
              style={[
                styles.submitButton,
                (salvando ||
                  carregando ||
                  !horarioSelecionado ||
                  !idClinica ||
                  !pacienteId ||
                  horarios.length === 0) &&
                  styles.submitButtonDisabled,
              ]}
            >
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check-circle" size={17} color="#FFFFFF" />
                  <Text style={styles.submitText}>Confirmar agendamento</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  sheet: {
    maxHeight: '92%',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerText: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: 20, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  closeButton: { padding: 8, marginLeft: 8 },
  content: { paddingBottom: 12 },
  section: { marginTop: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  month: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekHeader: { flexDirection: 'row', alignItems: 'center' },
  weekArrow: {
    width: 30,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekArrowDisabled: { opacity: 0.35 },
  days: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    minWidth: 35,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  dayButtonSelected: { backgroundColor: colors.primary },
  dayName: { color: colors.textMuted, fontSize: 10, textTransform: 'capitalize' },
  dayNumber: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  dayTextSelected: { color: '#FFFFFF' },
  clinicaLista: { gap: 8 },
  clinicaOpcao: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  opcaoSelecionada: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  clinicaTexto: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  textoSelecionado: { color: colors.primaryText, fontWeight: '700' },
  clinicaResumo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  clinicaResumoTexto: {
    flex: 1,
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  loading: {
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: 8, textAlign: 'center' },
  empty: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceInput,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  horarios: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  horario: {
    minWidth: '22%',
    minHeight: 42,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horarioSelecionado: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  horarioTexto: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  horarioTextoSelecionado: { color: colors.primaryText, fontWeight: '800' },
  input: {
    minHeight: 88,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 14,
  },
  error: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  notice: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: { padding: 10, marginTop: 4 },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  submitButton: {
    minHeight: 50,
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  submitButtonDisabled: { opacity: 0.45 },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

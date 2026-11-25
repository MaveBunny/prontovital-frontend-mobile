import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../../../components/shared/AppHeader';
import api from '../../../lib/api';
import { colors } from '../../../shared/theme/colors';

function formatarDataBr(dataIso) {
  if (!dataIso) return '--/--/----';
  const parteData = String(dataIso).split('T')[0];
  const partes = parteData.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return parteData;
}

function formatarHorario(horarioStr) {
  if (!horarioStr) return '--:--';
  return String(horarioStr).slice(0, 5);
}

function getStatusBadge(statusRaw) {
  const st = String(statusRaw || '').trim().toLowerCase();
  if (st === 'cancelado') {
    return {
      label: 'Cancelado',
      bg: colors.errorBg,
      text: colors.error,
    };
  }
  if (st === 'concluido' || st === 'concluído' || st === 'realizado') {
    return {
      label: 'Concluído',
      bg: colors.primaryLight,
      text: colors.primary,
    };
  }
  if (st === 'pendente') {
    return {
      label: 'Pendente',
      bg: '#FEF3C7',
      text: '#B45309',
    };
  }
  return {
    label: 'Confirmado',
    bg: '#DCFCE7',
    text: '#15803D',
  };
}

export default function AdminVisaoGeralScreen({ navigation }) {
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [resumo, setResumo] = useState({
    clinicas: 0,
    profissionais: 0,
    agendamentos: 0,
  });
  const [agendamentosRecentes, setAgendamentosRecentes] = useState([]);

  const carregarVisaoGeral = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }
      setErro('');

      const [resClinicas, resProfissionais, resAgendamentos] =
        await Promise.all([
          api.get('/clinicas').catch(() => ({ data: [] })),
          api.get('/profissionais').catch(() => ({ data: [] })),
          api.get('/agendamentos').catch(() => ({ data: [] })),
        ]);

      const listaClinicas = Array.isArray(resClinicas.data) ? resClinicas.data : [];
      const listaProfissionais = Array.isArray(resProfissionais.data)
        ? resProfissionais.data
        : [];
      const listaAgendamentos = Array.isArray(resAgendamentos.data)
        ? resAgendamentos.data
        : [];

      setResumo({
        clinicas: listaClinicas.length,
        profissionais: listaProfissionais.length,
        agendamentos: listaAgendamentos.length,
      });

      const mapaEspecialidadePorProfissional = {};
      listaProfissionais.forEach((p) => {
        if (p.id_profissional && p.Especialidade?.nome) {
          mapaEspecialidadePorProfissional[String(p.id_profissional)] =
            p.Especialidade.nome;
        }
      });

      const recentes = listaAgendamentos.slice(0, 8).map((item, idx) => {
        const idProf =
          item.Profissional?.id_profissional || item.id_profissional;
        const especialidadeNome =
          item.Profissional?.Especialidade?.nome ||
          (idProf ? mapaEspecialidadePorProfissional[String(idProf)] : '') ||
          'Não informada';

        return {
          id: String(item.id_agendamento || idx),
          paciente: item.Paciente?.User?.nome || 'Paciente',
          profissional: item.Profissional?.User?.nome || 'Profissional',
          especialidade: especialidadeNome,
          data: formatarDataBr(item.data_agendamento),
          horario: formatarHorario(item.horario_agendamento),
          statusBadge: getStatusBadge(item.status),
        };
      });

      setAgendamentosRecentes(recentes);
    } catch {
      setErro('Não foi possível carregar os dados da rede ProntoVital.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarVisaoGeral();
  }, [carregarVisaoGeral]);

  const cards = [
    {
      key: 'clinicas',
      label: 'Clínicas',
      valor: resumo.clinicas,
      icon: 'home-outline',
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      rota: 'Clinicas',
    },
    {
      key: 'profissionais',
      label: 'Profissionais',
      valor: resumo.profissionais,
      icon: 'people-outline',
      iconBg: '#ECFDF5',
      iconColor: '#0D9488',
      rota: 'Profissionais',
    },
    {
      key: 'agendamentos',
      label: 'Agendamentos',
      valor: resumo.agendamentos,
      icon: 'calendar-outline',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      rota: 'AdminAgendamentos',
    },
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva="Inicio"
        onNavigate={(rota) => navigation?.navigate?.(rota)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarVisaoGeral(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Visão Geral</Text>
          <Text style={styles.subtitle}>Resumo da rede ProntoVital.</Text>
        </View>

        {erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erro}</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.key}
              activeOpacity={card.rota ? 0.75 : 1}
              disabled={!card.rota}
              onPress={() => card.rota && navigation?.navigate?.(card.rota)}
              style={styles.kpiCard}
            >
              <View
                style={[styles.kpiIconBox, { backgroundColor: card.iconBg }]}
              >
                <Ionicons name={card.icon} size={20} color={card.iconColor} />
              </View>
              <Text style={styles.kpiValue}>
                {carregando && !atualizando ? '—' : card.valor}
              </Text>
              <Text style={styles.kpiLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>AGENDAMENTOS RECENTES</Text>

        {carregando && !atualizando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : agendamentosRecentes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhum agendamento registrado na rede até o momento.
            </Text>
          </View>
        ) : (
          <View style={styles.tableCard}>
            {agendamentosRecentes.map((item, index) => {
              const isLast = index === agendamentosRecentes.length - 1;
              return (
                <View
                  key={item.id}
                  style={[styles.appointmentRow, !isLast && styles.rowBorder]}
                >
                  <View style={styles.rowTop}>
                    <Text style={styles.patientName} numberOfLines={1}>
                      {item.paciente}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: item.statusBadge.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: item.statusBadge.text },
                        ]}
                      >
                        {item.statusBadge.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rowMiddle}>
                    <Text style={styles.doctorText} numberOfLines={1}>
                      {item.profissional}
                    </Text>
                    <Text style={styles.dotSeparator}>·</Text>
                    <Text style={styles.specialtyText} numberOfLines={1}>
                      {item.especialidade}
                    </Text>
                  </View>

                  <View style={styles.rowBottom}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color={colors.textMuted}
                      />
                      <Text style={styles.metaText}>{item.data}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={colors.textMuted}
                      />
                      <Text style={styles.metaText}>{item.horario}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 36,
  },
  headerBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 28,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tableCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  appointmentRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  patientName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: colors.textPlaceholder,
    fontWeight: '700',
  },
  specialtyText: {
    fontSize: 13,
    color: colors.textMuted,
    flexShrink: 1,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
});

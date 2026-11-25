import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/shared/AppHeader";
import { useAuth } from "../shared/context/AuthContext";
import { colors } from "../shared/theme/colors";
import {
  buscarAgendamentosPaciente,
  cancelarAgendamentoPaciente,
} from "../lib/pacientesApi";

function formatarDataBr(dataIso) {
  if (!dataIso) return "--/--/----";
  const parteData = String(dataIso).split("T")[0];
  const partes = parteData.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return parteData;
}

function formatarHorario(horarioStr) {
  if (!horarioStr) return "--:--";
  return String(horarioStr).slice(0, 5);
}

function parseDataHoraAgendamento(dataStr, horarioStr) {
  if (!dataStr) return new Date(0);
  const parteData = String(dataStr).split("T")[0];
  const [ano, mes, dia] = parteData.split("-").map(Number);
  const [hora = 0, minuto = 0] = String(horarioStr || "00:00")
    .split(":")
    .map(Number);

  return new Date(ano, (mes || 1) - 1, dia || 1, hora, minuto);
}

function getStatusBadgeStyle(statusRaw) {
  const st = String(statusRaw || "").toLowerCase();
  if (st === "cancelado") {
    return {
      label: "Cancelado",
      bg: colors.errorBg,
      border: colors.errorBorder,
      text: colors.error,
    };
  }
  if (st === "concluido" || st === "realizado") {
    return {
      label: "Concluído",
      bg: colors.surfaceMuted,
      border: colors.borderLight,
      text: colors.textMuted,
    };
  }
  if (st === "pendente" || st === "agendado") {
    return {
      label: st === "pendente" ? "Pendente" : "Agendado",
      bg: colors.primarySoft,
      border: colors.primaryLight,
      text: colors.primary,
    };
  }
  return {
    label: "Confirmado",
    bg: colors.successBg,
    border: colors.successBorder,
    text: colors.success,
  };
}

export default function AgendamentosScreen({ navigation }) {
  const { usuario } = useAuth();

  const [abaAtiva, setAbaAtiva] = useState("proximas"); // 'proximas' | 'historico'
  const [idPaciente, setIdPaciente] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [agendamentoParaCancelar, setAgendamentoParaCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const carregarAgendamentos = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCarregando(true);
      try {
        const res = await buscarAgendamentosPaciente(usuario);
        setIdPaciente(res.idPaciente);
        setAgendamentos(res.agendamentos);
      } catch (error) {
        Alert.alert(
          "Erro",
          error?.response?.data?.message ||
            "Não foi possível carregar seus agendamentos.",
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [usuario],
  );

  useEffect(() => {
    carregarAgendamentos();
  }, [carregarAgendamentos]);

  const onRefresh = () => {
    setAtualizando(true);
    carregarAgendamentos(true);
  };

  const { proximasConsultas, historicoConsultas } = useMemo(() => {
    const agora = new Date();
    const proximas = [];
    const historico = [];

    agendamentos.forEach((item) => {
      const status = String(item.status || "").toLowerCase();
      const dataHora = parseDataHoraAgendamento(
        item.data_agendamento,
        item.horario_agendamento,
      );

      const jaPassou = dataHora < agora;
      const inativo =
        status === "cancelado" ||
        status === "concluido" ||
        status === "realizado";

      if (jaPassou || inativo) {
        historico.push({ ...item, _timestamp: dataHora.getTime() });
      } else {
        proximas.push({ ...item, _timestamp: dataHora.getTime() });
      }
    });

    // Próximas: mais perto primeiro; Histórico: mais recente primeiro
    proximas.sort((a, b) => a._timestamp - b._timestamp);
    historico.sort((a, b) => b._timestamp - a._timestamp);

    return {
      proximasConsultas: proximas,
      historicoConsultas: historico,
    };
  }, [agendamentos]);

  const listaExibida =
    abaAtiva === "proximas" ? proximasConsultas : historicoConsultas;

  const confirmarCancelamento = async () => {
    if (!idPaciente || !agendamentoParaCancelar) return;

    setCancelando(true);
    try {
      await cancelarAgendamentoPaciente(
        idPaciente,
        agendamentoParaCancelar.id_agendamento,
      );
      setAgendamentoParaCancelar(null);
      await carregarAgendamentos(true);
      Alert.alert("Consulta cancelada", "Seu agendamento foi cancelado.");
    } catch (error) {
      Alert.alert(
        "Erro ao cancelar",
        error?.response?.data?.message ||
          error?.response?.data?.erro ||
          "Não foi possível cancelar esta consulta.",
      );
    } finally {
      setCancelando(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva="Agendamentos"
        onNavigate={(rota) => navigation.navigate(rota)}
      />

      <View style={styles.topSection}>
        <Text style={styles.pageTitle}>Meus Agendamentos</Text>
        <Text style={styles.pageSubtitle}>
          Acompanhe suas próximas consultas e o histórico de atendimentos.
        </Text>

        {/* Seletor de Abas */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              abaAtiva === "proximas" && styles.tabButtonActive,
            ]}
            onPress={() => setAbaAtiva("proximas")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                abaAtiva === "proximas" && styles.tabTextActive,
              ]}
            >
              Próximas ({proximasConsultas.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              abaAtiva === "historico" && styles.tabButtonActive,
            ]}
            onPress={() => setAbaAtiva("historico")}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                abaAtiva === "historico" && styles.tabTextActive,
              ]}
            >
              Histórico ({historicoConsultas.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {carregando ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {listaExibida.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="calendar-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {abaAtiva === "proximas"
                  ? "Nenhuma consulta agendada"
                  : "Nenhum histórico encontrado"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {abaAtiva === "proximas"
                  ? "Você ainda não possui consultas futuras marcadas."
                  : "Suas consultas anteriores ou canceladas aparecerão aqui."}
              </Text>

              {abaAtiva === "proximas" && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => navigation.navigate("Clinicas")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyActionText}>Buscar Clínicas</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            listaExibida.map((item) => {
              const badge = getStatusBadgeStyle(item.status);
              const nomeProfissional =
                item.Profissional?.User?.nome || "Profissional não informado";
              const especialidade =
                item.Profissional?.Especialidade?.nome || "Especialidade";
              const nomeClinica =
                item.Clinica?.User?.nome || "Clínica não informada";
              const bairroClinica = item.Clinica?.bairro;
              const dataBr = formatarDataBr(item.data_agendamento);
              const horario = formatarHorario(item.horario_agendamento);

              return (
                <View key={item.id_agendamento} style={styles.card}>
                  {/* Topo do Card: Profissional + Badge Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.profInfo}>
                      <Text style={styles.profName}>{nomeProfissional}</Text>
                      <Text style={styles.specialtyText}>{especialidade}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: badge.bg,
                          borderColor: badge.border,
                        },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Detalhes: Clínica, Data e Horário */}
                  <View style={styles.detailsList}>
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="business-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.detailText}>
                        {nomeClinica}
                        {bairroClinica ? ` • ${bairroClinica}` : ""}
                      </Text>
                    </View>

                    <View style={styles.dateTimeRow}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.detailText}>{dataBr}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color={colors.primary}
                        />
                        <Text style={styles.detailText}>{horario}</Text>
                      </View>
                    </View>

                    {!!item.observacao && (
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="document-text-outline"
                          size={16}
                          color={colors.textMuted}
                        />
                        <Text style={styles.obsText} numberOfLines={2}>
                          {item.observacao}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Botão Cancelar (apenas na aba Próximas) */}
                  {abaAtiva === "proximas" && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setAgendamentoParaCancelar(item)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color={colors.error}
                      />
                      <Text style={styles.cancelButtonText}>
                        Cancelar consulta
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      <Modal
        visible={!!agendamentoParaCancelar}
        transparent
        animationType="fade"
        onRequestClose={() => !cancelando && setAgendamentoParaCancelar(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !cancelando && setAgendamentoParaCancelar(null)}
        >
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>Cancelar consulta?</Text>
            <Text style={styles.modalBody}>
              Deseja realmente cancelar sua consulta com{" "}
              <Text style={styles.modalHighlight}>
                {agendamentoParaCancelar?.Profissional?.User?.nome ||
                  "este profissional"}
              </Text>{" "}
              no dia{" "}
              <Text style={styles.modalHighlight}>
                {formatarDataBr(agendamentoParaCancelar?.data_agendamento)}
              </Text>{" "}
              às{" "}
              <Text style={styles.modalHighlight}>
                {formatarHorario(agendamentoParaCancelar?.horario_agendamento)}
              </Text>
              ?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalKeepButton}
                onPress={() => setAgendamentoParaCancelar(null)}
                disabled={cancelando}
              >
                <Text style={styles.modalKeepText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmCancelButton}
                onPress={confirmarCancelamento}
                disabled={cancelando}
              >
                {cancelando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmCancelText}>
                    Sim, Cancelar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 18,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 32,
    gap: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 18,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  profInfo: {
    flex: 1,
  },
  profName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 14,
  },
  detailsList: {
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  obsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.error,
  },
  /* Estado vazio */
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 28,
    alignItems: "center",
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
  },
  emptyActionButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },
  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: 22,
  },
  modalHighlight: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalKeepButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalKeepText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modalConfirmCancelButton: {
    flex: 1.3,
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

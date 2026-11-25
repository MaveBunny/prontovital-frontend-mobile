import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/shared/AppHeader";
import { useAuth } from "../shared/context/AuthContext";
import { colors } from "../shared/theme/colors";
import {
  atualizarPerfilUsuario,
  buscarPerfilPaciente,
  cancelarContaUsuario,
} from "../lib/pacientesApi";
import {
  limparDigitos,
  mascaraCPF,
  mascaraTelefone,
} from "../shared/utils/masks";

function formatarDataBr(dataIso) {
  if (!dataIso) return "";
  const str = String(dataIso).split("T")[0];
  const partes = str.split("-");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return str;
}

function normalizarSexo(valor) {
  if (!valor) return "Masculino";
  const v = String(valor).trim().toLowerCase();
  if (v === "f" || v.startsWith("fem")) return "Feminino";
  if (v === "o" || v.startsWith("out")) return "Outro";
  return "Masculino";
}

export default function PerfilScreen({ navigation }) {
  const { usuario, logout, atualizarUsuarioLocal } = useAuth();

  const [carregandoDados, setCarregandoDados] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const [modoEdicao, setModoEdicao] = useState(false);
  const [modalExcluirVisivel, setModalExcluirVisivel] = useState(false);

  const [perfil, setPerfil] = useState({
    nome: usuario?.nome || "",
    email: usuario?.email || "",
    telefone: usuario?.telefone || "",
    endereco: usuario?.endereco || "",
    cidade: usuario?.cidade || "",
    estado: usuario?.estado || "",
    cpf: "",
    data_nascimento: "",
    sexo: "Masculino",
    observacoes: "",
  });

  const [form, setForm] = useState({ ...perfil });

  const carregarDadosPerfil = useCallback(async () => {
    setCarregandoDados(true);
    try {
      const dados = await buscarPerfilPaciente(usuario);
      const userObj = dados?.User || dados?.Usuario || dados?.usuario || {};
      const pacObj = dados || {};

      const consolidado = {
        nome: userObj.nome || usuario?.nome || "",
        email: userObj.email || usuario?.email || "",
        telefone: userObj.telefone || usuario?.telefone || "",
        endereco: userObj.endereco || usuario?.endereco || "",
        cidade: userObj.cidade || usuario?.cidade || "",
        estado: userObj.estado || usuario?.estado || "",
        cpf: pacObj.cpf || "",
        data_nascimento: formatarDataBr(pacObj.data_nascimento),
        sexo: normalizarSexo(pacObj.sexo),
        observacoes: pacObj.observacoes || pacObj.observacoes_medicas || "",
      };

      setPerfil(consolidado);
      setForm(consolidado);
    } catch (error) {
      Alert.alert(
        "Aviso",
        error?.response?.data?.message ||
          "Não foi possível carregar todos os dados do perfil.",
      );
    } finally {
      setCarregandoDados(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregarDadosPerfil();
  }, [carregarDadosPerfil]);

  const abrirEdicao = () => {
    setForm({
      ...perfil,
      telefone: mascaraTelefone(perfil.telefone),
      cpf: mascaraCPF(perfil.cpf),
    });
    setModoEdicao(true);
  };

  const handleSalvarAlteracoes = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      Alert.alert("Campos obrigatórios", "Nome e e-mail são obrigatórios.");
      return;
    }

    setSalvando(true);
    try {
      // Envia apenas os campos permitidos pela rota PATCH /usuarios/perfil
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: limparDigitos(form.telefone),
        endereco: form.endereco.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
      };

      await atualizarPerfilUsuario(payload);
      await atualizarUsuarioLocal(payload);
      await carregarDadosPerfil();

      setModoEdicao(false);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    } catch (error) {
      Alert.alert(
        "Erro ao salvar",
        error?.response?.data?.message ||
          error?.response?.data?.erro ||
          "Não foi possível atualizar os dados.",
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    setExcluindo(true);
    try {
      await cancelarContaUsuario();
      setModalExcluirVisivel(false);
      await logout();
    } catch (error) {
      setExcluindo(false);
      Alert.alert(
        "Erro",
        error?.response?.data?.message ||
          "Não foi possível excluir a conta no momento.",
      );
    }
  };

  const inicial = (perfil.nome || "U").charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva="Perfil"
        onNavigate={(rota) => {
          setModoEdicao(false);
          navigation.navigate(rota);
        }}
      />

      {carregandoDados ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : modoEdicao ? (
        /* ================= MODO EDIÇÃO ================= */
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.editHeaderRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setModoEdicao(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.editHeaderTitle}>Editar Perfil</Text>
            </View>

            {/* Card Dados Pessoais (Editáveis) */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>DADOS PESSOAIS</Text>

              <Text style={styles.inputLabel}>Nome completo</Text>
              <TextInput
                style={styles.input}
                value={form.nome}
                onChangeText={(t) => setForm((p) => ({ ...p, nome: t }))}
                placeholder="Seu nome completo"
                placeholderTextColor={colors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>E-mail</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(t) => setForm((p) => ({ ...p, email: t }))}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="seu@email.com"
                placeholderTextColor={colors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={form.telefone}
                onChangeText={(t) =>
                  setForm((p) => ({ ...p, telefone: mascaraTelefone(t) }))
                }
                keyboardType="phone-pad"
                placeholder="(81) 99999-9999"
                placeholderTextColor={colors.textPlaceholder}
              />

              <Text style={styles.inputLabel}>Endereço</Text>
              <TextInput
                style={styles.input}
                value={form.endereco}
                onChangeText={(t) => setForm((p) => ({ ...p, endereco: t }))}
                placeholder="Rua, número, bairro"
                placeholderTextColor={colors.textPlaceholder}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1.4 }}>
                  <Text style={styles.inputLabel}>Cidade</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 0 }]}
                    value={form.cidade}
                    onChangeText={(t) => setForm((p) => ({ ...p, cidade: t }))}
                    placeholder="Recife"
                    placeholderTextColor={colors.textPlaceholder}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Estado (UF)</Text>
                  <TextInput
                    style={[styles.input, { marginBottom: 0 }]}
                    value={form.estado}
                    onChangeText={(t) =>
                      setForm((p) => ({
                        ...p,
                        estado: t.toUpperCase().slice(0, 2),
                      }))
                    }
                    maxLength={2}
                    autoCapitalize="characters"
                    placeholder="PE"
                    placeholderTextColor={colors.textPlaceholder}
                  />
                </View>
              </View>
            </View>

            {/* Card Dados de Paciente (Somente leitura) */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>DADOS DE PACIENTE</Text>

              <Text style={styles.inputLabel}>CPF</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={form.cpf || "Não informado"}
                editable={false}
              />

              <Text style={styles.inputLabel}>Data de Nascimento</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={form.data_nascimento || "Não informado"}
                editable={false}
              />

              <Text style={styles.inputLabel}>Sexo</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={form.sexo || "Não informado"}
                editable={false}
              />

              <Text style={styles.inputLabel}>Observações Médicas</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inputDisabled,
                  { marginBottom: 0 },
                ]}
                value={form.observacoes || "Nenhuma observação"}
                editable={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, salvando && { opacity: 0.7 }]}
              onPress={handleSalvarAlteracoes}
              disabled={salvando}
              activeOpacity={0.8}
            >
              {salvando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Salvar alterações</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* ================= MODO VISUALIZAÇÃO ================= */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Cabeçalho do Perfil */}
            <View style={styles.profileTopRow}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{inicial}</Text>
              </View>

              <View style={styles.profileNameBlock}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {perfil.nome || "Usuário"}
                </Text>
                <Text style={styles.profileRole}>Paciente</Text>
              </View>

              <TouchableOpacity
                style={styles.editPillButton}
                onPress={abrirEdicao}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={14} color="#FFFFFF" />
                <Text style={styles.editPillText}>Editar perfil</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Lista de Informações */}
            <InfoItem label="CPF" value={mascaraCPF(perfil.cpf)} />
            <InfoItem label="E-mail" value={perfil.email} />
            <InfoItem
              label="Telefone"
              value={mascaraTelefone(perfil.telefone)}
            />
            <InfoItem label="Sexo" value={perfil.sexo} />
            <InfoItem
              label="Data de Nascimento"
              value={perfil.data_nascimento}
            />
            <InfoItem
              label="Cidade / Estado"
              value={
                perfil.cidade || perfil.estado
                  ? `${perfil.cidade || ""}${
                      perfil.cidade && perfil.estado ? " / " : ""
                    }${perfil.estado || ""}`
                  : ""
              }
            />
            <InfoItem label="Endereço" value={perfil.endereco} />

            <View style={styles.divider} />

            <Text style={styles.sectionLabel}>OBSERVAÇÕES CLÍNICAS</Text>
            <InfoItem
              label="Observações"
              value={perfil.observacoes || "Nenhuma observação"}
              last
            />
          </View>

          {/* Zona de Risco */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>ZONA DE RISCO</Text>
            <Text style={styles.dangerDescription}>
              Excluir permanentemente sua conta e todos os dados.
            </Text>

            <TouchableOpacity
              style={styles.dangerOutlineButton}
              onPress={() => setModalExcluirVisivel(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.dangerOutlineText}>Excluir conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        visible={modalExcluirVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => !excluindo && setModalExcluirVisivel(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !excluindo && setModalExcluirVisivel(false)}
        >
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>Excluir conta?</Text>
            <Text style={styles.modalBody}>
              Tem certeza que deseja excluir permanentemente sua conta? Todos os
              seus dados pessoais, histórico de triagens e consultas agendadas
              serão removidos.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalExcluirVisivel(false)}
                disabled={excluindo}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmDeleteButton}
                onPress={handleConfirmarExclusao}
                disabled={excluindo}
              >
                {excluindo ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmDeleteText}>
                    Sim, Excluir Minha Conta
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

function InfoItem({ label, value, last = false }) {
  return (
    <View style={[styles.infoItem, last && { marginBottom: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Não informado"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 20,
    marginBottom: 18,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLargeText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  profileNameBlock: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  profileRole: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  editPillButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  editPillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPlaceholder,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  infoItem: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textMuted,
  },
  dangerCard: {
    backgroundColor: colors.errorBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    padding: 20,
  },
  dangerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.error,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  dangerDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  dangerOutlineButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dangerOutlineText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: "700",
  },
  /* Edição */
  editHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  editHeaderTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceMuted,
    color: colors.textMuted,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  /* Modal Excluir */
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
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  modalConfirmDeleteButton: {
    flex: 1.4,
    backgroundColor: "#E11D48",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmDeleteText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
});

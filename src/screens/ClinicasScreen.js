import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Keyboard,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/shared/AppHeader";
import ClinicaCard from "../components/ClinicaCard";
import api from "../lib/api";
import { clinicaService, profissionalService } from "../services/api";
import { useAuth } from "../shared/context/AuthContext";
import { colors } from "../shared/theme/colors";
import {
  limparDigitos,
  mascaraCNPJ,
  mascaraTelefone,
} from "../shared/utils/masks";

const FORM_INICIAL = {
  nome: "",
  cnpj: "",
  email: "",
  senha: "",
  endereco: "",
  localizacao: "",
  cidade: "Recife",
  estado: "PE",
  telefone: "",
};

/**
 * Tela de Consulta de Clínicas do ProntoVital.
 * Utiliza o AppHeader padrão com menu sanduíche funcional e consome dados reais do backend.
 */
export default function ClinicasScreen({
  navigation,
  onNavigateToProfissionais,
}) {
  const { usuario } = useAuth();
  const isAdmin =
    String(usuario?.perfil || usuario?.tipo || "")
      .trim()
      .toLowerCase() === "admin";

  const [clinicas, setClinicas] = useState([]);
  const [resumoPorClinica, setResumoPorClinica] = useState({});
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [form, setForm] = useState(FORM_INICIAL);

  const carregarDados = useCallback(async (termo = "", isRefresh = false) => {
    try {
      if (isRefresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      const [listaClinicas, mapaResumo] = await Promise.all([
        clinicaService.listar(termo),
        profissionalService.obterResumoPorClinica(),
      ]);

      setClinicas(Array.isArray(listaClinicas) ? listaClinicas : []);
      if (mapaResumo) {
        setResumoPorClinica(mapaResumo);
      }
    } catch (err) {
      console.warn("[ClinicasScreen] Falha ao consultar API:", err.message);
      setClinicas([]);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const onRefresh = useCallback(() => {
    carregarDados(termoBusca, true);
  }, [carregarDados, termoBusca]);

  const clinicasFiltradas = useMemo(() => {
    if (!termoBusca.trim()) {
      return clinicas;
    }
    const termo = termoBusca.trim().toLowerCase();
    return clinicas.filter((item) => {
      const nome = item.User?.nome?.toLowerCase() || "";
      const bairro = item.bairro?.toLowerCase() || "";
      return nome.includes(termo) || bairro.includes(termo);
    });
  }, [clinicas, termoBusca]);

  const handleSubmeterBusca = () => {
    Keyboard.dismiss();
    carregarDados(termoBusca);
  };

  const handleVerProfissionais = (clinica) => {
    const nomeClinica = clinica.User?.nome || "";

    if (onNavigateToProfissionais) {
      onNavigateToProfissionais({
        clinicaNome: nomeClinica,
        idClinica: clinica.id_clinica,
      });
      return;
    }

    if (navigation && typeof navigation.navigate === "function") {
      navigation.navigate("Profissionais", {
        clinicaNome: nomeClinica,
        idClinica: clinica.id_clinica,
      });
    }
  };

  const abrirModalNovo = () => {
    setErroForm("");
    setForm(FORM_INICIAL);
    setModalNovoAberto(true);
  };

  const fecharModalNovo = () => {
    if (salvando) return;
    setModalNovoAberto(false);
    setErroForm("");
    setForm(FORM_INICIAL);
  };

  const handleCadastrarClinica = async () => {
    setErroForm("");

    if (!form.nome.trim()) {
      setErroForm("Informe o nome da clínica.");
      return;
    }
    if (!limparDigitos(form.cnpj)) {
      setErroForm("Informe o CNPJ da clínica.");
      return;
    }
    if (!form.email.trim()) {
      setErroForm("Informe o e-mail de acesso.");
      return;
    }
    if (!form.senha || form.senha.length < 6) {
      setErroForm("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (!form.endereco.trim()) {
      setErroForm("Informe o endereço da clínica.");
      return;
    }
    if (!form.localizacao.trim()) {
      setErroForm("Informe o bairro ou cidade.");
      return;
    }
    if (!limparDigitos(form.telefone)) {
      setErroForm("Informe o telefone da clínica.");
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        endereco: form.endereco.trim(),
        cidade: form.cidade || "Recife",
        estado: form.estado || "PE",
        telefone: limparDigitos(form.telefone),
        perfil: "clinica",
        clinica: {
          cnpj: limparDigitos(form.cnpj) || form.cnpj.trim(),
          bairro: form.localizacao.trim(),
        },
      };

      await api.post("/usuarios", payload);
      setModalNovoAberto(false);
      setForm(FORM_INICIAL);
      await carregarDados(termoBusca, true);
    } catch (err) {
      const msg =
        err.response?.data?.mensagem ||
        err.response?.data?.erro ||
        err.response?.data?.message ||
        "Erro ao cadastrar clínica no banco de dados.";
      setErroForm(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva="Clinicas"
        onNavigate={(rota) => navigation?.navigate?.(rota)}
      />

      <View style={styles.corpo}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.titulo}>Clínicas</Text>
            <Text style={styles.subtitulo}>
              {isAdmin
                ? "Gerencie as unidades parceiras da rede e toque em uma clínica para ver os profissionais vinculados."
                : "Selecione uma clínica para ver os profissionais disponíveis e agendar sua consulta."}
            </Text>
          </View>

          {isAdmin ? (
            <TouchableOpacity
              style={styles.newClinicButton}
              activeOpacity={0.85}
              onPress={abrirModalNovo}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.newClinicButtonText}>Nova Clínica</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.buscaContainer}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.inputBusca}
            placeholder="Buscar por nome ou bairro..."
            placeholderTextColor="#94A3B8"
            value={termoBusca}
            onChangeText={setTermoBusca}
            onSubmitEditing={handleSubmeterBusca}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {carregando && !atualizando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={clinicasFiltradas}
            keyExtractor={(item) => String(item.id_clinica)}
            renderItem={({ item }) => {
              const resumo = resumoPorClinica[item.id_clinica] || {
                total: 0,
                especialidades: [],
                profissionais: [],
              };
              return (
                <ClinicaCard
                  clinica={item}
                  totalProfissionais={resumo.total}
                  especialidades={resumo.especialidades}
                  nomesProfissionais={resumo.profissionais}
                  onVerProfissionais={handleVerProfissionais}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="search-outline" size={24} color="#64748B" />
                </View>
                <Text style={styles.emptyTitle}>Nenhuma clínica encontrada</Text>
                <Text style={styles.emptySubtitle}>
                  Tente buscar por outro termo ou bairro.
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={onRefresh}
                colors={["#2563EB"]}
                tintColor="#2563EB"
              />
            }
          />
        )}
      </View>

      {isAdmin ? (
        <Modal
          visible={modalNovoAberto}
          transparent
          animationType="slide"
          onRequestClose={fecharModalNovo}
        >
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={fecharModalNovo}
            />
            <View style={styles.newModalCard}>
              <Text style={styles.newModalSectionHeader}>
                CADASTRAR NOVA CLÍNICA
              </Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.newModalForm}
              >
                {erroForm ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{erroForm}</Text>
                  </View>
                ) : null}

                <Text style={styles.fieldLabel}>NOME</Text>
                <TextInput
                  style={styles.inputField}
                  value={form.nome}
                  onChangeText={(t) => setForm((p) => ({ ...p, nome: t }))}
                  placeholder="Nome da clínica"
                  placeholderTextColor={colors.textPlaceholder}
                  autoComplete="off"
                />

                <Text style={styles.fieldLabel}>CNPJ</Text>
                <TextInput
                  style={styles.inputField}
                  value={form.cnpj}
                  onChangeText={(t) =>
                    setForm((p) => ({ ...p, cnpj: mascaraCNPJ(t) }))
                  }
                  placeholder="00.000.000/0001-00"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="number-pad"
                  maxLength={18}
                  autoComplete="off"
                />

                <Text style={styles.fieldLabel}>E-MAIL DE ACESSO</Text>
                <TextInput
                  style={styles.inputField}
                  value={form.email}
                  onChangeText={(t) => setForm((p) => ({ ...p, email: t }))}
                  placeholder="contato@clinica.com"
                  placeholderTextColor={colors.textPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />

                <Text style={styles.fieldLabel}>SENHA DE ACESSO</Text>
                <TextInput
                  style={styles.inputField}
                  value={form.senha}
                  onChangeText={(t) => setForm((p) => ({ ...p, senha: t }))}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={colors.textPlaceholder}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="off"
                  textContentType="oneTimeCode"
                />

                <Text style={styles.fieldLabel}>ENDEREÇO</Text>
                <TextInput
                  style={styles.inputField}
                  value={form.endereco}
                  onChangeText={(t) => setForm((p) => ({ ...p, endereco: t }))}
                  placeholder="Rua, número"
                  placeholderTextColor={colors.textPlaceholder}
                  autoComplete="off"
                />

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>BAIRRO / CIDADE</Text>
                    <TextInput
                      style={styles.inputField}
                      value={form.localizacao}
                      onChangeText={(t) =>
                        setForm((p) => ({ ...p, localizacao: t }))
                      }
                      placeholder="Bairro"
                      placeholderTextColor={colors.textPlaceholder}
                      autoComplete="off"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>TELEFONE</Text>
                    <TextInput
                      style={styles.inputField}
                      value={form.telefone}
                      onChangeText={(t) =>
                        setForm((p) => ({
                          ...p,
                          telefone: mascaraTelefone(t),
                        }))
                      }
                      placeholder="(81) 3000-0000"
                      placeholderTextColor={colors.textPlaceholder}
                      keyboardType="phone-pad"
                      maxLength={15}
                      autoComplete="off"
                    />
                  </View>
                </View>

                <View style={styles.newModalFooter}>
                  <TouchableOpacity
                    style={styles.submitModalBtn}
                    disabled={salvando}
                    onPress={handleCadastrarClinica}
                  >
                    {salvando ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitModalBtnText}>Cadastrar</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelOutlineBtn}
                    disabled={salvando}
                    onPress={fecharModalNovo}
                  >
                    <Text style={styles.cancelOutlineBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  corpo: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    paddingBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  newClinicButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 2,
  },
  newClinicButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  newModalCard: {
    width: "100%",
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,
  },
  newModalSectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  newModalForm: {
    paddingBottom: 6,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 10,
  },
  inputField: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 14,
    color: "#0F172A",
  },
  twoColRow: {
    flexDirection: "row",
    gap: 12,
  },
  newModalFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 22,
  },
  submitModalBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    minWidth: 115,
    alignItems: "center",
    justifyContent: "center",
  },
  submitModalBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  cancelOutlineBtn: {
    borderWidth: 1,
    borderColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelOutlineBtnText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
  buscaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 16,
    marginBottom: 18,
  },
  inputBusca: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    marginLeft: 10,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EDF2F7",
    marginHorizontal: 16,
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
});

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/shared/AppHeader";
import { profissionalService } from "../services/api";

/**
 * Tela de Listagem e Consulta de Profissionais.
 * Utiliza o AppHeader padrão com menu sanduíche funcional e consome dados reais do backend.
 */
export default function ProfissionaisScreen({
  route,
  navigation,
  filtroInicialClinica = "",
}) {
  const clinicaParam =
    route?.params?.clinicaNome || filtroInicialClinica || "";

  const [filtroClinica, setFiltroClinica] = useState(clinicaParam);
  const [termoBusca, setTermoBusca] = useState("");
  const [profissionais, setProfissionais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    setFiltroClinica(clinicaParam);
  }, [clinicaParam]);

  const carregarProfissionais = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setAtualizando(true);
        } else {
          setCarregando(true);
        }

        const termo = filtroClinica || termoBusca;
        const data = await profissionalService.listar({ busca: termo });

        setProfissionais(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn(
          "[ProfissionaisScreen] Erro ao carregar profissionais:",
          err.message,
        );
        setProfissionais([]);
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [filtroClinica, termoBusca],
  );

  useEffect(() => {
    carregarProfissionais();
  }, [carregarProfissionais]);

  const onRefresh = () => {
    carregarProfissionais(true);
  };

  const handleRemoverFiltroClinica = () => {
    setFiltroClinica("");
  };

  const renderCardProfissional = ({ item }) => {
    const nome = item.User?.nome || "Profissional";
    const especialidade = item.Especialidade?.nome || "";
    const conselho = item.conselho
      ? `${item.conselho}: ${item.registro_profissional || ""}`
      : "";
    const clinicasNomes = Array.isArray(item.Clinicas)
      ? item.Clinicas.map((c) => c.User?.nome).filter(Boolean).join(", ")
      : "";

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={22} color="#0D9488" />
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.nomeProfissional}>{nome}</Text>
            {especialidade ? (
              <View style={styles.badgeEspecialidade}>
                <Text style={styles.badgeEspecialidadeTexto}>
                  {especialidade}
                </Text>
              </View>
            ) : null}
            {conselho ? (
              <Text style={styles.conselhoText}>{conselho}</Text>
            ) : null}
            {clinicasNomes ? (
              <View style={styles.clinicaRow}>
                <Ionicons name="business-outline" size={12} color="#2563EB" />
                <Text style={styles.clinicaText} numberOfLines={1}>
                  {clinicasNomes}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva="Profissionais"
        onNavigate={(rota) => navigation?.navigate?.(rota)}
      />

      <View style={styles.header}>
        <Text style={styles.titulo}>Profissionais</Text>
        <Text style={styles.subtitulo}>
          Encontre especialistas disponíveis nas clínicas credenciadas.
        </Text>

        {filtroClinica ? (
          <View style={styles.filtroAtivoContainer}>
            <Text style={styles.filtroAtivoLabel}>Filtrando por clínica:</Text>
            <View style={styles.tagClinica}>
              <Text style={styles.tagClinicaTexto} numberOfLines={1}>
                {filtroClinica}
              </Text>
              <TouchableOpacity
                onPress={handleRemoverFiltroClinica}
                style={styles.removerTagBotao}
                accessibilityRole="button"
                accessibilityLabel="Remover filtro de clínica"
              >
                <Ionicons name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.buscaContainer}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />
            <TextInput
              style={styles.inputBusca}
              placeholder="Buscar por profissional ou clínica..."
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              onSubmitEditing={() => carregarProfissionais()}
              returnKeyType="search"
            />
          </View>
        )}
      </View>

      {carregando && !atualizando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={profissionais}
          keyExtractor={(item) => String(item.id_profissional)}
          renderItem={renderCardProfissional}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={onRefresh}
              colors={["#2563EB"]}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={24} color="#64748B" />
              </View>
              <Text style={styles.emptyTitle}>
                Nenhum profissional encontrado
              </Text>
              <Text style={styles.emptySub}>
                {filtroClinica
                  ? `Nenhum profissional vinculado à clínica "${filtroClinica}".`
                  : "Tente buscar por outro nome ou clínica."}
              </Text>
              {filtroClinica ? (
                <TouchableOpacity
                  style={styles.botaoVerTodos}
                  onPress={handleRemoverFiltroClinica}
                >
                  <Text style={styles.botaoVerTodosTexto}>
                    Ver todos os profissionais
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: "#F8FAFC",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 16,
  },
  filtroAtivoContainer: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    padding: 10,
  },
  filtroAtivoLabel: {
    fontSize: 11,
    color: "#0369A1",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tagClinica: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0F2FE",
  },
  tagClinicaTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
    flex: 1,
  },
  removerTagBotao: {
    paddingLeft: 8,
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
  },
  inputBusca: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    marginLeft: 10,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 24,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F0FDFA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  nomeProfissional: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  badgeEspecialidade: {
    alignSelf: "flex-start",
    backgroundColor: "#E6F7F0",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeEspecialidadeTexto: {
    fontSize: 11,
    color: "#0D9488",
    fontWeight: "600",
  },
  conselhoText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  clinicaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  clinicaText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "500",
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
  emptySub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 16,
  },
  botaoVerTodos: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  botaoVerTodosTexto: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});

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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/shared/AppHeader";
import ClinicaCard from "../components/ClinicaCard";
import { clinicaService, profissionalService } from "../services/api";

/**
 * Tela de Consulta de Clínicas do ProntoVital.
 * Utiliza o AppHeader padrão com menu sanduíche funcional e consome dados reais do backend.
 */
export default function ClinicasScreen({
  navigation,
  onNavigateToProfissionais,
}) {
  const [clinicas, setClinicas] = useState([]);
  const [resumoPorClinica, setResumoPorClinica] = useState({});
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

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

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva="Clinicas"
        onNavigate={(rota) => navigation?.navigate?.(rota)}
      />

      <View style={styles.corpo}>
        <Text style={styles.titulo}>Clínicas</Text>
        <Text style={styles.subtitulo}>
          Selecione uma clínica para ver os profissionais disponíveis e agendar
          sua consulta.
        </Text>

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
              };
              return (
                <ClinicaCard
                  clinica={item}
                  totalProfissionais={resumo.total}
                  especialidades={resumo.especialidades}
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
  titulo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 18,
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

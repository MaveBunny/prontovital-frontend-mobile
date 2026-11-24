import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Keyboard,
  Platform,
} from 'react-native';
import ClinicaCard from '../components/ClinicaCard';
import { LogoProntoVital, IconeMenu, IconeLupa } from '../components/Icons';
import { clinicaService, profissionalService } from '../services/api';

/**
 * Tela de Consulta de Clínicas do ProntoVital.
 * Visual 100% fiel ao protótipo, consumindo exclusivamente a API REST.
 */
export default function ClinicasScreen({
  navigation,
  onNavigateToProfissionais,
  onLogout,
}) {
  const [clinicas, setClinicas] = useState([]);
  const [contagemProfissionais, setContagemProfissionais] = useState({});
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  /**
   * Consulta a API REST local (prontovital-api).
   */
  const carregarDados = useCallback(async (termo = '', isRefresh = false) => {
    try {
      if (isRefresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      const [listaClinicas, mapaContagem] = await Promise.all([
        clinicaService.listar(termo),
        profissionalService.obterContagemPorClinica(),
      ]);

      setClinicas(Array.isArray(listaClinicas) ? listaClinicas : []);
      if (mapaContagem) {
        setContagemProfissionais(mapaContagem);
      }
    } catch (err) {
      console.warn('[ClinicasScreen] Falha ao consultar API:', err.message);
      // Mantém array vazio em caso de erro sem dados mockados
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

  /**
   * Filtro dinâmico por nome da clínica ou bairro.
   */
  const clinicasFiltradas = useMemo(() => {
    if (!termoBusca.trim()) {
      return clinicas;
    }
    const termo = termoBusca.trim().toLowerCase();
    return clinicas.filter((item) => {
      const nome = item.User?.nome?.toLowerCase() || '';
      const bairro = item.bairro?.toLowerCase() || '';
      return nome.includes(termo) || bairro.includes(termo);
    });
  }, [clinicas, termoBusca]);

  const handleSubmeterBusca = () => {
    Keyboard.dismiss();
    carregarDados(termoBusca);
  };

  /**
   * Navega para profissionais com o filtro da clínica.
   */
  const handleVerProfissionais = (clinica) => {
    const nomeClinica = clinica.User?.nome || '';

    if (onNavigateToProfissionais) {
      onNavigateToProfissionais({
        clinicaNome: nomeClinica,
        idClinica: clinica.id_clinica,
      });
      return;
    }

    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('Profissionais', {
        clinicaNome: nomeClinica,
        idClinica: clinica.id_clinica,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Topo / Header Branco com Logo e Menu */}
      <View style={styles.headerContainer}>
        <LogoProntoVital />
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.menuBotao}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Menu"
          >
            <IconeMenu color="#334155" />
          </TouchableOpacity>
          {onLogout ? (
            <TouchableOpacity
              style={styles.logoutBotao}
              activeOpacity={0.7}
              onPress={onLogout}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
            >
              <Text style={styles.logoutTexto}>Sair</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Corpo da Tela com Fundo Claro */}
      <View style={styles.corpo}>
        {/* Título Principal "Clínicas" */}
        <Text style={styles.titulo}>Clínicas</Text>

        {/* Subtítulo idêntico ao protótipo */}
        <Text style={styles.subtitulo}>
          Selecione uma clínica para ver os profissionais disponíveis e agendar sua consulta.
        </Text>

        {/* Input de Busca com Placeholder "Buscar por nome ou bairro..." */}
        <View style={styles.buscaContainer}>
          <IconeLupa size={15} color="#94A3B8" />
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

        {/* 
          Listagem com FlatList consumindo dados reais da API.
          Exibe loading durante a requisição e fica em branco quando não há clínicas cadastradas.
        */}
        {carregando && !atualizando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={clinicasFiltradas}
            keyExtractor={(item) => String(item.id_clinica)}
            renderItem={({ item }) => (
              <ClinicaCard
                clinica={item}
                totalProfissionais={contagemProfissionais[item.id_clinica] || 0}
                onVerProfissionais={handleVerProfissionais}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <IconeLupa size={22} color="#64748B" />
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
                colors={['#2563EB']}
                tintColor="#2563EB"
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuBotao: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutBotao: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoutTexto: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  corpo: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Fundo claro da página
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    marginHorizontal: 16,
    marginBottom: 18,
  },
  inputBusca: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 10,
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    marginHorizontal: 16,
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

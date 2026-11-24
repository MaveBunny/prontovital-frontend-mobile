import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { profissionalService } from '../services/api';

/**
 * Tela de Listagem e Consulta de Profissionais.
 * Suporta filtro inicial por clínica via parâmetros de navegação.
 *
 * @param {Object} props
 * @param {Object} [props.route] - Parâmetros da rota (React Navigation)
 * @param {Object} [props.navigation] - Navegação (React Navigation)
 * @param {string} [props.filtroInicialClinica] - Nome da clínica para filtrar inicialmente
 * @param {Function} [props.onVoltar] - Callback para voltar à tela anterior
 */
export default function ProfissionaisScreen({
  route,
  navigation,
  filtroInicialClinica = '',
  onVoltar,
}) {
  // Obtém o nome da clínica passado por parâmetro de rota ou por prop
  const clinicaParam = route?.params?.clinicaNome || filtroInicialClinica || '';

  const [filtroClinica, setFiltroClinica] = useState(clinicaParam);
  const [termoBusca, setTermoBusca] = useState('');
  const [profissionais, setProfissionais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);

  // Sincroniza se o parâmetro mudar externamente
  useEffect(() => {
    if (clinicaParam) {
      setFiltroClinica(clinicaParam);
    }
  }, [clinicaParam]);

  /**
   * Carrega os profissionais a partir da API REST.
   */
  const carregarProfissionais = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }
      setErro(null);

      // Se houver filtro de clínica ativo, usa como busca principal, ou o termo digitado
      const termo = filtroClinica || termoBusca;
      const data = await profissionalService.listar({ busca: termo });

      setProfissionais(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[ProfissionaisScreen] Erro ao carregar profissionais:', err);
      setErro('Não foi possível carregar os profissionais.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [filtroClinica, termoBusca]);

  useEffect(() => {
    carregarProfissionais();
  }, [carregarProfissionais]);

  const onRefresh = () => {
    carregarProfissionais(true);
  };

  const handleRemoverFiltroClinica = () => {
    setFiltroClinica('');
  };

  const handleVoltar = () => {
    if (onVoltar) {
      onVoltar();
      return;
    }
    if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    }
  };

  const renderCardProfissional = ({ item }) => {
    const nome = item.User?.nome || 'Profissional';
    const especialidade = item.Especialidade?.nome || 'Especialidade Geral';
    const conselho = item.conselho ? `${item.conselho}: ${item.registro_profissional || ''}` : '';
    const clinicasNomes = Array.isArray(item.Clinicas)
      ? item.Clinicas.map((c) => c.User?.nome).filter(Boolean).join(', ')
      : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👨‍⚕️</Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.nomeProfissional}>{nome}</Text>
            <View style={styles.badgeEspecialidade}>
              <Text style={styles.badgeEspecialidadeTexto}>{especialidade}</Text>
            </View>
            {conselho ? <Text style={styles.conselhoText}>{conselho}</Text> : null}
            {clinicasNomes ? (
              <View style={styles.clinicaRow}>
                <Text style={styles.clinicaIcone}>🏥</Text>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.botaoVoltar}
            onPress={handleVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar para clínicas"
          >
            <Text style={styles.botaoVoltarTexto}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Profissionais</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Tag indicadora do Filtro Ativo por Clínica */}
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
                <Text style={styles.removerTagTexto}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.buscaContainer}>
            <Text style={styles.iconeBusca}>🔍</Text>
            <TextInput
              style={styles.inputBusca}
              placeholder="Buscar por profissional ou clínica"
              placeholderTextColor="#94A3B8"
              value={termoBusca}
              onChangeText={setTermoBusca}
              onSubmitEditing={() => carregarProfissionais()}
              returnKeyType="search"
            />
          </View>
        )}
      </View>

      {/* Conteúdo */}
      {carregando && !atualizando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingTexto}>Carregando profissionais...</Text>
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
              colors={['#0284C7', '#0D9488']}
              tintColor="#0284C7"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👨‍⚕️</Text>
              <Text style={styles.emptyTitle}>Nenhum profissional encontrado</Text>
              <Text style={styles.emptySub}>
                {filtroClinica
                  ? `Nenhum profissional vinculado à clínica "${filtroClinica}".`
                  : 'Nenhum profissional cadastrado com esse critério.'}
              </Text>
              {filtroClinica ? (
                <TouchableOpacity
                  style={styles.botaoVerTodos}
                  onPress={handleRemoverFiltroClinica}
                >
                  <Text style={styles.botaoVerTodosTexto}>Ver todos os profissionais</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  botaoVoltar: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  botaoVoltarTexto: {
    fontSize: 14,
    color: '#0284C7',
    fontWeight: '700',
  },
  headerTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  filtroAtivoContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  filtroAtivoLabel: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagClinica: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  tagClinicaTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    flex: 1,
  },
  removerTagBotao: {
    paddingLeft: 8,
  },
  removerTagTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  buscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  iconeBusca: {
    fontSize: 14,
    marginRight: 8,
  },
  inputBusca: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  nomeProfissional: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  badgeEspecialidade: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeEspecialidadeTexto: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '600',
  },
  conselhoText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  clinicaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  clinicaIcone: {
    fontSize: 11,
    marginRight: 4,
  },
  clinicaText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingTexto: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  botaoVerTodos: {
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  botaoVerTodosTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});

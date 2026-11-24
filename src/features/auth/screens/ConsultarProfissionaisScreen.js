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
  ScrollView,
  BackHandler,
  Keyboard,
  Platform,
} from 'react-native';
import { listarEspecialidades, listarProfissionais } from '../../../lib/profissionaisApi';
import { useAuth } from '../../../shared/context/AuthContext';

function mensagemDeErro(erro) {
  if (erro?.response?.status === 401) return 'Sua sessão terminou. Entre novamente.';
  if (erro?.response?.status === 403) return 'Seu perfil não tem acesso a esta consulta.';
  if (erro?.code === 'ECONNABORTED') return 'A API demorou para responder. Tente novamente.';
  return 'Não foi possível carregar os dados. Confira a conexão e tente novamente.';
}

// Cada lista tem o próprio carregamento, erro e botão de nova tentativa.
function useLista(carregar, manterDados = false) {
  const [estado, setEstado] = useState({ dados: [], carregando: true, erro: '', jaConsultou: false });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (!carregar) return;
    const controle = new AbortController();
    setEstado(anterior => ({ ...anterior, dados: manterDados ? anterior.dados : [], carregando: true, erro: '' }));
    carregar(controle.signal)
      .then(dados => {
        if (!controle.signal.aborted) setEstado({ dados, carregando: false, erro: '', jaConsultou: true });
      })
      .catch(erro => {
        if (!controle.signal.aborted) setEstado({ dados: [], carregando: false, erro: mensagemDeErro(erro), jaConsultou: true });
      });
    return () => controle.abort();
  }, [carregar, manterDados, tentativa]);
  return { ...estado, repetir: () => setTentativa(n => n + 1) };
}

/**
 * Tela de Listagem e Consulta de Profissionais.
 * Suporta filtro inicial por clínica via parâmetros de navegação.
 *
 * @param {Object} props
 * @param {Object} [props.route] - Parâmetros enviados pela tela de clínicas
 * @param {Object} [props.navigation] - Objeto de navegação fornecido pelo App.js
 * @param {string} [props.filtroInicialClinica] - Nome da clínica para filtrar inicialmente
 * @param {Function} [props.onVoltar] - Callback para voltar à tela anterior
 */
export default function ProfissionaisScreen({
  route,
  navigation,
  filtroInicialClinica = '',
  onVoltar,
}) {
  const { usuario } = useAuth();
  const voltar = onVoltar || navigation?.goBack;
  useEffect(() => {
    if (Platform.OS !== 'android' || !voltar) return;
    const evento = BackHandler.addEventListener('hardwareBackPress', () => { voltar(); return true; });
    return () => evento.remove();
  }, [voltar]);

  const paciente = String(usuario?.perfil || usuario?.tipo || '').trim().toLowerCase() === 'paciente';
  if (!paciente) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Esta consulta é destinada ao paciente.</Text>
          <TouchableOpacity accessibilityRole="button" style={styles.botaoVoltar} onPress={voltar}>
            <Text style={styles.botaoVoltarTexto}>Voltar para clínicas</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const nome = route?.params?.clinicaNome || filtroInicialClinica || '';
  const id = route?.params?.idClinica ?? null;
  return <ConsultaDoPaciente key={JSON.stringify([id, nome])} nomeClinica={nome} idClinica={id} onVoltar={voltar} />;
}

function ConsultaDoPaciente({ nomeClinica, idClinica, onVoltar }) {
  const [clinica, setClinica] = useState((nomeClinica || idClinica != null) ? { nome: nomeClinica, id: idClinica } : null);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtros, setFiltros] = useState({ busca: '', idEspecialidade: null, atualizar: false });
  const carregar = useCallback(async signal => {
    const dados = await listarProfissionais({
      busca: filtros.busca || clinica?.nome || '',
      idEspecialidade: filtros.idEspecialidade,
    }, signal);
    if (!clinica) return dados;
    // Na API, busca também encontra nomes parecidos. Confira o vínculo da clínica selecionada.
    return dados.filter(p => p.Clinicas?.some(c => clinica.id != null
      ? String(c.id_clinica) === String(clinica.id)
      : c.User?.nome?.trim().toLowerCase() === clinica.nome.trim().toLowerCase()));
  }, [clinica, filtros]);
  const lista = useLista(carregar, filtros.atualizar);
  // Primeiro carregue os profissionais; falhar no catálogo não impede a busca por nome.
  const catalogo = useLista(lista.jaConsultou ? listarEspecialidades : null);

  const buscar = () => {
    Keyboard.dismiss();
    setFiltros(f => ({ ...f, busca: termoBusca.trim(), atualizar: false }));
  };
  const selecionarEspecialidade = idEspecialidade => {
    Keyboard.dismiss();
    setFiltros(f => ({ ...f, idEspecialidade, atualizar: false }));
  };
  const handleRemoverFiltroClinica = () => {
    setClinica(null);
    setFiltros(f => ({ ...f, atualizar: false }));
  };
  const limparFiltros = () => {
    setClinica(null);
    setTermoBusca('');
    setFiltros({ busca: '', idEspecialidade: null, atualizar: false });
  };

  const renderCardProfissional = ({ item }) => {
    const nome = item.User?.nome || 'Profissional';
    const especialidade = item.Especialidade?.nome || catalogo.dados.find(
      e => String(e.id_especialidade) === String(item.id_especialidade)
    )?.nome || 'Especialidade não informada';
    const conselho = item.conselho ? `${item.conselho}: ${item.registro_profissional || ''}` : '';
    const clinicasNomes = Array.isArray(item.Clinicas)
      ? item.Clinicas.map((c) => c.User?.nome).filter(Boolean).join(', ')
      : '';

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}></Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.nomeProfissional}>{nome}</Text>
            <View style={styles.badgeEspecialidade}>
              <Text style={styles.badgeEspecialidadeTexto}>{especialidade}</Text>
            </View>
            {conselho ? <Text style={styles.conselhoText}>{conselho}</Text> : null}
            <View style={styles.clinicaRow}>
              <Text style={styles.clinicaIcone}>🏥</Text>
              <Text style={styles.clinicaText}>{clinicasNomes || 'Clínica não informada'}</Text>
            </View>
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
            onPress={onVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar para clínicas"
          >
            <Text style={styles.botaoVoltarTexto}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text accessibilityRole="header" style={styles.headerTitulo}>Profissionais</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Tag indicadora do Filtro Ativo por Clínica */}
        {clinica ? (
          <View style={styles.filtroAtivoContainer}>
            <Text style={styles.filtroAtivoLabel}>Filtrando por clínica:</Text>
            <View style={styles.tagClinica}>
              <Text style={styles.tagClinicaTexto} numberOfLines={1}>
                {clinica.nome || 'Clínica selecionada'}
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
        ) : null}
        <View style={styles.buscaContainer}>
          <Text style={styles.iconeBusca}>🔍</Text>
          <TextInput
            style={styles.inputBusca}
            placeholder="Buscar por profissional ou clínica"
            accessibilityLabel="Nome do profissional ou da clínica"
            placeholderTextColor="#64748B"
            value={termoBusca}
            onChangeText={setTermoBusca}
            onSubmitEditing={buscar}
            returnKeyType="search"
          />
          <TouchableOpacity accessibilityRole="button" onPress={buscar} style={styles.acaoBusca}>
            <Text style={styles.botaoVoltarTexto}>Buscar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.rotuloEspecialidade}>Especialidade</Text>
        <ScrollView horizontal keyboardShouldPersistTaps="handled" contentContainerStyle={styles.opcoes}>
          {[{ id_especialidade: null, nome: 'Todas' }, ...catalogo.dados].map(e => {
            const ativa = e.id_especialidade === filtros.idEspecialidade;
            return (
              <TouchableOpacity key={String(e.id_especialidade)} accessibilityRole="button"
                accessibilityState={{ selected: ativa }} onPress={() => selecionarEspecialidade(e.id_especialidade)}
                style={[styles.opcao, ativa && styles.opcaoAtiva]}>
                <Text style={[styles.botaoVoltarTexto, ativa && styles.textoOpcaoAtiva]}>{e.nome}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {lista.jaConsultou && catalogo.carregando && <Text style={styles.emptySub}>Carregando especialidades…</Text>}
        {!!catalogo.erro && (
          <View>
            <Text style={styles.emptySub} accessibilityLiveRegion="polite">Especialidades: {catalogo.erro}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={catalogo.repetir} style={styles.acaoBusca}>
              <Text style={styles.botaoVoltarTexto}>Recarregar especialidades</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Conteúdo */}
      {lista.carregando && (!filtros.atualizar || lista.dados.length === 0) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingTexto}>Carregando profissionais...</Text>
        </View>
      ) : lista.erro ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptySub} accessibilityLiveRegion="polite">{lista.erro}</Text>
          <TouchableOpacity style={styles.botaoVerTodos} accessibilityRole="button" onPress={lista.repetir}>
            <Text style={styles.botaoVerTodosTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lista.dados}
          keyExtractor={(item) => String(item.id_profissional)}
          renderItem={renderCardProfissional}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={lista.carregando && filtros.atualizar}
              onRefresh={() => setFiltros(f => ({ ...f, atualizar: true }))}
              colors={['#0284C7', '#0D9488']}
              tintColor="#0284C7"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}></Text>
              <Text style={styles.emptyTitle}>Nenhum profissional encontrado</Text>
              <Text style={styles.emptySub}>
                Nenhum resultado para os critérios atuais.
              </Text>
              {(clinica || filtros.busca || filtros.idEspecialidade != null) ? (
                <TouchableOpacity
                  style={styles.botaoVerTodos}
                  accessibilityRole="button"
                  onPress={limparFiltros}
                >
                  <Text style={styles.botaoVerTodosTexto}>Limpar filtros</Text>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
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
  rotuloEspecialidade: { marginTop: 10, marginBottom: 4, color: '#334155', fontWeight: '700' },
  opcoes: { gap: 8, alignItems: 'center' },
  opcao: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#E2E8F0' },
  opcaoAtiva: { backgroundColor: '#075985' },
  textoOpcaoAtiva: { color: '#FFFFFF' },
  acaoBusca: { minHeight: 44, paddingHorizontal: 8, alignSelf: 'center', justifyContent: 'center' },
  buscaContainer: {
    marginTop: 6,
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
    flexShrink: 1,
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

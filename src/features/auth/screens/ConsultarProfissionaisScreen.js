import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Modal,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  BackHandler,
  Keyboard,
  Platform,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { listarEspecialidades, listarProfissionais } from '../../../lib/profissionaisApi';
import AgendarConsultaModal from '../components/AgendarConsultaModal';
import { useAuth } from '../../../shared/context/AuthContext';
import AppHeader from '../../../components/shared/AppHeader';
import Button from '../../../components/shared/Button';
import { colors } from '../../../shared/theme/colors';

function mensagemDeErro(erro) {
  if (erro?.response?.status === 401) return 'Sua sessão terminou. Entre novamente.';
  if (erro?.response?.status === 403) return 'Seu perfil não tem acesso a esta consulta.';
  if (erro?.code === 'ECONNABORTED') return 'A API demorou para responder. Tente novamente.';
  return 'Não foi possível carregar os dados. Confira a conexão e tente novamente.';
}

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

export default function ProfissionaisScreen({
  route,
  navigation,
  filtroInicialClinica = '',
  onVoltar,
}) {
  const { usuario } = useAuth();
  const voltar = onVoltar || navigation?.goBack;
  const navegarPara = tela => navigation?.navigate?.(tela);
  useEffect(() => {
    if (Platform.OS !== 'android' || !voltar) return;
    const evento = BackHandler.addEventListener('hardwareBackPress', () => { voltar(); return true; });
    return () => evento.remove();
  }, [voltar]);

  const perfil = String(usuario?.perfil || usuario?.tipo || '').trim().toLowerCase();
  const paciente = perfil === 'paciente';
  const administrador = perfil === 'admin';
  if (!paciente && !administrador) {
    return (
      <View style={styles.safeArea}>
        <AppHeader telaAtiva="Profissionais" onNavigate={navegarPara} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Esta consulta é destinada a pacientes e administradores.</Text>
          <Button variant="secondary" onPress={voltar}>Voltar para clínicas</Button>
        </View>
      </View>
    );
  }

  const nome = route?.params?.clinicaNome || filtroInicialClinica || '';
  const id = route?.params?.idClinica ?? null;
  return (
    <View style={styles.safeArea}>
      <AppHeader telaAtiva="Profissionais" onNavigate={navegarPara} />
      <ConsultaDoPaciente
        key={JSON.stringify([id, nome])}
        nomeClinica={nome}
        idClinica={id}
        mostrarBotaoNovoProfissional={administrador}
        onNovoProfissional={() => navegarPara('CadastroProfissional')}
        pacienteId={usuario?.id_paciente}
        podeAgendar={paciente}
      />
    </View>
  );
}

function ConsultaDoPaciente({
  nomeClinica,
  idClinica,
  mostrarBotaoNovoProfissional,
  onNovoProfissional,
  pacienteId,
  podeAgendar,
}) {
  const [clinica, setClinica] = useState((nomeClinica || idClinica != null) ? { nome: nomeClinica, id: idClinica } : null);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');
  const [dropdownEspecialidadeAberto, setDropdownEspecialidadeAberto] = useState(false);
  const [filtros, setFiltros] = useState({ busca: '', idEspecialidade: null, atualizar: false });
  const carregar = useCallback(async signal => {
    const dados = await listarProfissionais({
      busca: filtros.busca || clinica?.nome || '',
      idEspecialidade: filtros.idEspecialidade,
    }, signal);
    if (!clinica) return dados;
    return dados.filter(p => p.Clinicas?.some(c => clinica.id != null
      ? String(c.id_clinica) === String(clinica.id)
      : c.User?.nome?.trim().toLowerCase() === clinica.nome.trim().toLowerCase()));
  }, [clinica, filtros]);
  const lista = useLista(carregar, filtros.atualizar);
  const catalogo = useLista(lista.jaConsultou ? listarEspecialidades : null);

  const buscar = () => {
    Keyboard.dismiss();
    setFiltros(f => ({ ...f, busca: termoBusca.trim(), atualizar: false }));
  };
  const selecionarEspecialidade = idEspecialidade => {
    Keyboard.dismiss();
    setFiltros(f => ({ ...f, idEspecialidade, atualizar: false }));
    setDropdownEspecialidadeAberto(false);
  };
  const handleRemoverFiltroClinica = () => {
    setClinica(null);
    setFiltros(f => ({ ...f, atualizar: false }));
  };
  const limparFiltros = () => {
    setClinica(null);
    setTermoBusca('');
    setDropdownEspecialidadeAberto(false);
    setFiltros({ busca: '', idEspecialidade: null, atualizar: false });
  };
  const especialidades = [{ id_especialidade: null, nome: 'Todas as especialidades' }, ...catalogo.dados];
  const especialidadeSelecionada = filtros.idEspecialidade == null
    ? 'Todas as especialidades'
    : catalogo.dados.find(e => String(e.id_especialidade) === String(filtros.idEspecialidade))?.nome
      || 'Especialidade selecionada';

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
            <Feather name="user" size={30} color={colors.primary} />
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.nomeProfissional}>{nome}</Text>
            <View style={styles.badgeEspecialidade}>
              <Text style={styles.badgeEspecialidadeTexto}>{especialidade}</Text>
            </View>
            {conselho ? <Text style={styles.conselhoText}>{conselho}</Text> : null}
            <View style={styles.clinicaRow}>
              <Feather name="home" size={14} color={colors.primary} />
              <Text style={styles.clinicaText}>{clinicasNomes || 'Clínica não informada'}</Text>
            </View>
          </View>
        </View>
        {podeAgendar ? (
          <Button
            leftIcon="calendar"
            onPress={() => setProfissionalSelecionado(item)}
            style={styles.agendarButton}
          >
            Agendar consulta
          </Button>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.headerTitulo}>Profissionais</Text>
        <Text style={styles.headerSubtitle}>
          Encontre especialistas disponíveis nas clínicas credenciadas.
        </Text>
        {mostrarBotaoNovoProfissional ? (
          <Button
            leftIcon="plus"
            onPress={onNovoProfissional}
            style={styles.newProfessionalButton}
          >
            Novo Profissional
          </Button>
        ) : null}

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
        <View style={styles.searchBox}>
          <Feather name="search" size={19} color={colors.textPlaceholder} />
          <TextInput
            accessibilityLabel="Buscar por profissional ou clínica"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setTermoBusca}
            onSubmitEditing={buscar}
            placeholder="Buscar por profissional ou clínica..."
            placeholderTextColor={colors.textPlaceholder}
            returnKeyType="search"
            style={styles.searchInput}
            value={termoBusca}
          />
        </View>
        <Text style={styles.rotuloEspecialidade}>Especialidade</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Especialidade: ${especialidadeSelecionada}`}
          accessibilityState={{
            expanded: dropdownEspecialidadeAberto,
            disabled: catalogo.carregando || !!catalogo.erro,
          }}
          disabled={catalogo.carregando || !!catalogo.erro}
          onPress={() => setDropdownEspecialidadeAberto(true)}
          style={[styles.dropdownTrigger, (catalogo.carregando || !!catalogo.erro) && styles.dropdownDisabled]}
        >
          <Text style={styles.dropdownTriggerText} numberOfLines={1}>{especialidadeSelecionada}</Text>
          <Feather name="chevron-down" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        {lista.jaConsultou && catalogo.carregando && <Text style={styles.emptySub}>Carregando especialidades…</Text>}
        {!!catalogo.erro && (
          <View>
            <Text style={styles.emptySub} accessibilityLiveRegion="polite">Especialidades: {catalogo.erro}</Text>
            <Button variant="secondary" onPress={catalogo.repetir} style={styles.actionButton}>
              Recarregar especialidades
            </Button>
          </View>
        )}
      </View>

      {lista.carregando && (!filtros.atualizar || lista.dados.length === 0) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingTexto}>Carregando profissionais...</Text>
        </View>
      ) : lista.erro ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptySub} accessibilityLiveRegion="polite">{lista.erro}</Text>
          <Button onPress={lista.repetir}>Tentar novamente</Button>
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
              colors={[colors.primary]}
              tintColor={colors.primary}
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
                <Button variant="secondary" onPress={limparFiltros}>Limpar filtros</Button>
              ) : null}
            </View>
          }
        />
      )}
      <Modal
        visible={dropdownEspecialidadeAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownEspecialidadeAberto(false)}
      >
        <View style={styles.dropdownBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Fechar seleção de especialidade"
            onPress={() => setDropdownEspecialidadeAberto(false)}
          />
          <View style={styles.dropdownPanel}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Selecione uma especialidade</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                onPress={() => setDropdownEspecialidadeAberto(false)}
                style={styles.dropdownClose}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={especialidades}
              keyExtractor={item => String(item.id_especialidade ?? 'todas')}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const selecionada = item.id_especialidade === filtros.idEspecialidade;
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected: selecionada }}
                    onPress={() => selecionarEspecialidade(item.id_especialidade)}
                    style={[styles.dropdownOption, selecionada && styles.dropdownOptionSelected]}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      selecionada && styles.dropdownOptionTextSelected,
                    ]}>
                      {item.nome}
                    </Text>
                    {selecionada ? <Feather name="check" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
      {profissionalSelecionado ? (
        <AgendarConsultaModal
          visible
          profissional={profissionalSelecionado}
          pacienteId={pacienteId}
          clinicaInicial={clinica}
          onClose={() => setProfissionalSelecionado(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
  },
  content: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
    backgroundColor: colors.surfaceInput,
  },
  headerTitulo: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 18,
  },
  newProfessionalButton: { marginBottom: 12 },
  actionButton: { marginBottom: 12 },
  searchBox: {
    minHeight: 56,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minHeight: 54,
    marginLeft: 12,
    paddingVertical: 0,
    color: colors.textPrimary,
    fontSize: 15,
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
  rotuloEspecialidade: { marginTop: 2, marginBottom: 8, color: colors.textSecondary, fontWeight: '700' },
  dropdownTrigger: {
    minHeight: 50,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceInput,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerText: {
    flex: 1,
    marginRight: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  dropdownDisabled: { opacity: 0.6 },
  dropdownBackdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  dropdownPanel: {
    maxHeight: '75%',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    elevation: 8,
  },
  dropdownHeader: {
    minHeight: 44,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dropdownClose: {
    padding: 8,
  },
  dropdownOption: {
    minHeight: 52,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
  dropdownOptionTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    elevation: 1,
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
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  agendarButton: {
    minHeight: 46,
    marginTop: 14,
    borderRadius: 12,
  },
  nomeProfissional: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  badgeEspecialidade: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 5,
  },
  badgeEspecialidadeTexto: {
    fontSize: 12,
    color: colors.primaryText,
    fontWeight: '700',
  },
  conselhoText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 2,
  },
  clinicaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  clinicaText: {
    flexShrink: 1,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
    color: colors.textMuted,
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
});

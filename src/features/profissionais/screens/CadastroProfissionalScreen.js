import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AppHeader from '../../../components/shared/AppHeader';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import {
  cadastrarProfissional,
  listarClinicas,
  listarEspecialidades,
  vincularEspecialidadeProfissional,
  vincularProfissionalClinica,
} from '../../../lib/profissionaisApi';
import { useAuth } from '../../../shared/context/AuthContext';
import { colors } from '../../../shared/theme/colors';
import { limparDigitos, mascaraCPF, mascaraTelefone } from '../../../shared/utils/masks';

function mensagemDeErro(error) {
  return error.response?.data?.mensagem
    || error.response?.data?.erro
    || error.response?.data?.message
    || error.message
    || 'Não foi possível concluir o cadastro.';
}

function DropdownField({ label, options, value, onSelect, placeholder, disabled = false }) {
  const [aberto, setAberto] = useState(false);
  const selecionado = options.find(option => String(option.value) === String(value));

  function selecionar(optionValue) {
    onSelect(optionValue);
    setAberto(false);
  }

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selecionado?.label || placeholder}`}
        accessibilityState={{ expanded: aberto, disabled }}
        disabled={disabled}
        onPress={() => setAberto(true)}
        style={[styles.dropdownTrigger, disabled && styles.disabled]}
      >
        <Text style={[styles.dropdownValue, !selecionado && styles.placeholder]} numberOfLines={1}>
          {selecionado?.label || placeholder}
        </Text>
        <Feather name="chevron-down" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={aberto}
        transparent
        animationType="fade"
        onRequestClose={() => setAberto(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Fechar opções"
            onPress={() => setAberto(false)}
          />
          <View style={styles.dropdownPanel}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>{label}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar"
                onPress={() => setAberto(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={option => String(option.value)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item: option }) => {
                const ativa = String(option.value) === String(value);
                return (
                  <TouchableOpacity
                    key={String(option.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: ativa }}
                    onPress={() => selecionar(option.value)}
                    style={[styles.dropdownOption, ativa && styles.dropdownOptionActive]}
                  >
                    <Text style={[styles.dropdownOptionText, ativa && styles.dropdownOptionTextActive]}>
                      {option.label}
                    </Text>
                    {ativa ? <Feather name="check" size={18} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function CadastroProfissionalScreen({ navigation, onSuccess }) {
  const { usuario } = useAuth();
  const isAdmin = String(usuario?.perfil || usuario?.tipo || '').trim().toLowerCase() === 'admin';
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    registro_profissional: '',
    conselho: '',
    uf_registro: '',
    telefone: '',
    email: '',
    senha: '',
    endereco: '',
    cidade: '',
    estado: '',
    id_especialidade: null,
    id_clinica: null,
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [clinicas, setClinicas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);
  const [erroOpcoes, setErroOpcoes] = useState('');
  const [tentativaOpcoes, setTentativaOpcoes] = useState(0);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!isAdmin) return undefined;

    const controller = new AbortController();
    setCarregandoOpcoes(true);
    setErroOpcoes('');
    Promise.all([
      listarClinicas(controller.signal),
      listarEspecialidades(controller.signal),
    ])
      .then(([listaClinicas, listaEspecialidades]) => {
        if (controller.signal.aborted) return;
        setClinicas(listaClinicas);
        setEspecialidades(listaEspecialidades);
      })
      .catch(error => {
        if (!controller.signal.aborted) setErroOpcoes(mensagemDeErro(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregandoOpcoes(false);
      });

    return () => controller.abort();
  }, [isAdmin, tentativaOpcoes]);

  function setCampo(campo, valor) {
    setErro('');
    setForm(previous => ({ ...previous, [campo]: valor }));
  }

  function validarFormulario() {
    if (form.nome.trim().length < 3) return 'Informe o nome completo.';
    if (limparDigitos(form.cpf).length !== 11) return 'Informe os 11 dígitos do CPF.';
    if (!form.registro_profissional.trim()) return 'Informe o registro profissional.';
    if (!form.conselho.trim()) return 'Informe o conselho profissional.';
    if (form.uf_registro.trim().length !== 2) return 'Informe a UF do registro profissional.';
    if (limparDigitos(form.telefone).length < 10) return 'Informe um telefone com DDD.';
    if (!form.email.trim().includes('@')) return 'Informe um e-mail válido.';
    if (form.senha.length < 6) return 'A senha inicial deve ter pelo menos 6 caracteres.';
    if (!form.endereco.trim()) return 'Informe o endereço do profissional.';
    if (!form.cidade.trim()) return 'Informe a cidade.';
    if (form.estado.trim().length !== 2) return 'Informe a UF do endereço.';
    if (form.id_especialidade == null) return 'Selecione uma especialidade.';
    if (form.id_clinica == null) return 'Selecione uma clínica.';
    return '';
  }

  async function handleSubmit() {
    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setErro('');
    setSalvando(true);
    let profissionalCriado = null;
    let etapaVinculo = '';

    try {
      profissionalCriado = await cadastrarProfissional({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        endereco: form.endereco.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
        telefone: limparDigitos(form.telefone),
        perfil: 'profissional',
        profissional: {
          cpf: limparDigitos(form.cpf),
          conselho: form.conselho.trim(),
          registro_profissional: form.registro_profissional.trim(),
          uf_registro: form.uf_registro.trim().toUpperCase(),
        },
      });

      if (!profissionalCriado?.id_profissional) {
        throw new Error('A API não retornou o ID do profissional criado.');
      }

      etapaVinculo = 'especialidade';
      await vincularEspecialidadeProfissional(
        profissionalCriado.id_profissional,
        form.id_especialidade
      );

      etapaVinculo = 'clínica';
      await vincularProfissionalClinica(form.id_clinica, profissionalCriado.id_profissional);

      Alert.alert(
        'Cadastro concluído',
        'O profissional foi cadastrado e vinculado à clínica.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      const detalhe = mensagemDeErro(error);
      setErro(profissionalCriado?.id_profissional
        ? `O profissional foi criado (ID ${profissionalCriado.id_profissional}), mas houve um erro ao vincular ${etapaVinculo}. ${detalhe}`
        : detalhe);
    } finally {
      setSalvando(false);
    }
  }

  const navegarPara = tela => navigation?.navigate?.(tela);

  if (!isAdmin) {
    return (
      <View style={styles.screen}>
        <AppHeader telaAtiva="Inicio" onNavigate={navegarPara} />
        <View style={styles.accessDenied}>
          <Text style={styles.title}>Acesso restrito</Text>
          <Text style={styles.subtitle}>Somente administradores podem cadastrar profissionais.</Text>
          <Button variant="secondary" onPress={() => navigation?.goBack?.()}>Voltar</Button>
        </View>
      </View>
    );
  }

  const opcoesClinicas = clinicas.map(clinica => ({
    value: clinica.id_clinica,
    label: clinica.User?.nome || `Clínica ${clinica.id_clinica}`,
  }));
  const opcoesEspecialidades = especialidades.map(especialidade => ({
    value: especialidade.id_especialidade,
    label: especialidade.nome,
  }));

  return (
    <View style={styles.screen}>
      <AppHeader telaAtiva="CadastroProfissional" onNavigate={navegarPara} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Cadastrar profissional</Text>
          <Text style={styles.subtitle}>Preencha os dados do profissional e escolha a clínica onde ele atende.</Text>

          <Input
            label="Nome completo"
            placeholder="Nome do profissional"
            leftIcon="user"
            autoCapitalize="words"
            maxLength={100}
            value={form.nome}
            onChangeText={value => setCampo('nome', value)}
          />
          <Input
            label="CPF"
            placeholder="000.000.000-00"
            leftIcon="credit-card"
            keyboardType="number-pad"
            maxLength={14}
            value={form.cpf}
            onChangeText={value => setCampo('cpf', mascaraCPF(value))}
          />
          <View style={styles.row}>
            <View style={styles.column}>
              <Input
                label="Registro profissional"
                placeholder="Número"
                maxLength={30}
                value={form.registro_profissional}
                onChangeText={value => setCampo('registro_profissional', value)}
              />
            </View>
            <View style={styles.columnSmall}>
              <Input
                label="Conselho"
                placeholder="CRM"
                autoCapitalize="characters"
                maxLength={20}
                value={form.conselho}
                onChangeText={value => setCampo('conselho', value)}
              />
            </View>
          </View>
          <Input
            label="UF do registro profissional"
            placeholder="PE"
            leftIcon="map-pin"
            autoCapitalize="characters"
            maxLength={2}
            value={form.uf_registro}
            onChangeText={value => setCampo('uf_registro', value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
          />
          <DropdownField
            label="Especialidade"
            options={opcoesEspecialidades}
            value={form.id_especialidade}
            onSelect={value => setCampo('id_especialidade', value)}
            placeholder={carregandoOpcoes
              ? 'Carregando especialidades...'
              : opcoesEspecialidades.length === 0
                ? 'Nenhuma especialidade disponível'
                : 'Selecione uma especialidade'}
            disabled={carregandoOpcoes || !!erroOpcoes || opcoesEspecialidades.length === 0}
          />
          <Input
            label="Telefone"
            placeholder="(00) 00000-0000"
            leftIcon="phone"
            keyboardType="phone-pad"
            maxLength={15}
            value={form.telefone}
            onChangeText={value => setCampo('telefone', mascaraTelefone(value))}
          />
          <Input
            label="E-mail"
            placeholder="email@exemplo.com"
            leftIcon="mail"
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={100}
            value={form.email}
            onChangeText={value => setCampo('email', value)}
          />
          <Input
            label="Senha inicial"
            placeholder="Mínimo de 6 caracteres"
            leftIcon="lock"
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
            rightIcon={mostrarSenha ? 'eye-off' : 'eye'}
            onRightIconPress={() => setMostrarSenha(value => !value)}
            value={form.senha}
            onChangeText={value => setCampo('senha', value)}
          />
          <Input
            label="Endereço"
            placeholder="Rua e número"
            leftIcon="map"
            maxLength={255}
            value={form.endereco}
            onChangeText={value => setCampo('endereco', value)}
          />
          <View style={styles.row}>
            <View style={styles.column}>
              <Input
                label="Cidade"
                placeholder="Cidade"
                maxLength={100}
                value={form.cidade}
                onChangeText={value => setCampo('cidade', value)}
              />
            </View>
            <View style={styles.columnSmall}>
              <Input
                label="Estado (UF)"
                placeholder="PE"
                autoCapitalize="characters"
                maxLength={2}
                value={form.estado}
                onChangeText={value => setCampo('estado', value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              />
            </View>
          </View>
          <DropdownField
            label="Clínica vinculada"
            options={opcoesClinicas}
            value={form.id_clinica}
            onSelect={value => setCampo('id_clinica', value)}
            placeholder={carregandoOpcoes
              ? 'Carregando clínicas...'
              : opcoesClinicas.length === 0
                ? 'Nenhuma clínica disponível'
                : 'Selecione uma clínica'}
            disabled={carregandoOpcoes || !!erroOpcoes || opcoesClinicas.length === 0}
          />
          {carregandoOpcoes ? (
            <View style={styles.optionsLoading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.helperText}>Carregando clínicas e especialidades...</Text>
            </View>
          ) : null}

          {erroOpcoes ? (
            <>
              <View style={styles.errorBox}>
                <Feather name="alert-triangle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{erroOpcoes}</Text>
              </View>
              <Button variant="secondary" onPress={() => setTentativaOpcoes(value => value + 1)}>
                Tentar novamente
              </Button>
            </>
          ) : null}

          {erro ? (
            <View style={styles.errorBox}>
              <Feather name="alert-triangle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{erro}</Text>
            </View>
          ) : null}

          <Button onPress={handleSubmit} loading={salvando} disabled={carregandoOpcoes || !!erroOpcoes}>
            Cadastrar profissional
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceInput },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  accessDenied: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
  subtitle: { marginTop: 6, marginBottom: 20, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { marginBottom: 6, fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  dropdownTrigger: {
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceInput,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: { flex: 1, marginRight: 12, fontSize: 15, color: colors.textPrimary },
  placeholder: { color: colors.textPlaceholder },
  disabled: { opacity: 0.6 },
  modalBackdrop: {
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
  dropdownTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  closeButton: { padding: 8 },
  dropdownOption: {
    minHeight: 52,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOptionActive: { backgroundColor: colors.primarySoft },
  dropdownOptionText: { flex: 1, fontSize: 15, color: colors.textSecondary },
  dropdownOptionTextActive: { fontWeight: '700', color: colors.primary },
  row: { flexDirection: 'row' },
  column: { flex: 1, marginRight: 10 },
  columnSmall: { flex: 1 },
  optionsLoading: { alignItems: 'center', marginBottom: 14 },
  helperText: { marginTop: 8, fontSize: 13, color: colors.textMuted },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorBg,
  },
  errorText: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '600', color: colors.error },
});

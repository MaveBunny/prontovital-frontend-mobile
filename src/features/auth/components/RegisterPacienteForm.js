import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import { cadastrarPaciente } from '../../../lib/pacientesApi';
import { colors } from '../../../shared/theme/colors';
import {
  converterDataParaISO,
  limparDigitos,
  mascaraCPF,
  mascaraData,
  mascaraTelefone,
} from '../../../shared/utils/masks';

const OPCOES_SEXO = ['Masculino', 'Feminino', 'Outro'];

const ETAPAS = [
  { numero: 1, titulo: 'Conta e Contato', icone: 'user' },
  { numero: 2, titulo: 'Endereço', icone: 'map-pin' },
  { numero: 3, titulo: 'Dados de Paciente', icone: 'heart' },
];

const FORMATADORES = {
  cpf: mascaraCPF,
  telefone: mascaraTelefone,
  data_nascimento: mascaraData,
  estado: (v) => v.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2),
};

export default function RegisterPacienteForm({ onVoltar, onSuccess }) {
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    cpf: '',
    endereco: '',
    cidade: '',
    estado: '',
    data_nascimento: '',
    sexo: 'Masculino',
    observacoes: '',
  });

  function setCampo(campo, valor) {
    setErro('');
    const formatar = FORMATADORES[campo];
    setForm((prev) => ({ ...prev, [campo]: formatar ? formatar(valor) : valor }));
  }

  function bind(campo) {
    return {
      value: form[campo],
      onChangeText: (valor) => setCampo(campo, valor),
    };
  }

  function validarEtapa(num) {
    if (num === 1) {
      if (form.nome.trim().length < 3) return 'Informe seu nome completo.';
      if (!form.email.includes('@')) return 'Informe um e-mail válido.';
      if (form.senha.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
      if (limparDigitos(form.telefone).length < 10) return 'Informe o telefone com DDD.';
      if (limparDigitos(form.cpf).length !== 11) return 'Informe os 11 dígitos do CPF.';
    }
    if (num === 2) {
      if (!form.endereco.trim()) return 'Informe sua rua e número.';
      if (!form.cidade.trim()) return 'Informe sua cidade.';
      if (form.estado.trim().length !== 2) return 'Informe a sigla do estado (ex: PE).';
    }
    if (num === 3 && !converterDataParaISO(form.data_nascimento)) {
      return 'Informe uma data válida (DD/MM/AAAA).';
    }
    return null;
  }

  function avancarEtapa() {
    const msg = validarEtapa(etapa);
    if (msg) return setErro(msg);
    setErro('');
    setEtapa((prev) => prev + 1);
  }

  function voltarEtapa() {
    setErro('');
    if (etapa > 1) return setEtapa((prev) => prev - 1);
    onVoltar?.();
  }

  async function handleSubmit() {
    for (const num of [1, 2, 3]) {
      const msg = validarEtapa(num);
      if (msg) {
        setEtapa(num);
        return setErro(msg);
      }
    }

    setLoading(true);
    try {
      await cadastrarPaciente({
        nome: form.nome.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        endereco: form.endereco.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
        telefone: limparDigitos(form.telefone),
        perfil: 'paciente',
        paciente: {
          cpf: limparDigitos(form.cpf),
          data_nascimento: converterDataParaISO(form.data_nascimento),
          sexo: form.sexo,
          observacoes: form.observacoes.trim() || 'Nenhuma observação',
        },
      });
      onSuccess?.();
    } catch (err) {
      setErro(
        err.response?.data?.mensagem ||
          err.response?.data?.erro ||
          err.response?.data?.message ||
          'Erro ao criar conta. Verifique os dados e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={voltarEtapa} style={styles.backButton}>
          <Feather name="chevron-left" size={18} color={colors.textSecondary} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <View style={styles.badge}>
          <Feather name="user" size={12} color={colors.primaryText} />
          <Text style={styles.badgeText}>Paciente</Text>
        </View>
        <Text style={styles.stepCounter}>Passo {etapa} de 3</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(etapa / 3) * 100}%` }]} />
      </View>

      <View style={styles.stepPillsRow}>
        {ETAPAS.map((item) => {
          const ativa = etapa === item.numero;
          const concluida = etapa > item.numero;
          return (
            <TouchableOpacity
              key={item.numero}
              onPress={() => item.numero < etapa && setEtapa(item.numero)}
              style={[
                styles.stepPill,
                ativa && styles.stepPillActive,
                concluida && styles.stepPillDone,
              ]}
            >
              <Feather
                name={concluida ? 'check-circle' : item.icone}
                size={13}
                color={ativa ? colors.primary : concluida ? colors.success : colors.textPlaceholder}
              />
              <Text
                style={[
                  styles.stepPillText,
                  ativa && styles.stepPillTextActive,
                  concluida && styles.stepPillTextDone,
                ]}
                numberOfLines={1}
              >
                {item.titulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {etapa === 1 && (
        <View>
          <Input label="Nome completo" placeholder="Seu nome e sobrenome" leftIcon="user" autoCapitalize="words" {...bind('nome')} />
          <Input label="E-mail" placeholder="email@exemplo.com" leftIcon="mail" keyboardType="email-address" autoCapitalize="none" {...bind('email')} />
          <Input
            label="Senha"
            placeholder="Mínimo de 6 caracteres"
            leftIcon="lock"
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
            rightIcon={mostrarSenha ? 'eye-off' : 'eye'}
            onRightIconPress={() => setMostrarSenha((v) => !v)}
            {...bind('senha')}
          />
          <Input label="Telefone (com DDD)" placeholder="(00) 00000-0000" leftIcon="phone" keyboardType="phone-pad" maxLength={15} {...bind('telefone')} />
          <Input label="CPF" placeholder="000.000.000-00" leftIcon="credit-card" keyboardType="number-pad" maxLength={14} {...bind('cpf')} />
        </View>
      )}

      {etapa === 2 && (
        <View>
          <Input label="Endereço" placeholder="Sua rua, avenida e número" leftIcon="map-pin" {...bind('endereco')} />
          <View style={styles.row}>
            <View style={styles.colCity}>
              <Input label="Cidade" placeholder="Ex: Recife" {...bind('cidade')} />
            </View>
            <View style={styles.colUf}>
              <Input label="Estado (UF)" placeholder="PE" autoCapitalize="characters" maxLength={2} {...bind('estado')} />
            </View>
          </View>
        </View>
      )}

      {etapa === 3 && (
        <View>
          <View style={styles.sectionHeader}>
            <Feather name="activity" size={15} color={colors.primary} />
            <Text style={styles.sectionTitle}>DADOS DE PACIENTE</Text>
          </View>
          <Input label="Data de Nascimento" placeholder="dd/mm/aaaa" leftIcon="calendar" keyboardType="number-pad" maxLength={10} {...bind('data_nascimento')} />
          <Text style={styles.fieldLabel}>Sexo</Text>
          <View style={styles.genderRow}>
            {OPCOES_SEXO.map((opcao) => {
              const ativo = form.sexo === opcao;
              return (
                <TouchableOpacity
                  key={opcao}
                  onPress={() => setCampo('sexo', opcao)}
                  style={[styles.genderChip, ativo && styles.genderChipActive]}
                >
                  <Text style={[styles.genderText, ativo && styles.genderTextActive]}>{opcao}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Input label="Observações Médicas (opcional)" placeholder="Alergias, comorbidades, medicamentos..." multiline {...bind('observacoes')} />
        </View>
      )}

      {erro ? (
        <View style={styles.errorBox}>
          <Feather name="alert-triangle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : null}

      {etapa < 3 ? (
        <Button onPress={avancarEtapa} rightIcon="arrow-right">Continuar</Button>
      ) : (
        <Button onPress={handleSubmit} loading={loading} leftIcon="check-circle">Criar conta de Paciente</Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: colors.surfaceMuted, borderRadius: 10, marginRight: 10 },
  backText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginLeft: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12.5, fontWeight: '700', color: colors.primaryText, marginLeft: 5 },
  stepCounter: { marginLeft: 'auto', fontSize: 12.5, fontWeight: '700', color: colors.textMuted },
  progressTrack: { height: 6, backgroundColor: colors.surfaceMuted, borderRadius: 999, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  stepPillsRow: { flexDirection: 'row', marginBottom: 18 },
  stepPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 6, marginHorizontal: 3, borderRadius: 10, backgroundColor: colors.surfaceInput, borderWidth: 1, borderColor: colors.borderLight },
  stepPillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  stepPillDone: { backgroundColor: colors.successBg, borderColor: colors.successBorder },
  stepPillText: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted, marginLeft: 5 },
  stepPillTextActive: { color: colors.primary, fontWeight: '700' },
  stepPillTextDone: { color: colors.success, fontWeight: '700' },
  row: { flexDirection: 'row' },
  colCity: { flex: 2.2, marginRight: 10 },
  colUf: { flex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 11.5, fontWeight: '800', color: colors.primaryText, letterSpacing: 0.8, marginLeft: 7 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 },
  genderRow: { flexDirection: 'row', marginBottom: 14 },
  genderChip: { flex: 1, minHeight: 50, marginHorizontal: 4, borderRadius: 13, borderWidth: 1.5, borderColor: colors.borderLight, backgroundColor: colors.surfaceInput, alignItems: 'center', justifyContent: 'center' },
  genderChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  genderText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  genderTextActive: { color: colors.primary, fontWeight: '800' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: 14, padding: 12, marginBottom: 14 },
  errorText: { fontSize: 13, fontWeight: '600', color: colors.error, marginLeft: 10, flex: 1 },
});

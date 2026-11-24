import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from '../../../components/shared/Button';
import Input from '../../../components/shared/Input';
import { useAuth } from '../../../shared/context/AuthContext';
import { colors } from '../../../shared/theme/colors';

export default function LoginForm({ mensagemSucesso, onLimparSucesso, onIrParaCadastro }) {
  const { login, carregando } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit() {
    setErro('');
    onLimparSucesso?.();

    if (!email.trim() || !senha) {
      return setErro('Preencha seu e-mail (ou CPF) e sua senha.');
    }

    try {
      await login({ email: email.trim(), senha });
    } catch (err) {
      setErro(
        err.response?.data?.mensagem ||
          err.response?.data?.message ||
          'E-mail/CPF ou senha incorretos.'
      );
    }
  }

  function handleEsqueceuSenha() {
    Alert.alert(
      'Recuperação de Senha',
      'Entre em contato com o suporte ProntoVital ou solicite a redefinição na sua unidade de saúde.'
    );
  }

  return (
    <View>
      <Text style={styles.title}>Bem-vindo(a) de volta</Text>
      <Text style={styles.subtitle}>Entre com suas credenciais para acessar sua área de saúde.</Text>

      {mensagemSucesso ? (
        <View style={styles.successBox}>
          <Feather name="check-circle" size={18} color={colors.success} />
          <Text style={styles.successText}>{mensagemSucesso}</Text>
        </View>
      ) : null}

      <Input
        label="E-mail ou CPF"
        placeholder="email@exemplo.com"
        leftIcon="mail"
        value={email}
        onChangeText={(v) => { setErro(''); setEmail(v); }}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Senha"
        placeholder="Digite sua senha"
        leftIcon="lock"
        value={senha}
        onChangeText={(v) => { setErro(''); setSenha(v); }}
        secureTextEntry={!mostrarSenha}
        autoCapitalize="none"
        rightIcon={mostrarSenha ? 'eye-off' : 'eye'}
        onRightIconPress={() => setMostrarSenha((v) => !v)}
        labelRight={
          <TouchableOpacity onPress={handleEsqueceuSenha}>
            <Text style={styles.linkText}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        }
      />

      {erro ? (
        <View style={styles.errorBox}>
          <Feather name="alert-triangle" size={16} color={colors.error} />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : null}

      <Button onPress={handleSubmit} loading={carregando} rightIcon="arrow-right">
        Entrar na plataforma
      </Button>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Ainda não tem conta? </Text>
        <TouchableOpacity onPress={onIrParaCadastro}>
          <Text style={styles.linkText}>Cadastre-se como Paciente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13.5, color: colors.textMuted, marginTop: 4, marginBottom: 18 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, borderRadius: 14, padding: 12, marginBottom: 14 },
  errorText: { fontSize: 13, fontWeight: '600', color: colors.error, marginLeft: 10, flex: 1 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successBg, borderWidth: 1, borderColor: colors.successBorder, borderRadius: 14, padding: 12, marginBottom: 14 },
  successText: { fontSize: 13, fontWeight: '600', color: colors.success, marginLeft: 10, flex: 1 },
  linkText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  footerText: { fontSize: 13.5, color: colors.textMuted },
});

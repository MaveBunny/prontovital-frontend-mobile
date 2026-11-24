import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../shared/theme/colors';
import HeroHeader from '../components/HeroHeader';
import LoginForm from '../components/LoginForm';
import RegisterPacienteForm from '../components/RegisterPacienteForm';

const ABAS = [
  { id: 'entrar', label: 'Entrar', icone: 'log-in' },
  { id: 'cadastrar', label: 'Cadastrar', icone: 'user-plus' },
];

export default function AuthScreen() {
  const [aba, setAba] = useState('entrar');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  function handleSucessoCadastro() {
    setMensagemSucesso('Conta de Paciente criada com sucesso! Entre com seu e-mail e senha.');
    setAba('entrar');
  }

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <HeroHeader compact={aba === 'cadastrar'} />

          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />

            <View style={styles.segmentedTrack}>
              {ABAS.map((item) => {
                const ativa = aba === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() => setAba(item.id)}
                    style={[styles.segmentButton, ativa && styles.segmentButtonActive]}
                  >
                    <Feather name={item.icone} size={15} color={ativa ? colors.primary : colors.textMuted} />
                    <Text style={[styles.segmentText, ativa && styles.segmentTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {aba === 'entrar' ? (
              <LoginForm
                mensagemSucesso={mensagemSucesso}
                onLimparSucesso={() => setMensagemSucesso('')}
                onIrParaCadastro={() => setAba('cadastrar')}
              />
            ) : (
              <RegisterPacienteForm
                onVoltar={() => setAba('entrar')}
                onSuccess={handleSucessoCadastro}
              />
            )}

            <Text style={styles.footerText}>ProntoVital — cuidado conectado em um só lugar.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const TOP_INSET = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) + 6 : 48;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.brandDark, paddingTop: TOP_INSET },
  flexOne: { flex: 1 },
  scrollView: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { flexGrow: 1, backgroundColor: colors.brandDark },
  sheetContainer: { flexGrow: 1, backgroundColor: colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40 },
  sheetHandle: { width: 38, height: 4, borderRadius: 999, backgroundColor: colors.borderLight, alignSelf: 'center', marginBottom: 16 },
  segmentedTrack: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 4, marginBottom: 20 },
  segmentButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: 11 },
  segmentButtonActive: { backgroundColor: colors.surface, elevation: 2 },
  segmentText: { fontSize: 14.5, fontWeight: '600', color: colors.textMuted, marginLeft: 7 },
  segmentTextActive: { color: colors.textPrimary, fontWeight: '800' },
  footerText: { textAlign: 'center', fontSize: 12, color: colors.textPlaceholder, marginTop: 28 },
});

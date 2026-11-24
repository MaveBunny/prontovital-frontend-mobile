import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Button from './src/components/shared/Button';
import AuthScreen from './src/features/auth/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/shared/context/AuthContext';
import { colors } from './src/shared/theme/colors';

function RootNavigator() {
  const { autenticado, inicializando, usuario, logout } = useAuth();

  if (inicializando) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.brandAccent} />
      </View>
    );
  }

  if (!autenticado) {
    return <AuthScreen />;
  }

  const perfil = String(usuario?.perfil || usuario?.tipo || 'paciente').toUpperCase();

  return (
    <View style={styles.homeSafe}>
      <View style={styles.homeHeader}>
        <Text style={styles.homeBrand}>
          Pronto<Text style={styles.homeBrandBlue}>Vital</Text>
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{perfil}</Text>
        </View>
      </View>

      <View style={styles.homeBody}>
        <View style={styles.welcomeCard}>
          <Feather name="check-circle" size={36} color={colors.success} />
          <Text style={styles.welcomeTitle}>Olá, {usuario?.nome || 'Usuário'}!</Text>
          <Text style={styles.welcomeEmail}>{usuario?.email}</Text>
          <Button variant="secondary" onPress={logout}>Sair da conta</Button>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor={colors.brandDark} />
      <RootNavigator />
    </AuthProvider>
  );
}

const TOP_INSET = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) + 8 : 48;

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: colors.brandDark, alignItems: 'center', justifyContent: 'center' },
  homeSafe: { flex: 1, backgroundColor: colors.brandDark, paddingTop: TOP_INSET },
  homeHeader: { paddingHorizontal: 24, paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeBrand: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  homeBrandBlue: { color: colors.brandAccent },
  roleBadge: { backgroundColor: 'rgba(96, 165, 250, 0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  roleBadgeText: { color: '#93C5FD', fontSize: 11, fontWeight: '800' },
  homeBody: { flex: 1, backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, justifyContent: 'center' },
  welcomeCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight },
  welcomeTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 12 },
  welcomeEmail: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
});

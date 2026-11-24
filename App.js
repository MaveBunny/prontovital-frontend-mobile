import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppHeader from './src/components/shared/AppHeader';
import AdminLayout from './src/features/admin/components/AdminLayout';
import AuthScreen from './src/features/auth/screens/AuthScreen';
import ClinicasScreen from './src/screens/ClinicasScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfissionaisScreen from './src/screens/ProfissionaisScreen';
import { AuthProvider, useAuth } from './src/shared/context/AuthContext';
import { colors } from './src/shared/theme/colors';

function TelaEmConstrucao({ titulo, telaAtiva, navegarPara }) {
  return (
    <View style={styles.container}>
      <AppHeader telaAtiva={telaAtiva} onNavigate={navegarPara} />
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderTitle}>{titulo}</Text>
        <Text style={styles.placeholderSubtitle}>
          Esta tela será integrada nas próximas tasks.
        </Text>
      </View>
    </View>
  );
}

function PacienteNavigator() {
  const { logout } = useAuth();
  const [telaAtiva, setTelaAtiva] = useState('Inicio');
  const [parametrosRota, setParametrosRota] = useState({});

  const navegarPara = (nomeTela, params = {}) => {
    setParametrosRota(params);
    setTelaAtiva(nomeTela);
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (telaAtiva !== 'Inicio') {
        navegarPara('Inicio');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [telaAtiva]);

  const navigation = {
    navigate: (nomeTela, params) => navegarPara(nomeTela, params),
    goBack: () => navegarPara('Inicio'),
  };

  const telas = {
    Inicio: <HomeScreen navigation={navigation} />,
    Clinicas: (
      <ClinicasScreen
        navigation={navigation}
        onNavigateToProfissionais={(params) => navegarPara('Profissionais', params)}
        onLogout={logout}
      />
    ),
    Profissionais: (
      <ProfissionaisScreen
        navigation={navigation}
        filtroInicialClinica={parametrosRota?.clinicaNome || ''}
        route={{ params: parametrosRota }}
        onVoltar={() => navegarPara('Inicio')}
      />
    ),
    Agendamentos: (
      <TelaEmConstrucao titulo="Meus Agendamentos" telaAtiva="Agendamentos" navegarPara={navegarPara} />
    ),
    HistoricoTriagens: (
      <TelaEmConstrucao titulo="Histórico de Triagens" telaAtiva="HistoricoTriagens" navegarPara={navegarPara} />
    ),
    Perfil: (
      <TelaEmConstrucao titulo="Meu Perfil" telaAtiva="Perfil" navegarPara={navegarPara} />
    ),
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {telas[telaAtiva] || telas.Inicio}
    </View>
  );
}

function RootNavigator() {
  const { autenticado, inicializando, usuario } = useAuth();

  if (inicializando) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar style="light" backgroundColor={colors.brandDark} />
        <ActivityIndicator size="large" color={colors.brandAccent} />
      </View>
    );
  }

  if (!autenticado) {
    return (
      <>
        <StatusBar style="light" backgroundColor={colors.brandDark} />
        <AuthScreen />
      </>
    );
  }

  if (usuario?.perfil === 'admin') {
    return (
      <>
        <StatusBar style="light" backgroundColor="#2563EB" />
        <AdminLayout />
      </>
    );
  }

  return <PacienteNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceInput },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  placeholderTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  placeholderSubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});

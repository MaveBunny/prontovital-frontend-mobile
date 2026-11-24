import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AuthScreen from './src/features/auth/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/shared/context/AuthContext';
import { colors } from './src/shared/theme/colors';
import ClinicasScreen from './src/screens/ClinicasScreen';
import ProfissionaisScreen from './src/screens/ProfissionaisScreen';

function RootNavigator() {
  const { autenticado, inicializando, logout } = useAuth();
  const [telaAtiva, setTelaAtiva] = useState('Clinicas');
  const [parametrosRota, setParametrosRota] = useState({});

  const navegarPara = (nomeTela, params = {}) => {
    setParametrosRota(params);
    setTelaAtiva(nomeTela);
  };

  useEffect(() => {
    if (!autenticado) {
      setTelaAtiva('Clinicas');
      setParametrosRota({});
    }
  }, [autenticado]);

  if (inicializando) {
    return (
      <>
        <StatusBar style="light" backgroundColor={colors.brandDark} />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={colors.brandAccent} />
        </View>
      </>
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

  const navigation = {
    navigate: (nomeTela, params) => navegarPara(nomeTela, params),
    goBack: () => navegarPara('Clinicas'),
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {telaAtiva === 'Clinicas' ? (
        <ClinicasScreen
          navigation={navigation}
          onNavigateToProfissionais={(params) =>
            navegarPara('Profissionais', params)
          }
          onLogout={logout}
        />
      ) : (
        <ProfissionaisScreen
          navigation={navigation}
          filtroInicialClinica={parametrosRota?.clinicaNome || ''}
          route={{ params: parametrosRota }}
          onVoltar={() => navegarPara('Clinicas')}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingScreen: { flex: 1, backgroundColor: colors.brandDark, alignItems: 'center', justifyContent: 'center' },
});

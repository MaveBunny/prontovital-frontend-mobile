import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ClinicasScreen from './src/screens/ClinicasScreen';
import ProfissionaisScreen from './src/screens/ProfissionaisScreen';

/**
 * Ponto de entrada do aplicativo ProntoVital Mobile.
 * Gerencia a navegação entre Clínicas e Profissionais com passagem de parâmetros.
 */
export default function App() {
  const [telaAtiva, setTelaAtiva] = useState('Clinicas');
  const [parametrosRota, setParametrosRota] = useState({});

  const navegarPara = (nomeTela, params = {}) => {
    setParametrosRota(params);
    setTelaAtiva(nomeTela);
  };

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});

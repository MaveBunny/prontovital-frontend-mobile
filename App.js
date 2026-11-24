import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AuthScreen from "./src/features/auth/screens/AuthScreen";
import { AuthProvider, useAuth } from "./src/shared/context/AuthContext";
import { colors } from "./src/shared/theme/colors";
import HomeScreen from "./src/screens/HomeScreen";
import ClinicasScreen from "./src/screens/ClinicasScreen";
import ProfissionaisScreen from "./src/screens/ProfissionaisScreen";
import AppHeader from "./src/components/shared/AppHeader";
import { SafeAreaProvider } from "react-native-safe-area-context";
import PerfilScreen from "./src/screens/PerfilScreen";

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

function RootNavigator() {
  const { autenticado, inicializando, logout } = useAuth();
  const [telaAtiva, setTelaAtiva] = useState("Inicio");
  const [parametrosRota, setParametrosRota] = useState({});

  const navegarPara = (nomeTela, params = {}) => {
    setParametrosRota(params);
    setTelaAtiva(nomeTela);
  };

  useEffect(() => {
    if (!autenticado) {
      setTelaAtiva("Inicio");
      setParametrosRota({});
    }
  }, [autenticado]);

  // Faz o botão físico "Voltar" do Android retornar para o Início em vez de fechar o app
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (autenticado && telaAtiva !== "Inicio") {
          navegarPara("Inicio");
          return true;
        }
        return false;
      },
    );
    return () => subscription.remove();
  }, [autenticado, telaAtiva]);

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
    goBack: () => navegarPara("Inicio"),
  };

  const renderizarTela = () => {
    switch (telaAtiva) {
      case "Inicio":
        return <HomeScreen navigation={navigation} />;

      case "Clinicas":
        return (
          <ClinicasScreen
            navigation={navigation}
            onNavigateToProfissionais={(params) =>
              navegarPara("Profissionais", params)
            }
            onLogout={logout}
          />
        );

      case "Profissionais":
        return (
          <ProfissionaisScreen
            navigation={navigation}
            filtroInicialClinica={parametrosRota?.clinicaNome || ""}
            route={{ params: parametrosRota }}
            onVoltar={() => navegarPara("Inicio")}
          />
        );

      case "Agendamentos":
        return (
          <TelaEmConstrucao
            titulo="Meus Agendamentos"
            telaAtiva="Agendamentos"
            navegarPara={navegarPara}
          />
        );

      case "HistoricoTriagens":
        return (
          <TelaEmConstrucao
            titulo="Histórico de Triagens"
            telaAtiva="HistoricoTriagens"
            navegarPara={navegarPara}
          />
        );

      case "Perfil":
        return <PerfilScreen navigation={navigation} />;

      default:
        return <HomeScreen navigation={navigation} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      {renderizarTela()}
    </View>
  );
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
  container: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.brandDark,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});

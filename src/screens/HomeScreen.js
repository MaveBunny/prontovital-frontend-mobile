import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../components/shared/AppHeader";
import { useAuth } from "../shared/context/AuthContext";
import { colors } from "../shared/theme/colors";

const QUICK_ACTIONS = [
  {
    key: "Clinicas",
    label: "Clínicas",
    icon: "home-outline",
  },
  {
    key: "Profissionais",
    label: "Profissionais",
    icon: "people-outline",
  },
  {
    key: "Agendamentos",
    label: "Agendamentos",
    icon: "calendar-outline",
  },
  {
    key: "HistoricoTriagens",
    label: "Hist. Triagens",
    icon: "list-outline",
  },
];

export default function HomeScreen({ navigation }) {
  const { usuario } = useAuth();
  const primeiroNome = usuario?.nome?.split(" ")[0] || "Usuário";

  return (
    <View style={styles.container}>
      <AppHeader
        telaAtiva="Inicio"
        onNavigate={(rota) => navigation.navigate(rota)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>Olá, {primeiroNome}</Text>
          <Text style={styles.greetingSubtitle}>
            Acesse rapidamente seus serviços.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>ACESSO RÁPIDO</Text>

        <View style={styles.cardsContainer}>
          {QUICK_ACTIONS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(item.key)}
            >
              <View style={styles.iconBox}>
                <Ionicons name={item.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.cardLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceInput,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
  },
  greetingBlock: {
    marginBottom: 28,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPlaceholder,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  cardsContainer: {
    gap: 14,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});

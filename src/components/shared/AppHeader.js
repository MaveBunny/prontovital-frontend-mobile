import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../shared/context/AuthContext";
import { colors } from "../../shared/theme/colors";

const MENU_ITEMS = [
  { key: "Inicio", label: "Início", icon: "home-outline" },
  {
    key: "AdminAgendamentos",
    label: "Agendamentos",
    icon: "calendar-outline",
    adminOnly: true,
  },
  { key: "Clinicas", label: "Clínicas", icon: "business-outline" },
  { key: "Profissionais", label: "Profissionais", icon: "people-outline" },
  {
    key: "Agendamentos",
    label: "Meus Agendamentos",
    icon: "calendar-outline",
    pacienteOnly: true,
  },
  {
    key: "HistoricoTriagens",
    label: "Histórico de Triagens",
    icon: "list-outline",
    pacienteOnly: true,
  },
  {
    key: "Perfil",
    label: "Meu Perfil",
    icon: "person-outline",
    pacienteOnly: true,
  },
];

const CLINICA_MENU_ITEMS = [
  { key: "ClinicaVisaoGeral", label: "Visão Geral", icon: "home-outline" },
  { key: "ClinicaAgenda", label: "Agenda / Calendário", icon: "calendar-outline" },
  { key: "ClinicaAgendamentos", label: "Agendamentos", icon: "list-outline" },
  { key: "ClinicaMedicos", label: "Médicos", icon: "people-outline" },
  { key: "ClinicaDisponibilidade", label: "Disponibilidade", icon: "time-outline" },
  { key: "ClinicaPerfil", label: "Perfil da Clínica", icon: "business-outline" },
];

const PROFISSIONAL_MENU_ITEMS = [
  { key: "ProfissionalAgenda", label: "Agenda", icon: "calendar-outline" },
  { key: "ProfissionalAgendamentos", label: "Agendamentos", icon: "list-outline" },
  { key: "ProfissionalPerfil", label: "Meu Perfil", icon: "person-outline" },
];

export default function AppHeader({ telaAtiva, onNavigate }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { usuario, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const perfil = String(usuario?.perfil || usuario?.tipo || '').trim().toLowerCase();
  const isAdmin = perfil === 'admin';
  const isClinica = perfil === 'clinica';
  const isProfissional = perfil === 'profissional';
  const itensMenu = isClinica
    ? CLINICA_MENU_ITEMS
    : isProfissional
      ? PROFISSIONAL_MENU_ITEMS
      : MENU_ITEMS.filter(
          (item) =>
            (!item.adminOnly || isAdmin) &&
            (!item.pacienteOnly || !isAdmin)
        );

  const nomeExibicao = usuario?.nome || "Usuário";
  const inicial = nomeExibicao.charAt(0).toUpperCase();

  const handleSelecionarAba = (chaveTela) => {
    setMenuAberto(false);
    onNavigate?.(chaveTela);
  };

  const handleSair = async () => {
    setMenuAberto(false);
    await logout();
  };

  return (
    <>
      <View style={[styles.safeHeader, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.brandContainer}
            activeOpacity={0.7}
            onPress={() => handleSelecionarAba("Inicio")}
          >
            <Image
              source={require("../../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>
              Pronto<Text style={styles.brandHighlight}>Vital</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuAberto(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={28} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAberto(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMenuAberto(false)}
        >
          <Pressable
            style={[styles.drawerPanel, { paddingTop: insets.top }]}
            onPress={() => {}}
          >
            {/* Topo do Menu */}
            <View style={styles.drawerHeader}>
              <View style={styles.brandContainer}>
                <Image
                  source={require("../../../assets/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.brandText}>
                  Pronto<Text style={styles.brandHighlight}>Vital</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMenuAberto(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Perfil do Usuário */}
            <View style={styles.userSection}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{inicial}</Text>
              </View>
              <Text style={styles.userName} numberOfLines={1}>
                {nomeExibicao}
              </Text>
            </View>

            {/* Lista de Abas */}
            <View style={styles.navList}>
              {itensMenu.map((item) => {
                const ativo = telaAtiva === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.navItem, ativo && styles.navItemActive]}
                    onPress={() => handleSelecionarAba(item.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={ativo ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[styles.navLabel, ativo && styles.navLabelActive]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Botão Sair */}
              <TouchableOpacity
                style={styles.logoutItem}
                onPress={handleSair}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={colors.error}
                />
                <Text style={styles.logoutLabel}>Sair</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeHeader: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  header: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandHighlight: {
    color: colors.primary,
  },
  menuButton: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  drawerPanel: {
    backgroundColor: colors.background,
    paddingBottom: 24,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  drawerHeader: {
    height: 60,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  navList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 14,
  },
  navItemActive: {
    backgroundColor: colors.primarySoft,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  logoutItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    borderRadius: 10,
    gap: 14,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.error,
  },
});

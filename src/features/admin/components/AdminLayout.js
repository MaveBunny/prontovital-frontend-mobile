import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../../shared/context/AuthContext';
import { colors } from '../../../shared/theme/colors';
import AdminAgendamentosScreen from '../screens/AdminAgendamentosScreen';
import AdminClinicasScreen from '../screens/AdminClinicasScreen';
import AdminProfissionaisScreen from '../screens/AdminProfissionaisScreen';

const MENU_ITEMS = [
  { id: 'profissionais', label: 'Profissionais', icon: 'users' },
  { id: 'clinicas', label: 'Clínicas', icon: 'home' },
  { id: 'agendamentos', label: 'Agendamentos', icon: 'calendar' },
];

export default function AdminLayout({ onVoltarPaciente }) {
  const { usuario, logout } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState('profissionais');
  const [menuAberto, setMenuAberto] = useState(false);

  const nomeAdmin = usuario?.nome || 'Admin';
  const iniciais = nomeAdmin.slice(0, 2).toUpperCase();

  function selecionarAba(id) {
    setAbaAtiva(id);
    setMenuAberto(false);
  }

  return (
    <View style={styles.root}>
      <View style={styles.topStatusBar} />

      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>
            Pronto<Text style={styles.brandBlue}>Vital</Text>
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setMenuAberto(true)}
          style={styles.menuBtn}
        >
          <Feather name="menu" size={24} color="#334155" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {abaAtiva === 'profissionais' && <AdminProfissionaisScreen />}
        {abaAtiva === 'clinicas' && <AdminClinicasScreen />}
        {abaAtiva === 'agendamentos' && <AdminAgendamentosScreen />}
      </View>

      <Modal
        visible={menuAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuAberto(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <View>
              <View style={styles.drawerProfile}>
                <View style={styles.avatarPurple}>
                  <Text style={styles.avatarPurpleText}>{iniciais}</Text>
                </View>
                <Text style={styles.drawerUserName} numberOfLines={1}>
                  {nomeAdmin}
                </Text>
              </View>

              <View style={styles.navList}>
                {MENU_ITEMS.map((item) => {
                  const ativo = abaAtiva === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.75}
                      onPress={() => selecionarAba(item.id)}
                      style={[styles.navItem, ativo && styles.navItemActive]}
                    >
                      {ativo ? <View style={styles.activeBar} /> : null}
                      <Feather
                        name={item.icon}
                        size={19}
                        color={ativo ? colors.primary : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.navLabel,
                          ativo && styles.navLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {onVoltarPaciente ? (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => {
                      setMenuAberto(false);
                      onVoltarPaciente();
                    }}
                    style={styles.navItem}
                  >
                    <Feather name="arrow-left-circle" size={19} color="#64748B" />
                    <Text style={styles.navLabel}>Início (Paciente)</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.drawerFooter}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setMenuAberto(false);
                  logout();
                }}
                style={styles.logoutBtn}
              >
                <Feather name="log-out" size={18} color="#64748B" />
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Pressable
            style={styles.backdropArea}
            onPress={() => setMenuAberto(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const TOP_BAR_HEIGHT =
  Platform.OS === 'android' ? RNStatusBar.currentHeight || 28 : 44;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  topStatusBar: { height: TOP_BAR_HEIGHT, backgroundColor: '#2563EB' },
  header: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 32, height: 32, borderRadius: 8, marginRight: 10 },
  brandText: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  brandBlue: { color: '#2563EB' },
  menuBtn: { padding: 6 },
  content: { flex: 1 },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  drawer: {
    width: '74%',
    maxWidth: 290,
    backgroundColor: '#FFFFFF',
    paddingTop: TOP_BAR_HEIGHT + 16,
    justifyContent: 'space-between',
  },
  backdropArea: { flex: 1 },
  drawerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarPurple: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarPurpleText: { fontSize: 14, fontWeight: '800', color: '#9333EA' },
  drawerUserName: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1 },
  navList: { padding: 14 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
    position: 'relative',
  },
  navItemActive: { backgroundColor: '#EFF6FF' },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3.5,
    backgroundColor: '#2563EB',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  navLabel: { fontSize: 15, fontWeight: '600', color: '#64748B', marginLeft: 14 },
  navLabelActive: { color: '#1D4ED8', fontWeight: '700' },
  drawerFooter: {
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: { flexDirection: 'row', alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#64748B', marginLeft: 10 },
});

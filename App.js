import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AdminLayout from './src/features/admin/components/AdminLayout';
import AuthScreen from './src/features/auth/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/shared/context/AuthContext';
import { colors } from './src/shared/theme/colors';

function RootNavigator() {
  const { autenticado, inicializando } = useAuth();

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

  return <AdminLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#2563EB" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

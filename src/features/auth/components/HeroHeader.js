import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../../shared/theme/colors';

const PILARES = [
  { id: 'triagem', icon: 'cpu', texto: 'Pré-triagem com IA' },
  { id: 'agendamento', icon: 'calendar', texto: 'Consultas online' },
  { id: 'rede', icon: 'shield', texto: 'Rede de especialistas' },
];

export default function HeroHeader({ compact = false }) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.brandRow}>
        <View style={styles.logoWrapper}>
          <Image source={require('../../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View>
          <Text style={styles.brandTitle}>
            Pronto<Text style={styles.brandAccent}>Vital</Text>
          </Text>
          <Text style={styles.brandSubtitle}>Plataforma de Saúde Digital</Text>
        </View>
      </View>

      <Text style={[styles.headline, compact && styles.headlineCompact]}>
        Do primeiro sintoma ao atendimento.
      </Text>

      {!compact && (
        <>
          <Text style={styles.description}>
            Faça sua pré-triagem em casa, organize seus sintomas com apoio da IA e agende sua consulta de forma simples e rápida.
          </Text>
          <View style={styles.chipsRow}>
            {PILARES.map((item) => (
              <View key={item.id} style={styles.chip}>
                <Feather name={item.icon} size={13} color={colors.brandAccent} />
                <Text style={styles.chipText}>{item.texto}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.brandDark, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24 },
  containerCompact: { paddingBottom: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  logoWrapper: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#FFFFFF', padding: 4, marginRight: 12 },
  logo: { width: '100%', height: '100%' },
  brandTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  brandAccent: { color: colors.brandAccent },
  brandSubtitle: { fontSize: 12, color: '#94A3B8' },
  headline: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', lineHeight: 28 },
  headlineCompact: { fontSize: 18, lineHeight: 24 },
  description: { fontSize: 13.5, color: '#CBD5E1', lineHeight: 20, marginTop: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 6 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#F1F5F9', marginLeft: 6 },
});

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/**
 * Card de Clínica seguindo o layout oficial do ProntoVital (Figma).
 *
 * @param {Object} props
 * @param {Object} props.clinica - Dados da clínica retornados pela API
 * @param {number} props.totalProfissionais - Quantidade real de profissionais vinculados
 * @param {string[]} [props.especialidades] - Lista de especialidades reais dos profissionais da clínica
 * @param {Function} props.onVerProfissionais - Callback de navegação
 */
export default function ClinicaCard({
  clinica,
  totalProfissionais = 0,
  especialidades = [],
  onVerProfissionais,
}) {
  const nomeClinica = clinica.User?.nome || "Clínica";
  const bairro = clinica.bairro || "";
  const endereco = clinica.User?.endereco || "";
  const telefone = clinica.User?.telefone || "";

  let localizacao = "";
  if (bairro && endereco) {
    localizacao = `${bairro} — ${endereco}`;
  } else if (bairro) {
    localizacao = bairro;
  } else if (endereco) {
    localizacao = endereco;
  }

  const listaEspecialidades =
    Array.isArray(especialidades) && especialidades.length > 0
      ? especialidades
      : clinica.especialidade
        ? [clinica.especialidade]
        : [];

  const labelProfissionais =
    totalProfissionais === 1
      ? "1 profissional"
      : `${totalProfissionais} profissionais`;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onVerProfissionais && onVerProfissionais(clinica)}
      accessibilityRole="button"
      accessibilityLabel={`Ver profissionais da clínica ${nomeClinica}`}
    >
      {/* Bloco Superior: Avatar + Nome, Endereço e Badges */}
      <View style={styles.headerRow}>
        <View style={styles.avatarContainer}>
          <Ionicons name="home-outline" size={24} color="#2563EB" />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.nomeClinica} numberOfLines={2}>
            {nomeClinica}
          </Text>
          {localizacao ? (
            <Text style={styles.enderecoText} numberOfLines={2}>
              {localizacao}
            </Text>
          ) : null}

          {listaEspecialidades.length > 0 ? (
            <View style={styles.badgesRow}>
              {listaEspecialidades.map((esp) => (
                <View key={esp} style={styles.badgeEspecialidade}>
                  <Text style={styles.badgeText}>{esp}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Rodapé do Card: Telefone à esquerda e Link Profissionais à direita */}
      <View style={styles.footerRow}>
        <View style={styles.telefoneContainer}>
          {telefone ? (
            <Text style={styles.telefoneText}>{telefone}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.linkProfissionais}
          activeOpacity={0.7}
          onPress={() => onVerProfissionais && onVerProfissionais(clinica)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.linkProfissionaisTexto}>
            {labelProfissionais}
          </Text>
          <Ionicons name="chevron-forward" size={15} color="#2563EB" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  nomeClinica: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
    marginBottom: 3,
  },
  enderecoText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  badgeEspecialidade: {
    backgroundColor: "#E6F7F0",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0D9488",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  telefoneContainer: {
    flex: 1,
  },
  telefoneText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  linkProfissionais: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  linkProfissionaisTexto: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
});

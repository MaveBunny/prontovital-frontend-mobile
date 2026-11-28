import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mascaraTelefone } from "../../../shared/utils/masks";
import { colors } from "../../../shared/theme/colors";

function CampoPerfil({
  label,
  value,
  onChangeText,
  editable,
  placeholder,
  keyboardType,
  autoCapitalize,
  maxLength,
}) {
  return (
    <View style={styles.profileField}>
      <Text style={styles.profileFieldLabel}>{label}</Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          style={styles.profileInput}
        />
      ) : (
        <Text style={styles.profileFieldValue}>{value || "Não informado"}</Text>
      )}
    </View>
  );
}

export default function ProfissionalPerfil({
  profissional,
  perfilBasico,
  avisoPerfil,
  erroPerfil,
  sucessoPerfil,
  editandoPerfil,
  formPerfil,
  setFormPerfil,
  salvandoPerfil,
  onEditar,
  onSalvar,
  onCancelar,
}) {
  const clinicas = Array.isArray(profissional?.Clinicas)
    ? profissional.Clinicas.map((clinica) => clinica.User?.nome).filter(Boolean)
    : [];
  const registro = profissional?.registro_profissional;
  const conselho = profissional?.conselho
    ? `${profissional.conselho}${profissional.uf_registro ? `/${profissional.uf_registro}` : ""} ${registro || ""}`.trim()
    : registro || "Não informado";

  return (
    <ScrollView
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeading}>
        <Text style={styles.pageTitle}>Meu Perfil</Text>
        <Text style={styles.pageSubtitle}>
          Consulte e atualize seus dados pessoais.
        </Text>
      </View>
      {avisoPerfil ? (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{avisoPerfil}</Text>
        </View>
      ) : null}
      {erroPerfil ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{erroPerfil}</Text>
        </View>
      ) : null}
      {sucessoPerfil ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{sucessoPerfil}</Text>
        </View>
      ) : null}

      <View style={styles.profileCard}>
        <View style={styles.profileHero}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(perfilBasico.nome || "P").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileIdentity}>
            <Text style={styles.profileName}>
              {perfilBasico.nome || "Profissional"}
            </Text>
            <Text style={styles.profileSpecialty}>
              {profissional?.Especialidade?.nome
                ? `Profissional · ${profissional.Especialidade.nome}`
                : "Profissional"}
            </Text>
          </View>
        </View>
        <View style={styles.profileDivider} />
        <Text style={styles.sectionLabel}>DADOS PROFISSIONAIS</Text>
        <CampoPerfil
          label="Registro profissional"
          value={conselho}
          editable={false}
        />
        <CampoPerfil
          label="Especialidade"
          value={profissional?.Especialidade?.nome}
          editable={false}
        />
        <CampoPerfil
          label="Clínica(s)"
          value={clinicas.length ? clinicas.join(", ") : "Não informado"}
          editable={false}
        />
      </View>

      <View style={styles.profileCard}>
        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionLabel, styles.sectionLabelInline]}>
            DADOS PESSOAIS
          </Text>
          {!editandoPerfil ? (
            <TouchableOpacity
              style={styles.editPillButton}
              onPress={onEditar}
              accessibilityRole="button"
            >
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
              <Text style={styles.editPillText}>Editar perfil</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <CampoPerfil
          label="Nome completo"
          value={editandoPerfil ? formPerfil.nome : perfilBasico.nome}
          editable={editandoPerfil}
          placeholder="Seu nome completo"
          onChangeText={(nome) =>
            setFormPerfil((atual) => ({ ...atual, nome }))
          }
          autoCapitalize="words"
        />
        <CampoPerfil
          label="E-mail"
          value={editandoPerfil ? formPerfil.email : perfilBasico.email}
          editable={editandoPerfil}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={(email) =>
            setFormPerfil((atual) => ({ ...atual, email }))
          }
        />
        <CampoPerfil
          label="Telefone"
          value={
            editandoPerfil
              ? formPerfil.telefone
              : perfilBasico.telefone
                ? mascaraTelefone(perfilBasico.telefone)
                : ""
          }
          editable={editandoPerfil}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
          onChangeText={(telefone) =>
            setFormPerfil((atual) => ({
              ...atual,
              telefone: mascaraTelefone(telefone),
            }))
          }
          maxLength={15}
        />
        <CampoPerfil
          label="Endereço"
          value={editandoPerfil ? formPerfil.endereco : perfilBasico.endereco}
          editable={editandoPerfil}
          placeholder="Rua e número"
          onChangeText={(endereco) =>
            setFormPerfil((atual) => ({ ...atual, endereco }))
          }
        />
        <View style={styles.profileTwoColumns}>
          <View style={styles.profileColumn}>
            <CampoPerfil
              label="Cidade"
              value={editandoPerfil ? formPerfil.cidade : perfilBasico.cidade}
              editable={editandoPerfil}
              placeholder="Cidade"
              onChangeText={(cidade) =>
                setFormPerfil((atual) => ({ ...atual, cidade }))
              }
            />
          </View>
          <View style={styles.profileStateColumn}>
            <CampoPerfil
              label="UF"
              value={editandoPerfil ? formPerfil.estado : perfilBasico.estado}
              editable={editandoPerfil}
              placeholder="UF"
              autoCapitalize="characters"
              maxLength={2}
              onChangeText={(estado) =>
                setFormPerfil((atual) => ({ ...atual, estado }))
              }
            />
          </View>
        </View>

        {editandoPerfil ? (
          <View style={styles.profileActions}>
            <TouchableOpacity
              style={[styles.profileActionButton, styles.saveButton]}
              disabled={salvandoPerfil}
              onPress={onSalvar}
            >
              {salvandoPerfil ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Salvar alterações</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.profileActionButton, styles.cancelButton]}
              disabled={salvandoPerfil}
              onPress={onCancelar}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  pageHeading: { marginBottom: 18 },
  pageTitle: { color: colors.textPrimary, fontSize: 24, fontWeight: "800" },
  pageSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  warningBox: {
    padding: 12,
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 14,
  },
  warningText: { color: "#92400E", fontSize: 13, lineHeight: 19 },
  errorBox: {
    padding: 13,
    backgroundColor: colors.errorBg,
    borderColor: colors.errorBorder,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: { color: colors.error, fontSize: 13, lineHeight: 19 },
  successBox: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  successText: { color: colors.success, fontSize: 13, fontWeight: "600" },
  profileCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 16,
    padding: 20,
    marginBottom: 18,
  },
  profileHero: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  profileIdentity: { flex: 1 },
  profileName: { color: colors.textPrimary, fontSize: 18, fontWeight: "700" },
  profileSpecialty: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  profileDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 18,
  },
  sectionLabel: {
    color: colors.textPlaceholder,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  sectionLabelInline: { marginBottom: 0 },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  editPillButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  editPillText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  profileField: { marginBottom: 14 },
  profileFieldLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileFieldValue: { color: colors.textMuted, fontSize: 14 },
  profileInput: {
    minHeight: 46,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  profileTwoColumns: { flexDirection: "row", gap: 12 },
  profileColumn: { flex: 1 },
  profileStateColumn: { width: 76 },
  profileActions: { gap: 9, marginTop: 7 },
  profileActionButton: {
    minHeight: 45,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  saveButton: { backgroundColor: colors.primary },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  cancelButton: { borderWidth: 1, borderColor: colors.border },
  cancelButtonText: { color: colors.textMuted, fontSize: 14, fontWeight: "700" },
});

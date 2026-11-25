import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../shared/theme/colors';

export default function PickerModal({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Selecione...',
  darkSheet = false,
}) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setVisible(true)}
        style={styles.trigger}
      >
        <Text
          style={[styles.triggerText, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable
            style={[styles.sheet, darkSheet && styles.sheetDark]}
            onPress={(e) => e.stopPropagation()}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => {
                const ativo = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onChange(item.value);
                      setVisible(false);
                    }}
                    style={[
                      styles.optionRow,
                      darkSheet && styles.optionRowDark,
                      ativo && !darkSheet && styles.optionRowActive,
                    ]}
                  >
                    <View style={styles.optionTextWrap}>
                      <Text
                        style={[
                          styles.optionTitle,
                          darkSheet && styles.optionTitleDark,
                          ativo && !darkSheet && styles.optionTitleActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text
                          style={[
                            styles.optionSubtitle,
                            darkSheet && styles.optionSubtitleDark,
                          ]}
                          numberOfLines={2}
                        >
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.radioOuter,
                        ativo && styles.radioOuterActive,
                      ]}
                    >
                      {ativo ? <View style={styles.radioInner} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },
  triggerText: { fontSize: 14, color: colors.textPrimary, flex: 1, marginRight: 8 },
  placeholder: { color: colors.textPlaceholder },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    maxHeight: '72%',
    paddingVertical: 8,
    elevation: 8,
  },
  sheetDark: { backgroundColor: '#26292E' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionRowDark: { borderBottomColor: '#3A3F47' },
  optionRowActive: { backgroundColor: colors.primarySoft },
  optionTextWrap: { flex: 1, marginRight: 12 },
  optionTitle: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  optionTitleDark: { color: '#F8FAFC', fontSize: 16 },
  optionTitleActive: { color: colors.primary, fontWeight: '700' },
  optionSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  optionSubtitleDark: { color: '#94A3B8' },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: '#60A5FA' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#60A5FA' },
});

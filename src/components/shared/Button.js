import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../shared/theme/colors';

export default function Button({
  children,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  leftIcon,
  rightIcon,
  style,
}) {
  const isDisabled = loading || disabled;
  const isPrimary = variant === 'primary';
  const contentColor = isPrimary ? '#FFFFFF' : colors.textSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <Feather name={leftIcon} size={18} color={contentColor} style={styles.leftIcon} />}
          <Text style={[styles.text, { color: contentColor }]}>{children}</Text>
          {rightIcon && <Feather name={rightIcon} size={18} color={contentColor} style={styles.rightIcon} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { width: '100%', minHeight: 54, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  contentRow: { flexDirection: 'row', alignItems: 'center' },
  leftIcon: { marginRight: 8 },
  rightIcon: { marginLeft: 8 },
  primary: { backgroundColor: colors.primary, elevation: 3 },
  secondary: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.borderLight },
  disabled: { opacity: 0.6 },
  text: { fontSize: 15.5, fontWeight: '700' },
});

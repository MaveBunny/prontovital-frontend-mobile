import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../shared/theme/colors';

export default function Input({
  label,
  labelRight,
  leftIcon,
  rightIcon,
  onRightIconPress,
  multiline = false,
  ...props
}) {
  return (
    <View style={styles.container}>
      {(label || labelRight) && (
        <View style={styles.labelRow}>
          {label ? <Text style={styles.label}>{label}</Text> : null}
          {labelRight}
        </View>
      )}

      <View style={styles.boxContainer}>
        <TextInput
          placeholderTextColor={colors.textPlaceholder}
          multiline={multiline}
          autoComplete="off"
          textContentType="oneTimeCode"
          autoCorrect={false}
          spellCheck={false}
          underlineColorAndroid="transparent"
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
          ]}
          {...props}
        />

        {leftIcon && (
          <View style={styles.leftIcon} pointerEvents="none">
            <Feather name={leftIcon} size={18} color={colors.primary} />
          </View>
        )}

        {rightIcon && (
          <TouchableOpacity activeOpacity={0.6} onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather name={rightIcon} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  boxContainer: { width: '100%', position: 'relative', justifyContent: 'center' },
  input: { width: '100%', height: 54, backgroundColor: colors.surfaceInput, borderWidth: 1.5, borderColor: colors.borderLight, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: colors.textPrimary },
  inputWithLeftIcon: { paddingLeft: 44 },
  inputWithRightIcon: { paddingRight: 46 },
  inputMultiline: { height: 90, textAlignVertical: 'top', paddingTop: 14 },
  leftIcon: { position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center' },
  rightIcon: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 44, justifyContent: 'center', alignItems: 'center' },
});

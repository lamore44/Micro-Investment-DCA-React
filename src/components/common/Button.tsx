import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Radius } from '../../theme';

type Variant = 'primary' | 'outlined' | 'ghost' | 'chip' | 'chipActive';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  small?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  small = false,
}) => {
  const containerStyle: ViewStyle[] = [
    styles.base,
    small && styles.small,
    variant === 'primary'    ? styles.primary    : null,
    variant === 'outlined'   ? styles.outlined   : null,
    variant === 'ghost'      ? styles.ghost      : null,
    variant === 'chip'       ? styles.chip       : null,
    variant === 'chipActive' ? styles.chipActive : null,
    disabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyle: TextStyle[] = [
    styles.label,
    small && styles.labelSmall,
    variant === 'primary'    ? styles.labelPrimary    : null,
    variant === 'outlined'   ? styles.labelOutlined   : null,
    variant === 'ghost'      ? styles.labelGhost      : null,
    variant === 'chip'       ? styles.labelChip       : null,
    variant === 'chipActive' ? styles.labelChipActive : null,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <Text style={labelStyle} numberOfLines={1}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: Colors.purple,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.purple,
  },
  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  chip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipActive: {
    backgroundColor: Colors.purpleDim,
    borderWidth: 1,
    borderColor: Colors.purple,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.white,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  labelSmall: {
    fontSize: 13,
  },
  labelPrimary:    { color: Colors.white },
  labelOutlined:   { color: Colors.purple },
  labelGhost:      { color: Colors.purple },
  labelChip:       { color: Colors.muted, fontSize: 13, fontWeight: '600' },
  labelChipActive: { color: Colors.purple, fontSize: 13, fontWeight: '700' },
});

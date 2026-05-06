import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  prefix?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
}

export const TextInput: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  prefix,
  isPassword = false,
  leftIcon,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputFocused,
          error  && styles.inputError,
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        {prefix   ? <Text style={styles.prefix}>{prefix}</Text>     : null}
        <RNTextInput
          style={styles.input}
          placeholderTextColor={Colors.muted}
          selectionColor={Colors.purple}
          secureTextEntry={isPassword && !showPw}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPw(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputFocused: {
    borderColor: Colors.purple,
  },
  inputError: {
    borderColor: Colors.red,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  prefix: {
    ...Typography.body,
    color: Colors.muted,
    marginRight: 4,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    padding: 0,
  },
  eyeBtn: {
    paddingLeft: Spacing.sm,
  },
  eyeIcon: {
    fontSize: 16,
  },
  error: {
    ...Typography.caption,
    color: Colors.red,
    marginTop: 4,
    letterSpacing: 0,
    textTransform: 'none',
    fontSize: 12,
  },
});

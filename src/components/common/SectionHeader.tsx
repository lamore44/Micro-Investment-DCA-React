import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Typography, Spacing } from '../../theme';
import { Button } from './Button';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.row, style]}>
    <Text style={styles.title}>{title}</Text>
    {actionLabel && onAction ? (
      <Button
        label={actionLabel}
        onPress={onAction}
        variant="primary"
        small
        style={styles.btn}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h2,
  },
  btn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
});

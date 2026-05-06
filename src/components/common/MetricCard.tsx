import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  icon?: string;
  style?: ViewStyle;
  flex?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sub,
  valueColor,
  icon,
  style,
  flex,
}) => (
  <View style={[styles.card, flex !== undefined && { flex }, style]}>
    <Text style={styles.label} numberOfLines={1}>
      {icon ? `${icon}  ` : ''}{label}
    </Text>
    <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>
      {value}
    </Text>
    {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    minWidth: 100,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
    color: Colors.muted,
    fontSize: 10,
  },
  value: {
    ...Typography.valueBig,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  sub: {
    ...Typography.caption,
    marginTop: 4,
    color: Colors.muted,
    fontSize: 10,
  },
});
